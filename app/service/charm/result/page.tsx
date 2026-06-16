"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import type { SajuResult } from "@/lib/saju";
import { detectGagukPatterns } from "@/lib/saju";
import {
  ILGAN_CHARM_DB,
  SAL_CHARM_DB,
  JIJI_CHARM_DB,
  GAEWUN_DB,
  calcCharmGrade,
  type CharmGradeResult,
} from "@/lib/charmEngine";
import { CHARM_TRAITS } from "@/lib/saju2";
import { generateOrderId } from "@/lib/toss";
import SaveProfilePrompt from "@/components/SaveProfilePrompt";
import StarShower from "@/components/StarShower";
import SipseongInsight from "@/components/SipseongInsight";
import DohwaFormulaList from "@/components/DohwaFormulaList";
import ShareImageButton from "@/components/ShareImageButton";

export const dynamic = "force-dynamic";

const UUNSEONG_CHARM: Record<string, { title: string; desc: string; score: number; color: string }> = {
  장생: { title: "장생(長生) — 생기 있는 매력", desc: "자라나는 생명력처럼 신선하고 활기찬 매력. 이성에게 건강미와 긍정 에너지로 어필. 만나면 기분이 좋아지는 타입.", score: 85, color: "#4ade80" },
  목욕: { title: "목욕(沐浴) — 이성 최강 매력", desc: "전통적으로 가장 강한 이성 매력의 12운성. 타고난 에로틱한 분위기와 매혹적 외모. 이성이 본능적으로 끌리는 에너지.", score: 98, color: "#c4b5fd" },
  관대: { title: "관대(冠帶) — 당당한 매력", desc: "자신감 넘치는 자태. 사회적 지위와 능력에서 오는 매력. 존재 자체가 당당하고 믿음직스럽습니다.", score: 80, color: "#86efac" },
  건록: { title: "건록(建祿) — 독립적 매력", desc: "스스로 서는 자립적 매력. 의지가 강하고 자기 영역이 뚜렷한 타입. 의존하지 않는 모습이 이성에게 매력적.", score: 75, color: "#fbbf24" },
  제왕: { title: "제왕(帝旺) — 카리스마 최강", desc: "최고조의 에너지와 압도적 존재감. 모든 공간을 장악하는 리더십 매력. 이성이 본능적으로 따르게 됩니다.", score: 90, color: "#f59e0b" },
  쇠: { title: "쇠(衰) — 성숙한 매력", desc: "완숙하고 안정된 매력. 젊은 열기보다 깊이 있는 성숙함이 이성에게 신뢰감을 줍니다.", score: 65, color: "#94a3b8" },
  병: { title: "병(病) — 여린 예술적 매력", desc: "섬세하고 예술적인 분위기. 여리지만 독특한 아우라. 지적이고 감성적인 이성에게 깊이 어필합니다.", score: 60, color: "#64748b" },
  사: { title: "사(死) — 깊고 어두운 매력", desc: "정적이고 깊은 강렬함. 표면은 조용하지만 내면의 에너지가 미스터리한 매력을 형성합니다.", score: 65, color: "#f87171" },
  묘: { title: "묘(墓) — 신비로운 매력", desc: "감추어진 신비. 쉽게 파악되지 않는 미스터리함이 이성을 호기심으로 끌어당깁니다.", score: 60, color: "#ef4444" },
  절: { title: "절(絶) — 순간적 강렬한 매력", desc: "순간적으로 불타오르는 매력. 이별과 새 만남을 반복하지만, 그 순간의 강렬함이 인상적입니다.", score: 70, color: "#dc2626" },
  태: { title: "태(胎) — 순수한 천진난만 매력", desc: "아이처럼 순수하고 꾸밈없는 매력. 보호본능을 자극하는 천진난만함이 이성의 마음을 열게 합니다.", score: 72, color: "#818cf8" },
  양: { title: "양(養) — 따뜻한 성장 매력", desc: "자라나는 생명처럼 따뜻하고 포근한 매력. 함께 성장하고 싶다는 느낌을 주는 nurturing한 에너지.", score: 70, color: "#a78bfa" },
};

