import { isSameOriginRequest, jsonData, jsonError, readJsonObject, stringField } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { cached, invalidateCache } from "@/lib/dataCache";
import { prisma } from "@/lib/prisma";
import { analyzeTimeSlot, type OptimizationPreference, type SlotInput } from "@/lib/schedulingEngine";

const preferences = new Set(["FASTEST", "LOW_CONGESTION", "ECO"]);

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

export async function GET() {
  try {
    const user = await requireUser();
    const appointments = await cached(`appointments:${user.role}:${user.id}`, 5_000, () => prisma.appointment.findMany({
      where: user.role === "DRIVER" ? { driverId: user.id } : undefined,
      select: appointmentSelect,
      orderBy: { createdAt: "desc" },
      take: 50,
    }));

    return jsonData(appointments);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Appointments API failed", error);
    return jsonError("Không tải được lịch hẹn", 500);
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) return jsonError("Yêu cầu không hợp lệ", 403);

    const user = await requireUser();
    if (user.role !== "DRIVER") return jsonError("Chỉ tài xế mới được đặt lịch", 403);

    const body = await readJsonObject(request);
    if (!body) return jsonError("Body không hợp lệ", 400);

    const vehicleId = stringField(body, "vehicleId");
    const portId = stringField(body, "portId");
    const timeSlotId = stringField(body, "timeSlotId");
    const preferredTimeValue = stringField(body, "preferredTime");
    const optimizationPreference = stringField(body, "optimizationPreference");
    if (!vehicleId || !portId || !timeSlotId || !preferences.has(optimizationPreference)) return jsonError("Thiếu thông tin đặt lịch", 400);

    const preferredTime = parseLocalDateTime(preferredTimeValue, numberField(body, "timezoneOffsetMinutes"));
    if (Number.isNaN(preferredTime.getTime())) return jsonError("Thời gian mong muốn không hợp lệ", 400);

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, driverId: user.id }, select: { id: true, plateNumber: true } });
    if (!vehicle) return jsonError("Không tìm thấy xe thuộc tài khoản hiện tại", 404);

    const appointment = await prisma.$transaction(async (tx) => {
      const slot = (await tx.timeSlot.findFirst({
        where: { id: timeSlotId, portId, port: { isActive: true } },
        select: {
          id: true,
          portId: true,
          startTime: true,
          endTime: true,
          capacity: true,
          bookedCount: true,
          congestionLevel: true,
          estimatedWaitMinutes: true,
          greenBonus: true,
          port: { select: { id: true, name: true } },
        },
      })) as SlotInput | null;
      if (!slot) throw new BookingError("SLOT_NOT_FOUND");
      if (new Date(slot.endTime).getTime() <= new Date(slot.startTime).getTime()) throw new BookingError("SLOT_INVALID");
      if (slot.bookedCount >= slot.capacity) throw new BookingError("SLOT_FULL");

      const increment = await tx.timeSlot.updateMany({ where: { id: timeSlotId, bookedCount: { lt: slot.capacity } }, data: { bookedCount: { increment: 1 } } });
      if (increment.count !== 1) throw new BookingError("SLOT_FULL");

      const recommendation = analyzeTimeSlot(slot, optimizationPreference as OptimizationPreference, preferredTime);
      const created = await tx.appointment.create({
        data: {
          driverId: user.id,
          vehicleId,
          portId,
          timeSlotId,
          preferredTime,
          optimizationPreference,
          recommendationReason: recommendation.reasons.join(" "),
          estimatedWaitMinutes: recommendation.estimatedWaitMinutes,
          greenCreditEarned: recommendation.greenCreditEarned,
          co2SavedKg: recommendation.co2SavedKg,
        },
        select: {
          ...appointmentSelect,
        },
      });

      await tx.activityLog.create({ data: { actorId: user.id, type: "BOOKING", message: `${user.name} đặt lịch cho xe ${String(vehicle.plateNumber)} tại ${slot.port?.name ?? "cảng"}` } });
      return created;
    });

    invalidateCache("appointments:", "reports:", "recommendation:");
    return jsonData(appointment, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    if (error instanceof BookingError) return bookingErrorResponse(error.code);
    console.error("Create appointment API failed", error);
    return jsonError("Không tạo được lịch hẹn", 500);
  }
}

class BookingError extends Error {
  constructor(public code: "SLOT_NOT_FOUND" | "SLOT_INVALID" | "SLOT_FULL") {
    super(code);
  }
}

function bookingErrorResponse(code: BookingError["code"]) {
  if (code === "SLOT_NOT_FOUND") return jsonError("Không tìm thấy slot phù hợp", 404);
  if (code === "SLOT_INVALID") return jsonError("Slot không hợp lệ", 400);
  return jsonError("Slot đã đầy, vui lòng chọn khung giờ khác", 409);
}

function numberField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseLocalDateTime(value: string, timezoneOffsetMinutes: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return new Date(Number.NaN);
  const [, year, month, day, hour, minute] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0, 0) + timezoneOffsetMinutes * 60000);
}
