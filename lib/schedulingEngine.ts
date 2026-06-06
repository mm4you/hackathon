export type CongestionLevel = "LOW" | "MEDIUM" | "HIGH";
export type OptimizationPreference = "FASTEST" | "LOW_CONGESTION" | "ECO";

export type SlotInput = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  capacity: number;
  bookedCount: number;
  congestionLevel: CongestionLevel;
  estimatedWaitMinutes: number;
  greenBonus: number;
  port?: { id: string; name: string };
};

export type RecommendationResult<T extends SlotInput = SlotInput> = T & {
  rank: number;
  score: number;
  fitLabel: "Khung giờ xanh" | "Rất phù hợp" | "Có thể chọn" | "Cảnh báo kẹt xe";
  decision: "Khuyến nghị chọn" | "Có thể chọn nếu cần" | "Không nên chọn trừ khi bắt buộc";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  utilizationRate: number;
  greenCreditEarned: number;
  co2SavedKg: number;
  confidence: number;
  gateProcessingTargetSeconds: number;
  aiSummary: string;
  recommendedAction: string;
  timeFitMinutes: number;
  demandForecast: {
    label: "Ổn định" | "Có thể tăng tải" | "Nguy cơ quá tải";
    message: string;
    projectedUtilizationRate: number;
  };
  trafficSignal: {
    label: "Thoáng" | "Cần theo dõi" | "Cảnh báo kẹt xe";
    severity: "LOW" | "MEDIUM" | "HIGH";
    message: string;
  };
  modalShiftSuggestion: {
    shouldConsiderBarge: boolean;
    reason: string;
    estimatedTruckCo2Kg: number;
    estimatedBargeCo2Kg: number;
    potentialCo2ReductionPercent: number;
  };
  impact: {
    waitMinutesSaved: number;
    manualProcessMinutesSaved: number;
    costSavingEstimateVnd: number;
  };
  aiSignals: {
    congestionProbability: number;
    demandSurgeIndex: number;
    scheduleReliability: number;
    ecoEfficiencyScore: number;
    operationalStressScore: number;
    decisionGrade: "A" | "B" | "C" | "D";
  };
  reasons: string[];
  scoreBreakdown: {
    waitScore: number;
    utilizationPenalty: number;
    congestionPenalty: number;
    greenBonusImpact: number;
    preferenceAdjustment: number;
    preferredTimeAlignment: number;
    predictiveAdjustment: number;
  };
};

const congestionPenalty: Record<CongestionLevel, number> = {
  LOW: 4,
  MEDIUM: 22,
  HIGH: 48,
};

export function recommendTimeSlots<T extends SlotInput>(timeSlots: T[], preference: OptimizationPreference, limit = 4, preferredTime?: Date | string) {
  const available = timeSlots.filter((slot) => isAvailableSlot(slot));
  const baseline = buildBaseline(available);

  return available
    .map((slot) => buildRecommendation(slot, preference, baseline, preferredTime))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((slot, index) => ({ ...slot, rank: index + 1 }));
}

export function recommendBestTimeSlot<T extends SlotInput>(timeSlots: T[], preference: OptimizationPreference, preferredTime?: Date | string) {
  return recommendTimeSlots(timeSlots, preference, 1, preferredTime)[0] ?? null;
}

export function analyzeTimeSlot<T extends SlotInput>(slot: T, preference: OptimizationPreference, preferredTime?: Date | string) {
  return buildRecommendation(slot, preference, {
    averageWaitMinutes: slot.estimatedWaitMinutes,
    averageCo2SavedKg: calculateCo2SavedKg(slot),
  }, preferredTime);
}

export function calculateGreenCredit(slot: SlotInput) {
  const utilizationRate = utilization(slot);
  const baseCompletion = 25;
  const lowWaitBonus = Math.max(0, 35 - slot.estimatedWaitMinutes);
  const lowCongestionBonus = slot.congestionLevel === "LOW" ? 35 : slot.congestionLevel === "MEDIUM" ? 16 : 0;
  const offPeakBonus = utilizationRate < 0.55 ? 28 : utilizationRate < 0.8 ? 14 : 0;
  const ecoBonus = Math.round(slot.greenBonus * 0.65);
  return baseCompletion + lowWaitBonus + lowCongestionBonus + offPeakBonus + ecoBonus;
}

