import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db";
import { users } from "@/db/schema/user";

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant" }, { status: 400 });
    }

    const result = await withTenant(tenantId, async (db) => {
      return db.select().from(users);
    });

    return NextResponse.json({
      users: result,
    });
  } catch (error: any) {
    console.error("Error in GET /api/me:", error);
    return NextResponse.json({
      error: error.message || "Unknown error occurred",
      stack: error.stack
    }, { status: 500 });
  }
}
