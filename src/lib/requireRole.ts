import { NextRequest, NextResponse } from "next/server";

export function requireRole(
  req: NextRequest,
  allowedRoles: string[]
) {
  const role = req.headers.get("x-user-role");

  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  return null;
}
