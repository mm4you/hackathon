"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input as UiInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select as UiSelect } from "@/components/ui/select";

type Vehicle = { id: string; plateNumber: string; vehicleType: string };
type Port = { id: string; name: string; address?: string };
type Recommendation = {
  id: string;
  rank: number;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  congestionLevel: "LOW" | "MEDIUM" | "HIGH";
  estimatedWaitMinutes: number;
  greenCreditEarned: number;
  co2SavedKg: number;
  fitLabel: string;
  decision: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  utilizationRate: number;
  confidence: number;
  aiSummary: string;
  recommendedAction: string;
  timeFitMinutes: number;
  demandForecast: { label: string; message: string; projectedUtilizationRate: number };
  reasons: string[];
  impact: { waitMinutesSaved: number; manualProcessMinutesSaved: number; costSavingEstimateVnd: number };
  aiSignals: { congestionProbability: number; demandSurgeIndex: number; scheduleReliability: number; ecoEfficiencyScore: number; operationalStressScore: number; decisionGrade: "A" | "B" | "C" | "D" };
  trafficSignal: { label: string; message: string; severity: "LOW" | "MEDIUM" | "HIGH" };
  modalShiftSuggestion?: { shouldConsiderBarge: boolean; reason: string; estimatedTruckCo2Kg: number; estimatedBargeCo2Kg: number; potentialCo2ReductionPercent: number };
};

type ApiResponse<T> = { data?: T; error?: string };
type PortTrafficContext = {
  portCondition: { source: "simulation"; congestionLevel: string; openGateLanes: number; avgGateProcessSeconds: number; note: string; insight: string };
  trafficSnapshot: { source: "tomtom" | "simulation"; congestionLevel: string; delayMinutes: number; confidence: number; note: string; insight: string };
  dataSourceLabel: string;
  decisionInsight: string;
};
type AiDecision = {
  source: "heuristic" | "llm";
  bestSlotId: string;
  decisionTitle: string;
  driverAdvice: string;
  operatorNote: string;
  riskSummary: string;
  alternatives: { slotId: string; label: string; reason: string }[];
};

const preferenceOptions = [
  ["ECO", "Tối đa điểm xanh và CO2"],
  ["LOW_CONGESTION", "Tránh ùn tắc cổng"],
  ["FASTEST", "Vào cảng nhanh nhất"],
];

