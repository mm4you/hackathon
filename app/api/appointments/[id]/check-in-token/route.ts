import { createCheckInToken } from "@/lib/checkInToken";
import { isSameOriginRequest, jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AppointmentTokenRecord = { id: string; status: string };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOriginRequest(request)) return jsonError("Yêu cầu không hợp lệ", 403);

    const user = await requireUser();
    const { id } = await context.params;
    const appointment = await prisma.appointment.findFirst({
      where: user.role === "DRIVER" ? { id, driverId: user.id } : { id },
      select: { id: true, status: true },
    }) as AppointmentTokenRecord | null;
    if (!appointment) return jsonError("Không tìm thấy lịch hẹn", 404);
    if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") return jsonError("Lịch đã đóng", 400);

    return jsonData({ token: createCheckInToken(appointment.id), expiresInSeconds: 60 * 60 * 4 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Create check-in token failed", error);
    return jsonError("Không tạo được mã QR", 500);
  }
}
