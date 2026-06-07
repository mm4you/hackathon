import { DashboardLayout } from "@/components/DashboardLayout";
import { AppointmentsBoard } from "@/components/AppointmentsBoard";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const user = await getCurrentUser();

  return (
    <DashboardLayout title="Điều phối lịch hẹn" description="Theo dõi xe vào cảng và cập nhật trạng thái lịch hẹn theo từng bước." currentUser={user}>
      <AppointmentsBoard currentUserRole={user?.role ?? "DRIVER"} />
    </DashboardLayout>
  );
}
