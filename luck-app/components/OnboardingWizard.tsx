"use client";
import { useState } from "react";
import type { SajuProfile } from "@/lib/storage";
import { CloverIcon, MemoIcon } from "@/components/Icons";

const HOURS = [
  { v: "unknown", label: "시간 모름" },
  ...Array.from({ length: 24 }, (_, i) => ({ v: String(i), label: `${i}시` })),
];

const FEATURES = [
  { text: "24절기마다 달라지는 개운법·액막이법" },
  { text: "내 용신 기운에 맞춘 오늘의 행운 컬러·숫자" },
  { text: "오늘의 메모 & 행운 점수 기록" },
];

const TOTAL_STEPS = 7;

function StepShell({
  step, title, subtitle, children, onNext, onBack, nextLabel = "다음", nextDisabled = false, showSkip, onSkipAll,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showSkip?: boolean;
  onSkipAll?: () => void;
}) {
  return (
    <main className="min-h-screen page-fade-in flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto px-6 pt-8 pb-10 flex-1 flex flex-col w-full">
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full" style={{ background: i < step ? "var(--clover)" : "var(--card-border)", opacity: i < step ? 1 : 0.2 }} />
          ))}
        </div>
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--clover)" }}>STEP {step} / {TOTAL_STEPS}</p>
        <h1 className="font-display text-2xl mb-1" style={{ color: "var(--ink)" }}>{title}</h1>
        {subtitle && <p className="text-sm mb-6" style={{ color: "var(--ink-soft)" }}>{subtitle}</p>}
        <div className="flex-1">{children}</div>

        <div className="mt-8 space-y-2.5">
          <div className={onBack ? "grid grid-cols-3 gap-2" : ""}>
            {onBack && (
              <button onClick={onBack} className="retro-btn py-3.5 text-sm font-bold" style={{ background: "var(--card)", color: "var(--ink-soft)" }}>
                이전
              </button>
            )}
            <button onClick={onNext} disabled={nextDisabled}
              className={`retro-btn font-display py-3.5 text-base ${onBack ? "col-span-2" : "w-full"}`}
              style={{ background: nextDisabled ? "var(--bg-soft)" : "var(--clover)", color: nextDisabled ? "var(--ink-soft)" : "#fff" }}>
              {nextLabel}
            </button>
          </div>
          {showSkip && (
            <button onClick={onSkipAll} className="w-full py-2 text-sm font-bold underline underline-offset-4" style={{ color: "var(--ink-soft)" }}>
              생년월일 없이 보기
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function OnboardingWizard({
  initial, onComplete, onSkipAll,
}: {
  initial: SajuProfile;
  onComplete: (profile: SajuProfile, memo: string) => void;
  onSkipAll: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SajuProfile>(initial);
  const [memo, setMemo] = useState("");
  const set = (patch: Partial<SajuProfile>) => setForm((prev) => ({ ...prev, ...patch }));
  const dateStr = `${String(form.birthYear).padStart(4, "0")}-${String(form.birthMonth).padStart(2, "0")}-${String(form.birthDay).padStart(2, "0")}`;

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  if (step === 1) {
    return (
      <main className="min-h-screen page-fade-in flex flex-col" style={{ background: "var(--bg)" }}>
        <div className="max-w-lg mx-auto px-6 pt-16 pb-10 flex-1 flex flex-col">
          <div className="text-center">
            <CloverIcon size={56} className="mx-auto mb-4 float-leaf" />
            <h1 className="font-display text-4xl" style={{ color: "var(--ink)" }}>행운의 어플</h1>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              행운은 가만히 있으면 오지 않아요.<br />매일 조금씩, 행운을 부르는 습관을 만들어보세요.
            </p>
          </div>
          <div className="mt-10 space-y-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="retro-card flex items-center gap-3 px-4 py-3.5">
                <SparkleBullet />
                <p className="text-sm" style={{ color: "var(--ink)" }}>{f.text}</p>
              </div>
            ))}
          </div>
          <div className="flex-1" />
          <div className="space-y-3 mt-10">
            <button onClick={next} className="retro-btn font-display w-full py-4 text-base" style={{ background: "var(--clover)", color: "#fff" }}>
              다음
            </button>
            <button onClick={onSkipAll} className="w-full py-2 text-sm font-bold underline underline-offset-4" style={{ color: "var(--ink-soft)" }}>
              생년월일 없이 보기
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (step === 2) {
    return (
      <StepShell step={2} title="별명 (선택)" subtitle="앱 안에서 부를 이름이에요." onNext={next} onBack={back} showSkip onSkipAll={onSkipAll}>
        <input
          type="text" value={form.name} onChange={(e) => set({ name: e.target.value })}
          placeholder="예: 나, 민지" maxLength={20} autoFocus
          className="w-full px-4 py-3 rounded text-sm focus:outline-none"
          style={{ background: "var(--card)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
        />
      </StepShell>
    );
  }

  if (step === 3) {
    return (
      <StepShell step={3} title="양력인가요, 음력인가요?" onNext={next} onBack={back} showSkip onSkipAll={onSkipAll}>
        <div className="grid grid-cols-2 gap-2">
          {(["solar", "lunar"] as const).map((t) => (
            <button key={t} type="button" onClick={() => set({ calendarType: t })}
              className="retro-btn py-4 text-base font-bold"
              style={{ background: form.calendarType === t ? "var(--clover)" : "var(--card)", color: form.calendarType === t ? "#fff" : "var(--ink-soft)" }}>
              {t === "solar" ? "양력" : "음력"}
            </button>
          ))}
        </div>
        {form.calendarType === "lunar" && (
          <label className="flex items-center gap-2 text-xs mt-3 cursor-pointer select-none" style={{ color: "var(--ink-soft)" }}>
            <input type="checkbox" checked={form.isLeapMonth} onChange={(e) => set({ isLeapMonth: e.target.checked })} style={{ accentColor: "var(--clover)" }} />
            윤달이에요
          </label>
        )}
      </StepShell>
    );
  }

  if (step === 4) {
    return (
      <StepShell step={4} title="생년월일을 알려주세요" onNext={next} onBack={back} showSkip onSkipAll={onSkipAll}>
        <input
          type="date" value={dateStr} min="1930-01-01" max="2020-12-31" autoFocus
          onChange={(e) => {
            const [y, m, d] = e.target.value.split("-").map(Number);
            if (y && m && d) set({ birthYear: y, birthMonth: m, birthDay: d });
          }}
          className="w-full px-4 py-3 rounded text-sm focus:outline-none"
          style={{ background: "var(--card)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
        />
      </StepShell>
    );
  }

  if (step === 5) {
    return (
      <StepShell step={5} title="태어난 시간 (선택)" subtitle="모르면 건너뛰어도 괜찮아요." onNext={next} onBack={back} showSkip onSkipAll={onSkipAll}>
        <select
          value={form.birthHour === null ? "unknown" : String(form.birthHour)}
          onChange={(e) => set({ birthHour: e.target.value === "unknown" ? null : Number(e.target.value) })}
          className="w-full px-4 py-3 rounded text-sm focus:outline-none"
          style={{ background: "var(--card)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
        >
          {HOURS.map((h) => <option key={h.v} value={h.v}>{h.label}</option>)}
        </select>
      </StepShell>
    );
  }

  if (step === 6) {
    return (
      <StepShell step={6} title="성별을 알려주세요" onNext={next} onBack={back} showSkip onSkipAll={onSkipAll}>
        <div className="grid grid-cols-2 gap-2">
          {(["female", "male"] as const).map((g) => (
            <button key={g} type="button" onClick={() => set({ gender: g })}
              className="retro-btn py-4 text-base font-bold"
              style={{ background: form.gender === g ? "var(--clover)" : "var(--card)", color: form.gender === g ? "#fff" : "var(--ink-soft)" }}>
              {g === "female" ? "여성" : "남성"}
            </button>
          ))}
        </div>
      </StepShell>
    );
  }

  // step 7 — 오늘의 메모 (선택), 마지막 단계
  return (
    <StepShell
      step={7} title="오늘의 메모 (선택)" subtitle="오늘 하루를 시작하며 떠오르는 생각을 적어보세요."
      onNext={() => onComplete(form, memo)} onBack={back} nextLabel="시작하기"
    >
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <MemoIcon size={16} className="opacity-60" />
          <span className="text-xs font-bold" style={{ color: "var(--ink-soft)" }}>{form.name || "나"}의 첫 메모</span>
        </div>
        <textarea
          value={memo} onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 오늘부터 행운을 하나씩 모아볼래." rows={5} maxLength={2000} autoFocus
          className="w-full text-sm rounded p-3 resize-none focus:outline-none"
          style={{ background: "var(--bg-soft)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
        />
      </div>
    </StepShell>
  );
}

function SparkleBullet() {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0" style={{ background: "rgba(45,106,79,0.12)", color: "var(--clover)" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
        <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
      </svg>
    </span>
  );
}
