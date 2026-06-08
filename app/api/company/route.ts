import { isSameOriginRequest, jsonData, jsonError, limitedStringField, readJsonObject } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const companySelect = {
  id: true,
  name: true,
  type: true,
  contactEmail: true,
  contactPhone: true,
  createdAt: true,
  users: { select: { id: true, name: true, email: true, role: true } },
  vehicles: { select: { id: true, plateNumber: true, vehicleType: true, driver: { select: { id: true, name: true } } } },
};

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role === "OPERATOR") return jsonError("Không có quyền xem hồ sơ công ty", 403);
    if (!user.companyId) return jsonData({ company: null, message: "Tài khoản chưa gắn với công ty" });

    const company = await prisma.company.findUnique({ where: { id: user.companyId }, select: companySelect });
    if (!company) return jsonError("Không tìm thấy công ty", 404);

    return jsonData({ company });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Company API failed", error);
    return jsonError("Không tải được thông tin công ty", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isSameOriginRequest(request)) return jsonError("Yêu cầu không hợp lệ", 403);

    const user = await requireUser();
    if (user.role !== "ADMIN") return jsonError("Chỉ quản trị viên được cập nhật công ty", 403);
    if (!user.companyId) return jsonError("Tài khoản chưa gắn với công ty", 400);

    const body = await readJsonObject(request);
    if (!body) return jsonError("Body không hợp lệ", 400);

    const name = limitedStringField(body, "name", 120);
    const contactEmail = limitedStringField(body, "contactEmail", 254);
    const contactPhone = limitedStringField(body, "contactPhone", 30);
    if (!name) return jsonError("Tên công ty không hợp lệ", 400);
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return jsonError("Email liên hệ không hợp lệ", 400);

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: { name, contactEmail: contactEmail || null, contactPhone: contactPhone || null },
      select: companySelect,
    });

    await prisma.activityLog.create({ data: { actorId: user.id, type: "COMPANY", message: `${user.name} cập nhật hồ sơ công ty ${String(company.name)}` } });
    return jsonData({ company });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Update company API failed", error);
    return jsonError("Không cập nhật được thông tin công ty", 500);
  }
}
