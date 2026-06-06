# Module 3-4 Layout And Data APIs

Trang thai: hoan thanh ban dau trong `v2/`.

## Module 3: Layout va navigation

Da lam:

- Tao `v2/components/DashboardLayout.tsx`.
- Tao `v2/components/LogoutButton.tsx`.
- Cap nhat `v2/app/dashboard/page.tsx` dung layout moi.
- Sidebar co brand, thong diep san pham, user card va menu.
- Header co title, description, action va logout.
- Menu filter theo role `ADMIN`, `OPERATOR`, `DRIVER`.
- Layout responsive co ban: mobile xep doc, desktop tach sidebar/content.
- Dashboard protected qua `getCurrentUser`, chua login redirect ve `/login`.

Danh gia:

- Day la UI khung sach/chac, chua phai ban polish cuoi.
- Du de gan booking, appointments, reports vao cac module sau.
- PM co the thay huong san pham qua title, description va PM Preview section.
- Sau khi doc slide CXV, cac module UI sau nen them ngon ngu "Chu dong", "Khung gio Xanh", "Planning - Execution - Rewarding" va "Green Tally".

## Module 4: Vehicles va ports

Da lam:

- Tao `v2/app/api/vehicles/route.ts`.
- Tao `v2/app/api/ports/route.ts`.
- Driver chi thay xe co `driverId` cua minh.
- Admin/operator co the thay danh sach xe de phuc vu van hanh.
- Ports chi tra `isActive: true`.
- API yeu cau dang nhap qua `requireUser`.
- API khong tra password/token/secret.
- Error auth va server error tach ro.

Security checklist:

- Vehicles API khong leak xe user khac cho DRIVER.
- Ports API yeu cau login de booking data khong public tuy tien.
- Error server log noi bo, client chi nhan message generic.
- Response dung `jsonData/jsonError` nen co `Cache-Control: no-store`.

Can test khi migrate vao root:

- Login driver, goi `/api/vehicles`, chi thay xe cua driver.
- Login admin/operator, goi `/api/vehicles`, thay danh sach xe van hanh.
- Logout, goi `/api/vehicles` va `/api/ports`, nhan 401.
- Goi `/api/ports`, chi thay cang active.
