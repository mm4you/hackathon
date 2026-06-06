import { DashboardLayout } from "@/components/DashboardLayout";
import { BookingFlow } from "@/components/BookingFlow";

export const dynamic = "force-dynamic";

export default function BookingPage() {
  return (
    <DashboardLayout title="Đặt lịch vào cảng" description="Chọn xe, cảng và khung giờ mong muốn; hệ thống đề xuất slot phù hợp rồi giữ chỗ an toàn.">
      <BookingFlow />
    </DashboardLayout>
  );
}
