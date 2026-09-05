"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import BirthInputForm, { defaultProfile } from "@/components/BirthInputForm";
import { analyzeSaju } from "@/lib/saju";
import { getDailyLuck, getKstDateKey, type DailyLuck } from "@/lib/luckEngine";
import {
  getProfile, saveProfile, clearProfile, getSkipOnboarding, setSkipOnboarding,
  getMemo, setMemo as persistMemo, getLog, setLog as persistLog, getRecentLogs,
  getCall, setCall as persistCall, type SajuProfile, type LuckLogEntry,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

type Screen = "intro" | "form" | "dashboard";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(12px)", transition: `opacity 0.5s ease ${delay}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

// 낡은 티켓/전표 느낌 카드 — 두꺼운 잉크색 테두리 + 딱딱한 오프셋 그림자로
// 흔한 "부드러운 그림자의 둥근 흰 카드" 톤을 피한다.
function Card({ children }: { children: React.ReactNode }) {
  return <div className="retro-card p-5">{children}</div>;
}

// 카드 안에서 섹션을 나눌 때 쓰는 절취선(점선) 구분선 — 영수증/티켓의 절취선 모티프
function Perforation() {
  return <div className="my-4" style={{ borderTop: "2px dashed var(--card-border)", opacity: 0.35 }} />;
}

const TAG_OPTIONS = ["재물", "애정", "건강", "인간관계", "커리어"];
const RATING_LABEL: Record<number, string> = { 1: "최악", 2: "별로", 3: "보통", 4: "좋음", 5: "최고" };
const FEATURES = [
  { icon: "🌗", text: "24절기마다 달라지는 개운법·액막이법" },
  { icon: "🎨", text: "내 용신 기운에 맞춘 오늘의 행운 컬러" },
  { icon: "📝", text: "오늘의 메모 & 행운 점수 기록" },
];

function last7Dates(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() + 9 * 60 * 60 * 1000 - i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

async function toSolar(profile: SajuProfile): Promise<{ y: number; m: number; d: number }> {
  if (profile.calendarType === "solar") return { y: profile.birthYear, m: profile.birthMonth, d: profile.birthDay };
  try {
    const KoreanLunarCalendar = (await import("korean-lunar-calendar")).default;
    const calendar = new KoreanLunarCalendar();
    calendar.setLunarDate(profile.birthYear, profile.birthMonth, profile.birthDay, profile.isLeapMonth);
    const solar = calendar.getSolarCalendar();
    return { y: solar.year, m: solar.month, d: solar.day };
  } catch {
    return { y: profile.birthYear, m: profile.birthMonth, d: profile.birthDay };
  }
}

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("intro");
  const [profile, setProfile] = useState<SajuProfile | null>(null);
  const [form, setForm] = useState<SajuProfile>(defaultProfile());
  const [luck, setLuck] = useState<DailyLuck | null>(null);

  const dateKey = useMemo(() => getKstDateKey(), []);
  const todayLabel = useMemo(() => {
    const [, m, d] = dateKey.split("-");
    return `${Number(m)}월 ${Number(d)}일`;
  }, [dateKey]);

  const [memo, setMemoState] = useState("");
  const [memoSaved, setMemoSaved] = useState(true);
  const memoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<Record<string, LuckLogEntry>>({});

  const [callInput, setCallInput] = useState("");
  const [callSubmitted, setCallSubmitted] = useState(false);
  const [callJustSaved, setCallJustSaved] = useState(false);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    if (p || getSkipOnboarding()) setScreen("dashboard");
    else setScreen("intro");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setMemoState(getMemo(dateKey));
    const log = getLog(dateKey);
    if (log) { setRating(log.rating); setTags(log.tags); setNote(log.note); }
    setHistory(getRecentLogs(last7Dates()));
    const savedCall = getCall(dateKey);
    setCallInput(savedCall);
    setCallSubmitted(!!savedCall);
  }, [ready, dateKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!profile) { setLuck(getDailyLuck({})); return; }
      const solar = await toSolar(profile);
      if (cancelled) return;
      const y = analyzeSaju({
        birthYear: solar.y, birthMonth: solar.m, birthDay: solar.d,
        birthHour: profile.birthHour, birthMinute: 0,
        name: profile.name || "나", gender: profile.gender,
        birthPlace: "서울", style: "auto", productType: "mobile", useJajasi: false,
      });
      setLuck(getDailyLuck({ gender: profile.gender, yongshin: y.yongshin.yongshin }));
    })();
    return () => { cancelled = true; };
  }, [profile]);

  function onMemoChange(v: string) {
    setMemoState(v);
    setMemoSaved(false);
    if (memoTimer.current) clearTimeout(memoTimer.current);
    memoTimer.current = setTimeout(() => { persistMemo(dateKey, v); setMemoSaved(true); }, 600);
  }

  function submitLog(r: number, nextTags = tags, nextNote = note) {
    setRating(r);
    const entry = { rating: r, tags: nextTags, note: nextNote };
    persistLog(dateKey, entry);
    setHistory((prev) => ({ ...prev, [dateKey]: entry }));
  }

  function submitCall() {
    if (!callInput.trim()) return;
    persistCall(dateKey, callInput.trim());
    setCallSubmitted(true);
    setCallJustSaved(true);
    setTimeout(() => setCallJustSaved(false), 2200);
  }

  function finishForm() {
    saveProfile(form);
    setProfile(form);
    setScreen("dashboard");
  }

  function viewWithoutBirthDate() {
    setSkipOnboarding();
    setScreen("dashboard");
  }

  if (!ready) return <main className="min-h-screen" style={{ background: "var(--bg)" }} />;

  // ── 인트로 화면 ────────────────────────────────────────────────────────
  if (screen === "intro") {
    return (
      <main className="min-h-screen page-fade-in flex flex-col" style={{ background: "var(--bg)" }}>
        <div className="max-w-lg mx-auto px-6 pt-16 pb-10 flex-1 flex flex-col">
          <FadeIn>
            <div className="text-center">
              <div className="text-6xl mb-4 float-leaf">🍀</div>
              <h1 className="font-display text-4xl" style={{ color: "var(--ink)" }}>행운의 어플</h1>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                행운은 가만히 있으면 오지 않아요.<br />매일 조금씩, 행운을 부르는 습관을 만들어보세요.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="mt-10 space-y-3">
              {FEATURES.map((f) => (
                <div key={f.text} className="retro-card flex items-center gap-3 px-4 py-3.5">
                  <span className="text-xl">{f.icon}</span>
                  <p className="text-sm" style={{ color: "var(--ink)" }}>{f.text}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          <div className="flex-1" />

          <FadeIn delay={220}>
            <div className="space-y-3 mt-10">
              <button onClick={() => { setForm(defaultProfile()); setScreen("form"); }}
                className="retro-btn font-display w-full py-4 text-base" style={{ background: "var(--clover)", color: "#fff" }}>
                시작하기
              </button>
              <button onClick={viewWithoutBirthDate}
                className="w-full py-2 text-sm font-bold underline underline-offset-4" style={{ color: "var(--ink-soft)" }}>
                생년월일 없이 보기
              </button>
            </div>
          </FadeIn>
        </div>
      </main>
    );
  }

  // ── 생년월일 입력/수정 화면 ────────────────────────────────────────────
  if (screen === "form") {
    return (
      <main className="min-h-screen page-fade-in" style={{ background: "var(--bg)" }}>
        <div className="max-w-lg mx-auto px-5 pt-10 pb-16">
          <button onClick={() => setScreen(profile ? "dashboard" : "intro")}
            className="text-sm font-bold mb-4" style={{ color: "var(--ink-soft)" }}>
            ← 뒤로
          </button>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3 float-leaf">🍀</div>
            <h1 className="font-display text-2xl" style={{ color: "var(--ink)" }}>{profile ? "내 정보 수정" : "생년월일을 알려주세요"}</h1>
            <p className="text-sm mt-2" style={{ color: "var(--ink-soft)" }}>
              당신의 용신 기운에 맞춘<br />오늘의 행운을 알려드려요.
            </p>
          </div>
          <Card>
            <BirthInputForm value={form} onChange={setForm} />
          </Card>
          <div className="mt-4">
            <button onClick={finishForm} className="retro-btn font-display w-full py-3.5 text-base" style={{ background: "var(--clover)", color: "#fff" }}>
              {profile ? "저장하기" : "시작하기"}
            </button>
            {!profile && (
              <button onClick={viewWithoutBirthDate} className="w-full py-3 mt-2 text-sm font-bold underline underline-offset-4" style={{ color: "var(--ink-soft)" }}>
                생년월일 없이 보기
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (!luck) return <main className="min-h-screen" style={{ background: "var(--bg)" }} />;

  // ── 대시보드 ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen page-fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto px-5 pb-16">
        <FadeIn>
          <div className="flex items-center justify-between pt-8 pb-2">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--clover)" }}>
                {todayLabel} · {luck.term.season}
              </p>
              <h1 className="font-display text-3xl mt-1" style={{ color: "var(--ink)" }}>오늘의 행운</h1>
            </div>
            <button onClick={() => { setForm(profile ?? defaultProfile()); setScreen("form"); }}
              className="stamp w-10 h-10 flex items-center justify-center text-lg shrink-0" style={{ color: "var(--ink-soft)" }} aria-label="내 정보 수정">
              ⚙️
            </button>
          </div>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            지금은 <b style={{ color: "var(--ink)" }}>{luck.term.name}</b>({luck.term.hanja}) 절기({luck.term.dateRange}~)예요 — {luck.term.meaning}
          </p>
        </FadeIn>

        <div className="space-y-4 mt-4">
          <FadeIn delay={40}>
            <Card>
              <p className="font-display text-base mb-2" style={{ color: "var(--amber)" }}>🍀 행운 부르기</p>
              <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                행운은 가만히 기다리는 사람이 아니라, 부르는 사람에게 온다고 해요. 오늘, 한마디로 행운을 불러보세요.
              </p>
              <input
                value={callInput}
                onChange={(e) => { setCallInput(e.target.value); setCallSubmitted(false); }}
                placeholder="행운아, 내게로 와라"
                maxLength={60}
                className="w-full text-sm rounded-xl px-4 py-3 mb-2.5 focus:outline-none"
                style={{ background: "var(--bg-soft)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
              />
              <button
                onClick={submitCall}
                disabled={!callInput.trim()}
                className="retro-btn font-display w-full py-3 text-sm"
                style={{
                  background: callInput.trim() ? "var(--amber)" : "var(--bg-soft)",
                  color: callInput.trim() ? "#fff" : "var(--ink-soft)",
                }}>
                {callSubmitted ? "다시 부르기" : "행운 부르기"}
              </button>
              {callJustSaved && (
                <p className="text-xs text-center mt-2.5" style={{ color: "var(--clover)" }}>🍀 오늘의 행운을 불렀어요</p>
              )}
            </Card>
          </FadeIn>

          <FadeIn delay={80}>
            <Card>
              <p className="font-display text-base mb-2" style={{ color: "var(--clover)" }}>오늘의 개운법</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>{luck.ganwoonTip}</p>
              <Perforation />
              <p className="font-display text-base mb-2" style={{ color: "#c2410c" }}>액운을 막는 방법</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{luck.aegmagiTip}</p>
            </Card>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <p className="text-[11px] font-bold mb-1" style={{ color: "var(--ink-soft)" }}>이 절기의 행운색</p>
                <p className="font-display text-lg" style={{ color: "var(--ink)" }}>{luck.seasonColor}</p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>{luck.seasonItem}</p>
              </Card>
              <Card>
                <p className="text-[11px] font-bold mb-1" style={{ color: luck.personalColorHex ?? "var(--ink-soft)" }}>
                  {profile ? "내 용신 맞춤 컬러" : "맞춤 컬러(생년월일 필요)"}
                </p>
                <p className="font-display text-lg" style={{ color: "var(--ink)" }}>{luck.personalColor ?? "—"}</p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>{luck.personalItem ?? "생년월일을 넣어보세요"}</p>
              </Card>
            </div>
            {luck.synergyNote && <p className="text-xs mt-2 px-1" style={{ color: "var(--ink-soft)" }}>{luck.synergyNote}</p>}
            {!profile && (
              <button onClick={() => { setForm(defaultProfile()); setScreen("form"); }}
                className="retro-btn w-full mt-2 py-2.5 text-xs font-bold" style={{ background: "var(--card)", color: "var(--clover)" }}>
                생년월일 넣고 맞춤 컬러 보기
              </button>
            )}
          </FadeIn>

          <FadeIn delay={160}>
            <Card>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-soft)" }}>오늘의 행운 행동</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>{luck.actionOfDay}</p>
            </Card>
          </FadeIn>

          <FadeIn delay={200}>
            <Card>
              <p className="font-display text-base mb-2" style={{ color: "#be185d" }}>
                오늘의 매력·이성운 {profile ? `(${profile.gender === "male" ? "남성" : "여성"})` : ""}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>{luck.charmTip}</p>
            </Card>
          </FadeIn>

          <FadeIn delay={240}>
            <Card>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold" style={{ color: "var(--ink-soft)" }}>오늘의 메모</p>
                <span className="text-[10px]" style={{ color: memoSaved ? "var(--ink-soft)" : "var(--clover)" }}>
                  {memoSaved ? "저장됨" : "저장 중…"}
                </span>
              </div>
              <textarea
                value={memo} onChange={(e) => onMemoChange(e.target.value)}
                placeholder="오늘 있었던 일, 떠오른 생각을 짧게 남겨보세요." rows={3} maxLength={2000}
                className="w-full text-sm rounded-xl p-3 resize-none focus:outline-none"
                style={{ background: "var(--bg-soft)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
              />
            </Card>
          </FadeIn>

          <FadeIn delay={280}>
            <Card>
              <p className="text-xs font-bold mb-3" style={{ color: "var(--ink-soft)" }}>오늘 하루, 운이 얼마나 좋았나요?</p>
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} onClick={() => submitLog(r)}
                    className="retro-btn py-2.5 text-[11px] font-bold"
                    style={{
                      background: rating === r ? "var(--clover)" : "var(--bg-soft)",
                      color: rating === r ? "#fff" : "var(--ink-soft)",
                    }}>
                    {"★".repeat(r)}
                    <div className="mt-0.5">{RATING_LABEL[r]}</div>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {TAG_OPTIONS.map((tag) => (
                  <button key={tag}
                    onClick={() => {
                      const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : tags.length < 3 ? [...tags, tag] : tags;
                      setTags(next);
                      if (rating) submitLog(rating, next, note);
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition"
                    style={{
                      background: tags.includes(tag) ? "rgba(45,106,79,0.12)" : "var(--bg-soft)",
                      color: tags.includes(tag) ? "var(--clover)" : "var(--ink-soft)",
                      border: `2px solid ${tags.includes(tag) ? "var(--clover)" : "var(--card-border)"}`,
                    }}>
                    #{tag}
                  </button>
                ))}
              </div>
              <input
                value={note} onChange={(e) => setNote(e.target.value)}
                onBlur={() => { if (rating) submitLog(rating, tags, note); }}
                placeholder="한 줄로 이유를 남겨보세요 (선택)" maxLength={500}
                className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none"
                style={{ background: "var(--bg-soft)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
              />

              <Perforation />
              <p className="text-[11px] font-bold mb-2" style={{ color: "var(--ink-soft)" }}>최근 7일</p>
              <div className="flex items-end gap-1.5 h-12">
                {last7Dates().map((d) => {
                  const r = history[d]?.rating ?? 0;
                  return (
                    <div key={d} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                      <div className="w-full" style={{ height: r ? `${r * 20}%` : "4%", background: r ? "var(--clover)" : "var(--card-border)", minHeight: 4, opacity: r ? 1 : 0.25, border: "1px solid var(--card-border)" }} />
                      <span className="text-[9px]" style={{ color: "var(--ink-soft)" }}>{d.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </FadeIn>

          {profile && (
            <FadeIn delay={320}>
              <button
                onClick={() => { if (confirm("내 사주 정보를 삭제할까요? 메모·기록은 유지됩니다.")) { clearProfile(); setProfile(null); setLuck(getDailyLuck({})); } }}
                className="w-full text-center text-xs py-2 underline underline-offset-4" style={{ color: "var(--ink-soft)" }}>
                내 사주 정보 삭제
              </button>
            </FadeIn>
          )}
        </div>
      </div>
    </main>
  );
}
