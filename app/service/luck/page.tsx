"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import BackButton from "@/components/BackButton";
import AdBanner from "@/components/AdBanner";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import { analyzeSaju } from "@/lib/saju";
import { getProfiles, saveProfile, isDuplicate, type SavedProfile } from "@/lib/profileUtils";
import { getDailyLuck, getKstDateKey, type DailyLuck } from "@/lib/luckEngine";
import { loadMemo, saveMemo, loadLog, saveLog, loadRecentLogs, type LuckLogEntry } from "@/lib/dailyLuck";

export const dynamic = "force-dynamic";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(14px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        border: `1px solid ${accent ? `${accent}33` : "rgba(255,255,255,0.08)"}`,
      }}
    >
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

export default function TodayLuckPage() {
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  const [showBirthForm, setShowBirthForm] = useState(false);
  const [form, setForm] = useState<BirthFormData>(defaultBirthData());
  const [saveAsProfile, setSaveAsProfile] = useState(true);

  const dateKey = useMemo(() => getKstDateKey(), []);
  const todayLabel = useMemo(() => {
    const [, m, d] = dateKey.split("-");
    return `${Number(m)}월 ${Number(d)}일`;
  }, [dateKey]);
  const luck: DailyLuck = useMemo(() => {
    if (!profile) return getDailyLuck({});
    const y = analyzeSaju({
      birthYear: profile.birthYear, birthMonth: profile.birthMonth, birthDay: profile.birthDay,
      birthHour: profile.birthHourUnknown ? null : profile.birthHour, birthMinute: 0,
      name: profile.name || "나", gender: profile.gender,
      birthPlace: "서울", style: "auto", productType: "mobile", useJajasi: false,
    });
    return getDailyLuck({ gender: profile.gender, yongshin: y.yongshin.yongshin });
  }, [profile]);

  const [memo, setMemo] = useState("");
  const [memoSaved, setMemoSaved] = useState(true);
  const memoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [logSaved, setLogSaved] = useState(false);
  const [history, setHistory] = useState<Record<string, LuckLogEntry>>({});

  useEffect(() => {
    const list = getProfiles();
    if (list.length > 0) setProfile(list[0]);
  }, []);

  useEffect(() => {
    loadMemo(dateKey).then(setMemo);
    loadLog(dateKey).then((entry) => {
      if (entry) { setRating(entry.rating); setTags(entry.tags); setNote(entry.note); }
    });
    loadRecentLogs(last7Dates()).then(setHistory);
  }, [dateKey]);

  function onMemoChange(v: string) {
    setMemo(v);
    setMemoSaved(false);
    if (memoTimer.current) clearTimeout(memoTimer.current);
    memoTimer.current = setTimeout(() => {
      saveMemo(dateKey, v).then(() => setMemoSaved(true));
    }, 700);
  }

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 3 ? [...prev, tag] : prev);
  }

  async function submitLog(r: number) {
    setRating(r);
    setLogSaved(false);
    const entry = { rating: r, tags, note };
    await saveLog(dateKey, entry);
    setHistory((prev) => ({ ...prev, [dateKey]: entry }));
    setLogSaved(true);
  }

  function useBirthInfo() {
    if (!form.birthYear || !form.birthMonth || !form.birthDay) return;
    const p: SavedProfile = {
      name: form.name || "나", birthYear: form.birthYear, birthMonth: form.birthMonth, birthDay: form.birthDay,
      birthHour: form.birthHour ?? -1, birthHourUnknown: form.birthHour === null, gender: form.gender,
    } as SavedProfile;
    if (saveAsProfile && !isDuplicate(p.birthYear, p.birthMonth, p.birthDay)) {
      saveProfile(p);
    }
    setProfile(p);
    setShowBirthForm(false);
  }

  const accentHex = luck.personalColorHex ?? "#a78bfa";

  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col page-fade-in">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[200px]" style={{ background: `${accentHex}22` }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-950/30 blur-[180px]" />
      </div>

      <BackButton />

      <div className="relative z-10 flex-1 px-5 pb-16 max-w-lg mx-auto w-full space-y-4">
        <FadeIn>
          <div className="pt-1 pb-2">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: accentHex }}>
              {todayLabel} · {luck.term.season}
            </p>
            <h1 className="text-2xl font-black mt-1">오늘의 행운</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              지금은 <b style={{ color: "#fff" }}>{luck.term.name}</b>({luck.term.hanja}) 절기({luck.term.dateRange}~)예요 — {luck.term.meaning}
            </p>
          </div>
        </FadeIn>

        {!profile && (
          <FadeIn delay={80}>
            <Card>
              {!showBirthForm ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                    생년월일을 넣으면 당신의 용신 기운에 맞춘 행운 컬러·팁을 볼 수 있어요.
                  </p>
                  <button
                    onClick={() => setShowBirthForm(true)}
                    className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ background: "#7c3aed", color: "#fff" }}
                  >
                    맞춤 보기
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <BirthInputForm value={form} onChange={setForm} accent="#7c3aed" showName={false} />
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <input type="checkbox" checked={saveAsProfile} onChange={(e) => setSaveAsProfile(e.target.checked)} style={{ accentColor: "#7c3aed" }} />
                    다음에도 자동으로 불러오기
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShowBirthForm(false)} className="py-3 rounded-xl text-sm font-bold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                      나중에
                    </button>
                    <button onClick={useBirthInfo} className="py-3 rounded-xl text-sm font-bold" style={{ background: "#7c3aed", color: "#fff" }}>
                      적용하기
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </FadeIn>
        )}

        <FadeIn delay={120}>
          <Card accent={accentHex}>
            <p className="text-xs font-bold mb-3" style={{ color: accentHex }}>오늘의 개운법</p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{luck.ganwoonTip}</p>
            <div className="h-px my-4" style={{ background: "rgba(255,255,255,0.08)" }} />
            <p className="text-xs font-bold mb-2" style={{ color: "#f87171" }}>액운을 막는 방법</p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{luck.aegmagiTip}</p>
          </Card>
        </FadeIn>

        <FadeIn delay={160}>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <p className="text-[11px] font-bold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>이 절기의 행운색</p>
              <p className="text-base font-bold">{luck.seasonColor}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{luck.seasonItem}</p>
            </Card>
            <Card accent={luck.personalColorHex}>
              <p className="text-[11px] font-bold mb-1" style={{ color: luck.personalColorHex ?? "rgba(255,255,255,0.4)" }}>
                {profile ? "내 용신 맞춤 컬러" : "맞춤 컬러(생년월일 필요)"}
              </p>
              <p className="text-base font-bold">{luck.personalColor ?? "—"}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{luck.personalItem ?? "생년월일을 넣어보세요"}</p>
            </Card>
          </div>
          {luck.synergyNote && (
            <p className="text-xs mt-2 px-1" style={{ color: "rgba(255,255,255,0.45)" }}>{luck.synergyNote}</p>
          )}
        </FadeIn>

        <FadeIn delay={200}>
          <Card>
            <p className="text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>오늘의 행운 행동</p>
            <p className="text-sm leading-relaxed">{luck.actionOfDay}</p>
          </Card>
        </FadeIn>

        <FadeIn delay={240}>
          <Card accent="#f472b6">
            <p className="text-xs font-bold mb-2" style={{ color: "#f472b6" }}>
              오늘의 매력·이성운 {profile ? `(${profile.gender === "male" ? "남성" : "여성"})` : ""}
            </p>
            <p className="text-sm leading-relaxed">{luck.charmTip}</p>
          </Card>
        </FadeIn>

        <FadeIn delay={280}>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>오늘의 메모</p>
              <span className="text-[10px]" style={{ color: memoSaved ? "rgba(255,255,255,0.3)" : "#a78bfa" }}>
                {memoSaved ? "저장됨" : "저장 중…"}
              </span>
            </div>
            <textarea
              value={memo}
              onChange={(e) => onMemoChange(e.target.value)}
              placeholder="오늘 있었던 일, 떠오른 생각을 짧게 남겨보세요."
              rows={3}
              maxLength={2000}
              className="w-full text-sm rounded-xl p-3 resize-none focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            />
          </Card>
        </FadeIn>

        <FadeIn delay={320}>
          <Card>
            <p className="text-xs font-bold mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>오늘 하루, 운이 얼마나 좋았나요?</p>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => submitLog(r)}
                  className="py-2.5 rounded-xl text-[11px] font-bold transition"
                  style={{
                    background: rating === r ? "#7c3aed" : "rgba(255,255,255,0.05)",
                    color: rating === r ? "#fff" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${rating === r ? "#7c3aed" : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {"★".repeat(r)}
                  <div className="mt-0.5">{RATING_LABEL[r]}</div>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => { toggleTag(tag); if (rating) submitLog(rating); }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition"
                  style={{
                    background: tags.includes(tag) ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.05)",
                    color: tags.includes(tag) ? "#c4b5fd" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${tags.includes(tag) ? "#7c3aed" : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
            <input
              value={note}
              onChange={(e) => { setNote(e.target.value); }}
              onBlur={() => { if (rating) submitLog(rating); }}
              placeholder="한 줄로 이유를 남겨보세요 (선택)"
              maxLength={500}
              className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            />
            {logSaved && rating && <p className="text-[10px] mt-2" style={{ color: "#4ade80" }}>기록 완료!</p>}

            <div className="h-px my-4" style={{ background: "rgba(255,255,255,0.08)" }} />
            <p className="text-[11px] font-bold mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>최근 7일</p>
            <div className="flex items-end gap-1.5 h-12">
              {last7Dates().map((d) => {
                const r = history[d]?.rating ?? 0;
                return (
                  <div key={d} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                    <div
                      className="w-full rounded-full"
                      style={{
                        height: r ? `${r * 20}%` : "4%",
                        background: r ? accentHex : "rgba(255,255,255,0.08)",
                        minHeight: 4,
                      }}
                    />
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{d.slice(8)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={360}>
          <AdBanner />
        </FadeIn>
      </div>
    </main>
  );
}
