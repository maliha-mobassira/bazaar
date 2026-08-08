import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as schema from "@/db/schema";

const isCloudDb = 
  process.env.NODE_ENV === "production" || 
  process.env.DATABASE_URL?.includes("render.com") || 
  process.env.DATABASE_URL?.includes("neon.tech") ||
  process.env.DATABASE_URL?.includes("sslmode=");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

let tablesEnsured = false;

export async function ensureTablesExist() {
  if (tablesEnsured) return;
  try {
    await db.execute(sql`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "email" text NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "role" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "sku" text NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "image" text,
        "category" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "inventory" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "quantity" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "sales" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "total_amount" numeric(10,2) NOT NULL,
        "discount_amount" numeric(10,2) DEFAULT '0.00' NOT NULL,
        "customer_name" text,
        "customer_phone" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "sale_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "sale_id" uuid NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
        "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "quantity" integer NOT NULL,
        "price_at_sale" numeric(10,2) NOT NULL
      );
    `);
    tablesEnsured = true;
  } catch (err) {
    console.error("Error ensuring database tables exist:", err);
  }
}

// ✅ helper to set tenant context
export async function withTenant<T>(
  tenantId: string,
  callback: (tx: NodePgDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    // Set PostgreSQL session variable for RLS
    await client.query(`SET app.tenant_id = '${tenantId}'`);

    const tenantDb = drizzle(client, { schema });

    return await callback(tenantDb);
  } finally {
    client.release();
  }
}