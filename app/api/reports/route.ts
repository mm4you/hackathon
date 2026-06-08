import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { cached } from "@/lib/dataCache";
import { prisma } from "@/lib/prisma";

type Appointment = {
  id: string;
  status: "PENDING" | "COMING" | "COMPLETED" | "LATE" | "CANCELLED";
  estimatedWaitMinutes: number;
  greenCreditEarned: number;
  co2SavedKg: number;
  createdAt: string | Date;
  driver?: { id: string; name: string; email: string; greenPoints: number };
  vehicle?: { id: string; plateNumber: string; vehicleType: string };
  port?: { id: string; name: string };
  timeSlot?: { id: string; startTime: string | Date; endTime: string | Date; congestionLevel: "LOW" | "MEDIUM" | "HIGH"; capacity: number; bookedCount: number };
};

type TimeSlot = {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  capacity: number;
  bookedCount: number;
  congestionLevel: "LOW" | "MEDIUM" | "HIGH";
  estimatedWaitMinutes: number;
  greenBonus: number;
  port?: { id: string; name: string };
};

type GreenCreditPointsAggregate = { _sum?: { points?: number | null } };
type Driver = { id: string; name: string; email: string; greenPoints: number };
type Activity = { id: string; type: string; message: string; createdAt: string | Date };

const appointmentSelect = {
  id: true,
  status: true,
  estimatedWaitMinutes: true,
  greenCreditEarned: true,
  co2SavedKg: true,
  createdAt: true,
  driver: { select: { id: true, name: true, email: true, greenPoints: true } },
  vehicle: { select: { id: true, plateNumber: true, vehicleType: true } },
  port: { select: { id: true, name: true } },
  timeSlot: { select: { id: true, startTime: true, endTime: true, congestionLevel: true, capacity: true, bookedCount: true } },
};

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role === "OPERATOR") return jsonError("Chỉ quản trị viên được xem báo cáo", 403);

    const report = await cached(`reports:${user.role}:${user.id}`, 10_000, () => buildReport(user));
    return jsonData(report);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Reports API failed", error);
    return jsonError("Không tải được báo cáo", 500);
  }
}

