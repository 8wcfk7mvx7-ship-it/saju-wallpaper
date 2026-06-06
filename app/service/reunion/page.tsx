"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

type Step = "splash" | "my" | "their" | "loading" | "result";
type Gender = "male" | "female";

interface PersonData {
  gender: Gender;
  birthYear: string; birthMonth: string; birthDay: string;
  birthHour: string; birthMinute: string;
  birthPlace: string;
  calType: "solar" | "lunar";
  isLeapMonth: boolean;
  useJajasi: boolean;
}

interface ReunionResult {
  score: number; grade: string; oneLineSummary: string;
  currentHeart: string; reunionTiming: string;
  strategy: string; danger: string; compatibility: string;
  afterReunionCompat: string;
}

function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    if (navigator.share) { try { await navigator.share({ title, text, url: window.location.href }); return; } catch {} }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={share} className="w-full py-3 rounded-2xl text-sm font-bold transition"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
      {copied ? "✓ 링크 복사됨" : "🔗 결과 공유하기"}
    </button>
  );
}

const EMPTY_PERSON = (): PersonData => ({
  gender: "male", birthYear: "", birthMonth: "", birthDay: "",
  birthHour: "", birthMinute: "",
  birthPlace: "서울",
  calType: "solar", isLeapMonth: false, useJajasi: false,
});

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

function PersonForm({
  label, data, onChange, showBirthHour = true,
}: {
  label: string; data: PersonData;
  onChange: (d: PersonData) => void;
  showBirthHour?: boolean;
}) {
  const set = (k: keyof PersonData, v: string | boolean) =>
    onChange({ ...data, [k]: v });

  const inputStyle = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
  };
  const labelStyle = { color: "rgba(255,255,255,0.6)", fontSize: 11 };

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>

      {/* 성별 */}
      <div>
        <p className="text-xs mb-1.5" style={labelStyle}>성별</p>
        <div className="flex gap-2">
          {(["male", "female"] as Gender[]).map(g => (
            <button key={g} onClick={() => set("gender", g)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition"
              style={{
                background: data.gender === g ? (g === "male" ? "rgba(59,130,246,0.25)" : "rgba(236,72,153,0.25)") : "rgba(255,255,255,0.05)",
                border: `1px solid ${data.gender === g ? (g === "male" ? "rgba(59,130,246,0.5)" : "rgba(236,72,153,0.5)") : "rgba(255,255,255,0.1)"}`,
                color: data.gender === g ? "#fff" : "rgba(255,255,255,0.45)",
              }}
            >{g === "male" ? "남성" : "여성"}</button>
          ))}
        </div>
      </div>

      {/* 양력/음력 */}
      <div>
        <p className="text-xs mb-1.5" style={labelStyle}>달력</p>
        <div className="flex gap-2">
          {([["solar","양력"],["lunar","음력"]] as [string,string][]).map(([v,l]) => (
            <button key={v} onClick={() => set("calType", v)}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition"
              style={{
                background: data.calType === v ? "rgba(251,146,60,0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${data.calType === v ? "rgba(251,146,60,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: data.calType === v ? "#fb923c" : "rgba(255,255,255,0.4)",
              }}
            >{l}</button>
          ))}
        </div>
        {data.calType === "lunar" && (
          <button onClick={() => set("isLeapMonth", !data.isLeapMonth)}
            className="mt-1.5 text-xs px-3 py-1 rounded-lg"
            style={{
              background: data.isLeapMonth ? "rgba(251,146,60,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${data.isLeapMonth ? "rgba(251,146,60,0.4)" : "rgba(255,255,255,0.1)"}`,
              color: data.isLeapMonth ? "#fb923c" : "rgba(255,255,255,0.4)",
            }}
          >윤달 {data.isLeapMonth ? "✓" : ""}</button>
        )}
      </div>

      {/* 생년월일 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { k: "birthYear" as const, ph: "1995", lbl: "년" },
          { k: "birthMonth" as const, ph: "06", lbl: "월" },
          { k: "birthDay" as const, ph: "15", lbl: "일" },
        ].map(({ k, ph, lbl }) => (
          <div key={k}>
            <p className="text-xs mb-1" style={labelStyle}>{lbl}</p>
            <input
              type="number" value={data[k] as string}
              onChange={e => set(k, e.target.value)}
              placeholder={ph}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-center outline-none"
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* 출생 시각 */}
      {showBirthHour && (
        <div>
          <p className="text-xs mb-1.5" style={labelStyle}>출생 시각 <span style={{ color: "rgba(255,255,255,0.3)" }}>(선택, 경도보정 적용)</span></p>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={data.birthHour}
              onChange={e => set("birthHour", e.target.value)}
              placeholder="시 (0-23)" min={0} max={23}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-center outline-none"
              style={inputStyle}
            />
            <input type="number" value={data.birthMinute}
              onChange={e => set("birthMinute", e.target.value)}
              placeholder="분 (0-59)" min={0} max={59}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-center outline-none"
              style={inputStyle}
            />
          </div>
          {data.birthHour === "23" && (
            <button onClick={() => set("useJajasi", !data.useJajasi)}
              className="mt-1.5 text-xs px-3 py-1 rounded-lg w-full"
              style={{
                background: data.useJajasi ? "rgba(251,146,60,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${data.useJajasi ? "rgba(251,146,60,0.4)" : "rgba(255,255,255,0.1)"}`,
                color: data.useJajasi ? "#fb923c" : "rgba(255,255,255,0.4)",
              }}
            >야자시(夜子時) 보정 {data.useJajasi ? "✓" : ""} — 23시는 다음날 사주</button>
          )}
        </div>
      )}

      {/* 출생지 */}
      <div>
        <p className="text-xs mb-1.5" style={labelStyle}>출생지 <span style={{ color: "rgba(255,255,255,0.3)" }}>(진태양시 경도보정 자동 적용)</span></p>
        <input type="text" value={data.birthPlace}
          onChange={e => set("birthPlace", e.target.value)}
          placeholder="서울 / 부산 / 도쿄 등"
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
          style={inputStyle}
        />
      </div>
    </div>
  );
}

