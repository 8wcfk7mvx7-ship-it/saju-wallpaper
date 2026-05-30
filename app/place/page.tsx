"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";

export const dynamic = "force-dynamic";

const PRICE = 990;

const KR_CITY_BY_ELEMENT: Record<string, {
  cities: { name: string; reason: string; emoji: string; neighborhoods: string; food: string }[];
  avoid: string;
}> = {
  목: {
    cities: [
      { name: "강원 속초·양양", reason: "동해 파도와 울창한 숲. 목(木)의 상승 에너지가 충만합니다. 창의력과 성장 기운이 살아납니다.", emoji: "🌲", neighborhoods: "속초 중앙시장, 양양 서퍼비치", food: "물회, 오징어, 감자전" },
      { name: "전북 전주", reason: "전통문화와 역사가 살아있는 도시. 목의 인문학적 기운이 강합니다. 글쓰기·예술에 날개를 달아줍니다.", emoji: "📜", neighborhoods: "한옥마을, 객리단길", food: "비빔밥, 콩나물국밥, 막걸리" },
      { name: "경북 안동", reason: "유교 전통의 뿌리 깊은 도시. 목의 뿌리(根) 에너지로 자아를 다잡아 줍니다.", emoji: "🏯", neighborhoods: "하회마을, 구시장", food: "찜닭, 안동소주, 헛제삿밥" },
    ],
    avoid: "목이 과다하면 금(金) 기운의 도시(인천·포항·창원)는 충돌을 일으킬 수 있습니다.",
  },
  화: {
    cities: [
      { name: "부산", reason: "열정적이고 역동적인 에너지의 도시. 화(火)의 불꽃 기운이 넘쳐 사업과 인간관계가 활발해집니다.", emoji: "🔥", neighborhoods: "해운대, 광안리, 부평깡통시장", food: "돼지국밥, 밀면, 씨앗호떡" },
      { name: "제주도", reason: "화산섬의 뜨거운 용암 에너지. 화의 변화와 창조 기운이 강합니다. 새로운 전환점을 만들고 싶을 때.", emoji: "🌋", neighborhoods: "애월, 협재, 성산일출봉", food: "흑돼지, 옥돔, 한라봉" },
      { name: "경남 통영·거제", reason: "남해의 풍요로운 햇빛과 바다. 화의 풍요 에너지가 재물운을 활성화합니다.", emoji: "☀️", neighborhoods: "통영항, 한려수도", food: "굴, 도다리쑥국, 충무김밥" },
    ],
    avoid: "화가 과다하면 수(水) 기운의 도시(강원 강릉·경기 여주)에서 오히려 충돌이 생길 수 있습니다.",
  },
  토: {
    cities: [
      { name: "충남 공주·부여", reason: "백제의 중심부. 토(土)의 중화·안정 에너지가 가득합니다. 정착과 가정 안정에 최적의 도시.", emoji: "🏔️", neighborhoods: "공주 공산성, 부여 정림사지", food: "밤, 쌈밥, 연잎밥" },
      { name: "경기 이천·여주", reason: "비옥한 토지와 황토 기운. 토의 재물과 식복 에너지가 강해 결혼·사업 안정에 좋습니다.", emoji: "🌾", neighborhoods: "도예촌, 여주 한강변", food: "이천쌀밥, 도자기 체험" },
      { name: "전남 순천·담양", reason: "대나무와 정원의 도시. 토의 균형과 포용 에너지가 인간관계를 풍요롭게 합니다.", emoji: "🎋", neighborhoods: "순천만 국가정원, 죽녹원", food: "대통밥, 떡갈비, 국밥" },
    ],
    avoid: "토가 과다하면 목(木) 기운의 도시(강원 원주·경북 안동)에서 충돌이 생길 수 있습니다.",
  },
  금: {
    cities: [
      { name: "인천", reason: "항구와 물류의 도시. 금(金)의 결단·실행 에너지가 넘칩니다. 무역·비즈니스에 최적의 기운.", emoji: "⚓", neighborhoods: "송도, 차이나타운, 개항장", food: "쫄면, 닭강정, 짜장면" },
      { name: "경기 수원·성남", reason: "첨단 산업과 기술의 중심지. 금의 정밀·완벽 에너지가 직장과 커리어를 빛냅니다.", emoji: "⚙️", neighborhoods: "수원화성, 판교 테크노밸리", food: "왕갈비, 통닭, 수원 순대" },
      { name: "경북 포항", reason: "철강 산업의 도시. 금의 강인한 에너지가 의지력과 추진력을 극대화합니다.", emoji: "🔩", neighborhoods: "포스코 일대, 죽도시장", food: "물회, 과메기, 구룡포 대게" },
    ],
    avoid: "금이 과다하면 화(火) 기운의 도시(부산·제주)에서 충돌이 생길 수 있습니다.",
  },
  수: {
    cities: [
      { name: "강원 강릉·동해", reason: "동해 바다와 청정 계곡. 수(水)의 지혜와 흐름 에너지가 직관력과 창의력을 높입니다.", emoji: "🌊", neighborhoods: "안목해변, 정동진, 경포대", food: "초당 순두부, 막국수, 황태" },
      { name: "전남 여수", reason: "밤바다와 해양 에너지. 수의 감성과 낭만 기운이 예술·감성 분야를 활성화합니다.", emoji: "🌙", neighborhoods: "여수 밤바다, 돌산도", food: "갓김치, 게장, 돌산갓" },
      { name: "경기 가평·춘천", reason: "호수와 강의 도시. 수의 맑고 고요한 에너지가 명상·학업·집중력을 도와줍니다.", emoji: "🏞️", neighborhoods: "남이섬, 제이드가든", food: "닭갈비, 막국수, 옥수수" },
    ],
    avoid: "수가 과다하면 토(土) 기운의 도시(충남 공주·전남 순천)에서 오히려 넘치는 수를 제어할 수 있습니다.",
  },
};

