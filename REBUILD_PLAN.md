# InnovateX Smart Port Commercial Rebuild Plan

Muc tieu: xay lai project theo tung module nho de thanh mot web hoan chinh co the ban/bangiao cho khach hang hoac thuyet phuc PM, khong chi la demo hackathon. Code cu chi dung lam tham chieu, code moi ban dau nam trong `v2/`, moi ngay chi lam mot nhom chuc nang va co checklist test rieng de tranh qua tai, sai sot va no ky thuat.

## Tieu chuan san pham thuong mai

San pham chi duoc xem la san sang ban/bangiao khi dat cac dieu kien sau:

- Auth an toan: cookie httpOnly, secret manh, validate input, khong leak password/token.
- Role/permission ro rang: DRIVER, ADMIN, va sau nay co the them PORT_OPERATOR/COMPANY_OWNER.
- Database migration on dinh, seed demo tach khoi production.
- API co validation, error response dong nhat, khong crash khi input sai.
- Transaction dung cho booking, cancel, complete, redeem de khong sai tien/diem/slot.
- UI co loading, empty, error states va responsive mobile.
- Co audit/activity log cho hanh dong quan trong.
- Co cau chuyen gia tri ro rang de PM/client thay diem manh.
- Co backup/deploy/env guide ro rang.
- `npm run lint` va `npm run build` pass truoc moi lan release.

## Nguyen tac rebuild

- Khong xoa code cu ngay tu dau. Chi thay the tung module sau khi module moi chay duoc.
- Code rebuild ban dau nam trong `v2/` de tranh xung dot voi code cu.
- Lam tu core truoc: database, auth, layout, booking, appointment, rewards, reports.
- Moi task phai co ket qua nhin thay duoc tren UI hoac API.
- Moi ngay ket thuc bang `npm run lint` va neu co the thi `npm run build`.
- Khong them tinh nang moi khi module hien tai chua xong.
- Neu gap loi database/auth/API thi dung lai fix truoc, khong chuyen sang UI polish.

## Pham vi san pham MVP thuong mai

App la he thong dat lich vao cang thong minh cho tai xe/container.

Chuc nang chinh:

- Driver dang ky, dang nhap, dang xuat.
- Driver quan ly xe cua minh.
- Driver chon cang, xe, thoi gian mong muon va muc tieu toi uu.
- He thong goi y time slot tot nhat dua tren congestion, capacity, wait time, green bonus.
- Driver xac nhan dat lich.
- Driver xem lich hen cua minh.
- Admin xem tat ca lich hen va cap nhat trang thai.
- Khi lich COMPLETED, he thong cong green credits mot lan.
- Driver doi diem xanh lay reward.
- Admin/driver xem dashboard va bao cao co ban.

Khach hang muc tieu:

- Tai xe/container driver nho le.
- Cong ty logistics co nhieu xe.
- Don vi van hanh cang/kho/bai can giam un tac.

Gia tri de ban:

- Giam thoi gian cho o cong cang.
- Giam un tac va giam phat thai do xe no may cho.
- Dieu phoi slot minh bach hon.
- Tao diem xanh/uu dai de khuyen khich hanh vi dung gio.

Huong ban san pham ban dau:

- Ban/bangiao nhu mot website dat lich cang thong minh hoan chinh.
- Demo cho PM/client thay flow that: driver dat lich, AI goi y, admin dieu phoi, report tac dong.
- Gia tri ban hang nam o giam thoi gian cho, giam un tac, tang minh bach dieu phoi.
- Payment/subscription de sau, khong nam trong MVP dau tien.

Nhung thu chua nen lam trong MVP thuong mai dau tien:

- Thanh toan online neu chua chot mo hinh thu tien.
- AI/ML that neu chua co data lich su du lon.
- Realtime map phuc tap.
- Marketplace qua nhieu ben.

## Kien truc de co the ban duoc

Phan bat buoc:

- App Router pages cho UI.
- API routes/server actions co validation ro.
- Prisma + MySQL/PostgreSQL production database.
- Auth cookie JWT hoac session database neu can revoke session.
- Role-based access control.
- Audit log cho booking/status/reward/auth.
- Environment variables tach dev/staging/prod.

Phan nen them som sau MVP:

- Company model de web co cau truc doanh nghiep va de mo rong sau.
- Invite user vao company.
- Export CSV/PDF report.
- Email notification.
- Monitoring/logging.

## Module 0: Product scope va nen tang

Thoi luong: 0.5 ngay

Viec can lam:

- Kiem tra dependency hien tai: Next.js, React, Prisma, Tailwind.
- Doc guide Next.js trong `node_modules/next/dist/docs/` truoc khi sua App Router/API route.
- Chot database se dung MySQL local hay MySQL cloud.
- Chot flow user: DRIVER va ADMIN.
- Chot MVP thuong mai ban cho ai truoc: driver nho le, cong ty logistics hay cang/kho/bai.
- Chot cach trinh bay san pham de ban/bangiao: demo flow, dashboard, report va thong diep gia tri.
- Tao danh sach route/API can giu.

Ket qua xong:

