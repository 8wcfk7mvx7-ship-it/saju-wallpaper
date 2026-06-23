"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BackButton from "@/components/BackButton";
import { JJ_OHAENG } from "@/lib/saju";
import { PALACES, MAIN_STARS, ELEMENT_TO_STARS, JIJI_HANJA, getMyeonggungIndex, getMyeonggungJiji, getSingungJiji, getPalaceJiji, hourToJijiIndex, matchZimiTmi, getBucheoNarrative } from "@/lib/zimidousu";
import { calcZiwei, getHourBranchIndex, BRANCHES, type ZiweiResult } from "@/lib/ziwei";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

const STAR_COLOR: Record<string, string> = {
  자미: "#fbbf24", 천부: "#fbbf24",
  천기: "#60a5fa", 태음: "#60a5fa", 천량: "#60a5fa",
  태양: "#f87171", 염정: "#f87171", 칠살: "#f87171",
  무곡: "#a5b4fc", 천동: "#a5b4fc", 거문: "#a5b4fc",
  탐랑: "#4ade80", 천상: "#4ade80", 파군: "#4ade80",
};

// ziwei.ts의 PALACE_NAMES와 동일한 순서 (명궁→...→부모). 노복궁/교우궁처럼 표기만 다른 동일 궁 매칭용
const ZIWEI_PALACE_ORDER = ["명궁", "형제", "부처", "자녀", "재백", "질액", "천이", "교우", "관록", "전택", "복덕", "부모"];

function palaceAnalysis(zp: { stars: string[]; luckyStars: string[]; maleficStars: string[]; minorStars: string[] }, label: string): string {
  let text: string;
  if (zp.stars.length === 0) {
    text = `${label}에는 자리한 주성이 없는 공궁(空宮)이에요. 맞은편 궁의 기운을 빌려와 해석하는 자리라, 환경과 인연에 따라 색깔이 크게 달라질 수 있어요.`;
  } else {
    const keywords = zp.stars.map(s => MAIN_STARS[s]?.keyword).filter(Boolean);
    text = `${label}에는 ${zp.stars.join("·")}이 자리하고 있어요. ${keywords.join(", ")}의 기운이 이 영역에서 강하게 드러나요.`;
  }
  if (zp.luckyStars.length > 0) text += ` 보좌성 ${zp.luckyStars.join("·")}가 함께해 이 궁의 힘을 더 키워줘요.`;
  if (zp.maleficStars.length > 0) text += ` 다만 ${zp.maleficStars.join("·")} 같은 살성도 자리해 기복이나 돌발 변수에 대한 대비가 필요해요.`;
  if (zp.minorStars.length > 0) text += ` ${zp.minorStars.join("·")} 같은 잡성도 함께 있어, 이 궁이 보여주는 이야기에 미묘한 결을 하나 더 더해줘요.`;
  return text;
}

// 4x4 그리드 좌표 → 지지 인덱스 매핑 (전통 자미두수 12궁 배치)
const GRID_BRANCH: (number | null)[][] = [
  [5, 6, 7, 8],
  [4, null, null, 9],
  [3, null, null, 10],
  [2, 1, 0, 11],
];

