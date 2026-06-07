import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { verifyCheckInToken } from "@/lib/checkInToken";
import { prisma } from "@/lib/prisma";

type CheckInPageProps = {
  searchParams: Promise<{ token?: string }>;
};

type CheckInAppointment = {
  id: string;
  status: string;
  estimatedWaitMinutes: number;
  greenCreditEarned: number;
  co2SavedKg: number;
  driver: { name: string; email: string; phone: string | null; company: { name: string; type: string; contactPhone: string | null } | null };
  vehicle: { plateNumber: string; vehicleType: string; capacityNote: string | null };
  port: { name: string; address: string };
  timeSlot: { startTime: Date; endTime: Date; congestionLevel: string };
};

export const dynamic = "force-dynamic";

export default async function CheckInPage({ searchParams }: CheckInPageProps) {
  const { token = "" } = await searchParams;
  const payload = verifyCheckInToken(token);

  if (!payload) return <CheckInShell><InvalidCard /></CheckInShell>;

  const appointment = await prisma.appointment.findUnique({
    where: { id: payload.appointmentId },
    select: {
      id: true,
      status: true,
      estimatedWaitMinutes: true,
      greenCreditEarned: true,
      co2SavedKg: true,
      driver: { select: { name: true, email: true, phone: true, company: { select: { name: true, type: true, contactPhone: true } } } },
      vehicle: { select: { plateNumber: true, vehicleType: true, capacityNote: true } },
      port: { select: { name: true, address: true } },
      timeSlot: { select: { startTime: true, endTime: true, congestionLevel: true } },
    },
  }) as CheckInAppointment | null;

  if (!appointment) return <CheckInShell><InvalidCard message="Không tìm thấy lịch hẹn." /></CheckInShell>;

  return (
    <CheckInShell>
      <Card className="rounded-[1.5rem] shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Xác thực vào cổng</div>
              <CardTitle className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{appointment.vehicle.plateNumber}</CardTitle>
              <CardDescription className="mt-2 leading-6">{appointment.port.name} - {formatDateTime(appointment.timeSlot.startTime)} đến {formatDateTime(appointment.timeSlot.endTime)}</CardDescription>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <MiniMetric label="Chờ" value={`${appointment.estimatedWaitMinutes}p`} />
            <MiniMetric label="Điểm" value={`+${appointment.greenCreditEarned}`} />
            <MiniMetric label="CO2" value={`${appointment.co2SavedKg}kg`} />
          </div>

          <section className="mt-5 grid gap-3">
            <InfoGroup title="Tài xế" items={[
              ["Họ tên", appointment.driver.name],
              ["Email", appointment.driver.email],
              ["Số điện thoại", appointment.driver.phone || "Chưa cập nhật"],
            ]} />
            <InfoGroup title="Công ty" items={[
              ["Tên công ty", appointment.driver.company?.name || "Chưa gắn công ty"],
              ["Loại tổ chức", companyTypeLabel(appointment.driver.company?.type)],
              ["Liên hệ", appointment.driver.company?.contactPhone || "Chưa cập nhật"],
            ]} />
            <InfoGroup title="Phương tiện" items={[
              ["Biển số", appointment.vehicle.plateNumber],
              ["Loại xe", appointment.vehicle.vehicleType],
              ["Ghi chú tải", appointment.vehicle.capacityNote || "Không có"],
            ]} />
            <InfoGroup title="Cổng/cảng" items={[
              ["Cảng", appointment.port.name],
              ["Địa chỉ", appointment.port.address],
              ["Mức ùn tắc", congestionLabel(appointment.timeSlot.congestionLevel)],
            ]} />
          </section>
        </CardContent>
      </Card>
    </CheckInShell>
  );
}

function CheckInShell({ children }: { children: React.ReactNode }) {
  return <main className="dark min-h-dvh bg-background p-3 text-foreground sm:p-6"><div className="mx-auto max-w-xl">{children}</div></main>;
}

function InvalidCard({ message = "Mã QR không hợp lệ hoặc đã hết hạn." }: { message?: string }) {
  return <Card className="rounded-[1.5rem] shadow-sm"><CardContent className="p-5"><CardTitle className="text-xl">Không thể xác thực</CardTitle><CardDescription className="mt-2 leading-6">{message}</CardDescription></CardContent></Card>;
}

function InfoGroup({ title, items }: { title: string; items: string[][] }) {
  return <div className="rounded-2xl border bg-muted/20 p-4"><div className="font-semibold">{title}</div><div className="mt-3 grid gap-2">{items.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="max-w-[60%] text-right font-medium">{value}</span></div>)}</div></div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-muted/20 px-3 py-2"><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 text-sm font-bold">{value}</div></div>;
}

function StatusBadge({ status }: { status: string }) {
  const text = status === "PENDING" ? "Chờ xử lý" : status === "COMING" ? "Xe sắp đến" : status === "COMPLETED" ? "Hoàn thành" : status === "LATE" ? "Trễ giờ" : "Đã hủy";
  return <Badge variant="outline" className="w-fit rounded-full px-3 py-1">{text}</Badge>;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(value);
}

function companyTypeLabel(type?: string) {
  if (type === "LOGISTICS") return "Logistics";
  if (type === "PORT_OPERATOR") return "Cảng/kho bãi";
  if (type === "WAREHOUSE") return "Kho bãi";
  return "Chưa cập nhật";
}

function congestionLabel(level: string) {
  if (level === "LOW") return "Ít ùn tắc";
  if (level === "MEDIUM") return "Cần theo dõi";
  return "Đông xe";
}
