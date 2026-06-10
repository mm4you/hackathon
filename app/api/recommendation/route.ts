import { isSameOriginRequest, jsonData, jsonError, readJsonObject, stringField } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { cached } from "@/lib/dataCache";
import { buildAiDecisionAdvisor } from "@/lib/llmAdvisor";
import { getContextPressure, getPortTrafficContext, type PortTrafficContext } from "@/lib/portTrafficContext";
import { prisma } from "@/lib/prisma";
import { recommendTimeSlots, type CongestionLevel, type OptimizationPreference, type SlotInput } from "@/lib/schedulingEngine";

const preferences = new Set(["FASTEST", "LOW_CONGESTION", "ECO"]);
const SLOT_STARTS = [
  0, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
  14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
];
const SLOT_DURATION_MINUTES = 60;

type ExistingSlot = {
  id: string;
  startTime: Date;
  capacity: number;
  bookedCount: number;
  updatedAt: Date;
};

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) return jsonError("Yêu cầu không hợp lệ", 403);

    const user = await requireUser();
    if (user.role !== "DRIVER") return jsonError("Chỉ tài xế mới được lấy gợi ý đặt lịch", 403);

    const body = await readJsonObject(request);
    if (!body) return jsonError("Body không hợp lệ", 400);

    const portId = stringField(body, "portId");
    const preferredTimeValue = stringField(body, "preferredTime");
    const optimizationPreference = stringField(body, "optimizationPreference");
    if (!portId || !preferences.has(optimizationPreference)) return jsonError("Thiếu cảng hoặc mục tiêu tối ưu", 400);

    const timezoneOffsetMinutes = numberField(body, "timezoneOffsetMinutes");
    const preferredTime = parseLocalDateTime(preferredTimeValue, timezoneOffsetMinutes);
    if (Number.isNaN(preferredTime.getTime())) return jsonError("Thời gian mong muốn không hợp lệ", 400);

    const cacheKey = `recommendation:${user.id}:${portId}:${preferredTime.toISOString()}:${optimizationPreference}`;
    const recommendationPayload = await cached(cacheKey, 30_000, async () => {
      const port = await prisma.port.findFirst({ where: { id: portId, isActive: true }, select: { id: true, name: true, latitude: true, longitude: true } });
      if (!port) throw new RecommendationError("PORT_NOT_FOUND");

      const localParts = parseLocalDateTimeParts(preferredTimeValue);
      if (!localParts) throw new RecommendationError("INVALID_TIME");
      const dayStart = localDateTimeToDate(localParts.year, localParts.month, localParts.day, 0, 0, timezoneOffsetMinutes);
      const dayEnd = localDateTimeToDate(localParts.year, localParts.month, localParts.day + 1, 0, 0, timezoneOffsetMinutes);

      const existingDaySlots = await prisma.timeSlot.findMany({ where: { portId, startTime: { gte: dayStart, lt: dayEnd } }, select: { capacity: true, bookedCount: true } }) as { capacity: number; bookedCount: number }[];
      const averageUtilizationRate = existingDaySlots.length ? existingDaySlots.reduce((sum, slot) => sum + (slot.capacity ? slot.bookedCount / slot.capacity : 1), 0) / existingDaySlots.length : 0.45;
      const portTrafficContext = await getPortTrafficContext({
        portName: String(port.name),
        latitude: typeof port.latitude === "number" ? port.latitude : null,
        longitude: typeof port.longitude === "number" ? port.longitude : null,
        targetTime: preferredTime,
        averageUtilizationRate,
      });

      await syncSlotsForDay(portId, localParts, timezoneOffsetMinutes, portTrafficContext);

      const slots = (await prisma.timeSlot.findMany({
        where: { portId, startTime: { gte: dayStart, lt: dayEnd } },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          capacity: true,
          bookedCount: true,
          congestionLevel: true,
          estimatedWaitMinutes: true,
          greenBonus: true,
          port: { select: { id: true, name: true } },
        },
        orderBy: { startTime: "asc" },
      })) as SlotInput[];

      const advisorContext = { portName: String(port.name), preferredTime, optimizationPreference: optimizationPreference as OptimizationPreference, portTrafficContext };
      const recommendations = recommendTimeSlots(slots, optimizationPreference as OptimizationPreference, 12, preferredTime);
      if (!recommendations.length) return { recommendations: [], message: "Không còn slot khả dụng trong ngày đã chọn" };
      const aiDecision = await buildAiDecisionAdvisor(recommendations, advisorContext);

      return { port, preferredTime: preferredTime.toISOString(), optimizationPreference, portTrafficContext, aiDecision, recommendations };
    });

    return jsonData(recommendationPayload);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    if (error instanceof RecommendationError && error.code === "PORT_NOT_FOUND") return jsonError("Không tìm thấy cảng đang hoạt động", 404);
    if (error instanceof RecommendationError && error.code === "INVALID_TIME") return jsonError("Thời gian mong muốn không hợp lệ", 400);
    console.error("Recommendation API failed", error);
    return jsonError("Không tạo được gợi ý khung giờ", 500);
  }
}

class RecommendationError extends Error {
  constructor(public code: "PORT_NOT_FOUND" | "INVALID_TIME") {
    super(code);
  }
}

