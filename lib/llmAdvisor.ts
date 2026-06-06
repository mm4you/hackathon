import type { OptimizationPreference, RecommendationResult, SlotInput } from "@/lib/schedulingEngine";
import type { PortTrafficContext } from "@/lib/portTrafficContext";

type LlmContext = {
  portName: string;
  preferredTime: Date;
  optimizationPreference: OptimizationPreference;
  portTrafficContext?: PortTrafficContext;
};

type LlmRecommendation = {
  id: string;
  aiSummary?: string;
  recommendedAction?: string;
  reasons?: string[];
};

export type AiDecisionAdvisor = {
  source: "heuristic" | "llm";
  bestSlotId: string;
  decisionTitle: string;
  driverAdvice: string;
  operatorNote: string;
  riskSummary: string;
  alternatives: { slotId: string; label: string; reason: string }[];
};

type LlmDecision = Partial<Omit<AiDecisionAdvisor, "source" | "alternatives">> & {
  alternatives?: { slotId?: string; label?: string; reason?: string }[];
};

export async function enhanceRecommendationsWithLlm<T extends SlotInput>(recommendations: RecommendationResult<T>[], context: LlmContext) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey || !recommendations.length) return recommendations;

  const baseUrl = (process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "openai/gpt-oss-20b:free";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Ban la tro ly dieu phoi cang. Viet ngan gon, tieng Viet tu nhien, tranh buzzword. Chi tra JSON hop le.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Viet lai giai thich cho cac slot dat lich. Khong doi rank/id/so lieu. Moi summary toi da 1 cau, action toi da 1 cau, reasons toi da 3 y ngan.",
              outputShape: { recommendations: [{ id: "string", aiSummary: "string", recommendedAction: "string", reasons: ["string"] }] },
              context: {
                portName: context.portName,
                preferredTime: context.preferredTime.toISOString(),
                optimizationPreference: context.optimizationPreference,
                portTrafficContext: context.portTrafficContext,
              },
              recommendations: recommendations.map((item) => ({
                id: item.id,
                rank: item.rank,
                startTime: item.startTime,
                endTime: item.endTime,
                congestionLevel: item.congestionLevel,
                estimatedWaitMinutes: item.estimatedWaitMinutes,
                utilizationRate: item.utilizationRate,
                greenCreditEarned: item.greenCreditEarned,
                co2SavedKg: item.co2SavedKg,
                riskLevel: item.riskLevel,
                aiSignals: item.aiSignals,
                currentSummary: item.aiSummary,
                currentAction: item.recommendedAction,
                currentReasons: item.reasons,
              })),
            }),
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return recommendations;
    const json = await response.json().catch(() => null) as { choices?: { message?: { content?: string } }[] } | null;
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return recommendations;

    const parsed = parseJsonObject(content) as { recommendations?: LlmRecommendation[] } | null;
    if (!parsed) return recommendations;
    const llmById = new Map((parsed.recommendations ?? []).map((item) => [item.id, item]));

    return recommendations.map((item) => {
      const enhanced = llmById.get(item.id);
      if (!enhanced) return item;
      return {
        ...item,
        aiSummary: cleanText(enhanced.aiSummary, item.aiSummary),
        recommendedAction: cleanText(enhanced.recommendedAction, item.recommendedAction),
        reasons: cleanReasons(enhanced.reasons, item.reasons),
      };
    });
  } catch {
    return recommendations;
  } finally {
    clearTimeout(timeout);
  }
}

export async function buildAiDecisionAdvisor<T extends SlotInput>(recommendations: RecommendationResult<T>[], context: LlmContext): Promise<AiDecisionAdvisor | null> {
  if (!recommendations.length) return null;

  const fallback = buildHeuristicDecision(recommendations, context);
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return fallback;

  const baseUrl = (process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "openai/gpt-oss-20b:free";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 900);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.15,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Ban la AI dieu phoi lich vao cang. Chi tra JSON hop le. Khong bia so lieu. Khong chon slot khong nam trong danh sach.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Chon chien luoc dat lich tot nhat cho tai xe. Hay uu tien heuristicBestSlotId neu khong co ly do ro rang de doi. Viet ngan gon, tieng Viet tu nhien.",
              guardrails: ["bestSlotId phai thuoc slotIds", "khong chon slot risk HIGH neu con slot LOW/MEDIUM", "khong doi so lieu", "alternatives toi da 2"],
              outputShape: {
                bestSlotId: "string",
                decisionTitle: "string",
                driverAdvice: "string",
                operatorNote: "string",
                riskSummary: "string",
                alternatives: [{ slotId: "string", label: "string", reason: "string" }],
              },
              context: {
                portName: context.portName,
                preferredTime: context.preferredTime.toISOString(),
                optimizationPreference: context.optimizationPreference,
                portTrafficContext: context.portTrafficContext,
              },
              heuristicBestSlotId: recommendations.find((item) => item.riskLevel !== "HIGH")?.id ?? recommendations[0]?.id,
              slotIds: recommendations.map((item) => item.id),
              recommendations: recommendations.map((item) => ({
                id: item.id,
                rank: item.rank,
                startTime: item.startTime,
                endTime: item.endTime,
                score: item.score,
                riskLevel: item.riskLevel,
                congestionLevel: item.congestionLevel,
                waitMinutes: item.estimatedWaitMinutes,
                utilizationRate: item.utilizationRate,
                greenCreditEarned: item.greenCreditEarned,
                co2SavedKg: item.co2SavedKg,
                timeFitMinutes: item.timeFitMinutes,
                aiSignals: item.aiSignals,
                decision: item.decision,
              })),
            }),
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return fallback;
    const json = await response.json().catch(() => null) as { choices?: { message?: { content?: string } }[] } | null;
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return fallback;

    const parsed = parseJsonObject(content) as LlmDecision | null;
    if (!parsed) return fallback;
    return validateLlmDecision(parsed, recommendations, fallback);
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

