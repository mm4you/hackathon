"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

type AppointmentStatus = "PENDING" | "COMING" | "COMPLETED" | "LATE" | "CANCELLED";
type Appointment = {
  id: string;
  status: AppointmentStatus;
  preferredTime: string;
  optimizationPreference: string;
  recommendationReason: string;
  estimatedWaitMinutes: number;
  greenCreditEarned: number;
  co2SavedKg: number;
  creditAwarded: boolean;
  driver: { id: string; name: string; email: string; greenPoints: number };
  vehicle: { id: string; plateNumber: string; vehicleType: string };
  port: { id: string; name: string; address: string };
  timeSlot: { id: string; startTime: string; endTime: string; congestionLevel: "LOW" | "MEDIUM" | "HIGH"; capacity: number; bookedCount: number };
};

type ApiResponse<T> = { data?: T; error?: string };
type CurrentUserRole = "ADMIN" | "OPERATOR" | "DRIVER";
type CheckInTokenResponse = { token: string; expiresInSeconds: number };

const statusActions: { status: AppointmentStatus; label: string; variant?: "default" | "outline" | "destructive" }[] = [
  { status: "COMING", label: "Xe sắp đến", variant: "default" },
  { status: "COMPLETED", label: "Hoàn thành", variant: "default" },
  { status: "LATE", label: "Báo trễ", variant: "outline" },
  { status: "CANCELLED", label: "Hủy lịch", variant: "destructive" },
];

