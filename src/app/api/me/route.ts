import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db";
import { users } from "@/db/schema/user";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get("x-tenant-id");
    const userId = req.headers.get("x-user-id");

    if (!tenantId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await withTenant(tenantId, async (db) => {
      return db
        .select({
          id: users.id,
          tenantId: users.tenantId,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .then((r) => r[0]);
    });

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: result,
    });
  } catch (error: any) {
    console.error("Error in GET /api/me:", error);
    return NextResponse.json({
      error: error.message || "Unknown error occurred",
    }, { status: 500 });
  }
}
