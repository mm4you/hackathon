"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ReportData = {
  scope: "DRIVER" | "OPERATIONS";
  summary: {
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
  appointmentsByStatus: { status: string; count: number }[];
  congestionMix: { LOW: number; MEDIUM: number; HIGH: number; total: number };
  topDrivers: { id: string; name: string; email: string; greenPoints: number }[];
  impactMetrics: { label: string; value: string; note: string }[];
};

type ApiResponse<T> = { data?: T; error?: string };

export function ReportsView() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/reports");
      const json = (await response.json()) as ApiResponse<ReportData>;
      if (cancelled) return;
      setLoading(false);
      if (!response.ok) return setError(json.error ?? "Không tải được báo cáo");
      setReport(json.data ?? null);
    }
    load().catch(() => {
      if (!cancelled) {
        setLoading(false);
        setError("Không tải được báo cáo");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="rounded-[1.5rem] border bg-card p-6 text-sm text-muted-foreground shadow-sm">Đang tải báo cáo...</div>;
  if (error || !report) return <div className="rounded-[1.5rem] border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error || "Không có dữ liệu báo cáo"}</div>;

  return (
    <div className="space-y-3 sm:space-y-5">
      <section className="rounded-[1.2rem] border bg-muted/30 p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Báo cáo vận hành</div>
        <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-[-0.05em] sm:mt-3 sm:text-3xl">Hiệu quả đặt lịch vào cảng</h2>
        <p className="mt-2 line-clamp-2 max-w-4xl text-sm leading-6 text-muted-foreground sm:mt-3 sm:line-clamp-none">Tổng hợp số lịch, thời gian chờ, CO2 tiết kiệm, điểm xanh và hiệu quả vận hành.</p>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5">
        {report.impactMetrics.map((metric) => <ImpactMetric key={metric.label} label={metric.label} value={metric.value} note={metric.note} />)}
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(340px,26vw)] xl:gap-5">
        <div className="rounded-[1.2rem] border bg-card p-4 shadow-sm sm:p-5 lg:rounded-[1.35rem]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Tổng quan vận hành</div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Hiệu quả điều phối</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 xl:grid-cols-3">
            <Summary label="Tổng lịch" value={String(report.summary.totalAppointments)} />
            <Summary label="Hoàn thành" value={String(report.summary.completedAppointments)} />
            <Summary label="Chờ trung bình" value={`${report.summary.averageWaitMinutes} phút`} />
            <Summary label="CO2 saved" value={`${report.summary.totalCo2SavedKg} kg`} />
            <Summary label="Điểm xanh" value={String(report.summary.totalGreenPointsIssued)} />
            <Summary label="Ưu đãi đổi" value={String(report.summary.totalRedemptions)} />
          </div>
        </div>

        <div className="rounded-[1.2rem] border bg-card p-4 shadow-sm sm:p-5 lg:rounded-[1.35rem]">
          <details>
          <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">Hướng mở rộng check-in</summary>
          <div className="mt-3 grid gap-2 sm:gap-3">
            <Roadmap title="Hiện trạng" text="Tài xế có thể phải chờ lâu, xử lý giấy tờ thủ công và dễ sai dữ liệu." />
            <Roadmap title="V2 hiện tại" text="AI đặt hẹn chủ động, slot xanh, lịch hẹn và điểm xanh sau completed." />
            <Roadmap title="Mở rộng" text={`QR và camera đối chiếu biển số, mục tiêu xử lý tại cổng ${report.summary.gateProcessingTargetSeconds} giây.`} />
          </div>
          </details>
        </div>
      </section>

      <details className="rounded-[1.2rem] border bg-card p-4 shadow-sm lg:rounded-[1.35rem]">
        <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">Biểu đồ và bảng xếp hạng</summary>
      <section className="mt-3 grid gap-3 lg:grid-cols-3 lg:gap-5">
        <Panel title="Trạng thái lịch hẹn">
          {report.appointmentsByStatus.map((item) => <Bar key={item.status} label={item.status} value={item.count} total={Math.max(1, report.summary.totalAppointments)} />)}
        </Panel>
        <Panel title="Mức ùn tắc slot hôm nay">
          <Bar label="LOW" value={report.congestionMix.LOW} total={Math.max(1, report.congestionMix.total)} tone="green" />
          <Bar label="MEDIUM" value={report.congestionMix.MEDIUM} total={Math.max(1, report.congestionMix.total)} tone="amber" />
          <Bar label="HIGH" value={report.congestionMix.HIGH} total={Math.max(1, report.congestionMix.total)} tone="rose" />
        </Panel>
        <Panel title="Top Green Drivers">
          {report.topDrivers.map((driver) => <DriverRow key={driver.id} driver={driver} />)}
          {!report.topDrivers.length ? <div className="py-6 text-sm text-muted-foreground">Không có dữ liệu xếp hạng để hiển thị.</div> : null}
        </Panel>
      </section>
      </details>
    </div>
  );
}

function ImpactMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <Card className="gap-1 rounded-[1rem] p-3 shadow-sm sm:gap-2 sm:rounded-[1.25rem] sm:p-5"><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-xs sm:tracking-[0.16em]">{label}</div><CardTitle className="text-lg font-semibold tracking-[-0.04em] sm:text-2xl">{value}</CardTitle><CardDescription className="hidden leading-6 sm:block">{note}</CardDescription></Card>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border bg-muted/20 p-3 sm:p-4"><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</div><div className="mt-1 text-lg font-semibold sm:mt-2 sm:text-xl">{value}</div></div>;
}

function Roadmap({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border bg-muted/20 p-4"><div className="font-semibold">{title}</div><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="rounded-[1.35rem] shadow-sm"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="space-y-3">{children}</CardContent></Card>;
}

function Bar({ label, value, total, tone = "slate" }: { label: string; value: number; total: number; tone?: "slate" | "green" | "amber" | "rose" }) {
  const colors = { slate: "bg-foreground", green: "bg-foreground", amber: "bg-foreground", rose: "bg-foreground" };
  return <div><div className="flex items-center justify-between text-sm"><span className="font-medium text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${Math.round((value / total) * 100)}%` }} /></div></div>;
}

function DriverRow({ driver }: { driver: { name: string; email: string; greenPoints: number } }) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/20 px-4 py-3"><div><div className="font-medium">{driver.name}</div><div className="text-sm text-muted-foreground">{driver.email}</div></div><div className="font-semibold">{driver.greenPoints}</div></div>;
}