function buildHeuristicDecision<T extends SlotInput>(recommendations: RecommendationResult<T>[], context: LlmContext): AiDecisionAdvisor {
  const safeBest = recommendations.find((item) => item.riskLevel !== "HIGH") ?? recommendations[0];
  const alternatives = recommendations.filter((item) => item.id !== safeBest.id).slice(0, 2).map((item) => ({
    slotId: item.id,
    label: item.riskLevel === "LOW" ? "Phương án an toàn" : item.riskLevel === "MEDIUM" ? "Phương án dự phòng" : "Chỉ dùng khi bắt buộc",
    reason: `${formatTime(item.startTime)}: chờ ${item.estimatedWaitMinutes} phút, tải ${item.utilizationRate}%, rủi ro ${item.riskLevel}.`,
  }));

  return {
    source: "heuristic",
    bestSlotId: safeBest.id,
    decisionTitle: safeBest.riskLevel === "LOW" ? "Nên chọn slot này" : "Có thể chọn, nhưng cần theo dõi",
    driverAdvice: `${formatTime(safeBest.startTime)} là lựa chọn phù hợp nhất cho mục tiêu ${preferenceLabel(context.optimizationPreference)}: chờ ${safeBest.estimatedWaitMinutes} phút, tải ${safeBest.utilizationRate}%.`,
    operatorNote: context.portTrafficContext ? `Nguồn dữ liệu: ${context.portTrafficContext.dataSourceLabel}. Cảng ${context.portTrafficContext.portCondition.congestionLevel}, giao thông ${context.portTrafficContext.trafficSnapshot.congestionLevel}.` : "Dựa trên slot còn trống và tải booking hiện tại.",
    riskSummary: safeBest.riskLevel === "HIGH" ? "Tất cả lựa chọn đều có rủi ro cao; nên cân nhắc đổi giờ nếu có thể." : "Không phát hiện rủi ro nghiêm trọng cho slot được chọn.",
    alternatives,
  };
}

function validateLlmDecision<T extends SlotInput>(decision: LlmDecision, recommendations: RecommendationResult<T>[], fallback: AiDecisionAdvisor): AiDecisionAdvisor {
  const byId = new Map(recommendations.map((item) => [item.id, item]));
  const hasNonHigh = recommendations.some((item) => item.riskLevel !== "HIGH");
  const selected = typeof decision.bestSlotId === "string" ? byId.get(decision.bestSlotId) : null;
  if (!selected || (hasNonHigh && selected.riskLevel === "HIGH")) return fallback;

  const alternatives = Array.isArray(decision.alternatives) ? decision.alternatives.flatMap((item) => {
    if (!item.slotId || !byId.has(item.slotId) || item.slotId === selected.id) return [];
    return [{
      slotId: item.slotId,
      label: cleanText(item.label, "Phương án khác"),
      reason: cleanText(item.reason, byId.get(item.slotId)?.recommendedAction ?? "Có thể cân nhắc nếu cần đổi giờ."),
    }];
  }).slice(0, 2) : fallback.alternatives;

  return {
    source: "llm",
    bestSlotId: selected.id,
    decisionTitle: cleanText(decision.decisionTitle, fallback.decisionTitle),
    driverAdvice: cleanText(decision.driverAdvice, fallback.driverAdvice),
    operatorNote: cleanText(decision.operatorNote, fallback.operatorNote),
    riskSummary: cleanText(decision.riskSummary, fallback.riskSummary),
    alternatives: alternatives.length ? alternatives : fallback.alternatives,
  };
}

function cleanText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length >= 8 && trimmed.length <= 220 ? trimmed : fallback;
}

function cleanReasons(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const reasons = value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter((item) => item.length >= 6 && item.length <= 160).slice(0, 3);
  return reasons.length ? reasons : fallback;
}

function parseJsonObject(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(content.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function formatTime(value: Date | string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function preferenceLabel(value: OptimizationPreference) {
  if (value === "FASTEST") return "vào cảng nhanh";
  if (value === "LOW_CONGESTION") return "giảm ùn tắc";
  return "điểm xanh và CO2";
}
