# Module 10 UI Polish And Demo

Trang thai: hoan thanh ban dau, da QA ky thuat ngay 2026-06-06.

## Da lam

- Setup shadcn/ui foundation cho project.
- Them `components.json`.
- Cai dependencies: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.
- Cap nhat `lib/utils.ts` de `cn()` dung `clsx` + `tailwind-merge`.
- Them CSS tokens shadcn trong `app/globals.css`, co theme sang/toi va mau xanh cang/CXV.
- Them component nen trong `components/ui/`:
  - `button.tsx`
  - `card.tsx`
  - `badge.tsx`
  - `input.tsx`
  - `label.tsx`
  - `select.tsx`
  - `textarea.tsx`
  - `table.tsx`
- Polish dot 1 bang shadcn components:
  - `v2/components/DashboardLayout.tsx` dung shadcn Card/Badge.
  - `v2/components/LogoutButton.tsx` dung shadcn Button.
  - `v2/app/login/page.tsx` dung shadcn Card, Badge, Button, Input, Label.
  - `v2/app/register/page.tsx` dung shadcn Card, Badge, Button, Input, Label.
  - `v2/components/DashboardOverview.tsx` dung shadcn Card/Badge cho metrics va panels chinh.
  - `v2/components/ReportsView.tsx` dung shadcn Card cho impact metrics va panels.
- Polish dot 2 theo template user gui:
  - Huong style: dark command-center dashboard, sidebar trai, KPI cards toi, border mong, shadow den, accent xanh.
  - Bo thanh search theo yeu cau user vi chua can thiet.
  - `v2/components/DashboardLayout.tsx` doi sang dark shell gan giong template.
  - `v2/components/DashboardOverview.tsx` doi KPI/cards/panels sang dark analytics style.
  - `v2/components/ReportsView.tsx` doi report cards sang dark analytics style.
- Polish dot 3:
  - `v2/components/BookingFlow.tsx` dong bo dark command-center style.
  - `v2/components/AppointmentsBoard.tsx` dong bo dark command-center style.
  - `v2/components/GreenCreditsPanel.tsx` dong bo dark command-center style.
  - `v2/components/RewardsCatalog.tsx` dong bo dark command-center style.
  - `v2/components/CompanySettings.tsx` dong bo dark command-center style.
- Them `v2/notes/demo-script.md` gom demo 3 phut va sales demo 5 phut.
- Polish dot 4:
  - Sua layout bi cam giac 4:3 do `DashboardLayout` bi gioi han `max-w-[1500px]`.
  - Chuyen dashboard shell sang `w-full min-h-dvh`, sidebar sticky theo viewport va content dung toan bo be ngang.
  - Noi column phu bang `minmax(360px,28vw)` de desktop rong khong bi dong khung.
  - Chuyen login/register sang split-screen full viewport thay vi card nho can giua.
- Polish dot 5:
  - Giam mau UI theo huong shadcn neutral.
  - Bo phan lon gradient xanh/cyan, shadow nang va card nen mau manh.
  - Chuyen core flow sang `bg-card`, `bg-muted`, `border`, `text-muted-foreground`, `shadow-sm`.
  - Login/register, dashboard, booking, appointments, green credits, rewards, reports va company settings dong bo style trung tinh hon.
  - Body global bo radial/gradient background, dung token `--background`.
- QA ngay 2026-06-06:
  - `npm run lint` pass.
  - `npm run build` pass.
  - Ra soat responsive/mobile core flow qua code: login, register, dashboard shell, booking, appointments, green credits, rewards, reports va company settings.
  - Sua nho dashboard header cho phep wrap action tren mobile.
  - Sua hang xac nhan booking de select/button full-width tren mobile, tranh tran ngang khi text slot dai.
  - Giam vien trang choi tren UI toi bang cach dat border mac dinh theo token `--border` va ha mau border/ring dark theme.

## Chua lam

- Chua refactor het UI v2 sang dung shadcn components.
- Booking, appointments, company settings, green credits va rewards van con nhieu class custom.
- Can test UI thuc te tren browser/mobile de tinh chinh spacing va contrast bang mat.

## Huong polish sau khi co template

- Dung shadcn components lam nen: Card, Button, Badge, Table, Input, Select.
- Giu concept CXV: chu dong, Khung gio Xanh, Green Tally, Planning - Execution - Rewarding.
- Uu tien polish cac trang demo flow: login -> dashboard -> booking -> appointments -> green credits -> rewards -> reports.

## Kiem tra

- `npm run lint` pass.
- `npm run build` pass.
