import { NextRequest, NextResponse } from "next/server";

interface AuthPayload {
  userId: string;
  tenantId: string;
  role: string;
}

async function verifyToken(token: string, secret: string): Promise<AuthPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature using Web Crypto API (supported in Edge Runtime)
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const base64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify("HMAC", key, bytes, data);
    if (!isValid) return null;

    // Decode and check expiration
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload as AuthPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect API routes except login & onboard
  if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/login") &&
    !pathname.startsWith("/api/onboard")
  ) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET!;

    const payload = await verifyToken(token, secret);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Clone headers and inject auth context
    const requestHeaders = new Headers(req.headers);

    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-tenant-id", payload.tenantId);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