export function BookingFlow() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [form, setForm] = useState({ vehicleId: "", portId: "", preferredTime: defaultPreferredTime(), optimizationPreference: "ECO" });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [portTrafficContext, setPortTrafficContext] = useState<PortTrafficContext | null>(null);
  const [aiDecision, setAiDecision] = useState<AiDecision | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setError("");
      const [vehiclesResponse, portsResponse] = await Promise.all([fetch("/api/vehicles"), fetch("/api/ports")]);
      const vehiclesJson = (await vehiclesResponse.json()) as ApiResponse<Vehicle[]>;
      const portsJson = (await portsResponse.json()) as ApiResponse<Port[]>;
      if (cancelled) return;
      if (!vehiclesResponse.ok || !portsResponse.ok) {
        setError(vehiclesJson.error ?? portsJson.error ?? "Không tải được dữ liệu xe/cảng");
        return;
      }
      const nextVehicles = vehiclesJson.data ?? [];
      const nextPorts = portsJson.data ?? [];
      setVehicles(nextVehicles);
      setPorts(nextPorts);
      setForm((current) => ({ ...current, vehicleId: current.vehicleId || nextVehicles[0]?.id || "", portId: current.portId || nextPorts[0]?.id || "" }));
    }
    loadOptions().catch(() => setError("Không tải được dữ liệu xe/cảng"));
    return () => {
      cancelled = true;
    };
  }, []);

  async function recommend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setRecommendations([]);
    setPortTrafficContext(null);
    setAiDecision(null);
    setSelectedId("");

    const response = await fetch("/api/recommendation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = (await response.json()) as ApiResponse<{ recommendations: Recommendation[]; portTrafficContext?: PortTrafficContext; aiDecision?: AiDecision | null; message?: string }>;
    setLoading(false);

    if (!response.ok) return setError(json.error ?? "Không tạo được gợi ý khung giờ");
    const nextRecommendations = json.data?.recommendations ?? [];
    const nextDecision = json.data?.aiDecision ?? null;
    setRecommendations(nextRecommendations);
    setPortTrafficContext(json.data?.portTrafficContext ?? null);
    setAiDecision(nextDecision);
    setSelectedId(nextDecision?.bestSlotId ?? nextRecommendations[0]?.id ?? "");
    if (!nextRecommendations.length) setError(json.data?.message ?? "Không còn slot khả dụng trong ngày đã chọn");
  }

  async function confirmBooking() {
    if (!selectedId) return;
    setConfirming(true);
    setError("");
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, timeSlotId: selectedId }),
    });
    const json = (await response.json()) as ApiResponse<unknown>;
    setConfirming(false);
    if (!response.ok) return setError(json.error ?? "Không tạo được lịch hẹn");
    router.push("/appointments");
  }

  const selected = recommendations.find((item) => item.id === selectedId) ?? null;
  const selectedAdvice = selected ? `${formatDateTime(selected.startTime)} là khung giờ đang chọn: ${selected.recommendedAction.toLowerCase()} Chờ ${selected.estimatedWaitMinutes} phút, tải ${selected.utilizationRate}%.` : "";
  const selectedRiskSummary = selected ? (aiDecision?.bestSlotId === selected.id ? aiDecision.riskSummary : selected.trafficSignal.message) : "";
  const alternativeSlots = selected ? recommendations.filter((item) => item.id !== selected.id).slice(0, 2) : [];

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(340px,26vw)_minmax(0,1fr)] xl:gap-5">
      <Card className="rounded-[1.2rem] shadow-sm xl:sticky xl:top-4 xl:self-start xl:rounded-[1.35rem]">
      <form onSubmit={recommend}>
        <CardContent className="p-4 sm:p-5">
        <div className="rounded-[1.2rem] border bg-muted/30 p-3 sm:p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Bước 1</div>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] sm:mt-2 sm:text-xl">Tìm slot phù hợp</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground sm:mt-2">Chọn xe, cảng và mục tiêu. AI sẽ gợi ý slot tốt nhất.</p>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4">
          <Select label="Biển số xe" value={form.vehicleId} onChange={(value) => setForm({ ...form, vehicleId: value })} options={vehicles.map((vehicle) => [vehicle.id, `${vehicle.plateNumber} - ${vehicle.vehicleType}`])} empty="Chưa có xe" />
          <Select label="Cảng đến" value={form.portId} onChange={(value) => setForm({ ...form, portId: value })} options={ports.map((port) => [port.id, port.name])} empty="Chưa có cảng active" />
          <Input label="Khung giờ mong muốn" type="datetime-local" value={form.preferredTime} onChange={(value) => setForm({ ...form, preferredTime: value })} />
          <Select label="Mục tiêu tối ưu" value={form.optimizationPreference} onChange={(value) => setForm({ ...form, optimizationPreference: value })} options={preferenceOptions} />
        </div>

        {error ? <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <Button disabled={loading || confirming || !form.vehicleId || !form.portId} type="submit" className="mt-4 h-12 w-full rounded-2xl font-semibold sm:mt-5 sm:h-11">
          {loading ? "Đang phân tích..." : "Tìm slot"}
        </Button>
        </CardContent>
      </form>
      </Card>

      <section className="min-w-0">
        {selected ? (
          <Card className="rounded-[1.2rem] shadow-sm lg:rounded-[1.35rem]">
            <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Bước 2 - Khuyến nghị</div>
                <CardTitle className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">{selected.fitLabel}</CardTitle>
                <CardDescription className="mt-2 leading-6">{formatDateTime(selected.startTime)} - {formatDateTime(selected.endTime)}</CardDescription>
              </div>
              <RiskBadge risk={selected.riskLevel}>{selected.trafficSignal.label}</RiskBadge>
            </div>

            <div className="mt-4 rounded-2xl border bg-muted/30 p-3 sm:mt-5 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Gợi ý thông minh</div>
                  {aiDecision ? <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em] sm:text-xl">{aiDecision.decisionTitle}</h3> : null}
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground sm:line-clamp-none">{selected.aiSummary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiDecision ? <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">Tư vấn lịch</Badge> : null}
                  <Badge variant="outline" className="w-fit rounded-full px-3 py-1">{selected.confidence}% confidence</Badge>
                </div>
              </div>
              <div className="mt-3 rounded-xl border bg-background p-3 text-sm font-semibold">{selectedAdvice}</div>
              <div className="mt-3 rounded-xl border bg-background p-3 text-sm leading-6 text-muted-foreground"><span className="font-semibold text-foreground">Rủi ro:</span> {selectedRiskSummary}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 xl:grid-cols-4">
              <Metric label="Chờ dự kiến" value={`${selected.estimatedWaitMinutes} phút`} />
              <Metric label="Tải slot" value={`${selected.utilizationRate}%`} />
              <Metric label="Điểm xanh" value={`+${selected.greenCreditEarned}`} />
              <Metric label="CO2 tiết kiệm" value={`${selected.co2SavedKg} kg`} />
            </div>

            <details className="mt-3 rounded-2xl border bg-muted/20 p-3 sm:p-4">
              <summary className="cursor-pointer text-sm font-semibold">Xem chi tiết AI và phương án khác</summary>
              {aiDecision?.operatorNote ? <div className="mt-3 rounded-xl border bg-background p-3 text-sm leading-6 text-muted-foreground"><span className="font-semibold text-foreground">Operator:</span> {aiDecision.operatorNote}</div> : null}
              {alternativeSlots.length ? (
                <div className="mt-3 grid gap-2">
                  {alternativeSlots.map((item) => (
                    <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="rounded-xl border bg-background p-3 text-left text-sm transition hover:bg-muted/40">
                      <div className="font-semibold">{alternativeLabel(item.riskLevel)}</div>
                      <div className="mt-1 leading-6 text-muted-foreground">{formatDateTime(item.startTime)}: chờ {item.estimatedWaitMinutes} phút, tải {item.utilizationRate}%, rủi ro {riskLabel(item.riskLevel)}.</div>
                    </button>
                  ))}
                </div>
              ) : null}
              {portTrafficContext ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Impact label="Nguồn dữ liệu" value={portTrafficContext.dataSourceLabel} />
                  <Impact label="Cảng" value={`${portTrafficContext.portCondition.congestionLevel} / ${portTrafficContext.portCondition.openGateLanes} lane`} />
                  <Impact label="Giao thông" value={`${portTrafficContext.trafficSnapshot.congestionLevel} / +${portTrafficContext.trafficSnapshot.delayMinutes} phút`} />
                </div>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Impact label="Lệch giờ" value={selected.timeFitMinutes ? `${selected.timeFitMinutes} phút` : "Khớp slot"} />
                <Impact label="Dự báo tải" value={`${selected.demandForecast.projectedUtilizationRate}%`} />
                <Impact label="AI grade" value={selected.aiSignals.decisionGrade} />
              </div>
              <div className="mt-3 rounded-2xl border bg-background p-3 text-sm leading-6 text-muted-foreground"><span className="font-semibold text-foreground">Dự báo:</span> {selected.demandForecast.message}</div>
              <div className="mt-3 rounded-2xl border bg-background p-3">
                <div className="font-semibold">Vì sao AI chọn slot này?</div>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                  {selected.reasons.map((reason) => <li key={reason}>- {reason}</li>)}
                </ul>
              </div>
            </details>

            <div className="mt-4 rounded-2xl border bg-background p-3 sm:mt-5">
              <div className="mb-3 text-sm font-semibold">Bước 3 - Xác nhận slot</div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <UiSelect value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="h-12 w-full min-w-0 rounded-2xl font-semibold sm:h-11 sm:flex-1">
                {recommendations.map((item) => <option key={item.id} value={item.id}>#{item.rank} {formatDateTime(item.startTime)} - {item.fitLabel}</option>)}
              </UiSelect>
              <Button disabled={confirming} onClick={confirmBooking} className="h-12 w-full rounded-2xl px-5 font-semibold sm:h-11 sm:w-auto">
                {confirming ? "Đang giữ slot..." : "Xác nhận đặt lịch"}
              </Button>
              </div>
            </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="gap-0 overflow-hidden rounded-[1.2rem] py-0 shadow-sm lg:rounded-[1.35rem]">
            <CardHeader className="border-b bg-muted/30 p-4 sm:p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Bắt đầu đặt lịch</div>
              <CardTitle className="mt-2 text-xl font-semibold tracking-[-0.04em] sm:mt-3 sm:text-2xl">Chọn xe, cảng và mục tiêu</CardTitle>
              <CardDescription className="mt-2 max-w-2xl leading-6">Hệ thống sẽ so sánh slot còn trống, cảnh báo kẹt xe và tính trước điểm xanh.</CardDescription>
            </CardHeader>
            <CardContent className="grid px-0 md:grid-cols-3">
               <EmptyStep title="Chọn slot" text="Xếp hạng khung giờ theo mục tiêu của tài xế." />
               <EmptyStep title="Giữ chỗ" text="Booking giữ slot bằng transaction để không vượt capacity." />
               <EmptyStep title="Nhận điểm" text="Lịch hoàn thành được cộng điểm một lần." />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function defaultPreferredTime() {
  const date = new Date();
  date.setHours(date.getHours() + 2, 0, 0, 0);
  return formatLocalInputDateTime(date);
}

function formatLocalInputDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function Select({ label, value, onChange, options, empty = "Không có dữ liệu" }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; empty?: string }) {
  return <Label className="block text-sm font-semibold">{label}<UiSelect required value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 rounded-2xl">{options.length ? options.map(([id, text]) => <option key={id} value={id}>{text}</option>) : <option value="">{empty}</option>}</UiSelect></Label>;
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <Label className="block text-sm font-semibold">{label}<UiInput required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 rounded-2xl" /></Label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card className="gap-1 rounded-2xl p-4 shadow-none"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="text-xl font-semibold tracking-[-0.04em]">{value}</div></Card>;
}

function Impact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border bg-muted/20 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-2 text-lg font-semibold">{value}</div></div>;
}

function RiskBadge({ risk, children }: { risk: Recommendation["riskLevel"]; children: React.ReactNode }) {
  const className = risk === "LOW" ? "" : risk === "MEDIUM" ? "" : "";
  return <Badge variant="outline" className={`w-fit rounded-full px-3 py-1 ${className}`}>{children}</Badge>;
}

function alternativeLabel(risk: Recommendation["riskLevel"]) {
  if (risk === "LOW") return "Phương án an toàn";
  if (risk === "MEDIUM") return "Phương án dự phòng";
  return "Chỉ dùng khi bắt buộc";
}

function riskLabel(risk: Recommendation["riskLevel"]) {
  if (risk === "LOW") return "thấp";
  if (risk === "MEDIUM") return "vừa";
  return "cao";
}

function EmptyStep({ title, text }: { title: string; text: string }) {
  return <div className="border-b p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><div className="font-semibold">{title}</div><div className="mt-2 text-sm leading-6 text-muted-foreground">{text}</div></div>;
}
