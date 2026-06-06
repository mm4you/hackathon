import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

type SeedDelegate<T = Record<string, unknown>> = {
  deleteMany(args?: unknown): Promise<unknown>;
  create(args: unknown): Promise<T>;
  createMany(args: unknown): Promise<unknown>;
};

type V2SeedPrisma = {
  company: SeedDelegate;
  user: SeedDelegate;
  vehicle: SeedDelegate;
  port: SeedDelegate;
  timeSlot: SeedDelegate;
  appointment: SeedDelegate;
  greenCredit: SeedDelegate;
  reward: SeedDelegate;
  rewardRedemption: SeedDelegate;
  activityLog: SeedDelegate;
  $disconnect(): Promise<void>;
};

type SeedTimeSlot = {
  id: string;
  portId: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  bookedCount: number;
  congestionLevel: "LOW" | "MEDIUM" | "HIGH";
  estimatedWaitMinutes: number;
  greenBonus: number;
};

type SeedAppointment = {
  id: string;
  greenCreditEarned: number;
};

const prisma = new PrismaClient() as unknown as V2SeedPrisma;

function assertDemoSeedAllowed() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isLocalDatabase = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
  const isExplicitlyAllowed = process.env.ALLOW_DEMO_SEED === "true";

  if (!isLocalDatabase && !isExplicitlyAllowed) {
    throw new Error("Demo seed is blocked for non-local databases. Set ALLOW_DEMO_SEED=true only for an approved demo/staging database.");
  }
}

function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

function co2SavedKg(waitMinutes: number, greenBonus: number, congestionLevel: "LOW" | "MEDIUM" | "HIGH") {
  const idleReduction = Math.max(0, 50 - waitMinutes) * 0.12;
  const congestionImpact = congestionLevel === "LOW" ? 1.4 : congestionLevel === "MEDIUM" ? 0.6 : 0;
  return Number(Math.max(0.8, idleReduction + greenBonus * 0.045 + congestionImpact).toFixed(1));
}

function greenCredit(waitMinutes: number, greenBonus: number, congestionLevel: "LOW" | "MEDIUM" | "HIGH") {
  const lowWaitBonus = Math.max(0, 35 - waitMinutes);
  const congestionBonus = congestionLevel === "LOW" ? 35 : congestionLevel === "MEDIUM" ? 16 : 0;
  return 25 + lowWaitBonus + congestionBonus + Math.round(greenBonus * 0.65);
}

