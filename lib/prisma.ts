import { PrismaClient } from "@prisma/client";

type Delegate<T = Record<string, unknown>> = {
  findUnique(args: unknown): Promise<T | null>;
  findFirst(args: unknown): Promise<T | null>;
  findMany(args: unknown): Promise<T[]>;
  create(args: unknown): Promise<T>;
  update(args: unknown): Promise<T>;
  updateMany(args: unknown): Promise<{ count: number }>;
  deleteMany(args?: unknown): Promise<unknown>;
  createMany(args: unknown): Promise<unknown>;
};

type V2PrismaClient = {
  company: Delegate;
  user: Delegate;
  greenCredit: Delegate;
  reward: Delegate;
  rewardRedemption: Delegate;
  vehicle: Delegate;
  port: Delegate;
  timeSlot: Delegate;
  appointment: Delegate;
  activityLog: Delegate;
  $transaction<T>(callback: (tx: V2PrismaClient) => Promise<T>): Promise<T>;
  $disconnect(): Promise<void>;
};

const globalForPrisma = globalThis as unknown as { v2Prisma?: V2PrismaClient };

export const prisma = globalForPrisma.v2Prisma ?? (new PrismaClient() as unknown as V2PrismaClient);

if (process.env.NODE_ENV !== "production") globalForPrisma.v2Prisma = prisma;
