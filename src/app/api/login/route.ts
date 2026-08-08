import { NextRequest, NextResponse } from "next/server";
import { db, ensureTablesExist } from "@/lib/db";
import { users } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
    try {
        await ensureTablesExist();

        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Missing email or password" },
                { status: 400 }
            );
        }

        const cleanEmail = email.toLowerCase().trim();
        const user = await db.query.users.findFirst({
            where: eq(users.email, cleanEmail),
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const jwtSecret = process.env.JWT_SECRET || "bazaar-default-jwt-secret-key-2026";

        const token = jwt.sign(
            {
                userId: user.id,
                tenantId: user.tenantId,
                role: user.role,
                email: user.email,
            },
            jwtSecret,
            { expiresIn: "1d" }
        );

        return NextResponse.json({ token });
    } catch (error: any) {
        console.error("Login route error:", error);
        return NextResponse.json(
            { error: error?.message || "Login failed" },
            { status: 500 }
        );
    }
}