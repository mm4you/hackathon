# InnovateX Smart Port

InnovateX Smart Port la web dat lich vao cang/kho bai thong minh cho logistics va port operations. MVP hien tai tap trung vao flow co the demo va ban giao: driver dat lich, GreenSlot AI goi y khung gio, admin/operator dieu phoi, completed appointment cong green credits, driver doi reward va PM/client xem dashboard/report tac dong.

## Tinh Nang Chinh

- Auth bang JWT httpOnly cookie, password hash bang `bcryptjs`, role `DRIVER`, `ADMIN`, `OPERATOR`.
- Driver quan ly xe, chon cang/khung gio va nhan goi y GreenSlot AI.
- Booking dung transaction de tao appointment va giu slot, tranh vuot capacity.
- Appointment board theo role, admin/operator cap nhat status.
- Green credits chi cong mot lan khi appointment `COMPLETED`.
- Rewards redeem dung transaction de tru diem va tao redemption.
- Dashboard/reports doc so lieu tu PostgreSQL va ke cau chuyen CXV: giam cho, giam un tac, giam CO2, tang khung gio xanh.

## Cong Nghe

- Next.js App Router
- React + TypeScript
- Tailwind CSS + shadcn/ui foundation
- Prisma ORM
- PostgreSQL
- JWT httpOnly cookie

## Cau Hinh Moi Truong

Tao file `.env` tu `.env.example`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/innovatex_smart_port?schema=public"
JWT_SECRET="replace-with-at-least-32-characters-in-production"
ALLOW_DEMO_SEED="false"
```

Yeu cau production:

- `DATABASE_URL` phai la PostgreSQL cloud/public connection string, khong dung `localhost` tren Vercel.
- `JWT_SECRET` toi thieu 32 ky tu va khong dung lai secret demo.
- Khong commit `.env` hoac secret.
- Chi set `ALLOW_DEMO_SEED=true` khi chu dong seed database demo/staging da duoc phe duyet.

## Chay Local

1. Cai dependencies:

```bash
npm install
```

2. Tao PostgreSQL database local, vi du:

```sql
CREATE DATABASE innovatex_smart_port;
```

3. Chay migration:

```bash
npx prisma migrate dev
```

4. Seed du lieu demo:

```bash
npx prisma db seed
```

5. Chay dev server:

```bash
npm run dev
```

Mo `http://localhost:3000`.

## Tai Khoan Demo

- Driver: `driver@innovatex.vn` / `123456`
- Admin: `admin@innovatex.vn` / `123456`
- Operator: `operator@innovatex.vn` / `123456`

## Deploy Production

1. Tao PostgreSQL cloud database.
2. Import project len Vercel hoac server Next.js tuong duong.
3. Cau hinh environment variables: `DATABASE_URL`, `JWT_SECRET`.
4. Chay migration production:

```bash
npm run prisma:migrate:deploy
```

5. Tao admin dau tien bang script rieng hoac seed demo co kiem soat tren database staging/demo. Khong seed production that neu da co du lieu khach hang.
6. Build va start:

```bash
npm run build
npm run start
```

## Backup Va Restore Toi Thieu

- Bat automated backup tren nha cung cap PostgreSQL cloud.
- Truoc moi lan deploy migration, tao manual backup/snapshot.
- Ghi lai thoi diem backup, migration version va nguoi thuc hien.
- Test restore tren database staging truoc khi dua vao quy trinh production.
- Khong chay `prisma db seed` tren database khach hang vi seed demo xoa va tao lai du lieu demo.

## Scripts Huu Ich

```bash
npm run dev
npm run lint
npm run build
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:deploy
npx prisma migrate dev
npx prisma db seed
```

## Cau Truc Chinh

