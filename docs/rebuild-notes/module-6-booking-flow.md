# Module 6 Booking Flow

Trang thai: hoan thanh ban dau trong `v2/`.

Cap nhat 2026-06-06: da fix loi recommendation khong co slot do DB seed cu ngay.

## Da lam

- Tao `v2/app/api/recommendation/route.ts`.
- Tao `v2/app/api/appointments/route.ts` cho POST booking.
- Tao `v2/app/booking/page.tsx` va `v2/components/BookingFlow.tsx`.
- Recommendation lay slot theo cang/ngay, bo slot full/invalid qua scheduling engine.
- Booking validate user DRIVER, xe thuoc driver, cang/slot hop le va preference hop le.
- Booking dung transaction: tang `bookedCount` bang `updateMany` co dieu kien `bookedCount < capacity`, sau do tao appointment va activity log.
- UI co loading, empty va error state co ban.
- API recommendation co `syncSlotsForDay`: khi ngay duoc chon chua co slot, tu tao slot demo cho ngay do; khi da co slot, cap nhat lai congestion/wait/greenBonus theo gio hien tai va bookedCount.
- Sync slot khong reset `bookedCount` cua slot da ton tai de khong pha transaction booking.
- Recommendation su dung them context cang/giao thong: simulation mac dinh, TomTom Traffic optional neu co key.
- Booking UI hien thi AI Decision: loi khuyen cho driver, note cho operator, tom tat rui ro va phuong an thay the co the bam de doi slot.

## Loi da fix

- Nguyen nhan: DB local dang co time slot ngay 2026-06-04 trong khi form dat lich chon ngay hien tai, nen `/api/recommendation` tra danh sach rong.
- Cach fix: recommendation sync slot theo ngay duoc chon truoc khi query slot.
- Da test HTTP: login driver, lay vehicles/ports, goi recommendation ngay hien tai co slot, POST `/api/appointments` tao appointment thanh cong va bookedCount tang.

## Can test khi co PostgreSQL va migrate vao root

- Driver goi recommendation co danh sach slot va ly do tieng Viet.
- Slot full khong duoc recommend/dat.
- Driver khong dat duoc bang xe user khac.
- Double click/booking dong thoi khong lam `bookedCount` vuot `capacity`.
- Dat thanh cong redirect sang `/appointments`.