const OHAENG_LOOK: Record<string, { look: string; celebs: string }> = {
  목: { look: "갸름하고 긴 얼굴형. 키가 크거나 체형이 날렵함. 이목구비가 선명하고 활기 있는 인상.", celebs: "임시완, 공유 / 아이유, 한지민" },
  화: { look: "이목구비가 뚜렷하고 눈빛이 강렬함. 피부가 맑고 전체적으로 선명한 인상. 표정이 풍부함.", celebs: "이효리, 강호동 / 박보영, 유인나" },
  토: { look: "계란형 또는 둥근 얼굴. 고급지고 담백한 피부결. 편안하고 품격 있는 자연스러운 인상.", celebs: "차인표, 이서진 / 김혜수, 김태리, 신민아" },
  금: { look: "날카롭고 정제된 이목구비. 샤프하고 세련된 도시 느낌. 뼈대가 있고 각진 분위기.", celebs: "이정재, 손현주 / 전지현, 수지, 김태희, 민효린" },
  수: { look: "맑은 피부, 촉촉하고 깊은 눈빛. 자연스러운 분위기. 나이 들어도 동안인 경우 많음.", celebs: "공유, 황정민 / 한효주, 김고은, 김아중" },
};

const CHARM_PRICE = 4900;

function ShareButton({ title = "내 사주 분석 결과", text = "Summer Palace에서 내 사주를 분석했어요" }: { title?: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="w-full py-3.5 rounded-2xl font-bold text-sm border transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
    >
      {copied ? "✓ 링크 복사됨" : "↗ 결과 공유하기"}
    </button>
  );
}

