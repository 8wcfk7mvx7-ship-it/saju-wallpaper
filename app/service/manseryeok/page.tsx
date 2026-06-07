"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import {
  analyzeSaju, calcDaewoon, getYearPillar, getSipseong, getUunseong,
  detectSamhapBanghap, analyzeSiksang, analyzeSipseongPatterns, detectChunganChung,
  SINGANG_RESPONSE_STYLE, HAP_CHUNG_CHARACTER, MYUNGRI_PHILOSOPHY,
  ILGAN_PERSONALITY, ILJU_60,
  OHAENG_HEALTH, OHAENG_CAREER,
  WEOLJI_PSYCHOLOGY, SINGANG_TRAITS,
  JAESEONG_POSITION_INSIGHT, analyzeJaeseongPosition,
  YANG_YIN_TENDENCY, OHAENG_CORE_WORRY, CHEONGAN_ELEMENT, JIJI_BONGI,
  JIJANGAN_DISPLAY,
  type SajuResult, type Element,
} from "@/lib/saju";

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
  const monthJj = pd.month.jj;
  const ilganInfo = ILGAN_PERSONALITY[ilgan];
  const iljuKey = ilgan + pd.day.jj;
  const iljuInfo = ILJU_60[iljuKey];
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

  const [showRaw, setShowRaw] = useState(false);
  const total = Object.values(result.scores).reduce((a, b) => a + b, 0);
  const samhapResults = detectSamhapBanghap(pd);
  const siksangInfo = analyzeSiksang(pd);
  const sipseongPatterns = analyzeSipseongPatterns(pd);
  const chunganChung = detectChunganChung(pd);
  const singangKey = result.yongshin.strength === "신강" ? "신강" : "신약";
  const singangStyle = SINGANG_RESPONSE_STYLE[singangKey];
  const hapCount = samhapResults.filter(s => s.type === "삼합" || s.type === "반합").length;
  const chungCount = (result.sinsalList || []).filter(s => s.name?.includes("충")).length;
  const hapChungChar = hapCount > chungCount ? HAP_CHUNG_CHARACTER.합 : chungCount > 0 ? HAP_CHUNG_CHARACTER.충 : null;

  return (
    <div className="space-y-5">
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

        <div className={`grid gap-1.5 ${pd.hour ? "grid-cols-4" : "grid-cols-3"}`}>
          {pillars.map(({ label, d }) => {
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

        {/* 궁성론 — 각 기둥 의미 */}
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-bold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>궁성론 (宮星論) — 각 기둥이 나타내는 영역</p>
          {(["년주","월주","일주","시주"] as const).filter((k) => k !== "시주" || !!pd.hour).map(label => {
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
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ② 격국 · 용신 */}
      {(() => {
        // 조후용신 계산
        const johuMap: Record<string, { yongshin: string; heeshin: string; desc: string }> = {
          사: { yongshin:"수", heeshin:"금", desc:"월지 사화(巳) → 조열(燥熱) → 조후용신: 수(水), 희신: 금(金)" },
          오: { yongshin:"수", heeshin:"금", desc:"월지 오화(午) → 조열(燥熱) → 조후용신: 수(Water), 희신: 금(金)" },
          미: { yongshin:"수", heeshin:"금", desc:"월지 미토(未) → 조열(燥熱) → 조후용신: 수(水), 희신: 금(金)" },
          해: { yongshin:"화", heeshin:"목", desc:"월지 해수(亥) → 한랭(寒冷) → 조후용신: 화(火), 희신: 목(木)" },
          자: { yongshin:"화", heeshin:"목", desc:"월지 자수(子) → 한랭(寒冷) → 조후용신: 화(Fire), 희신: 목(木)" },
          축: { yongshin:"화", heeshin:"목", desc:"월지 축토(丑) → 한랭(寒冷) → 조후용신: 화(火), 희신: 목(木)" },
          인: { yongshin:"화", heeshin:"토", desc:"월지 인목(寅) → 온난 → 희신: 화(火)" },
          묘: { yongshin:"화", heeshin:"토", desc:"월지 묘목(卯) → 온난 → 희신: 화(Fire)" },
          진: { yongshin:"화", heeshin:"토", desc:"월지 진토(辰) → 온난 → 희신: 화(火)" },
          신: { yongshin:"화", heeshin:"수", desc:"월지 신금(申) → 서늘 → 희신: 화(火), 기신: 토(土)" },
          유: { yongshin:"화", heeshin:"수", desc:"월지 유금(酉) → 서늘 → 희신: 화(Fire), 기신: 토(土)" },
          술: { yongshin:"화", heeshin:"수", desc:"월지 술토(戌) → 서늘 → 희신: 화(火), 기신: 토(土)" },
        };
        const johu = johuMap[monthJj];
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
                <p className="text-[10px] font-bold mb-1" style={{ color: jysDiff ? "#fbbf24" : "rgba(255,255,255,0.4)" }}>조후용신(調候用神)</p>
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
          <div className="mt-3 rounded-xl px-4 py-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: "#fbbf24" }}>핵심 내면 걱정</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{coreWorry}</p>
          </div>
        </Section>
      )}

      {/* ④ 60갑자 일주론 */}
      {iljuInfo && (
        <Section title={`일주론 (日柱論) · ${iljuKey}일주 · ${iljuInfo.image}`} accent="#fbbf24">
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
              { label: "연애 스타일", text: iljuInfo.love, color: "#f472b6" },
              { label: "적합 직업·커리어", text: iljuInfo.career, color: "#34d399" },
              { label: "주의할 점", text: iljuInfo.caution, color: "#f87171" },
            ].map(item => (
              <div key={item.label} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold mb-1" style={{ color: item.color }}>{item.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{item.text}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ④-b 외향성·내향성 분석 */}
      {(() => {
        const scores = result.scores;
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
        const pct = (el: keyof typeof scores) => Math.round((scores[el] / totalScore) * 100);
        let score = isYang ? 1 : -1;
        if (pct("화") >= 30) score += 1;
        if (pct("수") >= 30) score -= 1;
        if (pct("금") >= 30) score -= 1;
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
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>점수 {score > 0 ? "+" : ""}{score} / 3</span>
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
              {pct("화") >= 30 && (
                <div className="rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>화(火) 강세</span>
                  <span className="ml-2 font-bold" style={{ color: "#ef4444" }}>+1 외향</span>
                </div>
              )}
              {pct("수") >= 30 && (
                <div className="rounded-lg px-3 py-2" style={{ background: "rgba(148,163,184,0.05)", border: "1px solid rgba(148,163,184,0.15)" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>수(Water) 강세</span>
                  <span className="ml-2 font-bold" style={{ color: "#94a3b8" }}>-1 내향</span>
                </div>
              )}
              {pct("금") >= 30 && (
                <div className="rounded-lg px-3 py-2" style={{ background: "rgba(248,250,252,0.03)", border: "1px solid rgba(248,250,252,0.1)" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>금(金) 강세</span>
                  <span className="ml-2 font-bold" style={{ color: "#f8fafc" }}>-1 신중·내향</span>
                </div>
              )}
            </div>
          </Section>
        );
      })()}

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
          <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRaw}
              onChange={e => setShowRaw(e.target.checked)}
              className="w-3.5 h-3.5 accent-green-400"
            />
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>보정 전 점수 보기</span>
          </label>
          {showRaw && (
            <p className="text-[10px] mt-1.5 px-3 py-1.5 rounded-lg text-center" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", color: "rgba(255,255,255,0.45)" }}>
              현재 표시 점수는 <strong style={{ color: "#4ade80" }}>경도·합충 보정 포함</strong> 최종값입니다. 원본 입력(경도/합충 보정 없음) 기준 점수는 별도 저장되지 않습니다.
            </p>
          )}
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
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{result.personality}</p>
        {result.dominant.length > 0 && (
          <div className="mt-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] font-bold mb-1" style={{ color: "#4ade80" }}>보완 조언</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              용신 <strong style={{ color: EL_STYLE[result.yongshin.yongshin]?.text }}>{result.yongshin.yongshin}</strong> 기운을 일상에서 보강하세요.
              {result.lacking.length > 0 && ` ${result.lacking.join("·")} 기운이 부족하여 보완이 필요합니다.`}
            </p>
          </div>
        )}
      </Section>

      {/* 십성 구조 패턴: 무비겁·무재·쟁재 */}
      {sipseongPatterns.length > 0 && (
        <Section title="십성 구조 분석 — 무비겁·무재·쟁재·무관" accent="#fb923c">
          <div className="space-y-3">
            {sipseongPatterns.map(p => (
              <div key={p.name} className="rounded-xl px-4 py-3" style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.18)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c" }}>{p.name}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{p.hanja}</span>
                </div>
                <p className="text-sm leading-relaxed mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>{p.desc}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(251,146,60,0.8)" }}>{p.advice}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 신약·신강 대응 방식 */}
      {singangStyle && (
        <Section title={`${result.yongshin.strength} 사주 — 세상을 대하는 방식`} accent="#38bdf8">
          <div className="space-y-3">
            <div className="rounded-xl px-4 py-3" style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.18)" }}>
              <p className="text-xs font-bold mb-1" style={{ color: "#38bdf8" }}>핵심 기질</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{singangStyle.core}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "사회적 스타일", val: singangStyle.socialStyle },
                { label: "의사결정 방식", val: singangStyle.decisionStyle },
                { label: "주의할 점", val: singangStyle.caution },
              ].map(item => (
                <div key={item.label} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-[10px] font-bold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{item.val}</p>
                </div>
              ))}
            </div>
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

      {/* 천간충 건강 경고 */}
      {chunganChung.length > 0 && (
        <Section title="천간충(天干沖) — 건강 주의 신호" accent="#f87171">
          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            사주 천간 간 충이 발생하면 특정 신체 부위에 취약성이 나타납니다.
          </p>
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
        </Section>
      )}

      {/* 삼합 · 방합 */}
      {samhapResults.length > 0 && (
        <Section title="삼합(三合) · 방합(方合) — 사주의 에너지 방향" accent="#a78bfa">
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            삼합·방합은 지지 에너지가 응축된 구조. 성격·인생 방향의 강력한 기반이 됩니다.
          </p>
          <div className="space-y-4">
            {samhapResults.map(s => (
              <div key={s.name} className="rounded-xl p-4" style={{ background: `${s.color}0d`, border: `1px solid ${s.color}30` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: s.type === "삼합" ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)", color: s.type === "삼합" ? "#f87171" : "#818cf8" }}>{s.type}</span>
                  <span className="font-black text-sm text-white">{s.name}</span>
                  <span className="text-xs font-bold" style={{ color: s.color }}>{s.title}</span>
                </div>
                <p className="text-xs font-bold mb-2" style={{ color: s.color }}>{s.core}</p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>{s.detail}</p>
                <div className="grid grid-cols-1 gap-2">
                  {s.career && (
                    <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <p className="text-[10px] font-bold mb-1" style={{ color: "#34d399" }}>커리어 성향</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{s.career}</p>
                    </div>
                  )}
                  {(s.love || s.loveStyle) && (
                    <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <p className="text-[10px] font-bold mb-1" style={{ color: "#f472b6" }}>연애 스타일</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{s.loveStyle || s.love}</p>
                    </div>
                  )}
                  <div className="rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                    <p className="text-[10px] font-bold mb-1" style={{ color: "#f87171" }}>주의사항</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{s.caution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 식상(食傷) 분석 + 명리철학 */}
      <Section title="식상(食傷) 분석 · 에너지 발산 구조" accent="#f472b6">
        <div className={`rounded-xl px-4 py-3 mb-4 ${siksangInfo.hasSiksang ? "" : ""}`}
          style={{ background: siksangInfo.hasSiksang ? "rgba(52,211,153,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${siksangInfo.hasSiksang ? "rgba(52,211,153,0.2)" : "rgba(239,68,68,0.2)"}` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: siksangInfo.hasSiksang ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)", color: siksangInfo.hasSiksang ? "#34d399" : "#f87171" }}>
              {siksangInfo.hasSiksang ? "식상 있음" : "무식상(無食傷)"}
            </span>
            {siksangInfo.siksangList.length > 0 && (
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{siksangInfo.siksangList.join(" · ")}</span>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{siksangInfo.advice}</p>
        </div>
        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] font-bold mb-2" style={{ color: "#a78bfa" }}>명리학이 말하는 개인 맞춤 조언의 원칙</p>
          <p className="text-xs leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>{MYUNGRI_PHILOSOPHY.core}</p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{MYUNGRI_PHILOSOPHY.naturalLaw}</p>
        </div>
      </Section>

      {/* ⑦ 건강 분석 */}
      <Section title="오행 건강 분석" accent="#f87171">
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
        </div>
      </Section>

      {/* ⑧ 직업 적성 */}
      <Section title="직업 적성 · 커리어 분석" accent="#34d399">
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>지배 오행({domEl}) 기준 적성 분석</p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>{domCareer.strengths}</p>
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
      <Section title="재성(財星) 위치 · 재물 스타일" accent="#fbbf24">
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

      <ShareButton />

      {/* 면책 */}
      <p className="text-[10px] text-center pb-6" style={{ color: "rgba(255,255,255,0.2)" }}>
        본 서비스는 명리학 기반 참고용 엔터테인먼트 콘텐츠입니다.
      </p>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function ManseryeokPage() {
  const [birthForm, setBirthForm] = useState<BirthFormData>(defaultBirthData("female"));
  const [name, setName] = useState("");
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
      name: name || "사주",
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
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full animate-spin" style={{ border: "2px solid rgba(99,102,241,0.15)", borderTopColor: "#6366f1" }} />
          <div className="absolute inset-3 rounded-full animate-spin" style={{ border: "2px solid rgba(139,92,246,0.15)", borderTopColor: "#8b5cf6", animationDirection: "reverse", animationDuration: "0.8s" }} />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">☯</div>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg mb-2">사주 완전 분석 중...</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>격국·용신·일주론·신살·대운 계산 중</p>
        </div>
      </div>
    );
  }

  if (result && calcInput) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8">
        <ResultView
          result={result}
          form={{ name, gender: birthForm.gender, birthPlace: birthForm.city || "서울" }}
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
        {/* 키치 히어로 헤더 */}
        <div className="text-center pt-6 pb-8 px-2">
          <div style={{ animation: "rotateSlow2 18s linear infinite", display: "inline-block", fontSize: 38, marginBottom: 12 }}>☯</div>
          <p className="text-xs font-black uppercase tracking-[0.25em] mb-3" style={{ color: "#a78bfa" }}>Summer Palace · 무료 만세력</p>
          <h1 className="text-4xl font-black leading-tight mb-4" style={{
            background: "linear-gradient(135deg, #e879f9, #a78bfa, #60a5fa, #e879f9)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundSize: "200% auto",
            animation: "heroText2 4s linear infinite",
            letterSpacing: "-0.03em",
          }}>
            나의 운명을<br />펼쳐드립니다
          </h1>
          <p className="text-sm font-bold mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>
            ✨ 당신의 사주팔자, 완전 무료 해석 ✨
          </p>
          <p className="text-xs leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
            생년월일시·도시를 입력하면 격국·용신·일주론·신살·대운까지 한 번에 분석해 드립니다
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {["격국·용신","60갑자 일주론","오행 건강","직업 적성","재성 위치","신살","대운 흐름","경도 보정"].map(t => (
              <span key={t} className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{
                background: "rgba(139,92,246,0.18)", color: "#c4b5fd",
                border: "1px solid rgba(139,92,246,0.35)",
                boxShadow: "0 0 8px rgba(139,92,246,0.2)",
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* 폼 섹션 — 드라마틱 카드 */}
        <div className="rounded-3xl p-6" style={{
          background: "linear-gradient(160deg, rgba(88,28,235,0.15) 0%, rgba(30,10,80,0.35) 50%, rgba(0,0,20,0.6) 100%)",
          border: "1px solid rgba(139,92,246,0.3)",
          boxShadow: "0 0 60px rgba(88,28,235,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
        }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이름 */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#a78bfa" }}>이름 <span className="text-xs font-normal normal-case" style={{ color: "rgba(255,255,255,0.3)" }}>(선택)</span></label>
              <input type="text" placeholder="홍길동" value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none"
                style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.3)", animation: "inputGlow2 3s ease-in-out infinite", transition: "border-color 0.3s" }} />
            </div>

            <BirthInputForm value={birthForm} onChange={setBirthForm} accent="#7c3aed" />

            <button type="submit"
              className="w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6366f1, #a855f7)",
                color: "#fff",
                animation: "pulseGlow2 2.5s ease-in-out infinite",
                letterSpacing: "0.02em",
              }}>
              🔮 분석 시작
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] py-6" style={{ color: "rgba(255,255,255,0.15)" }}>
          사주 명리학 기반 참고용 엔터테인먼트 콘텐츠
        </p>
      </main>
    </div>
  );
}
