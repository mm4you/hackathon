import { DashboardLayout } from "@/components/DashboardLayout";
import { AppointmentsBoard } from "@/components/AppointmentsBoard";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const user = await getCurrentUser();
  const description = user?.role === "OPERATOR" ? "Operator xử lý vận hành tại cổng: kiểm tra QR, đối chiếu lịch và cập nhật trạng thái xe." : "Theo dõi xe vào cảng và cập nhật trạng thái lịch hẹn theo từng bước.";

  return (
    <DashboardLayout title="Điều phối lịch hẹn" description={description} currentUser={user}>
      <AppointmentsBoard currentUserRole={user?.role ?? "DRIVER"} />
    </DashboardLayout>
  );
}
