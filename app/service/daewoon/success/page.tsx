"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { analyzeSaju, calcDaewoon, calcSewoon } from "@/lib/saju";
import type { DaewoonResult, SewoonItem } from "@/lib/saju";
import ResultFooterActions from "@/components/ResultFooterActions";

export const dynamic = "force-dynamic";

const ELEMENT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  목: { bg: "rgba(30,40,30,0.7)",  text: "#86efac", border: "rgba(134,239,172,0.15)" },
  화: { bg: "rgba(40,20,20,0.7)",  text: "#fca5a5", border: "rgba(252,165,165,0.15)" },
  토: { bg: "rgba(40,32,10,0.7)",  text: "#fcd34d", border: "rgba(252,211,77,0.15)"  },
  금: { bg: "rgba(20,20,36,0.7)",  text: "#c4b5fd", border: "rgba(196,181,253,0.15)" },
  수: { bg: "rgba(10,22,38,0.7)",  text: "#93c5fd", border: "rgba(147,197,253,0.15)" },
};

const UUNSEONG_FORTUNE: Record<string, { score: number; color: string; desc: string; advice: string }> = {
  장생: { score:9, color:"#4ade80", desc:"새로운 시작과 성장의 기운", advice:"새로운 사업이나 관계를 시작하기 최적의 시기입니다. 씨앗을 심으면 반드시 자랍니다." },
  목욕: { score:6, color:"#34d399", desc:"감성적이고 풍류적인 기운", advice:"창의적이고 감성적인 활동에 집중하세요. 인간관계가 활발해지는 시기입니다." },
  관대: { score:8, color:"#60a5fa", desc:"배움과 성장, 사회적 진출의 기운", advice:"자격증 취득, 학업, 새 직책 도전에 좋습니다. 사회적 인정을 받을 수 있습니다." },
  건록: { score:10, color:"#818cf8", desc:"가장 안정적이고 건실한 최길 기운", advice:"이 대운에 한 직업에 충실하면 큰 성과를 얻습니다. 재물이 쌓이고 건강도 좋습니다." },
  제왕: { score:10, color:"#c084fc", desc:"에너지 최고조, 성공과 지배의 기운", advice:"리더십을 발휘하고 큰 도전을 하세요. 가장 강한 대운으로 무엇이든 이룰 수 있습니다." },
  쇠: { score:5, color:"#94a3b8", desc:"기운이 꺾이고 안정을 추구하는 시기", advice:"무리하게 새 일을 시작하기보다 현재를 안정시키는 데 집중하세요. 내실이 중요합니다." },
  병: { score:3, color:"#fb923c", desc:"몸과 마음이 지치고 어려움이 따르는 기운", advice:"건강 관리가 최우선입니다. 과로와 스트레스를 줄이고, 새 투자나 모험은 피하세요." },
  사: { score:1, color:"#ef4444", desc:"에너지가 소진되고 끝맺음의 기운", advice:"새로운 시작보다 마무리와 정리에 집중하세요. 부동산·투자 결정을 미루는 것이 현명합니다." },
  묘: { score:1, color:"#dc2626", desc:"정체와 답답함, 기다림의 시기", advice:"이 시기는 참고 기다리는 것이 최선입니다. 무리한 행동보다 내실을 쌓아두세요." },
  절: { score:2, color:"#9333ea", desc:"단절과 전환, 새 출발의 준비 기운", advice:"이전 것을 과감히 끊어내고 새로운 방향을 준비하세요. 이별이나 이직이 오히려 행운이 됩니다." },
  태: { score:6, color:"#fb923c", desc:"새로운 씨앗이 잉태되는 기운", advice:"현재 눈에 보이지 않아도 내면에서 새로운 가능성이 자라고 있습니다. 계획과 구상에 집중하세요." },
  양: { score:7, color:"#fbbf24", desc:"서서히 자라나는 성장의 기운", advice:"꾸준한 노력이 빛을 발하는 시기입니다. 급하게 결과를 내려 하지 말고 천천히 성장하세요." },
};

function DaewoonSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 15000);

  const [status, setStatus] = useState<"confirming" | "analyzing" | "done" | "error">("confirming");
  const [progress, setProgress] = useState(10);
  const [daewoon, setDaewoon] = useState<DaewoonResult | null>(null);
  const [sewoon, setSewoon] = useState<SewoonItem[]>([]);
  const [ilgan, setIlgan] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [aiInsight, setAiInsight] = useState("");
  const [birthYear, setBirthYear] = useState(1990);

  useEffect(() => {
    (async () => {
      // 결제 확인
      try {
        const paymentKey = params.get("paymentKey") || "";
        const receiptEmail = sessionStorage.getItem("receiptEmail") || undefined;
        setProgress(20);
        if (paymentKey) {
          const raw2 = sessionStorage.getItem("daewoonData");
          const parsedName = raw2 ? (JSON.parse(raw2).name || "고객") : "고객";
          const res = await fetch("/api/payment/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentKey, orderId, amount,
              customerEmail: receiptEmail,
              customerName: parsedName,
              productName: "대운·세운 프리미엄 보고서",
            }),
          });
          if (!res.ok) throw new Error("결제 확인 실패");
        }
        sessionStorage.setItem("daewoonPaid", "true");
        setProgress(40);
      } catch {
        setStatus("error");
        return;
      }

      // 사주 계산
      setStatus("analyzing");
      setProgress(55);
      try {
        const raw = sessionStorage.getItem("daewoonData");
        if (!raw) { setStatus("error"); return; }
        const data = JSON.parse(raw);
        const { name: n, gender: g, birthYear: by, birthMonth: bm, birthDay: bd, birthHour: bh } = data;
        setName(n || ""); setGender(g || "female"); setBirthYear(by);

        const r = analyzeSaju({
          birthYear: by, birthMonth: bm, birthDay: bd,
          birthHour: bh ?? null, birthMinute: 0,
          name: n || "분석", gender: g || "female",
          birthPlace: "서울", style: "auto", productType: "report", useJajasi: false,
        });

        const mp = r.pillarsDetail.month;
        const dw = calcDaewoon(by, bm, bd, g, r.pillarsDetail.day.cg, mp);
        const sw = calcSewoon(by, r.pillarsDetail.day.cg);
        setIlgan(r.pillarsDetail.day.cg);
        setDaewoon(dw);
        setSewoon(sw);
        setProgress(70);

        // AI 인사이트
        const currentDw = dw.pillars[dw.currentIdx];
        const prompt = `당신은 전통 사주 대운 전문가입니다. 다음 사주 주인의 현재 대운에 대해 한국어로 3문장의 핵심 조언을 드려주세요.
이름: ${n || "의뢰인"}, 성별: ${g === "male" ? "남성" : "여성"}, 출생년도: ${by}년
일간: ${r.pillarsDetail.day.cg}, 현재 대운: ${currentDw.cg}${currentDw.jj}(${currentDw.age}세~)
현재 대운 12운성: ${currentDw.uunseong}, 십성: ${currentDw.sipseongCg}
인생의 현재 흐름과 앞으로 10년간 집중해야 할 방향을 구체적으로 조언해주세요.`;

        try {
          const aiRes = await fetch("/api/charm/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          });
          if (aiRes.ok) {
            const { insight } = await aiRes.json();
            setAiInsight(insight || "");
          }
        } catch {}

        setProgress(100);
        setStatus("done");
      } catch {
        setStatus("error");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "confirming" || status === "analyzing") {
    return (
      <main className="min-h-screen bg-[#0d0700] flex flex-col items-center justify-center px-4">
        <div className="text-5xl mb-6">{status === "confirming" ? "💳" : "⏳"}</div>
        <h2 className="text-lg font-bold text-white mb-2">
          {status === "confirming" ? "결제 확인 중..." : "대운 분석 중..."}
        </h2>
        <p className="text-sm text-gray-500 mb-8">잠시만 기다려주세요</p>
        <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-3">{progress}%</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen bg-[#0d0700] flex flex-col items-center justify-center px-4">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-lg font-bold text-white mb-2">오류가 발생했습니다</h2>
        <p className="text-sm text-gray-500 mb-6">결제는 완료되었으니 카카오 채널로 문의해주세요</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <a href="http://pf.kakao.com/_cuksX" target="_blank" rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold text-sm text-center">
            카카오 채널 문의
          </a>
          <button onClick={() => router.push("/service/daewoon")} className="w-full py-3 rounded-xl bg-white/10 text-white text-sm">
            다시 시도
          </button>
        </div>
      </main>
    );
  }

  if (!daewoon) return null;
  const nowYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[#0d0700] text-white pb-20">
      <div className="max-w-2xl mx-auto px-5 py-8" id="daewoon-success-result">
        {/* 성공 배너 */}
        <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-4 mb-6 text-center">
          <p className="text-green-400 font-bold">✓ 결제 완료 · 프리미엄 보고서 활성화</p>
          <p className="text-xs text-gray-500 mt-1">대운 80년 + 세운 14년 + AI 해설 전체 공개</p>
        </div>

        <h1 className="text-xl font-black mb-1">{name ? `${name}님의 ` : ""}대운·세운 완전 분석</h1>
        <p className="text-sm text-gray-500 mb-6">일간 <strong className="text-white">{ilgan}</strong> · {gender === "male" ? "남성" : "여성"} · {birthYear}년생 · {daewoon.direction}</p>

        {/* 교운기 */}
        <div className="bg-violet-500/10 border border-violet-500/25 rounded-2xl p-5 mb-6">
          <p className="text-xs text-violet-400 font-semibold mb-1">⏰ 교운기</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-violet-300">{daewoon.startAge}세</span>
            <span className="text-sm text-gray-400">에 첫 대운 진입</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            출생 후 {daewoon.startAge}세부터 10년마다 대운이 바뀝니다.
            교운기(대운 전환 시기) 1~2년 전후로 큰 변화가 올 수 있습니다.
          </p>
        </div>

        {/* AI 인사이트 */}
        {aiInsight && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-6">
            <p className="text-xs text-amber-400 font-semibold mb-2">✨ AI 대운 해설</p>
            <p className="text-sm text-gray-300 leading-relaxed">{aiInsight}</p>
          </div>
        )}

        {/* 대운 8개 전체 */}
        <h2 className="text-sm font-bold text-gray-300 mb-3">대운 8개 — 인생 80년 흐름</h2>
        <div className="space-y-3 mb-6">
          {daewoon.pillars.map((p, i) => {
            const isCurrentDw = i === daewoon.currentIdx;
            const elStyle = ELEMENT_COLOR[p.element] || ELEMENT_COLOR["토"];
            const uunsF = UUNSEONG_FORTUNE[p.uunseong];

            return (
              <div
                key={i}
                className="rounded-2xl border p-5"
                style={isCurrentDw
                  ? { background: `${elStyle.bg}cc`, borderColor: "#ca8a04" }
                  : { background: `${elStyle.bg}66`, borderColor: elStyle.border }
                }
              >
                {isCurrentDw && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">현재 대운</span>
                    <span className="text-xs text-gray-500">{nowYear}년 기준</span>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="text-3xl font-black" style={{ color: elStyle.text }}>{p.cg}{p.jj}</p>
                    <p className="text-xs text-gray-400 mt-1">{p.age}세~</p>
                    <p className="text-[10px] text-gray-600">{p.dateStart ? `${p.dateStart.year}.${String(p.dateStart.month).padStart(2,"0")}.${String(p.dateStart.day).padStart(2,"0")}` : `${p.yearStart}년`}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">{p.sipseongCg}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">{p.sipseongJj}</span>
                      {uunsF && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${uunsF.color}22`, color: uunsF.color }}>
                          {p.uunseong}({uunsF.score}/10)
                        </span>
                      )}
                    </div>
                    {uunsF && (
                      <>
                        <p className="text-xs text-gray-400 mb-1">{uunsF.desc}</p>
                        <p className="text-xs text-gray-300 leading-relaxed border-t border-white/10 pt-2 mt-2">{uunsF.advice}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 세운 14년치 */}
        <h2 className="text-sm font-bold text-gray-300 mb-3">세운 — 연도별 흐름</h2>
        <div className="space-y-2 mb-8">
          {sewoon.map(s => {
            const elStyle = ELEMENT_COLOR[s.element] || ELEMENT_COLOR["토"];
            const uunsF = UUNSEONG_FORTUNE[s.uunseong];
            return (
              <div
                key={s.year}
                className="flex items-center gap-4 rounded-xl border p-3"
                style={s.isCurrent
                  ? { background: `${elStyle.bg}cc`, borderColor: "#fbbf24" }
                  : { background: `${elStyle.bg}44`, borderColor: elStyle.border }
                }
              >
                <div className="min-w-[44px] text-center">
                  <p className="text-[10px] text-gray-500">{s.year}</p>
                  <p className="text-lg font-black" style={{ color: elStyle.text }}>{s.cg}{s.jj}</p>
                  {s.isCurrent && <p className="text-[9px] text-yellow-400 font-bold">올해</p>}
                </div>
                <div className="flex-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white">{s.sipseongCg}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white">{s.sipseongJj}</span>
                  {uunsF && (
                    <span className="text-xs font-semibold" style={{ color: uunsF.color }}>{s.uunseong}</span>
                  )}
                </div>
                {uunsF && (
                  <div className="text-right min-w-[32px]">
                    <p className="text-lg font-black" style={{ color: uunsF.color }}>{uunsF.score}</p>
                    <p className="text-[9px] text-gray-600">점</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 하단 버튼 */}
        <div className="flex flex-col gap-3">
          <a
            href="http://pf.kakao.com/_cuksX"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-700/30 text-sm text-yellow-400 text-center transition"
          >
            카카오 채널 문의
          </a>
        </div>
        <ResultFooterActions targetId="daewoon-success-result" fileName="대운세운분석" shareTitle="내 대운·세운 완전 분석" shareText="Summer Palace에서 내 대운·세운을 분석했어요" />
      </div>
    </main>
  );
}

export default function DaewoonSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0700] flex items-center justify-center"><p className="text-gray-500 text-sm">로딩 중...</p></div>}>
      <DaewoonSuccessContent />
    </Suspense>
  );
}
