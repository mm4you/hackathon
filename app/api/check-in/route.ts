import { verifyCheckInToken } from "@/lib/checkInToken";
import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "ADMIN" && user.role !== "OPERATOR") return jsonError("Không có quyền kiểm tra QR", 403);

    const token = new URL(request.url).searchParams.get("token") ?? "";
    const payload = verifyCheckInToken(token);
    if (!payload) return jsonError("Mã QR không hợp lệ hoặc đã hết hạn", 401);

    const appointment = await prisma.appointment.findUnique({
      where: { id: payload.appointmentId },
      select: {
        id: true,
        status: true,
        driver: { select: { name: true, email: true } },
        vehicle: { select: { plateNumber: true, vehicleType: true } },
        port: { select: { name: true } },
        timeSlot: { select: { startTime: true, endTime: true, congestionLevel: true } },
      },
    });
    if (!appointment) return jsonError("Không tìm thấy lịch hẹn", 404);
    if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") return jsonError("Lịch đã đóng", 400);

    return jsonData({ appointment });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Check-in lookup failed", error);
    return jsonError("Không kiểm tra được mã QR", 500);
  }
}
