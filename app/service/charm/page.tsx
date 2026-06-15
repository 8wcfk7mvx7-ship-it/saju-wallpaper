"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import { loadSajuData, saveSajuData } from "@/lib/savedSaju";
import ProfilePicker from "@/components/ProfilePicker";
import SaveProfilePrompt from "@/components/SaveProfilePrompt";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

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

interface FormState {
  name: string;
}

// ─── 매인 컴포넌트 ────────────────────────────────────────────────────────────
export default function CharmPage() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading">("entry");
  const [showBtn, setShowBtn] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [counter] = useState(() => Math.floor(Math.random() * 600) + 3500);
  const [form, setForm] = useState<FormState>({ name: "" });
  const [birthData, setBirthData] = useState<BirthFormData>(defaultBirthData("female"));

  useEffect(() => {
    const t = setTimeout(() => setShowBtn(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const saved = loadSajuData();
    if (saved) {
      setHasSaved(true);
      setBirthData(prev => ({
        ...prev,
        gender: saved.gender || "female",
        birthYear: saved.birthYear || "",
        birthMonth: saved.birthMonth || "",
        birthDay: saved.birthDay || "",
        birthHour: saved.birthHourUnknown ? null : (saved.birthHour ?? null),
        birthMinute: saved.birthHourUnknown ? null : (saved.birthMinute ?? null),
        useJajasi: saved.useJajasi || false,
        city: saved.birthPlace || "",
      }));
    }
  }, []);

  const handleAnalyze = async () => {
    let y = birthData.birthYear === "" ? NaN : Number(birthData.birthYear);
    let mo = birthData.birthMonth === "" ? NaN : Number(birthData.birthMonth);
    let d = birthData.birthDay === "" ? NaN : Number(birthData.birthDay);
    if (!form.name || isNaN(y) || isNaN(mo) || isNaN(d)) {
      alert("이름과 생년월일을 모두 입력해주세요.");
      return;
    }
    if (birthData.calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const klc = new KLC();
        klc.setLunarDate(y, mo, d, birthData.isLeapMonth);
        const sol = klc.getSolarCalendar();
        if (!sol?.year) throw new Error();
        y = sol.year; mo = sol.month; d = sol.day;
      } catch {
        alert("음력 날짜를 양력으로 변환할 수 없습니다. 날짜를 다시 확인해주세요.");
        return;
      }
    }
    const h = birthData.birthHour;
    const min = birthData.birthMinute ?? 0;
    saveSajuData({ name: form.name, gender: birthData.gender, birthYear: y, birthMonth: mo, birthDay: d, birthHour: h, birthMinute: h != null ? min : null, birthHourUnknown: h === null, birthPlace: birthData.city || "서울", style: "auto", useJajasi: birthData.useJajasi });
    const r = analyzeSaju({ birthYear: y, birthMonth: mo, birthDay: d, birthHour: h, birthMinute: h != null ? min : null, name: form.name, gender: birthData.gender, birthPlace: birthData.city || "서울", style: "auto", productType: "report", useJajasi: birthData.useJajasi });
    const charmData = { form: { ...form, birthHour: h, birthMinute: h != null ? min : null }, result: r };
    try { sessionStorage.setItem("charmData", JSON.stringify(charmData)); } catch {}
    setStep("loading");
  };

  // ── 로딩 ─────────────────────────────────────────────────────────────────
  if (step === "loading") return (
    <AnalysisLoading subject={`${form.name}님의 매력`} onDone={() => router.push("/service/charm/result")} />
  );

  // ── 엔트리 ───────────────────────────────────────────────────────────────
  if (step === "entry") return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <button onClick={() => router.push("/")} className="fixed top-5 left-5 z-20 text-xs text-gray-700 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-pink-900/25 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-900/20 blur-[130px]" />
      </div>
      <div className="relative z-10 max-w-xl w-full text-center">
        <FadeIn delay={0}>
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              <span className="text-xs font-bold text-pink-300 tracking-widest uppercase">Summer Palace · 매력 분석</span>
            </div>
            <div className="text-5xl drop-shadow-[0_0_40px_rgba(244,114,182,0.6)]">✨</div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-200 text-sm font-semibold">
                지금 <strong className="text-white">{counter.toLocaleString()}명</strong>이 매력 분석 중
              </span>
            </div>
          </div>
        </FadeIn>
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
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep("entry")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 처음으로</button>
          {hasSaved && <span className="text-xs text-pink-400/70 bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-full">✓ 저장된 사주 불러옴</span>}
        </div>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 drop-shadow-[0_0_30px_rgba(244,114,182,0.5)]">✨</div>
          <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-pink-300 via-violet-200 to-indigo-300 bg-clip-text text-transparent">사주 매력 분석</h1>
          <p className="text-gray-400 text-sm">일간 매력 · 신살 · 오행 외모 · 찐친이 보는 실체</p>
        </div>
        <ProfilePicker onSelect={p => {
          setForm(f => ({ ...f, name: p.name }));
          setBirthData(prev => ({
            ...prev,
            gender: p.gender,
            birthYear: p.birthYear || "",
            birthMonth: p.birthMonth || "",
            birthDay: p.birthDay || "",
            birthHour: p.birthHourUnknown ? null : p.birthHour,
            birthMinute: null,
            useJajasi: false,
          }));
        }} />

        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-7 space-y-6 shadow-2xl shadow-black/40">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
            <input type="text" placeholder="홍길동" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition" />
          </div>
          <BirthInputForm value={birthData} onChange={setBirthData} accent="#a855f7" />
          <button onClick={handleAnalyze}
            className="w-full bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] text-lg shadow-lg shadow-pink-900/40">
            ✨ 내 숨은 매력 분석하기
          </button>
        </div>
      </div>
    </main>
  );
}

function FadeIn({ children, delay }: { children: React.ReactNode; delay: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>{children}</div>;
}