const WORLD_BY_ELEMENT: Record<string, {
  countries: { name: string; flag: string; reason: string; cities: string; vibe: string }[];
}> = {
  목: {
    countries: [
      { name: "캐나다", flag: "🇨🇦", reason: "울창한 숲과 광대한 자연. 목(木)의 성장·자유 에너지가 넘쳐 이민·유학에 최적의 나라입니다.", cities: "밴쿠버, 빅토리아, 몬트리올", vibe: "자연·자유·다문화" },
      { name: "뉴질랜드", flag: "🇳🇿", reason: "청정 자연과 초원. 목의 신선하고 창의적인 에너지가 넘칩니다. 워킹홀리데이·이민 운이 강한 곳.", cities: "오클랜드, 퀸스타운, 크라이스트처치", vibe: "모험·청정·성장" },
      { name: "독일", flag: "🇩🇪", reason: "깊이 있는 학문과 문화의 나라. 목의 인문학적 기운이 강해 유학·기술 연수에 탁월합니다.", cities: "베를린, 뮌헨, 함부르크", vibe: "기술·학문·질서" },
    ],
  },
  화: {
    countries: [
      { name: "스페인", flag: "🇪🇸", reason: "열정과 예술의 나라. 화(火)의 창의·표현 에너지가 넘쳐 예술·패션·음악에서 빛납니다.", cities: "바르셀로나, 마드리드, 세비야", vibe: "열정·예술·축제" },
      { name: "브라질", flag: "🇧🇷", reason: "삼바와 열대의 열정. 화의 풍요와 생명력 에너지가 사업과 인간관계를 폭발적으로 확장시킵니다.", cities: "상파울루, 리우데자네이루", vibe: "에너지·사업·인맥" },
      { name: "이탈리아", flag: "🇮🇹", reason: "미식·예술·패션의 나라. 화의 아름다움과 풍요 에너지가 감성과 창의력을 최고조로 끌어올립니다.", cities: "로마, 밀라노, 피렌체", vibe: "예술·미식·감성" },
    ],
  },
  토: {
    countries: [
      { name: "스위스", flag: "🇨🇭", reason: "안정과 중립의 나라. 토(土)의 균형·신뢰 에너지가 금융·의학·외교 분야에서 강점을 발휘합니다.", cities: "취리히, 제네바, 베른", vibe: "안정·신뢰·고품격" },
      { name: "중국", flag: "🇨🇳", reason: "황하의 대지 에너지. 토의 중심·포용 에너지가 넘쳐 무역·제조업에서 큰 기회가 옵니다.", cities: "상하이, 베이징, 청두", vibe: "무역·기회·역동성" },
      { name: "인도", flag: "🇮🇳", reason: "대지와 영성의 나라. 토의 깊이 있는 지혜와 철학 에너지. 명상·요가·IT 분야에서 빛납니다.", cities: "뭄바이, 델리, 벵갈루루", vibe: "영성·IT·철학" },
    ],
  },
  금: {
    countries: [
      { name: "미국", flag: "🇺🇸", reason: "금(金)의 결단·실행·성공 에너지의 나라. 비즈니스·기술·금융에서 최강의 기운을 발휘합니다.", cities: "뉴욕, 실리콘밸리, 시카고", vibe: "성공·도전·스케일" },
      { name: "싱가포르", flag: "🇸🇬", reason: "아시아 금융의 중심. 금의 정밀·효율 에너지가 넘쳐 커리어와 재물운이 최고조로 올라갑니다.", cities: "싱가포르 시티 전역", vibe: "금융·효율·청결" },
      { name: "UAE(두바이)", flag: "🇦🇪", reason: "금과 사막의 부의 에너지. 금의 화려함과 재물 기운이 압도적입니다. 사업·투자에서 강한 운이 따릅니다.", cities: "두바이, 아부다비", vibe: "부·투자·화려함" },
    ],
  },
  수: {
    countries: [
      { name: "일본", flag: "🇯🇵", reason: "섬나라의 수(水) 에너지. 정교함과 감성의 나라. 수의 지혜·기술·예술 기운이 넘쳐 유학·비즈니스 운이 강합니다.", cities: "도쿄, 오사카, 교토", vibe: "감성·정교함·기술" },
      { name: "네덜란드", flag: "🇳🇱", reason: "운하의 나라. 수의 유연하고 창의적인 에너지. 무역·디자인·기술 분야에서 최적의 환경입니다.", cities: "암스테르담, 로테르담, 헤이그", vibe: "자유·디자인·무역" },
      { name: "노르웨이", flag: "🇳🇴", reason: "피오르와 북극의 물 에너지. 수의 깊은 지혜와 탐구 에너지. 학문·연구·자연 관련 분야에서 빛납니다.", cities: "오슬로, 베르겐, 트론헤임", vibe: "탐구·자연·지혜" },
    ],
  },
};

