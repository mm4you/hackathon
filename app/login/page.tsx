"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const json = await response.json();
    setLoading(false);

    if (!response.ok) return setError(json.error ?? "Không thể đăng nhập");
    router.push("/dashboard");
  }

  return (
    <AuthShell title="Đăng nhập" description="Truy cập hệ thống điều phối lịch vào cảng thông minh.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" name="email" type="email" defaultValue="driver@innovatex.vn" />
        <Field label="Mật khẩu" name="password" type="password" defaultValue="123456" />
        {error ? <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
        <Button disabled={loading} type="submit" className="h-11 w-full rounded-2xl shadow-lg shadow-slate-950/15">
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản? <Link href="/register" className="font-semibold text-foreground underline underline-offset-4">Đăng ký tài xế</Link>
        </p>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh w-full bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_520px] xl:grid-cols-[minmax(0,1fr)_600px]">
      <section className="hidden min-w-0 border-r bg-muted/30 p-8 lg:flex lg:flex-col lg:justify-between xl:p-10">
        <div className="w-fit rounded-full border bg-background px-4 py-2 text-sm font-semibold">InnovateX Smart Port</div>
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Smart port scheduling</div>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.06em] xl:text-7xl">Điều phối lịch vào cảng trên một màn hình.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Đặt lịch, theo dõi slot, cập nhật trạng thái và cộng điểm xanh sau khi hoàn thành.</p>
        </div>
        <div className="text-sm leading-6 text-muted-foreground">Demo flow: đăng nhập, đặt lịch, nhận gợi ý slot và theo dõi trạng thái.</div>
      </section>
      <section className="grid min-h-dvh place-items-center bg-background px-4 py-8">
      <Card className="w-full max-w-md rounded-[2rem] shadow-sm">
        <CardHeader className="pb-2">
          <Badge variant="secondary" className="w-fit rounded-full">InnovateX Smart Port</Badge>
          <CardTitle className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{title}</CardTitle>
          <CardDescription className="leading-6">{description}</CardDescription>
        </CardHeader>
        <CardContent>
        {children}
        </CardContent>
      </Card>
      </section>
    </main>
  );
}

function Field({ label, name, type, defaultValue }: { label: string; name: string; type: string; defaultValue?: string }) {
  return (
    <Label className="block text-sm font-semibold text-slate-700">
      {label}
      <Input required name={name} type={type} defaultValue={defaultValue} className="mt-2 h-11 rounded-2xl" />
    </Label>
  );
}
