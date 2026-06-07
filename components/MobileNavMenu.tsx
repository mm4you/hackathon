"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { PublicUser } from "@/lib/api";

type MobileNavItem = {
  href: string;
  label: string;
  description: string;
  roles: PublicUser["role"][];
};

export function MobileNavMenu({ items }: { items: MobileNavItem[] }) {
  return (
    <details className="fixed inset-x-2 bottom-2 z-50 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-[1.35rem] border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-sm font-semibold">Menu</span>
          <span className="block text-xs text-muted-foreground">Chọn nhanh màn hình</span>
        </span>
        <span className="grid size-10 place-items-center rounded-2xl border bg-background">
          <Menu className="size-4 group-open:hidden" />
        </span>
      </summary>
      <div className="mb-2 rounded-[1.35rem] border bg-card p-2 shadow-2xl">
        <div className="mb-2 flex items-center justify-between px-2 py-1">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Điều hướng</div>
          <div className="grid size-8 place-items-center rounded-xl border bg-background"><X className="size-4" /></div>
        </div>
        <nav className="grid gap-1">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-2xl border border-transparent px-3 py-3 transition hover:border-border hover:bg-muted/50">
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{item.description}</div>
            </Link>
          ))}
        </nav>
      </div>
    </details>
  );
}