function CharmResultContent() {
  const router = useRouter();
  const [result, setResult] = useState<SajuResult | null>(null);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [grade, setGrade] = useState<CharmGradeResult | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [blueberries, setBlueberries] = useState(0);
  const [showering, setShowering] = useState(false);
  const [showPayCTA, setShowPayCTA] = useState(false);
  const [birthYear, setBirthYear] = useState(0);
  const [birthMonth, setBirthMonth] = useState(0);
  const [birthDay, setBirthDay] = useState(0);
  const [birthHour, setBirthHour] = useState<number | null>(null);
  const [birthHourUnknown, setBirthHourUnknown] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("charmData");
      if (!raw) { router.replace("/service/charm"); return; }
      const { form, result: r } = JSON.parse(raw);
      setResult(r);
      setName(form.name || "");
      setGender(form.gender || "female");
      setGrade(calcCharmGrade(r));
      setBirthYear(parseInt(form.birthYear) || 0);
      setBirthMonth(parseInt(form.birthMonth) || 0);
      setBirthDay(parseInt(form.birthDay) || 0);
      setBirthHour(form.birthHour ?? null);
      setBirthHourUnknown(form.birthTime?.unknown || form.birthHour == null);
      const isAdmin = localStorage.getItem("sp_admin") === "true";
      const paid = sessionStorage.getItem("charmPaid") === "true";
      setIsPaid(isAdmin || paid);
      const bb = parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
      setBlueberries(isNaN(bb) ? 0 : bb);
    } catch { router.replace("/service/charm"); }

    const t = setTimeout(() => setShowPayCTA(true), 3000);
    return () => clearTimeout(t);
  }, [router]);

  if (!result || !grade) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
      </div>
    );
  }

  const ilgan = result.pillarsDetail.day.cg;
  const ilji = result.pillarsDetail.day.jj;
  const idata = ILGAN_CHARM_DB[ilgan];
  const jijiData = JIJI_CHARM_DB[ilji];
  const dominantEl = result.dominant[0] || "토";
  const gagukPatterns = detectGagukPatterns(result);
  const olook = OHAENG_LOOK[dominantEl];
  const gaewun = GAEWUN_DB[dominantEl];
  const uunseong = result.pillarsDetail.day.uunseong;
  const uuCharm = UUNSEONG_CHARM[uunseong];

  // 목욕: 어느 기둥이든 12운성이 목욕인 경우
  const pillarsArr = [result.pillarsDetail.year, result.pillarsDetail.month, result.pillarsDetail.day, result.pillarsDetail.hour].filter(Boolean);
  const hasMokYok = pillarsArr.some(p => p?.uunseong === "목욕");
  // 편관: 천간/지지 십성 중 편관이 하나라도 있는 경우
  const allSipseong = pillarsArr.flatMap(p => [p?.sipseongCg, p?.sipseongJj]).filter(Boolean);
  const hasPyeongwan = allSipseong.includes("편관");

  const 목욕Trait = CHARM_TRAITS.find(t => t.id === "목욕")!;
  const 편관Trait = CHARM_TRAITS.find(t => t.id === "편관")!;

  const mySalsPresent = SAL_CHARM_DB.filter(s => result.sinsalList.some(sl => sl.name === s.key));

  const handlePayment = () => {
    const orderId = generateOrderId();
    sessionStorage.setItem("charmOrderId", orderId);
    router.push(`/charm/pay?orderId=${orderId}&amount=${CHARM_PRICE}`);
  };

  return (
    <main className="min-h-screen bg-[#080810] text-white">
      <StarShower active={showering} />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[700px] h-[700px] rounded-full bg-pink-900/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-32" id="charm-result">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push("/service/charm")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 다시 분석</button>
          <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">홈으로</button>
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3 drop-shadow-[0_0_30px_rgba(244,114,182,0.6)]">{grade.emoji}</div>
          <h1 className="text-2xl font-black mb-1 bg-gradient-to-r from-pink-300 via-violet-200 to-indigo-300 bg-clip-text text-transparent">
            {name}님의 매력 분석
          </h1>
          <p className="text-gray-500 text-sm">{result.fourPillars}</p>
        </div>
        {birthYear > 0 && (
          <SaveProfilePrompt
            name={name}
            birthYear={birthYear}
            birthMonth={birthMonth}
            birthDay={birthDay}
            birthHour={birthHour}
            birthHourUnknown={birthHourUnknown}
            gender={gender}
          />
        )}

        {/* ═══ 매력 등급 카드 — 포차 메뉴판 스타일 ═══ */}
        <div className="rounded-3xl border mb-5 overflow-hidden" style={{ borderColor: `${grade.color}44`, background: grade.bg }}>
          <div className="p-6 text-center">
            <div className="text-5xl mb-2">{grade.emoji}</div>
            <div className="text-xs font-bold tracking-[0.3em] mb-2" style={{ color: grade.color }}>
              CHARM GRADE
            </div>
            <div className="text-6xl font-black mb-1" style={{ color: grade.color }}>
              {grade.grade}등급
            </div>
            <div className="text-lg font-bold text-white mb-2">{grade.label}</div>
            <div className="text-sm mb-4" style={{ color: grade.sc }}>
              상위 {Math.round(grade.topPercent)}% 이내
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-xs text-gray-300">
              {grade.desc}
            </div>
          </div>

          {/* 점수 내역 */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "일간 매력", score: grade.breakdown.ilgan, max: 8 },
                { label: "신살 점수", score: grade.breakdown.sal, max: 40 },
                { label: "기본 매력", score: grade.breakdown.base, max: 10 },
              ].map((item, i) => (
                <div key={i} className="bg-black/20 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                  <div className="font-black text-white text-lg">+{item.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ 일간 매력 카드 ═══ */}
        {idata && (
          <div className="bg-gradient-to-br from-pink-600/10 to-violet-600/10 border border-pink-500/25 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{idata.emoji}</span>
              <div>
                <p className="text-xs font-bold tracking-widest text-pink-300 uppercase">일간 매력 타입</p>
                <p className="font-black text-white">{idata.name}</p>
              </div>
              <span className="ml-auto text-xs px-2 py-1 rounded-full border" style={{ color: idata.classColor, borderColor: `${idata.classColor}44`, background: `${idata.classColor}11` }}>
                {idata.charmClass}
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              {idata.coreMagic}
              {hasPyeongwan && ` 여기에 편관(偏官)의 기운까지 더해져서, 말 한마디 안 해도 포스가 느껴지고 함부로 대할 수 없는 압도적인 분위기가 자연스럽게 풍겨나와. 섹시하면서도 강렬한 인상을 남기는 타입이야. ${편관Trait.advice}`}
            </p>
            <div className="bg-white/[0.04] rounded-xl p-3 border border-white/5 mb-3">
              <p className="text-xs text-gray-500 mb-1">👁 처음 만난 사람 눈에</p>
              <p className="text-sm text-gray-200 leading-relaxed">{idata.firstImpression}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {idata.keywords.map((k, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">#{k}</span>
              ))}
            </div>
          </div>
        )}

        {/* ═══ 오행 외모 ═══ */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">오행({dominantEl}) · 외모 특징</p>
          <p className="text-sm text-gray-300 leading-relaxed mb-2">{olook?.look}</p>
          <p className="text-xs text-gray-600">📺 비슷한 스타일: {olook?.celebs}</p>
        </div>

        {/* ═══ 12운성 매력 지수 ═══ */}
        {uuCharm && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">☯ 일주 12운성 매력 지수</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold" style={{ color: uuCharm.color }}>{uuCharm.title}</span>
              <span className="text-xl font-black text-white">{uuCharm.score}<span className="text-xs text-gray-500">/100</span></span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 mb-3">
              <div className="h-full rounded-full" style={{ width: `${uuCharm.score}%`, backgroundColor: uuCharm.color }} />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {uuCharm.desc}
              {hasMokYok && ` ${목욕Trait.desc} ${목욕Trait.advice}`}
            </p>
          </div>
        )}

        {/* ═══ 목욕 매력 (일주 외 기둥) ═══ */}
        {hasMokYok && uunseong !== "목욕" && (
          <div className="bg-white/[0.04] border border-violet-500/20 rounded-2xl p-5 mb-4">
            <p className="text-xs text-violet-400 font-semibold tracking-widest uppercase mb-2">✨ 목욕(沐浴) — 패션·외모 매력</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              {목욕Trait.desc} {목욕Trait.advice}
            </p>
          </div>
        )}

        {/* ═══ 신살 매력 서열 ═══ */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-4">신살 매력 서열</p>
          {mySalsPresent.length > 0 ? (
            <div className="space-y-2.5 mb-4">
              {mySalsPresent.map((s) => (
                <div key={s.key} className="flex items-start gap-3 p-3 rounded-xl border bg-pink-500/8 border-pink-500/25">
                  <span className="text-lg shrink-0">{s.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-pink-200">{s.cat}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">+{s.charmGrade}점</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{s.oneliner}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">주요 매력 신살은 없지만, 일간에서 오는 고유한 매력이 있습니다.</p>
          )}

        </div>

        {/* ═══ 格局 매력 패턴 ═══ */}
        {gagukPatterns.length > 0 && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-4">格局 매력 패턴 — 사주 구조에서 오는 타고난 에너지</p>
            <div className="space-y-3">
              {gagukPatterns.map(p => (
                <div key={p.name} className="rounded-xl p-4" style={{ background: `${p.color}0d`, border: `1px solid ${p.color}33` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-black" style={{ color: p.color }}>{p.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${p.color}18`, color: p.color }}>{p.hanja}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed mb-2">{p.desc}</p>
                  <div className="rounded-lg px-3 py-2" style={{ background: "rgba(0,0,0,0.25)" }}>
                    <p className="text-[10px] font-bold mb-1" style={{ color: p.color }}>이성 눈에 보이는 것</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{p.charmDesc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ 지지 매력 타입 ═══ */}
        {jijiData && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">일지 매력 타입</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{jijiData.emoji}</span>
              <div>
                <p className="font-bold text-white">{jijiData.name}</p>
                <p className="text-xs text-gray-400">{jijiData.type}</p>
              </div>
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">{jijiData.tag}</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">{jijiData.body}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-xs text-green-400 mb-2">강점</p>
                {jijiData.strength.map((s, i) => <p key={i} className="text-xs text-gray-400">• {s}</p>)}
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-xs text-red-400 mb-2">약점</p>
                {jijiData.weakness.map((w, i) => <p key={i} className="text-xs text-gray-400">• {w}</p>)}
              </div>
            </div>
          </div>
        )}

        {/* ═══ 숨겨진 매력 / 약점 / 이성 타입 — 무료 공개 ═══ */}
        {idata && (
          <>
            <div className="bg-gradient-to-br from-pink-600/8 to-violet-600/8 border border-violet-500/20 rounded-2xl p-5 mb-4">
              <p className="text-xs font-bold tracking-widest text-violet-300 uppercase mb-3">숨은 매력 (남들이 천천히 발견하는 것)</p>
              <p className="text-sm text-gray-200 leading-relaxed">{idata.hiddenMagic}</p>
            </div>
            <div className="bg-red-500/[0.06] border border-red-500/20 rounded-2xl p-5 mb-4">
              <p className="text-xs font-bold tracking-widest text-red-400 uppercase mb-3">⚠️ 찐친이 보게 되는 실체</p>
              <p className="text-sm text-red-200/80 leading-relaxed">{idata.realSelf}</p>
            </div>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">연애할 때 드러나는 치명적 약점</p>
              <p className="text-sm text-gray-300 leading-relaxed">{idata.fatalFlaw}</p>
            </div>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">나한테 먼저 끌리는 이성 타입</p>
              <p className="text-sm text-gray-300 leading-relaxed">{idata.attractedType}</p>
            </div>
          </>
        )}

        {/* ═══ 개운법 미리보기 + 잠금 ═══ */}
        {!isPaid ? (
          <div className="relative mb-4">
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              {/* 미리보기 (흐림) */}
              <div className="blur-md pointer-events-none select-none p-5">
                {gaewun && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">{gaewun.emoji} {gaewun.title}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "방향", value: gaewun.direction },
                        { label: "최고의 시간", value: gaewun.time },
                        { label: "행운 음식", value: gaewun.food.slice(0, 20) + "..." },
                        { label: "향기", value: gaewun.scent.slice(0, 20) + "..." },
                      ].map((item, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                          <p className="text-sm text-gray-200">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 p-4 bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">AI 매력 인사이트</p>
                  <p className="text-sm text-gray-300">AI가 분석한 맞춤형 매력 향상 전략과 연애 전술 3가지...</p>
                </div>
              </div>

              {/* 잠금 오버레이 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl backdrop-blur-[2px] bg-black/60">
                <div className="px-5 py-7 w-full max-w-sm mx-auto">
                  <p className="font-black text-white text-lg leading-snug mb-0.5">지금 이 등급,</p>
                  <p className="font-black text-xl leading-snug mb-4" style={{
                    background: "linear-gradient(135deg, #f9a8d4, #c4b5fd, #818cf8)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>2단계 더 올릴 수 있습니다</p>

                  <div className="space-y-2 mb-5">
                    {[
                      { title: "매력 등급 올리는 오행 개운 전략", desc: "색상·방향·시간대 — 오늘부터 바로 적용" },
                      { title: "이성이 나한테 먼저 다가오게 만드는 법", desc: "극관계 공략 포인트 + 접근 스크립트" },
                      { title: "지금 내 매력을 갉아먹는 약점 1가지", desc: "이걸 모르면 계속 기회를 놓칩니다" },
                      { title: "AI 맞춤 매력 극대화 전략 3가지", desc: "내 일간·오행 분석 기반 액션 플랜" },
                    ].map((item, i) => (
                      <div key={i} className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-sm font-bold text-white leading-tight">{item.title}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  {blueberries >= CHARM_PRICE ? (
                    <button
                      onClick={() => {
                        setShowering(true);
                        const next = blueberries - CHARM_PRICE;
                        localStorage.setItem("sp_blueberries", String(next));
                        sessionStorage.setItem("charmPaid", "true");
                        setBlueberries(next);
                        setTimeout(() => { setIsPaid(true); setShowering(false); }, 700);
                      }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black py-4 rounded-2xl text-base shadow-2xl shadow-indigo-900/50 transition-all active:scale-[0.97]"
                    >
                      ✦ 별조각 뿌리고 보기 ({CHARM_PRICE.toLocaleString()}개)
                    </button>
                  ) : (
                    <button
                      onClick={handlePayment}
                      className="w-full bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-black py-4 rounded-2xl text-base shadow-2xl shadow-pink-900/50 transition-all active:scale-[0.97]"
                    >
                      내 매력 극대화 보고서 ₩{CHARM_PRICE.toLocaleString()}
                    </button>
                  )}
                  <p className="text-xs text-center mt-2.5" style={{ color: "rgba(255,255,255,0.2)" }}>토스페이 · 카드 · PDF 저장 포함</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 개운법 전체 공개 */}
            {gaewun && (
              <div className="rounded-2xl overflow-hidden mb-4" style={{ background: gaewun.colorBg, border: `1px solid ${gaewun.color}33` }}>
                <div className="p-5">
                  <p className="text-xs font-bold tracking-widest mb-3" style={{ color: gaewun.color }}>{gaewun.emoji} {gaewun.title}</p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: "행운 방향", value: gaewun.direction },
                      { label: "행운 계절", value: gaewun.season },
                      { label: "행운 시간", value: gaewun.time },
                      { label: "행운 음식", value: gaewun.food },
                      { label: "행운 향기", value: gaewun.scent },
                      { label: "행운 액세서리", value: gaewun.accessory },
                    ].map((item, i) => (
                      <div key={i} className="bg-black/20 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                        <p className="text-sm text-gray-200">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-black/20 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-2">💡 매력 개운 핵심 팁</p>
                    <p className="text-sm text-gray-200 leading-relaxed">{gaewun.charm_tip}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {result && <DohwaFormulaList result={result} />}
        {result && <SipseongInsight result={result} title="매력 너머 — 사주 속 핵심 기운" />}

        {/* 결과 면책 */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-700 leading-relaxed">본 분석은 사주 이론 기반 오락용 콘텐츠입니다.</p>
        </div>
        <ShareButton />
        <button onClick={() => router.push("/service/charm")} className="w-full mt-4 py-3 rounded-xl border border-white/10 text-gray-600 hover:text-gray-400 text-sm transition">
          다시 분석하기
        </button>
        <ShareImageButton targetId="charm-result" fileName="매력포인트" />
      </div>

      {/* 플로팅 결제 CTA */}
      {!isPaid && (
        <div
          style={{
            opacity: showPayCTA ? 1 : 0,
            transform: showPayCTA ? "none" : "translateY(20px)",
            transition: "opacity 0.6s, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 bg-gradient-to-t from-[#080810] via-[#080810]/95 to-transparent"
        >
          <div className="max-w-2xl mx-auto">
            {blueberries >= CHARM_PRICE ? (
              <button
                onClick={() => {
                  setShowering(true);
                  const next = blueberries - CHARM_PRICE;
                  localStorage.setItem("sp_blueberries", String(next));
                  sessionStorage.setItem("charmPaid", "true");
                  setBlueberries(next);
                  setTimeout(() => { setIsPaid(true); setShowering(false); }, 700);
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black py-4 rounded-2xl text-base shadow-2xl shadow-indigo-900/50 transition-all active:scale-[0.97]"
              >
                ✦ 별조각 뿌리고 보기 ({CHARM_PRICE.toLocaleString()}개)
              </button>
            ) : (
              <button
                onClick={handlePayment}
                className="w-full bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-black py-4 rounded-2xl text-base shadow-2xl shadow-pink-900/50 transition-all active:scale-[0.97]"
              >
                {grade.emoji} 매력 등급 2단계 올리기 ₩{CHARM_PRICE.toLocaleString()}
              </button>
            )}
            <p className="text-center text-xs text-gray-600 mt-2">이성이 먼저 다가오게 만드는 법이 여기 있습니다</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CharmResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
      </div>
    }>
      <CharmResultContent />
    </Suspense>
  );
}
