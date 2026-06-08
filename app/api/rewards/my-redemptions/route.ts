import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { cached } from "@/lib/dataCache";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const redemptions = await cached(`redemptions:${user.role}:${user.id}`, 5_000, () => prisma.rewardRedemption.findMany({
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
      take: 30,
    }));
    return jsonData(redemptions);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Redemptions API failed", error);
    return jsonError("Không tải được lịch sử đổi ưu đãi", 500);
  }
}