export default function ReunionPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("splash");
  const [myData, setMyData] = useState<PersonData>(EMPTY_PERSON());
  const [theirData, setTheirData] = useState<PersonData>(EMPTY_PERSON());
  const [result, setResult] = useState<ReunionResult | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [blueberries, setBlueberries] = useState(0);
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
          setStep("result");
        }
        sessionStorage.removeItem(SESSION_KEY);
      } catch { /* ignore */ }
    }
  }, []);

  function validate(d: PersonData): string | null {
    if (!d.birthYear || !d.birthMonth || !d.birthDay) return "생년월일을 입력해주세요.";
    const y = Number(d.birthYear);
    if (y < 1900 || y > 2020) return "생년도를 확인해주세요.";
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
      setStep("result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      setStep("their");
    }
  }

  function handleUnlock() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ myData, theirData, result }));
    const orderId = `rn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    router.push(`/reunion/pay?orderId=${orderId}`);
  }

  // ── SPLASH ─────────────────────────────────────────────────────────────────
  if (step === "splash") {
    return (
      <main className="min-h-screen bg-[#06060e] flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="text-5xl">🔥</div>
          <h1 className="text-3xl font-black text-white leading-tight">
            지금 이 순간,<br />
            <span style={{ color: "#f97316" }}>그 사람 옆에</span><br />
            누가 있을까요?
          </h1>

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

          <button
            onClick={() => setStep("my")}
            className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #ea580c, #f97316)", color: "#fff", boxShadow: "0 8px 32px rgba(234,88,12,0.45)" }}
          >
            재회 가능성 확인하기 →
          </button>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>₩3,900 · 결과 확인 후 결제</p>
        </div>
      </main>
    );
  }

  // ── MY INFO ────────────────────────────────────────────────────────────────
  if (step === "my") {
    const err = validate(myData);
    return (
      <main className="min-h-screen bg-[#06060e] text-white px-5 py-10">
        <div className="w-full max-w-sm mx-auto space-y-6">
          <button onClick={() => setStep("splash")} className="text-gray-400 text-sm hover:text-white">← 뒤로</button>

          <div>
            <div className="flex gap-1 mb-4">
              {[1,2].map(n => (
                <div key={n} className="flex-1 h-1 rounded-full" style={{ background: n === 1 ? "#f97316" : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
            <h2 className="text-xl font-black text-white">내 정보 입력</h2>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>재회를 원하는 나의 사주 정보</p>
          </div>

          <PersonForm label="나의 정보" data={myData} onChange={setMyData} />

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
        <div className="w-full max-w-sm mx-auto space-y-6">
          <button onClick={() => setStep("my")} className="text-gray-400 text-sm hover:text-white">← 뒤로</button>

          <div>
            <div className="flex gap-1 mb-4">
              {[1,2].map(n => (
                <div key={n} className="flex-1 h-1 rounded-full" style={{ background: n <= 2 ? "#f97316" : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
            <h2 className="text-xl font-black text-white">그 사람 정보 입력</h2>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>재회하고 싶은 그 사람의 사주 정보</p>
          </div>

          <PersonForm label="그 사람 정보" data={theirData} onChange={setTheirData} />

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
        <div className="w-full max-w-sm mx-auto space-y-5">
          <button onClick={() => setStep("their")} className="text-gray-400 text-sm hover:text-white">← 다시 입력</button>

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
                    const next = blueberries - 3900;
                    localStorage.setItem("sp_blueberries", String(next));
                    localStorage.setItem(PAID_KEY, "true");
                    setBlueberries(next);
                    setIsPaid(true);
                  }}
                  className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98] mb-2"
                  style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", boxShadow: "0 6px 24px rgba(99,102,241,0.4)" }}
                >
                  ⭐ 별조각 3,900개로 즉시 열기
                </button>
              ) : (
                <button
                  onClick={handleUnlock}
                  className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #ea580c, #f97316)", color: "#fff", boxShadow: "0 6px 24px rgba(234,88,12,0.4)" }}
                >
                  전체 분석 보기 — ₩3,900
                </button>
              )}
              <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>일회성 결제 · 영구 보관</p>
            </div>
          )}

          {!locked && (
            <>
              <ShareButton title="재회 가능성 분석 결과" text={result.oneLineSummary} />
              <button
                onClick={() => { setStep("splash"); setResult(null); setMyData(EMPTY_PERSON()); setTheirData(EMPTY_PERSON()); }}
                className="w-full py-3 rounded-2xl text-sm transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
              >
                새로 분석하기
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  return null;
}
