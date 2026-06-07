import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const credits = await prisma.greenCredit.findMany({
      where: user.role === "DRIVER" ? { userId: user.id } : undefined,
      select: {
        id: true,
        points: true,
        reason: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, greenPoints: true } },
        appointment: {
          select: {
            id: true,
            status: true,
            co2SavedKg: true,
            estimatedWaitMinutes: true,
            port: { select: { id: true, name: true } },
            vehicle: { select: { id: true, plateNumber: true, vehicleType: true } },
            timeSlot: { select: { id: true, startTime: true, endTime: true, congestionLevel: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    const totalIssued = credits.reduce((sum, item) => sum + Number(item.points ?? 0), 0);
    const totalCo2SavedKg = credits.reduce((sum, item) => sum + Number((item.appointment as { co2SavedKg?: number } | undefined)?.co2SavedKg ?? 0), 0);
    return jsonData({ user, credits, summary: { totalIssued, totalCo2SavedKg: Number(totalCo2SavedKg.toFixed(1)), transactionCount: credits.length } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Green credits API failed", error);
    return jsonError("Không tải được lịch sử điểm xanh", 500);
  }
}
