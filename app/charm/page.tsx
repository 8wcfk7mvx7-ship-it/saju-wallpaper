"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import { loadSajuData, saveSajuData } from "@/lib/savedSaju";
import BirthTimePicker, { BirthTimeValue } from "@/components/BirthTimePicker";

// ─── 일간별 매력 데이터 ──────────────────────────────────────────────────────
const ILGAN_DATA: Record<string, {
  type: "남들이 먼저 알아보는 매력" | "조용히 중독시키는 매력" | "은근히 오래 남는 매력";
  typeColor: string;
  firstImpression: string;
  coreMagic: string;
  hiddenMagic: string;
  appearance: string;
  celebs: string;
  realSelf: string;   // 찐친이 보게 되는 실체 (블러)
  fatalFlaw: string;  // 치명적 약점 (블러)
  attractedType: string; // 나한테 끌리는 이성 (블러)
  summary: string;
}> = {
  갑: {
    type: "남들이 먼저 알아보는 매력",
    typeColor: "#4ade80",
    firstImpression: "이상하게 단정하고 반듯한 분위기. 처음 보면 왠지 믿음이 가는 느낌. 말 한마디 하지 않아도 '이 사람 뭔가 있다'는 느낌을 줍니다.",
    coreMagic: "큰 나무처럼 서 있기만 해도 사람이 모입니다. 본인은 뭘 했는지 모르는데 주변에서 먼저 기대고 싶어하는 타입. 존재 자체가 주는 안정감.",
    hiddenMagic: "처음엔 좀 딱딱해 보이는데 실은 의리가 장난 아님. 한번 내 사람이라 생각하면 끝까지 챙기는 타입. 이게 진짜 매력.",
    appearance: "이목구비가 반듯하고 키가 크거나 체격이 좋은 편. 나무처럼 곧고 단정한 인상.",
    celebs: "원빈, 공유, 이병헌 등 '믿음직한 미남' 스타일",
    realSelf: "완고함의 끝판왕. 내 방식대로 하려는 고집이 엄청남. 틀렸다고 생각해도 먼저 인정하는 걸 극도로 싫어함. 가까워질수록 '왜 저래?' 싶은 순간이 옴.",
    fatalFlaw: "융통성이 없어서 관계에서 벽을 만들 때가 많음. 감정 표현이 적어서 좋아해도 티가 잘 안 남. 이게 상대방한테 차갑게 느껴지는 경우가 많음.",
    attractedType: "을목(乙木), 계수(癸水) 일간. 부드럽고 섬세한 타입에게 끌림. 강한 것끼리는 안 됨.",
    summary: "큰 나무형. 존재만으로 사람을 끌어당김.",
  },
  을: {
    type: "조용히 중독시키는 매력",
    typeColor: "#a3e635",
    firstImpression: "여리여리한데 은근 사람 신경 쓰이게 만드는 타입. 약해 보이지만 덩굴처럼 한번 감기면 못 빠져나옴.",
    coreMagic: "처음엔 그냥 평범해 보임. 근데 자꾸 생각남. 내 주변 사람이라고 생각한 순간 은근히 놓아주지 않는 집요한 애정이 진짜 매력.",
    hiddenMagic: "언제 이렇게 친해졌지? 싶을 만큼 자연스럽게 파고드는 능력이 있음. 강요하지 않는데 어느새 가장 가까운 사람이 되어있음.",
    appearance: "갸날프고 여성스러운 인상. 꽃처럼 섬세하고 아기자기한 분위기. 자연스러운 매력이 있음.",
    celebs: "아이유, 한지민, 손예진 스타일의 자연스럽고 친근한 미모",
    realSelf: "절대 안 꺾임. 겉은 부드러운데 속은 강철. 자기 싫어하는 사람한테는 냉정하고 차갑게 돌변함. 질투심이 생각보다 훨씬 강함.",
    fatalFlaw: "집착이 생길 수 있음. 내 사람한테 너무 감기면서 상대가 숨막혀 하는 경우가 있음. 섭섭함을 직접 말 못하고 쌓아두다 터뜨림.",
    attractedType: "갑목(甲木), 경금(庚金) 일간. 강하고 리더십 있는 타입에게 끌림.",
    summary: "덩굴형. 부드럽지만 한번 감기면 못 빠져나옴.",
  },
  병: {
    type: "남들이 먼저 알아보는 매력",
    typeColor: "#fb923c",
    firstImpression: "가만히 있어도 존재감이 강함. 방에 들어오는 순간 분위기가 달라지는 타입. 시선을 끄는 사람들이 많음.",
    coreMagic: "태양처럼 주변을 밝힘. 같이 있으면 자동으로 기분이 좋아지는 타입. 솔직하고 뒤가 없어서 의외로 깊이 믿게 됨.",
    hiddenMagic: "엄청난 에너지로 주변 사람을 충전시킴. 이 사람 앞에서는 이상하게 말이 많아지고 웃게 됨. 이게 진짜 병화의 무기.",
    appearance: "이목구비가 뚜렷하고 눈빛이 강함. 태양처럼 밝고 선명한 인상. 피부가 맑은 경우 많음.",
    celebs: "이효리, 김종국, 강호동 스타일의 카리스마 있는 존재감",
    realSelf: "자기중심적. 모든 관심이 나한테 집중되길 원함. 지루함을 못 참음. 새로운 자극이 없으면 빠르게 식음. 찐친한테는 에너지가 넘치다 못해 피곤할 수 있음.",
    fatalFlaw: "타인의 감정을 놓치는 경우가 있음. 너무 밝아서 상대방의 어두운 면을 못 보거나 외면하는 경향. 꾸준함보다 순간 불꽃이 강한 타입.",
    attractedType: "임수(壬水), 계수(癸水) 일간. 차분하고 깊은 타입이 병화의 불꽃을 안정시켜 줌.",
    summary: "태양형. 가만히 있어도 주변이 밝아짐.",
  },
  정: {
    type: "은근히 오래 남는 매력",
    typeColor: "#f97316",
    firstImpression: "조용해 보이는데 은근 분위기 예쁜 사람 많음. 처음엔 몰랐는데 계속 눈이 가는 타입.",
    coreMagic: "촛불처럼 가까이 갈수록 따뜻함. 내 이야기를 가장 잘 들어주는 사람. 비밀을 털어놓고 싶어지는 느낌.",
    hiddenMagic: "평소엔 조용하고 예의 바른데 친해지면 완전히 다른 사람이 됨. 속에 품고 있는 진짜 재미있는 면이 있음. 이게 사람들을 더 빠져들게 함.",
    appearance: "부드럽고 서정적인 분위기. 눈빛이 촉촉하고 깊은 인상. 사람을 끌어당기는 눈이 특징.",
    celebs: "박보영, 유인나 스타일의 은근하고 분위기 있는 매력",
    realSelf: "찐친한테는 갑작스러운 감정 폭발 주의. 평소엔 예의 바른데 스트레스받으면 날카롭게 변함. 정화(촛불)에게 계수(빗물)는 언제 내 불을 꺼뜨릴지 모르는 공포이자 강박.",
    fatalFlaw: "감정 기복이 있을 때 주변을 힘들게 함. 상처받으면 속으로 삭히다가 어느날 갑자기 냉각됨. 서운함을 직접 말하지 않는 경향.",
    attractedType: "갑목(甲木), 무토(戊土) 일간. 안정적이고 든든한 타입이 정화를 편안하게 해줌.",
    summary: "촛불형. 가까이 갈수록 따뜻해지는 은은한 매력.",
  },
  무: {
    type: "남들이 먼저 알아보는 매력",
    typeColor: "#d97706",
    firstImpression: "묵직하고 든든한 느낌 강함. 가까이 있으면 이상하게 안정감 주는 타입. 처음 만나도 편안한 느낌이 드는 사람.",
    coreMagic: "큰 산처럼 움직이지 않는 믿음직함. 모든 걸 품어주는 포용력. 이 사람 옆에 있으면 아무 걱정이 없어짐.",
    hiddenMagic: "딱딱해 보이는데 갑자기 터지는 유머. 주변 사람들이 전혀 예상 못하고 뒤집어짐. 이 반전이 엄청난 매력 포인트.",
    appearance: "체격이 있거나 중후한 인상. 둥글고 후덕한 분위기. 산처럼 안정적인 외모.",
    celebs: "김수현, 차인표 스타일의 믿음직한 남성미 / 김혜수, 김태리 같은 품격 있는 분위기",
    realSelf: "한번 결정하면 절대 안 바꾸는 완강함. 소화불량이 잦은 이유가 있음 - 혼자 다 품고 삭힘. 가까운 사람한테 집착에 가까운 집중도를 보임.",
    fatalFlaw: "융통성이 없어서 변화를 극도로 싫어함. 관계에서 주도권을 잃는 것을 무의식적으로 두려워함. 표현이 부족해서 상대가 외로움을 느끼는 경우.",
    attractedType: "임수(壬水), 을목(乙木) 일간. 흘러가는 물처럼 유연하고 자유로운 타입에게 끌림.",
    summary: "큰산형. 존재 자체가 안정감과 신뢰감.",
  },
  기: {
    type: "조용히 중독시키는 매력",
    typeColor: "#ca8a04",
    firstImpression: "편안하고 무해한 분위기 강한 사람 많음. 특별히 눈에 띄진 않는데 은근 오래 기억 남는 타입.",
    coreMagic: "넓은 대지처럼 모든 걸 품어주는 포용력. 작은 것들을 세심하게 챙겨주는 게 쌓여서 깊이 믿게 됨. 나도 모르게 자꾸 연락하게 되는 타입.",
    hiddenMagic: "처음엔 평범해 보이는데 알면 알수록 매력 발견됨. '이 사람 이런 면도 있었어?' 하는 반전이 계속 나옴. 이게 중독의 비밀.",
    appearance: "계란형 또는 둥근 얼굴. 고급지고 담백한 피부결. 편안하고 자연스러운 인상.",
    celebs: "신민아, 전도연 스타일의 자연스럽고 기품 있는 분위기",
    realSelf: "걱정이 너무 많고, 가까워지면 잔소리가 늘어남. 전부 상대를 위한 마음인데 부담이 될 때 있음. 완벽한 척 하지만 내면은 불안감이 강함.",
    fatalFlaw: "우유부단함. 결단을 내리기 어려워함. 좋은 게 좋은 거라고 회피하다가 관계가 애매해지는 경우.",
    attractedType: "병화(丙火), 임수(壬水) 일간. 에너지가 넘치고 방향을 제시해주는 타입.",
    summary: "대지형. 편안하지만 알면 알수록 깊어지는 매력.",
  },
  경: {
    type: "조용히 중독시키는 매력",
    typeColor: "#a78bfa",
    firstImpression: "차갑고 시크한 느낌 있는데, 가까워지면 의외로 정이 많음. 처음엔 좀 어렵게 느껴지는 타입.",
    coreMagic: "이목구비가 날카롭고 정제됨. T존이 뚜렷한 서구적인 인상. 금속처럼 단단하고 정제된 것들에서 나오는 차가운 매력.",
    hiddenMagic: "칼처럼 직선적인 말 속에 진심이 담겨있음. 할 말은 하지만 내 사람은 어떻게든 지켜주는 의리. 이게 사람들을 무장해제 시킴.",
    appearance: "날카롭고 정제된 이목구비. T존이 뚜렷하고 골격이 있는 서구적인 미인.",
    celebs: "전지현, 이정재, 수지 스타일의 차갑고 세련된 도시 매력",
    realSelf: "감정 표현이 서툴러서 상처를 주는 경우가 많음. 본인은 아무렇지도 않게 한 말이 상대방한테는 비수가 됨. 완벽주의라 주변 사람들을 힘들게 함.",
    fatalFlaw: "차갑게 잘라내는 능력이 너무 발달함. 관계를 정리할 때 쿨하게 끝내는데 이게 상대방한테 큰 상처를 남김.",
    attractedType: "을목(乙木), 정화(丁火) 일간. 부드럽고 따뜻한 타입이 경금의 차가움을 녹여줌.",
    summary: "조각도형. 차갑지만 가까워지면 진심이 나옴.",
  },
  신: {
    type: "조용히 중독시키는 매력",
    typeColor: "#c4b5fd",
    firstImpression: "도도해 보이는데 은근 사람 홀리는 분위기 있는 타입. '저 사람 나한테 관심 있나?' 계속 생각하게 만드는 타입.",
    coreMagic: "V라인 턱선에 눈매가 보석처럼 반짝이는 섬세하고 정교한 인상. 완벽주의적인 세심함이 상대방을 특별하게 느끼게 함.",
    hiddenMagic: "아무나 안 친해지는데 내 사람이 되면 엄청나게 챙겨줌. 이 독점적인 애정이 중독적으로 느껴짐.",
    appearance: "섬세하고 정교한 미인. V라인 턱선, 눈매가 반짝이는 인상. 보석 같은 분위기.",
    celebs: "김태희, 민효린 스타일의 세련되고 도도한 귀한 미인",
    realSelf: "예민함의 극치. 작은 것에도 상처받는 유리멘탈. 완벽주의라서 자기 자신도 힘들고 주변도 힘듦. 본인이 정한 기준에서 벗어나면 참지 못함.",
    fatalFlaw: "고집이 은근 셈. 소신이 강해서 내 기준에 안 맞으면 쉽게 사람을 재단함. 오래 알수록 차갑게 느껴질 수 있음.",
    attractedType: "병화(丙火), 갑목(甲木) 일간. 화력이 있고 활발한 타입이 신금을 녹여줌.",
    summary: "보석형. 가까이 보면 반짝이는 섬세한 매력.",
  },
  임: {
    type: "남들이 먼저 알아보는 매력",
    typeColor: "#38bdf8",
    firstImpression: "신비롭고 자유로운 느낌 강함. 생각보다 감수성 깊은 사람 많음. 어디서든 자연스럽게 녹아드는 타입.",
    coreMagic: "바다처럼 깊고 넓은 포용력. 어디서든 자연스럽게 적응하고 어떤 사람과도 통하는 유연함. 옆에 있으면 세상이 넓어지는 느낌.",
    hiddenMagic: "아무한테나 다 맞춰주는 것 같은데 실은 진짜 마음을 안 보여줌. 이 미스터리함이 사람들을 자꾸 파고들게 만듦.",
    appearance: "맑은 피부, 촉촉하고 깊은 눈빛. 자연스럽고 청순한 분위기. 물처럼 유연한 이미지.",
    celebs: "한효주, 공효진 스타일의 자연스럽고 신비로운 매력",
    realSelf: "감정의 변덕이 있음. 한번 흥미를 잃으면 갑자기 완전히 사라져버리는 타입. 가까운 사람한테도 진짜 속을 잘 안 보여줌. 이 불가사의함이 상대방을 불안하게 만들기도 함.",
    fatalFlaw: "결정적 순간에 도망가는 경향. 깊어질수록 두려움이 생겨 거리를 두거나 흘러가버림. 책임보다 자유를 선호하는 경향.",
    attractedType: "무토(戊土), 기토(己土) 일간. 안정적이고 변하지 않는 타입이 임수를 붙잡아줌.",
    summary: "바다형. 넓고 자유롭지만 깊이는 아무도 모름.",
  },
  계: {
    type: "조용히 중독시키는 매력",
    typeColor: "#67e8f9",
    firstImpression: "맑고 조용한데 묘하게 계속 신경 쓰이는 분위기. '저 사람 무슨 생각하고 있을까' 자꾸 궁금해지는 타입.",
    coreMagic: "촉촉하고 깊은 눈빛. 자연스러운 청순미. 말이 없는데 그냥 옆에 있고 싶어지는 묘한 분위기. 비처럼 스며드는 매력.",
    hiddenMagic: "누구에게나 맑고 투명하게 대하는 것 자체가 희귀함. 이 순수함이 사람들을 자꾸 챙겨주고 싶게 만듦.",
    appearance: "맑은 피부, 촉촉한 눈빛. 동안에 자연스러운 청순미. 물방울처럼 맑고 투명한 인상.",
    celebs: "김고은, 박소담 스타일의 맑고 깊은 감성 미인",
    realSelf: "의외의 고집과 날카로운 관찰력. 조용해 보이는데 사람을 꿰뚫어보는 눈이 있음. 본인이 상처받으면 표현 없이 완전히 닫아버림. 이때 어떻게 해도 안 열림.",
    fatalFlaw: "소극적이어서 원하는 걸 못 얻는 경우가 많음. 기다리는 데 익숙해져서 먼저 다가가지 않음. 이게 인연을 놓치게 만드는 경우.",
    attractedType: "병화(丙火), 무토(戊土) 일간. 먼저 다가오고 에너지가 넘치는 타입.",
    summary: "빗물형. 조용히 스며들어 촉촉하게 남는 매력.",
  },
};

