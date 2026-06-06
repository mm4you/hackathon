import { DashboardLayout } from "@/components/DashboardLayout";
import { GreenCreditsPanel } from "@/components/GreenCreditsPanel";

export const dynamic = "force-dynamic";

export default function GreenCreditsPage() {
  return (
    <DashboardLayout title="Điểm xanh" description="Xem điểm đã nhận từ các lịch hoàn thành và tác động CO2 ước tính.">
      <GreenCreditsPanel />
    </DashboardLayout>
  );
}
