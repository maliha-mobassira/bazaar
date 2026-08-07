import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db";
import { products } from "@/db/schema/product";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json({ error: "No tenant" }, { status: 400 });
  }

  const result = await withTenant(tenantId, async (db) => {
    return db.select().from(products);
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const roleCheck = requireRole(req, ["admin"]);
  if (roleCheck) return roleCheck;

  const tenantId = req.headers.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json({ error: "No tenant" }, { status: 400 });
  }

  const body = await req.json();
  const { name, sku, price } = body;

  if (!name || !sku || !price) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const result = await withTenant(tenantId, async (db) => {
    return db
      .insert(products)
      .values({
        tenantId,
        name,
        sku,
        price,
      })
      .returning();
  });

  return NextResponse.json(result);
}