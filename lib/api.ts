import { NextResponse } from "next/server";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "OPERATOR" | "DRIVER";
  greenPoints: number;
  companyId?: string | null;
};

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: noStoreHeaders() });
}

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status, headers: noStoreHeaders() });
}

export function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}

export async function readJsonObject(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

export function stringField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

export function limitedStringField(body: Record<string, unknown>, key: string, maxLength: number) {
  const value = stringField(body, key);
  return value.length > maxLength ? "" : value;
}

export function publicUser(user: Record<string, unknown>): PublicUser {
  return {
    id: String(user.id),
    name: String(user.name),
    email: String(user.email),
    role: user.role === "ADMIN" || user.role === "OPERATOR" ? user.role : "DRIVER",
    greenPoints: Number(user.greenPoints ?? 0),
    companyId: typeof user.companyId === "string" ? user.companyId : null,
  };
}

export function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isPlateNumber(value: string) {
  return /^[A-Z0-9.-]{5,20}$/.test(value);
}

export function isStrongEnoughPassword(value: string) {
  return value.length >= 8 && value.length <= 72;
}

export function isPrismaUniqueError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}
