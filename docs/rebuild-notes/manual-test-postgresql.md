# Manual Test PostgreSQL

Thoi gian: 2026-06-04

## Moi truong

- Database: PostgreSQL local `innovatex_smart_port`.
- User database: `innovatex`.
- Next dev server: `http://localhost:3000`.
- Seed: `v2/prisma/seed.ts` da chay thanh cong.

## Flow da test bang HTTP/cookie

- Driver login `driver@innovatex.vn` / `123456`: pass.
- `/api/auth/me`: pass.
- `/api/vehicles`: pass, driver chi thay xe cua minh.
- `/api/ports`: pass, tra active ports.
- `/api/recommendation`: pass, tra top slot va alternatives.
- `/api/appointments` POST: pass, tao appointment va tang `bookedCount`.
- Admin login `admin@innovatex.vn` / `123456`: pass.
- `/api/appointments/[id]` PATCH `COMPLETED`: pass, cong green points va tao green credit.
- `/api/green-credits`: pass, hien credit moi va credit seed.
- `/api/rewards`: pass.
- `/api/rewards/redeem`: pass voi reward du diem.
- `/api/rewards/my-redemptions`: pass.
- `/api/reports`: pass cho admin.

## Loi phat hien va da sua

- Root app con field cu `password`, da sua sang `passwordHash`.
- Root app con field cu `co2Saved`, da sua sang `co2SavedKg`.
- Root appointment POST thieu `recommendationReason`, da them default reason.
- Root auth type chua co `OPERATOR`, da cap nhat.
- Root recommendation response da them `co2SavedKg` de UI khong lech field.
- Root appointment PATCH tra stale `creditAwarded`, da sua transaction tra record moi nhat.
- Cancelled status giam `bookedCount` bang `updateMany` co dieu kien `bookedCount > 0` de tranh am.

## Kiem tra cuoi

- `npx prisma validate` pass.
- `npx prisma migrate status` pass, database up to date.
- `npm run lint` pass.
- `npm run build` pass.

## Can test tiep tren browser

- Visual flow desktop/mobile.
- Login -> dashboard -> booking -> appointments -> complete -> green credits -> rewards -> reports.
- Kiem tra UI root hien tai va UI v2 staging de quyet dinh migrate v2 UI vao root.
