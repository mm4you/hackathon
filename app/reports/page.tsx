import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ReportsView } from "@/components/ReportsView";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/appointments");

  return (
    <DashboardLayout title="Báo cáo tác động" description="Tổng hợp số lịch, thời gian chờ, CO2 tiết kiệm, điểm xanh và hiệu quả vận hành." currentUser={user}>
      <ReportsView cacheKey={`reports-cache:${user.role}:${user.id}`} />
    </DashboardLayout>
  );
}
