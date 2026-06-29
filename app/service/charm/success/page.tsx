"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SajuResult } from "@/lib/saju";
import {
  ILGAN_CHARM_DB,
  SAL_CHARM_DB,
  JIJI_CHARM_DB,
  GAEWUN_DB,
  GEUK_CHARM_DB,
  calcCharmGrade,
  getSalCharmGrade,
  buildCharmAIPrompt,
  type CharmGradeResult,
} from "@/lib/charmEngine";
import ResultFooterActions from "@/components/ResultFooterActions";

export const dynamic = "force-dynamic";

const UUNSEONG_CHARM: Record<string, { title: string; desc: string; score: number; color: string }> = {
  장생: { title: "장생(長生) — 생기 있는 매력", desc: "자라나는 생명력처럼 신선하고 활기찬 매력. 이성에게 건강미와 긍정 에너지로 어필.", score: 85, color: "#4ade80" },
  목욕: { title: "목욕(沐浴) — 이성 최강 매력", desc: "전통적으로 가장 강한 이성 매력의 12운성. 타고난 에로틱한 분위기와 매혹적 외모.", score: 98, color: "#c4b5fd" },
  관대: { title: "관대(冠帶) — 당당한 매력", desc: "자신감 넘치는 자태. 사회적 지위와 능력에서 오는 매력.", score: 80, color: "#86efac" },
  건록: { title: "건록(建祿) — 독립적 매력", desc: "스스로 서는 자립적 매력. 의지가 강하고 자기 영역이 뚜렷한 타입.", score: 75, color: "#fbbf24" },
  제왕: { title: "제왕(帝旺) — 카리스마 최강", desc: "최고조의 에너지와 압도적 존재감. 모든 공간을 장악하는 리더십 매력.", score: 90, color: "#f59e0b" },
  쇠: { title: "쇠(衰) — 성숙한 매력", desc: "완숙하고 안정된 매력. 성숙함이 이성에게 신뢰감을 줍니다.", score: 65, color: "#94a3b8" },
  병: { title: "병(病) — 여린 예술적 매력", desc: "섬세하고 예술적인 분위기. 지적이고 감성적인 이성에게 깊이 어필합니다.", score: 60, color: "#64748b" },
  사: { title: "사(死) — 깊고 어두운 매력", desc: "정적이고 깊은 강렬함. 내면의 에너지가 미스터리한 매력을 형성합니다.", score: 65, color: "#f87171" },
  묘: { title: "묘(墓) — 신비로운 매력", desc: "감추어진 신비. 쉽게 파악되지 않는 미스터리함이 이성을 호기심으로 끌어당깁니다.", score: 60, color: "#ef4444" },
  절: { title: "절(絶) — 순간적 강렬한 매력", desc: "순간적으로 불타오르는 매력. 그 순간의 강렬함이 인상적입니다.", score: 70, color: "#dc2626" },
  태: { title: "태(胎) — 순수한 천진난만 매력", desc: "아이처럼 순수하고 꾸밈없는 매력. 보호본능을 자극하는 천진난만함.", score: 72, color: "#818cf8" },
  양: { title: "양(養) — 따뜻한 성장 매력", desc: "자라나는 생명처럼 따뜻하고 포근한 매력. 함께 성장하고 싶다는 느낌.", score: 70, color: "#a78bfa" },
};

type Stage = "confirming" | "generating" | "done" | "error";

function CharmSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const paymentKey = params.get("paymentKey") || "";
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 4900);

  const [stage, setStage] = useState<Stage>("confirming");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<SajuResult | null>(null);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [grade, setGrade] = useState<CharmGradeResult | null>(null);
  const [aiInsight, setAiInsight] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setErrorMsg("결제 정보가 올바르지 않습니다.");
      setStage("error");
      return;
    }

    let charmResult: SajuResult | null = null;
    let charmName = "";
    let charmGender: "male" | "female" = "female";
    let charmGrade: CharmGradeResult | null = null;

    try {
      const raw = sessionStorage.getItem("charmData");
      if (raw) {
        const { form, result: r } = JSON.parse(raw);
        charmResult = r;
        charmName = form.name || "";
        charmGender = form.gender || "female";
        charmGrade = calcCharmGrade(r);
        setResult(r);
        setName(charmName);
        setGender(charmGender);
        setGrade(charmGrade);
      }
    } catch {}

    async function run() {
      const receiptEmail = sessionStorage.getItem("receiptEmail") || undefined;

      // 1. 결제 승인
      try {
        setProgress(10);
        const res = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey, orderId, amount,
            customerEmail: receiptEmail,
            customerName: charmName || "고객",
            productName: "사주 매력 분석 프리미엄 보고서",
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "결제 승인 실패");
        }
        setProgress(30);
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : "결제 승인 실패");
        setStage("error");
        return;
      }

      // 2. 결제 완료 마킹
      sessionStorage.setItem("charmPaid", "true");
      setStage("generating");
      setProgress(40);

      // 3. AI 인사이트 생성
      if (charmResult && charmGrade) {
        try {
          setProgress(55);
          const prompt = buildCharmAIPrompt(charmName, charmGender, charmResult, charmGrade);
          const res = await fetch("/api/charm/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          });
          setProgress(80);
          if (res.ok) {
            const data = await res.json();
            setAiInsight(data.insight || "");
          }
        } catch {}
      }

      setProgress(100);
      setTimeout(() => setStage("done"), 500);
    }

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentKey, orderId, amount]);

  if (stage === "confirming" || stage === "generating") {
    const stageLabels = {
      confirming: "결제 승인 중...",
      generating: "AI 매력 보고서 생성 중...",
      done: "",
      error: "",
    };
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin mb-6" />
        <p className="text-lg font-bold text-white mb-2">{stageLabels[stage]}</p>
        <div className="w-64 bg-white/5 rounded-full h-2 mt-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #ec4899, #8b5cf6)" }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-4">{progress}%</p>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-4xl mb-4">❌</p>
        <p className="text-lg font-bold mb-2">결제 처리 실패</p>
        <p className="text-sm text-gray-400 mb-6">{errorMsg}</p>
        <button onClick={() => router.push("/service/charm/result")} className="bg-gradient-to-r from-pink-600 to-violet-600 text-white font-bold px-6 py-3 rounded-xl">
          돌아가기
        </button>
      </div>
    );
  }

  if (!result || !grade) return null;

  const ilgan = result.pillarsDetail.day.cg;
  const ilji = result.pillarsDetail.day.jj;
  const idata = ILGAN_CHARM_DB[ilgan];
  const jijiData = JIJI_CHARM_DB[ilji];
  const dominantEl = result.dominant[0] || "토";
  const gaewun = GAEWUN_DB[dominantEl];
  const geukData = GEUK_CHARM_DB[ilgan];
  const uunseong = result.pillarsDetail.day.uunseong;
  const uuCharm = UUNSEONG_CHARM[uunseong];
  const mySals = SAL_CHARM_DB.filter(s => result.sinsalList.some(sl => sl.name === s.key));

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const W = 210, margin = 20;
    let y = margin;

    const addText = (text: string, x: number, size: number, bold = false, color = "#ffffff") => {
      doc.setFontSize(size);
      doc.setTextColor(color);
      const lines = doc.splitTextToSize(text, W - x - margin);
      doc.text(lines, x, y);
      y += lines.length * size * 0.4 + 2;
    };

    // 배경
    doc.setFillColor(8, 8, 16);
    doc.rect(0, 0, W, 297, "F");

    // 표지
    addText(`${name}님의 매력 분석 보고서`, margin, 20, true, "#f472b6");
    y += 5;
    addText(`${grade.emoji} ${grade.grade}등급 — ${grade.label}`, margin, 14, false, grade.color);
    addText(`상위 ${Math.round(grade.topPercent)}% 이내`, margin, 11, false, "#94a3b8");
    addText(result.fourPillars, margin, 11, false, "#64748b");
    y += 10;

    // 일간 매력
    if (idata) {
      addText(`일간 매력: ${idata.name}`, margin, 14, true, "#e2e8f0");
      y += 2;
      addText(idata.coreMagic, margin, 10, false, "#94a3b8");
      addText(`핵심 키워드: ${idata.keywords.join(", ")}`, margin, 10, false, "#64748b");
      y += 5;
    }

    // 신살
    if (mySals.length > 0) {
      addText("보유 신살", margin, 13, true, "#e2e8f0");
      y += 2;
      mySals.forEach(s => {
        addText(`${s.icon} ${s.cat} (+${getSalCharmGrade(s, result)}점)`, margin + 5, 10, false, "#f472b6");
        addText(s.withSal.slice(0, 120) + (s.withSal.length > 120 ? "..." : ""), margin + 10, 9, false, "#94a3b8");
        y += 2;
      });
      y += 5;
    }

    // AI 인사이트
    if (aiInsight) {
      if (y > 240) { doc.addPage(); doc.setFillColor(8, 8, 16); doc.rect(0, 0, W, 297, "F"); y = margin; }
      addText("AI 매력 인사이트", margin, 13, true, "#e2e8f0");
      y += 2;
      addText(aiInsight, margin, 10, false, "#94a3b8");
      y += 5;
    }

    // 개운법
    if (gaewun) {
      if (y > 220) { doc.addPage(); doc.setFillColor(8, 8, 16); doc.rect(0, 0, W, 297, "F"); y = margin; }
      addText(`${gaewun.emoji} ${gaewun.title}`, margin, 13, true, "#e2e8f0");
      y += 2;
      addText(`행운 방향: ${gaewun.direction}`, margin + 5, 10, false, "#94a3b8");
      addText(`행운 음식: ${gaewun.food}`, margin + 5, 10, false, "#94a3b8");
      addText(`행운 향기: ${gaewun.scent}`, margin + 5, 10, false, "#94a3b8");
      addText(`행운 액세서리: ${gaewun.accessory}`, margin + 5, 10, false, "#94a3b8");
      y += 3;
      addText(gaewun.charm_tip, margin + 5, 10, false, "#64748b");
      y += 5;
    }

    // 극관계
    if (geukData) {
      if (y > 230) { doc.addPage(); doc.setFillColor(8, 8, 16); doc.rect(0, 0, W, 297, "F"); y = margin; }
      addText("극관계 — 나를 좋아할 이성", margin, 13, true, "#e2e8f0");
      y += 2;
      addText(`내가 끌리는 타입: ${geukData.geuk.join(", ")} 일간`, margin + 5, 10, false, "#94a3b8");
      addText(geukData.geukDesc, margin + 5, 10, false, "#64748b");
      addText(`나를 좋아할 타입: ${geukData.geukBy.join(", ")} 일간`, margin + 5, 10, false, "#94a3b8");
      addText(geukData.geukByDesc, margin + 5, 10, false, "#64748b");
      y += 5;
    }

    // 푸터
    if (y > 260) { doc.addPage(); doc.setFillColor(8, 8, 16); doc.rect(0, 0, W, 297, "F"); y = margin; }
    y = 285;
    addText("summerpalace.ai.kr | 여름궁전 매력 분석 보고서", margin, 8, false, "#374151");

    doc.save(`${name}_매력분석_보고서.pdf`);
  };

  return (
    <main className="min-h-screen bg-[#080810] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[700px] h-[700px] rounded-full bg-pink-900/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-24" id="charm-success-result">
        {/* 성공 배너 */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-black mb-1 bg-gradient-to-r from-pink-300 to-violet-300 bg-clip-text text-transparent">
            결제 완료!
          </h1>
          <p className="text-gray-400 text-sm">프리미엄 매력 보고서가 준비됐습니다</p>
        </div>

        {/* PDF 다운로드 */}
        <button
          onClick={handleDownloadPDF}
          className="w-full mb-6 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.97] shadow-2xl shadow-pink-900/40"
        >
          📄 PDF 보고서 다운로드
        </button>

        {/* 매력 등급 */}
        <div className="rounded-3xl border mb-5 overflow-hidden" style={{ borderColor: `${grade.color}44`, background: grade.bg }}>
          <div className="p-6 text-center">
            <div className="text-5xl mb-2">{grade.emoji}</div>
            <div className="text-6xl font-black mb-1" style={{ color: grade.color }}>{grade.grade}등급</div>
            <div className="text-lg font-bold text-white mb-2">{grade.label}</div>
            <div className="text-sm mb-4" style={{ color: grade.sc }}>상위 {Math.round(grade.topPercent)}% 이내</div>
            <div className="bg-black/20 rounded-xl p-3 text-xs text-gray-300">{grade.desc}</div>
          </div>
        </div>

        {/* AI 인사이트 */}
        {aiInsight && (
          <div className="bg-gradient-to-br from-violet-600/10 to-pink-600/10 border border-violet-500/25 rounded-2xl p-5 mb-4">
            <p className="text-xs font-bold tracking-widest text-violet-300 uppercase mb-3">🤖 AI 매력 인사이트</p>
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{aiInsight}</p>
          </div>
        )}

        {/* 일간 매력 카드 전체 */}
        {idata && (
          <div className="bg-gradient-to-br from-pink-600/10 to-violet-600/10 border border-pink-500/25 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{idata.emoji}</span>
              <div>
                <p className="font-black text-white">{idata.name}</p>
                <p className="text-xs" style={{ color: idata.classColor }}>{idata.charmClass}</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">{idata.body}</p>
            <div className="bg-white/[0.04] rounded-xl p-3 mb-3">
              <p className="text-xs text-gray-500 mb-1">외모 특징</p>
              <p className="text-sm text-gray-200">{idata.appearance}</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">비슷한 스타일</p>
              <p className="text-sm text-gray-200">{idata.celebs}</p>
            </div>
          </div>
        )}

        {/* 신살 완전 해설 */}
        {mySals.length > 0 && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-4">신살 완전 해설</p>
            <div className="space-y-4">
              {mySals.map(s => (
                <div key={s.key} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{s.icon}</span>
                    <span className="font-bold text-pink-200">{s.cat.replace(/^\S+\s*/, "")}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">+{getSalCharmGrade(s, result)}점</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{s.withSal}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 12운성 매력 */}
        {uuCharm && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">☯ 일주 12운성 매력</p>
            <p className="font-bold mb-1" style={{ color: uuCharm.color }}>{uuCharm.title}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{uuCharm.desc}</p>
          </div>
        )}

        {/* 지지 매력 타입 완전판 */}
        {jijiData && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">일지 매력 타입 완전판</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{jijiData.emoji}</span>
              <div>
                <p className="font-bold text-white">{jijiData.name}</p>
                <p className="text-xs text-gray-400">{jijiData.type}</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">{jijiData.body}</p>
            <div className="bg-white/[0.03] rounded-xl p-4 mb-3">
              <p className="text-xs text-pink-400 mb-2">💡 매력 발동 조건</p>
              <p className="text-sm text-gray-300">{jijiData.trigger}</p>
            </div>
          </div>
        )}

        {/* 개운법 완전판 */}
        {gaewun && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: gaewun.colorBg, border: `1px solid ${gaewun.color}33` }}>
            <div className="p-5">
              <p className="text-xs font-bold tracking-widest mb-4" style={{ color: gaewun.color }}>{gaewun.emoji} {gaewun.title}</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "행운 방향", value: gaewun.direction },
                  { label: "행운 계절", value: gaewun.season },
                  { label: "행운 시간", value: gaewun.time },
                  { label: "행운 음식", value: gaewun.food },
                  { label: "행운 향기", value: gaewun.scent },
                  { label: "행운 액세서리", value: gaewun.accessory },
                  { label: "인테리어 팁", value: gaewun.interior },
                  { label: "매일 할 것", value: gaewun.action },
                ].map((item, i) => (
                  <div key={i} className="bg-black/20 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    <p className="text-xs text-gray-200">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-black/20 rounded-xl p-4 mb-3">
                <p className="text-xs text-gray-400 mb-2">💡 매력 개운 핵심 팁</p>
                <p className="text-sm text-gray-200 leading-relaxed">{gaewun.charm_tip}</p>
              </div>
              <div className="bg-black/10 rounded-xl p-3">
                <p className="text-xs text-gray-600 italic">{gaewun.viral}</p>
              </div>
            </div>
          </div>
        )}

        {/* 극관계 */}
        {geukData && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-4">극관계 — 이성 공략법</p>

            <div className="mb-4">
              <p className="text-sm font-bold text-pink-300 mb-2">내가 끌리는 이성: {geukData.geuk.join(", ")} 일간</p>
              <p className="text-xs text-gray-400 mb-3">{geukData.geukDesc}</p>
              {Object.entries(geukData.details || {}).map(([key, detail]) => (
                <div key={key} className="bg-white/[0.03] rounded-xl p-3 mb-2">
                  <p className="text-sm font-bold text-pink-200 mb-1">{detail.title}</p>
                  <p className="text-xs text-gray-500 mb-1">{detail.law}</p>
                  <p className="text-xs text-gray-400 mb-1">{detail.charm}</p>
                  <p className="text-xs text-gray-400 mb-1">{detail.love}</p>
                  <p className="text-xs text-pink-400">💡 {detail.tip}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-bold text-violet-300 mb-2">나를 좋아할 이성: {geukData.geukBy.join(", ")} 일간</p>
              <p className="text-xs text-gray-400">{geukData.geukByDesc}</p>
            </div>
          </div>
        )}

        {/* 다시 분석 */}
        <button onClick={() => router.push("/service/charm")} className="w-full mt-2 py-3 rounded-xl border border-white/10 text-gray-600 hover:text-gray-400 text-sm transition">
          다시 분석하기
        </button>
        <div className="text-center mt-4 mb-4">
          <p className="text-xs text-gray-700">본 분석은 사주 이론 기반 오락용 콘텐츠입니다. summerpalace.ai.kr</p>
        </div>
        <ResultFooterActions targetId="charm-success-result" fileName="매력분석_프리미엄" shareTitle="내 매력 분석 프리미엄 보고서" shareText="Summer Palace에서 내 매력 등급을 분석했어요" />
      </div>
    </main>
  );
}

export default function CharmSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
      </div>
    }>
      <CharmSuccessContent />
    </Suspense>
  );
}