// ─── 오행별 외모 특징 ────────────────────────────────────────────────────────
const OHAENG_LOOK: Record<string, { look: string; celebs: string }> = {
  목: { look: "갸름하고 긴 얼굴형. 키가 크거나 체형이 날렵함. 이목구비가 선명하고 활기 있는 인상.", celebs: "임시완, 공유 / 아이유, 한지민" },
  화: { look: "이목구비가 뚜렷하고 눈빛이 강렬함. 피부가 맑고 전체적으로 선명한 인상. 표정이 풍부함.", celebs: "이효리, 강호동 / 박보영, 유인나" },
  토: { look: "계란형 또는 둥근 얼굴. 고급지고 담백한 피부결. 편안하고 품격 있는 자연스러운 인상.", celebs: "차인표, 이서진 / 김혜수, 김태리, 신민아" },
  금: { look: "날카롭고 정제된 이목구비. 샤프하고 세련된 도시 느낌. 뼈대가 있고 각진 분위기.", celebs: "이정재, 손현주 / 전지현, 수지, 김태희, 민효린" },
  수: { look: "맑은 피부, 촉촉하고 깊은 눈빛. 자연스러운 분위기. 나이 들어도 동안인 경우 많음.", celebs: "공유, 황정민 / 한효주, 김고은, 김아중" },
};

