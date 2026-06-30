"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}
import AdBanner from "@/components/AdBanner";
import BackButton from "@/components/BackButton";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import {
  analyzeSaju, calcDaewoon, getYearPillar, getSipseong, getUunseong,
  detectSamhapBanghap, analyzeSipseongPatterns, detectByeongjon, analyzeDohwaTypes, detectChunganChung,
  JOHU_YONGSHIN, getSeasonByMonth,
  HAP_CHUNG_CHARACTER,
  ILGAN_PERSONALITY, ILJU_60, adjustCareerByExpression, canonicalJijiPairOrder,
  UUNSEONG_DETAIL,
  OHAENG_HEALTH, OHAENG_CAREER,
  WEOLJI_PSYCHOLOGY, SINGANG_TRAITS,
  JAESEONG_POSITION_INSIGHT, analyzeJaeseongPosition, getJijiRelations,
  GANYEO_JIDONG_GENERAL, GANYEO_JIDONG_ILJU, GANYEO_JIDONG_LOVE, GANYEO_JIDONG_STRENGTHS, isGanyeoJidong,
  YANG_YIN_TENDENCY, OHAENG_CORE_WORRY, CHEONGAN_ELEMENT, JIJI_BONGI,
  JIJANGAN_DISPLAY,
  getIljuAnimal,
  detectGagukPatterns,
  getGeumMokGwadaNarrative,
  getStrengthTraitNarrative,
  getExtremeStrengthNarrative,
  getWoljiSingleGyeopjaeNarrative,
  isWoljiSingleGyeopjae,
  getHourCheonulIntactGoodFlowNarrative,
  isHourCheonulIntactGoodFlow,
  getSipseongStrength,
  type SajuResult, type Element,
} from "@/lib/saju";
import { ILGAN_SHADOW, ILGAN_PLACES, ILGAN_BOUNDARY, ILGAN_AFFECTION_STYLE, DOHWA_POSITION_INFO, DOHWA_HAP_EXTENSION_NOTE, OHAENG_ROLE_DB, BIGEOB_EXCESS_DESC, detectGumsuSangcheong, ILJI_DOHWA_FEMALE_DESC, GANYEO_ERA_SHIFT_NOTE, getGaewunRanking, detectStayPutPattern } from "@/lib/saju2";
import ResultFooterActions from "@/components/ResultFooterActions";
import { trackTraits } from "@/lib/trackTrait";

// ─── 한자 변환 ──────────────────────────────────────────────────────────────────
const CG_HANJA: Record<string,string> = { 갑:"甲",을:"乙",병:"丙",정:"丁",무:"戊",기:"己",경:"庚",신:"辛",임:"壬",계:"癸" };
const JJ_HANJA: Record<string,string> = { 자:"子",축:"丑",인:"寅",묘:"卯",진:"辰",사:"巳",오:"午",미:"未",신:"申",유:"酉",술:"戌",해:"亥" };
const UUNSEONG_HANJA: Record<string,string> = {
  장생:"長生", 목욕:"沐浴", 관대:"冠帶", 건록:"建祿", 제왕:"帝旺",
  쇠:"衰", 병:"病", 사:"死", 묘:"墓", 절:"絶", 태:"胎", 양:"養",
};
const UUNSEONG_PEAK = new Set(["제왕","건록","장생"]);
const UUNSEONG_WEAK = new Set(["사","묘","절","병"]);

// ─── 격국 계산 ──────────────────────────────────────────────────────────────────
const ILGAN_GEONROK: Record<string,string> = { 갑:"인",을:"묘",병:"사",정:"오",무:"사",기:"오",경:"신",신:"유",임:"해",계:"자" };
const ILGAN_YANGIN:  Record<string,string> = { 갑:"묘",병:"오",무:"오",경:"유",임:"자" };
function calcGyeokguk(ilgan: string, monthJj: string): { name: string; hanja: string; color: string } {
  if (ILGAN_GEONROK[ilgan] === monthJj) return { name: "건록격", hanja: "建祿格", color: "#34d399" };
  if (ILGAN_YANGIN[ilgan]  === monthJj) return { name: "양인격", hanja: "羊刃格", color: "#f87171" };
  const bongi = JIJI_BONGI[monthJj] || "";
  const ss = getSipseong(ilgan, bongi);
  const MAP: Record<string, { name: string; hanja: string; color: string }> = {
    식신: { name:"식신격", hanja:"食神格", color:"#34d399" },
    상관: { name:"상관격", hanja:"傷官格", color:"#6ee7b7" },
    편재: { name:"편재격", hanja:"偏財格", color:"#fbbf24" },
    정재: { name:"정재격", hanja:"正財格", color:"#fde68a" },
    편관: { name:"칠살격", hanja:"七殺格", color:"#f87171" },
    정관: { name:"정관격", hanja:"正官格", color:"#fca5a5" },
    편인: { name:"편인격", hanja:"偏印格", color:"#60a5fa" },
    정인: { name:"정인격", hanja:"正印格", color:"#93c5fd" },
    비견: { name:"건록격", hanja:"建祿格", color:"#34d399" },
    겁재: { name:"양인격", hanja:"羊刃格", color:"#f87171" },
  };
  return MAP[ss] || { name:"잡격", hanja:"雜格", color:"#9ca3af" };
}

function jijiElement(jj: string): Element {
  return (CHEONGAN_ELEMENT[JIJI_BONGI[jj] || ""] || "토") as Element;
}

// ─── 궁성론 (宮星論) ──────────────────────────────────────────────────────────
const GUNG_DESC: Record<"년주"|"월주"|"일주"|"시주", { cg: string; jj: string; period: string; color: string }> = {
  년주: { cg: "조상·사회적 체면, 초년(~15세) 환경", jj: "조부모·가문 배경, 초년 건강·복덕",        period: "초년기 (~15세)", color: "#fbbf24" },
  월주: { cg: "부친·직업 환경, 청년(16~30세) 사회 진출", jj: "어머니·청년기 직장·사회 기반",      period: "청년기 (16~30세)", color: "#34d399" },
  일주: { cg: "나 자신(일간), 내면적 자아·본성",          jj: "배우자 자리 (남=아내 궁, 여=남편 궁)", period: "장년기 (31~55세)", color: "#818cf8" },
  시주: { cg: "자녀(특히 딸)·사업·말년 투자",            jj: "자녀(특히 아들)·말년운·노후 복덕",    period: "말년기 (56세~)", color: "#f472b6" },
};

// ─── 세운 계산 (특정 대운 10년치) ─────────────────────────────────────────────
function calcSewoonForDaewoon(ilgan: string, yearStart: number) {
  const nowYear = new Date().getFullYear();
  return Array.from({ length: 10 }, (_, i) => {
    const year = yearStart + i;
    const p = getYearPillar(year);
    const bongi = JIJI_BONGI[p.jj] || "";
    return {
      year,
      cg: p.cg, jj: p.jj,
      sipseongCg: getSipseong(ilgan, p.cg),
      sipseongJj: getSipseong(ilgan, bongi),
      uunseong: getUunseong(ilgan, p.jj),
      isCurrent: year === nowYear,
    };
  });
}

// ─── 월건 계산 (년간 기준 월주 천간지지) ─────────────────────────────────────
// 갑/기년=병인 시작, 을/경=무인, 병/신=경인, 정/임=임인, 무/계=갑인
const WOLJEON_CG_START: Record<string, number> = {
  갑:2, 기:2, 을:4, 경:4, 병:6, 신:6, 정:8, 임:8, 무:0, 계:0,
};
// 월지: 1월=인(index 2), 2=묘(3), 3=진(4), 4=사(5), 5=오(6), 6=미(7), 7=신(8), 8=유(9), 9=술(10), 10=해(11), 11=자(0), 12=축(1)
const MONTH_JJ_IDX = [2,3,4,5,6,7,8,9,10,11,0,1]; // 1월~12월
const CHEONGAN_LIST = ["갑","을","병","정","무","기","경","신","임","계"];
const JIJI_LIST = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
function getMonthPillarForYear(yearCg: string, month: number): { cg: string; jj: string } {
  // month: 1-12
  const startCgIdx = WOLJEON_CG_START[yearCg] ?? 0;
  const cgIdx = (startCgIdx + (month - 1)) % 10;
  const jjIdx = MONTH_JJ_IDX[month - 1];
  return { cg: CHEONGAN_LIST[cgIdx], jj: JIJI_LIST[jjIdx] };
}

