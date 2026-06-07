import bcrypt from "bcryptjs";
import { isEmail, isPlateNumber, isPrismaUniqueError, isSameOriginRequest, isStrongEnoughPassword, jsonData, jsonError, limitedStringField, publicUser, readJsonObject } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { setAuthCookie, signAuthToken } from "@/lib/auth";
import { consumeRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError("Yêu cầu không hợp lệ", 403);

  const rate = consumeRateLimit(`register:${getClientIp(request)}`, 4, 60 * 60 * 1000);
  if (!rate.allowed) return jsonError(`Tạo tài khoản quá nhanh, thử lại sau ${rate.retryAfterSeconds} giây`, 429);

  const body = await readJsonObject(request);
  if (!body) return jsonError("Dữ liệu đăng ký không hợp lệ", 400);

  const name = limitedStringField(body, "name", 80);
  const email = limitedStringField(body, "email", 254).toLowerCase();
  const password = limitedStringField(body, "password", 72);
  const plateNumber = limitedStringField(body, "plateNumber", 20).toUpperCase();
  const vehicleType = limitedStringField(body, "vehicleType", 60);

  if (!name || !email || !password || !plateNumber || !vehicleType) return jsonError("Thiếu thông tin đăng ký", 400);
  if (!isEmail(email)) return jsonError("Email không hợp lệ", 400);
  if (!isStrongEnoughPassword(password)) return jsonError("Mật khẩu phải từ 8 đến 72 ký tự", 400);
  if (!isPlateNumber(plateNumber)) return jsonError("Biển số xe không hợp lệ", 400);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return jsonError("Không thể đăng ký với thông tin này", 409);

  const existingVehicle = await prisma.vehicle.findUnique({ where: { plateNumber } });
  if (existingVehicle) return jsonError("Không thể đăng ký với thông tin này", 409);

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "DRIVER",
        vehicles: { create: { plateNumber, vehicleType } },
      },
      select: { id: true, companyId: true, name: true, email: true, role: true, greenPoints: true },
    });
    const safeUser = publicUser(user);

    await prisma.activityLog.create({ data: { actorId: safeUser.id, type: "AUTH", message: `${safeUser.name} đăng ký tài khoản tài xế` } });
    await setAuthCookie(signAuthToken({ userId: safeUser.id, role: safeUser.role }));

    return jsonData(safeUser, 201);
  } catch (error) {
    if (isPrismaUniqueError(error)) return jsonError("Không thể đăng ký với thông tin này", 409);
    console.error("Register failed", error);
    return jsonError("Không thể đăng ký lúc này", 500);
  }
}