export function calculateCo2SavedKg(slot: SlotInput) {
  const idleReduction = Math.max(0, 50 - slot.estimatedWaitMinutes) * 0.12;
  const greenImpact = slot.greenBonus * 0.045;
  const congestionImpact = slot.congestionLevel === "LOW" ? 1.4 : slot.congestionLevel === "MEDIUM" ? 0.6 : 0;
  return Number(Math.max(0.8, idleReduction + greenImpact + congestionImpact).toFixed(1));
}

function buildRecommendation<T extends SlotInput>(slot: T, preference: OptimizationPreference, baseline: { averageWaitMinutes: number; averageCo2SavedKg: number }, preferredTime?: Date | string): RecommendationResult<T> {
  const utilizationRate = utilization(slot);
  const waitScore = slot.estimatedWaitMinutes;
  const utilizationPenalty = Math.round(utilizationRate * 30) + slot.bookedCount * 1.2;
  const penalty = congestionPenalty[slot.congestionLevel];
  const greenBonusImpact = -slot.greenBonus * 0.85;
  const preferenceAdjustment = getPreferenceAdjustment(slot, preference);
  const timeFitMinutes = getTimeFitMinutes(slot, preferredTime);
  const preferredTimeAlignment = getPreferredTimeAlignment(timeFitMinutes);
  const score = waitScore + utilizationPenalty + penalty + greenBonusImpact + preferenceAdjustment + preferredTimeAlignment;
  const riskLevel = getRiskLevel(slot, utilizationRate);
  const co2SavedKg = calculateCo2SavedKg(slot);
  const greenCreditEarned = calculateGreenCredit(slot);
  const waitMinutesSaved = Math.max(0, Math.round(baseline.averageWaitMinutes - slot.estimatedWaitMinutes));
  const trafficSignal = getTrafficSignal(slot, riskLevel);
  const demandForecast = getDemandForecast(slot, utilizationRate);
  const modalShiftSuggestion = getModalShiftSuggestion(slot);
  const aiSignals = getAiSignals(slot, utilizationRate, timeFitMinutes, riskLevel, demandForecast, co2SavedKg, greenCreditEarned);
  const predictiveAdjustment = getPredictiveAdjustment(aiSignals, preference);
  const aiSummary = buildAiSummary(slot, riskLevel, preference, waitMinutesSaved, demandForecast, timeFitMinutes);
  const finalScore = score + predictiveAdjustment;

  return {
    ...slot,
    rank: 0,
    score: Number(finalScore.toFixed(1)),
    fitLabel: getFitLabel(finalScore, riskLevel),
    decision: riskLevel === "LOW" ? "Khuyến nghị chọn" : riskLevel === "MEDIUM" ? "Có thể chọn nếu cần" : "Không nên chọn trừ khi bắt buộc",
    riskLevel,
    utilizationRate: Math.round(utilizationRate * 100),
    greenCreditEarned,
    co2SavedKg,
    confidence: getConfidence(slot, utilizationRate, penalty),
    gateProcessingTargetSeconds: 30,
    aiSummary,
    recommendedAction: getRecommendedAction(riskLevel, demandForecast, preference),
    timeFitMinutes,
    demandForecast,
    trafficSignal,
    modalShiftSuggestion,
    impact: {
      waitMinutesSaved,
      manualProcessMinutesSaved: 13,
      costSavingEstimateVnd: Math.max(0, waitMinutesSaved * 1200 + (riskLevel === "LOW" ? 14000 : 0)),
    },
    aiSignals,
    reasons: buildReasons(slot, preference, utilizationRate, waitMinutesSaved, trafficSignal, timeFitMinutes, demandForecast),
    scoreBreakdown: {
      waitScore,
      utilizationPenalty: Number(utilizationPenalty.toFixed(1)),
      congestionPenalty: penalty,
      greenBonusImpact: Number(greenBonusImpact.toFixed(1)),
      preferenceAdjustment: Number(preferenceAdjustment.toFixed(1)),
      preferredTimeAlignment: Number(preferredTimeAlignment.toFixed(1)),
      predictiveAdjustment: Number(predictiveAdjustment.toFixed(1)),
    },
  };
}

