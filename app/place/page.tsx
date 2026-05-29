"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";

export const dynamic = "force-dynamic";

const PRICE = 990;

// ── 오행별 한국 도시 추천 DB ─────────────────────────────────────────────────
const KR_CITY_BY_ELEMENT: Record<string, {
  cities: { name: string; reason: string; emoji: string }[];
  avoid: string;
}> = {
  목: {
    cities: [
      { name: "강원 속초·양양", reason: "동해 파도와 울창한 숲. 목(木)의 상승 에너지가 충만합니다. 창의력과 성장 기운이 살아납니다.", emoji: "🌲" },
      { name: "전북 전주", reason: "전통문화와 역사가 살아있는 도시. 목의 인문학적 기운이 강합니다. 글쓰기·예술에 날개를 달아줍니다.", emoji: "📜" },
      { name: "경북 안동", reason: "유교 전통의 뿌리 깊은 도시. 목의 뿌리(根) 에너지로 자아를 다잡아 줍니다.", emoji: "🏯" },
    ],
    avoid: "목이 과다하면 금(金) 기운의 도시(인천·포항·창원)는 충돌을 일으킬 수 있습니다.",
  },
  화: {
    cities: [
      { name: "부산", reason: "열정적이고 역동적인 에너지의 도시. 화(火)의 불꽃 기운이 넘쳐 사업과 인간관계가 활발해집니다.", emoji: "🔥" },
      { name: "제주도", reason: "화산섬의 뜨거운 용암 에너지. 화의 변화와 창조 기운이 강합니다. 새로운 전환점을 만들고 싶을 때.", emoji: "🌋" },
      { name: "경남 통영·거제", reason: "남해의 풍요로운 햇빛과 바다. 화의 풍요 에너지가 재물운을 활성화합니다.", emoji: "☀️" },
    ],
    avoid: "화가 과다하면 수(水) 기운의 도시(강원 강릉·경기 여주)에서 오히려 충돌이 생길 수 있습니다.",
  },
  토: {
    cities: [
      { name: "충남 공주·부여", reason: "백제의 중심부. 토(土)의 중화·안정 에너지가 가득합니다. 정착과 가정 안정에 최적의 도시.", emoji: "🏔️" },
      { name: "경기 이천·여주", reason: "비옥한 토지와 황토 기운. 토의 재물과 식복 에너지가 강해 결혼·사업 안정에 좋습니다.", emoji: "🌾" },
      { name: "전남 순천·담양", reason: "대나무와 정원의 도시. 토의 균형과 포용 에너지가 인간관계를 풍요롭게 합니다.", emoji: "🎋" },
    ],
    avoid: "토가 과다하면 목(木) 기운의 도시(강원 원주·경북 안동)에서 충돌이 생길 수 있습니다.",
  },
  금: {
    cities: [
      { name: "인천", reason: "항구와 물류의 도시. 금(金)의 결단·실행 에너지가 넘칩니다. 무역·비즈니스에 최적의 기운.", emoji: "⚓" },
      { name: "경기 수원·성남", reason: "첨단 산업과 기술의 중심지. 금의 정밀·완벽 에너지가 직장과 커리어를 빛냅니다.", emoji: "⚙️" },
      { name: "경북 포항", reason: "철강 산업의 도시. 금의 강인한 에너지가 의지력과 추진력을 극대화합니다.", emoji: "🔩" },
    ],
    avoid: "금이 과다하면 화(火) 기운의 도시(부산·제주)에서 충돌이 생길 수 있습니다.",
  },
  수: {
    cities: [
      { name: "강원 강릉·동해", reason: "동해 바다와 청정 계곡. 수(水)의 지혜와 흐름 에너지가 직관력과 창의력을 높입니다.", emoji: "🌊" },
      { name: "전남 여수", reason: "밤바다와 해양 에너지. 수의 감성과 낭만 기운이 예술·감성 분야를 활성화합니다.", emoji: "🌙" },
      { name: "경기 가평·춘천", reason: "호수와 강의 도시. 수의 맑고 고요한 에너지가 명상·학업·집중력을 도와줍니다.", emoji: "🏞️" },
    ],
    avoid: "수가 과다하면 토(土) 기운의 도시(충남 공주·전남 순천)에서 오히려 넘치는 수를 제어할 수 있습니다.",
  },
};

