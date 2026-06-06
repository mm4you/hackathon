"use client";

import { FormEvent, useEffect, useState } from "react";

type CurrentUser = { id: string; role: "ADMIN" | "OPERATOR" | "DRIVER" };
type Company = {
  id: string;
  name: string;
  type: "LOGISTICS" | "PORT_OPERATOR" | "WAREHOUSE";
  contactEmail?: string | null;
  contactPhone?: string | null;
  users: { id: string; name: string; email: string; role: string }[];
  vehicles: { id: string; plateNumber: string; vehicleType: string; driver: { id: string; name: string } }[];
};
type ApiResponse<T> = { data?: T; error?: string };

export function CompanySettings() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: "", contactEmail: "", contactPhone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      const [meResponse, companyResponse] = await Promise.all([fetch("/api/auth/me"), fetch("/api/company")]);
      const meJson = (await meResponse.json()) as ApiResponse<CurrentUser>;
      const companyJson = (await companyResponse.json()) as ApiResponse<{ company: Company | null; message?: string }>;
      if (cancelled) return;
      setLoading(false);
      if (!meResponse.ok || !companyResponse.ok) return setError(meJson.error ?? companyJson.error ?? "Không tải được hồ sơ công ty");
      setCurrentUser(meJson.data ?? null);
      const nextCompany = companyJson.data?.company ?? null;
      setCompany(nextCompany);
      setForm({ name: nextCompany?.name ?? "", contactEmail: nextCompany?.contactEmail ?? "", contactPhone: nextCompany?.contactPhone ?? "" });
    }
    load().catch(() => {
      if (!cancelled) {
        setLoading(false);
        setError("Không tải được hồ sơ công ty");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/company", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = (await response.json()) as ApiResponse<{ company: Company }>;
    setSaving(false);
    if (!response.ok) return setError(json.error ?? "Không cập nhật được hồ sơ công ty");
    if (json.data?.company) setCompany(json.data.company);
    setMessage("Đã cập nhật hồ sơ công ty.");
  }

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "OPERATOR";

  if (loading) return <div className="rounded-[1.5rem] border bg-card p-6 text-sm text-muted-foreground shadow-sm">Đang tải hồ sơ công ty...</div>;

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">{message}</p> : null}

      {!company ? (
        <section className="rounded-[1.35rem] border bg-card p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Company Foundation</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Tài khoản chưa gắn với công ty</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Khi triển khai B2B, user và xe nên thuộc một công ty logistics/cảng để phân quyền và báo cáo không bị lẫn dữ liệu.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <Summary label="Loại tổ chức" value={companyTypeLabel(company.type)} text="Nền để bán/bàn giao theo mô hình B2B." />
            <Summary label="Người dùng" value={String(company.users.length)} text="Admin, operator và driver thuộc cùng tổ chức." />
            <Summary label="Phương tiện" value={String(company.vehicles.length)} text="Fleet gắn với company để mở rộng quản lý đội xe." />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(360px,28vw)_minmax(0,1fr)]">
            <form onSubmit={save} className="rounded-[1.35rem] border bg-card p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Company Profile</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{company.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Hồ sơ doanh nghiệp giúp sản phẩm nhìn như nền tảng logistics/cảng có thể bán và mở rộng sau này.</p>

              <div className="mt-5 grid gap-4">
                <Field label="Tên công ty" value={form.name} disabled={!canEdit} onChange={(value) => setForm({ ...form, name: value })} />
                <Field label="Email liên hệ" type="email" value={form.contactEmail} disabled={!canEdit} onChange={(value) => setForm({ ...form, contactEmail: value })} />
                <Field label="Số điện thoại" value={form.contactPhone} disabled={!canEdit} onChange={(value) => setForm({ ...form, contactPhone: value })} />
              </div>

              {canEdit ? <button disabled={saving} className="mt-5 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60">{saving ? "Đang lưu..." : "Lưu hồ sơ công ty"}</button> : <p className="mt-5 rounded-2xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">Driver view: chỉ xem thông tin công ty.</p>}
            </form>

            <div className="grid gap-4">
              <Panel title="Thành viên công ty" subtitle="Nền cho invite user và role B2B sau MVP.">
                {company.users.map((user) => <Row key={user.id} title={user.name} meta={`${user.role} - ${user.email}`} />)}
              </Panel>
              <Panel title="Đội xe" subtitle="Nền để logistics company quản lý nhiều xe và báo cáo fleet.">
                {company.vehicles.map((vehicle) => <Row key={vehicle.id} title={vehicle.plateNumber} meta={`${vehicle.vehicleType} - tài xế ${vehicle.driver.name}`} />)}
              </Panel>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function companyTypeLabel(type: Company["type"]) {
  if (type === "LOGISTICS") return "Logistics";
  if (type === "PORT_OPERATOR") return "Cảng/kho bãi";
  return "Warehouse";
}

function Summary({ label, value, text }: { label: string; value: string; text: string }) {
  return <div className="rounded-[1.25rem] border bg-card p-5 shadow-sm"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</div><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

function Field({ label, value, onChange, disabled, type = "text" }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; type?: string }) {
  return <label className="block text-sm font-semibold">{label}<input required={label === "Tên công ty"} disabled={disabled} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border bg-background px-3.5 py-2.5 outline-none transition focus:ring-4 focus:ring-ring/10 disabled:bg-muted disabled:text-muted-foreground" /></label>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="rounded-[1.35rem] border bg-card p-5 shadow-sm"><div className="font-semibold">{title}</div><p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p><div className="mt-4 divide-y">{children}</div></section>;
}

function Row({ title, meta }: { title: string; meta: string }) {
  return <div className="py-3 first:pt-0 last:pb-0"><div className="font-medium">{title}</div><div className="mt-1 text-sm text-muted-foreground">{meta}</div></div>;
}