// ─── 상수 ────────────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEARS  = Array.from({ length: CURRENT_YEAR - 1919 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

interface FormState {
  name: string; gender: "male" | "female";
  birthYear: string; birthMonth: string; birthDay: string;
  birthTime: BirthTimeValue;
  birthPlace: string;
}

function DropdownPicker({ value, options, onChange, placeholder, suffix }: {
  value: string; options: Array<{ v: string; label: string }>;
  onChange: (v: string) => void; placeholder: string; suffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const display = options.find(o => o.v === value)?.label ?? "";
  return (
    <div className="relative w-full">
      <div onClick={() => setOpen(!open)}
        className={`flex items-center justify-between bg-white/5 border rounded-xl px-4 py-3 cursor-pointer transition select-none ${open ? "border-violet-500" : "border-white/10 hover:border-violet-500/50"}`}>
        <span className={display ? "text-white" : "text-gray-600"}>{display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}</span>
        <span className={`text-gray-500 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-[#12121e] border border-white/20 rounded-xl overflow-y-auto shadow-2xl" style={{ maxHeight: "200px" }}>
          {options.map(opt => (
            <div key={opt.v} onClick={() => { onChange(opt.v); setOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer ${value === opt.v ? "text-violet-300 bg-violet-900/50 font-semibold" : "text-gray-300 hover:bg-white/8"}`}>
              {opt.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 매인 컴포넌트 ────────────────────────────────────────────────────────────
export default function CharmPage() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "result">("entry");
  const [showBtn, setShowBtn] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [blurRemoved, setBlurRemoved] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "", gender: "female",
    birthYear: "", birthMonth: "", birthDay: "",
    birthTime: { hour: 12, minute: 30, unknown: false, useJajasi: false },
    birthPlace: "서울",
  });
  const [result, setResult] = useState<ReturnType<typeof analyzeSaju> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowBtn(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const saved = loadSajuData();
    if (saved) {
      setHasSaved(true);
      setForm(prev => ({
        ...prev,
        name: saved.name || "",
        gender: saved.gender || "female",
        birthYear: saved.birthYear ? String(saved.birthYear) : "",
        birthMonth: saved.birthMonth ? String(saved.birthMonth) : "",
        birthDay: saved.birthDay ? String(saved.birthDay) : "",
        birthTime: {
          hour: saved.birthHour ?? 12,
          minute: saved.birthMinute ?? 30,
          unknown: saved.birthHourUnknown || false,
          useJajasi: saved.useJajasi || false,
        },
        birthPlace: saved.birthPlace || "서울",
      }));
    }
  }, []);

  const yearOpts  = YEARS.map(y => ({ v: String(y), label: String(y) }));
  const monthOpts = MONTHS.map(m => ({ v: String(m), label: String(m) }));
  const dayOpts   = DAYS.map(d => ({ v: String(d), label: String(d) }));

  const handleAnalyze = () => {
    const y = parseInt(form.birthYear), mo = parseInt(form.birthMonth), d = parseInt(form.birthDay);
    if (!form.name || isNaN(y) || isNaN(mo) || isNaN(d)) {
      alert("이름과 생년월일을 모두 입력해주세요.");
      return;
    }
    const h = form.birthTime.unknown ? null : form.birthTime.hour;
    const min = form.birthTime.unknown ? null : form.birthTime.minute;
    saveSajuData({ name: form.name, gender: form.gender, birthYear: y, birthMonth: mo, birthDay: d, birthHour: h, birthMinute: min, birthHourUnknown: form.birthTime.unknown, birthPlace: form.birthPlace, style: "auto", useJajasi: form.birthTime.useJajasi });
    const r = analyzeSaju({ birthYear: y, birthMonth: mo, birthDay: d, birthHour: h, birthMinute: min, name: form.name, gender: form.gender, birthPlace: form.birthPlace, style: "auto", productType: "report", useJajasi: form.birthTime.useJajasi });
    setResult(r);
    setBlurRemoved(false);
    setStep("result");
  };

  // ── 엔트리 ───────────────────────────────────────────────────────────────
  if (step === "entry") return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <button onClick={() => router.push("/")} className="fixed top-5 left-5 z-20 text-xs text-gray-700 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-pink-900/25 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-900/20 blur-[130px]" />
      </div>
      <div className="relative z-10 max-w-md w-full text-center">
        <FadeIn delay={0}><div className="text-5xl mb-14 drop-shadow-[0_0_40px_rgba(244,114,182,0.6)]">✨</div></FadeIn>
        <div className="space-y-4 mb-14">
          {[
            { t: "저 사람은 왜 저렇게", big: false, delay: 200 },
            { t: "이성에게 잘 보이는 걸까?", big: true, delay: 700 },
            { t: "타고난 거 맞습니다. 사주에 있어요.", big: false, delay: 1400 },
            { t: "당신 사주에도 분명히 있습니다.", big: true, delay: 1900 },
          ].map((l, i) => (
            <FadeIn key={i} delay={l.delay}>
              <p className={`leading-snug ${l.big ? "text-3xl font-black bg-gradient-to-r from-pink-300 via-violet-200 to-indigo-300 bg-clip-text text-transparent" : "text-xl text-gray-400"}`}>{l.t}</p>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={2400}>
          <p className="text-sm text-gray-600 mb-10">도화살·홍염살 서열 · 일간 매력 · 찐친이 보는 내 실체 · 무료</p>
        </FadeIn>
        <div style={{ opacity: showBtn ? 1 : 0, transform: showBtn ? "none" : "translateY(20px) scale(0.96)", transition: "opacity 0.7s, transform 0.7s cubic-bezier(0.22,1,0.36,1)" }}>
          <button onClick={() => setStep("form")}
            className="w-full max-w-xs mx-auto block bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-bold py-5 px-10 rounded-2xl text-lg shadow-2xl shadow-pink-900/50 transition-all active:scale-[0.97]">
            {hasSaved ? "✓ 내 사주로 바로 분석" : "내 매력 서열 확인하기"}
          </button>
          <p className="text-xs text-gray-700 mt-4">{hasSaved ? "저장된 사주로 바로 시작 — 소름 주의" : "무료 · 1분 완성 · 찐친한테 공유 필수 👁️"}</p>
        </div>
      </div>
    </main>
  );

  // ── 폼 ──────────────────────────────────────────────────────────────────
  if (step === "form") return (
    <main className="min-h-screen bg-[#080810] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[700px] h-[700px] rounded-full bg-pink-900/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep("entry")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 처음으로</button>
          {hasSaved && <span className="text-xs text-pink-400/70 bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-full">✓ 저장된 사주 불러옴</span>}
        </div>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 drop-shadow-[0_0_30px_rgba(244,114,182,0.5)]">✨</div>
          <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-pink-300 via-violet-200 to-indigo-300 bg-clip-text text-transparent">사주 매력 분석</h1>
          <p className="text-gray-400 text-sm">일간 매력 · 신살 · 오행 외모 · 찐친이 보는 실체</p>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-7 space-y-6 shadow-2xl shadow-black/40">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
            <input type="text" placeholder="홍길동" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">성별</label>
            <div className="flex gap-3">
              {[{ v: "female", l: "여성" }, { v: "male", l: "남성" }].map(g => (
                <button key={g.v} type="button" onClick={() => setForm({ ...form, gender: g.v as "male" | "female" })}
                  className={`flex-1 py-3 rounded-xl border transition font-medium ${form.gender === g.v ? "bg-violet-600 border-violet-500" : "bg-white/5 border-white/10 text-gray-400"}`}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">생년월일 (양력)</label>
            <div className="mb-3">
              <DropdownPicker value={form.birthYear} options={yearOpts} onChange={v => setForm({ ...form, birthYear: v })} placeholder="연도 선택" suffix="년" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DropdownPicker value={form.birthMonth} options={monthOpts} onChange={v => setForm({ ...form, birthMonth: v })} placeholder="월 선택" suffix="월" />
              <DropdownPicker value={form.birthDay} options={dayOpts} onChange={v => setForm({ ...form, birthDay: v })} placeholder="일 선택" suffix="일" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">태어난 시간</label>
            <BirthTimePicker value={form.birthTime} onChange={bt => setForm({ ...form, birthTime: bt })} accent="violet" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">태어난 도시</label>
            <input type="text" placeholder="서울 / 부산 / 대구 등" value={form.birthPlace} onChange={e => setForm({ ...form, birthPlace: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition" />
          </div>
          <button onClick={handleAnalyze}
            className="w-full bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] text-lg shadow-lg shadow-pink-900/40">
            ✨ 내 숨은 매력 분석하기
          </button>
        </div>
      </div>
    </main>
  );

  // ── 결과 ──────────────────────────────────────────────────────────────────
  if (!result) return null;

  const ilgan = result.pillarsDetail.day.cg;
  const idata = ILGAN_DATA[ilgan];
  const dominantEl = result.dominant[0] || "토";
  const olook = OHAENG_LOOK[dominantEl];

  const hasDohwa = result.sinsalList.some(s => s.name.includes("도화"));
  const hasHongyeom = result.sinsalList.some(s => s.name.includes("홍염"));
  const hasHamji = result.sinsalList.some(s => s.name.includes("함지") || s.name.includes("咸池"));
  const hasHwagae = result.sinsalList.some(s => s.name.includes("화개"));

  const charmScore = Math.min(99,
    65 +
    (hasDohwa ? 15 : 0) +
    (hasHongyeom ? 12 : 0) +
    (hasHamji ? 8 : 0) +
    (hasHwagae ? 5 : 0)
  );

  return (
    <main className="min-h-screen bg-[#080810] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[700px] h-[700px] rounded-full bg-pink-900/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setStep("form")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 다시 입력</button>
          <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">홈으로</button>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✨</div>
          <h2 className="text-2xl font-black mb-1">{form.name}님의 숨은 매력</h2>
          <p className="text-gray-500 text-sm">{result.fourPillars}</p>
          <div className="inline-flex items-center gap-2 mt-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
            <span className="text-sm font-bold text-white">{ilgan}일간</span>
            <span className="text-gray-500 text-xs">·</span>
            <span className="text-sm font-bold" style={{ color: idata?.typeColor || "#fff" }}>{idata?.type || ""}</span>
          </div>
        </div>

        {/* ① 일간 핵심 매력 — 공개 */}
        <div className="bg-gradient-to-br from-pink-600/10 to-violet-600/10 border border-pink-500/25 rounded-2xl p-5 mb-4">
          <p className="text-xs font-bold tracking-widest text-pink-300 uppercase mb-3">일간 · 핵심 매력</p>
          <p className="text-sm text-gray-300 leading-relaxed mb-3">{idata?.coreMagic}</p>
          <div className="bg-white/[0.04] rounded-xl p-3 border border-white/5">
            <p className="text-xs text-gray-500 mb-1">처음 만난 사람 눈에 보이는 것</p>
            <p className="text-sm text-gray-200 leading-relaxed">{idata?.firstImpression}</p>
          </div>
        </div>

        {/* ② 오행 외모 — 공개 */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">오행({dominantEl}) · 외모 특징</p>
          <p className="text-sm text-gray-300 leading-relaxed mb-2">{olook?.look}</p>
          <p className="text-xs text-gray-600">📺 비슷한 스타일: {olook?.celebs}</p>
        </div>

        {/* ③ 숨은 매력 — 공개 */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">남들이 천천히 알게 되는 매력</p>
          <p className="text-sm text-gray-300 leading-relaxed">{idata?.hiddenMagic}</p>
        </div>

        {/* ④ 블러 섹션 */}
        <div className="relative mb-4">
          {!blurRemoved && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl backdrop-blur-md bg-black/30">
              <div className="text-center px-6 py-8">
                <p className="text-3xl mb-3">🔒</p>
                <p className="text-white font-black text-lg mb-2">숨겨진 매력 분석</p>
                <p className="text-gray-300 text-sm mb-1 font-semibold">"찐친이 보게 되는 {form.name}의 실체"</p>
                <p className="text-gray-500 text-sm mb-1">신살 매력 서열 (도화살·홍염살·함지살)</p>
                <p className="text-gray-500 text-sm mb-1">매력 점수 <span className="text-white font-bold">{charmScore}/100</span></p>
                <p className="text-gray-500 text-sm mb-1">나한테 끌리는 이성 타입</p>
                <p className="text-gray-500 text-sm mb-5">치명적 약점 (연애할 때 드러나는 것)</p>
                <button onClick={() => setBlurRemoved(true)}
                  className="bg-gradient-to-r from-pink-600 to-violet-600 text-white font-bold px-8 py-3 rounded-xl text-sm shadow-lg hover:from-pink-500 hover:to-violet-500 transition active:scale-[0.97]">
                  전체 결과 무료 공개 →
                </button>
                <p className="text-xs text-gray-600 mt-2">로그인 없음 · 완전 무료</p>
              </div>
            </div>
          )}

          <div className={blurRemoved ? "" : "blur-md pointer-events-none select-none"}>
            {/* 매력 점수 */}
            <div className="bg-gradient-to-br from-pink-600/10 to-violet-600/10 border border-pink-500/25 rounded-2xl p-5 mb-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-widest text-pink-300 uppercase">종합 매력 점수</p>
                <span className="text-2xl font-black text-white">{charmScore}<span className="text-sm text-gray-500">/100</span></span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden mb-3">
                <div className="h-full rounded-full" style={{ width: `${charmScore}%`, background: "linear-gradient(90deg, #ec4899, #8b5cf6)" }} />
              </div>
              <p className="text-xs text-gray-500">
                {charmScore >= 85 ? "상위 5% 매력 — 만나는 사람마다 인상에 남는 타입" :
                 charmScore >= 75 ? "상위 20% — 알면 알수록 빠져드는 타입" :
                 "평균 이상 — 진가를 알아보는 사람에게 깊이 사랑받는 타입"}
              </p>
            </div>

            {/* 신살 매력 서열 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-3">
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-4">신살 매력 서열</p>
              <div className="space-y-2.5">
                {[
                  { name: "진도화 (만인의 사랑)", has: hasDohwa, desc: "모든 연령층에게 자연스럽게 호감을 얻는 타고난 대중적 매력", emoji: "🌸" },
                  { name: "홍염살 (치명적 매력)", has: hasHongyeom, desc: "이성을 강하게 끌어당기는 위험한 매력. 홀리는 에너지.", emoji: "🔥" },
                  { name: "함지살 (본능적 끌림)", has: hasHamji, desc: "이유 없이 끌리게 만드는 원초적 매력. 설명이 안 되는 끌림.", emoji: "💫" },
                  { name: "화개살 (은은한 아우라)", has: hasHwagae, desc: "예술적 감각과 신비로운 분위기. 범접하기 어려운 아우라.", emoji: "🌙" },
                ].map((s, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${s.has ? "bg-pink-500/8 border-pink-500/25" : "bg-white/[0.02] border-white/5"}`}>
                    <span className="text-lg shrink-0">{s.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold ${s.has ? "text-pink-200" : "text-gray-500"}`}>{s.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.has ? "bg-pink-500/20 text-pink-300" : "bg-white/5 text-gray-600"}`}>
                          {s.has ? "있음" : "없음"}
                        </span>
                      </div>
                      {s.has && <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 12운성 매력 지수 */}
            {(() => {
              const dayUU = result.pillarsDetail.day.uunseong;
              const UUNSEONG_CHARM: Record<string, { title: string; desc: string; score: number; color: string }> = {
                장생: { title:"장생(長生) — 생기 있는 매력", desc:"자라나는 생명력처럼 신선하고 활기찬 매력. 이성에게 건강미와 긍정 에너지로 어필. 만나면 기분이 좋아지는 타입.", score:85, color:"#4ade80" },
                목욕: { title:"목욕(沐浴) — 이성 최강 매력", desc:"전통적으로 가장 강한 이성 매력의 12운성. 타고난 에로틱한 분위기와 매혹적 외모. 이성이 본능적으로 끌리는 에너지.", score:98, color:"#c4b5fd" },
                관대: { title:"관대(冠帶) — 당당한 매력", desc:"자신감 넘치는 자태. 사회적 지위와 능력에서 오는 매력. 존재 자체가 당당하고 믿음직스럽습니다.", score:80, color:"#86efac" },
                건록: { title:"건록(建祿) — 독립적 매력", desc:"스스로 서는 자립적 매력. 의지가 강하고 자기 영역이 뚜렷한 타입. 의존하지 않는 모습이 이성에게 매력적.", score:75, color:"#fbbf24" },
                제왕: { title:"제왕(帝旺) — 카리스마 최강", desc:"최고조의 에너지와 압도적 존재감. 모든 공간을 장악하는 리더십 매력. 이성이 본능적으로 따르게 됩니다.", score:90, color:"#f59e0b" },
                쇠:   { title:"쇠(衰) — 성숙한 매력", desc:"완숙하고 안정된 매력. 젊은 열기보다 깊이 있는 성숙함이 이성에게 신뢰감을 줍니다.", score:65, color:"#94a3b8" },
                병:   { title:"병(病) — 여린 예술적 매력", desc:"섬세하고 예술적인 분위기. 여리지만 독특한 아우라. 지적이고 감성적인 이성에게 깊이 어필합니다.", score:60, color:"#64748b" },
                사:   { title:"사(死) — 깊고 어두운 매력", desc:"정적이고 깊은 강렬함. 표면은 조용하지만 내면의 에너지가 미스터리한 매력을 형성합니다.", score:65, color:"#f87171" },
                묘:   { title:"묘(墓) — 신비로운 매력", desc:"감추어진 신비. 쉽게 파악되지 않는 미스터리함이 이성을 호기심으로 끌어당깁니다.", score:60, color:"#ef4444" },
                절:   { title:"절(絶) — 순간적 강렬한 매력", desc:"순간적으로 불타오르는 매력. 이별과 새 만남을 반복하지만, 그 순간의 강렬함이 인상적입니다.", score:70, color:"#dc2626" },
                태:   { title:"태(胎) — 순수한 천진난만 매력", desc:"아이처럼 순수하고 꾸밈없는 매력. 보호본능을 자극하는 천진난만함이 이성의 마음을 열게 합니다.", score:72, color:"#818cf8" },
                양:   { title:"양(養) — 따뜻한 성장 매력", desc:"자라나는 생명처럼 따뜻하고 포근한 매력. 함께 성장하고 싶다는 느낌을 주는 nurturing한 에너지.", score:70, color:"#a78bfa" },
              };
              const uu = UUNSEONG_CHARM[dayUU];
              if (!uu) return null;
              return (
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-3">
                  <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">☯ 일주 12운성 매력 지수</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold" style={{ color: uu.color }}>{uu.title}</span>
                    <span className="text-xl font-black text-white">{uu.score}<span className="text-xs text-gray-500">/100</span></span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-3">
                    <div className="h-full rounded-full" style={{ width: `${uu.score}%`, backgroundColor: uu.color }} />
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{uu.desc}</p>
                </div>
              );
            })()}

            {/* 찐친이 보게 되는 실체 */}
            <div className="bg-red-500/[0.06] border border-red-500/20 rounded-2xl p-5 mb-3">
              <p className="text-xs font-bold tracking-widest text-red-400 uppercase mb-3">⚠️ 찐친이 보게 되는 실체</p>
              <p className="text-sm text-red-200/80 leading-relaxed">{idata?.realSelf}</p>
            </div>

            {/* 치명적 약점 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-3">
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">연애할 때 드러나는 치명적 약점</p>
              <p className="text-sm text-gray-300 leading-relaxed">{idata?.fatalFlaw}</p>
            </div>

            {/* 이성 타입 */}
            <div className="bg-gradient-to-br from-pink-600/8 to-violet-600/8 border border-violet-500/20 rounded-2xl p-5 mb-3">
              <p className="text-xs font-bold tracking-widest text-violet-300 uppercase mb-3">나한테 먼저 끌리는 이성 타입</p>
              <p className="text-sm text-gray-200 leading-relaxed">{idata?.attractedType}</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-700 leading-relaxed">본 분석은 사주 이론 기반 순수 오락용 콘텐츠입니다.</p>
        </div>
        <button onClick={() => setStep("form")} className="w-full mt-6 py-3 rounded-xl border border-white/10 text-gray-500 hover:text-gray-300 text-sm transition">다시 분석하기</button>
      </div>
    </main>
  );
}

function FadeIn({ children, delay }: { children: React.ReactNode; delay: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>{children}</div>;
}
