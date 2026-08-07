import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db";
import { products, inventory } from "@/db/schema";
import { requireRole } from "@/lib/requireRole";
import { eq, and } from "drizzle-orm";

interface DummyProduct {
  id: number;
  title: string;
  price: number;
  stock: number;
  thumbnail: string;
  category: string;
  images?: string[];
}

export async function POST(req: NextRequest) {
  // 1. Only allow in development environment
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Forbidden in production environment" },
      { status: 403 }
    );
  }

  // 2. Only allow Admin role
  const roleCheck = requireRole(req, ["admin"]);
  if (roleCheck) return roleCheck;

  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant context found" }, { status: 400 });
  }

  try {
    // 3. Fetch base products from DummyJSON
    const res = await fetch("https://dummyjson.com/products?limit=100");
    if (!res.ok) {
      throw new Error("Failed to fetch products from DummyJSON");
    }
    const data = await res.json();
    const dummyProducts: DummyProduct[] = data.products || [];

    // 4. Generate variants to get 200+ products
    // We will generate the 100 base products + 100 variants of them
    const productsToProcess: Array<{
      name: string;
      sku: string;
      price: string;
      stock: number;
      image: string;
      category: string;
    }> = [];

    dummyProducts.forEach((p) => {
      // Base Product
      const baseSku = `DUMMY-${p.id}`;
      productsToProcess.push({
        name: p.title,
        sku: baseSku,
        price: p.price.toString(),
        stock: p.stock,
        image: p.images?.[0] || p.thumbnail,
        category: p.category,
      });

      // Variant A Product (Slightly adjusted price and name)
      const variantSku = `DUMMY-${p.id}-VAR-A`;
      const adjustedPrice = (p.price * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2); // +/- 5%
      const randomStock = Math.floor(Math.random() * (200 - 10 + 1)) + 10; // 10–200

      productsToProcess.push({
        name: `${p.title} - Variant A`,
        sku: variantSku,
        price: adjustedPrice,
        stock: randomStock,
        image: p.images?.[0] || p.thumbnail,
        category: p.category,
      });
    });

    let imported = 0;
    let skipped = 0;

    // 5. Insert within a transaction using withTenant
    const result = await withTenant(tenantId, async (db) => {
      return db.transaction(async (tx) => {
        for (const item of productsToProcess) {
          // Check if product with this name already exists for this tenant
          const existingProduct = await tx
            .select()
            .from(products)
            .where(
              and(
                eq(products.tenantId, tenantId),
                eq(products.name, item.name)
              )
            )
            .then((r) => r[0]);

          if (existingProduct) {
            skipped++;
            continue;
          }

          // Insert product
          const [newProduct] = await tx
            .insert(products)
            .values({
              tenantId,
              name: item.name,
              sku: item.sku,
              price: item.price,
              image: item.image,
              category: item.category,
            })
            .returning();

          // Insert inventory record
          await tx.insert(inventory).values({
            tenantId,
            productId: newProduct.id,
            quantity: item.stock,
          });

          imported++;
        }

        return {
          imported,
          skipped,
          totalGenerated: productsToProcess.length,
        };
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Product import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
