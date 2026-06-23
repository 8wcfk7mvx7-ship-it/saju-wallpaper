"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { analyzeSaju, getJohuCareerInsight, getGungseongCareerSummary, getJijiRelations, type SajuResult } from "@/lib/saju";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";


export const dynamic = "force-dynamic";

const PRICE = 1000;
const BLUEBERRY_PRICE = 10;
const CURRENT_YEAR = 2026;

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
    avoid: "목이 과다하면 금(金) 기운의 도시(인천·포항·울산)는 충돌을 일으킬 수 있습니다.",
  },
  화: {
    cities: [
      { name: "부산", reason: "열정적이고 역동적인 에너지의 도시. 화(火)의 불꽃 기운이 넘쳐 사업과 인간관계가 활발해집니다.", emoji: "🔥", neighborhoods: "해운대, 광안리, 부평깡통시장", food: "돼지국밥, 밀면, 씨앗호떡" },
      { name: "제주도", reason: "화산섬의 뜨거운 용암 에너지. 화의 변화와 창조 기운이 강합니다. 새로운 전환점을 만들고 싶을 때.", emoji: "🌋", neighborhoods: "애월, 협재, 성산일출봉", food: "흑돼지, 옥돔, 한라봉" },
      { name: "경남 통영", reason: "남해의 풍요로운 햇빛과 빛나는 바다. 화의 풍요 에너지가 재물운을 활성화합니다.", emoji: "☀️", neighborhoods: "통영항, 한려수도, 동피랑벽화마을", food: "굴, 도다리쑥국, 충무김밥" },
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
      { name: "경남 거제·울산", reason: "조선·자동차·중공업 산업의 메카. 금(金)의 강인한 실행 에너지가 직업운과 재물운을 강하게 끌어올립니다.", emoji: "⚙️", neighborhoods: "거제 외도, 울산 태화강 국가정원", food: "꼼장어, 물곰탕, 미더덕찜" },
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
      { name: "일본", flag: "🇯🇵", reason: "을목(乙木)의 나라. 섬세한 장인정신과 벚꽃·녹음으로 상징되는 유연한 목의 기운. 유학·디자인·요식업·기술직에서 강한 운이 따릅니다.", cities: "도쿄, 교토, 후쿠오카", vibe: "장인·미학·섬세함" },
      { name: "대한민국", flag: "🇰🇷", reason: "갑목(甲木)의 나라. 곧게 뻗는 강한 목의 기운으로 성장·도전 에너지가 강합니다. 창업·IT·한류 콘텐츠에서 운이 뜁니다.", cities: "서울, 부산, 제주", vibe: "성장·도전·혁신" },
      { name: "캐나다", flag: "🇨🇦", reason: "울창한 삼림과 광대한 자연. 목(木)의 자유·성장 에너지가 넘쳐 이민·유학·자연 기반 산업에 최적입니다.", cities: "밴쿠버, 빅토리아, 몬트리올", vibe: "자연·자유·다문화" },
    ],
  },
  화: {
    countries: [
      { name: "태국", flag: "🇹🇭", reason: "열대의 강렬한 화기(火氣). 뜨거운 태양과 역동적인 상업 에너지. 사업 확장·관광·요식업에서 폭발적인 기운이 따릅니다.", cities: "방콕, 치앙마이, 파타야", vibe: "열기·사업·역동성" },
      { name: "사우디아라비아", flag: "🇸🇦", reason: "병화(丙火)·정화(丁火)의 나라. 태양과 사막, 석유 에너지가 응집된 화기. 자원·에너지·투자 분야에서 강한 재물운이 따릅니다.", cities: "리야드, 제다, 네옴", vibe: "자원·에너지·투자" },
      { name: "스페인", flag: "🇪🇸", reason: "열정과 예술의 화(火) 기운. 표현·창의·외향적 에너지가 넘쳐 예술·패션·음악 분야에서 빛납니다.", cities: "바르셀로나, 마드리드, 세비야", vibe: "열정·예술·축제" },
    ],
  },
  토: {
    countries: [
      { name: "중국", flag: "🇨🇳", reason: "무토(戊土)의 나라. 황하 대지의 두텁고 육중한 토 에너지. 무역·제조·부동산·내수시장에서 압도적인 기회가 옵니다.", cities: "상하이, 베이징, 청두", vibe: "무역·규모·실리" },
      { name: "카자흐스탄(중앙아시아)", flag: "🇰🇿", reason: "무토(戊土)·기토(己土)의 땅. 광대한 초원과 사막, 풍부한 자원 매장. 대륙의 중심부에서 안정·축적·자원 분야의 기회가 강합니다. 카자흐스탄·우즈베키스탄·키르기스스탄 등 중앙아시아 전체에 해당합니다.", cities: "알마티, 아스타나, 타슈켄트", vibe: "자원·대지·축적" },
      { name: "인도", flag: "🇮🇳", reason: "광대한 대지의 토 기운. 철학적 깊이와 IT 실용주의가 결합된 나라. 기술 창업·소프트웨어 분야에서 강합니다.", cities: "뭄바이, 델리, 벵갈루루", vibe: "규모·IT·철학" },
    ],
  },
  금: {
    countries: [
      { name: "미국", flag: "🇺🇸", reason: "경금(庚金)의 나라. 강렬하고 단호한 실행 에너지. 글로벌 표준을 만드는 기술·금융·군사 강국. 비즈니스 확장에 최강의 기운.", cities: "뉴욕, 실리콘밸리, 시카고", vibe: "실행·도전·글로벌" },
      { name: "독일", flag: "🇩🇪", reason: "신금(辛金)의 나라. 정밀하고 세공된 금의 기운. 공학·자동차·제조·연구에서 세계 최고 수준. 기술직·이공계 유학에 최적.", cities: "베를린, 뮌헨, 함부르크", vibe: "정밀·공학·질서" },
      { name: "싱가포르", flag: "🇸🇬", reason: "아시아 금융의 금(金) 기운. 효율·법치·국제화가 결합된 나라. 커리어·재물운이 빠르게 상승하는 환경입니다.", cities: "싱가포르 시티 전역", vibe: "금융·효율·국제화" },
    ],
  },
  수: {
    countries: [
      { name: "러시아", flag: "🇷🇺", reason: "임수(壬水)의 나라. 광대하고 차가운 대하(大河)의 기운. 논리·전략·과학·수학에서 세계적 역량을 발휘합니다. 이공계 학문 연구에 강한 운.", cities: "모스크바, 상트페테르부르크, 노보시비르스크", vibe: "전략·과학·논리" },
      { name: "영국", flag: "🇬🇧", reason: "계수(癸水)의 나라. 안개와 빗속의 섬나라. 냉철한 분석력과 합리주의 에너지. 학문·법률·금융·연구직에서 체계적인 운이 따릅니다.", cities: "런던, 에든버러, 옥스퍼드", vibe: "분석·합리·학문" },
      { name: "노르웨이", flag: "🇳🇴", reason: "피오르의 깊고 차가운 수(水) 에너지. 객관적 데이터 기반 의사결정과 연구 환경이 뛰어납니다. 이공계·환경 분야에 강합니다.", cities: "오슬로, 베르겐, 트론헤임", vibe: "연구·데이터·자연" },
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
  { icon: "🌍", title: "해외 추천 국가 3곳", desc: "이민·유학·취업에 유리한 나라 (3순위 무료 공개)" },
  { icon: "🧭", title: "유리한 방위", desc: "침실·책상·소파 배치까지 — 공간 에너지 최적화" },
  { icon: "🏙️", title: "현재 도시 궁합 분석", desc: "지금 사는 도시가 내 사주와 맞는지 즉시 진단" },
];

// ─── 현재 도시 오행 추론 ────────────────────────────────────────────────────
const CITY_ELEMENT_MAP: Record<string, string> = {
  서울: "토", 경기: "토", 수원: "금", 성남: "금", 용인: "토", 화성: "토", 평택: "금",
  인천: "금", 부산: "화", 대구: "화", 광주: "화", 대전: "토", 울산: "금", 세종: "토",
  강릉: "수", 동해: "수", 속초: "목", 양양: "목", 춘천: "수", 가평: "수",
  전주: "목", 안동: "목", 공주: "토", 부여: "토", 이천: "토", 여주: "토",
  순천: "토", 담양: "토", 여수: "수", 제주: "화", 통영: "화", 거제: "금", 포항: "금",
};

function findCityElement(city: string): string | null {
  if (!city.trim()) return null;
  const trimmed = city.trim();
  for (const [keyword, el] of Object.entries(CITY_ELEMENT_MAP)) {
    if (trimmed.includes(keyword)) return el;
  }
  // KR 데이터에서 직접 검색
  for (const [el, data] of Object.entries(KR_CITY_BY_ELEMENT)) {
    for (const c of data.cities) {
      const simpleName = c.name.replace(/강원|경남|경기|전남|충남|전북|경북|경기\s/, "").trim();
      if (trimmed.includes(simpleName) || simpleName.split("·").some(n => trimmed.includes(n))) {
        return el;
      }
    }
  }
  return null;
}

type Step = "splash" | "form" | "loading" | "result";

export default function PlacePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("splash");
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));
  const [birthCity, setBirthCity] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [yongshinEl, setYongshinEl] = useState("토");
  const [selectedEl, setSelectedEl] = useState("");
  const [currentCityEl, setCurrentCityEl] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [sajuResult, setSajuResult] = useState<SajuResult | null>(null);

  function handleBlueberryUnlock() {
    const bb = parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
    if ((isNaN(bb) ? 0 : bb) < BLUEBERRY_PRICE) {
      alert(`별조각이 부족합니다. 현재 ${isNaN(bb) ? 0 : bb}개 / 필요 ${BLUEBERRY_PRICE}개`);
      return;
    }
    localStorage.setItem("sp_blueberries", String(bb - BLUEBERRY_PRICE));
    setUnlocked(true);
  }
  const [counter] = useState(() => Math.floor(Math.random() * 120) + 87);
  const [totalCount] = useState(() => Math.floor(Math.random() * 5000) + 18000);

  async function handleFormSubmit() {
    if (!form.name.trim()) {
      setFormError("이름을 입력해주세요.");
      return;
    }
    if (!form.birthYear || !form.birthMonth || !form.birthDay) {
      setFormError("생년월일을 모두 입력해주세요.");
      return;
    }
    setFormError("");
    setStep("loading");

    let fy = Number(form.birthYear), fm = Number(form.birthMonth), fd = Number(form.birthDay);

    if (form.calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(fy, fm, fd, form.isLeapMonth);
        const sol = cal.getSolarCalendar();
        if (!sol?.year) throw new Error("변환 실패");
        fy = sol.year; fm = sol.month; fd = sol.day;
      } catch {
        setFormError("음력 날짜 변환에 실패했습니다. 날짜를 다시 확인해주세요.");
        setStep("form");
        return;
      }
    }

    try {
      const r = analyzeSaju({
        birthYear: fy, birthMonth: fm, birthDay: fd,
        birthHour: form.birthHour,
        birthMinute: form.birthMinute,
        name: form.name || "나", gender: form.gender, birthPlace: form.city || "서울",
        style: "auto", productType: "report", useJajasi: form.useJajasi,
      });
      const el = r.yongshin.yongshin || r.lacking[0] || "토";
      setYongshinEl(el);
      setSelectedEl(el);
      setSajuResult(r);
    } catch {
      setYongshinEl("토");
      setSelectedEl("토");
    }

    setCurrentCityEl(findCityElement(currentCity));
  }


  if (step === "loading") return (
    <AnalysisLoading subject={`${form.name ? form.name + "님의 " : ""}운명의 도시`} onDone={() => setStep("result")} />
  );

  const displayEl = selectedEl || yongshinEl || "토";
  const krData = KR_CITY_BY_ELEMENT[displayEl];
  const worldData = WORLD_BY_ELEMENT[displayEl];
  const dirData = DIRECTION_BY_ELEMENT[displayEl];
  const elInfo = ELEMENT_LABELS[displayEl];

  return (
    <main className="min-h-screen bg-[#06060e] text-white" style={{ animation: "fadeIn 0.45s ease-out" }}>
      <BackButton />
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        select option{background:#0d0d1a;color:#fff}
      `}</style>

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

            <div className="max-w-xl mx-auto px-6 pt-12 pb-28 text-center">
              <div className="flex flex-col items-center gap-2 mb-8">
                <div className="inline-flex items-center gap-2 bg-amber-500/12 border border-amber-500/28 rounded-full px-4 py-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                  <span className="text-amber-200 text-sm font-semibold">
                    지금 <strong className="text-white">{counter.toLocaleString()}명</strong>이 확인 중
                  </span>
                </div>
                <span className="text-xs text-white/25">누적 <strong className="text-white/40">{totalCount.toLocaleString()}명</strong> 분석 완료</span>
              </div>

              <h1 className="text-3xl font-black leading-tight mb-5 tracking-tight">
                지금 살고 있는 도시가<br />
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-green-300 bg-clip-text text-transparent">
                  내 사주와 맞지 않으면
                </span><br />
                아무리 노력해도 안 풀립니다
              </h1>

              <div className="bg-red-500/8 border border-red-500/20 rounded-2xl px-5 py-4 mb-7">
                <p className="text-sm text-red-200/80 leading-relaxed">
                  ⚠️ 이사 한 번으로 운이 바뀌는 사람들이 있습니다.<br />
                  <strong className="text-red-100">운이 안 풀리는 진짜 이유가 도시에 있을 수 있습니다.</strong>
                </p>
              </div>

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

              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { val: "5개", label: "오행 분석" },
                  { val: "30+", label: "추천 도시" },
                  { val: "무료", label: "3순위 공개" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-black text-white">{s.val}</p>
                    <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep("form")}
                className="w-full py-5 rounded-2xl text-white font-black text-lg mb-3 transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #d97706, #ca8a04, #16a34a)", boxShadow: "0 8px 40px rgba(202,138,4,0.4)" }}
              >
                🗺️ 내 운명의 도시 찾기
              </button>
              <p className="text-xs text-white/20">가입 없음 · 광고 없음 · 3순위 무료</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ FORM ══ */}
      {step === "form" && (
        <div className="max-w-2xl mx-auto px-5 py-10 pb-20">

          <h2 className="text-xl font-black text-white mb-1">생년월일 입력</h2>
          <p className="text-xs text-white/35 mb-8">사주를 분석해 내 기운과 맞는 도시를 찾습니다</p>

          <div className="space-y-5">
            <BirthInputForm value={form} onChange={setForm} accent="#d97706" />

            {/* 태어난 도시 */}
            <div>
              <label className="block text-xs text-white/50 mb-2 font-semibold uppercase tracking-wider">태어난 도시 <span className="text-white/25 font-normal normal-case tracking-normal">(선택)</span></label>
              <input
                type="text" value={birthCity} onChange={e => setBirthCity(e.target.value)}
                placeholder="예: 서울, 부산, 대구..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* 현재 사는 도시 */}
            <div>
              <label className="block text-xs text-white/50 mb-2 font-semibold uppercase tracking-wider">현재 사는 도시</label>
              <input
                type="text" value={currentCity} onChange={e => setCurrentCity(e.target.value)}
                placeholder="예: 서울, 부산, 인천, 제주..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/50"
              />
              <p className="text-[10px] text-white/25 mt-1.5">현재 도시와 사주의 궁합을 분석합니다</p>
            </div>

            {formError && (
              <p className="text-xs text-red-400 text-center">{formError}</p>
            )}

            <button
              onClick={handleFormSubmit}
              className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #d97706, #ca8a04, #16a34a)", boxShadow: "0 8px 30px rgba(202,138,4,0.35)" }}
            >
              🗺️ 내 운명의 도시 찾기
            </button>
          </div>
        </div>
      )}

      {/* ══ RESULT ══ */}
      {step === "result" && krData && (
        <div className="max-w-2xl mx-auto px-5 py-10 pb-12">
          <button onClick={() => setStep("form")} className="text-xs text-gray-600 hover:text-gray-400 mb-6 inline-flex items-center gap-1 transition">← 다시 입력</button>

          {/* 용신 배너 */}
          <div className="flex items-center gap-3 mb-5 p-4 rounded-2xl" style={{ background: `${elInfo?.color}10`, border: `1px solid ${elInfo?.color}30` }}>
            <span className="text-3xl">{elInfo?.emoji}</span>
            <div className="flex-1">
              <p className="text-xs text-white/40 mb-0.5">{form.name ? `${form.name}님 용신 기준` : "용신 기준"}</p>
              <p className="text-base font-black" style={{ color: elInfo?.color }}>{elInfo?.label} 기운을 보강하는 곳</p>
              <p className="text-xs text-white/30 mt-0.5">{elInfo?.keyword}</p>
            </div>
            <button onClick={() => setStep("form")} className="text-xs text-white/30 hover:text-white/60 transition">다시 입력</button>
          </div>

          {/* 태어난 도시 분석 */}
          {birthCity && (() => {
            const birthEl = findCityElement(birthCity);
            const isMatch = birthEl === displayEl;
            return (
              <div className={`rounded-2xl p-4 mb-4 border ${isMatch ? "bg-amber-500/8 border-amber-500/20" : "bg-white/[0.03] border-white/10"}`}>
                <p className="text-sm font-bold mb-1">
                  {isMatch ? `🌱 고향(${birthCity})과 사주가 잘 맞습니다` : `🚀 고향(${birthCity})을 벗어난 곳에서 운이 열립니다`}
                </p>
                <p className="text-xs text-white/45 leading-relaxed">
                  {isMatch
                    ? `태어난 곳의 기운이 용신과 일치합니다. 고향 근처에서도 좋은 기운을 받을 수 있지만, 아래 추천 도시에서 더욱 크게 꽃피울 수 있어요.`
                    : `태어난 곳의 기운과 용신이 다릅니다. 고향에서 멀어질수록 새로운 기운 안에서 더 크게 성장하는 사주입니다. 아래 추천 도시로의 이동을 고려해보세요.`}
                </p>
              </div>
            );
          })()}

          {/* 현재 도시 궁합 */}
          {currentCity && (
            <div className={`rounded-2xl p-4 mb-5 border ${currentCityEl === displayEl
              ? "bg-green-500/8 border-green-500/25"
              : currentCityEl
                ? "bg-red-500/8 border-red-500/20"
                : "bg-white/5 border-white/10"}`}>
              <p className="text-sm font-bold mb-1">
                {currentCityEl === displayEl
                  ? `✅ ${currentCity}은 사주와 잘 맞습니다`
                  : currentCityEl
                    ? `⚠️ ${currentCity}은 사주와 기운이 다릅니다`
                    : `🔍 ${currentCity} 기운 분석`}
              </p>
              <p className="text-xs text-white/45 leading-relaxed">
                {currentCityEl === displayEl
                  ? `현재 도시(${ELEMENT_LABELS[currentCityEl]?.label} 기운)가 용신 오행과 일치합니다. 지금 위치에서 운을 꽃피울 수 있습니다.`
                  : currentCityEl
                    ? `현재 도시는 ${ELEMENT_LABELS[currentCityEl]?.label} 기운입니다. 용신 ${elInfo?.label}과 충돌할 수 있어 아래 추천 도시로의 이동을 고려해보세요.`
                    : "해당 도시 데이터가 없습니다. 아래 추천 도시를 참고해 판단해주세요."}
              </p>
            </div>
          )}

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

          {/* 조후(調候) 분석 */}
          {sajuResult && (() => {
            const ilgan = sajuResult.pillarsDetail.day.cg;
            const monthJj = sajuResult.pillarsDetail.month.jj;
            const johu = getJohuCareerInsight(ilgan, monthJj);
            return (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
                <p className="text-sm font-bold text-orange-300 mb-1">조후(調候) — 기온·기운으로 보는 적합한 환경</p>
                <p className="text-xs text-amber-400/70 mb-2 font-semibold">{johu.climate} 기운</p>
                <p className="text-sm text-gray-300 leading-relaxed mb-2">{johu.desc}</p>
                <p className="text-xs text-emerald-300 leading-relaxed">▶ 이런 분위기의 도시가 잘 맞아: {johu.fields}</p>
              </div>
            );
          })()}

          {/* 궁성(宮星) 배치 분석 */}
          {sajuResult && (() => {
            const gungseongList = getGungseongCareerSummary(sajuResult.pillarsDetail);
            if (gungseongList.length === 0) return null;
            return (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
                <p className="text-sm font-bold text-cyan-300 mb-3">궁성(宮星)으로 보는 환경 적합성</p>
                <div className="space-y-2">
                  {gungseongList.slice(0, 3).map((g, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="shrink-0 px-2 py-0.5 rounded-md text-xs font-bold bg-cyan-900/40 text-cyan-300">{g.palaceLabel.split("(")[0]} · {g.sipseong}</span>
                      <p className="text-xs text-gray-400 leading-relaxed">{g.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 합충 — 이동 타이밍 */}
          {sajuResult && (() => {
            const allJj = [sajuResult.pillarsDetail.year.jj, sajuResult.pillarsDetail.month.jj, sajuResult.pillarsDetail.day.jj, sajuResult.pillarsDetail.hour?.jj].filter(Boolean) as string[];
            const chungList = getJijiRelations(allJj).filter(rel => ["충"].includes(rel.type));
            const hapList = getJijiRelations(allJj).filter(rel => ["삼합","육합","반합"].includes(rel.type));
            if (chungList.length === 0 && hapList.length === 0) return null;
            const POS_LABEL = ["년지","월지","일지","시지"];
            return (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
                <p className="text-sm font-bold text-violet-300 mb-3">합·충으로 보는 이동 타이밍</p>
                {hapList.map((rel, i) => (
                  <p key={i} className="text-xs text-gray-400 leading-relaxed mb-1.5">
                    <span className="text-emerald-300 font-bold">{POS_LABEL[rel.a]}({rel.jjA})·{POS_LABEL[rel.b]}({rel.jjB}) {rel.type}</span> — 두 기운이 합해 현재 환경에 안정적으로 정착하려는 흐름이 있어. 이사·이민을 고려 중이라면 크게 서두르지 않아도 돼.
                  </p>
                ))}
                {chungList.map((rel, i) => (
                  <p key={i} className="text-xs text-amber-300/80 leading-relaxed mb-1.5">
                    <span className="font-bold">{POS_LABEL[rel.a]}({rel.jjA})·{POS_LABEL[rel.b]}({rel.jjB}) 충</span> — 충 에너지가 이동·변화를 촉진하는 구조야. 지금 있는 곳보다 새로운 환경으로 옮겼을 때 오히려 기운이 살아나는 타입이야. 추천 도시로의 이사가 실제로 전환점이 될 수 있어.
                  </p>
                ))}
              </div>
            );
          })()}

          {/* 한국 도시 */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
              🇰🇷 추천 한국 도시
              <span className="text-xs font-normal text-white/25">동네·먹거리까지</span>
            </h2>
            <div className="space-y-3">
              {krData.cities.map((city, i) => {
                const isBlurred = i < 2 && !unlocked;
                return (
                  <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 relative overflow-hidden">
                    <div style={{ filter: isBlurred ? "blur(5px)" : "none", userSelect: isBlurred ? "none" : "auto", pointerEvents: isBlurred ? "none" : "auto" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{city.emoji}</span>
                        <span className="font-black text-white">{city.name}</span>
                        {i === 2 && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold ml-auto">3순위 무료</span>}
                        {i === 0 && <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full font-bold ml-auto">1순위</span>}
                        {i === 1 && <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full font-bold ml-auto">2순위</span>}
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
                    {isBlurred && (
                      <div className="absolute inset-0 rounded-2xl pointer-events-none"
                           style={{ background: "linear-gradient(to bottom, rgba(6,6,14,0.1) 0%, rgba(6,6,14,0.55) 100%)" }} />
                    )}
                  </div>
                );
              })}
              <div className="bg-amber-500/8 border border-amber-500/18 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-300/70 leading-relaxed">⚠️ {krData.avoid}</p>
              </div>
            </div>
          </div>

          {/* 해외 국가 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white/70">🌍 추천 해외 국가</h2>
              <span className="text-xs text-white/25">3순위 무료 공개</span>
            </div>
            <div className="space-y-3">
              {worldData.countries.map((country, i) => {
                const isBlurred = i < 2 && !unlocked;
                return (
                  <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 relative overflow-hidden">
                    <div style={{ filter: isBlurred ? "blur(5px)" : "none", userSelect: isBlurred ? "none" : "auto", pointerEvents: isBlurred ? "none" : "auto" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">{country.flag}</span>
                        <div>
                          <span className="font-black text-white">{country.name}</span>
                          <p className="text-[10px] text-white/30 mt-0.5">{country.vibe}</p>
                        </div>
                        {i === 2 && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold ml-auto">3순위 무료</span>}
                        {i === 0 && <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full font-bold ml-auto">1순위</span>}
                        {i === 1 && <span className="text-[10px] bg-white/10 text-white/40 px-2 py-0.5 rounded-full font-bold ml-auto">2순위</span>}
                      </div>
                      <p className="text-xs text-white/45 leading-relaxed mb-2">{country.reason}</p>
                      <p className="text-[11px] text-white/25">추천 도시: {country.cities}</p>
                    </div>
                    {isBlurred && (
                      <div className="absolute inset-0 rounded-2xl pointer-events-none"
                           style={{ background: "linear-gradient(to bottom, rgba(6,6,14,0.1) 0%, rgba(6,6,14,0.55) 100%)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 다른 오행 */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-8">
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

          {/* 프리미엄 CTA (인라인, 고정 아님) */}
          <div className="rounded-2xl overflow-hidden">
            <button
              onClick={() => {
                const orderId = `place-${Date.now()}`;
                sessionStorage.setItem("placeEl", displayEl);
                router.push(`/place/pay?orderId=${orderId}&amount=${PRICE}&el=${displayEl}`);
              }}
              className="w-full py-5 font-black text-white text-base hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              🔓 1·2순위 전체 공개 — ₩{PRICE.toLocaleString()}
            </button>
            {!unlocked && (
              <button
                onClick={handleBlueberryUnlock}
                className="w-full py-3 font-bold text-white/70 text-sm hover:opacity-90 transition-opacity bg-white/5 border-t border-white/10">
                ✨ 별조각 {BLUEBERRY_PRICE}개로 보기
              </button>
            )}
            <p className="text-center text-xs text-white/25 mt-3">5개 오행 전체 추천 도시 + 방위 완전 분석</p>
          </div>
        </div>
      )}
    </main>
  );
}