const DIRECTION_BY_ELEMENT: Record<string, { dirs: string[]; desc: string; room: string }> = {
  목: { dirs: ["동쪽", "동남쪽"], desc: "태양이 뜨는 동쪽 방향. 목의 기운이 넘치는 방향으로 거주지나 사무실을 잡으면 성장 에너지가 강해집니다.", room: "침대 머리를 동쪽으로, 책상을 동향으로 배치하세요." },
  화: { dirs: ["남쪽", "동남쪽"], desc: "태양이 가장 높이 뜨는 남쪽. 화의 열정과 성공 에너지가 가장 강한 방향입니다.", room: "거실 소파를 남향으로, 주방을 남쪽에 배치하면 좋습니다." },
  토: { dirs: ["중앙", "남서쪽"], desc: "땅의 중심. 토의 안정과 포용 에너지가 강한 방향. 중심지·번화가에 거주하면 기운이 강해집니다.", room: "집 중앙에 화분이나 황토 소품을 두면 좋습니다." },
  금: { dirs: ["서쪽", "북서쪽"], desc: "해가 지는 서쪽. 금의 결단과 완성 에너지가 강한 방향. 서울 서쪽·경기 서부가 유리합니다.", room: "서재를 서쪽에 배치하고 흰색·금색 소품을 활용하세요." },
  수: { dirs: ["북쪽", "북동쪽"], desc: "겨울의 방향. 수의 지혜와 저장 에너지가 강한 방향. 고요하고 깊이 있는 환경이 맞습니다.", room: "침실을 북쪽에 배치하고 파란색·검은색 계열 인테리어를 활용하세요." },
};

