"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju, type SajuResult } from "@/lib/saju";
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";
import AnalysisLoading from "@/components/AnalysisLoading";
import AdultGate from "@/components/AdultGate";

export const dynamic = "force-dynamic";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS  = Array.from({ length: CURRENT_YEAR - 1919 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

// ── 드롭다운 ─────────────────────────────────────────────────────────────────
function DropPick({ value, opts, onChange, placeholder, suffix }: {
  value: string; opts: { v: string; label: string }[];
  onChange: (v: string) => void; placeholder: string; suffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  useEffect(() => {
    if (open && list.current && value) {
      const el = list.current.querySelector(`[data-v="${value}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);
  const display = opts.find(o => o.v === value)?.label ?? "";
  return (
    <div ref={ref} className="relative w-full">
      <div onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer select-none transition text-sm ${
          open ? "border-rose-500 bg-rose-950/30" : "border-white/15 bg-white/5 hover:border-rose-500/50"
        }`}>
        <span className={display ? "text-white" : "text-gray-500"}>{display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}</span>
        <span className={`text-gray-500 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </div>
      {open && (
        <div ref={list} className="absolute z-50 w-full mt-1 bg-[#180a12] border border-rose-900/40 rounded-xl overflow-y-auto shadow-2xl" style={{ maxHeight: 220 }}>
          {opts.map(o => (
            <div key={o.v} data-v={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                value === o.v ? "text-rose-300 bg-rose-900/40 font-semibold" : "text-gray-300 hover:bg-white/8"
              }`}>
              {o.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 외모 (일간별) ────────────────────────────────────────────────────────────
const ILGAN_APPEARANCE: Record<string, { face: string; body: string; vibe: string; celeb: string }> = {
  갑: { face: "반듯하고 강인한 이목구비. 의지가 느껴지는 눈빛. 높은 콧대.", body: "키가 큰 편. 곧고 단정한 체형.", vibe: "처음 보면 왠지 믿음이 가는 느낌. 군더더기 없이 깔끔한 이미지.", celeb: "원빈·공유 / 김태리·손예진" },
  을: { face: "갸날프고 섬세한 이목구비. 꽃처럼 여린 분위기. 촉촉한 눈.", body: "날씬하고 부드러운 체형. 덩굴처럼 유연한 라인.", vibe: "가까이 갈수록 더 예뻐 보이는 타입. 자연스럽고 친근한 매력.", celeb: "아이유·한지민 / 정해인·박보검" },
  병: { face: "이목구비 뚜렷, 눈빛 강렬. 피부가 맑고 밝음.", body: "체격이 좋거나 에너지 넘치는 실루엣.", vibe: "방에 들어오는 순간 분위기가 달라지는 타입. 태양 같은 존재감.", celeb: "이효리·전지현 / 차은우·강호동" },
  정: { face: "촉촉하고 깊은 눈. 부드럽고 서정적인 인상.", body: "균형 잡힌 체형. 온화하고 부드러운 라인.", vibe: "처음엔 평범해 보이는데 계속 눈이 가는 타입. 촛불 같은 은은한 아름다움.", celeb: "박보영·유인나 / 도경수·황민현" },
  무: { face: "둥글고 후덕한 인상. 편안하고 믿음직한 얼굴.", body: "체격이 있거나 중후한 체형. 안정감 있는 실루엣.", vibe: "가까이 있으면 이상하게 안정감 주는 타입.", celeb: "김혜수·전도연 / 김수현·차인표" },
  기: { face: "계란형 얼굴. 고급진 피부. 자연스럽고 담백한 미모.", body: "균형 잡힌 체형. 고급스러운 몸매 라인.", vibe: "특별히 눈에 안 띄는데 계속 생각나는 타입. 보면 볼수록 예쁨.", celeb: "신민아·공효진 / 강동원·류준열" },
  경: { face: "날카롭고 강인한 이목구비. 금속처럼 반짝이는 광채. 강렬한 눈빛.", body: "각진 윤곽. 탄탄하고 강인한 체형.", vibe: "처음엔 차갑고 도도한 느낌. 알면 의외의 따뜻함이 반전 매력.", celeb: "고준희·이하늬 / 이준기·현빈" },
  신: { face: "작고 섬세한 이목구비. 서리처럼 차갑고 고급스러운 미모.", body: "날씬하고 세련된 체형. 완벽하게 관리된 느낌.", vibe: "범접할 수 없는 도도함. 하지만 가까이 가면 섬세하고 예민함.", celeb: "김태희·송혜교 / 박서준·차학연" },
  임: { face: "물처럼 맑고 깊은 눈. 신비로운 분위기. 윤기 있는 피부.", body: "유연하고 부드러운 체형. 물처럼 자유로운 실루엣.", vibe: "알 수 없는 신비로움. 계속 궁금하게 만드는 타입.", celeb: "탕웨이·수지 / 정우성·이민호" },
  계: { face: "투명하고 촉촉한 피부. 안개처럼 부드러운 인상. 맑은 눈빛.", body: "가볍고 섬세한 체형. 안개처럼 부드러운 실루엣.", vibe: "청순하지만 신비로운 분위기. 가까이 있으면 이상하게 기대고 싶어짐.", celeb: "문채원·박신혜 / 임시완·도경수" },
};

// ── 성적 능력/에너지 (일간+성별) ────────────────────────────────────────────
const ILGAN_SEX: Record<string, { female: { power: string; energy: string; style: string }; male: { power: string; energy: string; style: string } }> = {
  갑: {
    female: { power: "생명력 강한 목(木)의 음기. 탄탄하고 탄력 있는 에너지.", energy: "큰 나무처럼 강인. 리드당하기보다 자기 리듬을 가짐.", style: "주도당하는 것보다 파트너와 대등하게 이끌어가는 타입." },
    male:   { power: "강인한 양기. 끈질긴 지구력.", energy: "큰 나무처럼 버팀. 강하고 오래가는 에너지.", style: "처음부터 끝까지 주도하고 싶어하는 타입." },
  },
  을: {
    female: { power: "부드럽지만 깊은 음기. 덩굴처럼 감아드는 유연함.", energy: "겉은 수동적이지만 실은 상대를 완전히 장악하는 에너지.", style: "수동적인 척하다가 어느새 상대를 완전히 녹이는 타입." },
    male:   { power: "섬세하고 유연한 에너지. 덩굴처럼 강하게 잡아당기는 힘.", energy: "부드럽게 감아드는 방식. 오래가는 에너지.", style: "서서히 상대를 녹이는 방식이 특기." },
  },
  병: {
    female: { power: "뜨겁고 강렬한 화(火)의 기운. 처음이 가장 폭발적.", energy: "태양처럼 강렬. 적극적이고 에너지 충만.", style: "분위기를 주도하고 상대를 끌어당기는 타입." },
    male:   { power: "가장 강렬한 양기. 폭발적 에너지.", energy: "태양 같은 열기. 처음부터 최고조.", style: "강렬하게 밀어붙이는 타입. 식으면 빠름." },
  },
  정: {
    female: { power: "촛불처럼 은은하지만 오래가는 열기.", energy: "깊고 감성적인 화(火)의 에너지. 감정이 먼저 연결되어야 빛남.", style: "감성 교감이 이루어진 후 가장 강렬하게 빛나는 타입." },
    male:   { power: "은은하지만 지속되는 열정.", energy: "촛불. 조용하지만 오래 타오름.", style: "감성적 교감이 먼저. 분위기 중시." },
  },
  무: {
    female: { power: "포용력이 크고 안정적인 음기. 산처럼 크고 든든한 에너지.", energy: "지구력 최강. 상대를 완전히 품어주는 압도적 포용.", style: "빠르고 강한 것보다 깊고 오래가는 것을 선호." },
    male:   { power: "묵직하고 오래가는 양기.", energy: "큰 산. 지구력이 강하고 안정적.", style: "천천히 정복하는 타입. 급하지 않음." },
  },
  기: {
    female: { power: "세심하고 섬세한 음기. 받아주고 흡수하는 땅의 에너지.", energy: "상대의 반응을 읽고 맞춰주는 최고의 파트너.", style: "상대가 원하는 것을 먼저 알아차리는 능력이 특기." },
    male:   { power: "섬세하고 꼼꼼한 에너지.", energy: "상대가 원하는 것을 먼저 아는 능력.", style: "상대 맞춤형. 기억력과 섬세함이 무기." },
  },
  경: {
    female: { power: "예민하고 강한 금(金)의 감각. 순도 높고 강인한 에너지.", energy: "원하는 것을 직접적으로 표현하는 타입.", style: "모호함 없이 강하고 확실하게 진행하는 타입." },
    male:   { power: "강인하고 날카로운 양기.", energy: "금속 같은 강인함. 예리하고 확실한 에너지.", style: "강하고 직접적. 말보다 행동 먼저." },
  },
  신: {
    female: { power: "섬세하고 예민한 금(金)의 감각. 분위기에 극도로 민감.", energy: "분위기가 완벽해야 최고의 감각이 열리는 타입.", style: "낭만적인 분위기와 완벽한 디테일이 갖춰질 때 가장 강렬함." },
    male:   { power: "낭만적이고 섬세한 에너지.", energy: "서리 같은 예민한 감각. 분위기 중시.", style: "섬세하고 낭만적. 상대를 특별하게 만들어주는 타입." },
  },
  임: {
    female: { power: "대하(大河)의 강한 음기. 밤의 기운이 집약된 임수(壬水). 진지하고 묵직한 에너지.", energy: "수축하는 물의 기운으로 깊고 강렬합니다. 겉은 차갑지만 일단 몰입하면 강합니다.", style: "감성보다 논리, 직관보다 선택. 마음이 열리면 깊고 진지하게 연결됩니다." },
    male:   { power: "밤의 기운을 강하게 타고난 임수. 다운된 기분을 치환하려는 심리로 성적 에너지가 강합니다.", energy: "큰 강물처럼 묵직하고 진지한 에너지. 목적의식이 있고 깊게 빠져드는 타입.", style: "오글거리는 접근보다 직접적인 방식을 선호합니다. 진지하고 강렬하게." },
  },
  계: {
    female: { power: "안개처럼 스며드는 음기. 계수(癸水) — 가장 섬세하고 깊은 음기.", energy: "감성과 감각이 완전히 연결된 타입.", style: "스며들 듯 가까워지다가 어느새 완전히 연결되는 타입." },
    male:   { power: "감성적이고 섬세한 에너지.", energy: "이슬 같은 순수함. 감각이 풍부하고 세밀함.", style: "감성과 교감이 먼저. 느리지만 깊어지는 타입." },
  },
};

// ── 일지별 은근한 매력 ────────────────────────────────────────────────────────
const ILJI_HIDDEN_CHARM: Record<string, { charm: string; weapon: string }> = {
  자: { charm: "알면 알수록 깊어지는 신비로움. 깊은 음기가 자연스럽게 스며나옴.", weapon: "말하지 않아도 느껴지는 깊은 감성" },
  축: { charm: "처음엔 평범해 보이지만 알고 나면 엄청난 내공.", weapon: "기댈 수 있다는 묵직한 안정감" },
  인: { charm: "생명력과 활기. 같이 있으면 이상하게 에너지 충전되는 타입.", weapon: "자유로운 에너지와 도전적인 매력" },
  묘: { charm: "꽃 같은 부드러움. 봄 바람처럼 자연스럽게 스며드는 매력.", weapon: "도화살 핵심 지지 — 이성을 끌어당기는 꽃 에너지" },
  진: { charm: "예측불가능한 다채로운 면. 알면 알수록 새로운 면이 나옴.", weapon: "용의 기운 — 신비롭고 강한 내면" },
  사: { charm: "겉은 조용한데 속이 뜨거운 타입. 가까이 갈수록 열기가 느껴짐.", weapon: "은폐된 강렬한 열정" },
  오: { charm: "존재 자체가 뜨겁고 강렬. 근처에 있으면 이상하게 설레는 타입.", weapon: "오화의 뜨거운 기운 — 본능적으로 끌리게 만듦" },
  미: { charm: "부드럽고 감성적인 여름의 끝 기운. 따뜻하게 감싸주는 느낌.", weapon: "포용력과 감성으로 상대를 녹임" },
  신: { charm: "날카로운데 낭만적. 강인한 겉모습 뒤의 섬세한 감수성.", weapon: "예민한 감각과 강인한 기운의 반전 매력" },
  유: { charm: "세련되고 고급스러운 기운. 이성을 자연스럽게 끌어당기는 도화 에너지.", weapon: "유금 도화 — 완성된 아름다움의 기운" },
  술: { charm: "은폐된 강렬한 기운. 겉은 조용하지만 안을 알면 전혀 다른 타입.", weapon: "숨겨진 불꽃 — 알아채는 순간 빠져나오기 어려움" },
  해: { charm: "자유롭고 신비로운 기운. 잡힐 듯 잡히지 않는 매력.", weapon: "깊은 수(水)의 음기와 자유로운 에너지의 조합" },
};

// ── 월간별 외부 이미지 ────────────────────────────────────────────────────────
const WOLGGAN_OUTER: Record<string, string> = {
  갑: "봄의 큰 나무 기운. 사회적으로 진취적이고 리더십 있는 이미지.",
  을: "봄의 덩굴 기운. 부드럽고 친근한 사회적 이미지. 자연스럽게 관계를 맺음.",
  병: "여름의 태양 기운. 밝고 화려한 존재감. 어디서나 눈에 띄는 이미지.",
  정: "여름의 촛불 기운. 따뜻하고 감성적인 이미지. 조용하지만 인상에 남음.",
  무: "중심의 큰 산 기운. 안정적이고 믿음직한 이미지.",
  기: "기름진 땅의 기운. 섬세하고 완성도 높은 이미지. 꼼꼼하고 세심한 인상.",
  경: "가을의 강한 금속 기운. 차갑고 강인한 이미지. 도도하고 당당한 분위기.",
  신: "가을의 보석 기운. 세련되고 고급스러운 이미지. 완벽하게 관리된 인상.",
  임: "겨울의 큰 강물 기운. 신비롭고 깊은 이미지. 자유롭고 예측 불가능한 분위기.",
  계: "겨울의 빗물 기운. 투명하고 청순한 이미지. 순수하고 신비로운 분위기.",
};

// ── 꼬시는 팁 (일간+성별) ────────────────────────────────────────────────────
const SEDUCTION_TIPS: Record<string, { female: string[]; male: string[] }> = {
  갑: {
    female: ["쉽게 주지 말고 쿨하게 — 갑목은 노력해서 얻어야 하는 상대에게 끌림", "힘들 때 조용히 옆에 있어주기 — 든든한 사람에게 약함", "능력·자립심 어필 — 기댈 사람보다 대등한 파트너를 원함"],
    male:   ["보호자처럼 먼저 챙겨주기 — 실질적인 도움", "큰 나무 역할 — 네가 기댈 수 있어 라는 느낌", "좋아한다 직접 말하기 — 모호함은 통하지 않음"],
  },
  을: {
    female: ["먼저 다가오게 만들기 — 고양이처럼 관심 있다 없다 반복", "지성·능력으로 어필 — 을목은 한번 인정하면 완전히 빠짐", "서두르지 말 것 — 느리게 서서히 파고들기"],
    male:   ["여자가 말한 작은 것 기억해서 다음에 언급하기", "가볍게 먼저 챙겨주면 엄청나게 고마워함", "섬세하게 감아드는 방식으로 — 절대 강압적으로 접근하지 말 것"],
  },
  병: {
    female: ["어디에 있어도 가장 밝고 에너지 넘치게 — 병화는 빛나는 곳에 끌림", "같이 있으면 신나는 사람이 돼라", "직접적으로 어필 — 모호한 제스처 통하지 않음"],
    male:   ["웃음이 전염되는 밝은 에너지를 만들어라", "파티나 그룹 자리에서 가장 빛나는 존재가 돼라", "먼저 설레게 하는 대담한 제안 — 망설이지 말 것"],
  },
  정: {
    female: ["단 둘이 있는 조용한 공간에서 진심 어린 대화", "정화는 감성이 통하는 사람에게 마음이 열림", "속 이야기를 털어놓게 만들기 — 비밀 공유가 열쇠"],
    male:   ["특별한 분위기를 만들어라 — 좋은 음식, 조용한 공간", "진심 어린 관심을 표현해라. 과장 없이 진짜로", "감성적인 공감으로 먼저 마음을 연결해라"],
  },
  무: {
    female: ["든든하게 받아주기 — 무토는 기댈 수 있는 사람에게 약함", "힘들 때 가장 먼저 옆에 있어주기", "무토의 말 한마디 한마디를 진지하게 들어주기"],
    male:   ["안정감을 줘라 — 너와 있으면 편안해 라는 느낌", "실질적인 도움을 먼저 제공해라", "힘들 때 해결해주는 능력 있는 사람처럼 보여라"],
  },
  기: {
    female: ["작은 것 하나하나 세심하게 챙겨주기", "기토는 자신을 완벽하게 이해해주는 사람에게 약함", "완벽하게 맞춰주는 게 포인트"],
    male:   ["밥은 먹었어? 같은 작은 챙김부터 시작", "여자가 좋아하는 것을 미리 파악하고 준비해라", "잔소리보다 행동으로 챙겨라"],
  },
  경: {
    female: ["쉽게 주지 말고 잡고 싶게 만들기 — 경금은 도전적인 상대에게 끌림", "능력·당당함 어필 — 나약해 보이면 흥미 잃음", "이유와 함께 직접적으로 어필할 것"],
    male:   ["솔직하고 직접적으로 좋아한다고 표현해라", "강하고 주도적인 이미지를 보여줘라", "모호하게 굴지 말고 확실하게 행동해라"],
  },
  신: {
    female: ["분위기 + 외모 + 향기까지 완벽하게 세팅 — 신금은 디테일에 예민", "기억에 남는 특별한 경험을 만들어줘라", "절대 촌스러운 방식은 통하지 않음"],
    male:   ["낭만적인 연출이 최강 — 꽃, 특별한 장소, 음악", "섬세하고 고급스럽게 대우해줘라", "아름다운 것으로 접근해라 — 음식, 장소, 선물의 격을 올려라"],
  },
  임: {
    female: ["능력과 지성으로 어필 — 임수 여자는 논리와 실력에 끌림", "오글거리는 감성 표현 NO — 직접적이고 담백하게", "한심해 보이는 순간 끝. 단단하고 자기 기준이 있는 사람임을 보여줘라", "진지하게 대화해라 — 농담 따먹기보다 깊은 대화가 통함"],
    male:   ["쉽게 주지 말고 차갑게 — 임수 남자는 쉬운 상대에 흥미를 잃음", "감성 오버는 역효과. 논리적이고 냉정한 매력을 보여줘라", "능력·지성·자기관리를 어필해라 — 한심해 보이는 순간 관심이 끊김", "직접적이고 당당하게 접근. 모호하게 끌면 귀찮아함"],
  },
  계: {
    female: ["취향을 공유하고 감성 교감으로 서서히 파고들기", "계수는 나를 완벽히 이해해주는 사람에게 약함", "감성적인 연결고리를 먼저 만들어라"],
    male:   ["같은 음악, 같은 영화 취향으로 공감대를 만들어라", "감성적으로 공감해줘라 — 내 마음을 다 알아버린다는 느낌", "섬세하게 감각적으로 접근해라"],
  },
};

// ── 등급 ─────────────────────────────────────────────────────────────────────
const GRADES = [
  { min: 86, grade: "S", label: "본능형", color: "#f43f5e", bg: "rgba(244,63,94,0.15)", border: "rgba(244,63,94,0.35)", desc: "치명적인 도화 기운의 소유자. 의도하지 않아도 이성이 먼저 다가옵니다.", oneliner: "근처에 있기만 해도 주변 이성이 흔들립니다." },
  { min: 71, grade: "A", label: "매혹형", color: "#ec4899", bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.30)", desc: "강한 이성 매력을 타고났습니다. 노력하지 않아도 자연스럽게 끌립니다.", oneliner: "이성이 먼저 연락하는 타입입니다." },
  { min: 46, grade: "B", label: "감성형", color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)", desc: "은근하고 깊은 매력입니다. 처음엔 몰랐다가 시간이 지나면서 중독됩니다.", oneliner: "가까워질수록 빠져드는 타입입니다." },
  { min: 21, grade: "C", label: "은은형", color: "#8b5cf6", bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.22)", desc: "도화 기운보다는 인격과 내면에서 매력이 나옵니다.", oneliner: "알면 알수록 좋아지는 타입입니다." },
  { min: 0,  grade: "D", label: "지성형", color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.20)", desc: "타고난 도화 기운은 약하지만, 실력과 능력으로 매력을 만드는 타입입니다.", oneliner: "잘될수록 더 매력적으로 보이는 타입입니다." },
];

function getGrade(score: number) { return GRADES.find(g => score >= g.min) ?? GRADES[GRADES.length - 1]; }

// ── 메인 ─────────────────────────────────────────────────────────────────────
function ErosContent() {
  const router = useRouter();
  const [step, setStep]     = useState<"entry" | "form" | "loading" | "result">("entry");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [year,  setYear]    = useState("");
  const [month, setMonth]   = useState("");
  const [day,   setDay]     = useState("");
  const [birthTime, setBirthTime] = useState<BirthTimeValue>({ hour: null, minute: null, unknown: true, useJajasi: false });
  const resultRef = useRef<SajuResult | null>(null);

  const yearOpts  = YEARS.map(y => ({ v: String(y), label: String(y) }));
  const monthOpts = MONTHS.map(m => ({ v: String(m), label: String(m) }));
  const dayOpts   = DAYS.map(d => ({ v: String(d), label: String(d) }));

  function handleAnalyze() {
    if (!year || !month || !day) return;
    const h = birthTime.unknown ? null : birthTime.hour;
    resultRef.current = analyzeSaju({
      birthYear: parseInt(year), birthMonth: parseInt(month), birthDay: parseInt(day),
      birthHour: h, birthMinute: birthTime.unknown ? null : (birthTime.minute ?? null),
      name: "나", gender,
      birthPlace: "", style: "auto", productType: "report", useJajasi: birthTime.useJajasi,
    });
    setStep("loading");
  }

  // ── 진입 ────────────────────────────────────────────────────────────────
  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#08010f] text-white flex flex-col">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[700px] h-[700px] rounded-full bg-rose-950/40 blur-[160px]" />
          <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-purple-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-rose-900/50 border border-rose-700/40 text-rose-300 text-xs font-bold tracking-wider mb-8">19금</div>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            나의 성적<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-400">매력은?</span>
          </h1>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            홍염살·도화살·목욕으로 보는<br />
            <span className="text-gray-200 font-medium">타고난 이성 매력의 진짜 본질</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            본인도 몰랐던 그 매력 포인트,<br />사주가 이미 다 알고 있습니다
          </p>
          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["성적 매력 등급 S~D", "홍염살·진도화·목욕 기반 점수 + 종합 판정"],
              ["나의 외모 — 일간별", "사주로 보는 내 외모 특징과 분위기"],
              ["나의 성적 능력·에너지", "음기/양기 분석. 일간+일지 기반"],
              ["은근한 매력 — 일지별", "이성이 모르게 빠져드는 나의 포인트"],
              ["이성을 꼬시는 팁", "내 일간에 맞는 맞춤 공략법"],
              ["월주 분석", "사회적으로 드러나는 외부 이미지"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-lg shadow-rose-900/50 transition-all active:scale-[0.98]">
            분석 시작
          </button>
          <button onClick={() => router.push("/")} className="mt-4 text-xs text-gray-600 hover:text-gray-400 transition">돌아가기</button>
        </div>
      </main>
    );
  }

  // ── 폼 ──────────────────────────────────────────────────────────────────
  if (step === "form") {
    const ready = !!year && !!month && !!day;
    return (
      <main className="min-h-screen bg-[#08010f] text-white">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-rose-950/35 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setStep("entry")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 뒤로</button>
            <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">홈으로</button>
          </div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">내 정보 입력</h2>
            <p className="text-gray-500 text-sm">시간을 알면 더 정밀한 분석이 가능합니다</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">내 성별</label>
              <div className="grid grid-cols-2 gap-3">
                {(["male", "female"] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={`py-3 rounded-xl border font-semibold text-sm transition ${gender === g ? "bg-rose-900/50 border-rose-500 text-rose-200" : "bg-white/5 border-white/15 text-gray-400 hover:border-white/30"}`}>
                    {g === "male" ? "남성" : "여성"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">생년월일</label>
              <div className="mb-3"><DropPick value={year} opts={yearOpts} onChange={setYear} placeholder="연도 선택" suffix="년" /></div>
              <div className="grid grid-cols-2 gap-3">
                <DropPick value={month} opts={monthOpts} onChange={setMonth} placeholder="월" suffix="월" />
                <DropPick value={day}   opts={dayOpts}   onChange={setDay}   placeholder="일" suffix="일" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">태어난 시간</label>
              <BirthTimePicker value={birthTime} onChange={setBirthTime} accent="violet" />
            </div>
            <button onClick={handleAnalyze} disabled={!ready}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] ${ready ? "bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-lg shadow-rose-900/40" : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"}`}>
              분석 시작
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── 로딩 ────────────────────────────────────────────────────────────────
  if (step === "loading") {
    return <AnalysisLoading subject="나의 성적 매력" duration={2800} onDone={() => setStep("result")} />;
  }

  // ── 결과 ────────────────────────────────────────────────────────────────
  const result = resultRef.current;
  if (!result) return null;

  const hasSinsal = (n: string) => result.sinsalList.some(s => s.name === n);
  const has도화   = hasSinsal("도화살");
  const has홍염   = hasSinsal("홍염살");
  const has진도화  = hasSinsal("진도화");
  const has역마   = hasSinsal("역마살");
  const hasMokYok = result.pillarsDetail.day.uunseong === "목욕";
  const haHwa     = result.dominant.includes("화");

  // 음간(을·정·기·신·계) = 음기 강함
  const 음간목록 = ["을","정","기","신","계"];
  const ilganForScore = result.pillarsDetail.day.cg;
  const is음간 = 음간목록.includes(ilganForScore);
  // 수기운 점수: 수 오행 포함 기둥 수 (임·계 천간, 자·해 지지 포함)
  const 수기운천간 = ["임","계"];
  const 수기운지지 = ["자","해","축"];
  const pd = result.pillarsDetail;
  const 수기운기둥수 = [pd.year, pd.month, pd.day, pd.time].filter(p =>
    수기운천간.includes(p.cg) || 수기운지지.includes(p.jj)
  ).length;
  const has수기운강 = 수기운기둥수 >= 2 || result.dominant.includes("수");

  let rawScore = 0;
  if (has홍염)   rawScore += 30;
  if (has진도화) rawScore += 25;
  if (has도화)   rawScore += 20;
  if (hasMokYok) rawScore += 25;
  if (has역마)   rawScore += 10;
  if (haHwa)     rawScore += 10;
  // 여성: 수기운·음간·음기 보너스 (명기력)
  if (gender === "female") {
    if (has수기운강) rawScore += 15;
    if (is음간)      rawScore += 10;
  }
  const score = Math.min(rawScore, 100);

  const grade  = getGrade(score);
  const ilgan  = result.pillarsDetail.day.cg;
  const ilji   = result.pillarsDetail.day.jj;
  const wolggan = result.pillarsDetail.month.cg;
  const app    = ILGAN_APPEARANCE[ilgan] ?? ILGAN_APPEARANCE["무"];
  const sex    = ILGAN_SEX[ilgan] ?? ILGAN_SEX["무"];
  const sexData = gender === "female" ? sex.female : sex.male;
  const hidden = ILJI_HIDDEN_CHARM[ilji] ?? { charm: "알면 알수록 빠져드는 매력", weapon: "깊은 내면의 에너지" };
  const tips   = SEDUCTION_TIPS[ilgan] ?? SEDUCTION_TIPS["무"];
  const tipList = gender === "female" ? tips.female : tips.male;
  const outerImage = WOLGGAN_OUTER[wolggan] ?? "사회적으로 안정적이고 신뢰감 있는 이미지.";

  const charmSinsals: { name: string; desc: string }[] = [];
  if (has진도화) charmSinsals.push({ name: "진도화(眞桃花)", desc: "일지 기준 진짜 도화. 이성이 먼저 다가오는 강한 기운입니다." });
  if (has홍염)   charmSinsals.push({ name: "홍염살(紅艶殺)", desc: "색정적 매력이 강합니다. 이성이 본능적으로 끌리는 기운입니다." });
  if (has도화)   charmSinsals.push({ name: "도화살(桃花殺)", desc: "자연스럽게 이성을 끌어당기는 에너지입니다." });
  if (hasMokYok) charmSinsals.push({ name: `일지 목욕(沐浴) — ${ilji}`, desc: "12운성 중 감각과 관능이 가장 강한 위치입니다." });

  const targetGender = gender === "female" ? "남자" : "여자";

  return (
    <main className="min-h-screen bg-[#08010f] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full blur-[140px]" style={{ backgroundColor: grade.color + "18" }} />
        <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-purple-950/20 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
        {/* 네비 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setStep("form")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 다시 입력</button>
          <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">홈으로</button>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-block px-2 py-0.5 rounded-full bg-rose-900/40 border border-rose-700/30 text-rose-400 text-[10px] font-bold tracking-wider mb-2">19금</div>
          <h2 className="text-3xl font-black mb-1">{ilgan}{ilji}일주</h2>
          <p className="text-gray-600 text-xs">{result.fourPillars}</p>
        </div>

        {/* ① 성적 매력 등급 */}
        <div className="rounded-2xl p-5 mb-4 border" style={{ backgroundColor: grade.bg, borderColor: grade.border }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-bold tracking-widest mb-1 block" style={{ color: grade.color }}>성적 매력 등급</span>
              <span className="text-4xl font-black" style={{ color: grade.color }}>{grade.grade}등급</span>
              <span className="text-lg font-bold ml-2" style={{ color: grade.color }}>{grade.label}</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: grade.color }}>{score}점</p>
              <p className="text-xs text-gray-500">/ 100</p>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 mb-3">
            <div className="h-full rounded-full" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${grade.color}, #a855f7)` }} />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{grade.desc}</p>
          <p className="text-sm font-bold mt-2" style={{ color: grade.color }}>→ {grade.oneliner}</p>
        </div>

        {/* ② 나의 외모 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">나의 외모 — {ilgan}일간</p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold mb-1">이목구비·인상</p>
              <p className="text-sm text-gray-200">{app.face}</p>
            </div>
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold mb-1">체형·실루엣</p>
              <p className="text-sm text-gray-200">{app.body}</p>
            </div>
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold mb-1">전체 분위기</p>
              <p className="text-sm text-gray-200">{app.vibe}</p>
            </div>
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold mb-1">비슷한 분위기 연예인</p>
              <p className="text-sm font-semibold" style={{ color: grade.color }}>{app.celeb}</p>
            </div>
          </div>
        </div>

        {/* ③ 나의 성적 능력·에너지 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">나의 성적 에너지 — {ilgan}{ilji}일주</p>
          <p className="text-xs text-rose-400/70 mb-4">{gender === "female" ? "여성 기준 음기(陰氣) 분석" : "남성 기준 양기(陽氣) 분석"}</p>
          <div className="space-y-3">
            <div className="bg-rose-950/20 border border-rose-900/20 rounded-xl px-4 py-3">
              <p className="text-xs text-rose-400 font-semibold mb-1">{gender === "female" ? "음기 특성" : "양기 특성"}</p>
              <p className="text-sm text-gray-200">{sexData.power}</p>
            </div>
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold mb-1">에너지 성질</p>
              <p className="text-sm text-gray-200">{sexData.energy}</p>
            </div>
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold mb-1">스타일</p>
              <p className="text-sm text-gray-200">{sexData.style}</p>
            </div>
          </div>
          {hasMokYok && (
            <div className="mt-3 bg-rose-950/30 border border-rose-700/30 rounded-xl px-4 py-3">
              <p className="text-xs text-rose-300 font-bold mb-1">일지 목욕(沐浴) — 특별 분석</p>
              <p className="text-xs text-gray-400">12운성 중 감각과 관능이 가장 강한 위치. {gender === "female" ? "음기가 극도로 풍부하며 이성이 본능적으로 끌립니다." : "양기가 강하고 이성을 끌어당기는 에너지가 있습니다."}</p>
            </div>
          )}
          {gender === "female" && has수기운강 && (
            <div className="mt-3 bg-blue-950/30 border border-blue-700/30 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-300 font-bold mb-1">수기운(水氣運) — 명기력(命氣力) 강화</p>
              <p className="text-xs text-gray-400">수(水)는 흡인·수용·생식의 기운입니다. 이 기운이 강한 여성은 상대를 깊이 끌어당기는 자기장 같은 매력이 있습니다. 몸의 에너지가 농밀하고 관계에서 상대가 벗어나기 어렵습니다.</p>
            </div>
          )}
          {gender === "female" && is음간 && (
            <div className="mt-3 bg-purple-950/30 border border-purple-700/30 rounded-xl px-4 py-3">
              <p className="text-xs text-purple-300 font-bold mb-1">음간(陰干) — 음기(陰氣) 집중형</p>
              <p className="text-xs text-gray-400">음간 일간은 수용·집중·흡수의 기운이 강합니다. 겉으로는 조용해 보여도 내면에 강한 음기가 모여있어, 관계에서 상대가 의존하게 되는 흡인력이 자연스럽게 발산됩니다.</p>
            </div>
          )}
        </div>

        {/* ④ 은근한 매력 (일지) */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">은근한 매력 — {ilji}일지</p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold mb-1">이성이 모르게 빠져드는 이유</p>
              <p className="text-sm text-gray-200">{hidden.charm}</p>
            </div>
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold mb-1">나의 은밀한 무기</p>
              <p className="text-sm font-semibold" style={{ color: grade.color }}>{hidden.weapon}</p>
            </div>
          </div>
        </div>

        {/* ⑤ 월주 분석 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">월주 분석 — {result.pillarsDetail.month.cg}{result.pillarsDetail.month.jj}월주</p>
          <p className="text-xs text-gray-600 mb-3">사회적으로 드러나는 외부 이미지</p>
          <p className="text-sm text-gray-300 leading-relaxed">{outerImage}</p>
        </div>

        {/* ⑥ 도화 신살 */}
        {charmSinsals.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">사주 속 도화 기운</p>
            <div className="space-y-3">
              {charmSinsals.map(({ name, desc }) => (
                <div key={name} className="flex items-start gap-3 bg-rose-950/20 border border-rose-900/25 rounded-xl px-4 py-3">
                  <span className="text-rose-400 text-sm mt-0.5 shrink-0">●</span>
                  <div>
                    <p className="text-sm font-bold text-rose-300">{name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⑦ 꼬시는 팁 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">{targetGender}를 꼬시는 법</p>
          <p className="text-xs text-gray-600 mb-4">{ilgan}일간 맞춤 공략법</p>
          <div className="space-y-2">
            {tipList.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-rose-400 font-black text-sm shrink-0">{i + 1}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 면책 */}
        <div className="bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3 mb-6">
          <p className="text-xs text-gray-600 leading-relaxed text-center">
            본 분석은 사주 명리학 기반 19금 엔터테인먼트 콘텐츠입니다.<br />
            만 19세 이상만 이용하세요.
          </p>
        </div>

        <button onClick={() => { setYear(""); setMonth(""); setDay(""); setStep("form"); }}
          className="w-full py-3.5 rounded-2xl font-bold text-sm border border-rose-700/40 text-rose-400 hover:bg-rose-950/30 transition-all">
          다시 분석하기
        </button>
      </div>
    </main>
  );
}

export default function ErosPage() {
  return <AdultGate><ErosContent /></AdultGate>;
}
