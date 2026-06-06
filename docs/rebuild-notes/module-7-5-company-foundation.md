# Module 7.5 Company Foundation

Trang thai: hoan thanh ban dau trong `v2/`.

## Da lam

- Schema v2 da co `Company`, va seed gan user/vehicle vao company.
- Them GET/PATCH `/api/company`.
- Them trang `/settings/company`.
- Them `v2/components/CompanySettings.tsx`.
- Them menu "Cong ty" vao dashboard navigation.
- User nao cung xem duoc company cua minh; admin/operator cap nhat duoc ten, email lien he va so dien thoai.
- Trang hien thi thong ke thanh vien va doi xe de san sang huong B2B.

## Ly do san pham

- Web nhin co cau truc doanh nghiep, phu hop ban/bangiao cho cong ty logistics hoac cang/kho bai.
- Company la nen de sau nay them invite user, multi-company, report theo fleet va phan quyen theo to chuc.

## Chua lam trong MVP nay

- Invite user vao company.
- Multi-company admin dashboard.
- Subscription/payment theo company.
- CRUD fleet day du.

## Can test khi migrate vao root

- Driver chi xem company, khong cap nhat duoc.
- Admin/operator cap nhat company thanh cong.
- User khong company nhan empty state dung.
- API khong leak company khac.
