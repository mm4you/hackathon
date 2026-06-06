# Root Migration

Trang thai: hoan thanh. Source active da gom ve root, khong con phu thuoc `v2/`.

## Da lam ban dau

- Root pages chinh da re-export sang v2 pages:
  - `/login`
  - `/register`
  - `/dashboard`
  - `/booking`
  - `/appointments`
  - `/green-credits`
  - `/rewards`
  - `/reports`
  - `/settings/company`
- Root API chinh da re-export sang v2 API handlers:
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/auth/logout`
  - `/api/auth/me`
  - `/api/vehicles`
  - `/api/ports`
  - `/api/recommendation`
  - `/api/appointments`
  - `/api/appointments/[id]`
  - `/api/green-credits`
  - `/api/rewards`
  - `/api/rewards/redeem`
  - `/api/rewards/my-redemptions`
  - `/api/reports`
  - `/api/company`

## Da lam dot gom source

- Da chuyen pages/API active tu `v2/app/` ve `app/`.
- Da chuyen components active tu `v2/components/` ve `components/`.
- Da chuyen helpers active tu `v2/lib/` ve `lib/`.
- Da chuyen seed demo v2 ve `prisma/seed.ts` de root co Company, Operator va demo data day du.
- Da chuyen `v2/notes/` ve `docs/rebuild-notes/`.
- Da xoa schema/migration/source duplicate trong `v2/`.
- Da them landing page public tai `/` cho deploy Vercel/GitHub.

## Kiem tra

- `npm run lint` pass.
- `npm run build` pass.
- Smoke test root active pass:
  - Login driver bang root `/api/auth/login`.
  - Root `/api/auth/me` tra user dung cookie v2.
  - Root `/dashboard` tra `200 OK`.
  - Root `/api/reports` tra metrics theo role DRIVER.

## Clean production dot 1

- Da xoa cac API cu khong con dung trong root active v2:
  - `/api/dashboard/stats`
  - `/api/dashboard/recent-activities`
  - `/api/time-slots`
  - `/api/time-slots/seed`
  - `/api/rewards/[id]`

## Luu y

- Root app hien chua con re-export sang `v2`.
- Source deploy chinh nam trong `app/`, `components/`, `lib/` va `prisma/`.
