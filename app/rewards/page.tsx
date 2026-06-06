import { DashboardLayout } from "@/components/DashboardLayout";
import { RewardsCatalog } from "@/components/RewardsCatalog";

export const dynamic = "force-dynamic";

export default function RewardsPage() {
  return (
    <DashboardLayout title="Ưu đãi" description="Dùng điểm xanh để đổi ưu tiên cổng, giảm phí hoặc voucher dịch vụ.">
      <RewardsCatalog />
    </DashboardLayout>
  );
}