function buildBaseline(timeSlots: SlotInput[]) {
  if (!timeSlots.length) return { averageWaitMinutes: 0, averageCo2SavedKg: 0 };
  return {
    averageWaitMinutes: Math.round(timeSlots.reduce((sum, slot) => sum + slot.estimatedWaitMinutes, 0) / timeSlots.length),
    averageCo2SavedKg: timeSlots.reduce((sum, slot) => sum + calculateCo2SavedKg(slot), 0) / timeSlots.length,
  };
}

function isAvailableSlot(slot: SlotInput) {
  return slot.capacity > 0 && slot.bookedCount < slot.capacity && new Date(slot.endTime).getTime() > new Date(slot.startTime).getTime();
}

function utilization(slot: SlotInput) {
  return slot.capacity > 0 ? Math.min(1, slot.bookedCount / slot.capacity) : 1;
}

function getPreferenceAdjustment(slot: SlotInput, preference: OptimizationPreference) {
  if (preference === "FASTEST") return slot.estimatedWaitMinutes * 0.75 - slot.greenBonus * 0.15;
  if (preference === "LOW_CONGESTION") return slot.congestionLevel === "HIGH" ? 40 : slot.congestionLevel === "MEDIUM" ? 12 : -12;
  if (preference === "ECO") return -slot.greenBonus * 1.2 - (slot.congestionLevel === "LOW" ? 12 : 0);
  return 0;
}

function getRiskLevel(slot: SlotInput, utilizationRate: number): "LOW" | "MEDIUM" | "HIGH" {
  if (slot.congestionLevel === "HIGH" || utilizationRate >= 0.85 || slot.estimatedWaitMinutes >= 40) return "HIGH";
  if (slot.congestionLevel === "MEDIUM" || utilizationRate >= 0.65 || slot.estimatedWaitMinutes >= 25) return "MEDIUM";
  return "LOW";
}

function getFitLabel(score: number, riskLevel: "LOW" | "MEDIUM" | "HIGH"): RecommendationResult["fitLabel"] {
  if (riskLevel === "HIGH") return "Cảnh báo kẹt xe";
  if (score <= 0) return "Khung giờ xanh";
  if (score <= 35) return "Rất phù hợp";
  return "Có thể chọn";
}

function getConfidence(slot: SlotInput, utilizationRate: number, penalty: number) {
  const value = 98 - utilizationRate * 28 - penalty * 0.45 + slot.greenBonus * 0.1;
  return Math.max(58, Math.min(96, Math.round(value)));
}

function getTimeFitMinutes(slot: SlotInput, preferredTime?: Date | string) {
  if (!preferredTime) return 0;
  const target = new Date(preferredTime).getTime();
  const start = new Date(slot.startTime).getTime();
  if (Number.isNaN(target) || Number.isNaN(start)) return 0;
  return Math.round(Math.abs(start - target) / 60000);
}

function getPreferredTimeAlignment(timeFitMinutes: number) {
  if (timeFitMinutes <= 30) return -14;
  if (timeFitMinutes <= 90) return -6;
  if (timeFitMinutes <= 180) return 4;
  return 14;
}

function getDemandForecast(slot: SlotInput, utilizationRate: number): RecommendationResult["demandForecast"] {
  const projectedUtilization = Math.min(100, Math.round((utilizationRate + (slot.congestionLevel === "HIGH" ? 0.14 : slot.congestionLevel === "MEDIUM" ? 0.08 : 0.04)) * 100));
  if (projectedUtilization >= 90 || slot.congestionLevel === "HIGH") {
    return {
      label: "Nguy cơ quá tải",
      message: "AI dự báo slot dễ bị dồn xe nếu có thêm booking gần giờ vào cổng.",
      projectedUtilizationRate: projectedUtilization,
    };
  }
  if (projectedUtilization >= 70 || slot.congestionLevel === "MEDIUM") {
    return {
      label: "Có thể tăng tải",
      message: "Slot còn khả dụng nhưng nên theo dõi vì tải có thể tăng trong cùng ca vận hành.",
      projectedUtilizationRate: projectedUtilization,
    };
  }
  return {
    label: "Ổn định",
    message: "Tải slot còn thấp, phù hợp để kéo xe khỏi vùng cao điểm.",
    projectedUtilizationRate: projectedUtilization,
  };
}

