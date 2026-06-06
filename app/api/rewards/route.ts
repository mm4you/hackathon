import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireUser();
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      select: { id: true, title: true, description: true, pointsRequired: true, type: true, isActive: true, createdAt: true },
      orderBy: { pointsRequired: "asc" },
    });
    return jsonData(rewards);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Rewards API failed", error);
    return jsonError("Không tải được danh sách ưu đãi", 500);
  }
}
