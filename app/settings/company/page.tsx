import { DashboardLayout } from "@/components/DashboardLayout";
import { CompanySettings } from "@/components/CompanySettings";

export const dynamic = "force-dynamic";

export default function CompanySettingsPage() {
  return (
    <DashboardLayout title="Hồ sơ công ty" description="Quản lý thông tin tổ chức, thành viên và đội xe trong cùng một nơi.">
      <CompanySettings />
    </DashboardLayout>
  );
}
