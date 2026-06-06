# System Progress

Cap nhat gan nhat: 2026-06-06

## Tong quan

InnovateX Smart Port da duoc gom source active ve root de san sang push GitHub va deploy Vercel. Huong san pham hien tai: web dat lich vao cang/kho bai thong minh cho logistics/port operations, bam sat concept CXV: chu dong, Khung gio Xanh, Green Tally va tin chi xanh.

## Trang thai module

| Module | Trang thai | Ghi chu |
| --- | --- | --- |
| Module 0: Product scope | Hoan thanh ban dau | Da chot MVP, route/API can co, thong diep PM/client. |
| Module 1: Database/seed | Hoan thanh va da test local | Local PostgreSQL da tao DB/user, `.env` da doi PostgreSQL, v2 migrate/seed pass, root schema/migrations da dong bo PostgreSQL. |
| Module 2: Auth | Hoan thanh ban dau | Register/login/logout/me, JWT httpOnly cookie, role guard. |
| Module 3: Layout/navigation | Hoan thanh ban dau | Dashboard shell, menu theo role, responsive co ban. |
| Module 4: Vehicles/ports | Hoan thanh ban dau | API vehicles/ports, driver chi thay xe cua minh. |
| Module 5: Scheduling Engine | Hoan thanh ban dau, co LLM fallback | Heuristic recommendation lam nen on dinh; neu co `LLM_API_KEY` thi LLM viet lai giai thich ngan gon, khong doi so lieu/rank. |
| Module 6: Booking flow | Hoan thanh ban dau, da fix slot theo ngay | Booking UI, recommendation API, appointments POST, transaction giu slot; API tu sync slot demo theo ngay duoc chon de khong bi het data do seed cu. |
| Module 7: Appointment management | Hoan thanh ban dau, cho test | Appointment board, GET/PATCH, completed cong diem mot lan, cancelled giam bookedCount. |
| Module 7.5: Company foundation | Hoan thanh ban dau, cho test | Co `/api/company`, `/settings/company`, xem company/user/vehicle va cap nhat contact cho admin/operator. |
| Module 8: Green credits/rewards | Hoan thanh ban dau, cho test | Co API/UI green credits, rewards, redeem transaction va redemption history. |
| Module 9: Dashboard/reports | Hoan thanh ban dau, cho test | Co `/api/reports`, dashboard metrics va reports page theo 5 chi so tac dong CXV. |
| Module 10: UI polish/demo | Hoan thanh ban dau, da QA ky thuat | Da setup shadcn/ui, polish command-center style cho core flow, viet demo script 3 phut/sales demo 5 phut, lint/build pass ngay 2026-06-06; con can visual QA bang browser/mobile that. |
| Module 11: Production readiness | Hoan thanh dot 1 | README/env/deploy/backup checklist, Prisma config moi, seed guard, clean API cu khong dung. |
| Module 12: Commercial launch | Hoan thanh dot 1 | Da co landing page public `/` voi CTA demo, positioning va impact metrics. |

## File/chuc nang chinh

- Landing: `app/page.tsx`.
- Auth: `lib/auth.ts`, `app/api/auth/*`, `app/login`, `app/register`.
- API helper/database wrapper: `lib/api.ts`, `lib/prisma.ts`.
- PostgreSQL schema/seed: `prisma/schema.prisma`, `prisma/seed.ts`.
- Layout: `components/DashboardLayout.tsx`, `components/LogoutButton.tsx`.
- Data API: `app/api/vehicles/route.ts`, `app/api/ports/route.ts`.
- Scheduling engine: `lib/schedulingEngine.ts` da nang cap thanh GreenSlot AI advisor co preferred-time fit, demand forecast, action recommendation va modal shift advisor.
- Booking: `app/booking/page.tsx`, `components/BookingFlow.tsx`, `app/api/recommendation/route.ts`, `app/api/appointments/route.ts`.
- Appointments: `app/appointments/page.tsx`, `components/AppointmentsBoard.tsx`, `app/api/appointments/[id]/route.ts`.
- Company foundation: `app/settings/company/page.tsx`, `components/CompanySettings.tsx`, `app/api/company/route.ts`.
- Green credits/rewards: `app/green-credits/page.tsx`, `components/GreenCreditsPanel.tsx`, `app/rewards/page.tsx`, `components/RewardsCatalog.tsx`, `app/api/green-credits/route.ts`, `app/api/rewards/*`.
- Dashboard/reports: `app/dashboard/page.tsx`, `components/DashboardOverview.tsx`, `app/reports/page.tsx`, `components/ReportsView.tsx`, `app/api/reports/route.ts`.
- Demo/UI polish notes: `docs/rebuild-notes/module-10-ui-polish.md`, `docs/rebuild-notes/demo-script.md`, shadcn components trong `components/ui/`.
- Production readiness: `README.md`, `.env.example`, `prisma.config.ts`, `docs/rebuild-notes/module-11-production-readiness.md`.

## CXV concept da dua vao san pham

- UI va notes dung ngon ngu chu dong, Khung gio Xanh, GreenSlot AI.
- Booking/recommendation co ly do de xuat, canh bao ket xe, CO2 saved va green credits.
- Appointment board co Planning - Execution - Rewarding.
- Execution co QR / Green Tally concept, camera quet bien so/container va muc tieu cong mo trong 30 giay.
- Rewarding gan completed appointment voi tin chi xanh.
- Scheduling engine co modal shift suggestion de mo rong tu van sa lan/duong bo.

## Kiem tra da chay

- Node.js da cai: `v22.22.3`.
- npm/npx da cai: `10.9.8`.
- `npx prisma validate --schema v2/prisma/schema.prisma` pass khi dung PostgreSQL URL tam cho command.
- `npm run lint` pass.
- `npx prisma generate` da regenerate Prisma Client root dung Linux runtime.
- `npm run build` pass.
- `npx prisma validate` pass voi `prisma.config.ts`.
- Manual HTTP flow voi PostgreSQL pass: login, vehicles, ports, recommendation, booking, complete appointment, green credits, rewards redeem, reports.
- Root migration smoke test pass: root pages/API chinh da active v2 bang re-export.
- 2026-06-06: `npm run lint` pass.
- 2026-06-06: `npm run build` pass.
- 2026-06-06: Fix booking recommendation rong do slot seed cu ngay; HTTP flow recommendation + create appointment pass.

## Viec chua test duoc

- Da test manual bang HTTP/cookie va QA responsive qua code; con can visual QA bang browser/mobile that.

## Viec nen lam tiep

1. Chay visual QA bang browser/mobile that tren root app active.
2. Deploy thu len staging/Vercel voi PostgreSQL cloud.
3. Lam Module 12 neu can ban/gioi thieu san pham public.

## Rủi ro can theo doi

- Source active da nam o root; neu phat sinh file cu khong dung flow active thi tiep tuc ra soat truoc deploy.
- Completed appointment can test ky de dam bao khong cong diem trung.
- Cancelled appointment can test ky de dam bao `bookedCount` khong am va khong giam trung.
- Seed demo khong duoc chay nham production.