function getAiSignals(slot: SlotInput, utilizationRate: number, timeFitMinutes: number, riskLevel: "LOW" | "MEDIUM" | "HIGH", forecast: RecommendationResult["demandForecast"], co2SavedKg: number, greenCreditEarned: number): RecommendationResult["aiSignals"] {
  const hour = new Date(slot.startTime).getHours();
  const rushHourPressure = hour <= 9 || (hour >= 16 && hour <= 18) ? 28 : hour <= 15 ? 14 : 6;
  const congestionBase = slot.congestionLevel === "HIGH" ? 58 : slot.congestionLevel === "MEDIUM" ? 34 : 14;
  const forecastPressure = forecast.label === "Nguy cơ quá tải" ? 22 : forecast.label === "Có thể tăng tải" ? 10 : 0;
  const congestionProbability = clamp(Math.round(congestionBase + utilizationRate * 32 + forecastPressure + Math.max(0, slot.estimatedWaitMinutes - 25) * 0.7), 4, 96);
  const demandSurgeIndex = clamp(Math.round(utilizationRate * 55 + rushHourPressure + (forecast.projectedUtilizationRate - utilizationRate * 100) * 0.35), 0, 100);
  const scheduleReliability = clamp(Math.round(100 - congestionProbability * 0.42 - demandSurgeIndex * 0.22 - Math.min(28, timeFitMinutes / 8)), 1, 99);
  const ecoEfficiencyScore = clamp(Math.round(greenCreditEarned * 0.36 + co2SavedKg * 4.8 - slot.estimatedWaitMinutes * 0.28), 1, 99);
  const operationalStressScore = clamp(Math.round(congestionProbability * 0.52 + demandSurgeIndex * 0.34 + (riskLevel === "HIGH" ? 18 : riskLevel === "MEDIUM" ? 8 : 0)), 1, 99);
  const gradeScore = scheduleReliability * 0.38 + ecoEfficiencyScore * 0.28 + (100 - operationalStressScore) * 0.34;
  const decisionGrade = gradeScore >= 78 ? "A" : gradeScore >= 62 ? "B" : gradeScore >= 46 ? "C" : "D";

  return { congestionProbability, demandSurgeIndex, scheduleReliability, ecoEfficiencyScore, operationalStressScore, decisionGrade };
}

function getPredictiveAdjustment(signals: RecommendationResult["aiSignals"], preference: OptimizationPreference) {
  const riskPenalty = signals.operationalStressScore * 0.24 + signals.congestionProbability * 0.18 + signals.demandSurgeIndex * 0.12;
  const reliabilityBonus = signals.scheduleReliability * -0.16;
  const ecoBonus = preference === "ECO" ? signals.ecoEfficiencyScore * -0.18 : signals.ecoEfficiencyScore * -0.07;
  const fastestPenalty = preference === "FASTEST" ? signals.operationalStressScore * 0.08 : 0;
  return riskPenalty + reliabilityBonus + ecoBonus + fastestPenalty;
}

function getRecommendedAction(riskLevel: "LOW" | "MEDIUM" | "HIGH", forecast: RecommendationResult["demandForecast"], preference: OptimizationPreference) {
  if (riskLevel === "HIGH") return "Không ưu tiên slot này. Hãy chọn slot thay thế hoặc cân nhắc modal shift nếu hàng/tuyến phù hợp.";
  if (forecast.label === "Có thể tăng tải") return "Có thể đặt ngay, nhưng nên giữ slot sớm để tránh tải tăng gần giờ cao điểm.";
  if (preference === "ECO") return "Nên chọn slot này để tăng điểm xanh và giảm thời gian chờ.";
  if (preference === "LOW_CONGESTION") return "Nên chọn slot này để giảm rủi ro ùn tắc tại cổng.";
  return "Nên chọn slot này nếu ưu tiên tốc độ xử lý và vào cổng nhanh.";
}

function buildAiSummary(slot: SlotInput, riskLevel: "LOW" | "MEDIUM" | "HIGH", preference: OptimizationPreference, waitMinutesSaved: number, forecast: RecommendationResult["demandForecast"], timeFitMinutes: number) {
  const objective = preference === "ECO" ? "điểm xanh và CO2" : preference === "LOW_CONGESTION" ? "giảm ùn tắc" : "thời gian vào cổng";
  const riskText = riskLevel === "LOW" ? "rủi ro thấp" : riskLevel === "MEDIUM" ? "rủi ro vừa" : "rủi ro cao";
  const savedText = waitMinutesSaved > 0 ? `, tiết kiệm khoảng ${waitMinutesSaved} phút chờ` : "";
  const timeText = timeFitMinutes ? `, lệch ${timeFitMinutes} phút so với giờ mong muốn` : "";
  return `Slot này phù hợp với mục tiêu ${objective}: ${riskText}, dự báo ${forecast.label.toLowerCase()}${savedText}${timeText}, điểm xanh +${calculateGreenCredit(slot)}.`;
}