// ─── 대운표 + 세운표 컴포넌트 ─────────────────────────────────────────────────
function DaewoonSewoonTable({ daewoon, ilgan, birthYear }: {
  daewoon: ReturnType<typeof calcDaewoon>;
  ilgan: string;
  birthYear: number;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [openSewoonYear, setOpenSewoonYear] = useState<number | null>(null);
  const DAEWOON_LABEL = ["유아기","아동기","청소년기","청년기","장년기","중년기","중장년기","노년기"];
  const nowYear = new Date().getFullYear();

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        <span>교운 <strong className="text-white">{daewoon.startAge}세</strong></span>
        <span>·</span>
        <span><strong className="text-white">{daewoon.direction}</strong></span>
        <span>·</span>
        <span>대운 클릭 시 세운표 펼침</span>
      </div>

      {/* 대운 8개 */}
      <div className="space-y-2">
        {daewoon.pillars.map((p, i) => {
          const isCurrent = i === daewoon.currentIdx;
          const isOpen = openIdx === i;
          const cgEl = CHEONGAN_ELEMENT[p.cg] || "토";
          const jiEl = jijiElement(p.jj);
          const cgStyle = EL_STYLE[cgEl];
          const jiStyle = EL_STYLE[jiEl];
          const sewoon = isOpen ? calcSewoonForDaewoon(ilgan, p.yearStart) : [];

          return (
            <div key={i}>
              {/* 대운 행 */}
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full text-left rounded-xl px-4 py-3 transition-all"
                style={{
                  background: isCurrent ? "rgba(129,140,248,0.09)" : isOpen ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                  border: isCurrent ? "1.5px solid rgba(129,140,248,0.35)" : isOpen ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center gap-3">
                  {/* 나이/연도 */}
                  <div className="text-center shrink-0 w-14">
                    <p className="text-[9px] mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{DAEWOON_LABEL[i]}</p>
                    <p className="text-xs font-bold text-white">{p.age}세~</p>
                    <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{p.yearStart}년</p>
                  </div>

                  {/* 천간 */}
                  <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ background: cgStyle.bg, border: `1px solid ${cgStyle.border}` }}>
                    <span className="text-base font-black" style={{ color: cgStyle.text }}>{p.cg}</span>
                    <span className="text-[8px]" style={{ color: cgStyle.text }}>{cgEl}</span>
                  </div>

                  {/* 지지 */}
                  <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ background: jiStyle.bg, border: `1px solid ${jiStyle.border}` }}>
                    <span className="text-base font-black" style={{ color: jiStyle.text }}>{p.jj}</span>
                    <span className="text-[8px]" style={{ color: jiStyle.text }}>{jiEl}</span>
                  </div>

                  {/* 십성 + 운성 */}
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1 mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(167,139,250,0.12)", color: sipseongColorByIlgan(ilgan, p.sipseongCg) }}>{p.sipseongCg}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(167,139,250,0.08)", color: sipseongColorByIlgan(ilgan, p.sipseongJj) }}>{p.sipseongJj}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>{p.uunseong}</span>
                    </div>
                    <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{p.yearStart}~{p.yearStart + 9}년</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCurrent && <span className="text-[9px] px-2 py-0.5 rounded font-black" style={{ background: "rgba(129,140,248,0.2)", color: "#818cf8" }}>현재</span>}
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>
              </button>

              {/* 세운 10개 펼침 */}
              {isOpen && (
                <div className="mt-1 ml-2 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="px-4 py-2 text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}>
                    세운(歲運) — {p.yearStart}년 ~ {p.yearStart + 9}년
                  </div>
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    {sewoon.map(sw => {
                      const swCgEl = CHEONGAN_ELEMENT[sw.cg] || "토";
                      const swJiEl = jijiElement(sw.jj);
                      const swCgStyle = EL_STYLE[swCgEl];
                      const swJiStyle = EL_STYLE[swJiEl];
                      const isSwOpen = openSewoonYear === sw.year;
                      return (
                        <div key={sw.year}>
                          <button type="button" className="w-full text-left flex items-center gap-3 px-4 py-2.5 transition-all"
                            onClick={() => setOpenSewoonYear(isSwOpen ? null : sw.year)}
                            style={{ background: sw.isCurrent ? "rgba(251,191,36,0.06)" : isSwOpen ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)" }}>
                            {/* 연도 */}
                            <div className="w-12 shrink-0 text-center">
                              {sw.isCurrent && <span className="text-[8px] block font-black mb-0.5" style={{ color: "#fbbf24" }}>올해</span>}
                              <span className="text-sm font-black" style={{ color: sw.isCurrent ? "#fbbf24" : "rgba(255,255,255,0.6)" }}>{sw.year}</span>
                            </div>
                            {/* 천간 */}
                            <div className="w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ background: swCgStyle.bg, border: `1px solid ${swCgStyle.border}` }}>
                              <span className="text-sm font-black" style={{ color: swCgStyle.text }}>{sw.cg}</span>
                            </div>
                            {/* 지지 */}
                            <div className="w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0" style={{ background: swJiStyle.bg, border: `1px solid ${swJiStyle.border}` }}>
                              <span className="text-sm font-black" style={{ color: swJiStyle.text }}>{sw.jj}</span>
                            </div>
                            {/* 십성 + 운성 */}
                            <div className="flex-1 flex flex-wrap gap-1">
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ color: sipseongColorByIlgan(ilgan, sw.sipseongCg), background: "rgba(0,0,0,0.2)" }}>{sw.sipseongCg}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ color: sipseongColorByIlgan(ilgan, sw.sipseongJj), background: "rgba(0,0,0,0.2)" }}>{sw.sipseongJj}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}>{sw.uunseong}</span>
                            </div>
                            {/* 오행 + 펼침 */}
                            <div className="flex items-center gap-1 shrink-0">
                              <div className="text-[9px]" style={{ color: swCgStyle.text }}>{swCgEl}</div>
                              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{isSwOpen ? "▲" : "▼"}</span>
                            </div>
                          </button>
                          {/* 월별 펼침 */}
                          {isSwOpen && (
                            <div className="ml-4 mb-2 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                              <div className="px-3 py-1.5 text-[9px] font-bold" style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.35)" }}>
                                {sw.year}년 월별 운 (月運)
                              </div>
                              <div className="grid grid-cols-3 gap-0 divide-y divide-x" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                                {Array.from({length:12},(_,mi)=>mi+1).map(mon => {
                                  const mp = getMonthPillarForYear(sw.cg, mon);
                                  const mCgEl = CHEONGAN_ELEMENT[mp.cg] || "토";
                                  const mJjEl = jijiElement(mp.jj);
                                  const mCgStyle = EL_STYLE[mCgEl];
                                  const mJjStyle = EL_STYLE[mJjEl];
                                  return (
                                    <div key={mon} className="px-2 py-2 flex flex-col items-center gap-0.5" style={{ background: "rgba(255,255,255,0.01)" }}>
                                      <span className="text-[8px] mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{mon}월</span>
                                      <span className="text-xs font-black" style={{ color: mCgStyle.text }}>{mp.cg}</span>
                                      <span className="text-xs font-black" style={{ color: mJjStyle.text }}>{mp.jj}</span>
                                      <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.2)" }}>{mCgEl}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="px-3 py-1.5 text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                                일운 상세는 추후 지원 예정
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 오행 스타일 ───────────────────────────────────────────────────────────────
const EL_STYLE: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  목: { bg: "rgba(34,197,94,0.10)",  text: "#4ade80", border: "rgba(34,197,94,0.25)",  badge: "rgba(34,197,94,0.15)" },
  화: { bg: "rgba(239,68,68,0.10)",  text: "#f87171", border: "rgba(239,68,68,0.25)",  badge: "rgba(239,68,68,0.15)" },
  토: { bg: "rgba(245,158,11,0.10)", text: "#fbbf24", border: "rgba(245,158,11,0.25)", badge: "rgba(245,158,11,0.15)" },
  금: { bg: "rgba(209,213,219,0.10)",text: "#d1d5db", border: "rgba(209,213,219,0.25)",badge: "rgba(209,213,219,0.15)" },
  수: { bg: "rgba(59,130,246,0.10)", text: "#60a5fa", border: "rgba(59,130,246,0.25)",  badge: "rgba(59,130,246,0.15)" },
};
// 오행 기반 십성 색상 체계 (일간 기준)
const OHAENG_COLOR: Record<string, string> = {
  목: "#22c55e", 화: "#ef4444", 토: "#f59e0b", 금: "#f8fafc", 수: "#94a3b8",
};
// 오행 생극 관계
const OHAENG_GENERATES: Record<string, string> = { 목:"화", 화:"토", 토:"금", 금:"수", 수:"목" };
const OHAENG_CONTROLS:  Record<string, string> = { 목:"토", 화:"금", 토:"수", 금:"목", 수:"화" };
const OHAENG_GENERATED_BY: Record<string, string> = { 화:"목", 토:"화", 금:"토", 수:"금", 목:"수" };
const OHAENG_CONTROLLED_BY: Record<string, string> = { 토:"목", 금:"화", 수:"토", 목:"금", 화:"수" };

// 십성 → 오행 (일간 기준)
function sipseongToOhaeng(ilgan: string, sipseong: string): string {
  const ilEl = CHEONGAN_ELEMENT[ilgan] || "토";
  if (!sipseong) return ilEl;
  if (sipseong === "비견" || sipseong === "겁재") return ilEl;
  if (sipseong === "식신" || sipseong === "상관") return OHAENG_GENERATES[ilEl] || ilEl;
  if (sipseong === "편재" || sipseong === "정재") return OHAENG_CONTROLS[ilEl] || ilEl;
  if (sipseong === "편관" || sipseong === "정관") return OHAENG_CONTROLLED_BY[ilEl] || ilEl;
  if (sipseong === "편인" || sipseong === "정인") return OHAENG_GENERATED_BY[ilEl] || ilEl;
  return ilEl;
}
function sipseongColorByIlgan(ilgan: string, sipseong: string): string {
  return OHAENG_COLOR[sipseongToOhaeng(ilgan, sipseong)] || "#9ca3af";
}
// fallback for non-ilgan-context usages
const SIPSEONG_COLOR: Record<string, string> = {
  비견:"#a78bfa", 겁재:"#c084fc", 식신:"#34d399", 상관:"#6ee7b7",
  편재:"#fbbf24", 정재:"#fde68a", 편관:"#f87171", 정관:"#fca5a5",
  편인:"#60a5fa", 정인:"#93c5fd",
};
function sipseongColor(s: string) { return SIPSEONG_COLOR[s] || "#9ca3af"; }

// ─── 드롭다운 ──────────────────────────────────────────────────────────────────
function Dropdown({ value, options, onChange, placeholder, suffix, disabled }: {
  value: string; options: Array<{ v: string; label: string }>;
  onChange: (v: string) => void; placeholder: string; suffix?: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    if (open && listRef.current && value) {
      const el = listRef.current.querySelector(`[data-v="${value}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);
  const display = options.find(o => o.v === value)?.label ?? "";
  return (
    <div ref={ref} className="relative w-full">
      <div onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition select-none ${disabled ? "opacity-30" : ""}`}
        style={{ background: "rgba(255,255,255,0.05)", border: open ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.1)" }}>
        <span className="text-sm" style={{ color: display ? "#fff" : "rgba(255,255,255,0.3)" }}>
          {display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}
        </span>
        <span className={`text-xs transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "rgba(255,255,255,0.3)" }}>▼</span>
      </div>
      {open && (
        <div ref={listRef} className="absolute z-50 w-full mt-1 rounded-xl overflow-y-auto shadow-2xl"
          style={{ maxHeight: "220px", background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.2)" }}>
          {options.map(opt => (
            <div key={opt.v} data-v={opt.v} onClick={() => { onChange(opt.v); setOpen(false); }}
              className="px-4 py-2.5 text-sm cursor-pointer"
              style={{ color: value === opt.v ? "#60a5fa" : "rgba(255,255,255,0.7)", background: value === opt.v ? "rgba(59,130,246,0.12)" : "transparent", fontWeight: value === opt.v ? 600 : 400 }}>
              {opt.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 섹션 카드 ─────────────────────────────────────────────────────────────────
function Section({ title, accent = "#60a5fa", children }: { title: string; accent?: string; children: import("react").ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="w-1 h-4 rounded-full shrink-0" style={{ background: accent }} />
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
      <div className="p-5" style={{ background: "rgba(255,255,255,0.02)" }}>{children}</div>
    </div>
  );
}

// ─── 결과 뷰 ──────────────────────────────────────────────────────────────────
// ─── 오행 도넛 차트 ────────────────────────────────────────────────────────────
function OhaengDonut({ scores, total }: { scores: { 목: number; 화: number; 토: number; 금: number; 수: number }; total: number }) {
  const EL_COLORS: Record<string, string> = { 목: "#22c55e", 화: "#ef4444", 토: "#f59e0b", 금: "#e2e8f0", 수: "#94a3b8" };
  const els = ["목","화","토","금","수"];
  let cumAngle = -90;
  const R = 60, cx = 80, cy = 80, strokeW = 22;
  const segments = els.map(el => {
    const pct = total > 0 ? scores[el as keyof typeof scores] / total : 0;
    const angle = pct * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { el, pct, startAngle, angle };
  });
  function arcPath(startDeg: number, angleDeg: number) {
    if (angleDeg >= 359.9) angleDeg = 359.9;
    const start = (startDeg * Math.PI) / 180;
    const end = ((startDeg + angleDeg) * Math.PI) / 180;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end),   y2 = cy + R * Math.sin(end);
    const large = angleDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
  }
  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {segments.filter(s => s.pct > 0.01).map(s => (
          <path key={s.el} d={arcPath(s.startAngle, s.angle)}
            fill="none" stroke={EL_COLORS[s.el]} strokeWidth={strokeW}
            strokeLinecap="butt" opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={R - strokeW/2 - 2} fill="#0a0a18" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">오행</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">분포</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
        {segments.map(s => (
          <span key={s.el} className="text-[10px] font-bold flex items-center gap-0.5">
            <span style={{ color: EL_COLORS[s.el] }}>●</span>
            <span style={{ color: EL_COLORS[s.el] }}>{s.el}</span>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{Math.round(s.pct * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ResultView({
  result, form, birthHour, birthYear, birthMonth, birthDay, onReset,
}: {
  result: SajuResult;
  form: { name: string; gender: string; birthPlace: string };
  birthHour: number | null;
  birthYear: number; birthMonth: number; birthDay: number;
  onReset: () => void;
}) {
  const pd = result.pillarsDetail;
  const pillars = [
    { label: "년주", d: pd.year },
    { label: "월주", d: pd.month },
    { label: "일주", d: pd.day },
    ...(pd.hour ? [{ label: "시주", d: pd.hour }] : []),
  ];

  const ilgan = pd.day.cg;

  useEffect(() => {
    trackTraits([
      isWoljiSingleGyeopjae(result) ? "woljiSingleGyeopjae" : null,
      result.yongshin.strength === "신강" ? "strengthTrait:신강" : result.yongshin.strength === "신약" ? "strengthTrait:신약" : null,
      getExtremeStrengthNarrative(result) ? "extremeStrength" : null,
      isHourCheonulIntactGoodFlow(result) ? "hourCheonulGoodFlow" : null,
    ], "/service/manseryeok");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ilgan, pd.year.cg, pd.year.jj, pd.month.cg, pd.month.jj, pd.day.jj]);

  // 사주 전체에서 가장 많이 나타나는 십성 (일간 자신은 비견으로 카운트되므로 제외하지 않음)
  const dominantSipseong = (() => {
    const all = [
      pillars[0].d.sipseongCg, pillars[0].d.sipseongJj,
      pillars[1].d.sipseongCg, pillars[1].d.sipseongJj,
      pillars[2].d.sipseongJj,
      ...(pd.hour ? [pillars[3].d.sipseongCg, pillars[3].d.sipseongJj] : []),
    ].filter((s): s is string => !!s);
    const count: Record<string, number> = {};
    for (const s of all) count[s] = (count[s] || 0) + 1;
    let best: string | null = null;
    let bestN = 0;
    for (const [s, n] of Object.entries(count)) {
      if (n > bestN) { best = s; bestN = n; }
    }
    return best;
  })();

  // 여성 이성운 — 좋은 인연을 부르는 사주 구조 (관인상생·재관쌍미·용신유력·신왕관왕·부덕수기)
  const ssAllManse = [pd.year.sipseongCg, pd.year.sipseongJj, pd.month.sipseongCg, pd.month.sipseongJj, pd.day.sipseongJj, pd.hour?.sipseongCg, pd.hour?.sipseongJj].filter(Boolean) as string[];

  const femaleLovePatterns: { title: string; desc: string }[] = (() => {
    if (form.gender !== "female") return [];
    const has = (s: string) => ssAllManse.includes(s);
    const countOf = (...names: string[]) => ssAllManse.filter(s => names.includes(s)).length;
    const ys = result.yongshin;
    const patterns: { title: string; desc: string }[] = [];

    if (has("정관") && (has("정인") || has("편인"))) {
      patterns.push({
        title: "남편 인연이 나를 더 단단하게 채워주는 구조",
        desc: "배우자를 의미하는 기운이 나를 키워주는 기운으로 자연스럽게 이어지는 구조예요. 관계를 맺을수록 오히려 내면이 더 안정되고 단단해지는 흐름이라, 한 사람을 깊이 만났을 때 그 인연이 인생 전체를 받쳐주는 든든한 버팀목이 되어주는 경우가 많아요.",
      });
    }
    if (countOf("정재", "편재") >= 1 && countOf("정관", "편관") >= 1) {
      patterns.push({
        title: "재물과 인연이 함께 단단해지는 구조",
        desc: "살림과 활동력을 의미하는 기운과 배우자를 의미하는 기운이 사주 안에서 함께 자리하고 있어요. 좋은 인연을 만나면 생활의 안정까지 같이 따라오는 흐름이라, 결혼이나 동거 이후 오히려 형편이 더 펴지는 경우가 많은 구조예요.",
      });
    }
    if (ys.yongshin && (has("정관") || has("편관"))) {
      const guanEl = (() => {
        const cgEl: Record<string, string> = { 갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수" };
        const ilganEl = cgEl[ilgan];
        const controlledBy: Record<string, string> = { 목: "금", 화: "수", 토: "목", 금: "화", 수: "토" };
        return controlledBy[ilganEl];
      })();
      if (guanEl === ys.yongshin || guanEl === ys.gishin) {
        patterns.push({
          title: "배우자 인연이 인생의 중심을 잡아주는 구조",
          desc: "배우자를 의미하는 기운이 이 사주에서 가장 핵심적인 역할을 하고 있어요. 좋은 인연을 만났을 때 그 사람이 단순히 곁에 머무는 게 아니라, 흔들리던 부분을 붙잡아주고 삶의 방향을 잡아주는 존재가 되어주는 구조예요.",
        });
      }
    }
    if (countOf("비견", "겁재") >= 2 && countOf("정관", "편관") >= 2) {
      patterns.push({
        title: "강한 두 사람이 서로를 감당하는 구조",
        desc: "스스로의 기운도 단단하고, 배우자를 의미하는 기운도 강하게 자리하고 있어요. 어느 한쪽이 끌려가는 관계가 아니라, 서로 비슷한 무게로 맞서면서도 함께 갈 수 있는 사람을 만났을 때 가장 좋은 합을 이루는 구조라 평범하고 약한 인연보다는 만만치 않은 상대를 만나야 오히려 관계가 오래갑니다.",
      });
    }
    const dayJjEl = (() => {
      const jjEl: Record<string, string> = { 자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화", 오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수" };
      return jjEl[pd.day.jj];
    })();
    if (dayJjEl && (dayJjEl === ys.yongshin || dayJjEl === ys.heeshin)) {
      patterns.push({
        title: "배우자 자리 자체가 나를 돕는 구조",
        desc: "배우자 자리에 해당하는 기운이 이 사주가 가장 필요로 하는 기운과 일치해요. 결혼이나 동거를 시작한 이후 집안 분위기 자체가 차분해지고 서로를 보완해주는 흐름이 생기는 구조라, 이성운이 곧 안정운으로 이어지는 경우가 많아요.",
      });
    }
    return patterns;
  })();

  const monthJj = pd.month.jj;
  const ilganInfo = ILGAN_PERSONALITY[ilgan];
  const iljuKey = ilgan + pd.day.jj;
  const iljuInfo = ILJU_60[iljuKey];
  const uunseongDetailInfo = UUNSEONG_DETAIL[pd.day.uunseong];
  const sikSangCountManse = ssAllManse.filter(s => s === "식신" || s === "상관").length;
  const iljuCareerAdjusted = iljuInfo ? adjustCareerByExpression(iljuInfo.career, sikSangCountManse) : "";
  const weolji = WEOLJI_PSYCHOLOGY[monthJj];
  const singang = result.yongshin.strength;
  const singangTrait = SINGANG_TRAITS[singang];
  const jaeseongPos = analyzeJaeseongPosition(ilgan, pd);
  const jaeseongInfo = JAESEONG_POSITION_INSIGHT[jaeseongPos];
  const isYang = ["갑","병","무","경","임"].includes(ilgan);
  const yangYin = isYang ? YANG_YIN_TENDENCY.yang : YANG_YIN_TENDENCY.yin;
  const yangYinLove = isYang ? YANG_YIN_TENDENCY.yangInLove : YANG_YIN_TENDENCY.yinInLove;

  // 대운 계산
  const daewoon = calcDaewoon(
    birthYear, birthMonth, birthDay,
    form.gender as "male" | "female",
    ilgan,
    { cg: pd.month.cg, jj: pd.month.jj },
  );

  // 지배/부족 오행 건강/직업
  const domEl = result.dominant[0] || result.lacking[0] || "목";
  const domHealth = OHAENG_HEALTH[domEl as Element];
  const domCareer = OHAENG_CAREER[domEl as Element];
  const lackEl = result.lacking[0];
  const coreWorry = OHAENG_CORE_WORRY[domEl as Element];


  const total = Object.values(result.scores).reduce((a, b) => a + b, 0);
  const samhapResults = detectSamhapBanghap(pd);
  const sipseongPatterns = analyzeSipseongPatterns(pd);
  const byeongjonPatterns = detectByeongjon(pd);
  const dohwaTypes = analyzeDohwaTypes(pd);
  const chunganChung = detectChunganChung(pd);
  const hapCount = samhapResults.filter(s => s.type === "삼합" || s.type === "반합").length;
  const chungCount = (result.sinsalList || []).filter(s => s.name?.includes("충")).length;
  const hapChungChar = hapCount > chungCount ? HAP_CHUNG_CHARACTER.합 : chungCount > 0 ? HAP_CHUNG_CHARACTER.충 : null;

  return (
    <div id="manseryeok-result" className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#60a5fa" }}>무료 만세력 · 사주팔자 완전분석</p>
          <h1 className="text-2xl font-black text-white">{form.name || "사주"}님의 팔자</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {birthYear}년 {birthMonth}월 {birthDay}일 {birthHour === null ? "시간 모름" : `${birthHour}시`}
            {form.birthPlace ? ` · ${form.birthPlace}` : ""}
          </p>
        </div>
        <button onClick={onReset} className="text-xs px-4 py-2 rounded-xl shrink-0" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          다시 입력
        </button>
      </div>

      {/* 경도 보정 노트 */}
      {result.localTimeNote && (
        <div className="px-4 py-3 rounded-xl text-xs" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.15)", color: "#93c5fd" }}>
          {result.localTimeNote}
        </div>
      )}

      {/* ① 사주팔자 4주 그리드 */}
      {(() => {
        const gyeokguk = calcGyeokguk(ilgan, monthJj);
        return (
      <Section title="사주팔자 (四柱八字)" accent="#818cf8">
        {/* 격국 뱃지 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-full font-black" style={{ background: `${gyeokguk.color}18`, color: gyeokguk.color, border: `1px solid ${gyeokguk.color}40` }}>
            {gyeokguk.name} ({gyeokguk.hanja})
          </span>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>월지 본기 기준</span>
        </div>

        <div className={`grid gap-1.5 ${pd.hour ? "grid-cols-4" : "grid-cols-3 max-w-[75%] mx-auto"}`}>
          {[...pillars].reverse().map(({ label, d }) => {
            const cgEl = CHEONGAN_ELEMENT[d.cg] || "토";
            const jiEl = jijiElement(d.jj);
            const cgStyle = EL_STYLE[cgEl];
            const jiStyle = EL_STYLE[jiEl];
            const jijangan = JIJANGAN_DISPLAY[d.jj] || [];
            const isWeak = d.uunseong ? UUNSEONG_WEAK.has(d.uunseong) : false;
            const isPeak = d.uunseong ? UUNSEONG_PEAK.has(d.uunseong) : false;
            return (
              <div key={label} className="rounded-xl overflow-hidden flex flex-col" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                {/* 기둥 라벨 */}
                <div className="text-center py-1 text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)" }}>{label}</div>

                {/* 천간 십신 */}
                {d.sipseongCg && (
                  <div className="text-center py-0.5 text-[9px] font-bold" style={{ background: cgStyle.bg, color: sipseongColorByIlgan(ilgan, d.sipseongCg) }}>{d.sipseongCg}</div>
                )}

                {/* 천간 한자 박스 */}
                <div className="py-3 flex flex-col items-center gap-0.5" style={{ background: cgStyle.bg, borderBottom: "1px solid rgba(0,0,0,0.15)" }}>
                  <span className="font-black leading-none" style={{ color: cgStyle.text, fontSize: "1.8rem" }}>{CG_HANJA[d.cg] || d.cg}</span>
                  <span className="text-[9px] font-bold" style={{ color: cgStyle.text, opacity: 0.7 }}>{d.cg} · {cgEl}</span>
                </div>

                {/* 지지 십신 */}
                {d.sipseongJj && (
                  <div className="text-center py-0.5 text-[9px] font-bold" style={{ background: jiStyle.bg, color: sipseongColorByIlgan(ilgan, d.sipseongJj) }}>{d.sipseongJj}</div>
                )}

                {/* 지지 한자 박스 */}
                <div className="py-3 flex flex-col items-center gap-0.5" style={{ background: jiStyle.bg }}>
                  <span className="font-black leading-none" style={{ color: jiStyle.text, fontSize: "1.8rem" }}>{JJ_HANJA[d.jj] || d.jj}</span>
                  <span className="text-[9px] font-bold" style={{ color: jiStyle.text, opacity: 0.7 }}>{d.jj} · {jiEl}</span>
                </div>

                {/* 지장간 */}
                {jijangan.length > 0 && (
                  <div className="px-1 py-1.5 flex justify-center gap-1" style={{ background: "rgba(0,0,0,0.25)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {jijangan.map(({ stem, role }) => {
                      const sel = CHEONGAN_ELEMENT[stem] || "토";
                      const ss = getSipseong(ilgan, stem);
                      return (
                        <div key={stem} className="flex flex-col items-center">
                          <span className="font-black text-[11px] leading-none" style={{ color: EL_STYLE[sel].text }}>{CG_HANJA[stem] || stem}</span>
                          <span className="text-[7px] leading-none mt-0.5" style={{ color: ss ? sipseongColorByIlgan(ilgan, ss) : "rgba(255,255,255,0.3)" }}>{ss || stem}</span>
                          <span className="text-[6px] leading-none" style={{ color: role === "정기" ? "#fbbf24" : "rgba(255,255,255,0.2)" }}>{role === "정기" ? "본" : role === "중기" ? "중" : "여"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 12운성 */}
                {d.uunseong && (
                  <div className="text-center py-1.5 text-[9px] font-bold" style={{
                    background: "rgba(0,0,0,0.2)",
                    color: isPeak ? "#fbbf24" : isWeak ? "#f87171" : "rgba(255,255,255,0.45)",
                  }}>
                    {UUNSEONG_HANJA[d.uunseong] || ""} {d.uunseong}
                    {d.uunseong === "제왕" && <span className="ml-0.5 text-[7px]">★</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[10px] text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
          일간(日干): <span className="font-black" style={{ color: EL_STYLE[CHEONGAN_ELEMENT[ilgan] || "토"].text }}>{CG_HANJA[ilgan] || ilgan} {ilgan}({CHEONGAN_ELEMENT[ilgan]})</span>
          &nbsp;·&nbsp;일지 12운성: <span className="font-bold" style={{ color: UUNSEONG_PEAK.has(pd.day.uunseong) ? "#fbbf24" : UUNSEONG_WEAK.has(pd.day.uunseong) ? "#f87171" : "white" }}>{pd.day.uunseong}</span>
        </div>

        {/* 지지 관계 한눈에 보기 — 육합/삼합/충/형/파/해 */}
        {(() => {
          const relations = getJijiRelations(pillars.map(p => p.d.jj));
          if (relations.length === 0) return null;
          const REL_STYLE: Record<string, { color: string; bg: string }> = {
            육합: { color: "#34d399", bg: "rgba(52,211,153,0.1)" },
            삼합: { color: "#34d399", bg: "rgba(52,211,153,0.1)" },
            반합: { color: "#34d399", bg: "rgba(52,211,153,0.1)" },
            충:   { color: "#f87171", bg: "rgba(248,113,113,0.1)" },
            형:   { color: "#f87171", bg: "rgba(248,113,113,0.1)" },
            파:   { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
            해:   { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
            원진: { color: "#c084fc", bg: "rgba(192,132,252,0.1)" },
          };
          return (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {relations.map((r, i) => {
                const st = REL_STYLE[r.type];
                const [ja, jb] = canonicalJijiPairOrder(r.jjA, r.jjB, r.type);
                return (
                  <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: st.color, background: st.bg, border: `1px solid ${st.color}30` }}>
                    {pillars[r.a].label.slice(0,1)}지-{pillars[r.b].label.slice(0,1)}지 {ja}{jb} {r.type}
                  </span>
                );
              })}
            </div>
          );
        })()}

        {/* 한눈에 보기 — 4주 요약 테이블 (시·일·월·년 순) */}
        <div className="mt-4 overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <table className="w-full text-center table-fixed" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                <th className="text-[9px] font-bold py-1.5 px-1" style={{ color: "rgba(255,255,255,0.3)", width: "13%" }}></th>
                {[...pillars].reverse().map(({ label }) => (
                  <th key={label} className="text-[10px] font-black py-1.5" style={{ color: "rgba(255,255,255,0.5)", width: `${87 / pillars.length}%` }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { row: "십신", get: (d: typeof pd.year) => d.sipseongCg ? <span style={{ color: sipseongColorByIlgan(ilgan, d.sipseongCg) }}>{d.sipseongCg}</span> : "—" },
                { row: "천간", get: (d: typeof pd.year) => <span className="font-black" style={{ color: EL_STYLE[CHEONGAN_ELEMENT[d.cg] || "토"].text }}>{d.cg}</span> },
                { row: "지지", get: (d: typeof pd.year) => <span className="font-black" style={{ color: EL_STYLE[jijiElement(d.jj)].text }}>{d.jj}</span> },
                { row: "십신", get: (d: typeof pd.year) => d.sipseongJj ? <span style={{ color: sipseongColorByIlgan(ilgan, d.sipseongJj) }}>{d.sipseongJj}</span> : "—" },
                { row: "지장간", get: (d: typeof pd.year) => (JIJANGAN_DISPLAY[d.jj] || []).map(j => j.stem).join("") || "—" },
                { row: "12운성", get: (d: typeof pd.year) => d.uunseong || "—" },
                {
                  row: "신살", get: (d: typeof pd.year, label: string) => {
                    const pl = label === "년주" ? "연" : label === "월주" ? "월" : label === "일주" ? "일" : "시";
                    const names = (result.sinsalList || []).filter(s => s.pillars?.includes(pl) && s.name !== "나체도화").map(s => s.name);
                    if (!names.length) return "—";
                    return (
                      <div className="flex flex-col items-center gap-0.5">
                        {names.map((n, i) => <span key={i}>{n}</span>)}
                      </div>
                    );
                  }
                },
              ].map((rowDef, ri) => (
                <tr key={ri} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <td className="text-[9px] font-bold py-1.5 px-1" style={{ color: "rgba(255,255,255,0.3)" }}>{rowDef.row}</td>
                  {[...pillars].reverse().map(({ label, d }) => (
                    <td key={label} className="text-[10px] font-bold py-1.5 px-1" style={{ color: "rgba(255,255,255,0.75)", wordBreak: "keep-all", overflowWrap: "break-word" }}>
                      {rowDef.get(d, label)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 궁성론 — 각 기둥 의미 */}
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-bold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>궁성론 (宮星論) — 각 기둥이 나타내는 영역</p>
          {(["시주","일주","월주","년주"] as const).filter((k) => k !== "시주" || !!pd.hour).map(label => {
            const d = label === "년주" ? pd.year : label === "월주" ? pd.month : label === "일주" ? pd.day : pd.hour!;
            const g = GUNG_DESC[label];
            const cgEl = CHEONGAN_ELEMENT[d.cg] || "토";
            const jiEl = jijiElement(d.jj);
            return (
              <div key={label} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.06)` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black" style={{ color: g.color }}>{label}</span>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{g.period}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="font-bold" style={{ color: EL_STYLE[cgEl].text }}>천간 {d.cg}</span>
                    <span className="text-white/40"> — </span>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>{g.cg}</span>
                  </div>
                  <div>
                    <span className="font-bold" style={{ color: EL_STYLE[jiEl].text }}>지지 {d.jj}</span>
                    <span className="text-white/40"> — </span>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>{g.jj}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
        );
      })()}

      {/* 신살 — 사주 바로 아래 */}
      {result.sinsalList.length > 0 && (
        <Section title={`신살(神殺) · 총 ${result.sinsalList.length}개 발견`} accent="#c084fc">
          <div className="space-y-2.5">
            {result.sinsalList.map(s => (
              <div key={s.name} className="rounded-xl px-4 py-3" style={{ background: s.category === "lucky" ? "rgba(52,211,153,0.05)" : s.category === "unlucky" ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.03)", border: s.category === "lucky" ? "1px solid rgba(52,211,153,0.15)" : s.category === "unlucky" ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-white">{s.name}</span>
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{s.hanja}</span>
                  <span className="text-[9px] px-1.5 rounded font-bold" style={{ background: s.category === "lucky" ? "rgba(52,211,153,0.12)" : s.category === "unlucky" ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)", color: s.category === "lucky" ? "#34d399" : s.category === "unlucky" ? "#f87171" : "#9ca3af" }}>
                    {s.category === "lucky" ? "길신" : s.category === "unlucky" ? "흉살" : "중립"}
                  </span>
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{s.pillars.join("·")}주</span>
                </div>
              </div>
            ))}
          </div>
          {/* 도화살 위치별 의미 + 발현 시기 */}
          {(() => {
            const dohwaItems = result.sinsalList.filter(s =>
              ["도화살","진도화","나체도화","곤랑도화","녹방도화"].includes(s.name)
            );
            if (dohwaItems.length === 0) return null;
            const dohwaPillars = [...new Set(dohwaItems.flatMap(s => s.pillars))];
            const posLabel: Record<string, string> = { 년: "연주", 월: "월주", 일: "일주", 시: "시주" };
            const branchByLabel: Record<string, string> = {
              년: pd.year.jj, 월: pd.month.jj, 일: pd.day.jj, 시: pd.hour?.jj ?? "",
            };
            const pillarOrder = ["년","월","일","시"];
            const hasHapExtension = dohwaPillars.some(p => {
              const idx = pillarOrder.indexOf(p);
              if (idx < 0) return false;
              const neighbors = [pillarOrder[idx-1], pillarOrder[idx+1]].filter(Boolean);
              return neighbors.some(n => {
                const jjA = branchByLabel[p];
                const jjN = branchByLabel[n];
                if (!jjA || !jjN) return false;
                const rels = getJijiRelations([jjA, jjN]);
                return rels.some(r => r.type === "육합" || r.type === "삼합" || r.type === "반합");
              });
            });
            return (
              <div className="mt-4 rounded-xl px-4 py-3" style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "#fb7185" }}>🌸 도화살 위치별 의미 · 발현 시기</p>
                <div className="space-y-2">
                  {dohwaPillars.map(p => {
                    const info = DOHWA_POSITION_INFO[p];
                    if (!info) return null;
                    return (
                      <div key={p}>
                        <p className="text-[10px] font-bold mb-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{posLabel[p] ?? `${p}주`} 도화</p>
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{info.meaning} {info.timing}</p>
                      </div>
                    );
                  })}
                </div>
                {hasHapExtension && (
                  <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "rgba(251,113,133,0.7)" }}>{DOHWA_HAP_EXTENSION_NOTE}</p>
                )}
              </div>
            );
          })()}
        </Section>
      )}

      {/* ② 격국 · 용신 */}
      {(() => {
        // 조후용신 계산 (일간 × 계절 기반)
        const season = getSeasonByMonth(monthJj);
        const johuRaw = JOHU_YONGSHIN[ilgan]?.[season];
        const johu = johuRaw ? { yongshin: johuRaw.primary, heeshin: johuRaw.secondary, desc: johuRaw.desc } : null;
        const ys = result.yongshin;
        // 억부용신과 다른 경우 노트
        const jysDiff = johu && johu.yongshin !== ys.yongshin;
        // 기신: 용신을 극하는 오행
        const gishin = ys.gishin;
        // 구신: 기신을 생하는 오행
        const gusinMap: Record<string,string> = { 목:"수", 화:"목", 토:"화", 금:"토", 수:"금" };
        const gusin = gusinMap[gishin] || "";
        return (
          <Section title="격국 · 용신 · 조후 (格局用神)" accent="#a78bfa">
            {/* 억부용신 그리드 */}
            <p className="text-[10px] font-bold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>억부용신(抑扶用神)</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[
                { label: "신강/신약", value: ys.strength, color: ys.strength === "신강" ? "#f87171" : ys.strength === "신약" ? "#60a5fa" : "#4ade80" },
                { label: "억부용신", value: ys.yongshin, color: EL_STYLE[ys.yongshin]?.text || "#fff" },
                { label: "희신(喜神)", value: ys.heeshin, color: EL_STYLE[ys.heeshin]?.text || "#fff" },
                { label: "기신(忌神)", value: gishin, color: EL_STYLE[gishin]?.text || "#fff" },
                { label: "구신(仇神)", value: gusin, color: EL_STYLE[gusin]?.text || "#9ca3af" },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</p>
                  <p className="text-lg font-black" style={{ color: item.color }}>{item.value || "—"}</p>
                </div>
              ))}
            </div>
            {/* 조후용신 */}
            {johu && (
              <div className="mb-4 rounded-xl px-4 py-3" style={{ background: jysDiff ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${jysDiff ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                <p className="text-[10px] font-bold mb-1" style={{ color: jysDiff ? "#fbbf24" : "rgba(255,255,255,0.4)" }}>조후용신(調候用神): {johu.yongshin} · 희신: {johu.heeshin}</p>
                <p className="text-xs leading-relaxed" style={{ color: jysDiff ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)" }}>{johu.desc}</p>
                {jysDiff && (
                  <p className="text-[10px] mt-1.5 font-bold" style={{ color: "#fbbf24" }}>
                    ※ 억부용신({ys.yongshin})과 조후용신({johu.yongshin})이 다릅니다. 둘을 함께 고려하세요.
                  </p>
                )}
              </div>
            )}
            <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>{ys.desc}</p>
            <div className="space-y-3">
              {(["mindset","boundary","mental","style"] as const).map((key) => {
                const labels = { mindset:"사고방식", boundary:"대인관계", mental:"멘탈구조", style:"행동스타일" };
                return (
                  <div key={key} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] font-bold mb-1" style={{ color: "#a78bfa" }}>{labels[key]}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{singangTrait[key]}</p>
                  </div>
                );
              })}
              <div className="rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-[10px] font-bold mb-1" style={{ color: "#f87171" }}>주의사항</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{singangTrait.caution}</p>
              </div>
            </div>
          </Section>
        );
      })()}

      {/* ②-0 오행 상호작용 인사이트 */}
      {(() => {
        const ilganEl = (CHEONGAN_ELEMENT[result.pillarsDetail.day.cg] || "목") as string;
        const roleDB = OHAENG_ROLE_DB[ilganEl];
        if (!roleDB) return null;
        const ys = result.yongshin;
        const isShinyak = ys.strength === "신약";
        const dominant = result.dominant ?? [];
        const lacking = result.lacking ?? [];

        // 오행 → 십성 계열 매핑 (일간 기준)
        const CONTROLS_MAP: Record<string, string> = { 목:"토", 화:"금", 토:"수", 금:"목", 수:"화" };
        const GENERATED_BY_MAP: Record<string, string> = { 목:"수", 화:"목", 토:"화", 금:"토", 수:"금" };
        const SAME_EL = ilganEl;

        // 어떤 역할(식상/재성/관성/인성/비겁)인지 오행으로 판별
        const getRole = (el: string): string => {
          if (el === SAME_EL) return "비겁";
          if (el === CONTROLS_MAP[ilganEl]) return "재성";
          if (CONTROLS_MAP[el] === ilganEl) return "관성";
          if (el === GENERATED_BY_MAP[ilganEl]) return "인성";
          return "식상";
        };

        // dominant/lacking 오행을 기준으로 가장 관련 높은 인사이트 2~3개 선택
        const shownRoles = new Set<string>();
        const insights: string[] = [];

        for (const el of dominant) {
          const role = getRole(el);
          if (shownRoles.has(role)) continue;
          const entry = roleDB.find(e => e.role === role);
          if (!entry) continue;
          shownRoles.add(role);
          insights.push(isShinyak ? entry.condition_weak : entry.condition_strong);
          if (insights.length >= 2) break;
        }
        for (const el of lacking) {
          if (insights.length >= 3) break;
          const role = getRole(el);
          if (shownRoles.has(role)) continue;
          const entry = roleDB.find(e => e.role === role);
          if (!entry) continue;
          shownRoles.add(role);
          insights.push(entry.insight);
        }

        if (insights.length === 0) return null;
        return (
          <Section title="오행 상호작용 인사이트" accent="#c084fc">
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
              {insights.join(" ")}
            </p>
          </Section>
        );
      })()}

      {/* ②-1 특수 격국 / 병존 */}
      {(() => {
        const gagukPatterns = detectGagukPatterns(result);
        if (gagukPatterns.length === 0) return null;
        return (
          <Section title={`특수 격국 · 병존(竝存)`} accent="#f59e0b">
            <div className="space-y-2.5">
              {gagukPatterns.map(p => (
                <div key={p.name} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm" style={{ color: p.color }}>{p.name}</span>
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{p.hanja}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </Section>
        );
      })()}

      {/* ②-2 금수쌍청 감지 */}
      {(() => {
        const allCg = [pd.year.cg, pd.month.cg, pd.day.cg, pd.hour?.cg].filter(Boolean) as string[];
        const allJj = [pd.year.jj, pd.month.jj, pd.day.jj, pd.hour?.jj].filter(Boolean) as string[];
        const gs = detectGumsuSangcheong(pd.day.cg, pd.month.jj, allCg, allJj);
        if (gs.level === "해당없음" || !gs.desc) return null;
        return (
          <Section title="금수쌍청(金水雙淸)" accent="#38bdf8">
            <div className="rounded-xl px-4 py-3 mb-3" style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.18)" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold text-sm text-sky-300">{gs.level === "완전체" ? "✦ 금수쌍청 완전체" : "금수쌍청 기질 (미완성)"}</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-300">{gs.desc}</p>
            </div>
            {gs.careerHint && (
              <p className="text-xs leading-relaxed text-gray-400 mt-1">{gs.careerHint}</p>
            )}
            {gs.missingConditions.length > 0 && gs.level === "미완성" && (
              <p className="text-xs text-gray-600 mt-2">미충족: {gs.missingConditions.join(" · ")}</p>
            )}
          </Section>
        );
      })()}

      {/* ③ 일간 성격 */}
      {ilganInfo && (
        <Section title={`일간(日干) 심층분석 · ${ilganInfo.short}`} accent="#34d399">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ilganInfo.keyword.split("·").map(k => (
              <span key={k} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>{k}</span>
            ))}
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>{ilganInfo.detail}</p>
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold mb-2" style={{ color: "#6ee7b7" }}>{isYang ? "양간(陽干)" : "음간(陰干)"} 기질</p>
            <p className="text-xs leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>{yangYin.split(":")[1]?.trim() || yangYin}</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{yangYinLove}</p>
          </div>
          {ILGAN_AFFECTION_STYLE[ilgan] && (
            <div className="mt-3 rounded-xl px-4 py-3" style={{ background: "rgba(244,114,182,0.06)", border: "1px solid rgba(244,114,182,0.15)" }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: "#f9a8d4" }}>애정 표현 방식</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{ILGAN_AFFECTION_STYLE[ilgan]}</p>
            </div>
          )}
          <div className="mt-3 rounded-xl px-4 py-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: "#fbbf24" }}>핵심 내면 걱정</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{coreWorry}</p>
          </div>
        </Section>
      )}

      {/* ④ 60갑자 일주론 */}
      {iljuInfo && (
        <Section title={`일주론 (日柱論) · ${iljuKey}일주 · ${iljuInfo.image}`} accent="#fbbf24">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "오행", value: CHEONGAN_ELEMENT[ilgan] || "—", color: EL_STYLE[CHEONGAN_ELEMENT[ilgan] || "토"].text },
              { label: "일주 동물", value: getIljuAnimal(ilgan, pd.day.jj), color: "#fbbf24" },
              { label: "타고난 성향", value: dominantSipseong || "—", color: "#a78bfa" },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-base font-black mb-1" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0" style={{ background: EL_STYLE[CHEONGAN_ELEMENT[ilgan] || "토"].bg, border: `1px solid ${EL_STYLE[CHEONGAN_ELEMENT[ilgan] || "토"].border}` }}>
              <span className="text-xl font-black" style={{ color: EL_STYLE[CHEONGAN_ELEMENT[ilgan] || "토"].text }}>{iljuKey[0]}</span>
              <span className="text-xl font-black" style={{ color: EL_STYLE[jijiElement(pd.day.jj)]?.text }}>{iljuKey[1]}</span>
            </div>
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: "#fbbf24" }}>{iljuInfo.uunseong} · {iljuInfo.keyword}</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{iljuInfo.personality}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {[
              ...(uunseongDetailInfo ? [{ label: `일주 12운성 — ${pd.day.uunseong}(${UUNSEONG_HANJA[pd.day.uunseong] || ""}) · ${uunseongDetailInfo.stage}`, text: uunseongDetailInfo.desc, color: "#60a5fa" }] : []),
              { label: "연애 스타일", text: iljuInfo.love, color: "#f472b6" },
              { label: "적합 직업·커리어", text: iljuCareerAdjusted, color: "#34d399" },
              { label: "주의할 점", text: iljuInfo.caution, color: "#f87171" },
              ...(ILGAN_SHADOW[ilgan] ? [{ label: `그림자 기질 — ${ILGAN_SHADOW[ilgan].title}`, text: ILGAN_SHADOW[ilgan].desc, color: "#9ca3af" }] : []),
            ].map(item => (
              <div key={item.label} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold mb-1" style={{ color: item.color }}>{item.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{item.text}</p>
              </div>
            ))}
          </div>
          {ILGAN_BOUNDARY[ilgan] && (
            <div className="mt-4 rounded-xl px-4 py-3" style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.12)" }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: "#f87171" }}>독하게 살아야 살아남는 사주 — {ILGAN_BOUNDARY[ilgan].title}</p>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>{ILGAN_BOUNDARY[ilgan].desc}</p>
              <p className="text-xs font-bold" style={{ color: "#34d399" }}>▶ {ILGAN_BOUNDARY[ilgan].advice}</p>
            </div>
          )}
          {ILGAN_PLACES[ilgan] && (
            <div className="mt-4 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-bold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>인생이 안 풀린다면 — {ilgan}일간에게 맞는 환경</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>🇰🇷 국내</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{ILGAN_PLACES[ilgan].domestic.join(" · ")}</p>
                </div>
                <div>
                  <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>✈️ 해외</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{ILGAN_PLACES[ilgan].overseas.join(" · ")}</p>
                </div>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ④-a 간여지동 · 이성운 */}
      {isGanyeoJidong(ilgan, pd.day.jj) && (() => {
        const gz = GANYEO_JIDONG_ILJU[iljuKey];
        const love = GANYEO_JIDONG_LOVE;
        return (
          <Section title="간여지동(干與支同) · 이성운" accent="#f472b6">
            <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>{GANYEO_JIDONG_GENERAL.desc}</p>
            {gz && (
              <div className="rounded-xl px-4 py-3 mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold mb-1" style={{ color: "#fbbf24" }}>{iljuKey}일주 · 고집 강도 {gz.stubbornness}/5</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{gz.specific}</p>
              </div>
            )}
            {GANYEO_ERA_SHIFT_NOTE[iljuKey] && (
              <div className="rounded-xl px-4 py-3 mb-3" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)" }}>
                <p className="text-[10px] font-bold mb-1" style={{ color: "#60a5fa" }}>시대가 바뀌면 강함의 모양도 바뀌어요</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{GANYEO_ERA_SHIFT_NOTE[iljuKey]}</p>
              </div>
            )}
            <p className="text-[10px] font-bold mb-2" style={{ color: "#fbbf24" }}>&quot;간여지동은 팔자가 드세다&quot;? — 이 기운이 무기가 되는 이유</p>
            <div className="space-y-2.5 mb-4">
              {GANYEO_JIDONG_STRENGTHS.map((item, i) => (
                <div key={i} className="rounded-xl px-4 py-3" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "#fbbf24" }}>{i + 1}. {item.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{item.body}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold mb-2" style={{ color: "#f472b6" }}>그래서 — &quot;남자복/여자복이 없다&quot;는 말, 진짜일까?</p>
            <div className="space-y-2.5">
              {[
                love.disclaimer,
                love.charm,
                love.hapTrigger,
                love.bigeopMany,
                love.notRequired,
                love.coupleGanyeo,
              ].map((text, i) => (
                <div key={i} className="rounded-xl px-4 py-3" style={{ background: "rgba(244,114,182,0.05)", border: "1px solid rgba(244,114,182,0.12)" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{text}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold mt-4 mb-2" style={{ color: "#f472b6" }}>간여지동 — 알아두면 좋은 특징</p>
            <ul className="space-y-1.5">
              {love.extraFacts.map((f, i) => (
                <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <span style={{ color: "#f472b6" }}>·</span>{f}
                </li>
              ))}
            </ul>
          </Section>
        );
      })()}

      {/* ④-b 외향성·내향성 분석 */}
      {(() => {
        const scores = result.scores;
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
        const pct = (el: keyof typeof scores) => Math.round((scores[el] / totalScore) * 100);
        let score = isYang ? 1 : -1;
        if (pct("화") >= 25) score += 1;
        if (pct("수") >= 25) score -= 1;
        if (pct("금") >= 25) score -= 1;
        score = Math.max(-3, Math.min(3, score));
        const label =
          score <= -2 ? "강한 내향성" :
          score === -1 ? "내향성 우세" :
          score === 0  ? "균형형" :
          score === 1  ? "외향성 우세" : "강한 외향성";
        const desc =
          score <= -2 ? "혼자만의 공간과 시간이 꼭 필요합니다. 깊은 사색과 집중력이 강점입니다. 사람이 많은 자리는 에너지를 소진시킵니다." :
          score === -1 ? "기본적으로 내향적이나 필요에 따라 사교적으로 행동할 수 있습니다. 신중하고 관찰력이 뛰어납니다." :
          score === 0  ? "상황에 따라 외향·내향을 유연하게 전환합니다. 폭넓은 적응력이 강점입니다." :
          score === 1  ? "대체로 외향적이나 혼자만의 회복 시간도 필요합니다. 활동적이고 표현력이 풍부합니다." :
          "강한 에너지 발산 기질입니다. 사람들과 어울릴 때 생기가 넘칩니다. 혼자 있으면 에너지가 소진됩니다.";
        const barColor = score > 0 ? "#ef4444" : score < 0 ? "#94a3b8" : "#fbbf24";
        const barPct = ((score + 3) / 6) * 100;
        return (
          <Section title="외향성·내향성 분석" accent="#a78bfa">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-black px-3 py-1 rounded-full" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>{label}</span>
            </div>
            <div className="relative h-2.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="absolute left-0 top-0 h-2.5 rounded-full transition-all" style={{ width: `${barPct}%`, background: barColor }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white" style={{ left: `${barPct}%`, transform: "translate(-50%,-50%)", background: barColor }} />
            </div>
            <div className="flex justify-between text-[9px] mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
              <span>강한 내향 (-3)</span>
              <span>균형 (0)</span>
              <span>강한 외향 (+3)</span>
            </div>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>{desc}</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>기반 기질</span>
                <span className="ml-2 font-bold" style={{ color: isYang ? "#ef4444" : "#94a3b8" }}>{isYang ? "양간(+1 외향)" : "음간(-1 내향)"}</span>
              </div>
              {pct("화") >= 25 && (
                <div className="rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>화(火) 강세</span>
                  <span className="ml-2 font-bold" style={{ color: "#ef4444" }}>+1 외향</span>
                </div>
              )}
              {pct("수") >= 25 && (
                <div className="rounded-lg px-3 py-2" style={{ background: "rgba(148,163,184,0.05)", border: "1px solid rgba(148,163,184,0.15)" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>수(Water) 강세</span>
                  <span className="ml-2 font-bold" style={{ color: "#94a3b8" }}>-1 내향</span>
                </div>
              )}
              {pct("금") >= 25 && (
                <div className="rounded-lg px-3 py-2" style={{ background: "rgba(248,250,252,0.03)", border: "1px solid rgba(248,250,252,0.1)" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>금(金) 강세</span>
                  <span className="ml-2 font-bold" style={{ color: "#f8fafc" }}>-1 신중·내향</span>
                </div>
              )}
            </div>
          </Section>
        );
      })()}

      {/* ④-2 일지 도화살 여성 특성 */}
      {(() => {
        if (form.gender !== "female") return null;
        const dayJjSinsal = result.sinsalList.filter(s =>
          ["도화살","진도화","나체도화","홍염살","곤랑도화","녹방도화"].includes(s.name) &&
          s.pillars.includes("일")
        );
        if (dayJjSinsal.length === 0) return null;
        return (
          <Section title="배우자궁 도화 — 내 안의 매력" accent="#fb7185">
            <p className="text-xs text-gray-400 leading-relaxed mb-3">{ILJI_DOHWA_FEMALE_DESC.summary}</p>
            <div className="space-y-1.5 mb-3">
              {ILJI_DOHWA_FEMALE_DESC.traits.map((t, i) => (
                <p key={i} className="text-xs text-gray-300 leading-relaxed">• {t}</p>
              ))}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed pt-2 border-t border-white/[0.06]">{ILJI_DOHWA_FEMALE_DESC.mechanism}</p>
          </Section>
        );
      })()}

      {/* ④-3 여성 이성운 — 좋은 인연을 부르는 구조 */}
      {femaleLovePatterns.length > 0 && (
        <Section title="좋은 인연을 부르는 사주 속 신호" accent="#f59e0b">
          <div className="space-y-4">
            {femaleLovePatterns.map((p, i) => (
              <div key={i} className={i > 0 ? "pt-4 border-t border-white/[0.06]" : ""}>
                <p className="text-sm font-bold mb-1" style={{ color: "#fbbf24" }}>{p.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ⑤ 월지 심리 */}
      {weolji && (
        <Section title="월지(月支) 심리 프로파일" accent="#06b6d4">
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{weolji}</p>
        </Section>
      )}

      {/* ⑥ 오행 분포 */}
      <Section title="오행 분포 · 균형 분석" accent="#4ade80">
        {/* 도넛 차트 + 보정 전/후 토글 */}
        <div className="flex flex-col items-center mb-4">
          <OhaengDonut scores={result.scores} total={total} />
          <p className="text-[11px] mt-3 px-3 py-1.5 rounded-lg text-center" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", color: "rgba(255,255,255,0.45)" }}>
            조후, 궁성, 합충 등을 종합 반영해 보정한 결과입니다.
          </p>
        </div>
        <div className="space-y-3 mb-4">
          {(["목","화","토","금","수"] as Element[]).map(el => {
            const score = result.scores[el] || 0;
            const pct = total > 0 ? Math.round((score / total) * 100) : 0;
            const style = EL_STYLE[el];
            const isDom = result.dominant.includes(el);
            const isLack = result.lacking.includes(el);
            return (
              <div key={el} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 w-20 shrink-0">
                  <span className="text-sm font-black" style={{ color: style.text }}>{el}</span>
                  {isDom && <span className="text-[9px] px-1 rounded font-bold" style={{ background: style.badge, color: style.text }}>과다</span>}
                  {isLack && <span className="text-[9px] px-1 rounded font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>부족</span>}
                </div>
                <div className="flex-1 rounded-full h-2.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: style.text, boxShadow: `0 0 8px ${style.text}60` }} />
                </div>
                <span className="text-xs w-10 text-right font-bold" style={{ color: style.text }}>{pct}%</span>
              </div>
            );
          })}
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{result.personality} {getGeumMokGwadaNarrative(result)} {getStrengthTraitNarrative(result)} {getExtremeStrengthNarrative(result)} {getWoljiSingleGyeopjaeNarrative(result)} {getHourCheonulIntactGoodFlowNarrative(result)} {detectStayPutPattern(result).map(p => `${p.desc} ${p.advice}`).join(" ")}</p>
      </Section>

      {/* 십성 구조 패턴: 무비겁·무재·쟁재·병존 등 특이구조 */}
      {(sipseongPatterns.length > 0 || byeongjonPatterns.length > 0 || dohwaTypes.length > 0) && (
        <Section title="특이구조 — 십성·병존" accent="#fb923c">
          <div className="space-y-3">
            {sipseongPatterns.map(p => (
              <div key={p.name} className="rounded-xl px-4 py-3" style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.18)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c" }}>{p.name}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{p.hanja}</span>
                </div>
                <p className="text-sm leading-relaxed mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>{p.desc}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(251,146,60,0.8)" }}>{p.advice}</p>
                {p.name === "무재" && (
                  <p className="text-xs leading-relaxed mt-2 pt-2" style={{ color: "rgba(255,255,255,0.55)", borderTop: "1px solid rgba(251,146,60,0.15)" }}>
                    <strong style={{ color: "#fb923c" }}>이성운 — </strong>
                    {form.gender === "female"
                      ? "여성에게 재물을 뜻하는 기운은 시어머니 인연·활동력을 의미해요. 이 기운이 약하다고 이성운 자체와 크게 관련이 있는 건 아니지만, 재물보다 사람·관계에서 만족을 더 찾는 편이에요."
                      : "남성에게 재물을 뜻하는 기운은 여성·배우자 인연을 의미해요. 이 기운이 약하면 인연이 자연스럽게 들어오기보다, 본인이 적극적으로 다가가야 인연이 이어지는 경향이 있어요."}
                  </p>
                )}
                {p.name === "무관" && (
                  <p className="text-xs leading-relaxed mt-2 pt-2" style={{ color: "rgba(255,255,255,0.55)", borderTop: "1px solid rgba(251,146,60,0.15)" }}>
                    <strong style={{ color: "#fb923c" }}>이성운 — </strong>
                    {form.gender === "female"
                      ? "여성에게 조직·책임을 뜻하는 기운은 남성·배우자 인연을 의미해요. 이 기운이 약하면 인연이 자연스럽게 들어오기보다, 본인이 적극적으로 다가가야 인연이 이어지는 경향이 있어요."
                      : "남성에게 조직·책임을 뜻하는 기운은 자식·명예·조직을 의미해요. 이 기운이 약하다고 이성운 자체와 크게 관련이 있는 건 아니지만, 조직보다 자유로운 관계 방식을 선호하는 편이에요."}
                  </p>
                )}
              </div>
            ))}
            {byeongjonPatterns.map(p => (
              <div key={p.name} className="rounded-xl px-4 py-3" style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.18)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c" }}>{p.name}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{p.hanja}</span>
                </div>
                <p className="text-sm leading-relaxed mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>{p.desc}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(251,146,60,0.8)" }}>{p.advice}</p>
              </div>
            ))}
            {dohwaTypes.map(p => (
              <div key={p.name} className="rounded-xl px-4 py-3" style={{ background: "rgba(244,114,182,0.06)", border: "1px solid rgba(244,114,182,0.18)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(244,114,182,0.15)", color: "#f472b6" }}>{p.name}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{p.hanja}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 합·충 성격 구조 */}
      {hapChungChar && (
        <Section title={`${hapChungChar.name} — 에너지 흐름 구조`} accent="#a78bfa">
          <div className="space-y-2">
            {[
              { label: "핵심", val: hapChungChar.core },
              { label: "강점", val: hapChungChar.strength },
              { label: "약점", val: hapChungChar.weakness },
              { label: "연애 스타일", val: hapChungChar.loveStyle },
              { label: "궁합 방향", val: hapChungChar.compatible },
            ].map(item => (
              <div key={item.label} className="rounded-xl px-4 py-3" style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)" }}>
                <p className="text-[10px] font-bold mb-1" style={{ color: "#a78bfa" }}>{item.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{item.val}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ⑦ 건강 분석 (오행 건강 + 천간충 건강 신호 통합) */}
      <Section title="건강 분석" accent="#f87171">
        <div className="space-y-4">
          {[domEl, lackEl].filter(Boolean).slice(0, 2).map(el => {
            const h = OHAENG_HEALTH[el as Element];
            const style = EL_STYLE[el as string];
            const isDom = result.dominant.includes(el as Element);
            return (
              <div key={el}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-black text-base" style={{ color: style.text }}>{el}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: isDom ? style.badge : "rgba(239,68,68,0.1)", color: isDom ? style.text : "#f87171", border: `1px solid ${isDom ? style.border : "rgba(239,68,68,0.2)"}` }}>
                    {isDom ? "과다" : "부족"} → {h.organs}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {h.symptoms.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.15)" }}>{s}</span>
                  ))}
                </div>
                <p className="text-xs leading-relaxed mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>{h.caution}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{h.lifestyle}</p>
              </div>
            );
          })}
          {chunganChung.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>천간충(天干沖) — 건강 주의 신호</p>
              <div className="space-y-3">
                {chunganChung.map(c => (
                  <div key={c.pair.join("")} className="rounded-xl px-4 py-3" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                        {c.pair[0]}·{c.pair[1]} 충
                      </span>
                      <span className="text-xs font-bold" style={{ color: "rgba(248,113,113,0.8)" }}>→ {c.body}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* 비겁·식상·재성·관성·인성 그룹별 강약 해석 */}
      <Section title="십성 그룹별 강약 — 비겁·식상·재성·관성·인성" accent="#a78bfa">
        <div className="space-y-2.5">
          {getSipseongStrength(result).map(s => {
            const statusColor = s.status === "강함" ? "#34d399" : s.status === "보통" ? "#60a5fa" : s.status === "약함" ? "#fbbf24" : "rgba(255,255,255,0.35)";
            const statusBg = s.status === "강함" ? "rgba(52,211,153,0.08)" : s.status === "보통" ? "rgba(96,165,250,0.08)" : s.status === "약함" ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)";
            return (
              <div key={s.group} className="rounded-xl px-4 py-3" style={{ background: statusBg, border: `1px solid ${statusColor}30` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black" style={{ color: statusColor }}>{s.group}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${statusColor}22`, color: statusColor }}>{s.status}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{s.reason}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 개운법 — 색상·방향·음식·운동·아이템·숫자 랭킹 */}
      <Section title="개운법 — 나에게 맞는 색·방향·음식·숫자" accent="#fbbf24">
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>오행 기운을 기준으로 좋은 오행 3가지를 우선 활용해보세요</p>
        <div className="space-y-2.5">
          {getGaewunRanking(result).map(g => (
            <div key={g.element} className="rounded-xl px-4 py-3" style={{ background: g.isGood ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${g.isGood ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.08)"}` }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: g.isGood ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.08)", color: g.isGood ? "#fbbf24" : "rgba(255,255,255,0.4)" }}>{g.rank}순위</span>
                <span className="text-sm font-black" style={{ color: g.colorHex }}>{g.color}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>방향 {g.direction} · 음식 {g.food} · 맛 {g.taste} · 운동 {g.exercise} · 아이템 {g.items} · 숫자 {g.numbers}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ⑧ 직업 적성 */}
      <Section title="직업 적성 · 커리어 분석" accent="#34d399">
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>지배 오행({domEl}) · 일주 기준 적성 분석</p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>{domCareer.strengths}{iljuCareerAdjusted && ` 타고난 일주(태어난 날의 기둥) 기준으로 보면, ${iljuCareerAdjusted}`}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {domCareer.suited.map(s => (
            <span key={s} className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>{s}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {domCareer.industries.map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>{s}</span>
          ))}
        </div>
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
          <p className="text-[10px] font-bold mb-1" style={{ color: "#f87171" }}>커리어 주의사항</p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{domCareer.caution}</p>
        </div>
      </Section>

      {/* ⑨ 재성 위치 */}
      <Section title="재물 기운의 위치 · 재물 스타일" accent="#fbbf24">
        <div className="mb-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>{jaeseongPos}에 위치</span>
        </div>
        <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>{jaeseongInfo.desc}</p>
        <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>{jaeseongInfo.style}</p>
        <p className="text-xs px-4 py-2.5 rounded-xl" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)", color: "rgba(255,255,255,0.55)" }}>
          재물 방식: {jaeseongInfo.wealth}
        </p>
      </Section>

      {/* ⑩⑪ 대운표 + 세운표 */}
      <Section title="대운표 · 세운표 (大運歲運)" accent="#818cf8">
        <DaewoonSewoonTable daewoon={daewoon} ilgan={ilgan} birthYear={birthYear} />
      </Section>

      {/* ⑫ 유료 서비스 CTA */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))", border: "1px solid rgba(139,92,246,0.2)" }}>
        <div>
          <p className="text-base font-black text-white mb-1">더 깊은 분석이 궁금하신가요?</p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>만세력은 기초 데이터입니다. 실제 삶에 어떻게 적용되는지는 심화 서비스에서 확인하세요.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/service/daewoon", label: "대운 심층분석", desc: "10년 단위 운명 흐름", color: "#818cf8" },
            { href: "/service/gunghap", label: "궁합 분석", desc: "연인·배우자와의 궁합", color: "#f472b6" },
            { href: "/service/saju", label: "사주 오행 배경화면", desc: "사주로 만드는 나만의 배경화면", color: "#34d399" },
            { href: "/guide", label: "명리학 가이드", desc: "사주 공부 무료 가이드", color: "#fbbf24" },
          ].map(item => (
            <Link key={item.href} href={item.href} className="rounded-xl p-3 block transition hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm font-bold mb-0.5" style={{ color: item.color }}>{item.label}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <ResultFooterActions targetId="manseryeok-result" fileName="내사주_만세력" />

      {/* 면책 */}
      <p className="text-[10px] text-center pb-6" style={{ color: "rgba(255,255,255,0.2)" }}>
        본 분석은 사주 이론 기반 오락용 콘텐츠입니다.
      </p>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function ManseryeokPage() {
  const [birthForm, setBirthForm] = useState<BirthFormData>(defaultBirthData("female"));

  const [gender, setGender] = useState<"male" | "female">("female");
  const [result, setResult] = useState<SajuResult | null>(null);
  const [calcInput, setCalcInput] = useState<{ year: number; month: number; day: number; birthHour: number | null } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: import("react").FormEvent) => {
    e.preventDefault();
    if (!birthForm.birthYear || !birthForm.birthMonth || !birthForm.birthDay) {
      alert("생년월일을 모두 선택해주세요.");
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));

    let year  = Number(birthForm.birthYear);
    let month = Number(birthForm.birthMonth);
    let day   = Number(birthForm.birthDay);

    if (birthForm.calendarType === "lunar") {
      try {
        // @ts-ignore
        const KoreanLunarCalendar = (await import("korean-lunar-calendar")).default;
        const cal = new KoreanLunarCalendar();
        cal.setLunarDate(year, month, day, birthForm.isLeapMonth);
        const solar = cal.getSolarCalendar();
        if (!solar?.year) throw new Error();
        year = solar.year; month = solar.month; day = solar.day;
      } catch {
        alert("음력 변환 실패. 날짜를 다시 확인해주세요.");
        setLoading(false);
        return;
      }
    }

    const r = analyzeSaju({
      birthYear: year, birthMonth: month, birthDay: day,
      birthHour: birthForm.birthHour,
      birthMinute: birthForm.birthMinute,
      name: birthForm.name || "사주",
      gender: birthForm.gender,
      birthPlace: birthForm.city || "서울",
      style: "auto",
      productType: "report",
      useJajasi: birthForm.useJajasi,
    });

    setCalcInput({ year, month, day, birthHour: birthForm.birthHour });
    setResult(r);
    setLoading(false);
  };

  const reset = () => { setResult(null); setCalcInput(null); };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="w-full"><BackButton /></div>
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full animate-spin" style={{ border: "2px solid rgba(99,102,241,0.15)", borderTopColor: "#6366f1" }} />
          <div className="absolute inset-3 rounded-full animate-spin" style={{ border: "2px solid rgba(139,92,246,0.15)", borderTopColor: "#8b5cf6", animationDirection: "reverse", animationDuration: "0.8s" }} />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">☯</div>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg mb-2">사주 완전 분석 중...</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>사주 구조·필요 기운·일주론·신살·대운 계산 중</p>
        </div>
        <AdBanner className="max-w-sm" />
      </div>
    );
  }

  if (result && calcInput) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8">
        <BackButton />
        <ResultView
          result={result}
          form={{ name: birthForm.name, gender: birthForm.gender, birthPlace: birthForm.city || "서울" }}
          birthHour={calcInput.birthHour}
          birthYear={calcInput.year}
          birthMonth={calcInput.month}
          birthDay={calcInput.day}
          onReset={reset}
        />
      </main>
    );
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #0a0015 0%, #0d0028 35%, #050018 65%, #000008 100%)" }}>
      {/* 키프레임 애니메이션 */}
      <style>{`
        @keyframes twinkleStar { 0%,100%{opacity:0.12} 50%{opacity:0.85} }
        @keyframes rotateSlow2 { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes pulseGlow2 { 0%,100%{box-shadow:0 0 24px rgba(139,92,246,0.55),0 0 60px rgba(99,102,241,0.3)} 50%{box-shadow:0 0 44px rgba(167,139,250,0.85),0 0 100px rgba(139,92,246,0.5)} }
        @keyframes inputGlow2 { 0%,100%{border-color:rgba(139,92,246,0.25)} 50%{border-color:rgba(167,139,250,0.6)} }
        @keyframes heroText2 { 0%{background-position:0% center} 100%{background-position:200% center} }
      `}</style>

      {/* 글로우 배경 레이어 */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-15%", width: 600, height: 600, borderRadius: "50%", background: "rgba(88,28,235,0.2)", filter: "blur(180px)" }} />
        <div style={{ position: "absolute", bottom: "-25%", right: "-15%", width: 500, height: 500, borderRadius: "50%", background: "rgba(139,92,246,0.15)", filter: "blur(150px)" }} />
        <div style={{ position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)", width: 350, height: 350, borderRadius: "50%", background: "rgba(79,46,220,0.1)", filter: "blur(100px)" }} />
      </div>

      {/* 별 파티클 */}
      {[...Array(28)].map((_, i) => (
        <div key={i} style={{
          position: "fixed", zIndex: 0, pointerEvents: "none",
          left: `${(i * 37 + 5) % 100}%`,
          top: `${(i * 53 + 10) % 100}%`,
          width: i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
          height: i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
          borderRadius: "50%",
          background: i % 5 === 0 ? "#c4b5fd" : i % 3 === 0 ? "#818cf8" : "#fff",
          animation: `twinkleStar ${2.5 + (i % 3)}s ease-in-out infinite ${(i * 0.3) % 3}s`,
        }} />
      ))}

      <main className="relative z-10 max-w-lg mx-auto px-4 py-8">
        <BackButton />
        {/* 키치 히어로 헤더 */}
        <div className="text-center pt-6 pb-8 px-2">
          <FadeIn delay={0}>
            <div style={{ animation: "rotateSlow2 18s linear infinite", display: "inline-block", fontSize: 38, marginBottom: 12 }}>☯</div>
            <p className="text-xs font-black uppercase tracking-[0.25em] mb-3" style={{ color: "#a78bfa" }}>Summer Palace · 무료 만세력</p>
            <h1 className="text-3xl font-black leading-tight mb-4" style={{
              background: "linear-gradient(135deg, #e879f9, #a78bfa, #60a5fa, #e879f9)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundSize: "200% auto",
              animation: "heroText2 4s linear infinite",
              letterSpacing: "-0.03em",
            }}>
              나의 운명을<br />펼쳐드립니다
            </h1>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-sm font-bold mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>
              당신의 사주팔자, 완전 무료 해석
            </p>
            <p className="text-xs leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
              생년월일시·도시를 입력하면 사주 구조·필요 기운·일주론·신살·대운까지 한 번에 분석해 드립니다
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="flex flex-wrap justify-center gap-1.5">
              {["사주 구조·필요기운","60갑자 일주론","오행 건강","직업 적성","재물 위치","신살","대운 흐름","경도 보정"].map(t => (
                <span key={t} className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{
                  background: "rgba(139,92,246,0.18)", color: "#c4b5fd",
                  border: "1px solid rgba(139,92,246,0.35)",
                  boxShadow: "0 0 8px rgba(139,92,246,0.2)",
                }}>{t}</span>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* 폼 섹션 — 드라마틱 카드 */}
        <div className="rounded-3xl p-6" style={{
          background: "linear-gradient(160deg, rgba(88,28,235,0.15) 0%, rgba(30,10,80,0.35) 50%, rgba(0,0,20,0.6) 100%)",
          border: "1px solid rgba(139,92,246,0.3)",
          boxShadow: "0 0 60px rgba(88,28,235,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
        }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <BirthInputForm value={birthForm} onChange={setBirthForm} accent="#7c3aed" />

            <button type="submit"
              className="w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6366f1, #a855f7)",
                color: "#fff",
                animation: "pulseGlow2 2.5s ease-in-out infinite",
                letterSpacing: "0.02em",
              }}>
              내 사주 분석하기
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] py-6" style={{ color: "rgba(255,255,255,0.15)" }}>
          사주 이론 기반 오락용 콘텐츠
        </p>
      </main>
    </div>
  );
}
