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
app/                 Next.js App Router pages va API routes dang active
components/          Product UI components va shadcn/ui foundation
lib/                 Prisma, auth, scheduling engine, AI advisor, utilities
prisma/              PostgreSQL schema, migrations, demo seed
docs/rebuild-notes/  Notes theo module va demo script
```

## Checklist Release

- `npm run lint` pass.
- `npm run build` pass.
- `npm run prisma:validate` pass.
- `npm run prisma:migrate:deploy` chay thanh cong tren production/staging.
- Auth, booking transaction, completed credit va rewards redeem da test thu cong.
- Khong co secret trong git.
- Co backup database truoc migration/deploy.
