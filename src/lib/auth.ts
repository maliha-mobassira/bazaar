import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: string;
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AuthPayload;
  } catch {
    return null;
  }
}
