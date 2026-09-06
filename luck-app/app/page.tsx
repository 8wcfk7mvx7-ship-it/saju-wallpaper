"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import BirthInputForm, { defaultProfile } from "@/components/BirthInputForm";
import OnboardingWizard from "@/components/OnboardingWizard";
import HistoryList from "@/components/HistoryList";
import { CloverIcon, MemoIcon, ChartIcon, GearIcon, SparkleIcon } from "@/components/Icons";
import { SunPixel, CloudPixel, PouchPixel } from "@/components/LuckArt";
import { analyzeSaju } from "@/lib/saju";
import { getDailyLuck, getKstDateKey, type DailyLuck } from "@/lib/luckEngine";
import {
  getProfile, saveProfile, clearProfile, getSkipOnboarding, setSkipOnboarding,
  getMemo, setMemo as persistMemo, getAllMemos, getLog, setLog as persistLog, getRecentLogs,
  getCall, setCall as persistCall, getAllCalls, exportAllData, importAllData,
  type SajuProfile, type LuckLogEntry,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

type Screen = "onboarding" | "edit" | "dashboard";
type Tab = "today" | "memo" | "log" | "settings";

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
const GRADE_COLOR: Record<string, string> = {
  S: "#d4922a", A: "#4d7c3a", B: "#8a6b4a", C: "#c2673a", D: "#b23a2e",
};
const GRADE_DOMAINS = [
  { key: "love", label: "애정운" },
  { key: "money", label: "금전운" },
  { key: "career", label: "직장운" },
] as const;
const RATING_LABEL: Record<number, string> = { 1: "최악", 2: "별로", 3: "보통", 4: "좋음", 5: "최고" };
const TABS: { id: Tab; label: string; Icon: typeof CloverIcon }[] = [
  { id: "today", label: "오늘", Icon: CloverIcon },
  { id: "memo", label: "메모", Icon: MemoIcon },
  { id: "log", label: "기록", Icon: ChartIcon },
  { id: "settings", label: "설정", Icon: GearIcon },
];

function last7Dates(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() + 9 * 60 * 60 * 1000 - i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// "2026-09-06" → "9월 6일" — 오늘이 아닌 과거 날짜도 표시할 때 씀
function formatDateLabel(dateKey: string): string {
  const [, m, d] = dateKey.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
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

// 하단 탭바 — 이모지 대신 브랜드 톤에 맞춘 단색 라인 아이콘을 써서 나머지 UI와 한 몸처럼 보이게 한다.
function BottomTabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex mx-auto max-w-lg"
      style={{ background: "var(--card)", borderTop: "2px solid var(--card-border)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5"
            style={{ color: active ? "var(--clover)" : "var(--ink-soft)" }}
          >
            <Icon size={20} />
            <span className="text-[11px]" style={{ fontWeight: active ? 800 : 600 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [tab, setTab] = useState<Tab>("today");
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

  const [pastMemos, setPastMemos] = useState<{ date: string; content: string }[]>([]);
  const [pastCalls, setPastCalls] = useState<{ date: string; text: string }[]>([]);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    if (p || getSkipOnboarding()) setScreen("dashboard");
    else setScreen("onboarding");
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
    setPastMemos(getAllMemos());
    setPastCalls(getAllCalls());
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
      setLuck(getDailyLuck({
        gender: profile.gender, yongshin: y.yongshin.yongshin, heeshin: y.yongshin.heeshin,
        ilgan: y.pillarsDetail.day.cg,
      }));
    })();
    return () => { cancelled = true; };
  }, [profile]);

  function onMemoChange(v: string) {
    setMemoState(v);
    setMemoSaved(false);
    if (memoTimer.current) clearTimeout(memoTimer.current);
    memoTimer.current = setTimeout(() => {
      persistMemo(dateKey, v);
      setMemoSaved(true);
      setPastMemos(getAllMemos());
    }, 600);
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
    setPastCalls(getAllCalls());
    setTimeout(() => setCallJustSaved(false), 2200);
  }

  function finishOnboarding(p: SajuProfile, firstMemo: string) {
    saveProfile(p);
    setProfile(p);
    if (firstMemo.trim()) { persistMemo(dateKey, firstMemo); setMemoState(firstMemo); }
    setScreen("dashboard");
  }

  function finishEdit() {
    saveProfile(form);
    setProfile(form);
    setScreen("dashboard");
  }

  function viewWithoutBirthDate() {
    setSkipOnboarding();
    setScreen("dashboard");
  }

  function handleExportBackup() {
    const json = exportAllData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `luck-app-backup-${dateKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importAllData(String(reader.result ?? ""));
      if (ok) { alert("백업을 불러왔어요. 앱을 새로고침할게요."); window.location.reload(); }
      else alert("백업 파일을 읽지 못했어요. 파일을 확인해주세요.");
    };
    reader.readAsText(file);
  }

  if (!ready) return <main className="min-h-screen" style={{ background: "var(--bg)" }} />;

  // ── 첫 이용 온보딩 — STEP 1~7 위저드 ─────────────────────────────────────
  if (screen === "onboarding") {
    return <OnboardingWizard initial={defaultProfile()} onComplete={finishOnboarding} onSkipAll={viewWithoutBirthDate} />;
  }

  // ── 내 정보 수정(설정에서 진입) — 한 화면에서 전체 항목 수정 ──────────────
  if (screen === "edit") {
    return (
      <main className="min-h-screen page-fade-in" style={{ background: "var(--bg)" }}>
        <div className="max-w-lg mx-auto px-5 pt-10 pb-16">
          <button onClick={() => setScreen("dashboard")} className="text-sm font-bold mb-4" style={{ color: "var(--ink-soft)" }}>
            ← 뒤로
          </button>
          <div className="text-center mb-6">
            <CloverIcon size={44} className="mx-auto mb-3 float-leaf" />
            <h1 className="font-display text-2xl" style={{ color: "var(--ink)" }}>내 정보 수정</h1>
            <p className="text-sm mt-2" style={{ color: "var(--ink-soft)" }}>
              당신의 용신 기운에 맞춘<br />오늘의 행운을 알려드려요.
            </p>
          </div>
          <Card>
            <BirthInputForm value={form} onChange={setForm} />
          </Card>
          <div className="mt-4">
            <button onClick={finishEdit} className="retro-btn font-display w-full py-3.5 text-base" style={{ background: "var(--clover)", color: "#fff" }}>
              저장하기
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!luck) return <main className="min-h-screen" style={{ background: "var(--bg)" }} />;

  // ── 대시보드 (하단 탭바로 오늘/메모/기록/설정 분리) ─────────────────────
  return (
    <main className="min-h-screen page-fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto px-5 pb-28">
        <FadeIn>
          <div className="pt-8 pb-2 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--clover)" }}>
                {todayLabel} · {luck.term.season}
              </p>
              <h1 className="font-display text-3xl mt-1" style={{ color: "var(--ink)" }}>
                {tab === "today" && "오늘의 행운"}
                {tab === "memo" && "오늘의 메모"}
                {tab === "log" && "행운 기록"}
                {tab === "settings" && "설정"}
              </h1>
            </div>
            {tab === "today" && (
              <div className="flex items-center gap-1 shrink-0 pt-1">
                <CloudPixel size={30} />
                <SunPixel size={24} />
              </div>
            )}
          </div>
        </FadeIn>

        {tab === "today" && (
          <div className="space-y-4 mt-2">
            <FadeIn>
              <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
                지금은 <b style={{ color: "var(--ink)" }}>{luck.term.name}</b>({luck.term.hanja}) 절기({luck.term.dateRange}~)예요 — {luck.term.meaning}
              </p>
            </FadeIn>

            {luck.specialDay && (
              <FadeIn delay={20}>
                <div className="retro-card p-5" style={{ background: "rgba(224,122,63,0.14)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <SparkleIcon size={16} style={{ color: "var(--amber)" }} />
                    <p className="font-display text-base" style={{ color: "var(--amber)" }}>오늘은 {luck.specialDay.name}이에요</p>
                  </div>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--ink)" }}>{luck.specialDay.meaning}</p>
                  <div className="space-y-1.5">
                    {luck.specialDay.ganwoonTips.map((tip, i) => (
                      <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>· {tip}</p>
                    ))}
                  </div>
                  <Perforation />
                  <p className="text-xs font-bold mb-2" style={{ color: "var(--amber)" }}>액운을 막는 방법</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{luck.specialDay.aegmagiTip}</p>
                </div>
              </FadeIn>
            )}

            <FadeIn delay={40}>
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <PouchPixel size={28} />
                  <p className="font-display text-base" style={{ color: "var(--amber)" }}>행운 부르기</p>
                </div>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  행운은 가만히 기다리는 사람이 아니라, 부르는 사람에게 온다고 해요. 오늘, 한마디로 행운을 불러보세요.
                </p>
                <input
                  value={callInput}
                  onChange={(e) => { setCallInput(e.target.value); setCallSubmitted(false); }}
                  placeholder="행운아, 내게로 와라"
                  maxLength={60}
                  className="w-full text-sm rounded px-4 py-3 mb-2.5 focus:outline-none"
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
                  <p className="text-xs text-center mt-2.5" style={{ color: "var(--clover)" }}>오늘의 행운을 불렀어요</p>
                )}
              </Card>
            </FadeIn>

            {/* 오늘의 행운 — 절기 기운 × 내 용신의 상생상극을 따져 오늘만 특별히 계산되는 컬러·숫자 */}
            <FadeIn delay={80}>
              <div className="retro-card p-5" style={{ background: luck.todayColorHex ? `${luck.todayColorHex}14` : "var(--card)" }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <SparkleIcon size={16} style={{ color: "var(--ink)" }} />
                  <p className="font-display text-base" style={{ color: "var(--ink)" }}>오늘의 행운</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[11px] font-bold mb-1" style={{ color: "var(--ink-soft)" }}>행운의 컬러</p>
                    <p className="font-display text-xl" style={{ color: "var(--ink)" }}>{luck.todayColor}</p>
                  </div>
                  <div className="w-px self-stretch" style={{ background: "var(--card-border)", opacity: 0.3 }} />
                  <div className="flex-1">
                    <p className="text-[11px] font-bold mb-1" style={{ color: "var(--ink-soft)" }}>행운의 숫자</p>
                    <p className="font-display text-xl" style={{ color: "var(--ink)" }}>{luck.todayNumbers.join(" · ")}</p>
                  </div>
                </div>
                <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  {luck.todayRelationNote ?? "생년월일을 넣으면 내 용신과 오늘 절기 기운의 상생상극을 따져 나만의 오늘의 행운 컬러·숫자를 볼 수 있어요."}
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={95}>
              <Card>
                <p className="text-xs font-bold mb-3" style={{ color: "var(--ink-soft)" }}>
                  오늘의 운세{!luck.dailyGrades.personalized && " (기본값)"}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {GRADE_DOMAINS.map(({ key, label }) => {
                    const g = luck.dailyGrades[key];
                    return (
                      <div key={key} className="flex flex-col items-center gap-1.5 py-1">
                        <span className="text-[11px] font-bold" style={{ color: "var(--ink-soft)" }}>{label}</span>
                        <span
                          className="w-10 h-10 rounded-full flex items-center justify-center font-display text-lg"
                          style={{ background: GRADE_COLOR[g.grade], color: "#fff" }}
                        >
                          {g.grade}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--ink-soft)" }}>{g.label}</span>
                      </div>
                    );
                  })}
                </div>
                {!luck.dailyGrades.personalized && (
                  <p className="text-xs mt-3 text-center leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                    생년월일을 넣으면 내 사주를 바탕으로 한 정확한 등급을 볼 수 있어요.
                  </p>
                )}
              </Card>
            </FadeIn>

            <FadeIn delay={110}>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <p className="text-[11px] font-bold mb-1" style={{ color: "var(--ink-soft)" }}>이 절기의 행운색</p>
                  <p className="font-display text-lg" style={{ color: "var(--ink)" }}>{luck.seasonColor}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>{luck.seasonItem}</p>
                </Card>
                <Card>
                  <p className="text-[11px] font-bold mb-1" style={{ color: "var(--ink-soft)" }}>
                    {profile ? "내 기본 행운" : "기본 행운(생년월일 필요)"}
                  </p>
                  <p className="font-display text-lg" style={{ color: "var(--ink)" }}>{luck.personalColor ?? "—"}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>{luck.personalItem ?? "생년월일을 넣어보세요"}</p>
                </Card>
              </div>
              {!profile && (
                <button onClick={() => { setForm(defaultProfile()); setScreen("edit"); }}
                  className="retro-btn w-full mt-2 py-2.5 text-xs font-bold" style={{ background: "var(--card)", color: "var(--clover)" }}>
                  생년월일 넣고 맞춤 컬러 보기
                </button>
              )}
            </FadeIn>

            <FadeIn delay={160}>
              <Card>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--clover)" }}>오늘의 개운법</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>{luck.ganwoonTip}</p>
                <Perforation />
                <p className="text-xs font-bold mb-2" style={{ color: "var(--amber)" }}>액운을 막는 방법</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{luck.aegmagiTip}</p>
              </Card>
            </FadeIn>

            <FadeIn delay={200}>
              <Card>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-soft)" }}>오늘의 행운 행동</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>{luck.actionOfDay}</p>
              </Card>
            </FadeIn>

            <FadeIn delay={240}>
              <Card>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-soft)" }}>
                  오늘의 매력·이성운 {profile ? `(${profile.gender === "male" ? "남성" : "여성"})` : ""}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>{luck.charmTip}</p>
              </Card>
            </FadeIn>
          </div>
        )}

        {tab === "memo" && (
          <div className="mt-2">
            <FadeIn>
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: "var(--ink-soft)" }}>{todayLabel}의 메모</p>
                  <span className="text-[10px]" style={{ color: memoSaved ? "var(--ink-soft)" : "var(--clover)" }}>
                    {memoSaved ? "저장됨" : "저장 중…"}
                  </span>
                </div>
                <textarea
                  value={memo} onChange={(e) => onMemoChange(e.target.value)}
                  placeholder="오늘 있었던 일, 떠오른 생각을 자유롭게 남겨보세요." rows={8} maxLength={2000}
                  className="w-full text-sm rounded p-3 resize-none focus:outline-none"
                  style={{ background: "var(--bg-soft)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
                />
              </Card>
            </FadeIn>

            <FadeIn delay={40}>
              <div className="retro-card p-5 mt-4">
                <p className="text-xs font-bold mb-3" style={{ color: "var(--ink-soft)" }}>지난 메모</p>
                <HistoryList
                  items={pastMemos.filter((m) => m.date !== dateKey)}
                  getDate={(m) => m.date}
                  emptyText="아직 지난 메모가 없어요."
                  renderItem={(m) => (
                    <>
                      <p className="text-[11px] font-bold mb-1" style={{ color: "var(--clover)" }}>{formatDateLabel(m.date)}</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--ink)" }}>{m.content}</p>
                    </>
                  )}
                />
              </div>
            </FadeIn>
          </div>
        )}

        {tab === "log" && (
          <div className="mt-2">
            <FadeIn>
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
                  className="w-full text-sm rounded px-3 py-2.5 focus:outline-none"
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

            <FadeIn delay={40}>
              <div className="retro-card p-5 mt-4">
                <p className="text-xs font-bold mb-3" style={{ color: "var(--amber)" }}>행운 부르기 기록</p>
                <HistoryList
                  items={pastCalls}
                  getDate={(c) => c.date}
                  emptyText="아직 행운을 부른 기록이 없어요."
                  renderItem={(c) => (
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-bold shrink-0" style={{ color: "var(--ink-soft)" }}>{formatDateLabel(c.date)}</span>
                      <span className="text-sm" style={{ color: "var(--ink)" }}>&ldquo;{c.text}&rdquo;</span>
                    </div>
                  )}
                />
              </div>
            </FadeIn>
          </div>
        )}

        {tab === "settings" && (
          <div className="mt-2 space-y-3">
            <FadeIn>
              <Card>
                <p className="text-xs font-bold mb-3" style={{ color: "var(--ink-soft)" }}>내 사주 정보</p>
                {profile ? (
                  <p className="text-sm mb-3" style={{ color: "var(--ink)" }}>
                    {profile.name || "나"} · {profile.calendarType === "solar" ? "양력" : "음력"} {profile.birthYear}.{profile.birthMonth}.{profile.birthDay}
                    {profile.birthHour !== null ? ` ${profile.birthHour}시` : " (시간 모름)"} · {profile.gender === "male" ? "남성" : "여성"}
                  </p>
                ) : (
                  <p className="text-sm mb-3" style={{ color: "var(--ink-soft)" }}>아직 생년월일을 넣지 않았어요.</p>
                )}
                <button onClick={() => { setForm(profile ?? defaultProfile()); setScreen("edit"); }}
                  className="retro-btn w-full py-3 text-sm font-bold" style={{ background: "var(--clover)", color: "#fff" }}>
                  {profile ? "내 정보 수정" : "생년월일 입력하기"}
                </button>
                {profile && (
                  <button
                    onClick={() => { if (confirm("내 사주 정보를 삭제할까요? 메모·기록은 유지됩니다.")) { clearProfile(); setProfile(null); setLuck(getDailyLuck({})); } }}
                    className="w-full text-center text-xs py-3 mt-1 underline underline-offset-4" style={{ color: "var(--ink-soft)" }}>
                    내 사주 정보 삭제
                  </button>
                )}
              </Card>
            </FadeIn>
            <FadeIn delay={40}>
              <Card>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-soft)" }}>데이터 백업</p>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  메모·행운기록·내 정보는 지금 이 기기 안에만 저장돼요. 기기를 바꾸거나 앱을 지우기 전엔 백업 파일로 내보내두세요.
                </p>
                <button onClick={handleExportBackup}
                  className="retro-btn w-full py-3 text-sm font-bold mb-2" style={{ background: "var(--card)", color: "var(--ink)" }}>
                  백업 파일 내보내기
                </button>
                <label className="retro-btn w-full py-3 text-sm font-bold flex items-center justify-center cursor-pointer" style={{ background: "var(--card)", color: "var(--ink)" }}>
                  백업 파일 가져오기
                  <input type="file" accept="application/json" onChange={handleImportBackup} className="hidden" />
                </label>
              </Card>
            </FadeIn>
            <FadeIn delay={80}>
              <Card>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-soft)" }}>정보</p>
                <a href="/privacy" className="block text-sm py-2" style={{ color: "var(--ink)" }}>개인정보처리방침</a>
                <a href="/terms" className="block text-sm py-2" style={{ color: "var(--ink)" }}>이용약관</a>
              </Card>
            </FadeIn>
          </div>
        )}
      </div>

      <BottomTabs tab={tab} onChange={setTab} />
    </main>
  );
}