```text
.
├── app/                              Next.js App Router
│   ├── page.tsx                      Landing page gioi thieu san pham
│   ├── layout.tsx                    Root layout, font, metadata, viewport
│   ├── globals.css                   Theme tokens, global CSS, mobile background
│   ├── login/                        Trang dang nhap
│   ├── register/                     Trang dang ky tai xe
│   ├── dashboard/                    Tong quan van hanh
│   ├── booking/                      Flow dat lich va goi y slot
│   ├── appointments/                 Bang lich hen / dieu phoi vao cong
│   ├── check-in/                     Trang hien thong tin khi quet QR vao cong
│   ├── green-credits/                Diem xanh cua tai xe
│   ├── rewards/                      Doi diem va vi uu dai
│   ├── reports/                      Bao cao tac dong van hanh
│   ├── settings/company/             Ho so cong ty/to chuc
│   └── api/                          API routes
│       ├── auth/                     Login, logout, register, me
│       ├── appointments/             Tao lich, cap nhat status, token QR
│       ├── check-in/                 API xac thuc token QR cho cong/operator
│       ├── recommendation/           GreenSlot AI recommendation
│       ├── green-credits/            Lich su diem xanh
│       ├── rewards/                  Danh sach uu dai, redeem, vi uu dai/voucher
│       ├── reports/                  Dashboard/report data
│       ├── vehicles/                 Danh sach xe theo role
│       ├── ports/                    Danh sach cang active
│       └── company/                  Ho so cong ty
├── components/                       UI product components
│   ├── DashboardLayout.tsx           Shell sau dang nhap, sidebar/mobile menu
│   ├── MobileNavMenu.tsx             Menu mobile dang bam mo popup
│   ├── DashboardOverview.tsx         Dashboard cards, lich gan day, reports quick view
│   ├── BookingFlow.tsx               Form dat lich, slot recommendation, xac nhan
│   ├── AppointmentsBoard.tsx         Lich hen, cap nhat status, QR popup
│   ├── GreenCreditsPanel.tsx         Diem xanh va lich su diem
│   ├── RewardsCatalog.tsx            Doi uu dai va vi uu dai/voucher
│   ├── ReportsView.tsx               Bao cao tac dong chi tiet
│   ├── CompanySettings.tsx           Ho so cong ty, user, fleet
│   └── ui/                           Component foundation tu shadcn-style
├── lib/                              Logic dung chung
│   ├── api.ts                        JSON response, validate field, same-origin guard
│   ├── auth.ts                       JWT cookie auth, requireUser, role guard
│   ├── prisma.ts                     Prisma client singleton
│   ├── schedulingEngine.ts           Cham diem slot, risk, diem xanh, CO2
│   ├── llmAdvisor.ts                 AI/LLM advisor voi fallback heuristic
│   ├── portTrafficContext.ts         Traffic/cang context va cache ngan
│   ├── checkInToken.ts               Tao/verify token QR co han
│   └── rateLimit.ts                  Rate limit in-memory cho auth MVP
├── prisma/                           Database layer
│   ├── schema.prisma                 Schema PostgreSQL va enum chinh
│   ├── migrations/                   Migration history
│   └── seed.ts                       Demo seed co guard moi truong
├── docs/rebuild-notes/               Ghi chu tien do, quyet dinh san pham, demo script
├── proxy.ts                          Security headers cho request
├── package.json                      Scripts va dependencies
└── README.md                         Huong dan chay, deploy, cau truc
```

Ghi chu: hien tai chua refactor thanh folder theo domain de tranh rui ro truoc demo. Neu can don dep sau, co the tach dan `components/booking`, `components/appointments`, `components/rewards`, `lib/security`, `lib/booking`.

## Checklist Release

- `npm run lint` pass.
- `npm run build` pass.
- `npm run prisma:validate` pass.
- `npm run prisma:migrate:deploy` chay thanh cong tren production/staging.
- Auth, booking transaction, completed credit va rewards redeem da test thu cong.
- Khong co secret trong git.
- Co backup database truoc migration/deploy.
