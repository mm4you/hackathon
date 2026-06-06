# Module 9 Dashboard And Reports

Trang thai: hoan thanh ban dau trong `v2/`.

## Da lam

- Them GET `/api/reports`.
- Nang cap `/dashboard` bang `v2/components/DashboardOverview.tsx`.
- Them `/reports` va `v2/components/ReportsView.tsx`.
- API reports filter theo role: DRIVER chi xem du lieu cua minh, ADMIN/OPERATOR xem toan he thong.
- Tinh metrics bang data appointment, green credit, reward redemption, time slot va activity log.

## Metrics chinh

- Lich hen hom nay, tong lich, completed appointments.
- Thoi gian cho trung binh.
- CO2 saved.
- Green points issued.
- Reward redemptions.
- Congestion mix LOW/MEDIUM/HIGH trong ngay.
- Best Green Slots.
- Activity log gan day.
- Top Green Drivers cho admin/operator.

## CXV concept da dua vao

- Dashboard co Planning Pulse, Execution va Rewarding loop.
- Reports co `CXV Impact Report` va 5 chi so tac dong:
  - Giam cong viec thu cong.
  - Cai thien toc do giao hang.
  - Giam phat thai tai cong.
  - Khung gio xanh.
  - Chi phi van hanh tiet kiem.
- Green Tally roadmap: QR/camera, quet bien so/container va muc tieu cong 30 giay.
- Bao cao khong chi dem booking ma ke cau chuyen van hanh de thuyet phuc PM/client.

## Can test khi co PostgreSQL va migrate vao root

- Driver chi thay dashboard/report cua minh.
- Admin/operator thay du lieu toan he thong.
- Average wait, CO2, green points va redemption count tinh dung.
- Reports khong crash khi database chua co appointment/slot.
- Dashboard responsive mobile/desktop.
