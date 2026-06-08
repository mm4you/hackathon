import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { VoucherManagement } from "@/components/VoucherManagement";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function VoucherManagementPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/appointments");

  return (
    <DashboardLayout title="Quản lý voucher" description="Duyệt yêu cầu đổi ưu đãi, đánh dấu voucher đã dùng hoặc từ chối khi không hợp lệ." currentUser={user}>
      <VoucherManagement />
    </DashboardLayout>
  );
}