// ── 오행별 해외 국가 추천 DB ─────────────────────────────────────────────────
const WORLD_BY_ELEMENT: Record<string, {
  countries: { name: string; flag: string; reason: string; cities: string }[];
}> = {
  목: {
    countries: [
      { name: "캐나다", flag: "🇨🇦", reason: "울창한 숲과 광대한 자연. 목(木)의 성장·자유 에너지가 넘쳐 이민·유학에 최적의 나라입니다.", cities: "밴쿠버, 빅토리아, 몬트리올" },
      { name: "뉴질랜드", flag: "🇳🇿", reason: "청정 자연과 초원. 목의 신선하고 창의적인 에너지가 넘칩니다. 워킹홀리데이·이민 운이 강한 곳.", cities: "오클랜드, 퀸스타운, 크라이스트처치" },
      { name: "독일", flag: "🇩🇪", reason: "깊이 있는 학문과 문화의 나라. 목의 인문학적 기운이 강해 유학·기술 연수에 탁월합니다.", cities: "베를린, 뮌헨, 함부르크" },
    ],
  },
  화: {
    countries: [
      { name: "스페인", flag: "🇪🇸", reason: "열정과 예술의 나라. 화(火)의 창의·표현 에너지가 넘쳐 예술·패션·음악에서 빛납니다.", cities: "바르셀로나, 마드리드, 세비야" },
      { name: "브라질", flag: "🇧🇷", reason: "삼바와 열대의 열정. 화의 풍요와 생명력 에너지가 사업과 인간관계를 폭발적으로 확장시킵니다.", cities: "상파울루, 리우데자네이루, 살바도르" },
      { name: "이탈리아", flag: "🇮🇹", reason: "미식·예술·패션의 나라. 화의 아름다움과 풍요 에너지가 감성과 창의력을 최고조로 끌어올립니다.", cities: "로마, 밀라노, 피렌체" },
    ],
  },
  토: {
    countries: [
      { name: "스위스", flag: "🇨🇭", reason: "안정과 중립의 나라. 토(土)의 균형·신뢰 에너지가 금융·의학·외교 분야에서 강점을 발휘합니다.", cities: "취리히, 제네바, 베른" },
      { name: "중국", flag: "🇨🇳", reason: "황하의 대지 에너지. 토의 중심·포용 에너지가 넘쳐 무역·제조업에서 큰 기회가 옵니다.", cities: "상하이, 베이징, 청두" },
      { name: "인도", flag: "🇮🇳", reason: "대지와 영성의 나라. 토의 깊이 있는 지혜와 철학 에너지. 명상·요가·IT 분야에서 빛납니다.", cities: "뭄바이, 델리, 벵갈루루" },
    ],
  },
  금: {
    countries: [
      { name: "미국", flag: "🇺🇸", reason: "금(金)의 결단·실행·성공 에너지의 나라. 비즈니스·기술·금융에서 최강의 기운을 발휘합니다.", cities: "뉴욕, 실리콘밸리, 시카고" },
      { name: "싱가포르", flag: "🇸🇬", reason: "아시아 금융의 중심. 금의 정밀·효율 에너지가 넘쳐 커리어와 재물운이 최고조로 올라갑니다.", cities: "싱가포르 시티 전역" },
      { name: "UAE(두바이)", flag: "🇦🇪", reason: "금과 사막의 부의 에너지. 금의 화려함과 재물 기운이 압도적입니다. 사업·투자에서 강한 운이 따릅니다.", cities: "두바이, 아부다비" },
    ],
  },
  수: {
    countries: [
      { name: "일본", flag: "🇯🇵", reason: "섬나라의 수(水) 에너지. 정교함과 감성의 나라. 수의 지혜·기술·예술 기운이 넘쳐 유학·비즈니스 운이 강합니다.", cities: "도쿄, 오사카, 교토" },
      { name: "네덜란드", flag: "🇳🇱", reason: "운하의 나라. 수의 유연하고 창의적인 에너지. 무역·디자인·기술 분야에서 최적의 환경입니다.", cities: "암스테르담, 로테르담, 헤이그" },
      { name: "노르웨이", flag: "🇳🇴", reason: "피오르와 북극의 물 에너지. 수의 깊은 지혜와 탐구 에너지. 학문·연구·자연 관련 분야에서 빛납니다.", cities: "오슬로, 베르겐, 트론헤임" },
    ],
  },
};

