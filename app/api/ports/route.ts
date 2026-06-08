import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { cached } from "@/lib/dataCache";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireUser();
    const ports = await cached("ports:active", 60_000, () => prisma.port.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    }));

    return jsonData(ports);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Ports API failed", error);
    return jsonError("Không tải được danh sách cảng", 500);
  }
}
