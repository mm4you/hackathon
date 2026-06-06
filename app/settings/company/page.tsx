import { DashboardLayout } from "@/components/DashboardLayout";
import { CompanySettings } from "@/components/CompanySettings";

export const dynamic = "force-dynamic";

export default function CompanySettingsPage() {
  return (
    <DashboardLayout title="Hồ sơ công ty" description="Company foundation cho bản B2B: gắn user, xe và báo cáo vào một tổ chức logistics/cảng để sẵn sàng mở rộng.">
      <CompanySettings />
    </DashboardLayout>
  );
}
