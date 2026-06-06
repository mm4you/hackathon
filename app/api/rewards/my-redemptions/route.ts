import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const redemptions = await prisma.rewardRedemption.findMany({
      where: user.role === "DRIVER" ? { userId: user.id } : undefined,
      select: {
        id: true,
        pointsUsed: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        reward: { select: { id: true, title: true, description: true, type: true, pointsRequired: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return jsonData(redemptions);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Redemptions API failed", error);
    return jsonError("Không tải được lịch sử đổi ưu đãi", 500);
  }
}
