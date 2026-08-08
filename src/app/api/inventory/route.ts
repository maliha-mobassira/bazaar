import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db";
import { inventory, products } from "@/db/schema";
import { requireRole } from "@/lib/requireRole";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant" }, { status: 400 });
    }

    const result = await withTenant(tenantId, async (db) => {
      return db
        .select({
          id: inventory.id,
          tenantId: inventory.tenantId,
          productId: inventory.productId,
          quantity: inventory.quantity,
          name: products.name,
          sku: products.sku,
          image: products.image,
          category: products.category,
          createdAt: inventory.createdAt,
        })
        .from(inventory)
        .leftJoin(products, eq(inventory.productId, products.id));
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const roleCheck = requireRole(req, ["admin", "manager"]);
    if (roleCheck) return roleCheck;

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

export async function PUT(req: NextRequest) {
  try {
    const roleCheck = requireRole(req, ["admin", "manager"]);
    if (roleCheck) return roleCheck;

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
        .update(inventory)
        .set({ quantity })
        .where(eq(inventory.productId, productId))
        .returning();
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
