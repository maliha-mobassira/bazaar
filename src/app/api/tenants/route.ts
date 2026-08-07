import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema/tenant";

export async function POST() {
    try {
        const newTenant = await db
            .insert(tenants)
            .values({
                name: "Demo Store",
            })
            .returning();

        return NextResponse.json(newTenant);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}