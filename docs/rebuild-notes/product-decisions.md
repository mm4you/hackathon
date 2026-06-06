# Product Decisions

Trang thai: da chot huong ban dau cho rebuild v2.

## Muc tieu

Xay InnovateX Smart Port thanh mot web hoan chinh, chay on, trinh bay chuyen nghiep de co the ban/bangiao cho khach hang hoac thuyet phuc PM/project manager.

## Khach hang/nguoi xem muc tieu

Lua chon A: Cong ty logistics co nhieu xe

- De ban/bangiao nhu mot web quan ly dat lich cho doi xe.
- Can Company, user, vehicle fleet, booking, reports.
- Gia tri: giam thoi gian cho, quan ly xe, bao cao van hanh.

Lua chon B: Cang/kho/bai

- De ban/bangiao dashboard dieu phoi.
- Can admin/operator role, slot capacity, reports, audit log.
- Gia tri: giam un tac cong, toi uu luong xe.

Lua chon C: Tai xe nho le

- De demo nhanh hon nhung kho ban thanh web co gia tri cao hon.
- Can booking nhanh, rewards, mobile-first.
- Gia tri: tiet kiem thoi gian, uu dai, diem xanh.

## De xuat ban dau

Di theo huong web ban/bangiao cho cong ty logistics hoac cang/kho/bai truoc.

Ly do:

- Gia tri ban du an ro hon driver nho le.
- Gia tri kinh te ro hon.
- PM/client de thay duoc tac dong van hanh: giam cho, giam un tac, bao cao ro.

## Cach ban san pham ban dau

- Ban nhu mot website/app dat lich cang thong minh hoan chinh.
- Demo flow cho PM/client: login -> booking AI -> appointment -> complete -> green credits -> reports.
- Ban bang gia tri: tiet kiem thoi gian cho, giam un tac, tang minh bach dieu phoi.
- Chua can payment/subscription trong MVP dau tien.
- Co the de san nen Company de sau nay nang cap thanh ban B2B nhieu khach.

## Rủi ro can xu ly som

- Permission sai co the leak du lieu xe/lich cua khach hang khac.
- Transaction sai co the lam slot/dem booking/diem xanh sai.
- Seed demo khong duoc chay nham production.
- Khong duoc luu secret vao git.
- UI demo duoc nhung production crash khi input sai.

## Quyet dinh cho Module 0

- Lam v2 rieng trong `v2/`, khong dung vao code cu.
- Database v2 chuyen sang PostgreSQL de phu hop huong production/SaaS va deploy cloud.
- MVP co 2 role chinh: ADMIN va DRIVER.
- Them role OPERATOR de sau nay PM/client thay co the mo rong cho nhan vien cang/kho.
- Them Company de web trong co ve san pham doanh nghiep, nhung khong lam subscription/payment luc nay.
- UI va demo phai lam noi bat AI Scheduling Engine, green credits va dashboard/report.
