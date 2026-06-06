# Module 11 Production Readiness

Trang thai: hoan thanh dot 1.

## Da lam

- Cap nhat `README.md` sang huong PostgreSQL production, deploy, backup/restore va release checklist.
- Mo rong `.env.example` voi `ALLOW_DEMO_SEED` va ghi chu seed demo/staging.
- Them scripts Prisma production trong `package.json`:
  - `prisma:generate`
  - `prisma:validate`
  - `prisma:migrate:deploy`
  - `prisma:seed`
- Chuyen seed config deprecated tu `package.json#prisma` sang `prisma.config.ts`.
- Them guard cho `prisma/seed.ts` va `v2/prisma/seed.ts`: chi cho seed local database hoac database demo/staging co `ALLOW_DEMO_SEED=true`.
- Xoa cac root API cu khong con nam trong flow v2 active:
  - `/api/dashboard/stats`
  - `/api/dashboard/recent-activities`
  - `/api/time-slots`
  - `/api/time-slots/seed`
  - `/api/rewards/[id]`

## Kiem tra

- `npm run lint` pass.
- `npx prisma validate` pass voi `prisma.config.ts`.
- `npm run build` pass.

## Con lai

- Can deploy thu len Vercel/staging PostgreSQL.
- Can tao quy trinh tao admin dau tien cho production that, khong dung demo seed khi da co data khach hang.
- Can visual QA browser/mobile tren root app.
