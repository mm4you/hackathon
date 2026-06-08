import { createVoucherToken } from "@/lib/checkInToken";
import { isSameOriginRequest, jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RedemptionTokenRecord = { id: string; status: string };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOriginRequest(request)) return jsonError("Yêu cầu không hợp lệ", 403);

    const user = await requireUser();
    const { id } = await context.params;
    const redemption = await prisma.rewardRedemption.findFirst({
      where: user.role === "DRIVER" ? { id, userId: user.id } : { id },
      select: { id: true, status: true },
    }) as RedemptionTokenRecord | null;
    if (!redemption) return jsonError("Không tìm thấy voucher", 404);
    if (redemption.status !== "APPROVED") return jsonError("Voucher chưa được duyệt hoặc không còn hiệu lực", 400);

    return jsonData({ token: createVoucherToken(redemption.id), expiresInSeconds: 60 * 60 * 24 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Create voucher token failed", error);
    return jsonError("Không tạo được QR voucher", 500);
  }
}
