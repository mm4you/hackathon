"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ReportData = {
  scope: "DRIVER" | "OPERATIONS";
  summary: {
    todayAppointments: number;
    totalAppointments: number;
    completedAppointments: number;
    averageWaitMinutes: number;
    totalCo2SavedKg: number;
    totalGreenPointsIssued: number;
    totalRedemptions: number;
    greenSlotRate: number;
    manualMinutesSaved: number;
    gateProcessingTargetSeconds: number;
    costSavingEstimateVnd: number;
  };
  congestionMix: { LOW: number; MEDIUM: number; HIGH: number; total: number };
  recentAppointments: Appointment[];
  recentActivities: { id: string; type: string; message: string; createdAt: string }[];
  bestGreenSlots: TimeSlot[];
};

type Appointment = {
  id: string;
  status: string;
  estimatedWaitMinutes: number;
  greenCreditEarned: number;
  co2SavedKg: number;
  createdAt: string;
  driver?: { name: string };
  vehicle?: { plateNumber: string; vehicleType: string };
  port?: { name: string };
  timeSlot?: { startTime: string; endTime: string; congestionLevel: string };
};

type TimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  congestionLevel: "LOW" | "MEDIUM" | "HIGH";
  estimatedWaitMinutes: number;
  greenBonus: number;
  capacity: number;
  bookedCount: number;
  port?: { name: string };
};

type ApiResponse<T> = { data?: T; error?: string };

export function DashboardOverview({ cacheKey }: { cacheKey: string }) {
  const [report, setReport] = useState<ReportData | null>(() => readClientCache<ReportData>(cacheKey));
  const [loading, setLoading] = useState(() => !readClientCache<ReportData>(cacheKey));
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/reports");
      const json = (await response.json()) as ApiResponse<ReportData>;
      if (cancelled) return;
      setLoading(false);
      if (!response.ok) return setError(json.error ?? "Không tải được dashboard");
      writeClientCache(cacheKey, json.data ?? null);
      setReport(json.data ?? null);
    }
    load().catch(() => {
      if (!cancelled) {
        setLoading(false);
        setError("Không tải được dashboard");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  if (loading) return <div className="rounded-[1.5rem] border bg-card p-6 text-sm text-muted-foreground shadow-sm">Đang tải dashboard...</div>;
  if (error || !report) return <div className="rounded-[1.5rem] border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error || "Không có dữ liệu dashboard"}</div>;

  const isOperations = report.scope === "OPERATIONS";

  return (
    <div className="space-y-3 sm:space-y-5">
      <section className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <Metric label={isOperations ? "Lượt xe hôm nay" : "Lịch của tôi hôm nay"} value={String(report.summary.todayAppointments)} text="Booking tạo trong ngày hiện tại." />
        <Metric label="Thời gian chờ TB" value={`${report.summary.averageWaitMinutes} phút`} text="Theo dõi mức chờ trung bình của các lịch gần đây." />
        <Metric label={isOperations ? "Điểm xanh đã phát" : "Điểm xanh của tôi"} value={String(report.summary.totalGreenPointsIssued)} text="Dùng để đổi ưu đãi hoặc theo dõi hành vi đúng lịch." />
        <Metric label="CO2 saved" value={`${report.summary.totalCo2SavedKg} kg`} text="Tác động môi trường từ lịch đã hoàn thành." />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(340px,26vw)] xl:gap-5">
        <Card className="rounded-[1.2rem] shadow-sm lg:rounded-[1.35rem]">
          <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Tình trạng slot</div>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Khung giờ hôm nay</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground sm:line-clamp-none">Xem nhanh slot thoáng, slot cần theo dõi và slot nên tránh trong ngày.</p>
            </div>
            {!isOperations ? <Link href="/booking" className="w-full rounded-2xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 sm:w-fit sm:py-2.5">Đặt lịch xanh</Link> : <Link href="/appointments" className="w-full rounded-2xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 sm:w-fit sm:py-2.5">Điều phối lịch</Link>}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
            <Congestion label="Thoáng" count={report.congestionMix.LOW} tone="green" />
            <Congestion label="Cần theo dõi" count={report.congestionMix.MEDIUM} tone="amber" />
            <Congestion label="Cảnh báo kẹt xe" count={report.congestionMix.HIGH} tone="rose" />
          </div>

          <details className="mt-4 rounded-[1.2rem] border bg-muted/30 p-3 sm:mt-5 sm:p-5">
             <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">Slot đề xuất</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {report.bestGreenSlots.map((slot) => <SlotCard key={slot.id} slot={slot} />)}
              {!report.bestGreenSlots.length ? <div className="text-sm text-muted-foreground">Chưa có slot hôm nay.</div> : null}
            </div>
          </details>
          </CardContent>
        </Card>

        <Card className="rounded-[1.2rem] shadow-sm lg:rounded-[1.35rem]">
          <CardContent className="p-4 sm:p-5">
          <details>
          <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">Quy trình vận hành</summary>
          <div className="mt-3 grid gap-2 sm:gap-3">
            <Loop label="Đặt lịch" text="Hệ thống đề xuất khung giờ ít ùn tắc hơn." />
            <Loop label="Vào cổng" text={`Mục tiêu xử lý tại cổng: ${report.summary.gateProcessingTargetSeconds} giây.`} />
            <Loop label="Nhận điểm" text={`${report.summary.completedAppointments} lịch hoàn thành, ${report.summary.totalRedemptions} ưu đãi đã đổi.`} />
          </div>
          </details>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(340px,26vw)] xl:gap-5">
        <Panel title={isOperations ? "Lịch hẹn gần đây của toàn hệ thống" : "Lịch hẹn gần đây của tôi"}>
          {report.recentAppointments.map((item) => <AppointmentRow key={item.id} appointment={item} />)}
          {!report.recentAppointments.length ? <Empty text="Chưa có lịch hẹn." /> : null}
        </Panel>
        <Card className="gap-0 overflow-hidden rounded-[1.2rem] py-0 shadow-sm lg:rounded-[1.35rem]">
          <details>
            <summary className="cursor-pointer list-none border-b px-4 py-3 font-semibold sm:px-5 sm:py-4 [&::-webkit-details-marker]:hidden">Hoạt động gần đây</summary>
            <div className="divide-y">
              {report.recentActivities.map((item) => <ActivityRow key={item.id} activity={item} />)}
              {!report.recentActivities.length ? <Empty text="Chưa có hoạt động gần đây." /> : null}
            </div>
          </details>
        </Card>
      </section>
    </div>
  );
}

