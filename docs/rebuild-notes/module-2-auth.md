# Module 2 Auth

Trang thai: hoan thanh ban dau trong `v2/`.

## Da lam

- Tao auth helper trong `v2/lib/auth.ts`.
- Tao API response/helper trong `v2/lib/api.ts`.
- Tao Prisma wrapper rieng cho v2 trong `v2/lib/prisma.ts`.
- Tao API register/login/logout/me trong `v2/app/api/auth/`.
- Tao UI login/register trong `v2/app/login` va `v2/app/register`.
- Tao dashboard protected stub trong `v2/app/dashboard`.

## Bao mat co ban

- Password hash bang `bcryptjs`.
- Bcrypt cost hien tai la 12 cho password moi.
- Session luu bang JWT trong httpOnly cookie `innovatex_v2_session`.
- Cookie co `sameSite: lax`, `secure` khi production va max age 7 ngay.
- API khong tra `passwordHash` ve client.
- Validate email, password 8-72 ky tu, bien so xe va do dai input.
- Auth response co `Cache-Control: no-store`.
- Login dung thong bao generic de giam user enumeration.
- Register dung thong bao conflict generic cho email/bien so da ton tai.
- JWT payload duoc verify role/userId truoc khi query user.
- Production yeu cau `JWT_SECRET` toi thieu 32 ky tu.
- Role guard co `requireUser`, `requireAdmin`, `requireOperatorOrAdmin`.

## Security checklist cho API sau

- Moi API phai validate method/body/input o server, khong tin client.
- Moi API user data phai goi `requireUser` truoc.
- API admin/operator phai goi `requireAdmin` hoac `requireOperatorOrAdmin`.
- Driver query phai filter theo `driverId = currentUser.id`.
- Khong bao gio tra password hash, token, secret hoac raw error stack ve client.
- Transaction bat buoc cho booking, cancel, complete va redeem.
- Error response nen generic voi auth/permission/conflict de tranh leak du lieu.
- Response lien quan auth/user nen `Cache-Control: no-store`.
- Rate limit nen them truoc khi deploy public, dac biet login/register.

## Luu y khi migrate vao root app

- Route trong `v2/app` chua active cho Next app hien tai cho den khi migrate sang root `app/`.
- V2 schema co field `passwordHash`, khac schema cu dang dung field `password`.
- Can migrate schema/database truoc khi dung auth v2 tren app that.
- Sau khi migrate, chay `npm run lint` va `npm run build`.
