import Link from "next/link";
import { ArrowRight, BarChart3, CalendarCheck, Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const impactMetrics = [
  { label: "Mục tiêu chờ tại cổng", value: "< 30 phút" },
  { label: "Green Tally roadmap", value: "30 giây" },
  { label: "Luồng MVP", value: "AI booking" },
  { label: "Tác động báo cáo", value: "CO2 + ROI" },
];

const features = [
  { icon: CalendarCheck, title: "GreenSlot AI", description: "Gợi ý khung giờ theo sức chứa, mức ùn tắc, thời gian chờ, điểm xanh và CO2 saved." },
  { icon: Truck, title: "Điều phối lịch hẹn", description: "Driver đặt lịch, admin/operator theo dõi và cập nhật lifecycle PENDING, COMING, COMPLETED, LATE, CANCELLED." },
  { icon: Leaf, title: "Green credits", description: "Hoàn thành lịch hẹn sẽ cộng tín chỉ xanh một lần và mở cơ chế đổi ưu đãi cho tài xế." },
  { icon: BarChart3, title: "CXV Impact Report", description: "Dashboard/report chứng minh giảm chờ, giảm thủ công, giảm phát thải và tăng khung giờ xanh." },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[1.5rem] border bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl border bg-muted"><Sparkles className="size-5" /></div>
            <div>
              <div className="text-sm font-semibold tracking-[-0.03em]">InnovateX Smart Port</div>
              <div className="text-xs text-muted-foreground">Commercial MVP cho CXV</div>
            </div>
          </Link>
          <nav className="flex flex-wrap gap-2">
            <Link href="/login" className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-muted">Đăng nhập</Link>
            <Link href="/dashboard" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">Vào dashboard</Link>
          </nav>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-stretch">
          <Card className="overflow-hidden rounded-[2rem] border bg-card py-0 shadow-sm">
            <CardContent className="relative px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
              <Badge variant="outline" className="rounded-full px-3 py-1">AI Planning - Green Tally - Rewarding</Badge>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.06em] sm:text-5xl lg:text-6xl">Đặt lịch vào cảng thông minh để giảm ùn tắc, thời gian chờ và phát thải.</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">InnovateX Smart Port giúp đội xe, cảng và kho bãi chuyển từ điều phối bị động sang chủ động: tài xế chọn xe/cảng/thời gian, GreenSlot AI đề xuất slot tốt nhất, admin theo dõi vận hành và hệ thống tự ghi nhận tín chỉ xanh.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Dùng thử demo <ArrowRight className="size-4" /></Link>
                <Link href="/reports" className="inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition hover:bg-muted">Xem impact report</Link>
              </div>
              <div className="mt-6 text-xs text-muted-foreground">Demo accounts: driver@innovatex.vn / admin@innovatex.vn / operator@innovatex.vn, mật khẩu 123456.</div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] py-0 shadow-sm">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-2xl tracking-[-0.04em]">Tác động PM/client cần thấy</CardTitle>
              <CardDescription>Không chỉ là form đặt lịch, mà là workflow vận hành có số liệu.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 px-6 pb-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {impactMetrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border bg-muted/50 p-4">
                  <div className="text-2xl font-semibold tracking-[-0.04em]">{metric.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{metric.label}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="rounded-[1.5rem] shadow-sm">
                <CardContent className="px-5">
                  <div className="grid size-10 place-items-center rounded-2xl border bg-muted"><Icon className="size-5" /></div>
                  <h2 className="mt-5 text-lg font-semibold tracking-[-0.03em]">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-[1.5rem] shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle>Flow demo 3 phút</CardTitle>
              <CardDescription>Login driver, chạy booking AI, xác nhận slot, admin complete lịch, driver nhận điểm xanh và xem reward/report.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="rounded-[1.5rem] shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" /> Sẵn sàng staging</CardTitle>
              <CardDescription>PostgreSQL, Prisma migration, httpOnly cookie auth, role guard và transaction cho booking/reward/status.</CardDescription>
            </CardHeader>
          </Card>
        </section>
      </section>
    </main>
  );
}
