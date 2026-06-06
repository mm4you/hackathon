# Module 0 Scope

Trang thai: hoan thanh phien ban dau.

## Huong san pham

InnovateX Smart Port v2 la web dat lich vao cang/kho bai thong minh, duoc rebuild de nhin nhu san pham co the ban/bangiao, khong phai prototype tam.

## Doi tuong can thuyet phuc

- PM/project manager: can thay problem, value, flow va kha nang mo rong.
- Khach hang logistics/cang/kho: can thay web giai quyet viec un tac, cho lau va dieu phoi slot.
- Driver: can thay flow dat lich don gian va co loi ich diem xanh.

## Scope MVP

- Login/register/logout.
- Driver dat lich bang xe cua minh.
- AI Scheduling Engine goi y slot tot nhat va giai thich ly do.
- Admin/operator quan ly lich hen va cap nhat trang thai.
- Hoan thanh lich hen thi cong green credits mot lan.
- Driver doi diem lay reward.
- Dashboard/report cho thay booking, wait time, congestion, CO2 saved va green points.

## Ngoai scope luc nay

- Payment online.
- Subscription billing.
- Realtime map.
- AI/ML external service.
- Marketplace nhieu doi tac.

## Route can co trong ban rebuild

- `/login`
- `/register`
- `/dashboard`
- `/booking`
- `/appointments`
- `/green-credits`
- `/rewards`
- `/reports`

## API can co trong ban rebuild

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/vehicles`
- `/api/ports`
- `/api/time-slots`
- `/api/recommendation`
- `/api/appointments`
- `/api/appointments/[id]`
- `/api/green-credits`
- `/api/rewards`
- `/api/rewards/redeem`
- `/api/reports`

## Tieu chi xong Module 0

- Scope san pham da ro.
- Khong lam billing/subscription trong MVP dau tien.
- Co route/API map cho cac module sau.
- Co thong diep san pham de PM thay diem hay.
