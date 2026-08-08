import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db, ensureTablesExist } from "@/lib/db";
import { tenants, users, products, inventory, sales, saleItems } from "@/db/schema";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    await ensureTablesExist();
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
          name: "Bazaar Retail Group",
        })
        .returning();

      // 3. Insert admin user
      const [admin] = await tx
        .insert(users)
        .values({
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
          tenantId: tenant.id,
          email: "cashier@bazaar.com",
          passwordHash,
          role: "cashier",
        })
        .returning();

      // 5. Insert test products
      const productsToSeed = [
        {
          name: "Premium Blend Coffee",
          sku: "COFFEE-PREM-12",
          price: "14.99",
          category: "groceries",
          image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=60",
          quantity: 50,
        },
        {
          name: "Organic Green Tea",
          sku: "TEA-ORGA-08",
          price: "8.99",
          category: "groceries",
          image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=300&auto=format&fit=crop&q=60",
          quantity: 40,
        },
        {
          name: "Wireless Bluetooth Earbuds",
          sku: "EAR-WIRE-BT",
          price: "79.99",
          category: "electronics",
          image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=60",
          quantity: 25,
        },
        {
          name: "Minimalist Leather Wallet",
          sku: "WL-MIN-LTHR",
          price: "45.00",
          category: "accessories",
          image: "https://images.unsplash.com/photo-1627124765135-56c33fc3ae1f?w=300&auto=format&fit=crop&q=60",
          quantity: 30,
        },
        {
          name: "Stainless Steel Water Bottle",
          sku: "BT-SST-24",
          price: "24.99",
          category: "home",
          image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&auto=format&fit=crop&q=60",
          quantity: 60,
        },
        {
          name: "Hydrating Face Serum",
          sku: "SRM-HYD-50",
          price: "29.90",
          category: "beauty",
          image: "https://images.unsplash.com/photo-1608248597481-496100c80836?w=300&auto=format&fit=crop&q=60",
          quantity: 45,
        },
        {
          name: "Ergonomic Desk Chair",
          sku: "CH-ERG-DK",
          price: "189.00",
          category: "furniture",
          image: "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=300&auto=format&fit=crop&q=60",
          quantity: 10,
        },
        {
          name: "Mechanical Keyboard",
          sku: "KB-MECH-RGB",
          price: "109.99",
          category: "electronics",
          image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=60",
          quantity: 15,
        },
        {
          name: "Organic Cotton T-Shirt",
          sku: "TS-COT-ORG",
          price: "19.99",
          category: "apparel",
          image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=60",
          quantity: 80,
        },
        {
          name: "Aromatherapy Reed Diffuser",
          sku: "DF-AROMA-RD",
          price: "18.50",
          category: "home",
          image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&auto=format&fit=crop&q=60",
          quantity: 35,
        }
      ];

      const seededProducts = [];
      const seededStock = [];

      for (const p of productsToSeed) {
        const [prod] = await tx
          .insert(products)
          .values({
            tenantId: tenant.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
            category: p.category,
            image: p.image,
          })
          .returning();

        const [inv] = await tx
          .insert(inventory)
          .values({
            tenantId: tenant.id,
            productId: prod.id,
            quantity: p.quantity,
          })
          .returning();

        seededProducts.push(prod);
        seededStock.push(inv);
      }

      return {
        tenant,
        users: { admin, cashier },
        products: seededProducts,
        stock: seededStock,
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
