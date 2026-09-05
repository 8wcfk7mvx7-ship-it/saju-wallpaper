"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import BirthInputForm, { defaultProfile } from "@/components/BirthInputForm";
import { analyzeSaju } from "@/lib/saju";
import { getDailyLuck, getKstDateKey, type DailyLuck } from "@/lib/luckEngine";
import {
  getProfile, saveProfile, clearProfile, getMemo, setMemo as persistMemo,
  getLog, setLog as persistLog, getRecentLogs, type SajuProfile, type LuckLogEntry,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(12px)", transition: `opacity 0.5s ease ${delay}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl p-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)", boxShadow: "0 4px 16px rgba(43,35,32,0.05)" }}>
      {children}
    </div>
  );
}

const TAG_OPTIONS = ["재물", "애정", "건강", "인간관계", "커리어"];
const RATING_LABEL: Record<number, string> = { 1: "최악", 2: "별로", 3: "보통", 4: "좋음", 5: "최고" };

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
  const [profile, setProfile] = useState<SajuProfile | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [form, setForm] = useState<SajuProfile>(defaultProfile());
  const [editing, setEditing] = useState(false);
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

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    if (!p) setOnboarding(true);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setMemoState(getMemo(dateKey));
    const log = getLog(dateKey);
    if (log) { setRating(log.rating); setTags(log.tags); setNote(log.note); }
    setHistory(getRecentLogs(last7Dates()));
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

  function finishOnboarding() {
    saveProfile(form);
    setProfile(form);
    setOnboarding(false);
    setEditing(false);
  }

  function skipOnboarding() {
    setOnboarding(false);
  }

  if (!ready) return <main className="min-h-screen" style={{ background: "var(--bg)" }} />;

  if (onboarding || editing) {
    return (
      <main className="min-h-screen page-fade-in" style={{ background: "var(--bg)" }}>
        <div className="max-w-lg mx-auto px-5 pt-10 pb-16">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3 float-leaf">🍀</div>
            <h1 className="text-2xl font-black" style={{ color: "var(--ink)" }}>행운의 어플</h1>
            <p className="text-sm mt-2" style={{ color: "var(--ink-soft)" }}>
              생년월일을 넣으면 당신의 용신 기운에 맞춘<br />오늘의 행운을 알려드려요.
            </p>
          </div>
          <Card>
            <BirthInputForm value={form} onChange={setForm} />
          </Card>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {!profile && (
              <button onClick={skipOnboarding} className="py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: "var(--card)", color: "var(--ink-soft)", border: "1px solid var(--card-border)" }}>
                나중에 할게요
              </button>
            )}
            <button onClick={finishOnboarding} className="py-3.5 rounded-2xl text-sm font-bold"
              style={{ background: "var(--clover)", color: "#fff", gridColumn: profile ? "span 2" : undefined }}>
              시작하기
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!luck) return <main className="min-h-screen" style={{ background: "var(--bg)" }} />;

  return (
    <main className="min-h-screen page-fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto px-5 pb-16">
        <FadeIn>
          <div className="flex items-center justify-between pt-8 pb-2">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--clover)" }}>
                {todayLabel} · {luck.term.season}
              </p>
              <h1 className="text-2xl font-black mt-1" style={{ color: "var(--ink)" }}>오늘의 행운</h1>
            </div>
            <button onClick={() => { setForm(profile ?? defaultProfile()); setEditing(true); }}
              className="text-lg" aria-label="내 정보 수정">⚙️</button>
          </div>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            지금은 <b style={{ color: "var(--ink)" }}>{luck.term.name}</b>({luck.term.hanja}) 절기({luck.term.dateRange}~)예요 — {luck.term.meaning}
          </p>
        </FadeIn>

        <div className="space-y-4 mt-4">
          <FadeIn delay={80}>
            <Card>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--clover)" }}>오늘의 개운법</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>{luck.ganwoonTip}</p>
              <div className="h-px my-4" style={{ background: "var(--card-border)" }} />
              <p className="text-xs font-bold mb-2" style={{ color: "#c2410c" }}>액운을 막는 방법</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{luck.aegmagiTip}</p>
            </Card>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <p className="text-[11px] font-bold mb-1" style={{ color: "var(--ink-soft)" }}>이 절기의 행운색</p>
                <p className="text-base font-bold" style={{ color: "var(--ink)" }}>{luck.seasonColor}</p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>{luck.seasonItem}</p>
              </Card>
              <Card>
                <p className="text-[11px] font-bold mb-1" style={{ color: luck.personalColorHex ?? "var(--ink-soft)" }}>
                  {profile ? "내 용신 맞춤 컬러" : "맞춤 컬러(생년월일 필요)"}
                </p>
                <p className="text-base font-bold" style={{ color: "var(--ink)" }}>{luck.personalColor ?? "—"}</p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>{luck.personalItem ?? "생년월일을 넣어보세요"}</p>
              </Card>
            </div>
            {luck.synergyNote && <p className="text-xs mt-2 px-1" style={{ color: "var(--ink-soft)" }}>{luck.synergyNote}</p>}
          </FadeIn>

          <FadeIn delay={160}>
            <Card>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--ink-soft)" }}>오늘의 행운 행동</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>{luck.actionOfDay}</p>
            </Card>
          </FadeIn>

          <FadeIn delay={200}>
            <Card>
              <p className="text-xs font-bold mb-2" style={{ color: "#be185d" }}>
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
                className="w-full text-sm rounded-2xl p-3 resize-none focus:outline-none"
                style={{ background: "var(--bg-soft)", border: "1px solid var(--card-border)", color: "var(--ink)" }}
              />
            </Card>
          </FadeIn>

          <FadeIn delay={280}>
            <Card>
              <p className="text-xs font-bold mb-3" style={{ color: "var(--ink-soft)" }}>오늘 하루, 운이 얼마나 좋았나요?</p>
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} onClick={() => submitLog(r)}
                    className="py-2.5 rounded-2xl text-[11px] font-bold transition"
                    style={{
                      background: rating === r ? "var(--clover)" : "var(--bg-soft)",
                      color: rating === r ? "#fff" : "var(--ink-soft)",
                      border: `1px solid ${rating === r ? "var(--clover)" : "var(--card-border)"}`,
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
                      border: `1px solid ${tags.includes(tag) ? "var(--clover)" : "var(--card-border)"}`,
                    }}>
                    #{tag}
                  </button>
                ))}
              </div>
              <input
                value={note} onChange={(e) => setNote(e.target.value)}
                onBlur={() => { if (rating) submitLog(rating, tags, note); }}
                placeholder="한 줄로 이유를 남겨보세요 (선택)" maxLength={500}
                className="w-full text-sm rounded-2xl px-3 py-2.5 focus:outline-none"
                style={{ background: "var(--bg-soft)", border: "1px solid var(--card-border)", color: "var(--ink)" }}
              />

              <div className="h-px my-4" style={{ background: "var(--card-border)" }} />
              <p className="text-[11px] font-bold mb-2" style={{ color: "var(--ink-soft)" }}>최근 7일</p>
              <div className="flex items-end gap-1.5 h-12">
                {last7Dates().map((d) => {
                  const r = history[d]?.rating ?? 0;
                  return (
                    <div key={d} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                      <div className="w-full rounded-full" style={{ height: r ? `${r * 20}%` : "4%", background: r ? "var(--clover)" : "var(--card-border)", minHeight: 4 }} />
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
                className="w-full text-center text-xs py-2" style={{ color: "var(--ink-soft)" }}>
                내 사주 정보 삭제
              </button>
            </FadeIn>
          )}
        </div>
      </div>
    </main>
  );
}
