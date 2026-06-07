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
    <main className="dark min-h-dvh w-full overflow-x-hidden bg-background text-foreground">
      <div className="grid min-h-dvh w-full gap-3 p-2 pb-24 sm:p-3 lg:grid-cols-[280px_minmax(0,1fr)] lg:pb-3 2xl:grid-cols-[300px_minmax(0,1fr)] 2xl:gap-4 2xl:p-4">
        <aside className="rounded-[1.2rem] border bg-card p-2 shadow-sm lg:sticky lg:top-3 lg:h-[calc(100dvh-1.5rem)] lg:rounded-[1.35rem] lg:p-3 2xl:top-4 2xl:h-[calc(100dvh-2rem)]">
          <div className="rounded-2xl border bg-muted/40 p-3 lg:p-4">
            <div className="flex items-center justify-between gap-3 lg:block">
              <div className="flex min-w-0 items-center gap-2">
              <div className="grid size-8 place-items-center rounded-xl border bg-background"><Command className="size-4" /></div>
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-[-0.03em]">InnovateX</div>
                <div className="text-[11px] text-muted-foreground">Smart Port v2</div>
              </div>
              </div>
              <div className="min-w-0 text-right lg:hidden">
                <div className="truncate text-sm font-semibold">{user.name}</div>
                <div className="text-[11px] text-muted-foreground">{user.role}</div>
              </div>
            </div>
            <p className="mt-3 hidden text-xs leading-5 text-muted-foreground lg:block">Quản lý lịch vào cảng, slot trống và điểm xanh cho tài xế.</p>
          </div>

          <nav className="fixed inset-x-2 bottom-2 z-50 grid grid-cols-4 gap-1 rounded-[1.35rem] border bg-card/95 p-1.5 shadow-2xl backdrop-blur lg:static lg:inset-auto lg:z-auto lg:mt-4 lg:grid-cols-1 lg:gap-1.5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            {visibleNav.map((item) => (
              <Link key={item.href} href={item.href} className="min-w-0 rounded-xl border border-transparent px-2 py-2 text-center transition hover:border-border hover:bg-muted/50 lg:px-3 lg:py-2.5 lg:text-left">
                <div className="truncate text-[11px] font-semibold sm:text-xs lg:text-sm lg:font-medium">{item.label}</div>
                <div className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{item.description}</div>
              </Link>
            ))}
          </nav>

          <Card className="mt-4 hidden gap-3 rounded-2xl py-3 shadow-none lg:flex">
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
          <div className="mb-2 flex items-center justify-between gap-2 rounded-[1.2rem] border bg-card p-2 shadow-sm md:mb-3 md:p-3 2xl:mb-4">
              <div className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Operations dashboard</div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <div className="hidden size-9 place-items-center rounded-xl border bg-background sm:grid"><Bell className="size-4 text-muted-foreground" /></div>
              {action}
              <LogoutButton />
            </div>
          </div>

          <Card className="rounded-[1.2rem] py-0 shadow-sm lg:rounded-[1.35rem]">
            <div className="p-4 sm:p-5 2xl:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Commercial MVP</div>
                <CardTitle className="mt-2 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">{title}</CardTitle>
                <CardDescription className="mt-2 line-clamp-2 max-w-4xl leading-6 sm:line-clamp-none">{description}</CardDescription>
              </div>
              <Badge variant="outline" className="hidden w-fit rounded-full px-3 py-1 text-left sm:inline-flex">MVP vận hành</Badge>
            </div>
            </div>
          </Card>

          <div className="mt-3 w-full sm:mt-4">{children}</div>
        </section>
      </div>
    </main>
  );
}
