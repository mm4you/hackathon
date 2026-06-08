import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { publicUser } from "@/lib/api";

const COOKIE_NAME = "innovatex_v2_session";
const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export type UserRole = "ADMIN" | "OPERATOR" | "DRIVER";
export type TokenPayload = { userId: string; role: UserRole };

export function signAuthToken(payload: TokenPayload) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn: AUTH_TOKEN_TTL_SECONDS });
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_TOKEN_TTL_SECONDS,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const secret = process.env.JWT_SECRET;
  if (!secret || (process.env.NODE_ENV === "production" && secret.length < 32)) return null;

  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as Partial<TokenPayload>;
    if (!isTokenPayload(decoded)) return null;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, companyId: true, name: true, email: true, role: true, greenPoints: true },
    });
    return user ? publicUser(user) : null;
  } catch {
    return null;
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  if (process.env.NODE_ENV === "production" && secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters in production");
  return secret;
}

function isTokenPayload(value: Partial<TokenPayload>): value is TokenPayload {
  return typeof value.userId === "string" && (value.role === "ADMIN" || value.role === "OPERATOR" || value.role === "DRIVER");
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

export async function requireOperatorOrAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "OPERATOR") throw new Error("FORBIDDEN");
  return user;
}
