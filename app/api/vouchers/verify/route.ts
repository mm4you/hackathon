import { verifyVoucherToken } from "@/lib/checkInToken";
import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "ADMIN" && user.role !== "OPERATOR") return jsonError("Không có quyền kiểm tra voucher", 403);

    const token = new URL(request.url).searchParams.get("token") ?? "";
    const payload = verifyVoucherToken(token);
    if (!payload) return jsonError("Voucher không hợp lệ hoặc đã hết hạn", 401);

    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id: payload.redemptionId },
      select: {
        id: true,
        status: true,
        pointsUsed: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        reward: { select: { title: true, description: true, type: true, pointsRequired: true } },
      },
    });
    if (!redemption) return jsonError("Không tìm thấy voucher", 404);

    return jsonData({ redemption });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Verify voucher failed", error);
    return jsonError("Không kiểm tra được voucher", 500);
  }
}
