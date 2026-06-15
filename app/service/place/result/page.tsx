"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

const KR_CITY_BY_ELEMENT: Record<string, {
  cities: { name: string; reason: string; emoji: string }[];
  avoid: string;
}> = {
  목: {
    cities: [
      { name: "강원 속초·양양", reason: "동해 파도와 울창한 숲. 목(木)의 상승 에너지가 충만합니다. 창의력과 성장 기운이 살아납니다.", emoji: "🌲" },
      { name: "전북 전주", reason: "전통문화와 역사가 살아있는 도시. 목의 인문학적 기운이 강합니다.", emoji: "📜" },
      { name: "경북 안동", reason: "유교 전통의 뿌리 깊은 도시. 목의 뿌리(根) 에너지로 자아를 다잡아 줍니다.", emoji: "🏯" },
    ],
    avoid: "목이 과다하면 금(金) 기운의 도시(인천·포항·창원)는 충돌을 일으킬 수 있습니다.",
  },
  화: {
    cities: [
      { name: "부산", reason: "열정적이고 역동적인 에너지. 화(火)의 불꽃 기운이 넘쳐 사업과 인간관계가 활발해집니다.", emoji: "🔥" },
      { name: "제주도", reason: "화산섬의 뜨거운 용암 에너지. 화의 변화와 창조 기운이 강합니다.", emoji: "🌋" },
      { name: "경남 통영·거제", reason: "남해의 풍요로운 햇빛과 바다. 화의 풍요 에너지가 재물운을 활성화합니다.", emoji: "☀️" },
    ],
    avoid: "화가 과다하면 수(水) 기운의 도시(강원 강릉·경기 여주)에서 충돌이 생길 수 있습니다.",
  },
  토: {
    cities: [
      { name: "충남 공주·부여", reason: "백제의 중심부. 토(土)의 중화·안정 에너지가 가득합니다.", emoji: "🏔️" },
      { name: "경기 이천·여주", reason: "비옥한 토지와 황토 기운. 토의 재물과 식복 에너지가 강합니다.", emoji: "🌾" },
      { name: "전남 순천·담양", reason: "대나무와 정원의 도시. 토의 균형과 포용 에너지가 인간관계를 풍요롭게 합니다.", emoji: "🎋" },
    ],
    avoid: "토가 과다하면 목(木) 기운의 도시(강원 원주·경북 안동)에서 충돌이 생길 수 있습니다.",
  },
  금: {
    cities: [
      { name: "인천", reason: "항구와 물류의 도시. 금(金)의 결단·실행 에너지가 넘칩니다.", emoji: "⚓" },
      { name: "경기 수원·성남", reason: "첨단 산업과 기술의 중심지. 금의 정밀·완벽 에너지가 직장을 빛냅니다.", emoji: "⚙️" },
      { name: "경북 포항", reason: "철강 산업의 도시. 금의 강인한 에너지가 추진력을 극대화합니다.", emoji: "🔩" },
    ],
    avoid: "금이 과다하면 화(火) 기운의 도시(부산·제주)에서 충돌이 생길 수 있습니다.",
  },
  수: {
    cities: [
      { name: "강원 강릉·동해", reason: "동해 바다와 청정 계곡. 수(水)의 지혜와 흐름 에너지가 직관력을 높입니다.", emoji: "🌊" },
      { name: "전남 여수", reason: "밤바다와 해양 에너지. 수의 감성과 낭만 기운이 예술을 활성화합니다.", emoji: "🌙" },
      { name: "경기 가평·춘천", reason: "호수와 강의 도시. 수의 맑고 고요한 에너지가 학업·집중력을 도와줍니다.", emoji: "🏞️" },
    ],
    avoid: "수가 과다하면 토(土) 기운의 도시(충남 공주·전남 순천)에서 수를 제어할 수 있습니다.",
  },
};

// 광역시 핵심 거주지 — 오행별로 기운이 강한 동네
const METRO_DISTRICTS_BY_ELEMENT: Record<string, string[]> = {
  목: ["인천 부평·계양", "청주", "창원 성산·의창"],
  화: ["부산 서면·동래", "대구 동성로·중구", "광주 충장로·구도심", "제주 시내", "포항 영일대"],
  토: ["대구 수성·범어", "대전 둔산·유성", "세종", "창원 성산·의창"],
  금: ["대전 원도심·중구", "광주 상무·첨단", "울산 삼산·남구"],
  수: ["부산 해운대·광안리", "인천 송도·청라", "울산 동구 바닷가", "제주 서귀포·해변", "포항 영일대"],
};