export default function ZimidousuPage() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading" | "result">("entry");
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));
  const [result, setResult] = useState<{ myeonggungJj: string; singungJj: string; myeonggungIdx: number; lunarDay: number } | null>(null);
  const [chart, setChart] = useState<ZiweiResult | null>(null);

  async function handleAnalyze() {
    if (!form.birthYear || !form.birthMonth || !form.birthDay) return;
    let y = Number(form.birthYear), m = Number(form.birthMonth), d = Number(form.birthDay);
    let lunarYear = y, lunarMonth = m, lunarDay = d, isLeap = false;
    let gapja = { year: "", month: "", day: "" };
    try {
      const KLC = (await import("korean-lunar-calendar")).default;
      const klc = new KLC();
      if (form.calendarType === "lunar") {
        lunarYear = y; lunarMonth = m; lunarDay = d; isLeap = form.isLeapMonth;
        klc.setLunarDate(y, m, d, isLeap);
      } else {
        klc.setSolarDate(y, m, d);
        const lun = klc.getLunarCalendar();
        if (lun?.month) { lunarYear = lun.year; lunarMonth = lun.month; lunarDay = lun.day; isLeap = !!lun.intercalation; }
      }
      gapja = klc.getGapja();
    } catch {}
    const hIdx = hourToJijiIndex(form.birthHour);
    const myeonggungIdx = getMyeonggungIndex(lunarMonth, hIdx);
    const myeonggungJj = getMyeonggungJiji(lunarMonth, form.birthHour);
    const singungJj = getSingungJiji(lunarMonth, form.birthHour);
    setResult({ myeonggungJj, singungJj, myeonggungIdx, lunarDay });

    try {
      const hourBranchIndex = form.birthHour == null ? 0 : getHourBranchIndex(form.birthHour);
      const c = calcZiwei({
        lunarYear, lunarMonth, lunarDay, hourBranchIndex,
        gender: form.gender,
        yearGanjaText: gapja.year, monthGanjaText: gapja.month, dayGanjaText: gapja.day,
      });
      setChart(c);
    } catch {
      setChart(null);
    }

    setStep("loading");
  }

  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#0c0816] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-purple-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-5 py-16 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-purple-900/50 border border-purple-700/40 text-purple-300 text-xs font-bold tracking-wider mb-8">
            ✨ 사주와는 또 다른 시각 — 동양 점성술의 끝판왕
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            나의 <span className="text-purple-400">명궁(命宮)</span>과<br />
            대표 주성은?
          </h1>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            사주가 오행의 흐름을 본다면,<br />
            <span className="text-gray-300 font-medium">자미두수는 별의 자리로 캐릭터를 봅니다.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            14개의 별 중 당신을 대표하는 별은 무엇일까요?
          </p>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["명궁(命宮) 산출", "음력 생월과 태어난 시간으로 인생의 중심 궁을 찾아요"],
              ["대표 주성(主星) 풀이", "14주성 중 내 명궁과 대응하는 별의 성격·진로·연애 스타일"],
              ["12궁 데이터베이스", "형제·부부·재물·관록 등 12개 궁의 의미를 한눈에"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* TOP 10 관심 주제 */}
          <div className="w-full mb-10 text-left">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">실제 상담에서 가장 많이 묻는 질문</span>
              <span className="text-[10px] font-black text-fuchsia-400 bg-fuchsia-900/30 border border-fuchsia-700/30 px-2 py-0.5 rounded-full">TOP 10</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                ["💰", "부자 될 팔자인가"],
                ["💍", "배우자 수준"],
                ["💒", "결혼 시기"],
                ["🌟", "인생 최고 전성기"],
                ["🏢", "사업가 vs 직장인"],
                ["✨", "외모·매력"],
                ["🤝", "귀인복"],
                ["🔥", "바람기"],
                ["⚖️", "이혼수"],
                ["🎤", "유명해질 팔자인가"],
              ].map(([emoji, label], i) => (
                <div key={label} className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-2.5">
                  <span className="text-[11px] font-black text-purple-400/70 w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm">{emoji}</span>
                  <span className="text-xs text-gray-300 font-medium">{label}</span>
                </div>
              ))}
            </div>
            <div className="bg-purple-950/40 border border-purple-700/20 rounded-xl px-4 py-3">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                사람들이 자미두수에 묻는 순서는 늘 똑같아 —{" "}
                <span className="text-purple-300 font-bold">돈 → 배우자 → 성공 → 건강 → 성격</span>.{" "}
                재백궁·관록궁·부처궁·천이궁·복덕궁, 이 5개 궁이 그 질문에 전부 답해줌.
              </p>
            </div>
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold tracking-wider mb-6">
            ✦ 완전 무료
          </div>

          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-900/50 transition-all active:scale-[0.98]">
            내 명궁·주성 확인하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#0c0816] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-purple-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보(시간 포함)를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#a855f7" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            명궁·주성 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return (
      <AnalysisLoading
        subject="나의 명궁과 주성"
        duration={2200}
        onDone={() => setStep("result")}
        messages={[
          "음력 생월과 태어난 시간으로 명궁을 찾는 중...",
          "12궁의 배치를 계산하는 중...",
          "당신을 대표하는 별을 찾는 중...",
        ]}
      />
    );
  }

  // ── 결과 ──
  if (!result) return null;
  const { myeonggungJj } = result;
  const element = JJ_OHAENG[myeonggungJj] as "목" | "화" | "토" | "금" | "수";
  const candidates = ELEMENT_TO_STARS[element] || ["자미"];
  const starKey = candidates[result.lunarDay % candidates.length];
  const star = MAIN_STARS[starKey];
  const myeonggungPalace = PALACES[0];
  const palaceJiji = getPalaceJiji(result.myeonggungIdx);
  const tmiList = chart ? matchZimiTmi(chart.palaces) : [];
  const bucheoNarrative = chart ? getBucheoNarrative(chart.palaces) : "";

  return (
    <main className="min-h-screen bg-[#0c0816] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-purple-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-16">
        <div className="text-center mb-8">
          <p className="text-purple-400 text-xs font-bold tracking-widest mb-2">ZI WEI DOU SHU</p>
          <h1 className="text-2xl font-black leading-snug">
            명궁(命宮) — {myeonggungJj}({JIJI_HANJA[myeonggungJj]})궁
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-purple-300 mb-1">명궁(命宮)</p>
            <p className="text-lg font-black">{myeonggungJj}({JIJI_HANJA[myeonggungJj]})</p>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">선천적 기질·성격의 중심</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-fuchsia-300 mb-1">신궁(身宮)</p>
            <p className="text-lg font-black">{result.singungJj}({JIJI_HANJA[result.singungJj]})</p>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">후천적 노력·환경의 방향</p>
          </div>
        </div>

        {/* 전체 명반 — 12궁 + 14주성 배치 */}
        {chart && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 mb-5">
            <p className="text-sm font-bold text-gray-300 mb-1 px-1">자미두수 명반 (命盤)</p>
            <p className="text-[11px] text-purple-300 mb-3 px-1 font-bold">
              {chart.yearGanzhi} {chart.monthGanzhi} {chart.dayGanzhi} {chart.hourGanzhi} · {chart.bureauName}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {GRID_BRANCH.map((row, ri) =>
                row.map((branchIdx, ci) => {
                  if (branchIdx === null) {
                    if (ri === 1 && ci === 1) {
                      return (
                        <div key="center" className="row-span-2 col-span-2 rounded-xl flex flex-col items-center justify-center text-center p-3"
                          style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                          <p className="text-sm font-black mb-1">{form.name || "나"}</p>
                          <p className="text-[10px] text-gray-400 mb-2">
                            {form.gender === "male" ? "남" : "여"} · {chart.bureauName}
                          </p>
                          <p className="text-[10px] text-gray-500 leading-relaxed">
                            {chart.yearGanzhi}<br />{chart.monthGanzhi}<br />{chart.dayGanzhi}<br />{chart.hourGanzhi}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }
                  const palace = chart.palaces[branchIdx];
                  return (
                    <div key={branchIdx} className="rounded-xl p-2 min-h-[134px] flex flex-col"
                      style={{
                        background: palace.isLifePalace ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${palace.isLifePalace ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.06)"}`,
                      }}>
                      <div className="flex flex-wrap gap-x-1 mb-1">
                        {palace.stars.length > 0 ? palace.stars.map(s => (
                          <span key={s} className="text-[11px] font-black" style={{ color: STAR_COLOR[s] || "#e5e7eb" }}>{s}</span>
                        )) : <span className="text-[10px] text-gray-700">-</span>}
                      </div>
                      {(palace.luckyStars.length > 0 || palace.maleficStars.length > 0 || palace.minorStars.length > 0) && (
                        <div className="flex flex-wrap gap-x-1.5 mb-1">
                          {palace.luckyStars.map(s => (
                            <span key={s} className="text-[9px] font-bold text-emerald-400">{s}</span>
                          ))}
                          {palace.maleficStars.map(s => (
                            <span key={s} className="text-[9px] font-bold text-red-400">{s}</span>
                          ))}
                          {palace.minorStars.map(s => (
                            <span key={s} className="text-[9px] font-bold text-amber-400">{s}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex-1" />
                      <div className="flex items-center justify-between">
                        <div>
                          {palace.isLifePalace && <span className="text-[9px] font-black text-yellow-400 mr-1">命</span>}
                          {palace.isBodyPalace && <span className="text-[9px] font-black text-fuchsia-400 mr-1">身</span>}
                          <span className="text-[10px] text-gray-400">{palace.palaceName}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-gray-600">{BRANCHES[branchIdx]}</p>
                          <p className="text-[8px] text-gray-700">{palace.daeha.from}~{palace.daeha.to}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 부처궁(배우자운) 심층 분석 — 주성·보좌성·살성·잡성 조합을 풀어서 하나의 글로 엮음 */}
        {bucheoNarrative && (
          <div className="bg-gradient-to-br from-rose-950/40 to-purple-950/30 border border-rose-700/30 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-2">배우자운 심층 분석 (부처궁)</p>
            <p className="text-[12.5px] text-gray-300 leading-relaxed">{bucheoNarrative}</p>
          </div>
        )}

        {/* 명식에 실제로 등장하는 주성·궁 조합에 맞는 TMI만 골라서 보여줌 */}
        {tmiList.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-fuchsia-300 mb-3">내 명식에 해당하는 자미두수 TMI</p>
            <div className="space-y-3">
              {tmiList.map(t => (
                <div key={t.id} className="rounded-xl px-4 py-3 bg-fuchsia-950/20 border border-fuchsia-700/20">
                  <p className="text-[12.5px] text-gray-300 leading-relaxed">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-purple-950/60 to-fuchsia-950/40 border border-purple-700/30 rounded-3xl p-6 mb-5 text-center">
          <p className="text-purple-300 text-xs font-bold tracking-widest uppercase mb-2">나를 대표하는 주성</p>
          <p className="text-3xl font-black leading-snug mb-1">{star.name} ({star.hanja})</p>
          <p className="text-sm text-fuchsia-300 font-bold mb-3">{star.keyword}</p>
          <p className="text-sm text-gray-300 leading-relaxed text-left">{star.desc}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-5">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <p className="text-sm font-bold text-amber-300 mb-1">진로·일에서의 강점</p>
            <p className="text-sm text-gray-300 leading-relaxed">{star.career}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <p className="text-sm font-bold text-rose-300 mb-1">연애·관계 스타일</p>
            <p className="text-sm text-gray-300 leading-relaxed">{star.love}</p>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-sky-300 mb-1">{myeonggungPalace.name} ({myeonggungPalace.hanja})이란?</p>
          <p className="text-sm text-gray-300 leading-relaxed">{myeonggungPalace.desc}</p>
        </div>

        {/* 5대 궁 × 인기 질문 연결 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-gray-200 mb-1">사람들이 가장 궁금한 건 이 5개 궁에 다 있어</p>
          <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
            돈 → 배우자 → 성공 → 건강 → 성격 순서로 묻는 게 자미두수 상담의 공식.
          </p>
          <div className="space-y-2.5">
            {[
              {
                name: "재백궁", hanja: "財帛宮", color: "text-yellow-300",
                border: "border-yellow-700/30", bg: "bg-yellow-900/10",
                q: "부자 될 팔자인가?",
                desc: "돈이 어떤 방식으로 들어오는지, 재물운의 안정성, 재테크 스타일까지 여기서 봐.",
              },
              {
                name: "부처궁", hanja: "夫妻宮", color: "text-rose-300",
                border: "border-rose-700/30", bg: "bg-rose-900/10",
                q: "배우자 수준 / 결혼 시기 / 바람기 / 이혼수",
                desc: "이상형이 어떤 사람인지, 결혼 운이 빠른지 늦은지, 관계에서의 갈등 패턴도 드러남.",
              },
              {
                name: "관록궁", hanja: "官祿宮", color: "text-sky-300",
                border: "border-sky-700/30", bg: "bg-sky-900/10",
                q: "사업가 체질인가 직장인 체질인가? 유명해질 팔자인가?",
                desc: "직업 적성, 성취 방식, 사회적 지위의 최고점을 여기서 읽어.",
              },
              {
                name: "천이궁", hanja: "遷移宮", color: "text-emerald-300",
                border: "border-emerald-700/30", bg: "bg-emerald-900/10",
                q: "귀인복 / 인생 전성기는 언제?",
                desc: "밖에서 만나는 사람들의 수준, 귀인이 얼마나 들어오는지, 해외 운도 여기 달려 있어.",
              },
              {
                name: "복덕궁", hanja: "福德宮", color: "text-fuchsia-300",
                border: "border-fuchsia-700/30", bg: "bg-fuchsia-900/10",
                q: "외모·매력 / 타고난 복의 그릇",
                desc: "타고난 분위기와 매력, 삶을 즐기는 방식, 정신적 행복감의 기준점이 여기 있어.",
              },
            ].map((p) => (
              <div key={p.name} className={`rounded-xl px-4 py-3 border ${p.border} ${p.bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-black ${p.color}`}>{p.name} ({p.hanja})</span>
                  <span className="text-[10px] text-gray-500">→</span>
                  <span className="text-[11px] text-gray-300 font-bold">{p.q}</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold text-gray-300 mb-1">12궁(宮) 하나하나 분석</p>
          <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">명반에 실제로 배치된 주성·보좌성·살성을 그대로 풀어서, 궁마다 다른 해석을 보여드려요.</p>
          <div className="space-y-3">
            {PALACES.map((p, i) => {
              const jj = palaceJiji[i];
              const isBody = jj === result.singungJj;
              const zp = chart ? chart.palaces.find(cp => cp.palaceName === ZIWEI_PALACE_ORDER[i]) : undefined;
              return (
                <div key={i} className={`rounded-xl p-4 border ${i === 0 ? "bg-purple-900/30 border-purple-700/40" : "bg-white/[0.02] border-white/5"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-gray-200">{p.name} ({p.hanja})</p>
                      {isBody && <span className="text-[9px] font-black text-fuchsia-400">★身</span>}
                    </div>
                    <span className="text-[11px] text-purple-300 font-bold shrink-0 ml-1">{jj}({JIJI_HANJA[jj]})</span>
                  </div>
                  {zp && (
                    <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mb-1.5">
                      {zp.stars.map(s => <span key={s} className="text-[11px] font-black" style={{ color: STAR_COLOR[s] || "#e5e7eb" }}>{s}</span>)}
                      {zp.luckyStars.map(s => <span key={s} className="text-[10px] font-bold text-emerald-400">{s}</span>)}
                      {zp.maleficStars.map(s => <span key={s} className="text-[10px] font-bold text-red-400">{s}</span>)}
                      {zp.minorStars.map(s => <span key={s} className="text-[10px] font-bold text-amber-400">{s}</span>)}
                    </div>
                  )}
                  <p className="text-[11px] text-gray-500 leading-relaxed">{zp ? palaceAnalysis(zp, `${p.name}(${p.hanja})`) : p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/service/career")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            적성·진로 보기
          </button>
          <button onClick={() => { setStep("entry"); setResult(null); }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
      </div>
    </main>
  );
}
