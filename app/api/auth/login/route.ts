import bcrypt from "bcryptjs";
import { isEmail, isSameOriginRequest, jsonData, jsonError, limitedStringField, publicUser, readJsonObject } from "@/lib/api";
import { setAuthCookie, signAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError("Yêu cầu không hợp lệ", 403);

  const rate = consumeRateLimit(`login:${getClientIp(request)}`, 8, 15 * 60 * 1000);
  if (!rate.allowed) return jsonError(`Thử lại sau ${rate.retryAfterSeconds} giây`, 429);

  const body = await readJsonObject(request);
  if (!body) return jsonError("Dữ liệu đăng nhập không hợp lệ", 400);

  const email = limitedStringField(body, "email", 254).toLowerCase();
  const password = limitedStringField(body, "password", 72);
  if (!email || !password) return jsonError("Email và mật khẩu là bắt buộc", 400);
  if (!isEmail(email)) return jsonError("Thông tin đăng nhập không đúng", 401);

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordHash = typeof user?.passwordHash === "string" ? user.passwordHash : "";
  if (!user || !(await bcrypt.compare(password, passwordHash))) return jsonError("Thông tin đăng nhập không đúng", 401);

  const safeUser = publicUser(user);
  await setAuthCookie(signAuthToken({ userId: safeUser.id, role: safeUser.role }));
  await prisma.activityLog.create({ data: { actorId: safeUser.id, type: "AUTH", message: `${safeUser.name} đăng nhập hệ thống` } });

  return jsonData(safeUser);
}
