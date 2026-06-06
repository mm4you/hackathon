import { DashboardLayout } from "@/components/DashboardLayout";
import { ReportsView } from "@/components/ReportsView";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <DashboardLayout title="Báo cáo tác động" description="Tổng hợp số lịch, thời gian chờ, CO2 tiết kiệm, điểm xanh và hiệu quả vận hành.">
      <ReportsView />
    </DashboardLayout>
  );
}
