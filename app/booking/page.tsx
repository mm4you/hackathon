import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BookingFlow } from "@/components/BookingFlow";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "DRIVER") redirect("/appointments");

  return (
    <DashboardLayout title="Đặt lịch vào cảng" description="Chọn xe, cảng và khung giờ mong muốn; hệ thống đề xuất slot phù hợp rồi giữ chỗ an toàn.">
      <BookingFlow />
    </DashboardLayout>
  );
}
