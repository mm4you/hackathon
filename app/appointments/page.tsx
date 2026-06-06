import { DashboardLayout } from "@/components/DashboardLayout";
import { AppointmentsBoard } from "@/components/AppointmentsBoard";

export const dynamic = "force-dynamic";

export default function AppointmentsPage() {
  return (
    <DashboardLayout title="Điều phối lịch hẹn" description="Theo dõi xe vào cảng và cập nhật trạng thái lịch hẹn theo từng bước.">
      <AppointmentsBoard />
    </DashboardLayout>
  );
}
