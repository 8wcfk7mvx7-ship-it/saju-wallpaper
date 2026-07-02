"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import BackButton from "@/components/BackButton";
import StarShower from "@/components/StarShower";
import BirthInputForm, { BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import HapchungDiagram from "@/components/HapchungDiagram";
import ResultFooterActions from "@/components/ResultFooterActions";
import type { SajuResult } from "@/lib/saju";

export const dynamic = "force-dynamic";

type Step = "splash" | "my" | "their" | "loading" | "result";

interface ReunionResult {
  score: number; grade: string; oneLineSummary: string;
  currentHeart: string; reunionTiming: string;
  strategy: string; danger: string; compatibility: string;
  afterReunionCompat: string;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

const CONTACT_PATTERN_REUNION: Record<string, string> = {
  갑: "연락이 완전히 끊겼다가 어느 날 목적 있는 한 마디로 돌아옵니다. 재회를 원한다면 직접적이고 당당하게 접근하는 것이 효과적입니다.",
  을: "간접 신호(SNS 반응, 공통 지인 통한 안부)를 먼저 보낸 뒤 서서히 개인 연락으로 발전합니다. 직접 연락이 왔다면 오래 생각한 끝에 용기를 낸 것입니다.",
  병: "먼저 적극적으로 연락할 가능성이 높습니다. 연락이 갑자기 끊기면 마음이 완전히 떠난 신호입니다. 재회를 원한다면 활기찬 자리에서 자연스럽게 만날 기회를 만드세요.",
  정: "감성적인 콘텐츠를 공유하거나 새벽에 갑자기 연락하는 패턴이 있습니다. 재회를 원한다면 감성적 교감을 먼저 회복하는 것이 중요합니다.",
  무: "오랜 침묵 뒤 조용한 안부 한 마디가 전형적인 신호입니다. 먼저 연락이 왔다면 이미 많이 고민한 것입니다. 서두르지 말고 신뢰를 다시 쌓아가세요.",
  기: "직접 연락보다 SNS 조회·반응으로 존재를 먼저 알립니다. '밥 먹었어?'처럼 일상 안부성 메시지로 접근하는 것이 이 사람의 방식입니다. 재회 시도도 서서히 빈도를 높이는 형태로 나타납니다.",
  경: "침묵 아니면 직격탄입니다. 먼저 연락이 왔다면 이미 결심이 선 것입니다. 재회를 원한다면 돌려 말하지 말고 직접적으로 의사를 밝히세요.",
  신: "타이밍을 계산한 뒤 정성스럽게 다듬은 메시지를 보냅니다. 기념일이나 의미 있는 날에 연락이 올 가능성이 높습니다. 재회를 원한다면 감각적이고 준비된 만남을 제안하세요.",
  임: "가볍게 먼저 연락하다가 갑자기 사라지기도 합니다. 잠수 후 아무렇지 않게 돌아오는 것이 이 사람의 방식입니다. 자유로운 분위기 속에서 새로운 경험을 함께하는 것이 재회의 열쇠입니다.",
  계: "감정이 쌓이면 새벽에 갑자기 연락하거나 감성적인 콘텐츠를 공유합니다. 직접 고백보다 분위기로 감정을 전달하는 방식을 선호합니다. 재회를 원한다면 감성적 교감을 먼저 회복하세요.",
};

const SESSION_KEY = "sp_reunion_session";
const PAID_KEY = "sp_reunion_paid";

const GRADE_COLOR: Record<string, string> = {
  S: "#f59e0b", A: "#34d399", B: "#60a5fa", C: "#a78bfa", D: "#f87171", "?": "#6b7280",
};

function GradeBar({ score }: { score: number }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${score}%`, background: "linear-gradient(90deg, #ea580c, #f97316)" }}
      />
    </div>
  );
}


export default function ReunionPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("splash");
  const [myData, setMyData] = useState<BirthFormData>(defaultBirthData("male"));
  const [theirData, setTheirData] = useState<BirthFormData>(defaultBirthData("male"));
  const [result, setResult] = useState<ReunionResult | null>(null);
  const [mySajuResult, setMySajuResult] = useState<SajuResult | null>(null);
  const [theirSajuResult, setTheirSajuResult] = useState<SajuResult | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [blueberries, setBlueberries] = useState(0);
  const [showering, setShowering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const isAdmin = localStorage.getItem("sp_admin") === "true";
    const paid = localStorage.getItem(PAID_KEY) === "true";
    setIsPaid(isAdmin || paid);
    const bb = parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
    setBlueberries(isNaN(bb) ? 0 : bb);
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.myData) setMyData(s.myData);
        if (s.theirData) setTheirData(s.theirData);
        if (s.result) {
          setResult(s.result);
          if (s.mySaju) setMySajuResult(s.mySaju);
          if (s.theirSaju) setTheirSajuResult(s.theirSaju);
          setStep("result");
        }
        sessionStorage.removeItem(SESSION_KEY);
      } catch { /* ignore */ }
    }
  }, []);

  function validate(d: BirthFormData): string | null {
    if (d.birthYear === "" || d.birthMonth === "" || d.birthDay === "") return "생년월일을 입력해주세요.";
    const y = Number(d.birthYear);
    if (y < 1900 || y > 2030) return "생년도를 확인해주세요.";
    const m = Number(d.birthMonth);
    if (m < 1 || m > 12) return "생월을 확인해주세요.";
    return null;
  }

  async function analyze() {
    setStep("loading");
    setError("");
    try {
      const res = await fetch("/api/reunion/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ myData, theirData }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "분석 실패");
      setResult(data.result);
      setMySajuResult(data.mySaju ?? null);
      setTheirSajuResult(data.theirSaju ?? null);
      setStep("result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      setStep("their");
    }
  }

  function handleUnlock() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ myData, theirData, result, mySaju: mySajuResult, theirSaju: theirSajuResult }));
    const orderId = `rn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    router.push(`/reunion/pay?orderId=${orderId}`);
  }

  // ── SPLASH ─────────────────────────────────────────────────────────────────
  if (step === "splash") {
    return (
      <main className="min-h-screen bg-[#06060e] flex flex-col items-center justify-center px-5 py-10 page-fade-in">
        <BackButton />
        <div className="w-full max-w-lg space-y-6 text-center px-4">
          <FadeIn delay={0}>
            <div className="text-5xl">🔥</div>
            <h1 className="text-3xl font-black text-white leading-tight">
              지금 이 순간,<br />
              <span style={{ color: "#f97316" }}>그 사람 옆에</span><br />
              누가 있을까요?
            </h1>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="space-y-3 text-left">
              <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p className="text-sm font-bold text-red-400 mb-1">😰 지금도 늦고 있습니다</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  사주에는 재회의 문이 열리는 시기가 있습니다. 그 시기를 놓치면 문은 다시 닫힙니다.
                  지금 그 시기인지 확인하지 않으면, 나중에 후회해도 늦습니다.
                </p>
              </div>

              <div className="rounded-2xl p-4" style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}>
                <p className="text-sm font-bold text-orange-400 mb-1">👀 당신이 망설이는 동안</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  더 잘 준비된 누군가가 그 빈자리를 채우고 있을 수 있습니다.
                  두 사람의 사주가 지금 맞닿는 시기인지, 아직 기회가 있는지 지금 확인하세요.
                </p>
              </div>

              <div className="rounded-2xl p-4" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <p className="text-sm font-bold text-purple-400 mb-1">💡 재회에 성공한 사람들의 공통점</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  그들은 '타이밍'을 알았습니다. 사주는 언제, 어떻게 접근해야 그 사람의 마음이 열리는지
                  정확하게 알려줍니다.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="rounded-2xl p-4" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "#fb923c" }}>분석 내용</p>
              <ul className="text-xs space-y-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                <li>🔍 지금 그 사람이 나를 어떻게 생각하는지</li>
                <li>⏰ 재회의 문이 열리는 정확한 시기</li>
                <li>📋 단계별 재회 전략 (첫 연락→만남)</li>
                <li>🚫 절대 하면 안 되는 행동</li>
                <li>💫 재회 후 장기 지속 가능성</li>
                <li>🌐 출생지 경도 보정으로 정확한 사주 계산</li>
              </ul>
            </div>
          </FadeIn>

          <FadeIn delay={300}>
            <button
              onClick={() => setStep("my")}
              className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #ea580c, #f97316)", color: "#fff", boxShadow: "0 8px 32px rgba(234,88,12,0.45)" }}
            >
              재회 가능성 확인하기 →
            </button>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>₩3,900 · 결과 확인 후 결제</p>
          </FadeIn>
        </div>
      </main>
    );
  }

  // ── MY INFO ────────────────────────────────────────────────────────────────
  if (step === "my") {
    const err = validate(myData);
    return (
      <main className="min-h-screen bg-[#06060e] text-white px-5 py-10">
        <BackButton />
        <div className="w-full max-w-lg mx-auto space-y-6">

          <div>
            <div className="flex gap-1 mb-4">
              {[1,2].map(n => (
                <div key={n} className="flex-1 h-1 rounded-full" style={{ background: n === 1 ? "#f97316" : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
            <h2 className="text-xl font-black text-white">내 정보 입력</h2>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>재회를 원하는 나의 사주 정보</p>
          </div>

          <BirthInputForm value={myData} onChange={setMyData} label="나" accent="#e879f9" />

          <button
            onClick={() => { if (!err) setStep("their"); }}
            disabled={!!err}
            className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #ea580c, #f97316)", color: "#fff" }}
          >
            다음 — 그 사람 정보 입력
          </button>
          {err && <p className="text-red-400 text-xs text-center">{err}</p>}
        </div>
      </main>
    );
  }

  // ── THEIR INFO ─────────────────────────────────────────────────────────────
  if (step === "their") {
    const err = validate(theirData);
    return (
      <main className="min-h-screen bg-[#06060e] text-white px-5 py-10">
        <BackButton />
        <div className="w-full max-w-lg mx-auto space-y-6">

          <div>
            <div className="flex gap-1 mb-4">
              {[1,2].map(n => (
                <div key={n} className="flex-1 h-1 rounded-full" style={{ background: n <= 2 ? "#f97316" : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
            <h2 className="text-xl font-black text-white">그 사람 정보 입력</h2>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>재회하고 싶은 그 사람의 사주 정보</p>
          </div>

          <BirthInputForm value={theirData} onChange={setTheirData} label="상대방" accent="#818cf8" />

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>
          )}

          <button
            onClick={() => { if (!err) analyze(); }}
            disabled={!!err}
            className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #ea580c, #f97316)", color: "#fff" }}
          >
            재회운 분석하기 →
          </button>
          {err && <p className="text-red-400 text-xs text-center">{err}</p>}
        </div>
      </main>
    );
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <main className="min-h-screen bg-[#06060e] flex flex-col items-center justify-center px-5">
        <BackButton />
        <div className="text-center space-y-4">
          <div className="text-5xl animate-pulse">🔥</div>
          <p className="text-white font-black text-xl">두 사람의 사주 분석 중...</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            경도 보정 · 합충파해 · 대운 흐름 계산 중
          </p>
          <div className="flex gap-1 justify-center mt-4">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <AdBanner className="max-w-sm mt-4" />
        </div>
      </main>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (step === "result" && result) {
    const grade = result.grade ?? "?";
    const score = result.score ?? 0;
    const gradeColor = GRADE_COLOR[grade] || "#6b7280";
    const locked = !isPaid;

    return (
      <main className="min-h-screen bg-[#06060e] text-white px-5 py-10">
        <BackButton />
        <StarShower active={showering} />
        <div className="w-full max-w-lg mx-auto space-y-5" id="reunion-result">

          {/* 합충 다이어그램 */}
          {!locked && mySajuResult && theirSajuResult && (
            <HapchungDiagram
              mySaju={mySajuResult} targetSaju={theirSajuResult}
              myName="나" targetName="그 사람"
              title="나와 그 사람의 합충(合沖) 분석"
              subtitle="재회 가능성과 함께, 두 원국 사이의 합·충·형·파·해·원진(귀문) 구조를 짚어봐요"
              accent="#fb923c" borderColor="rgba(251,146,60,0.3)" bgColor="rgba(251,146,60,0.05)"
              myChipColor="rgba(232,121,249,0.12)" targetChipColor="rgba(251,146,60,0.12)"
            />
          )}

          {/* 스코어 카드 */}
          <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-5xl font-black mb-1" style={{ color: gradeColor }}>
              {locked ? "?" : grade}
            </div>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>재회 가능성 등급</p>
            <GradeBar score={locked ? 0 : score} />
            <p className="text-sm font-bold mt-2" style={{ color: gradeColor }}>
              {locked ? "결제 후 확인" : `${score}점`}
            </p>
            {!locked && (
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>{result.oneLineSummary}</p>
            )}
          </div>

          {/* 현재 그 사람의 마음 — 무료 공개 (일부) */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "#fb923c" }}>💭 현재 그 사람의 마음</p>
            {locked ? (
              <div className="relative">
                <p className="text-sm blur-sm select-none" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {result.currentHeart.slice(0, 40)}...
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.4)", color: "#fb923c" }}>
                    🔒 결제 후 확인
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{result.currentHeart}</p>
            )}
          </div>

          {/* 그 사람의 연락 패턴 */}
          {theirSajuResult && (() => {
            const ilgan = theirSajuResult.pillarsDetail.day.cg;
            const pattern = CONTACT_PATTERN_REUNION[ilgan];
            if (!pattern) return null;
            return (
              <div className="rounded-2xl p-5" style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.2)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#60a5fa" }}>📱 그 사람의 연락 패턴 — {ilgan}일간</p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{pattern}</p>
              </div>
            );
          })()}

          {/* 잠긴 항목들 */}
          {([
            { label: "⏰ 재회 최적 시기", key: "reunionTiming", color: "#34d399" },
            { label: "📋 단계별 재회 전략", key: "strategy", color: "#60a5fa" },
            { label: "🚫 절대 하면 안 되는 것", key: "danger", color: "#f87171" },
            { label: "💫 장기 궁합·지속 가능성", key: "compatibility", color: "#a78bfa" },
            { label: "💞 재회 후 두 사람의 관계", key: "afterReunionCompat", color: "#f472b6" },
          ] as { label: string; key: keyof ReunionResult; color: string }[]).map(({ label, key, color }) => (
            <div key={key} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-bold mb-2" style={{ color }}>{label}</p>
              {locked ? (
                <div className="flex items-center gap-2 py-3">
                  <span className="text-lg">🔒</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>₩3,900 결제 후 확인 가능</span>
                </div>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{result[key] as string}</p>
              )}
            </div>
          ))}

          {/* 결제 CTA */}
          {locked && (
            <div className="rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg, rgba(234,88,12,0.15), rgba(249,115,22,0.1))", border: "1px solid rgba(249,115,22,0.3)" }}>
              <p className="text-sm font-black text-white mb-1">지금 이 순간이 기회일 수 있습니다</p>
              <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                망설이는 동안 그 사람의 마음이 멀어질 수 있어요.
                재회 전략을 지금 확인하세요.
              </p>
              {blueberries >= 3900 ? (
                <button
                  onClick={() => {
                    setShowering(true);
                    const next = blueberries - 3900;
                    localStorage.setItem("sp_blueberries", String(next));
                    localStorage.setItem(PAID_KEY, "true");
                    setBlueberries(next);
                    setTimeout(() => { setIsPaid(true); setShowering(false); }, 700);
                  }}
                  className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98] mb-2"
                  style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", boxShadow: "0 6px 24px rgba(99,102,241,0.4)" }}
                >
                  ✦ 별조각 뿌리고 보기 (3,900개)
                </button>
              ) : (
                <button
                  onClick={handleUnlock}
                  className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #ea580c, #f97316)", color: "#fff", boxShadow: "0 6px 24px rgba(234,88,12,0.4)" }}
                >
                  결제하기 — ₩3,900
                </button>
              )}
              <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>일회성 결제 · 영구 보관</p>
            </div>
          )}

          {!locked && (
            <button
              onClick={() => { setStep("splash"); setResult(null); setMyData(defaultBirthData("male")); setTheirData(defaultBirthData("male")); }}
              className="w-full py-3 rounded-2xl text-sm transition"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
            >
              새로 분석하기
            </button>
          )}
          <ResultFooterActions targetId="reunion-result" fileName="재회운" shareTitle="재회 가능성 분석 결과" shareText={result.oneLineSummary} />
        </div>
      </main>
    );
  }

  return null;
}