function getTrafficSignal(slot: SlotInput, riskLevel: "LOW" | "MEDIUM" | "HIGH"): RecommendationResult["trafficSignal"] {
  if (riskLevel === "HIGH") {
    return {
      label: "Cảnh báo kẹt xe",
      severity: "HIGH",
      message: "Slot này có nguy cơ dồn xe cao, nên tránh nếu không bắt buộc.",
    };
  }
  if (riskLevel === "MEDIUM") {
    return {
      label: "Cần theo dõi",
      severity: "MEDIUM",
      message: "Slot còn dùng được nhưng cần theo dõi nếu lượng xe tăng thêm.",
    };
  }
  return {
    label: "Thoáng",
    severity: "LOW",
    message: "Slot phù hợp để chủ động kéo xe khỏi giờ cao điểm.",
  };
}

function getModalShiftSuggestion(slot: SlotInput): RecommendationResult["modalShiftSuggestion"] {
  const estimatedTruckCo2Kg = Number(Math.max(12, slot.estimatedWaitMinutes * 1.1 + 18).toFixed(1));
  const estimatedBargeCo2Kg = Number((estimatedTruckCo2Kg * 0.35).toFixed(1));
  const shouldConsiderBarge = slot.congestionLevel === "HIGH" || slot.estimatedWaitMinutes >= 40;
  return {
    shouldConsiderBarge,
    reason: shouldConsiderBarge ? "Slot đường bộ có nguy cơ ùn tắc cao, nên cân nhắc chuyển một phần hàng sang sà lan nếu tuyến phù hợp." : "Đường bộ vẫn phù hợp cho slot này, chưa cần ưu tiên modal shift.",
    estimatedTruckCo2Kg,
    estimatedBargeCo2Kg,
    potentialCo2ReductionPercent: 65,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildReasons(slot: SlotInput, preference: OptimizationPreference, utilizationRate: number, waitMinutesSaved: number, trafficSignal: RecommendationResult["trafficSignal"], timeFitMinutes: number, forecast: RecommendationResult["demandForecast"]) {
  const reasons: string[] = [];
  if (timeFitMinutes <= 30) reasons.push("Gần đúng giờ mong muốn của tài xế nên ít làm lệch kế hoạch giao nhận.");
  if (slot.congestionLevel === "LOW") reasons.push("Mức ùn tắc thấp, phù hợp để giảm tải giờ cao điểm.");
  if (slot.estimatedWaitMinutes <= 15) reasons.push("Thời gian chờ dự kiến thấp, hỗ trợ mục tiêu xe qua cổng nhanh hơn.");
  if (utilizationRate < 0.6) reasons.push("Slot còn nhiều sức chứa nên giảm rủi ro dồn xe tại cổng.");
  if (slot.greenBonus >= 40) reasons.push("Điểm xanh cao vì slot giúp cảng phân bổ xe khỏi giờ cao điểm.");
  if (waitMinutesSaved > 0) reasons.push(`Tiết kiệm khoảng ${waitMinutesSaved} phút chờ so với trung bình các slot còn trống.`);
  if (preference === "ECO") reasons.push("Được ưu tiên theo mục tiêu giảm phát thải và tăng điểm xanh.");
  if (preference === "LOW_CONGESTION") reasons.push("Được ưu tiên theo mục tiêu tránh ùn tắc tại cổng.");
  if (preference === "FASTEST") reasons.push("Được ưu tiên theo mục tiêu vào cảng nhanh nhất.");
  if (forecast.label === "Ổn định") reasons.push("Dự báo tải slot ổn định, xác suất phát sinh hàng chờ thấp hơn.");
  if (trafficSignal.severity === "HIGH") reasons.push("Có cảnh báo kẹt xe, nên cân nhắc slot khác hoặc modal shift.");
  return reasons.slice(0, 5);
}
