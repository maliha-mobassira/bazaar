import { NextRequest, NextResponse } from "next/server";
import { db, ensureTablesExist } from "@/lib/db";
import { users } from "@/db/schema/user";
import { tenants } from "@/db/schema/tenant";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "";
  const password = req.nextUrl.searchParams.get("password") || "";

  const steps: Record<string, any> = {};

  // Step 1: DB connection
  try {
    await ensureTablesExist();
    steps["1_db_connection"] = "OK";
  } catch (e: any) {
    steps["1_db_connection"] = `FAILED: ${e.message}`;
    return NextResponse.json({ steps }, { status: 500 });
  }

  // Step 2: List all users
  try {
    const allUsers = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users);
    steps["2_all_users"] = allUsers;
  } catch (e: any) {
    steps["2_all_users"] = `FAILED: ${e.message}`;
  }

  if (!email) {
    return NextResponse.json({ steps, hint: "Add ?email=xxx&password=yyy to test login" });
  }

  // Step 3: Find user
  let foundUser: any = null;
  try {
    const cleanEmail = email.toLowerCase().trim();
    foundUser = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
    });
    steps["3_user_found"] = foundUser
      ? { id: foundUser.id, email: foundUser.email, role: foundUser.role, hasHash: !!foundUser.passwordHash }
      : "NOT FOUND";
  } catch (e: any) {
    steps["3_user_found"] = `FAILED: ${e.message}`;
  }

  if (!foundUser) {
    return NextResponse.json({ steps });
  }

  // Step 4: Check password
  if (password) {
    try {
      const valid = await bcrypt.compare(password, foundUser.passwordHash);
      steps["4_password_check"] = valid ? "VALID ✅" : "INVALID ❌";
    } catch (e: any) {
      steps["4_password_check"] = `FAILED: ${e.message}`;
    }
  }

  return NextResponse.json({ steps });
}

// POST: create a quick test user
export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create a tenant first
    const [tenant] = await db
      .insert(tenants)
      .values({ name: "Test Store" })
      .returning();

    const [user] = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "admin",
      })
      .returning({ id: users.id, email: users.email, role: users.role });

    return NextResponse.json({ success: true, user, tenant });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
