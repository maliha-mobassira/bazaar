import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema/user";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
    try {
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

        const token = jwt.sign(
            {
                userId: user.id,
                tenantId: user.tenantId,
                role: user.role,
                email: user.email,
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1d" }
        );

        return NextResponse.json({ token });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Login failed" },
            { status: 500 }
        );
    }
}