import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Run ALTER TABLE statements directly on the database
    await db.execute(sql`
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount numeric(10, 2) DEFAULT '0.00' NOT NULL;
    `);

    await db.execute(sql`
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name text;
    `);

    await db.execute(sql`
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone text;
    `);

    return NextResponse.json({
      success: true,
      message: "Database schema migration executed successfully via raw SQL.",
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
