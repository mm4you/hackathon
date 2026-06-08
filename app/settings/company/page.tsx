import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CompanySettings } from "@/components/CompanySettings";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "OPERATOR") redirect("/appointments");

  return (
    <DashboardLayout title="Hồ sơ công ty" description="Quản lý thông tin tổ chức, thành viên và đội xe trong cùng một nơi." currentUser={user}>
      <CompanySettings />
    </DashboardLayout>
  );
}
