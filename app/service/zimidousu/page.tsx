"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BackButton from "@/components/BackButton";
import { JJ_OHAENG } from "@/lib/saju";
import { PALACES, MAIN_STARS, ELEMENT_TO_STARS, JIJI_HANJA, getMyeonggungIndex, getMyeonggungJiji, getSingungJiji, getPalaceJiji, hourToJijiIndex } from "@/lib/zimidousu";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

export default function ZimidousuPage() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading" | "result">("entry");
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));
  const [result, setResult] = useState<{ myeonggungJj: string; singungJj: string; myeonggungIdx: number; lunarDay: number } | null>(null);

  async function handleAnalyze() {
    if (!form.birthYear || !form.birthMonth || !form.birthDay) return;
    let y = Number(form.birthYear), m = Number(form.birthMonth), d = Number(form.birthDay);
    let lunarMonth = m, lunarDay = d;
    try {
      const KLC = (await import("korean-lunar-calendar")).default;
      const klc = new KLC();
      if (form.calendarType === "lunar") {
        lunarMonth = m; lunarDay = d;
      } else {
        klc.setSolarDate(y, m, d);
        const lun = klc.getLunarCalendar();
        if (lun?.month) { lunarMonth = lun.month; lunarDay = lun.day; }
      }
    } catch {}
    const hIdx = hourToJijiIndex(form.birthHour);
    const myeonggungIdx = getMyeonggungIndex(lunarMonth, hIdx);
    const myeonggungJj = getMyeonggungJiji(lunarMonth, form.birthHour);
    const singungJj = getSingungJiji(lunarMonth, form.birthHour);
    setResult({ myeonggungJj, singungJj, myeonggungIdx, lunarDay });
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
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
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
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
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

  return (
    <main className="min-h-screen bg-[#0c0816] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-purple-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
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

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold text-gray-300 mb-3">자미두수 12궁(宮) 한눈에 보기</p>
          <div className="grid grid-cols-2 gap-2">
            {PALACES.map((p, i) => {
              const jj = palaceJiji[i];
              const isBody = jj === result.singungJj;
              return (
                <div key={i} className={`rounded-xl p-3 ${i === 0 ? "bg-purple-900/30 border border-purple-700/40" : "bg-white/[0.02] border border-white/5"}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-bold text-gray-200">{p.name} ({p.hanja})</p>
                    <span className="text-[11px] text-purple-300 font-bold shrink-0 ml-1">{jj}({JIJI_HANJA[jj]})</span>
                  </div>
                  {isBody && <p className="text-[10px] text-fuchsia-400 font-bold mb-0.5">★ 신궁(身宮)</p>}
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{p.desc}</p>
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
