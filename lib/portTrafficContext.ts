import type { CongestionLevel } from "@/lib/schedulingEngine";

export type PortTrafficContext = {
  portCondition: {
    source: "simulation";
    congestionLevel: CongestionLevel;
    openGateLanes: number;
    avgGateProcessSeconds: number;
    note: string;
    insight: string;
  };
  trafficSnapshot: {
    source: "tomtom" | "simulation";
    congestionLevel: CongestionLevel;
    delayMinutes: number;
    confidence: number;
    note: string;
    insight: string;
  };
  dataSourceLabel: string;
  decisionInsight: string;
};

type ContextInput = {
  portName: string;
  latitude?: number | null;
  longitude?: number | null;
  targetTime: Date;
  averageUtilizationRate: number;
};

const trafficCache = new Map<string, { expiresAt: number; snapshot: PortTrafficContext["trafficSnapshot"] }>();

export async function getPortTrafficContext(input: ContextInput): Promise<PortTrafficContext> {
  const portCondition = buildSimulatedPortCondition(input.targetTime, input.averageUtilizationRate);
  const simulatedTraffic = buildSimulatedTrafficSnapshot(input.targetTime, input.portName);
  const tomTomTraffic = await fetchTomTomTraffic(input.latitude, input.longitude);
  const trafficSnapshot = tomTomTraffic ?? simulatedTraffic;

  return {
    portCondition,
    trafficSnapshot,
    dataSourceLabel: trafficSnapshot.source === "tomtom" ? "Giao thông realtime + vận hành cảng" : "Dữ liệu ước tính vận hành",
    decisionInsight: buildDecisionInsight(portCondition, trafficSnapshot),
  };
}

export function getContextPressure(context: PortTrafficContext) {
  return levelPressure(context.portCondition.congestionLevel) * 0.16 + levelPressure(context.trafficSnapshot.congestionLevel) * 0.14 + Math.min(0.16, context.trafficSnapshot.delayMinutes / 180);
}

function buildSimulatedPortCondition(targetTime: Date, averageUtilizationRate: number): PortTrafficContext["portCondition"] {
  const hour = targetTime.getHours();
  const rushLevel = hour <= 9 ? "HIGH" : hour <= 15 ? "MEDIUM" : "LOW";
  const utilizationLevel: CongestionLevel = averageUtilizationRate >= 0.78 ? "HIGH" : averageUtilizationRate >= 0.5 ? "MEDIUM" : "LOW";
  const congestionLevel = maxLevel(rushLevel, utilizationLevel);
  const openGateLanes = congestionLevel === "HIGH" ? 4 : congestionLevel === "MEDIUM" ? 5 : 6;
  const avgGateProcessSeconds = congestionLevel === "HIGH" ? 95 : congestionLevel === "MEDIUM" ? 62 : 38;

  return {
    source: "simulation",
    congestionLevel,
    openGateLanes,
    avgGateProcessSeconds,
    note: "Không có dữ liệu cổng Cát Lái public realtime; hệ thống mô phỏng từ giờ trong ngày và tải slot hiện có.",
    insight: `Mô hình cảng ước tính ${openGateLanes} lane đang xử lý, trung bình khoảng ${avgGateProcessSeconds} giây/xe; mức tải nội bộ đang ${congestionLevel}.`,
  };
}

function buildSimulatedTrafficSnapshot(targetTime: Date, portName: string): PortTrafficContext["trafficSnapshot"] {
  const hour = targetTime.getHours();
  const congestionLevel: CongestionLevel = hour <= 9 || (hour >= 16 && hour <= 18) ? "HIGH" : hour <= 15 ? "MEDIUM" : "LOW";
  const delayMinutes = congestionLevel === "HIGH" ? 22 : congestionLevel === "MEDIUM" ? 11 : 4;
  return {
    source: "simulation",
    congestionLevel,
    delayMinutes,
    confidence: 58,
      note: `Ước tính giao thông quanh ${portName} theo khung giờ hiện tại.`,
    insight: `Giao thông quanh ${portName} dự kiến trễ khoảng ${delayMinutes} phút, mức ${congestionLevel}.`,
  };
}

async function fetchTomTomTraffic(latitude?: number | null, longitude?: number | null): Promise<PortTrafficContext["trafficSnapshot"] | null> {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey || typeof latitude !== "number" || typeof longitude !== "number") return null;

  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = trafficCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.snapshot;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120);

  try {
    const url = new URL(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json`);
    url.searchParams.set("point", `${latitude},${longitude}`);
    url.searchParams.set("unit", "KMPH");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const json = await response.json().catch(() => null) as { flowSegmentData?: { currentSpeed?: number; freeFlowSpeed?: number; confidence?: number } } | null;
    const currentSpeed = Number(json?.flowSegmentData?.currentSpeed ?? 0);
    const freeFlowSpeed = Number(json?.flowSegmentData?.freeFlowSpeed ?? 0);
    if (!currentSpeed || !freeFlowSpeed) return null;

    const speedRatio = Math.max(0, Math.min(1, currentSpeed / freeFlowSpeed));
    const congestionLevel: CongestionLevel = speedRatio <= 0.45 ? "HIGH" : speedRatio <= 0.72 ? "MEDIUM" : "LOW";
    const delayMinutes = Math.round((1 - speedRatio) * 30);
    const confidence = Math.round(Number(json?.flowSegmentData?.confidence ?? 0.7) * 100);
    const slowdownPercent = Math.round((1 - speedRatio) * 100);

    const snapshot = {
      source: "tomtom",
      congestionLevel,
      delayMinutes,
      confidence: Math.max(40, Math.min(98, confidence)),
      note: `Traffic realtime: tốc độ hiện tại ${currentSpeed} km/h, free-flow ${freeFlowSpeed} km/h.`,
      insight: `Đường quanh cảng đang chạy ${currentSpeed}/${freeFlowSpeed} km/h, chậm hơn bình thường khoảng ${slowdownPercent}%; hệ thống cộng thêm khoảng ${delayMinutes} phút rủi ro vào slot gần thời điểm này.`,
    } satisfies PortTrafficContext["trafficSnapshot"];
    trafficCache.set(cacheKey, { expiresAt: Date.now() + 60000, snapshot });
    return snapshot;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildDecisionInsight(portCondition: PortTrafficContext["portCondition"], trafficSnapshot: PortTrafficContext["trafficSnapshot"]) {
  const sourceText = trafficSnapshot.source === "tomtom" ? "Giao thông lấy từ nguồn realtime" : "Giao thông dùng dữ liệu ước tính";
  return `${sourceText}. ${trafficSnapshot.insight} ${portCondition.insight}`;
}

function levelPressure(level: CongestionLevel) {
  if (level === "HIGH") return 1;
  if (level === "MEDIUM") return 0.55;
  return 0.2;
}

function maxLevel(a: CongestionLevel, b: CongestionLevel): CongestionLevel {
  if (a === "HIGH" || b === "HIGH") return "HIGH";
  if (a === "MEDIUM" || b === "MEDIUM") return "MEDIUM";
  return "LOW";
}
