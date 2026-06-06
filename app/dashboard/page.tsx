import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardOverview } from "@/components/DashboardOverview";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  return (
    <DashboardLayout
      title="Trung tâm điều phối thông minh"
      description="Theo dõi lịch vào cảng, thời gian chờ, mức ùn tắc và điểm xanh trong một màn hình."
      action={<Link href="/booking" className="rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">Đặt lịch</Link>}
    >
      <DashboardOverview />
    </DashboardLayout>
  );
}
