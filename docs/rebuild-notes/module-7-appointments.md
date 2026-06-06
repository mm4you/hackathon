# Module 7 Appointment Management

Trang thai: hoan thanh ban dau trong `v2/`.

## Da lam

- Them GET `/api/appointments` trong `v2/app/api/appointments/route.ts`.
- Tao PATCH `/api/appointments/[id]` de admin/operator cap nhat trang thai.
- Tao `v2/app/appointments/page.tsx` va `v2/components/AppointmentsBoard.tsx`.
- Driver chi xem lich cua minh; admin/operator xem tat ca lich.
- Chi admin/operator thay action cap nhat status tren UI.
- Khi `COMPLETED`, transaction cong `greenPoints`, tao `GreenCredit` va set `creditAwarded` de tranh cong trung.
- Khi `CANCELLED`, transaction giam `bookedCount` neu slot con count duong.
- Moi lan cap nhat status tao `ActivityLog`.

## CXV concept da dua vao UI

- Dung narrative Planning - Execution - Rewarding.
- Planning: AI dat hen chu dong va Khung gio Xanh.
- Execution: QR / Green Tally concept, camera quet bien so/container, cong mo trong 30 giay.
- Rewarding: hoan thanh lich thi cap tin chi xanh va tinh CO2 saved.
- Appointment card co text Green Tally concept de PM thay roadmap van hanh that.

## Can test khi co PostgreSQL va migrate vao root

- Driver chi thay lich cua minh va khong thay nut cap nhat status.
- Admin/operator thay tat ca lich va cap nhat duoc PENDING, COMING, COMPLETED, LATE, CANCELLED.
- Completed khong cong diem trung khi PATCH lai cung status.
- Cancelled khong lam `bookedCount` am.
- Lich da `COMPLETED` hoac `CANCELLED` khong doi sang status khac.