const WORLD_BY_ELEMENT: Record<string, {
  countries: { name: string; flag: string; reason: string; cities: string }[];
}> = {
  목: {
    countries: [
      { name: "캐나다", flag: "🇨🇦", reason: "울창한 숲과 광대한 자연. 목(木)의 성장·자유 에너지가 넘쳐 이민·유학에 최적입니다.", cities: "밴쿠버, 빅토리아, 몬트리올" },
      { name: "뉴질랜드", flag: "🇳🇿", reason: "청정 자연과 초원. 목의 신선하고 창의적인 에너지. 워킹홀리데이·이민 운이 강합니다.", cities: "오클랜드, 퀸스타운, 크라이스트처치" },
      { name: "독일", flag: "🇩🇪", reason: "깊이 있는 학문과 문화. 목의 인문학적 기운이 강해 유학·기술 연수에 탁월합니다.", cities: "베를린, 뮌헨, 함부르크" },
    ],
  },
  화: {
    countries: [
      { name: "스페인", flag: "🇪🇸", reason: "열정과 예술의 나라. 화(火)의 창의·표현 에너지가 넘쳐 예술·패션에서 빛납니다.", cities: "바르셀로나, 마드리드, 세비야" },
      { name: "브라질", flag: "🇧🇷", reason: "삼바와 열대의 열정. 화의 풍요와 생명력 에너지가 사업과 인간관계를 확장시킵니다.", cities: "상파울루, 리우데자네이루" },
      { name: "이탈리아", flag: "🇮🇹", reason: "미식·예술·패션의 나라. 화의 아름다움과 풍요 에너지가 감성과 창의력을 끌어올립니다.", cities: "로마, 밀라노, 피렌체" },
    ],
  },
  토: {
    countries: [
      { name: "스위스", flag: "🇨🇭", reason: "안정과 중립의 나라. 토(土)의 균형·신뢰 에너지가 금융·의학·외교 분야를 빛냅니다.", cities: "취리히, 제네바, 베른" },
      { name: "중국", flag: "🇨🇳", reason: "황하의 대지 에너지. 토의 중심·포용 에너지가 무역·제조업에서 큰 기회를 줍니다.", cities: "상하이, 베이징, 청두" },
      { name: "인도", flag: "🇮🇳", reason: "대지와 영성의 나라. 토의 깊은 지혜와 철학 에너지. IT·명상 분야에서 빛납니다.", cities: "뭄바이, 델리, 벵갈루루" },
    ],
  },
  금: {
    countries: [
      { name: "미국", flag: "🇺🇸", reason: "금(金)의 결단·실행·성공 에너지. 비즈니스·기술·금융에서 최강의 기운입니다.", cities: "뉴욕, 실리콘밸리, 시카고" },
      { name: "싱가포르", flag: "🇸🇬", reason: "아시아 금융의 중심. 금의 정밀·효율 에너지가 커리어와 재물운을 끌어올립니다.", cities: "싱가포르 시티 전역" },
      { name: "UAE(두바이)", flag: "🇦🇪", reason: "금과 사막의 부의 에너지. 사업·투자에서 강한 운이 따릅니다.", cities: "두바이, 아부다비" },
    ],
  },
  수: {
    countries: [
      { name: "일본", flag: "🇯🇵", reason: "섬나라의 수(水) 에너지. 정교함과 감성. 유학·비즈니스 운이 강합니다.", cities: "도쿄, 오사카, 교토" },
      { name: "네덜란드", flag: "🇳🇱", reason: "운하의 나라. 수의 유연하고 창의적인 에너지. 무역·디자인·기술에서 최적입니다.", cities: "암스테르담, 로테르담" },
      { name: "노르웨이", flag: "🇳🇴", reason: "피오르와 북극의 물 에너지. 학문·연구·자연 관련 분야에서 빛납니다.", cities: "오슬로, 베르겐" },
    ],
  },
};

const DIRECTION_BY_ELEMENT: Record<string, { dirs: string[]; desc: string }> = {
  목: { dirs: ["동쪽", "동남쪽"], desc: "태양이 뜨는 동쪽. 목의 기운이 넘치는 방향으로 거주지를 잡으면 성장 에너지가 강해집니다." },
  화: { dirs: ["남쪽", "동남쪽"], desc: "태양이 가장 높이 뜨는 남쪽. 화의 열정과 성공 에너지가 가장 강한 방향입니다." },
  토: { dirs: ["중앙", "남서쪽"], desc: "땅의 중심. 토의 안정과 포용 에너지가 강한 방향. 중심지에 거주하면 기운이 강해집니다." },
  금: { dirs: ["서쪽", "북서쪽"], desc: "해가 지는 서쪽. 금의 결단과 완성 에너지가 강한 방향. 서부 지역이 유리합니다." },
  수: { dirs: ["북쪽", "북동쪽"], desc: "겨울의 방향. 수의 지혜와 저장 에너지가 강한 방향. 고요하고 깊이 있는 환경이 맞습니다." },
};

const ELEMENT_LABELS: Record<string, { color: string; emoji: string; label: string }> = {
  목: { color: "#4ade80", emoji: "🌿", label: "목(木)" },
  화: { color: "#f87171", emoji: "🔥", label: "화(火)" },
  토: { color: "#fbbf24", emoji: "🏔️", label: "토(土)" },
  금: { color: "#a5b4fc", emoji: "⚔️", label: "금(金)" },
  수: { color: "#60a5fa", emoji: "🌊", label: "수(水)" },
};

function PlaceResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 990);
  const el = params.get("el") || sessionStorage.getItem("placeEl") || "토";

  const [status, setStatus] = useState<"confirming" | "done" | "error">("confirming");

  useEffect(() => {
    (async () => {
      try {
        const paymentKey = params.get("paymentKey") || "";
        if (paymentKey) {
          const receiptEmail = sessionStorage.getItem("receiptEmail") || undefined;
          const sajuRaw = sessionStorage.getItem("sajuForm");
          const sajuName = sajuRaw ? (JSON.parse(sajuRaw).name || "고객") : "고객";
          const res = await fetch("/api/payment/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentKey, orderId, amount,
              customerEmail: receiptEmail,
              customerName: sajuName,
              productName: "사주 도시 추천 완전판",
            }),
          });
          if (!res.ok) throw new Error("결제 확인 실패");
        }
        sessionStorage.setItem("placePaid", "true");
        setStatus("done");
      } catch {
        setStatus("error");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "confirming") {
    return (
      <main className="min-h-screen bg-[#06060e] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🌍</div>
          <p className="text-white font-bold mb-2">결제 확인 중...</p>
          <div className="w-40 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen bg-[#06060e] flex flex-col items-center justify-center px-4">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-white font-bold mb-4">결제 확인 중 오류가 발생했습니다</p>
        <a href="http://pf.kakao.com/_cuksX" target="_blank" rel="noopener noreferrer"
          className="px-6 py-3 rounded-xl bg-yellow-400 text-black font-bold text-sm">카카오 채널 문의</a>
      </main>
    );
  }

  const krData = KR_CITY_BY_ELEMENT[el];
  const worldData = WORLD_BY_ELEMENT[el];
  const dirData = DIRECTION_BY_ELEMENT[el];
  const elInfo = ELEMENT_LABELS[el];

  return (
    <main className="min-h-screen bg-[#06060e] text-white pb-20">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-4 mb-6 text-center">
          <p className="text-green-400 font-bold">✓ 결제 완료 · 전체 분석 공개</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{elInfo.emoji}</span>
          <div>
            <h1 className="text-xl font-black" style={{ color: elInfo.color }}>{elInfo.label} 기운</h1>
            <p className="text-sm text-gray-500">이 오행을 보강하는 최적의 장소들</p>
          </div>
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

        {/* 한국 도시 전체 */}
        <h2 className="text-sm font-bold text-gray-300 mb-3">🇰🇷 추천 한국 도시</h2>
        <div className="space-y-3 mb-6">
          {krData.cities.map((city, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{city.emoji}</span>
                <span className="font-bold text-white">{city.name}</span>
                {i === 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold ml-auto">1순위</span>}
                {i === 1 && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold ml-auto">2순위</span>}
                {i === 2 && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold ml-auto">3순위</span>}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{city.reason}</p>
            </div>
          ))}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-300/80 leading-relaxed">⚠️ {krData.avoid}</p>
          </div>
        </div>

        {/* 광역시 핵심 거주지 */}
        {METRO_DISTRICTS_BY_ELEMENT[el] && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-6">
            <p className="text-xs text-gray-500 font-semibold mb-2">🏙️ 광역시 핵심 거주지 — {elInfo.label} 기운이 강한 동네</p>
            <div className="flex flex-wrap gap-2">
              {METRO_DISTRICTS_BY_ELEMENT[el].map(d => (
                <span key={d} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: `${elInfo.color}1a`, color: elInfo.color, border: `1px solid ${elInfo.color}40` }}>{d}</span>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed mt-2">이미 거주 중인 광역시 안에서 이사·이주를 고민한다면, 이 동네들이 {elInfo.label} 기운을 보강하기 좋은 곳입니다.</p>
          </div>
        )}

        {/* 해외 전체 */}
        <h2 className="text-sm font-bold text-gray-300 mb-3">🌍 추천 해외 국가 (전체 공개)</h2>
        <div className="space-y-3 mb-8">
          {worldData.countries.map((country, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{country.flag}</span>
                <span className="font-bold text-white">{country.name}</span>
                {i === 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold ml-auto">1순위</span>}
                {i === 1 && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold ml-auto">2순위</span>}
                {i === 2 && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold ml-auto">3순위</span>}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-2">{country.reason}</p>
              <p className="text-[11px] text-gray-600">추천 도시: {country.cities}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => router.push("/service/place")}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-white transition">
            다른 오행으로 보기
          </button>
          <button onClick={() => router.push("/")}
            className="w-full py-3 rounded-xl bg-white/5 text-sm text-gray-400 transition">
            메인으로
          </button>
        </div>
      </div>
    </main>
  );
}

export default function PlaceResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06060e] flex items-center justify-center"><p className="text-gray-500 text-sm">로딩 중...</p></div>}>
      <PlaceResultContent />
    </Suspense>
  );
}
