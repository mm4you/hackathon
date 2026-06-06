# Module 5 Scheduling Engine

Cap nhat 2026-06-05: advisor da duoc nang cap.
Cap nhat 2026-06-06: them LLM adapter OpenAI-compatible co fallback heuristic.

## Nang cap AI advisor

- Recommendation co tinh do lech so voi gio mong muon cua tai xe.
- Them demand forecast: on dinh, co the tang tai, nguy co qua tai.
- Them AI dispatch brief va recommended action de demo nhu tro ly dieu phoi.
- Them preferred-time alignment vao score breakdown.
- Booking UI hien confidence, forecast, action, modal shift advisor va impact.
- Van la heuristic explainable, chua goi ML/external AI service de tranh phu thuoc va de demo on dinh.
- Them `v2/lib/llmAdvisor.ts` de viet lai summary/action/reasons bang LLM neu co `LLM_API_KEY`.
- Neu khong co key, LLM timeout hoac provider loi, API tu fallback ve heuristic hien tai de booking van chay.
- LLM khong duoc doi rank/id/so lieu, chi viet lai copy giai thich ngan gon.
- Default LLM provider/model de demo free: OpenRouter `openai/gpt-oss-20b:free` de giam latency khi bam tim slot.
- Them `v2/lib/portTrafficContext.ts` de tao context du lieu cho recommendation.
- Du lieu cang Cat Lai realtime khong thay co API public; MVP dung simulation theo gio, utilization va bookedCount.
- Traffic realtime optional dung TomTom Traffic API neu co `TOMTOM_API_KEY`; neu khong co key thi fallback simulation traffic.
- Booking UI hien ro nguon du lieu: TomTom + mo phong van hanh cang, hoac mo phong demo.
- Them AI Decision Advisor: backend tra `aiDecision` gom bestSlotId, driverAdvice, operatorNote, riskSummary va alternatives.
- Neu co LLM key, LLM duoc phep chon chien luoc trong danh sach slot nhung backend guardrail khong cho chon slot invalid/high-risk khi con slot an toan.
- Neu khong co LLM key hoac LLM loi, advisor fallback heuristic va van tra duoc decision cho UI.
- Nang cap scoring thanh hybrid multi-signal: congestionProbability, demandSurgeIndex, scheduleReliability, ecoEfficiencyScore, operationalStressScore va decisionGrade.
- Cac AI signals nay anh huong truc tiep den score qua predictiveAdjustment, khong chi hien thi tren UI.
- LLM decision prompt nhan ca AI signals de lap luan tren output cua thuat toan thay vi chi doc wait/congestion tho.
- Toi uu latency 2026-06-06: booking endpoint chi goi LLM cho AI Decision voi timeout rat ngan; neu LLM cham thi fallback hybrid heuristic ngay de nut Tim slot uu tien toc do.

Trang thai: hoan thanh ban dau trong `v2/`.

## Muc tieu

Tao engine goi y khung gio theo concept CXV: AI dat hen chu dong, khung gio xanh, canh bao ket xe, tin chi xanh va tac dong CO2.

## Da lam

- Tao `v2/lib/schedulingEngine.ts`.
- Engine khong phu thuoc Prisma type truc tiep de de test va de migrate.
- Input la danh sach `SlotInput` va `OptimizationPreference`.
- Output la `RecommendationResult` co score, rank, fit label, risk, confidence, reasons va impact.

## Tieu chi scoring

- Wait time cang thap cang tot.
- Utilization/bookedCount cao bi phat diem.
- Congestion HIGH bi phat nang.
- Green bonus lam diem tot hon.
- Preference thay doi scoring theo FASTEST, LOW_CONGESTION, ECO.

## Diem bam sat slide CXV

- Dung label "Khung gio xanh" va "Canh bao ket xe".
- Co `gateProcessingTargetSeconds = 30` theo concept cong tu dong mo trong 30 giay.
- Co `trafficSignal` de sau nay tich hop du lieu giao thong thanh pho.
- Co `modalShiftSuggestion` de mo rong tu van sa lan/modal shift.
- Co `impact` gom wait minutes saved, manual process saved va cost saving estimate.
- Reasons giai thich vi sao AI de xuat slot.

## Can test khi gan API recommendation

- Slot full capacity khong duoc recommend.
- Slot endTime <= startTime khong duoc recommend.
- ECO phai uu tien slot greenBonus cao/congestion thap.
- LOW_CONGESTION phai tranh HIGH.
- FASTEST phai uu tien wait time thap.
- Recommendation phai co ly do tieng Viet de hien thi cho PM/client.
