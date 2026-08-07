import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { tenants, users, products, inventory, sales, saleItems } from "@/db/schema";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Delete duplicate root page.tsx to prevent Next.js page default export compile error
    const rootPagePath = path.join(process.cwd(), "src/app/page.tsx");
    if (fs.existsSync(rootPagePath)) {
      try {
        fs.unlinkSync(rootPagePath);
        console.log("Automatically deleted duplicate root page.tsx.");
      } catch (err: any) {
        console.error("Could not delete root page.tsx:", err.message);
      }
    }

    // Hash password "securepassword123"
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash("securepassword123", saltRounds);

    const result = await db.transaction(async (tx) => {
      // 1. Delete all records in dependent tables first
      await tx.delete(saleItems);
      await tx.delete(sales);
      await tx.delete(inventory);
      await tx.delete(products);
      await tx.delete(users);
      await tx.delete(tenants);

      // 2. Insert test tenant
      const [tenant] = await tx
        .insert(tenants)
        .values({
          id: "ffc31b28-3500-4904-9042-90ffbcb47dbd",
          name: "Bazaar Retail Group",
        })
        .returning();

      // 3. Insert admin user
      const [admin] = await tx
        .insert(users)
        .values({
          id: "ca4c9c5b-0951-430e-b8d6-c275759142a5",
          tenantId: tenant.id,
          email: "admin@bazaar.com",
          passwordHash,
          role: "admin",
        })
        .returning();

      // 4. Insert cashier user
      const [cashier] = await tx
        .insert(users)
        .values({
          id: "a21f124f-e99c-4307-803e-5c4d25a54744",
          tenantId: tenant.id,
          email: "cashier@bazaar.com",
          passwordHash,
          role: "cashier",
        })
        .returning();

      // 5. Insert test product
      const [product] = await tx
        .insert(products)
        .values({
          id: "71d22837-87d0-484c-80b8-fca79641a3a9",
          tenantId: tenant.id,
          name: "Premium Blend Coffee",
          sku: "COFFEE-PREM-12",
          price: "2.99",
          category: "groceries",
          image: "https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp",
        })
        .returning();

      // 6. Insert inventory for the product
      const [stock] = await tx
        .insert(inventory)
        .values({
          id: "b44742cd-d2fb-4741-a2e7-15b752ce0d4a",
          tenantId: tenant.id,
          productId: product.id,
          quantity: 50,
        })
        .returning();

      return {
        tenant,
        users: { admin, cashier },
        product,
        stock,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Database reset & test data seeded successfully!",
      credentials: {
        admin: { email: "admin@bazaar.com", password: "securepassword123" },
        cashier: { email: "cashier@bazaar.com", password: "securepassword123" },
      },
      seeded: result,
    });
  } catch (error: any) {
    console.error("Database seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