async function buildReport(user: { id: string; role: "ADMIN" | "OPERATOR" | "DRIVER"; greenPoints: number }) {
    const isDriver = user.role === "DRIVER";
    const appointmentWhere = isDriver ? { driverId: user.id } : undefined;
    const userWhere = isDriver ? { userId: user.id } : undefined;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [appointments, greenPointsAggregate, redemptionCount, slots, drivers, activities] = await Promise.all([
      prisma.appointment.findMany({ where: appointmentWhere, select: appointmentSelect, orderBy: { createdAt: "desc" }, take: 100 }) as Promise<Appointment[]>,
      isDriver ? Promise.resolve({ _sum: { points: user.greenPoints } } as GreenCreditPointsAggregate) : prisma.greenCredit.aggregate({ _sum: { points: true } }) as Promise<GreenCreditPointsAggregate>,
      prisma.rewardRedemption.count({ where: userWhere }),
      prisma.timeSlot.findMany({
        where: { startTime: { gte: todayStart, lt: todayEnd } },
        select: { id: true, startTime: true, endTime: true, capacity: true, bookedCount: true, congestionLevel: true, estimatedWaitMinutes: true, greenBonus: true, port: { select: { id: true, name: true } } },
        orderBy: { startTime: "asc" },
      }) as Promise<TimeSlot[]>,
      isDriver ? Promise.resolve([] as Driver[]) : prisma.user.findMany({ where: { role: "DRIVER" }, select: { id: true, name: true, email: true, greenPoints: true }, orderBy: { greenPoints: "desc" }, take: 5 }) as Promise<Driver[]>,
      prisma.activityLog.findMany({ where: isDriver ? { actorId: user.id } : undefined, select: { id: true, type: true, message: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 12 }) as Promise<Activity[]>,
    ]);

    const completedAppointments = appointments.filter((item) => item.status === "COMPLETED");
    const todayAppointments = appointments.filter((item) => isSameDay(new Date(item.createdAt), todayStart));
    const averageWaitMinutes = average(appointments.map((item) => item.estimatedWaitMinutes));
    const totalCo2SavedKg = sum(appointments.map((item) => item.co2SavedKg));
    const totalGreenPointsIssued = greenPointsAggregate._sum?.points ?? 0;
    const lowSlots = slots.filter((slot) => slot.congestionLevel === "LOW").length;
    const mediumSlots = slots.filter((slot) => slot.congestionLevel === "MEDIUM").length;
    const highSlots = slots.filter((slot) => slot.congestionLevel === "HIGH").length;
    const greenSlotRate = slots.length ? Math.round((lowSlots / slots.length) * 100) : 0;
    const manualMinutesSaved = completedAppointments.length * 13;
    const waitMinutesSaved = completedAppointments.reduce((total, item) => total + Math.max(0, 50 - item.estimatedWaitMinutes), 0);
    const costSavingEstimateVnd = Math.round(waitMinutesSaved * 1200 + completedAppointments.length * 14000);

    return {
      scope: isDriver ? "DRIVER" : "OPERATIONS",
      summary: {
        todayAppointments: todayAppointments.length,
        totalAppointments: appointments.length,
        completedAppointments: completedAppointments.length,
        averageWaitMinutes: Math.round(averageWaitMinutes),
        totalCo2SavedKg: Number(totalCo2SavedKg.toFixed(1)),
        totalGreenPointsIssued: isDriver ? user.greenPoints : totalGreenPointsIssued,
        totalRedemptions: redemptionCount,
        greenSlotRate,
        manualMinutesSaved,
        gateProcessingTargetSeconds: 30,
        costSavingEstimateVnd,
      },
      congestionMix: { LOW: lowSlots, MEDIUM: mediumSlots, HIGH: highSlots, total: slots.length },
      appointmentsByStatus: buildStatusCounts(appointments),
      recentAppointments: appointments.slice(0, 6),
      recentActivities: activities.slice(0, 8),
      bestGreenSlots: [...slots].sort((a, b) => b.greenBonus - a.greenBonus || a.estimatedWaitMinutes - b.estimatedWaitMinutes).slice(0, 4),
      topDrivers: drivers.slice(0, 5),
      impactMetrics: [
        { label: "Giảm công việc thủ công", value: `${manualMinutesSaved} phút`, note: "Mục tiêu: rút ngắn xử lý giấy tờ và check-in tại cổng." },
        { label: "Cải thiện tốc độ giao hàng", value: `${Math.round(averageWaitMinutes)} phút chờ TB`, note: "Mục tiêu PM: kéo thời gian chờ về dưới 30 phút." },
        { label: "Giảm phát thải tại cổng", value: `${Number(totalCo2SavedKg.toFixed(1))} kg CO2`, note: "Giảm xe nổ máy chờ ở khu vực cảng/kho bãi." },
        { label: "Slot ít ùn tắc", value: `${greenSlotRate}% slot tốt`, note: "Phân bổ xe chủ động khỏi giờ cao điểm." },
        { label: "Chi phí vận hành tiết kiệm", value: `${costSavingEstimateVnd.toLocaleString("vi-VN")}đ`, note: "Ước tính từ giảm thời gian chờ và xử lý cổng." },
      ],
    };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function average(values: number[]) {
  return values.length ? sum(values) / values.length : 0;
}

function isSameDay(value: Date, dayStart: Date) {
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);
  return value >= dayStart && value < nextDay;
}

function buildStatusCounts(appointments: Appointment[]) {
  return ["PENDING", "COMING", "COMPLETED", "LATE", "CANCELLED"].map((status) => ({ status, count: appointments.filter((item) => item.status === status).length }));
}