- Project cai duoc dependency.
- `.env` dung cho moi truong hien tai.
- Chay duoc `npm run lint`.
- Co decision note ve khach hang muc tieu va cach ban/bangiao trong `v2/notes/`.

## Module 1: Database va seed

Thoi luong: 1 ngay

Bang can co:

- User
- Vehicle
- Port
- TimeSlot
- Appointment
- GreenCredit
- Reward
- RewardRedemption
- ActivityLog

Bang nen chuan bi cho ban web doanh nghiep:

- Company

Viec can lam:

- Review lai `prisma/schema.prisma` va bo truong khong can cho MVP.
- Dam bao relationship ro rang: User -> Vehicle -> Appointment -> TimeSlot/Port.
- Them Company de tranh sau nay phai sua lon khi ban cho cong ty logistics/cang.
- Viet seed nho, on dinh, de demo.
- Tao tai khoan demo admin va driver.

Ket qua xong:

- `npx prisma migrate dev` chay duoc.
- `npx prisma db seed` tao du lieu demo.
- Co it nhat 1 admin, 1 driver, 1 xe, 2 cang, nhieu time slot.

## Module 2: Auth

Thoi luong: 1 ngay

Route/UI:

- `/login`
- `/register`
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/logout`
- `/api/auth/me`

Viec can lam:

- Dang ky user DRIVER.
- Dang nhap bang email/password.
- Hash password bang `bcryptjs`.
- Luu session bang httpOnly cookie JWT.
- Tao helper `getCurrentUser`, `requireUser`, `requireAdmin`.
- Redirect user chua dang nhap ve login.
- Validate email/password/name o server.
- Chuan bi co che rate limit/login lock neu dua production.

Ket qua xong:

- Dang ky thanh cong.
- Dang nhap thanh cong.
- Logout xoa cookie.
- Dashboard chan user chua dang nhap.
- Khong tra password hash ve client.

## Module 3: Layout va navigation

Thoi luong: 0.5 ngay

Route/UI:

- `/dashboard`
- Sidebar/header chung.
- Trang not found.

Viec can lam:

- Lam layout don gian, responsive truoc.
- Hien thi menu theo role.
- Hien thi ten user va green points.
- Dam bao mobile xem duoc.

Ket qua xong:

- Dashboard co shell chung.
- Driver va Admin thay menu phu hop.
- UI khong vo tren mobile.

## Module 4: Vehicles va ports

Thoi luong: 0.5 ngay

API:

- `/api/vehicles`
- `/api/ports`

Viec can lam:

- Driver lay danh sach xe cua minh.
- Admin co the xem danh sach can thiet neu can.
- Lay danh sach cang active.
- Xu ly empty state khi driver chua co xe.

Ket qua xong:

- Booking form co du lieu xe va cang.
- API khong leak xe cua user khac cho DRIVER.

## Module 5: Scheduling Engine

Thoi luong: 1 ngay

File core:

- `lib/schedulingEngine.ts`

Viec can lam:

- Giu engine o dang heuristic de demo hackathon.
- Input: time slots, preference.
- Output: top recommendation + alternatives.
- Tinh wait score, utilization, congestion penalty, green credit, CO2 saved.
- Viet logic ro, de giai thich khi thuyet trinh.

Ket qua xong:

- Engine tra ket qua on dinh.
- Co ly do de xuat bang tieng Viet.
- Khong recommend slot full capacity.

## Module 6: Booking flow

Thoi luong: 1 ngay

Route/UI/API:

- `/booking`
- `/api/recommendation`
- `/api/appointments` POST

Viec can lam:

- Form chon xe, cang, thoi gian, preference.
- Goi API recommendation.
- Hien thi slot tot nhat va slot thay the.
- Xac nhan dat lich.
- Transaction khi dat lich: tao appointment va tang bookedCount.
- Validation server-side cho vehicleId, portId, timeSlotId, preferredTime, optimizationPreference.
- Chong double booking/click lien tuc.

Ket qua xong:

- Driver dat lich duoc tu dau den cuoi.
- Slot full khong dat duoc.
- Khong the dat lich bang xe cua user khac.
- Khi dat thanh cong redirect sang appointments.

## Module 7: Appointment management

Thoi luong: 1 ngay

Route/UI/API:

- `/appointments`
- `/api/appointments` GET
- `/api/appointments/[id]` PATCH

Viec can lam:

- Driver chi xem lich cua minh.
- Admin xem tat ca lich.
- Admin cap nhat trang thai PENDING, COMING, COMPLETED, LATE, CANCELLED.
- Khi CANCELLED giam bookedCount dung 1 lan.
- Khi COMPLETED cong green credits dung 1 lan.
- Log audit moi lan doi trang thai.

Ket qua xong:

- Bang lich hen dung role.
- Trang thai cap nhat khong bi cong diem trung.
- Lich da dong khong bi sua sai flow.

## Module 7.5: Company foundation

Thoi luong: 0.5 ngay neu can lam ro san pham doanh nghiep

Route/UI/API:

- `/settings/company`
- `/api/company`

Viec can lam:

- Tao Company cho cong ty logistics/cang.
- Gan user va vehicle vao company.
- Hien thi thong tin company trong dashboard/settings neu can.
- Chua lam subscription/payment trong MVP dau tien.

Ket qua xong:

- Web nhin co cau truc san pham doanh nghiep.
- Sau nay co the mo rong thanh multi-company neu can.

## Module 8: Green credits va rewards

Thoi luong: 1 ngay

Route/UI/API:

- `/green-credits`
- `/rewards`
- `/api/green-credits`
- `/api/rewards`
- `/api/rewards/redeem`
- `/api/rewards/my-redemptions`

Viec can lam:

- Driver xem lich su diem xanh.
- Driver xem danh sach reward.
- Driver doi reward khi du diem.
- Transaction khi redeem: tru diem va tao redemption.
- Xu ly loi khong du diem.

Ket qua xong:

- Diem xanh hien dung.
- Doi reward khong bi am diem.
- Lich su redemption hien duoc.

## Module 9: Dashboard va reports

Thoi luong: 1 ngay

Route/UI/API:

- `/dashboard`
- `/reports`
- `/api/reports`

Viec can lam:

- Dashboard driver: lich gan day, diem xanh, CO2 saved, goi y slot.
- Dashboard admin: tong lich hom nay, wait average, congestion overview.
- Reports: tong appointment, completed, CO2 saved, green points, top drivers.

Ket qua xong:

- So lieu lay tu database that.
- Admin va Driver thay noi dung phu hop.
- Khong tinh sai do role filter.

## Module 10: UI polish va demo

Thoi luong: 1 ngay

Viec can lam:

- Polish responsive desktop/mobile.
- Them loading, error, empty states.
- Don lai text tieng Viet cho de thuyet trinh.
- Chuan bi demo script 3 phut.
- Chuan bi sales demo 5 phut theo goc nhin khach hang tra tien.
- Fix lint/build.

Ket qua xong:

- `npm run lint` pass.
- `npm run build` pass.
- Demo flow chay duoc: login -> booking -> recommendation -> confirm -> appointment -> complete -> green credits -> redeem.

## Module 11: Production readiness

Thoi luong: 1-2 ngay

Viec can lam:

- Tach `.env.example` cho production.
- Kiem tra khong commit secret.
- Chuan bi deploy Vercel + database cloud.
- Chay migration production bang `prisma migrate deploy`.
- Them basic monitoring/logging neu co.
- Viet checklist backup database.
- Viet README huong dan van hanh.

Ket qua xong:

- Deploy duoc len public URL.
- Production build pass.
- Co tai khoan admin dau tien.
- Co quy trinh backup/restore toi thieu.

## Module 12: Commercial launch checklist

Thoi luong: 1 ngay

Viec can lam:

- Tao landing page noi ro loi ich va CTA.
- Tao pricing page don gian neu da chot gia.
- Tao flow lien he/demo request neu chua tich hop payment.
- Tao terms/privacy ban toi thieu neu thu thap du lieu user.
- Chuan bi demo data gan voi case logistics Viet Nam.

Ket qua xong:

- Co link gui khach hang xem.
- Co cach khach hang lien he/mua/dung thu.
- Co cau chuyen ban hang ro rang.

## Lich lam de xuat cho ban commercial MVP

Ngay 1: Module 0 + Module 1

Ngay 2: Module 2 + Module 3

Ngay 3: Module 4 + Module 5

Ngay 4: Module 6

Ngay 5: Module 7

Ngay 6: Module 7.5 neu can, sau do Module 8

Ngay 7: Module 8

Ngay 8: Module 9

Ngay 9: Module 10

Ngay 10: Module 11 + Module 12

## Thu tu uu tien neu gap deadline

Bat buoc co:

- Auth
- Database seed
- Booking flow
- Scheduling recommendation
- Appointment list/status
- Green credits khi completed
- Validation/permission/transaction an toan

Co thi tot:

- Rewards redeem
- Reports
- Activity log
- UI polish nang cao
- Company foundation

Co the cat neu thieu thoi gian:

- Nhieu loai reward phuc tap
- Report nang cao
- Admin CRUD day du cho port/time slot
- ML/AI that, chi can heuristic explainable cho hackathon
- Payment/subscription online

## Checklist moi ngay

- Xac dinh module hom nay.
- Sua it file nhat co the.
- Chay manual test dung flow cua module.
- Chay `npm run lint`.
- Neu lien quan production thi chay `npm run build`.
- Ghi lai viec da xong va viec con lai.
- Kiem tra co anh huong den bao mat, tien, diem, quota hay data khach hang khong.

## Release checklist

- `npm run lint` pass.
- `npm run build` pass.
- Migration deploy thanh cong.
- Seed demo khong chay nham production.
- Auth va permission test thu cong pass.
- Booking transaction test pass.
- Redeem transaction test pass.
- Khong co secret trong git.
- README production cap nhat.
- Co backup database toi thieu.

## Viec khong lam trong rebuild lan dau

- Khong them payment.
- Khong them realtime socket.
- Khong them map phuc tap.
- Khong them AI/ML external service.
- Khong lam admin CRUD day du neu MVP chua on dinh.
