import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Command } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import type { PublicUser } from "@/lib/api";
import { LogoutButton } from "@/components/LogoutButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

type NavItem = {
  href: string;
  label: string;
  description: string;
  roles: PublicUser["role"][];
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Tổng quan vận hành", roles: ["ADMIN", "OPERATOR", "DRIVER"] },
  { href: "/booking", label: "Đặt lịch", description: "Tìm slot phù hợp", roles: ["DRIVER"] },
  { href: "/appointments", label: "Lịch hẹn", description: "Theo dõi xe vào cảng", roles: ["ADMIN", "OPERATOR", "DRIVER"] },
  { href: "/green-credits", label: "Điểm xanh", description: "Lịch sử tín chỉ", roles: ["DRIVER"] },
  { href: "/rewards", label: "Ưu đãi", description: "Đổi điểm lấy quyền lợi", roles: ["DRIVER"] },
  { href: "/reports", label: "Báo cáo", description: "Tác động vận hành", roles: ["ADMIN", "OPERATOR"] },
  { href: "/settings/company", label: "Công ty", description: "Hồ sơ B2B", roles: ["ADMIN", "OPERATOR", "DRIVER"] },
];

export async function DashboardLayout({ title, description, children, action }: { title: string; description: string; children: React.ReactNode; action?: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <main className="dark min-h-dvh w-full bg-background text-foreground">
      <div className="grid min-h-dvh w-full gap-3 p-3 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)] 2xl:gap-4 2xl:p-4">
        <aside className="rounded-[1.35rem] border bg-card p-3 shadow-sm lg:sticky lg:top-3 lg:h-[calc(100dvh-1.5rem)] 2xl:top-4 2xl:h-[calc(100dvh-2rem)]">
          <div className="rounded-2xl border bg-muted/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="grid size-8 place-items-center rounded-xl border bg-background"><Command className="size-4" /></div>
              <div>
                <div className="text-sm font-semibold tracking-[-0.03em]">InnovateX</div>
                <div className="text-[11px] text-muted-foreground">Smart Port v2</div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Quản lý lịch vào cảng, slot trống và điểm xanh cho tài xế.</p>
          </div>

          <nav className="mt-4 grid gap-1.5">
            {visibleNav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl border border-transparent px-3 py-2.5 transition hover:border-border hover:bg-muted/50">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{item.description}</div>
              </Link>
            ))}
          </nav>

          <Card className="mt-4 gap-3 rounded-2xl py-3 shadow-none">
            <CardContent className="px-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Người dùng</div>
            <div className="mt-2 font-semibold">{user.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{user.email}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full">{user.role}</Badge>
              <Badge variant="outline" className="rounded-full">{user.greenPoints} điểm</Badge>
            </div>
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 pb-3 2xl:pb-4">
          <div className="mb-3 flex flex-col gap-3 rounded-[1.35rem] border bg-card p-3 shadow-sm md:flex-row md:items-center md:justify-between 2xl:mb-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Operations dashboard</div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl border bg-background"><Bell className="size-4 text-muted-foreground" /></div>
              {action}
              <LogoutButton />
            </div>
          </div>

          <Card className="rounded-[1.35rem] py-0 shadow-sm">
            <div className="p-5 2xl:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Commercial MVP</div>
                <CardTitle className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{title}</CardTitle>
                <CardDescription className="mt-2 max-w-4xl leading-6">{description}</CardDescription>
              </div>
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-left">MVP vận hành</Badge>
            </div>
            </div>
          </Card>

          <div className="mt-4 w-full">{children}</div>
        </section>
      </div>
    </main>
  );
}