function readClientCache<T>(key: string) {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function writeClientCache<T>(key: string, value: T) {
  if (typeof window === "undefined" || !value) return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function Metric({ label, value, text }: { label: string; value: string; text: string }) {
  return <Card className="gap-1 rounded-[1rem] p-3 shadow-sm sm:gap-2 sm:rounded-[1.25rem] sm:p-5"><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</div><CardTitle className="text-lg font-semibold tracking-[-0.04em] sm:text-2xl">{value}</CardTitle><CardDescription className="hidden leading-6 sm:block">{text}</CardDescription></Card>;
}

function Congestion({ label, count, tone }: { label: string; count: number; tone: "green" | "amber" | "rose" }) {
  const colors = { green: "border-border bg-muted/30", amber: "border-border bg-muted/30", rose: "border-border bg-muted/30" };
  return <Card className={`gap-1 rounded-[1rem] p-3 text-center shadow-none sm:rounded-[1.3rem] sm:p-4 sm:text-left ${colors[tone]}`}><div className="text-xs font-semibold sm:text-sm">{label}</div><div className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{count}</div><div className="text-[10px] opacity-75 sm:text-xs">khung giờ</div></Card>;
}

function SlotCard({ slot }: { slot: TimeSlot }) {
  const utilization = slot.capacity ? Math.round((slot.bookedCount / slot.capacity) * 100) : 100;
  return <div className="rounded-2xl border bg-background p-3"><div className="text-sm font-semibold">{formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime)}</div><div className="mt-1 text-xs text-muted-foreground">{slot.port?.name ?? "Cảng"}</div><div className="mt-3 flex items-center justify-between text-xs"><span>{slot.estimatedWaitMinutes} phút chờ</span><span className="font-semibold">+{slot.greenBonus}</span></div><div className="mt-2 text-xs text-muted-foreground">Tải slot {utilization}%</div></div>;
}

function Loop({ label, text }: { label: string; text: string }) {
  return <div className="rounded-2xl border bg-muted/20 p-4"><div className="font-semibold">{label}</div><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="gap-0 overflow-hidden rounded-[1.2rem] py-0 shadow-sm lg:rounded-[1.35rem]"><CardHeader className="border-b px-4 py-3 sm:px-5 sm:py-4"><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="divide-y px-0">{children}</CardContent></Card>;
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  return <div className="px-5 py-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-medium">{appointment.vehicle?.plateNumber ?? "Xe"} đến {appointment.port?.name ?? "cảng"}</div><div className="mt-1 text-sm text-muted-foreground">{appointment.driver?.name ?? "Driver"} - {appointment.status} - {formatDateTime(appointment.createdAt)}</div></div><Badge variant="secondary" className="w-fit rounded-full">+{appointment.greenCreditEarned} điểm</Badge></div></div>;
}

function ActivityRow({ activity }: { activity: { type: string; message: string; createdAt: string } }) {
  return <div className="px-5 py-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{activity.type}</span><span className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</span></div><div className="mt-2 text-sm">{activity.message}</div></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="px-5 py-8 text-center text-sm text-muted-foreground">{text}</div>;
}
