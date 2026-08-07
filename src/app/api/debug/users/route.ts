import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";

export async function GET() {
  try {
    // Fetch all users to count and review details
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        tenantId: users.tenantId,
      })
      .from(users);

    return NextResponse.json({
      success: true,
      users: allUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
