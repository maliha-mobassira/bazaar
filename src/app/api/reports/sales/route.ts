import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db";
import { sales } from "@/db/schema/sale";
import { sql } from "drizzle-orm";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: NextRequest) {
  const roleCheck = requireRole(req, ["admin"]);
  if (roleCheck) return roleCheck;

  const tenantId = req.headers.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withTenant(tenantId, async (db) => {
      const allSales = await db.select().from(sales);

      const totalRevenue = await db
        .select({
          total: sql<string>`COALESCE(SUM(${sales.totalAmount}), 0)`
        })
        .from(sales);

      return {
        sales: allSales,
        totalRevenue: totalRevenue[0].total,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
