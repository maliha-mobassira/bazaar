import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Select all unique categories from products table bypassing RLS (since this is process DB handle, not withTenant)
    const result = await db
      .select({
        category: products.category,
        count: sql<number>`count(*)::int`,
      })
      .from(products)
      .groupBy(products.category);

    return NextResponse.json({
      success: true,
      categories: result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
