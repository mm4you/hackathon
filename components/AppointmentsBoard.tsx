"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
type CurrentUser = { id: string; role: "ADMIN" | "OPERATOR" | "DRIVER" };

const statuses: AppointmentStatus[] = ["PENDING", "COMING", "COMPLETED", "LATE", "CANCELLED"];

export function AppointmentsBoard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkInBaseUrl] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));

  useEffect(() => {
    let cancelled = false;
    async function loadAppointments() {
      setLoading(true);
      setError("");
      const [meResponse, appointmentsResponse] = await Promise.all([fetch("/api/auth/me"), fetch("/api/appointments")]);
      const meJson = (await meResponse.json()) as ApiResponse<CurrentUser>;
      const appointmentsJson = (await appointmentsResponse.json()) as ApiResponse<Appointment[]>;
      if (cancelled) return;
      setLoading(false);
      if (!meResponse.ok || !appointmentsResponse.ok) return setError(meJson.error ?? appointmentsJson.error ?? "Không tải được lịch hẹn");
      setCurrentUser(meJson.data ?? null);
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
  const canUpdateStatus = currentUser?.role === "ADMIN" || currentUser?.role === "OPERATOR";

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        <ImpactCard label="Đang mở" value={`${activeCount} lịch`} text="Các lịch đang chờ tài xế đến hoặc đang được điều phối." />
        <ImpactCard label="Check-in" value="QR mobile" text="Tài xế có pass QR trên web mobile; cổng có thể quét để tra lịch và đối chiếu biển số." />
        <ImpactCard label="Hoàn thành" value={`${completedCount} lịch`} text={`Điểm xanh được cấp sau khi hoàn tất, CO2 tiết kiệm ước tính ${totalCo2.toFixed(1)} kg.`} />
      </section>

      {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">{message}</p> : null}

      <Card className="rounded-[1.35rem] shadow-sm">
        <CardContent className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bảng điều phối</div>
            <CardTitle className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Điều phối xe vào cảng</CardTitle>
            <CardDescription className="mt-2 leading-6">Theo dõi hành trình từ đặt lịch chủ động, vào cổng, hoàn tất và cấp điểm xanh.</CardDescription>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1">Mục tiêu xử lý cổng: 30 giây</Badge>
        </div>

        {loading ? <div className="mt-5 rounded-2xl border bg-muted/20 p-6 text-sm text-muted-foreground">Đang tải lịch hẹn...</div> : null}
        {!loading && !appointments.length ? <div className="mt-5 rounded-2xl border bg-muted/20 p-6 text-sm text-muted-foreground">Chưa có lịch hẹn. Hãy tạo booking để kiểm tra flow đặt lịch.</div> : null}

        <div className="mt-5 grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="rounded-2xl p-4 shadow-none">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={appointment.status} />
                    <RiskBadge risk={appointment.timeSlot.congestionLevel}>{appointment.timeSlot.congestionLevel}</RiskBadge>
                     {appointment.creditAwarded ? <Badge variant="secondary" className="rounded-full">Đã cấp điểm</Badge> : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em]">{appointment.vehicle.plateNumber} đến {appointment.port.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{appointment.driver.name} - {appointment.vehicle.vehicleType} - {formatDateTime(appointment.timeSlot.startTime)} đến {formatDateTime(appointment.timeSlot.endTime)}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{appointment.recommendationReason}</p>
                </div>

                <div className="grid shrink-0 grid-cols-3 gap-2 text-center lg:w-[330px]">
                  <MiniMetric label="Chờ" value={`${appointment.estimatedWaitMinutes}p`} />
                  <MiniMetric label="Điểm" value={`+${appointment.greenCreditEarned}`} />
                  <MiniMetric label="CO2" value={`${appointment.co2SavedKg}kg`} />
                </div>
              </div>

              {!canUpdateStatus ? <CheckInPass appointment={appointment} baseUrl={checkInBaseUrl} /> : null}

              <div className="mt-4 flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-xs leading-5 text-muted-foreground">Admin/operator cập nhật trạng thái; tài xế dùng QR mobile khi đến cổng.</div>
                {canUpdateStatus ? <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {statuses.map((status) => <Button key={status} disabled={updatingId === appointment.id || appointment.status === status} onClick={() => updateStatus(appointment.id, status)} variant="outline" size="sm" className="rounded-full text-xs sm:w-auto">{status}</Button>)}
                </div> : <div className="rounded-full border bg-muted/20 px-3 py-1.5 text-xs font-semibold text-muted-foreground">Driver view: chờ điều phối cập nhật trạng thái</div>}
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
  if (!baseUrl || appointment.status === "COMPLETED" || appointment.status === "CANCELLED") return null;

  const checkInUrl = `${baseUrl}/appointments?checkin=${appointment.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(checkInUrl)}`;

  return (
    <div className="mt-4 grid gap-3 rounded-2xl border bg-muted/20 p-3 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
      <Image src={qrUrl} alt={`QR check-in cho lịch ${appointment.vehicle.plateNumber}`} width={120} height={120} unoptimized className="mx-auto size-[120px] rounded-xl border bg-white p-2 sm:mx-0" />
      <div className="min-w-0 text-sm leading-6">
        <div className="font-semibold">QR check-in cổng</div>
        <div className="mt-1 text-muted-foreground">Đưa mã này cho bảo vệ/cổng quét để đối chiếu lịch, biển số {appointment.vehicle.plateNumber} và khung giờ đã đặt.</div>
        <div className="mt-2 truncate rounded-lg border bg-background px-3 py-2 font-mono text-[11px] text-muted-foreground">{checkInUrl}</div>
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function ImpactCard({ label, value, text }: { label: string; value: string; text: string }) {
  return <Card className="gap-2 rounded-[1.25rem] p-5 shadow-sm"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div><CardTitle className="text-xl font-semibold tracking-[-0.04em]">{value}</CardTitle><CardDescription className="leading-6">{text}</CardDescription></Card>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-muted/20 px-3 py-2"><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 text-sm font-bold">{value}</div></div>;
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const className = status === "CANCELLED" ? "border-destructive/30 bg-destructive/10 text-destructive" : "bg-muted/30";
  return <Badge variant="outline" className={`rounded-full ${className}`}>{status}</Badge>;
}

function RiskBadge({ risk, children }: { risk: Appointment["timeSlot"]["congestionLevel"]; children: React.ReactNode }) {
  const className = risk === "HIGH" ? "border-destructive/30 bg-destructive/10 text-destructive" : "bg-muted/30";
  return <Badge variant="outline" className={`rounded-full ${className}`}>{children}</Badge>;
}
