# Module 1 Database

Trang thai: hoan thanh va da test local voi PostgreSQL.

## Da lam

- `v2/prisma/schema.prisma` dung provider `postgresql`.
- Schema co Company, User, Vehicle, Port, TimeSlot, Appointment, GreenCredit, Reward, RewardRedemption va ActivityLog.
- Seed demo trong `v2/prisma/seed.ts` co admin, operator, driver, xe, cang, time slot, appointment, green credit, reward va activity log.
- `.env.example` da doi sang PostgreSQL connection string mau.
- PostgreSQL local da tao database `innovatex_smart_port` va role `innovatex`.
- `.env` local da doi sang PostgreSQL.
- Da chay migrate v2 thanh cong, tao migration `20260604100459_init`.
- Da chay seed v2 thanh cong.
- Root `prisma/schema.prisma` va `prisma/migrations` da dong bo sang PostgreSQL/v2 schema de khong con phu thuoc MySQL.

## Luu y

- Local dev hien dung PostgreSQL, khong con MySQL.
- Root schema da dong bo voi v2 schema, nhung UI/code root cu chi duoc sua toi thieu de build pass.

## Lenh can chay khi co PostgreSQL

- `npx prisma validate --schema v2/prisma/schema.prisma` pass.
- `npx prisma migrate dev --schema v2/prisma/schema.prisma --name init` pass.
- `npx tsx v2/prisma/seed.ts` pass.
- `npx prisma migrate status` root pass va database up to date.
