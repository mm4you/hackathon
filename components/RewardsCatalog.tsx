"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Reward = { id: string; title: string; description: string; pointsRequired: number; type: string };
type Redemption = { id: string; pointsUsed: number; status: string; createdAt: string; reward: Reward };
type CurrentUser = { greenPoints: number; role: "ADMIN" | "OPERATOR" | "DRIVER" };
type ApiResponse<T> = { data?: T; error?: string };
type VoucherTokenResponse = { token: string; expiresInSeconds: number };

export function RewardsCatalog() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchRewardsData() {
    const [meResponse, rewardsResponse, redemptionsResponse] = await Promise.all([fetch("/api/auth/me"), fetch("/api/rewards"), fetch("/api/rewards/my-redemptions")]);
    const meJson = (await meResponse.json()) as ApiResponse<CurrentUser>;
    const rewardsJson = (await rewardsResponse.json()) as ApiResponse<Reward[]>;
    const redemptionsJson = (await redemptionsResponse.json()) as ApiResponse<Redemption[]>;
    if (!meResponse.ok || !rewardsResponse.ok || !redemptionsResponse.ok) throw new Error(meJson.error ?? rewardsJson.error ?? redemptionsJson.error ?? "Không tải được ưu đãi");
    return { user: meJson.data ?? null, rewards: rewardsJson.data ?? [], redemptions: redemptionsJson.data ?? [] };
  }

  useEffect(() => {
    let cancelled = false;
    fetchRewardsData().then((nextData) => {
      if (!cancelled) {
        setUser(nextData.user);
        setRewards(nextData.rewards);
        setRedemptions(nextData.redemptions);
        setLoading(false);
      }
    }).catch((loadError) => {
      if (!cancelled) {
        setLoading(false);
        setError(loadError instanceof Error ? loadError.message : "Không tải được ưu đãi");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function redeem(rewardId: string) {
    setRedeemingId(rewardId);
    setMessage("");
    setError("");
    const response = await fetch("/api/rewards/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rewardId }) });
    const json = (await response.json()) as ApiResponse<Redemption>;
    setRedeemingId("");
    if (!response.ok) return setError(json.error ?? "Không đổi được ưu đãi");
    setMessage("Đổi ưu đãi thành công. Yêu cầu đã chuyển sang trạng thái chờ duyệt.");
    await fetchRewardsData().then((nextData) => {
      setUser(nextData.user);
      setRewards(nextData.rewards);
      setRedemptions(nextData.redemptions);
    }).catch(() => setError("Đã đổi ưu đãi nhưng chưa tải lại được dữ liệu mới"));
  }

  if (loading) return <div className="rounded-[1.5rem] border bg-card p-6 text-sm text-muted-foreground shadow-sm">Đang tải ưu đãi...</div>;

  return (
    <div className="space-y-3 sm:space-y-4">
      {message ? <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">{message}</p> : null}
      {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

      <section className="rounded-[1.2rem] border bg-card p-4 shadow-sm sm:p-5 lg:rounded-[1.35rem]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Ưu đãi</div>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Đổi điểm xanh</h2>
        <p className="mt-2 line-clamp-2 max-w-4xl text-sm leading-6 text-muted-foreground sm:line-clamp-none">Tài xế dùng điểm đã nhận để đổi ưu tiên cổng, giảm phí hoặc voucher dịch vụ.</p>
        <div className="mt-4 inline-flex rounded-full border bg-muted/30 px-3 py-1 text-sm font-semibold">Điểm hiện tại: {user?.greenPoints ?? 0}</div>
      </section>

      <section className="overflow-hidden rounded-[1.2rem] border bg-card shadow-sm lg:rounded-[1.35rem]">
        <div className="border-b px-4 py-3 font-semibold sm:px-5 sm:py-4">Ví ưu đãi của tôi</div>
        <div className="divide-y">
          {redemptions.map((item) => (
            <div key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <div className="font-medium">{item.reward.title}</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">{voucherInstruction(item.reward.type)}</div>
                <div className="mt-2 truncate rounded-xl border bg-muted/20 px-3 py-2 font-mono text-[11px] text-muted-foreground">Mã voucher: {voucherCode(item)}</div>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <Status value={item.status} />
                <VoucherQr redemption={item} />
                <span className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
              </div>
            </div>
          ))}
          {!redemptions.length ? <div className="px-5 py-8 text-center text-sm text-muted-foreground">Chưa có ưu đãi trong ví. Đổi điểm để nhận voucher.</div> : null}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rewards.map((reward) => {
          const enoughPoints = (user?.greenPoints ?? 0) >= reward.pointsRequired;
          const canRedeem = user?.role === "DRIVER" && enoughPoints;
          return (
            <article key={reward.id} className="rounded-[1.2rem] border bg-card p-4 shadow-sm sm:rounded-[1.25rem] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">{rewardTypeLabel(reward.type)}</div>
                  <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em] sm:text-xl">{reward.title}</h3>
                </div>
                <div className="rounded-full border px-3 py-1 text-sm font-bold">{reward.pointsRequired}</div>
              </div>
              <details className="mt-3 rounded-2xl border bg-muted/20 p-3">
                <summary className="cursor-pointer text-sm font-semibold">Chi tiết ưu đãi</summary>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{reward.description}</p>
              </details>
              <button disabled={!canRedeem || redeemingId === reward.id} onClick={() => redeem(reward.id)} className="mt-5 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-45">
                {redeemingId === reward.id ? "Đang đổi..." : enoughPoints ? "Đổi ưu đãi" : "Chưa đủ điểm"}
              </button>
            </article>
          );
        })}
        {!rewards.length ? <div className="rounded-[1.7rem] border bg-card p-6 text-sm text-muted-foreground">Chưa có ưu đãi active.</div> : null}
      </section>

      <details className="overflow-hidden rounded-[1.2rem] border bg-card shadow-sm lg:rounded-[1.35rem]">
        <summary className="cursor-pointer border-b px-4 py-3 font-semibold sm:px-5 sm:py-4">Lịch sử đổi ưu đãi</summary>
        <div className="divide-y">
          {redemptions.map((item) => (
            <div key={item.id} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <div className="font-medium">{item.reward.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{item.pointsUsed} điểm - {formatDateTime(item.createdAt)}</div>
              </div>
              <Status value={item.status} />
            </div>
          ))}
          {!redemptions.length ? <div className="px-5 py-8 text-center text-sm text-muted-foreground">Chưa đổi ưu đãi.</div> : null}
        </div>
      </details>
    </div>
  );
}

function rewardTypeLabel(type: string) {
  if (type === "PRIORITY_GATE") return "Ưu tiên cổng";
  if (type === "SERVICE_DISCOUNT") return "Giảm phí dịch vụ";
  if (type === "FUEL_VOUCHER") return "Nhiên liệu";
  if (type === "MAINTENANCE_VOUCHER") return "Bảo dưỡng";
  return "Green Badge";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function Status({ value }: { value: string }) {
  const className = value === "REJECTED" ? "border-destructive/30 bg-destructive/10 text-destructive" : "bg-muted/30";
  return <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{statusLabel(value)}</span>;
}

function VoucherQr({ redemption }: { redemption: Redemption }) {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrError, setQrError] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("");
  const code = voucherCode(redemption);

  async function openQr() {
    setOpen(true);
    if (qrDataUrl) return;
    setQrError("");
    const response = await fetch(`/api/rewards/redemptions/${redemption.id}/voucher-token`, { method: "POST" });
    const json = (await response.json()) as ApiResponse<VoucherTokenResponse>;
    if (!response.ok || !json.data?.token) {
      setQrError(json.error ?? "Không tạo được QR voucher");
      return;
    }
    const nextVerifyUrl = `${window.location.origin}/api/vouchers/verify?token=${encodeURIComponent(json.data.token)}`;
    setVerifyUrl(nextVerifyUrl);
    const nextQr = await QRCode.toDataURL(nextVerifyUrl, { width: 280, margin: 2, errorCorrectionLevel: "M" }).catch(() => "");
    if (!nextQr) setQrError("Không tạo được QR voucher");
    setQrDataUrl(nextQr);
  }

  return (
    <>
      <button type="button" onClick={openQr} className="rounded-full border px-3 py-1 text-xs font-semibold transition hover:bg-muted/40">QR voucher</button>
      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="QR voucher">
          <div className="w-full max-w-sm rounded-[1.6rem] border bg-card p-4 text-center shadow-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Voucher ưu đãi</div>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em]">{redemption.reward.title}</h3>
            <div className="mt-2 rounded-xl border bg-muted/20 px-3 py-2 font-mono text-sm font-semibold">{code}</div>
            <div className="mt-4 rounded-[1.4rem] border bg-white p-4">
              {qrDataUrl ? <Image src={qrDataUrl} alt={`QR voucher ${code}`} width={260} height={260} unoptimized className="mx-auto size-[240px] sm:size-[260px]" /> : <div className="mx-auto grid size-[240px] place-items-center text-sm text-muted-foreground">{qrError || "Đang tạo QR..."}</div>}
            </div>
            {verifyUrl ? <div className="mt-3 truncate rounded-xl border bg-background px-3 py-2 font-mono text-[11px] text-muted-foreground">{verifyUrl}</div> : null}
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Đưa mã hoặc QR này cho cổng/quầy dịch vụ để đối chiếu ưu đãi.</p>
            <button type="button" onClick={() => setOpen(false)} className="mt-4 h-11 w-full rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Đóng</button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function voucherCode(redemption: Redemption) {
  return `VC-${redemption.id.slice(-8).toUpperCase()}`;
}

function statusLabel(value: string) {
  if (value === "PENDING") return "Chờ duyệt";
  if (value === "APPROVED") return "Dùng được";
  if (value === "USED") return "Đã dùng";
  if (value === "REJECTED") return "Từ chối";
  return value;
}

function voucherInstruction(type: string) {
  if (type === "PRIORITY_GATE") return "Dùng tại cổng khi check-in để xin ưu tiên xử lý.";
  if (type === "SERVICE_DISCOUNT") return "Xuất mã voucher cho quầy dịch vụ/cảng để áp dụng giảm phí.";
  if (type === "FUEL_VOUCHER") return "Dùng mã voucher tại đối tác nhiên liệu hoặc quầy xác nhận.";
  if (type === "MAINTENANCE_VOUCHER") return "Dùng mã voucher khi đặt lịch bảo dưỡng với đối tác.";
  return "Dùng làm chứng nhận tài xế xanh trong hồ sơ vận hành.";
}
