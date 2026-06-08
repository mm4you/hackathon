import { isSameOriginRequest, jsonData, jsonError, readJsonObject, stringField } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = new Set(["PENDING", "APPROVED", "REJECTED", "USED"]);

type RedemptionRecord = {
  id: string;
  pointsUsed: number;
  status: string;
  createdAt: Date;
  user: { id: string; name: string; email: string };
  reward: { id: string; title: string; description: string; type: string; pointsRequired: number };
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOriginRequest(request)) return jsonError("Yêu cầu không hợp lệ", 403);

    const user = await requireAdmin();
    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) return jsonError("Body không hợp lệ", 400);

    const status = stringField(body, "status");
    if (!statuses.has(status)) return jsonError("Trạng thái voucher không hợp lệ", 400);

    const redemption = await prisma.rewardRedemption.update({
      where: { id },
      data: { status: status as "PENDING" | "APPROVED" | "REJECTED" | "USED" },
      select: {
        id: true,
        pointsUsed: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        reward: { select: { id: true, title: true, description: true, type: true, pointsRequired: true } },
      },
    }) as RedemptionRecord;

    await prisma.activityLog.create({ data: { actorId: user.id, type: "REWARD", message: `${user.name} cập nhật voucher ${redemption.reward.title} sang ${status}` } });
    return jsonData(redemption);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    if (error instanceof Error && error.message === "FORBIDDEN") return jsonError("Chỉ quản trị viên được cập nhật voucher", 403);
    console.error("Update redemption failed", error);
    return jsonError("Không cập nhật được voucher", 500);
  }
}