const ELEMENT_LABELS: Record<string, { color: string; emoji: string; label: string; keyword: string }> = {
  목: { color: "#4ade80", emoji: "🌿", label: "목(木)", keyword: "성장·창의·인문" },
  화: { color: "#f87171", emoji: "🔥", label: "화(火)", keyword: "열정·표현·변화" },
  토: { color: "#fbbf24", emoji: "🏔️", label: "토(土)", keyword: "안정·포용·신뢰" },
  금: { color: "#a5b4fc", emoji: "⚔️", label: "금(金)", keyword: "결단·분석·완벽" },
  수: { color: "#60a5fa", emoji: "🌊", label: "수(水)", keyword: "지혜·직관·적응" },
};

const FEATURES = [
  { icon: "🇰🇷", title: "한국 추천 도시 3곳", desc: "용신 오행별 국내 최적 거주지 — 동네·먹거리·에너지까지" },
  { icon: "🌍", title: "해외 추천 국가 3곳", desc: "이민·유학·취업에 유리한 나라 (1순위 무료 공개)" },
  { icon: "🧭", title: "유리한 방위", desc: "침실·책상·소파 배치까지 — 공간 에너지 최적화" },
  { icon: "⚠️", title: "피해야 할 도시", desc: "내 기운을 꺾는 도시를 피하는 것만으로도 운이 달라집니다" },
];

