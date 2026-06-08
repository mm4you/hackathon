"use client";

import { useEffect, useState } from "react";

type Credit = {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
  user: { id: string; name: string; greenPoints: number };
  appointment: { co2SavedKg: number; estimatedWaitMinutes: number; port: { name: string }; vehicle: { plateNumber: string }; timeSlot: { startTime: string; congestionLevel: string } };
};
type ApiResponse<T> = { data?: T; error?: string };
type Data = { user: { greenPoints: number; role: string }; credits: Credit[]; summary: { totalIssued: number; totalCo2SavedKg: number; transactionCount: number } };

export function GreenCreditsPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/green-credits");
      const json = (await response.json()) as ApiResponse<Data>;
      if (cancelled) return;
      setLoading(false);
      if (!response.ok) return setError(json.error ?? "Không tải được điểm xanh");
      setData(json.data ?? null);
    }
    load().catch(() => {
      if (!cancelled) {
        setLoading(false);
        setError("Không tải được điểm xanh");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const points = data?.user.greenPoints ?? 0;
  const rank = greenRank(points);
  const nextTarget = nextRankTarget(points);
  const progress = nextTarget ? Math.min(100, Math.round((points / nextTarget) * 100)) : 100;

  if (loading) return <div className="rounded-[1.5rem] border bg-card p-6 text-sm text-muted-foreground shadow-sm">Đang tải điểm xanh...</div>;

  return (
    <div className="space-y-3 sm:space-y-4">
      {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

      <section className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Metric label="Tổng điểm hiện tại" value={String(points)} text="Số điểm có thể dùng để đổi ưu đãi." />
        <Metric label="Cấp bậc" value={rank} text="Xếp hạng dựa trên điểm xanh đã tích lũy." />
        <Metric label="CO2 saved" value={`${(data?.summary.totalCo2SavedKg ?? 0).toFixed(1)} kg`} text="Tác động môi trường từ các lịch đã hoàn thành." />
        <Metric label="Giao dịch điểm" value={String(data?.summary.transactionCount ?? 0)} text="Mỗi appointment chỉ được cộng một lần." />
      </section>

      <section className="rounded-[1.2rem] border bg-card p-4 shadow-sm sm:p-5 lg:rounded-[1.35rem]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Điểm xanh</div>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Hoàn thành lịch để nhận điểm</h2>
            <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:line-clamp-none">Điểm được tính từ khung giờ, thời gian chờ, mức ùn tắc và CO2 tiết kiệm.</p>
          </div>
          <div className="text-sm font-semibold">{points}/{nextTarget || points} điểm</div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <details className="rounded-[1.2rem] border bg-card p-4 shadow-sm sm:p-5 lg:rounded-[1.35rem]">
        <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">Cơ chế cộng điểm</summary>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5">
          <Formula label="Hoàn thành" value="+25" />
          <Formula label="Ít chờ" value="+0-35" />
          <Formula label="Ít ùn tắc" value="+0-35" />
          <Formula label="Thấp điểm" value="+0-28" />
          <Formula label="Eco bonus" value="Theo slot" />
        </div>
      </details>

      <section className="overflow-hidden rounded-[1.2rem] border bg-card shadow-sm lg:rounded-[1.35rem]">
        <div className="border-b px-4 py-3 font-semibold sm:px-5 sm:py-4">Lịch sử điểm</div>
        <div className="divide-y">
          {data?.credits.map((credit) => (
            <div key={credit.id} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-start">
              <div>
                <div className="font-medium">{credit.reason}</div>
                <div className="mt-1 text-sm text-muted-foreground">{credit.appointment.vehicle.plateNumber} - {credit.appointment.port.name} - {formatDateTime(credit.createdAt)}</div>
                <div className="mt-2 text-xs text-muted-foreground">Chờ {credit.appointment.estimatedWaitMinutes} phút - CO2 saved {credit.appointment.co2SavedKg} kg - {credit.appointment.timeSlot.congestionLevel}</div>
              </div>
              <div className="rounded-full border px-3 py-1 text-sm font-bold">+{credit.points}</div>
            </div>
          ))}
          {!data?.credits.length ? <div className="px-5 py-8 text-center text-sm text-muted-foreground">Chưa có điểm xanh. Hoàn thành lịch hẹn để hệ thống cấp điểm.</div> : null}
        </div>
      </section>
    </div>
  );
}

function greenRank(points: number) {
  if (points >= 2000) return "Green Elite";
  if (points >= 1000) return "Gold";
  if (points >= 500) return "Silver";
  if (points >= 100) return "Bronze";
  return "New Driver";
}

function nextRankTarget(points: number) {
  if (points < 100) return 100;
  if (points < 500) return 500;
  if (points < 1000) return 1000;
  if (points < 2000) return 2000;
  return 0;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function Metric({ label, value, text }: { label: string; value: string; text: string }) {
  return <div className="rounded-[1rem] border bg-card p-3 shadow-sm sm:rounded-[1.25rem] sm:p-5"><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-xs sm:tracking-[0.18em]">{label}</div><div className="mt-1 text-lg font-semibold tracking-[-0.04em] sm:mt-2 sm:text-2xl">{value}</div><p className="mt-2 hidden text-sm leading-6 text-muted-foreground sm:block">{text}</p></div>;
}

function Formula({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border bg-muted/20 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-2 text-lg font-semibold">{value}</div></div>;
}