export function AppointmentsBoard({ currentUserRole }: { currentUserRole: CurrentUserRole }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkInBaseUrl] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));

  useEffect(() => {
    let cancelled = false;
    async function loadAppointments() {
      setLoading(true);
      setError("");
      const appointmentsResponse = await fetch("/api/appointments");
      const appointmentsJson = (await appointmentsResponse.json()) as ApiResponse<Appointment[]>;
      if (cancelled) return;
      setLoading(false);
      if (!appointmentsResponse.ok) return setError(appointmentsJson.error ?? "Không tải được lịch hẹn");
      setAppointments(appointmentsJson.data ?? []);
    }
    loadAppointments().catch(() => {
      if (!cancelled) {
        setLoading(false);
        setError("Không tải được lịch hẹn");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateStatus(id: string, status: AppointmentStatus) {
    setUpdatingId(id);
    setError("");
    setMessage("");
    const response = await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const json = (await response.json()) as ApiResponse<Appointment>;
    setUpdatingId("");
    if (!response.ok) return setError(json.error ?? "Không cập nhật được trạng thái");
    if (json.data) setAppointments((items) => items.map((item) => (item.id === id ? json.data as Appointment : item)));
    refreshAppointments();
    setMessage(status === "COMPLETED" ? "Đã hoàn thành lịch hẹn. Điểm xanh sẽ được cộng một lần nếu chưa cộng." : "Đã cập nhật trạng thái lịch hẹn.");
  }

  async function refreshAppointments() {
    const response = await fetch("/api/appointments");
    const json = (await response.json()) as ApiResponse<Appointment[]>;
    if (response.ok) setAppointments(json.data ?? []);
  }

  const activeCount = appointments.filter((item) => item.status === "PENDING" || item.status === "COMING").length;
  const completedCount = appointments.filter((item) => item.status === "COMPLETED").length;
  const totalCo2 = appointments.reduce((sum, item) => sum + item.co2SavedKg, 0);
  const canUpdateStatus = currentUserRole === "ADMIN" || currentUserRole === "OPERATOR";
  const canShowQr = currentUserRole === "DRIVER";

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="grid grid-cols-3 gap-2 md:gap-3">
        <ImpactCard label="Đang mở" value={`${activeCount} lịch`} text="Các lịch đang chờ tài xế đến hoặc đang được điều phối." />
        <ImpactCard label="Check-in" value={canShowQr ? "Mã QR" : "Điều phối"} text={canShowQr ? "Mở mã QR trên điện thoại để cổng đối chiếu lịch và biển số." : "Điều phối viên cập nhật trạng thái lịch tại cổng."} />
        <ImpactCard label="Hoàn thành" value={`${completedCount} lịch`} text={`Điểm xanh được cấp sau khi hoàn tất, CO2 tiết kiệm ước tính ${totalCo2.toFixed(1)} kg.`} />
      </section>

      {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">{message}</p> : null}

      <Card className="rounded-[1.2rem] shadow-sm lg:rounded-[1.35rem]">
        <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Bảng điều phối</div>
            <CardTitle className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Điều phối xe vào cảng</CardTitle>
            <CardDescription className="mt-2 line-clamp-2 leading-6 sm:line-clamp-none">Theo dõi hành trình từ đặt lịch chủ động, vào cổng, hoàn tất và cấp điểm xanh.</CardDescription>
          </div>
          <Badge variant="outline" className="w-fit rounded-full px-3 py-1">30 giây/cổng</Badge>
        </div>

        {loading ? <div className="mt-5 rounded-2xl border bg-muted/20 p-6 text-sm text-muted-foreground">Đang tải lịch hẹn...</div> : null}
        {!loading && !appointments.length ? <div className="mt-5 rounded-2xl border bg-muted/20 p-6 text-sm text-muted-foreground">Chưa có lịch hẹn. Hãy tạo booking để kiểm tra flow đặt lịch.</div> : null}

        <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="gap-0 rounded-2xl p-3 shadow-none sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={appointment.status} />
                    <RiskBadge risk={appointment.timeSlot.congestionLevel}>{congestionLabel(appointment.timeSlot.congestionLevel)}</RiskBadge>
                     {appointment.creditAwarded ? <Badge variant="secondary" className="rounded-full">Đã cấp điểm</Badge> : null}
                  </div>
                  <h3 className="mt-3 truncate text-lg font-semibold tracking-[-0.03em]">{appointment.vehicle.plateNumber} đến {appointment.port.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(appointment.timeSlot.startTime)} - {formatDateTime(appointment.timeSlot.endTime)}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">{appointment.driver.name} - {appointment.vehicle.vehicleType}</p>
                </div>

                <div className="grid shrink-0 grid-cols-3 gap-2 text-center lg:w-[330px]">
                  <MiniMetric label="Chờ" value={`${appointment.estimatedWaitMinutes}p`} />
                  <MiniMetric label="Điểm" value={`+${appointment.greenCreditEarned}`} />
                  <MiniMetric label="CO2" value={`${appointment.co2SavedKg}kg`} />
                </div>
              </div>

              {canShowQr ? <CheckInPass appointment={appointment} baseUrl={checkInBaseUrl} /> : null}

              {canUpdateStatus ? <StatusTimeline status={appointment.status} /> : null}

              <details className="mt-3 rounded-2xl border bg-muted/20 p-3">
                <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">Chi tiết lịch hẹn</summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{appointment.recommendationReason}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <Info label="Tài xế" value={appointment.driver.name} />
                  <Info label="Xe" value={appointment.vehicle.vehicleType} />
                  <Info label="Cảng" value={appointment.port.name} />
                  <Info label="Slot" value={`${appointment.timeSlot.bookedCount}/${appointment.timeSlot.capacity}`} />
                </div>
              </details>

              <div className="mt-4 flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-xs leading-5 text-muted-foreground">{canUpdateStatus ? "Chọn trạng thái mới cho lịch này." : "Tài xế dùng QR khi đến cổng."}</div>
                {canUpdateStatus ? <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {appointment.status !== "PENDING" ? <Button disabled={updatingId === appointment.id} onClick={() => updateStatus(appointment.id, "PENDING")} variant="outline" size="sm" className="rounded-full text-xs sm:w-auto">Đưa về chờ</Button> : null}
                  {statusActions.map((action) => <Button key={action.status} disabled={updatingId === appointment.id || appointment.status === action.status || appointment.status === "COMPLETED" || appointment.status === "CANCELLED"} onClick={() => updateStatus(appointment.id, action.status)} variant={action.variant ?? "outline"} size="sm" className="rounded-full text-xs sm:w-auto">{action.label}</Button>)}
                </div> : <div className="rounded-full border bg-muted/20 px-3 py-1.5 text-xs font-semibold text-muted-foreground">Chờ cổng cập nhật trạng thái</div>}
              </div>
            </Card>
          ))}
        </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckInPass({ appointment, baseUrl }: { appointment: Appointment; baseUrl: string }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [qrError, setQrError] = useState("");
  const [checkInUrl, setCheckInUrl] = useState("");

  useEffect(() => {
    if (!open || !baseUrl || appointment.status === "COMPLETED" || appointment.status === "CANCELLED") return;
    let cancelled = false;
    async function createQr() {
      setQrError("");
      setQrDataUrl("");
      const response = await fetch(`/api/appointments/${appointment.id}/check-in-token`, { method: "POST" });
      const json = (await response.json()) as ApiResponse<CheckInTokenResponse>;
      if (cancelled) return;
      if (!response.ok || !json.data?.token) {
        setQrError(json.error ?? "Không tạo được mã QR");
        return;
      }
      const nextCheckInUrl = `${baseUrl}/check-in?token=${encodeURIComponent(json.data.token)}`;
      setCheckInUrl(nextCheckInUrl);
      QRCode.toDataURL(nextCheckInUrl, { width: 320, margin: 2, errorCorrectionLevel: "M" }).then((value) => {
        if (!cancelled) setQrDataUrl(value);
      }).catch(() => {
        if (!cancelled) setQrError("Không tạo được mã QR");
      });
    }
    createQr().catch(() => {
      if (!cancelled) setQrError("Không tạo được mã QR");
    });
    return () => {
      cancelled = true;
    };
  }, [appointment.id, appointment.status, baseUrl, open]);

  if (!baseUrl || appointment.status === "COMPLETED" || appointment.status === "CANCELLED") return null;

  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-between gap-3 rounded-2xl border bg-muted/20 px-4 py-3 text-left transition hover:bg-muted/40">
        <span>
          <span className="block text-sm font-semibold">Mã QR vào cổng</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">Bấm để mở mã lớn cho cổng quét</span>
        </span>
        <span className="rounded-full border bg-background px-3 py-1 text-xs font-semibold">Mở QR</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="QR check-in">
          <div className="w-full max-w-sm rounded-[1.6rem] border bg-card p-4 text-center shadow-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Mã QR vào cổng</div>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em]">{appointment.vehicle.plateNumber}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{appointment.port.name} - {formatDateTime(appointment.timeSlot.startTime)}</p>

            <div className="mt-4 rounded-[1.4rem] border bg-white p-4">
              {qrDataUrl ? <Image src={qrDataUrl} alt={`QR check-in cho lịch ${appointment.vehicle.plateNumber}`} width={280} height={280} unoptimized className="mx-auto size-[260px] sm:size-[280px]" /> : <div className="mx-auto grid size-[260px] place-items-center rounded-xl bg-background p-3 text-center text-sm text-muted-foreground">{qrError || "Đang tạo QR..."}</div>}
            </div>

            {checkInUrl ? <div className="mt-3 truncate rounded-xl border bg-background px-3 py-2 font-mono text-[11px] text-muted-foreground">{checkInUrl}</div> : null}
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Đưa màn hình này cho bảo vệ/cổng quét để đối chiếu lịch và biển số.</p>
            <Button onClick={() => setOpen(false)} className="mt-4 h-11 w-full rounded-2xl font-semibold">Đóng</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function ImpactCard({ label, value, text }: { label: string; value: string; text: string }) {
  return <Card className="gap-1 rounded-[1rem] p-3 shadow-sm sm:gap-2 sm:rounded-[1.25rem] sm:p-5"><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-xs sm:tracking-[0.18em]">{label}</div><CardTitle className="text-base font-semibold tracking-[-0.04em] sm:text-xl">{value}</CardTitle><CardDescription className="hidden leading-6 sm:block">{text}</CardDescription></Card>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-muted/20 px-3 py-2"><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 text-sm font-bold">{value}</div></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-background p-2"><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 truncate font-medium">{value}</div></div>;
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const className = status === "COMPLETED" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : status === "COMING" ? "border-sky-500/30 bg-sky-500/10 text-sky-300" : status === "LATE" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : status === "CANCELLED" ? "border-destructive/30 bg-destructive/10 text-destructive" : "bg-muted/30";
  return <Badge variant="outline" className={`rounded-full ${className}`}>{statusLabel(status)}</Badge>;
}

function RiskBadge({ risk, children }: { risk: Appointment["timeSlot"]["congestionLevel"]; children: React.ReactNode }) {
  const className = risk === "HIGH" ? "border-destructive/30 bg-destructive/10 text-destructive" : risk === "MEDIUM" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  return <Badge variant="outline" className={`rounded-full ${className}`}>{children}</Badge>;
}

function StatusTimeline({ status }: { status: AppointmentStatus }) {
  const steps: { status: AppointmentStatus; label: string }[] = [
    { status: "PENDING", label: "Chờ" },
    { status: "COMING", label: "Đến cổng" },
    { status: "COMPLETED", label: "Hoàn tất" },
  ];
  const currentIndex = status === "LATE" ? 1 : status === "CANCELLED" ? 0 : Math.max(0, steps.findIndex((step) => step.status === status));

  return (
    <div className="mt-3 rounded-2xl border bg-muted/20 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tiến trình</div>
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => {
          const active = index <= currentIndex && status !== "CANCELLED";
          return <div key={step.status} className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>{step.label}</div>;
        })}
      </div>
      {status === "LATE" ? <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">Xe đang trễ, cần điều phối lại tại cổng.</div> : null}
      {status === "CANCELLED" ? <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">Lịch đã hủy, không thể cập nhật tiếp.</div> : null}
    </div>
  );
}

function statusLabel(status: AppointmentStatus) {
  if (status === "PENDING") return "Chờ xử lý";
  if (status === "COMING") return "Xe sắp đến";
  if (status === "COMPLETED") return "Hoàn thành";
  if (status === "LATE") return "Trễ giờ";
  return "Đã hủy";
}

function congestionLabel(level: Appointment["timeSlot"]["congestionLevel"]) {
  if (level === "LOW") return "Ít ùn tắc";
  if (level === "MEDIUM") return "Cần theo dõi";
  return "Đông xe";
}
