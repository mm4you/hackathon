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
    <div className="space-y-5">
      <section className="rounded-[2rem] border bg-muted/30 p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Báo cáo vận hành</div>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.05em]">Theo dõi hiệu quả đặt lịch vào cảng</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">Tổng hợp số booking, thời gian chờ, CO2 tiết kiệm, điểm xanh và các chỉ số chính để demo cho PM/client.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        {report.impactMetrics.map((metric) => <ImpactMetric key={metric.label} label={metric.label} value={metric.value} note={metric.note} />)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,28vw)]">
        <div className="rounded-[1.35rem] border bg-card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Operational Summary</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Hiệu quả điều phối</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Summary label="Tổng lịch" value={String(report.summary.totalAppointments)} />
            <Summary label="Hoàn thành" value={String(report.summary.completedAppointments)} />
            <Summary label="Chờ trung bình" value={`${report.summary.averageWaitMinutes} phút`} />
            <Summary label="CO2 saved" value={`${report.summary.totalCo2SavedKg} kg`} />
            <Summary label="Điểm xanh" value={String(report.summary.totalGreenPointsIssued)} />
            <Summary label="Ưu đãi đổi" value={String(report.summary.totalRedemptions)} />
          </div>
        </div>

        <div className="rounded-[1.35rem] border bg-card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hướng mở rộng</div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Từ đặt lịch đến check-in tự động</h2>
          <div className="mt-4 grid gap-3">
            <Roadmap title="Hiện trạng" text="Tài xế có thể phải chờ lâu, xử lý giấy tờ thủ công và dễ sai dữ liệu." />
            <Roadmap title="V2 hiện tại" text="AI đặt hẹn chủ động, slot xanh, lịch hẹn và điểm xanh sau completed." />
            <Roadmap title="Mở rộng" text={`QR/camera nhận diện biển số và container, mục tiêu mở cổng ${report.summary.gateProcessingTargetSeconds} giây.`} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
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
          {!report.topDrivers.length ? <div className="py-6 text-sm text-muted-foreground">Driver view không hiển thị bảng xếp hạng toàn hệ thống.</div> : null}
        </Panel>
      </section>
    </div>
  );
}

function ImpactMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <Card className="gap-2 rounded-[1.25rem] p-5 shadow-sm"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div><CardTitle className="text-2xl font-semibold tracking-[-0.04em]">{value}</CardTitle><CardDescription className="leading-6">{note}</CardDescription></Card>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border bg-muted/20 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-2 text-xl font-semibold">{value}</div></div>;
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