async function syncSlotsForDay(portId: string, localParts: LocalDateTimeParts, timezoneOffsetMinutes: number, context: PortTrafficContext) {
  const dayStart = localDateTimeToDate(localParts.year, localParts.month, localParts.day, 0, 0, timezoneOffsetMinutes);
  const dayEnd = localDateTimeToDate(localParts.year, localParts.month, localParts.day + 1, 0, 0, timezoneOffsetMinutes);

  const existingSlots = await prisma.timeSlot.findMany({
    where: { portId, startTime: { gte: dayStart, lt: dayEnd } },
    select: { id: true, startTime: true, capacity: true, bookedCount: true, updatedAt: true },
  }) as ExistingSlot[];

  const existingStartTimes = new Set(existingSlots.map((slot) => new Date(slot.startTime).getTime()));
  const missingSlots = buildDesiredSlots(localParts, timezoneOffsetMinutes, portId, context).filter((slot) => !existingStartTimes.has(slot.startTime.getTime()));
  if (missingSlots.length) await prisma.timeSlot.createMany({ data: missingSlots, skipDuplicates: true });

  if (existingSlots.length) {
    const recentlySynced = existingSlots.every((slot) => Date.now() - new Date(slot.updatedAt).getTime() < 5 * 60 * 1000);
    if (recentlySynced) return;

    await Promise.all(existingSlots.map((slot) => {
      const profile = buildRealtimeSlotProfile(slot.startTime, slot.capacity, slot.bookedCount, false, context);
      return prisma.timeSlot.update({
        where: { id: slot.id },
        data: {
          congestionLevel: profile.congestionLevel,
          estimatedWaitMinutes: profile.estimatedWaitMinutes,
          greenBonus: profile.greenBonus,
        },
      });
    }));
    return;
  }

  if (!missingSlots.length) await prisma.timeSlot.createMany({ data: buildDesiredSlots(localParts, timezoneOffsetMinutes, portId, context), skipDuplicates: true });
}

function buildDesiredSlots(localParts: LocalDateTimeParts, timezoneOffsetMinutes: number, portId: string, context: PortTrafficContext) {
  return SLOT_STARTS.map((hour) => {
    const startTime = localDateTimeToDate(localParts.year, localParts.month, localParts.day, hour, 0, timezoneOffsetMinutes);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + SLOT_DURATION_MINUTES);
    const capacity = capacityForHour(hour);
    const profile = buildRealtimeSlotProfile(startTime, capacity, 0, true, context);
    return {
      portId,
      startTime,
      endTime,
      capacity,
      bookedCount: profile.initialBookedCount,
      congestionLevel: profile.congestionLevel,
      estimatedWaitMinutes: profile.estimatedWaitMinutes,
      greenBonus: profile.greenBonus,
    };
  });
}

type LocalDateTimeParts = { year: number; month: number; day: number; hour: number; minute: number };

function numberField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseLocalDateTime(value: string, timezoneOffsetMinutes: number) {
  const parts = parseLocalDateTimeParts(value);
  if (!parts) return new Date(Number.NaN);
  return localDateTimeToDate(parts.year, parts.month, parts.day, parts.hour, parts.minute, timezoneOffsetMinutes);
}

function parseLocalDateTimeParts(value: string): LocalDateTimeParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return { year: Number(year), month: Number(month), day: Number(day), hour: Number(hour), minute: Number(minute) };
}

function localDateTimeToDate(year: number, month: number, day: number, hour: number, minute: number, timezoneOffsetMinutes: number) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0) + timezoneOffsetMinutes * 60000);
}

function capacityForHour(hour: number) {
  if (hour <= 8 || hour >= 18) return 18;
  if (hour >= 15 && hour <= 17) return 20;
  return 24;
}

function buildRealtimeSlotProfile(startTime: Date, capacity: number, bookedCount: number, includeSyntheticDemand: boolean, context: PortTrafficContext) {
  const now = new Date();
  const hour = startTime.getHours();
  const minutesUntilSlot = Math.round((startTime.getTime() - now.getTime()) / 60000);
  const rushHourPressure = hour <= 9 ? 0.7 : hour <= 15 ? 0.38 : 0.16;
  const nearSlotPressure = minutesUntilSlot >= 0 && minutesUntilSlot <= 180 ? 0.18 : 0;
  const pastSlotPressure = minutesUntilSlot < -120 ? 0.08 : 0;
  const syntheticBookedCount = includeSyntheticDemand ? Math.round(capacity * Math.min(0.82, rushHourPressure + nearSlotPressure)) : bookedCount;
  const effectiveBookedCount = includeSyntheticDemand ? syntheticBookedCount : bookedCount;
  const utilization = capacity > 0 ? effectiveBookedCount / capacity : 1;
  const pressure = Math.min(1, utilization + rushHourPressure * 0.45 + nearSlotPressure + pastSlotPressure + getContextPressure(context));
  const congestionLevel: CongestionLevel = pressure >= 0.76 ? "HIGH" : pressure >= 0.48 ? "MEDIUM" : "LOW";
  const estimatedWaitMinutes = congestionLevel === "HIGH" ? Math.round(38 + pressure * 18) : congestionLevel === "MEDIUM" ? Math.round(18 + pressure * 18) : Math.round(8 + pressure * 12);
  const greenBonus = congestionLevel === "LOW" ? 60 : congestionLevel === "MEDIUM" ? 28 : 8;

  return { congestionLevel, estimatedWaitMinutes, greenBonus, initialBookedCount: syntheticBookedCount };
}
