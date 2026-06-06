# Module 8 Green Credits And Rewards

Trang thai: hoan thanh ban dau trong `v2/`.

## Da lam

- Them GET `/api/green-credits`.
- Them GET `/api/rewards`.
- Them POST `/api/rewards/redeem`.
- Them GET `/api/rewards/my-redemptions`.
- Them trang `/green-credits` va component `GreenCreditsPanel`.
- Them trang `/rewards` va component `RewardsCatalog`.
- Redeem dung transaction: kiem tra user moi nhat, reward active, du diem, tru diem va tao redemption.
- Driver chi doi reward cua minh; admin/operator co the xem redemptions neu can van hanh.

## CXV concept da dua vao UI

- Dung narrative `CXV Rewarding`.
- Tín chỉ xanh gan voi completed appointment, Khung gio Xanh, thoi gian cho, un tac va CO2 saved.
- Reward marketplace duoc trinh bay nhu co che dieu phoi hanh vi, khong chi la qua tang.
- Green Driver rank tao dong luc cho tai xe va cau chuyen cho PM/client.

## Can test khi co PostgreSQL va migrate vao root

- Completed appointment tao green credit va hien trong `/green-credits`.
- Driver du diem redeem thanh cong, greenPoints giam dung.
- Driver khong du diem nhan loi va khong tao redemption.
- Reward inactive khong redeem duoc.
- Khong de diem xanh am.
