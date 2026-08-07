import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db";
import { inventory } from "@/db/schema/inventory";

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant" }, { status: 400 });
    }

    const result = await withTenant(tenantId, async (db) => {
      return db.select().from(inventory);
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant" }, { status: 400 });
    }

    const body = await req.json();
    const { productId, quantity } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await withTenant(tenantId, async (db) => {
      return db
        .insert(inventory)
        .values({
          tenantId,
          productId,
          quantity,
        })
        .returning();
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
