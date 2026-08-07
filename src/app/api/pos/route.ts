import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { sales } from "@/db/schema/sale";
import { saleItems } from "@/db/schema/saleItem";
import { inventory } from "@/db/schema/inventory";
import { products } from "@/db/schema/product";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const roleCheck = requireRole(req, ["admin", "cashier"]);
  if (roleCheck) return roleCheck;

  const tenantId = req.headers.get("x-tenant-id");
  const userId = req.headers.get("x-user-id");

  if (!tenantId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { items } = body; // [{ productId, quantity }]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "No items provided" },
      { status: 400 }
    );
  }

  try {
    const result = await withTenant(tenantId, async (db) => {
      return db.transaction(async (tx) => {
        let totalAmount = 0;

        // ✅ 1. Validate stock & calculate total
        for (const item of items) {
          const product = await tx
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .then((r) => r[0]);

          if (!product) {
            throw new Error("Product not found");
          }

          const stock = await tx
            .select()
            .from(inventory)
            .where(eq(inventory.productId, item.productId))
            .then((r) => r[0]);

          if (!stock) {
            throw new Error("Inventory record not found");
          }

          if (stock.quantity < item.quantity) {
            throw new Error("Insufficient stock");
          }

          totalAmount += Number(product.price) * item.quantity;
        }

        // ✅ 2. Create sale
        const [newSale] = await tx
          .insert(sales)
          .values({
            tenantId,
            userId,
            totalAmount: totalAmount.toString(),
          })
          .returning();

        // ✅ 3. Insert sale items + deduct stock
        for (const item of items) {
          const product = await tx
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .then((r) => r[0]);

          await tx.insert(saleItems).values({
            tenantId,
            saleId: newSale.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtSale: product.price,
          });

          // ✅ Correct arithmetic update
          await tx
            .update(inventory)
            .set({
              quantity: sql`${inventory.quantity} - ${item.quantity}`,
            })
            .where(eq(inventory.productId, item.productId));
        }

        return newSale;
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POS ERROR:", error); // helpful for debugging
    return NextResponse.json(
      { error: error.message || "POS failed" },
      { status: 400 }
    );
  }
}