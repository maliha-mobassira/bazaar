import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db, ensureTablesExist } from "@/lib/db";
import { tenants, users } from "@/db/schema";

export async function POST(request: Request) {
  try {
    await ensureTablesExist();
    const body = await request.json();
    console.log("BODY RECEIVED:", body);
    const { tenantName, businessName, email, password } = body;
    const resolvedTenantName = tenantName || businessName;

    // Simple validation
    if (!resolvedTenantName || !email || !password) {
      console.log("VALIDATION FAILED", { resolvedTenantName, email, password });
      return NextResponse.json(
        { error: "Missing required fields: tenantName (or businessName), email, password" },
        { status: 400 }
      );
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Execute database operations in a transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create the tenant
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          name: resolvedTenantName,
        })
        .returning();

      // 2. Create the admin user for the tenant
      const [newUser] = await tx
        .insert(users)
        .values({
          tenantId: newTenant.id,
          email: email.toLowerCase().trim(),
          passwordHash,
          role: "admin",
        })
        .returning({
          id: users.id,
          tenantId: users.tenantId,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        });

      return {
        tenant: newTenant,
        user: newUser,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Onboarding error:", error);

    // Check for unique constraint violation on email
    if (error.code === "23505" || error.message?.includes("unique constraint")) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong during onboarding" },
      { status: 500 }
    );
  }
}
