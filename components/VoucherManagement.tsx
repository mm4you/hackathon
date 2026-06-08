"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

type Reward = { id: string; title: string; description: string; pointsRequired: number; type: string };
type Redemption = { id: string; pointsUsed: number; status: string; createdAt: string; user?: { id: string; name: string; email: string }; reward: Reward };
type ApiResponse<T> = { data?: T; error?: string };

const actions = [
  { status: "APPROVED", label: "Duyệt" },
  { status: "REJECTED", label: "Từ chối" },
  { status: "USED", label: "Đã dùng" },
  { status: "PENDING", label: "Đưa về chờ" },
];

export function VoucherManagement() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/rewards/my-redemptions");
      const json = (await response.json()) as ApiResponse<Redemption[]>;
      if (cancelled) return;
      setLoading(false);
      if (!response.ok) return setError(json.error ?? "Không tải được danh sách voucher");
      setRedemptions(json.data ?? []);
    }
    load().catch(() => {
      if (!cancelled) {
        setLoading(false);
        setError("Không tải được danh sách voucher");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    setError("");
    setMessage("");
    const response = await fetch(`/api/rewards/redemptions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const json = (await response.json()) as ApiResponse<Redemption>;
    setUpdatingId("");
    if (!response.ok) return setError(json.error ?? "Không cập nhật được voucher");
    if (json.data) setRedemptions((items) => items.map((item) => (item.id === id ? json.data as Redemption : item)));
    setMessage("Đã cập nhật trạng thái voucher.");
  }

  const pendingCount = redemptions.filter((item) => item.status === "PENDING").length;
  const usableCount = redemptions.filter((item) => item.status === "APPROVED").length;
  const usedCount = redemptions.filter((item) => item.status === "USED").length;

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <Summary label="Chờ duyệt" value={String(pendingCount)} />
        <Summary label="Dùng được" value={String(usableCount)} />
        <Summary label="Đã dùng" value={String(usedCount)} />
      </section>

      {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">{message}</p> : null}

      <Card className="rounded-[1.2rem] shadow-sm lg:rounded-[1.35rem]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Quản lý voucher</div>
              <CardTitle className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Yêu cầu đổi ưu đãi</CardTitle>
              <CardDescription className="mt-2 leading-6">Duyệt, từ chối hoặc đánh dấu voucher đã dùng tại cổng/quầy dịch vụ.</CardDescription>
            </div>
          </div>

          {loading ? <div className="mt-5 rounded-2xl border bg-muted/20 p-6 text-sm text-muted-foreground">Đang tải voucher...</div> : null}
          {!loading && !redemptions.length ? <div className="mt-5 rounded-2xl border bg-muted/20 p-6 text-sm text-muted-foreground">Chưa có yêu cầu đổi ưu đãi.</div> : null}

          <div className="mt-4 grid gap-3 sm:mt-5">
            {redemptions.map((item) => (
              <article key={item.id} className="rounded-2xl border bg-muted/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Status value={item.status} />
                      <Badge variant="outline" className="rounded-full">{item.pointsUsed} điểm</Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em]">{item.reward.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.user?.name ?? "Tài xế"} - {item.user?.email ?? "Không có email"}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reward.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    {actions.map((action) => <Button key={action.status} disabled={updatingId === item.id || item.status === action.status} onClick={() => updateStatus(item.id, action.status)} variant="outline" size="sm" className="rounded-full text-xs">{action.label}</Button>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <Card className="gap-1 rounded-[1rem] p-3 shadow-sm sm:rounded-[1.25rem] sm:p-5"><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</div><CardTitle className="text-lg font-semibold tracking-[-0.04em] sm:text-2xl">{value}</CardTitle></Card>;
}

function Status({ value }: { value: string }) {
  const className = value === "REJECTED" ? "border-destructive/30 bg-destructive/10 text-destructive" : value === "APPROVED" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : value === "USED" ? "border-sky-500/30 bg-sky-500/10 text-sky-300" : "bg-muted/30";
  return <Badge variant="outline" className={`w-fit rounded-full ${className}`}>{statusLabel(value)}</Badge>;
}

function statusLabel(value: string) {
  if (value === "PENDING") return "Chờ duyệt";
  if (value === "APPROVED") return "Dùng được";
  if (value === "USED") return "Đã dùng";
  if (value === "REJECTED") return "Từ chối";
  return value;
}
