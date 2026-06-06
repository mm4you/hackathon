import { jsonData, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const vehicles = await prisma.vehicle.findMany({
      where: user.role === "DRIVER" ? { driverId: user.id } : undefined,
      select: {
        id: true,
        companyId: true,
        driverId: true,
        plateNumber: true,
        vehicleType: true,
        capacityNote: true,
        driver: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonData(vehicles);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Chưa đăng nhập", 401);
    console.error("Vehicles API failed", error);
    return jsonError("Không tải được danh sách xe", 500);
  }
}
