"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        plateNumber: form.get("plateNumber"),
        vehicleType: form.get("vehicleType"),
      }),
    });
    const json = await response.json();
    setLoading(false);

    if (!response.ok) return setError(json.error ?? "Không thể đăng ký");
    router.push("/dashboard");
  }

  return (
    <main className="grid min-h-dvh w-full bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_620px] xl:grid-cols-[minmax(0,1fr)_700px]">
      <section className="hidden min-w-0 border-r bg-muted/30 p-8 lg:flex lg:flex-col lg:justify-between xl:p-10">
        <div className="w-fit rounded-full border bg-background px-4 py-2 text-sm font-semibold">Driver onboarding</div>
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Driver onboarding</div>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.06em] xl:text-7xl">Tạo hồ sơ tài xế và xe cho lịch vào cảng thông minh.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Sau khi đăng ký, tài xế có thể đặt lịch, giữ slot và nhận điểm xanh khi hoàn thành.</p>
        </div>
        <div className="grid max-w-4xl grid-cols-3 gap-3 text-sm">
          <AuthMetric label="Role" value="Driver" />
          <AuthMetric label="Vehicle" value="1st" />
          <AuthMetric label="Reward" value="Green" />
        </div>
      </section>
      <section className="grid min-h-dvh place-items-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg rounded-[2rem] shadow-sm">
        <CardHeader>
          <Badge variant="secondary" className="w-fit rounded-full">Driver onboarding</Badge>
          <CardTitle className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Đăng ký tài xế</CardTitle>
          <CardDescription className="leading-6">Tạo tài khoản và xe đầu tiên để bắt đầu đặt lịch vào cảng.</CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Họ tên" name="name" />
          <Field label="Email" name="email" type="email" />
          <Field label="Mật khẩu" name="password" type="password" />
          <Field label="Biển số xe" name="plateNumber" placeholder="51C-889.21" />
          <div className="sm:col-span-2"><Field label="Loại xe" name="vehicleType" placeholder="Container 40ft" /></div>
          {error ? <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">{error}</p> : null}
          <Button disabled={loading} type="submit" className="h-11 rounded-2xl shadow-lg shadow-slate-950/15 sm:col-span-2">
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </Button>
          <p className="text-center text-sm text-muted-foreground sm:col-span-2">
            Đã có tài khoản? <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">Đăng nhập</Link>
          </p>
        </form>
        </CardContent>
      </Card>
      </section>
    </main>
  );
}

function AuthMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border bg-background p-4"><div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</div></div>;
}

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <Label className="block text-sm font-semibold text-slate-700">
      {label}
      <Input required name={name} type={type} placeholder={placeholder} className="mt-2 h-11 rounded-2xl" />
    </Label>
  );
}
