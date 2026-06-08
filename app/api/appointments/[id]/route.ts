import { isSameOriginRequest, jsonData, jsonError, readJsonObject, stringField } from "@/lib/api";
import { requireOperatorOrAdmin } from "@/lib/auth";
import { invalidateCache } from "@/lib/dataCache";
import { prisma } from "@/lib/prisma";

const statuses = new Set(["PENDING", "COMING", "COMPLETED", "LATE", "CANCELLED"]);
const closedStatuses = new Set(["COMPLETED", "CANCELLED"]);

const appointmentSelect = {
  id: true,
  status: true,
  preferredTime: true,
  optimizationPreference: true,
  recommendationReason: true,
  estimatedWaitMinutes: true,
  greenCreditEarned: true,
  co2SavedKg: true,
  creditAwarded: true,
  createdAt: true,
  driver: { select: { id: true, name: true, email: true, greenPoints: true } },
  vehicle: { select: { id: true, plateNumber: true, vehicleType: true } },
  port: { select: { id: true, name: true, address: true } },
  timeSlot: { select: { id: true, startTime: true, endTime: true, congestionLevel: true, capacity: true, bookedCount: true } },
};

type AppointmentRecord = {
  id: string;
  driverId: string;
  timeSlotId: string;
  status: string;
  creditAwarded: boolean;
  greenCreditEarned: number;
  vehicle?: { plateNumber?: string };
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOriginRequest(request)) return jsonError("Yêu cầu không hợp lệ", 403);

    const user = await requireOperatorOrAdmin();
    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) return jsonError("Body không hợp lệ", 400);

    const nextStatus = stringField(body, "status");
    if (!statuses.has(nextStatus)) return jsonError("Trạng thái không hợp lệ", 400);

    const updated = await prisma.$transaction(async (tx) => {
      const appointment = (await tx.appointment.findUnique({
        where: { id },
        select: { id: true, driverId: true, timeSlotId: true, status: true, creditAwarded: true, greenCreditEarned: true, vehicle: { select: { plateNumber: true } } },
      })) as AppointmentRecord | null;

      if (!appointment) throw new StatusError("NOT_FOUND");
      if (closedStatuses.has(appointment.status) && appointment.status !== nextStatus) throw new StatusError("CLOSED");

      const statusUpdate = await tx.appointment.updateMany({ where: { id, status: appointment.status }, data: { status: nextStatus } });
      if (statusUpdate.count !== 1) throw new StatusError("STALE");

      if (nextStatus === "COMPLETED" && !appointment.creditAwarded) {
        const creditClaim = await tx.appointment.updateMany({ where: { id, creditAwarded: false }, data: { creditAwarded: true } });
        if (creditClaim.count === 1) {
          await tx.user.update({ where: { id: appointment.driverId }, data: { greenPoints: { increment: appointment.greenCreditEarned } } });
          await tx.greenCredit.create({ data: { userId: appointment.driverId, appointmentId: appointment.id, points: appointment.greenCreditEarned, reason: "Hoàn thành lịch hẹn đúng quy trình, giảm thời gian chờ và góp phần giảm CO2." } });
        }
      }

      if (nextStatus === "CANCELLED" && appointment.status !== "CANCELLED") {
        await tx.timeSlot.updateMany({ where: { id: appointment.timeSlotId, bookedCount: { gt: 0 } }, data: { bookedCount: { decrement: 1 } } });
      }

      await tx.activityLog.create({ data: { actorId: user.id, type: "APPOINTMENT", message: `${user.name} cập nhật lịch xe ${appointment.vehicle?.plateNumber ?? "container"} sang ${nextStatus}` } });
      return tx.appointment.findUnique({ where: { id }, select: appointmentSelect });
    });

    invalidateCache("appointments:", "reports:", "greenCredits:", "recommendation:");
    return jsonData(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    if (error instanceof Error && error.message === "FORBIDDEN") return jsonError("Không có quyền cập nhật lịch hẹn", 403);
    if (error instanceof StatusError) return statusErrorResponse(error.code);
    console.error("Update appointment API failed", error);
    return jsonError("Không cập nhật được lịch hẹn", 500);
  }
}

class StatusError extends Error {
  constructor(public code: "NOT_FOUND" | "CLOSED" | "STALE") {
    super(code);
  }
}

function statusErrorResponse(code: StatusError["code"]) {
  if (code === "NOT_FOUND") return jsonError("Không tìm thấy lịch hẹn", 404);
  if (code === "STALE") return jsonError("Lịch hẹn vừa được cập nhật, vui lòng tải lại dữ liệu", 409);
  return jsonError("Lịch đã đóng, không thể đổi sang trạng thái khác", 400);
}