// ── 용신 기반 방위 추천 ──────────────────────────────────────────────────────
const DIRECTION_BY_ELEMENT: Record<string, { dirs: string[]; desc: string }> = {
  목: { dirs: ["동쪽", "동남쪽"], desc: "태양이 뜨는 동쪽 방향. 목의 기운이 넘치는 방향으로 거주지나 사무실을 잡으면 성장 에너지가 강해집니다." },
  화: { dirs: ["남쪽", "동남쪽"], desc: "태양이 가장 높이 뜨는 남쪽. 화의 열정과 성공 에너지가 가장 강한 방향입니다." },
  토: { dirs: ["중앙", "남서쪽"], desc: "땅의 중심. 토의 안정과 포용 에너지가 강한 방향. 중심지·번화가에 거주하면 기운이 강해집니다." },
  금: { dirs: ["서쪽", "북서쪽"], desc: "해가 지는 서쪽. 금의 결단과 완성 에너지가 강한 방향. 서울 서쪽·경기 서부가 유리합니다." },
  수: { dirs: ["북쪽", "북동쪽"], desc: "겨울의 방향. 수의 지혜와 저장 에너지가 강한 방향. 고요하고 깊이 있는 환경이 맞습니다." },
};

export default function PlacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dominant, setDominant] = useState<string[]>([]);
  const [lacking, setLacking] = useState<string[]>([]);
  const [yongshinEl, setYongshinEl] = useState<string>("토");
  const [hasSaju, setHasSaju] = useState(false);
  const [step, setStep] = useState<"entry" | "free-preview">("entry");
  const [selectedEl, setSelectedEl] = useState<string>("");

  useEffect(() => {
    const saved = loadSajuData();
    if (saved) {
      setHasSaju(true);
      setName(saved.name || "");
      try {
        const r = analyzeSaju({
          birthYear: saved.birthYear, birthMonth: saved.birthMonth, birthDay: saved.birthDay,
          birthHour: saved.birthHour ?? null, birthMinute: saved.birthMinute ?? null,
          name: saved.name || "", gender: saved.gender || "female",
          birthPlace: saved.birthPlace || "서울",
          style: "auto", productType: "report", useJajasi: false,
        });
        setDominant(r.dominant);
        setLacking(r.lacking);
        setYongshinEl(r.yongshin.yongshin);
        setSelectedEl(r.yongshin.yongshin || r.lacking[0] || "토");
        setStep("free-preview");
      } catch {}
    }
  }, []);

  const displayEl = selectedEl || yongshinEl || "토";
  const krData = KR_CITY_BY_ELEMENT[displayEl];
  const worldData = WORLD_BY_ELEMENT[displayEl];
  const dirData = DIRECTION_BY_ELEMENT[displayEl];

  const ELEMENT_LABELS: Record<string, { color: string; emoji: string; label: string }> = {
    목: { color: "#4ade80", emoji: "🌿", label: "목(木)" },
    화: { color: "#f87171", emoji: "🔥", label: "화(火)" },
    토: { color: "#fbbf24", emoji: "🏔️", label: "토(土)" },
    금: { color: "#a5b4fc", emoji: "⚔️", label: "금(金)" },
    수: { color: "#60a5fa", emoji: "🌊", label: "수(水)" },
  };

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <div className="max-w-lg mx-auto px-5 py-10 pb-28">
        <button onClick={() => router.back()} className="text-xs text-gray-600 hover:text-gray-400 mb-6 inline-flex items-center gap-1 transition">← 뒤로</button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-3">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Summer Palace</span>
          </div>
          <h1 className="text-2xl font-black mb-2">내 사주에 맞는 도시</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            용신 오행으로 찾는 한국 도시 · 해외 국가<br />
            내 기운을 살려주는 곳이 따로 있습니다
          </p>
        </div>

        {/* 오행 선택 (사주 없을 때 또는 직접 선택) */}
        {(!hasSaju || step === "entry") && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-6">
            <p className="text-sm font-semibold text-gray-300 mb-3">용신 오행을 선택하세요</p>
            <div className="grid grid-cols-5 gap-2">
              {(["목","화","토","금","수"] as const).map(el => {
                const e = ELEMENT_LABELS[el];
                return (
                  <button
                    key={el}
                    onClick={() => { setSelectedEl(el); setStep("free-preview"); }}
                    className={`py-3 rounded-xl text-center transition-all border ${
                      selectedEl === el ? "border-white/40 bg-white/10" : "border-white/10 bg-white/3 hover:bg-white/8"
                    }`}
                  >
                    <p className="text-lg">{e.emoji}</p>
                    <p className="text-xs mt-1 font-bold" style={{ color: e.color }}>{e.label}</p>
                  </button>
                );
              })}
            </div>
            {hasSaju && (
              <p className="text-xs text-gray-600 mt-3 text-center">
                사주 분석 결과: 용신 <strong className="text-white">{ELEMENT_LABELS[yongshinEl]?.label}</strong> / 부족 <strong className="text-white">{lacking.map(l => ELEMENT_LABELS[l]?.label).join("·")}</strong>
              </p>
            )}
          </div>
        )}

        {step === "free-preview" && krData && (
          <>
            {/* 선택된 오행 배너 */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{ELEMENT_LABELS[displayEl]?.emoji}</span>
              <div>
                <p className="text-xs text-gray-500">
                  {hasSaju && name ? `${name}님 용신 ` : ""}기준 오행
                </p>
                <p className="text-lg font-black" style={{ color: ELEMENT_LABELS[displayEl]?.color }}>
                  {ELEMENT_LABELS[displayEl]?.label} 기운을 보강하는 곳
                </p>
              </div>
              <button
                onClick={() => setStep("entry")}
                className="ml-auto text-xs text-gray-600 hover:text-gray-400 transition"
              >
                다시 선택
              </button>
            </div>

            {/* 방위 */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-5">
              <p className="text-xs text-gray-500 font-semibold mb-2">🧭 유리한 방위</p>
              <div className="flex gap-2 mb-2">
                {dirData.dirs.map(d => (
                  <span key={d} className="text-sm font-bold px-3 py-1 rounded-full bg-white/10 text-white">{d}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{dirData.desc}</p>
            </div>

            {/* 한국 도시 */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-300 mb-3">🇰🇷 추천 한국 도시</h2>
              <div className="space-y-3">
                {krData.cities.map((city, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{city.emoji}</span>
                      <span className="font-bold text-white">{city.name}</span>
                      {i === 0 && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold ml-auto">1순위</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{city.reason}</p>
                  </div>
                ))}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    ⚠️ {krData.avoid}
                  </p>
                </div>
              </div>
            </div>

            {/* 해외 국가 — 일부 블러 처리 (1순위만 무료) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-300">🌍 추천 해외 국가</h2>
                <span className="text-xs text-gray-600">1순위 무료 공개</span>
              </div>
              <div className="space-y-3">
                {worldData.countries.map((country, i) => {
                  const isBlurred = i >= 1 && sessionStorage.getItem("placePaid") !== "true";
                  return (
                    <div
                      key={i}
                      className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 relative overflow-hidden"
                    >
                      {isBlurred && (
                        <div className="absolute inset-0 bg-[#06060e]/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
                          <p className="text-xs text-gray-500">🔒 2·3순위 국가</p>
                          <p className="text-[10px] text-gray-600 mt-1">₩{PRICE.toLocaleString()}에 전체 공개</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{country.flag}</span>
                        <span className="font-bold text-white">{country.name}</span>
                        {i === 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold ml-auto">1순위</span>}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed mb-2">{country.reason}</p>
                      <p className="text-[11px] text-gray-600">추천 도시: {country.cities}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 다른 오행으로 보기 */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-3">다른 오행으로 보기</p>
              <div className="flex flex-wrap gap-2">
                {(["목","화","토","금","수"] as const).filter(el => el !== displayEl).map(el => {
                  const e = ELEMENT_LABELS[el];
                  return (
                    <button
                      key={el}
                      onClick={() => setSelectedEl(el)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition border border-white/10"
                      style={{ color: e.color }}
                    >
                      {e.emoji} {e.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* 프리미엄 CTA */}
        {step === "free-preview" && sessionStorage.getItem("placePaid") !== "true" && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#06060e] via-[#06060e]/95 to-transparent">
            <div className="max-w-lg mx-auto">
              <button
                onClick={() => {
                  const orderId = `place-${Date.now()}`;
                  sessionStorage.setItem("placeEl", displayEl);
                  router.push(`/place/pay?orderId=${orderId}&amount=${PRICE}&el=${displayEl}`);
                }}
                className="w-full py-4 rounded-2xl font-black text-white text-base shadow-xl hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                전체 공개 (해외 2·3순위 + PDF) — ₩{PRICE.toLocaleString()}
              </button>
              <p className="text-center text-xs text-gray-600 mt-2">5개 오행 전체 추천 도시 + 방위 완전 분석</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