export default function PlacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dominant, setDominant] = useState<string[]>([]);
  const [lacking, setLacking] = useState<string[]>([]);
  const [yongshinEl, setYongshinEl] = useState<string>("토");
  const [hasSaju, setHasSaju] = useState(false);
  const [step, setStep] = useState<"splash" | "entry" | "free-preview">("splash");
  const [selectedEl, setSelectedEl] = useState<string>("");
  const [counter] = useState(() => Math.floor(Math.random() * 120) + 87);
  const [totalCount] = useState(() => Math.floor(Math.random() * 5000) + 18000);

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
        // splash 단계 유지 — 사용자가 CTA 클릭 후 이동
      } catch {}
    }
  }, []);

  const displayEl = selectedEl || yongshinEl || "토";
  const krData = KR_CITY_BY_ELEMENT[displayEl];
  const worldData = WORLD_BY_ELEMENT[displayEl];
  const dirData = DIRECTION_BY_ELEMENT[displayEl];

  return (
    <main className="min-h-screen bg-[#06060e] text-white">

      {/* ══ SPLASH ══ */}
      {step === "splash" && (
        <div className="min-h-screen relative overflow-hidden">
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-900/20 blur-[150px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[450px] h-[450px] rounded-full bg-violet-900/20 blur-[130px]" />
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-green-900/10 blur-[100px]" />
          </div>

          <div className="relative z-10">
            <div className="pt-5 px-5">
              <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 여름궁전</button>
            </div>

            <div className="max-w-md mx-auto px-6 pt-12 pb-28 text-center">
              {/* 실시간 뱃지 */}
              <div className="flex flex-col items-center gap-2 mb-8">
                <div className="inline-flex items-center gap-2 bg-amber-500/12 border border-amber-500/28 rounded-full px-4 py-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                  <span className="text-amber-200 text-sm font-semibold">
                    지금 <strong className="text-white">{counter.toLocaleString()}명</strong>이 확인 중
                  </span>
                </div>
                <span className="text-xs text-white/25">누적 <strong className="text-white/40">{totalCount.toLocaleString()}명</strong> 분석 완료</span>
              </div>

              {/* 헤드라인 */}
              <h1 className="text-3xl font-black leading-tight mb-5 tracking-tight">
                지금 살고 있는 도시가<br />
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-green-300 bg-clip-text text-transparent">
                  내 사주와 맞지 않으면
                </span><br />
                아무리 노력해도 안 풀립니다
              </h1>

              {/* FOMO 서브타이틀 */}
              <div className="bg-red-500/8 border border-red-500/20 rounded-2xl px-5 py-4 mb-7">
                <p className="text-sm text-red-200/80 leading-relaxed">
                  ⚠️ 이사 한 번으로 운이 바뀌는 사람들이 있습니다.<br />
                  <strong className="text-red-100">운이 안 풀리는 진짜 이유가 도시에 있을 수 있습니다.</strong>
                </p>
              </div>

              {/* 피처 카드 */}
              <div className="bg-white/[0.04] border border-white/8 rounded-2xl p-1 mb-7 text-left">
                {FEATURES.map((f, i) => (
                  <div key={i} className={`flex items-start gap-4 px-4 py-3.5 ${i < FEATURES.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                    <span className="text-2xl shrink-0 mt-0.5">{f.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{f.title}</p>
                      <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 오행 미리보기 */}
              <div className="flex justify-center gap-2 mb-7">
                {(["목","화","토","금","수"] as const).map(el => {
                  const e = ELEMENT_LABELS[el];
                  return (
                    <div key={el} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${e.color}18`, border: `1px solid ${e.color}33` }}>
                        {e.emoji}
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: e.color }}>{el}</span>
                    </div>
                  );
                })}
              </div>

              {/* 통계 */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { val: "5개", label: "오행 분석" },
                  { val: "30+", label: "추천 도시" },
                  { val: "무료", label: "1순위 공개" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-black text-white">{s.val}</p>
                    <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => setStep(hasSaju ? "free-preview" : "entry")}
                className="w-full py-5 rounded-2xl text-white font-black text-lg mb-3 transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #d97706, #ca8a04, #16a34a)", boxShadow: "0 8px 40px rgba(202,138,4,0.4)" }}
              >
                🗺️ {hasSaju ? `${name ? name + "님의 " : ""}운명의 도시 찾기` : "내 운명의 도시 찾기"}
              </button>
              <p className="text-xs text-white/20">가입 없음 · 광고 없음 · 1순위 무료</p>
            </div>
          </div>

          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
      )}

      {/* ══ ENTRY + FREE-PREVIEW ══ */}
      {step !== "splash" && (
        <div className="max-w-lg mx-auto px-5 py-10 pb-28">
          <button onClick={() => setStep("splash")} className="text-xs text-gray-600 hover:text-gray-400 mb-6 inline-flex items-center gap-1 transition">← 뒤로</button>

          {/* 오행 선택 */}
          {(!hasSaju || step === "entry") && (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-6">
              <p className="text-sm font-bold text-white mb-1">용신 오행을 선택하세요</p>
              <p className="text-xs text-white/35 mb-4">사주를 분석한 적 있다면 용신 오행을 선택하세요</p>
              <div className="grid grid-cols-5 gap-2">
                {(["목","화","토","금","수"] as const).map(el => {
                  const e = ELEMENT_LABELS[el];
                  return (
                    <button key={el} onClick={() => { setSelectedEl(el); setStep("free-preview"); }}
                      className={`py-3 rounded-xl text-center transition-all border ${selectedEl === el ? "border-white/40 bg-white/10" : "border-white/10 bg-white/[0.03] hover:bg-white/8"}`}>
                      <p className="text-xl">{e.emoji}</p>
                      <p className="text-xs mt-1 font-bold" style={{ color: e.color }}>{el}</p>
                      <p className="text-[9px] text-white/30 mt-0.5">{e.keyword.split("·")[0]}</p>
                    </button>
                  );
                })}
              </div>
              {hasSaju && (
                <p className="text-xs text-white/30 mt-3 text-center">
                  사주 분석 결과: 용신 <strong className="text-white/60">{ELEMENT_LABELS[yongshinEl]?.label}</strong> / 부족 <strong className="text-white/60">{lacking.map(l => ELEMENT_LABELS[l]?.label).join("·")}</strong>
                </p>
              )}
            </div>
          )}

          {step === "free-preview" && krData && (
            <>
              {/* 선택 배너 */}
              <div className="flex items-center gap-3 mb-5 p-4 rounded-2xl" style={{ background: `${ELEMENT_LABELS[displayEl]?.color}10`, border: `1px solid ${ELEMENT_LABELS[displayEl]?.color}30` }}>
                <span className="text-3xl">{ELEMENT_LABELS[displayEl]?.emoji}</span>
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-0.5">
                    {hasSaju && name ? `${name}님 용신 기준` : "선택된 오행"}
                  </p>
                  <p className="text-base font-black" style={{ color: ELEMENT_LABELS[displayEl]?.color }}>
                    {ELEMENT_LABELS[displayEl]?.label} 기운을 보강하는 곳
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">{ELEMENT_LABELS[displayEl]?.keyword}</p>
                </div>
                <button onClick={() => setStep("entry")} className="text-xs text-white/30 hover:text-white/60 transition">다시 선택</button>
              </div>

              {/* 방위 */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
                <p className="text-xs text-white/40 font-bold mb-3 uppercase tracking-wider">🧭 유리한 방위</p>
                <div className="flex gap-2 mb-3">
                  {dirData.dirs.map(d => (
                    <span key={d} className="text-sm font-black px-4 py-1.5 rounded-full bg-white/10 text-white">{d}</span>
                  ))}
                </div>
                <p className="text-xs text-white/45 leading-relaxed mb-2">{dirData.desc}</p>
                <div className="bg-white/5 rounded-xl px-3 py-2">
                  <p className="text-xs text-white/35 leading-relaxed">💡 {dirData.room}</p>
                </div>
              </div>

              {/* 한국 도시 */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
                  🇰🇷 추천 한국 도시
                  <span className="text-xs font-normal text-white/25">동네·먹거리까지</span>
                </h2>
                <div className="space-y-3">
                  {krData.cities.map((city, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{city.emoji}</span>
                        <span className="font-black text-white">{city.name}</span>
                        {i === 0 && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold ml-auto">1순위</span>}
                        {i === 1 && <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full font-bold ml-auto">2순위</span>}
                        {i === 2 && <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full font-bold ml-auto">3순위</span>}
                      </div>
                      <p className="text-xs text-white/45 leading-relaxed mb-3">{city.reason}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-white/30 mb-0.5">📍 동네</p>
                          <p className="text-xs text-white/60">{city.neighborhoods}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-white/30 mb-0.5">🍽️ 먹거리</p>
                          <p className="text-xs text-white/60">{city.food}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-amber-500/8 border border-amber-500/18 rounded-xl px-4 py-3">
                    <p className="text-xs text-amber-300/70 leading-relaxed">⚠️ {krData.avoid}</p>
                  </div>
                </div>
              </div>

              {/* 해외 국가 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white/70">🌍 추천 해외 국가</h2>
                  <span className="text-xs text-white/25">1순위 무료 공개</span>
                </div>
                <div className="space-y-3">
                  {worldData.countries.map((country, i) => {
                    const isBlurred = i >= 1;
                    return (
                      <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 relative overflow-hidden">
                        {isBlurred && (
                          <div className="absolute inset-0 bg-[#06060e]/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
                            <p className="text-2xl mb-2">🔒</p>
                            <p className="text-xs text-white/40 font-bold">{i + 1}순위 국가</p>
                            <p className="text-[10px] text-white/25 mt-1">₩{PRICE.toLocaleString()}에 전체 공개</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-3xl">{country.flag}</span>
                          <div>
                            <span className="font-black text-white">{country.name}</span>
                            <p className="text-[10px] text-white/30 mt-0.5">{country.vibe}</p>
                          </div>
                          {i === 0 && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold ml-auto">1순위</span>}
                        </div>
                        <p className="text-xs text-white/45 leading-relaxed mb-2">{country.reason}</p>
                        <p className="text-[11px] text-white/25">추천 도시: {country.cities}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 다른 오행 보기 */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-xs text-white/30 mb-3">다른 오행으로 보기</p>
                <div className="flex flex-wrap gap-2">
                  {(["목","화","토","금","수"] as const).filter(el => el !== displayEl).map(el => {
                    const e = ELEMENT_LABELS[el];
                    return (
                      <button key={el} onClick={() => setSelectedEl(el)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition border border-white/10"
                        style={{ color: e.color }}>
                        {e.emoji} {e.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* 프리미엄 CTA */}
          {step === "free-preview" && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#06060e] via-[#06060e]/95 to-transparent">
              <div className="max-w-lg mx-auto">
                <button
                  onClick={() => {
                    const orderId = `place-${Date.now()}`;
                    sessionStorage.setItem("placeEl", displayEl);
                    router.push(`/place/pay?orderId=${orderId}&amount=${PRICE}&el=${displayEl}`);
                  }}
                  className="w-full py-4 rounded-2xl font-black text-white text-base shadow-xl hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                  전체 공개 (해외 2·3순위 + PDF) — ₩{PRICE.toLocaleString()}
                </button>
                <p className="text-center text-xs text-white/25 mt-2">5개 오행 전체 추천 도시 + 방위 완전 분석</p>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