async function main() {
  assertDemoSeedAllowed();

  await prisma.rewardRedemption.deleteMany();
  await prisma.greenCredit.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.port.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await bcrypt.hash("123456", 10);

  const logisticsCompany = await prisma.company.create({
    data: {
      name: "Saigon Green Logistics",
      type: "LOGISTICS",
      contactEmail: "ops@saigongreenlogistics.vn",
      contactPhone: "0900000001",
    },
  });

  const portCompany = await prisma.company.create({
    data: {
      name: "Cat Lai Smart Port Operations",
      type: "PORT_OPERATOR",
      contactEmail: "operator@catlai.vn",
      contactPhone: "0900000002",
    },
  });

  const admin = await prisma.user.create({
    data: {
      companyId: portCompany.id,
      name: "Admin InnovateX",
      email: "admin@innovatex.vn",
      passwordHash,
      role: "ADMIN",
    },
  });

  const operator = await prisma.user.create({
    data: {
      companyId: portCompany.id,
      name: "Tran Dieu Phoi",
      email: "operator@innovatex.vn",
      passwordHash,
      role: "OPERATOR",
    },
  });

  const driver = await prisma.user.create({
    data: {
      companyId: logisticsCompany.id,
      name: "Nguyen Van Minh",
      email: "driver@innovatex.vn",
      passwordHash,
      role: "DRIVER",
      phone: "0912345678",
      greenPoints: 420,
    },
  });

  const secondDriver = await prisma.user.create({
    data: {
      companyId: logisticsCompany.id,
      name: "Tran Quoc Hai",
      email: "driver2@innovatex.vn",
      passwordHash,
      role: "DRIVER",
      phone: "0987654321",
      greenPoints: 760,
    },
  });

  const [vehicleA, vehicleB] = await Promise.all([
    prisma.vehicle.create({ data: { companyId: logisticsCompany.id, driverId: driver.id, plateNumber: "51C-889.21", vehicleType: "Container 40ft", capacityNote: "Hang kho" } }),
    prisma.vehicle.create({ data: { companyId: logisticsCompany.id, driverId: secondDriver.id, plateNumber: "50H-212.09", vehicleType: "Xe tai lanh", capacityNote: "Hang lanh" } }),
  ]);

  const [catLai, hiepPhuoc] = await Promise.all([
    prisma.port.create({ data: { name: "Cang Cat Lai", address: "1295B Nguyen Thi Dinh, TP. Thu Duc, TP.HCM", latitude: 10.756, longitude: 106.788 } }),
    prisma.port.create({ data: { name: "Cang Hiep Phuoc", address: "KCN Hiep Phuoc, Nha Be, TP.HCM", latitude: 10.631, longitude: 106.751 } }),
  ]);

  const today = new Date();
  today.setMinutes(0, 0, 0);

  const slots: SeedTimeSlot[] = [];
  for (const port of [catLai, hiepPhuoc]) {
    for (const hour of [7, 9, 11, 13, 15, 17, 19]) {
      const startTime = new Date(today);
      startTime.setHours(hour, 0, 0, 0);
      const congestionLevel = hour <= 9 ? "HIGH" : hour <= 15 ? "MEDIUM" : "LOW";
      const estimatedWaitMinutes = congestionLevel === "HIGH" ? 45 : congestionLevel === "MEDIUM" ? 25 : 11;
      const greenBonus = congestionLevel === "LOW" ? 60 : congestionLevel === "MEDIUM" ? 28 : 8;

      const slot = await prisma.timeSlot.create({
        data: {
          portId: port.id,
          startTime,
          endTime: addHours(startTime, 2),
          capacity: 22,
          bookedCount: congestionLevel === "HIGH" ? 18 : congestionLevel === "MEDIUM" ? 10 : 4,
          congestionLevel,
          estimatedWaitMinutes,
          greenBonus,
        },
      }) as SeedTimeSlot;
      slots.push(slot);
    }
  }

  const ecoSlot = slots.find((slot) => slot.congestionLevel === "LOW") ?? slots[0];
  const mediumSlot = slots.find((slot) => slot.congestionLevel === "MEDIUM") ?? slots[1];

  const completedAppointment = await prisma.appointment.create({
    data: {
      driverId: driver.id,
      vehicleId: vehicleA.id,
      portId: ecoSlot.portId,
      timeSlotId: ecoSlot.id,
      status: "COMPLETED",
      preferredTime: ecoSlot.startTime,
      optimizationPreference: "ECO",
      recommendationReason: "Khung gio it un tac, thoi gian cho thap va diem xanh cao, phu hop de giam tai cong cang.",
      estimatedWaitMinutes: ecoSlot.estimatedWaitMinutes,
      greenCreditEarned: greenCredit(ecoSlot.estimatedWaitMinutes, ecoSlot.greenBonus, ecoSlot.congestionLevel),
      co2SavedKg: co2SavedKg(ecoSlot.estimatedWaitMinutes, ecoSlot.greenBonus, ecoSlot.congestionLevel),
      creditAwarded: true,
    },
  }) as SeedAppointment;

  await prisma.appointment.create({
    data: {
      driverId: secondDriver.id,
      vehicleId: vehicleB.id,
      portId: mediumSlot.portId,
      timeSlotId: mediumSlot.id,
      status: "COMING",
      preferredTime: mediumSlot.startTime,
      optimizationPreference: "LOW_CONGESTION",
      recommendationReason: "Khung gio co muc un tac vua phai va con suc chua tot hon cac slot cao diem.",
      estimatedWaitMinutes: mediumSlot.estimatedWaitMinutes,
      greenCreditEarned: greenCredit(mediumSlot.estimatedWaitMinutes, mediumSlot.greenBonus, mediumSlot.congestionLevel),
      co2SavedKg: co2SavedKg(mediumSlot.estimatedWaitMinutes, mediumSlot.greenBonus, mediumSlot.congestionLevel),
    },
  });

  await prisma.greenCredit.create({
    data: {
      userId: driver.id,
      appointmentId: completedAppointment.id,
      points: completedAppointment.greenCreditEarned,
      reason: "Hoan thanh lich hen dung quy trinh va chon khung gio giam un tac.",
    },
  });

  const rewards = await Promise.all([
    prisma.reward.create({ data: { title: "Uu tien vao cong 30 phut", description: "Uu tien xu ly tai cong cho tai xe co lich xanh va diem tich luy tot.", pointsRequired: 300, type: "PRIORITY_GATE" } }),
    prisma.reward.create({ data: { title: "Giam 5% phi boc xep", description: "Uu dai phi dich vu cho mot luot container tai cang lien ket.", pointsRequired: 450, type: "SERVICE_DISCOUNT" } }),
    prisma.reward.create({ data: { title: "Voucher nhien lieu", description: "Ho tro nhien lieu cho tai xe duy tri lich trinh dung gio va giam thoi gian cho.", pointsRequired: 900, type: "FUEL_VOUCHER" } }),
    prisma.reward.create({ data: { title: "Huy hieu Green Driver", description: "Hien thi huy hieu tai xe xanh trong ho so va bao cao doi tac.", pointsRequired: 1200, type: "GREEN_BADGE" } }),
  ]);

  await prisma.rewardRedemption.create({ data: { userId: driver.id, rewardId: rewards[0].id, pointsUsed: 300, status: "APPROVED" } });

  await prisma.activityLog.createMany({
    data: [
      { actorId: admin.id, type: "SYSTEM", message: "Khoi tao demo InnovateX Smart Port v2" },
      { actorId: driver.id, type: "BOOKING", message: `${driver.name} hoan thanh lich hen tai ${catLai.name}` },
      { actorId: operator.id, type: "OPERATIONS", message: `${operator.name} theo doi cac slot co nguy co un tac cao` },
      { actorId: driver.id, type: "REWARD", message: `${driver.name} doi uu dai ${rewards[0].title}` },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
