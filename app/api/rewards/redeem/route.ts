import { jsonData, jsonError, readJsonObject, stringField } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RewardRecord = { id: string; title: string; pointsRequired: number; isActive: boolean };
type UserRecord = { id: string; name: string; greenPoints: number };

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "DRIVER") return jsonError("Chỉ tài xế mới được đổi ưu đãi", 403);

    const body = await readJsonObject(request);
    if (!body) return jsonError("Body không hợp lệ", 400);

    const rewardId = stringField(body, "rewardId");
    if (!rewardId) return jsonError("Thiếu mã ưu đãi", 400);

    const redemption = await prisma.$transaction(async (tx) => {
      const freshUser = (await tx.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, greenPoints: true } })) as UserRecord | null;
      const reward = (await tx.reward.findUnique({ where: { id: rewardId }, select: { id: true, title: true, pointsRequired: true, isActive: true } })) as RewardRecord | null;
      if (!freshUser || !reward || !reward.isActive) throw new RedeemError("INVALID_REWARD");
      if (freshUser.greenPoints < reward.pointsRequired) throw new RedeemError("NOT_ENOUGH_POINTS");

      await tx.user.update({ where: { id: user.id }, data: { greenPoints: { decrement: reward.pointsRequired } } });
      const created = await tx.rewardRedemption.create({
        data: { userId: user.id, rewardId: reward.id, pointsUsed: reward.pointsRequired },
        select: { id: true, pointsUsed: true, status: true, createdAt: true, reward: { select: { id: true, title: true, description: true, type: true, pointsRequired: true } } },
      });
      await tx.activityLog.create({ data: { actorId: user.id, type: "REWARD", message: `${freshUser.name} đổi ưu đãi ${reward.title}` } });
      return created;
    });

    return jsonData(redemption, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    if (error instanceof RedeemError) return redeemErrorResponse(error.code);
    console.error("Redeem reward API failed", error);
    return jsonError("Không đổi được ưu đãi", 500);
  }
}

class RedeemError extends Error {
  constructor(public code: "INVALID_REWARD" | "NOT_ENOUGH_POINTS") {
    super(code);
  }
}

function redeemErrorResponse(code: RedeemError["code"]) {
  if (code === "INVALID_REWARD") return jsonError("Ưu đãi không hợp lệ hoặc đã ngừng hoạt động", 404);
  return jsonError("Không đủ điểm xanh để đổi ưu đãi", 400);
}
