"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

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
import { analyzeSaju, getSexlifeInsights, type SajuResult } from "@/lib/saju";
import AnalysisLoading from "@/components/AnalysisLoading";
import SipseongInsight from "@/components/SipseongInsight";
import DohwaFormulaList from "@/components/DohwaFormulaList";
import BirthInputForm, { BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ShareImageButton from "@/components/ShareImageButton";

export const dynamic = "force-dynamic";

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

// ── 낮져밤이/낮이밤져 (일간+성별) ──────────────────────────────────────────
const ILGAN_DAYNIGHT: Record<string, { female: string; male: string }> = {
  갑: { female: "낮이밤져형. 낮에는 주도적이고 당당하지만 밤에는 의외로 순해짐. 리드당하는 걸 좋아하는 반전이 있음.", male: "낮이밤져형. 대외적으로 강하고 주도적인 이미지지만 가까워지면 의외로 수동적이 됨." },
  을: { female: "낮져밤이형. 낮에는 여리여리하고 순해 보이지만 밤에는 능동적으로 변하는 반전 타입.", male: "낮져밤이형. 평소엔 부드럽고 조용하지만 실제로는 리드하고 싶은 욕구가 강함." },
  병: { female: "낮이밤이형. 낮에도 밤에도 에너지가 넘치고 주도적. 열정이 24시간 유지되는 타입.", male: "낮이밤이형. 항상 뜨겁고 적극적. 수동적인 상황을 못 견딤." },
  정: { female: "낮져밤이형. 평소엔 조용하고 단아하지만 믿는 사람 앞에서는 완전히 달라짐. 불꽃처럼 타오름.", male: "낮져밤이형. 겉보기엔 차분하지만 감정이 개방되면 강렬해지는 타입." },
  무: { female: "낮이밤이형. 낮에도 밤에도 편안하고 포용적. 상대를 완전히 받아주는 스타일.", male: "낮이밤이형. 언제나 안정적이고 흔들리지 않음. 느리지만 깊고 묵직함." },
  기: { female: "낮져밤이형. 평소엔 섬세하고 조용하지만 신뢰가 쌓이면 전혀 다른 사람이 됨.", male: "낮져밤이형. 수줍어 보이지만 내면에 강한 욕구가 숨겨져 있음." },
  경: { female: "낮이밤져형. 낮에는 강하고 도도하지만 밤에는 의외로 순해지는 반전 매력.", male: "낮이밤이형. 강인하고 주도적인 모습이 밤에도 유지됨. 절대 수동적이 되지 않음." },
  신: { female: "낮이밤져형. 낮에는 완벽하고 차갑지만 밤에는 섬세하고 수동적으로 변하는 반전.", male: "낮이밤져형. 날카롭고 강한 이미지지만 신뢰하는 사람 앞에서 유순해짐." },
  임: { female: "낮이밤이형. 논리적이고 냉정한 모습이 그대로 유지됨. 감성보다 선택과 직관이 지배.", male: "낮이밤이형. 깊고 강한 에너지가 일관됨. 깊어질수록 더 강해지는 타입." },
  계: { female: "낮져밤이형. 청순하고 조용한 낮의 모습과 달리 밤에는 완전히 달라지는 반전 끝판왕.", male: "낮져밤이형. 소심해 보이지만 실제로는 섬세하고 집요하게 파고드는 타입." },
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

// ── 천간합 목록 ──────────────────────────────────────────────────────────────
const 천간합목록 = [
  {a:"갑", b:"기", 합화:"토", desc:"안정감 있고 지속적인 매력. 오래 봐도 질리지 않는 깊은 끌림."},
  {a:"을", b:"경", 합화:"금", desc:"긴장감 있고 날카로운 매력. 가까이 있으면 이상하게 끌리는 에너지."},
  {a:"병", b:"신", 합화:"수", desc:"차갑고 신비로운 매력. 상대를 매혹하고 수수께끼 같은 분위기."},
  {a:"정", b:"임", 합화:"목", desc:"감성 깊고 낭만적인 에너지. 마음이 연결될 때 폭발하는 성적 매력."},
  {a:"무", b:"계", 합화:"화", desc:"불꽃 같은 만남. 처음 보는 순간 화학 반응이 일어나는 유형."},
];
const 지지합목록 = [
  {a:"자", b:"축", 합화:"토", desc:"지속성과 안정. 오래 함께할수록 깊어지는 친밀감."},
  {a:"인", b:"해", 합화:"목", desc:"자연스럽고 편안한 연결. 처음부터 편한 에너지."},
  {a:"묘", b:"술", 합화:"화", desc:"불꽃 같은 끌림. 처음 만나면 강렬한 인상."},
  {a:"진", b:"유", 합화:"금", desc:"완성된 매력. 서로가 완벽하게 맞는 느낌."},
  {a:"사", b:"신", 합화:"수", desc:"신비롭고 복잡한 끌림. 설명하기 어려운 매력."},
  {a:"오", b:"미", 합화:"화/토", desc:"열정적이고 강렬한 에너지. 한 번 만나면 잊을 수 없는 임팩트."},
];
const 충목록 = [
  {a:"자", b:"오", desc:"자수와 오화의 충. 감성(수)과 열정(화)이 부딪히는 강렬한 에너지. 매우 자극적이고 극적인 성적 에너지."},
  {a:"축", b:"미", desc:"축토와 미토의 충. 안정 속에 감춰진 강렬한 내면 충돌. 억눌린 욕망이 강합니다."},
  {a:"인", b:"신", desc:"인목과 신금의 충. 자유로운 본능과 날카로운 감각의 충돌. 역동적이고 자극적인 에너지."},
  {a:"묘", b:"유", desc:"묘목과 유금의 충. 부드러운 감성과 날카로운 감각의 충돌. 끌리면서도 긴장감 있는 관계."},
  {a:"진", b:"술", desc:"진토와 술토의 충. 숨겨진 강렬한 에너지. 억압된 욕망이 폭발하는 에너지."},
  {a:"사", b:"해", desc:"사화와 해수의 충. 불과 물의 충돌. 조절되지 않은 충동과 열정. 매우 강렬한 성적 기운."},
];

// ── 배우자궁 십성 분석 ────────────────────────────────────────────────────────
const ILJI_SIPSEONG: Record<string, string> = {
  정재: "배우자궁에 정재. 안정적이고 지속적인 파트너십. 성적으로도 신뢰와 책임감이 있습니다.",
  편재: "배우자궁에 편재. 다양한 이성과 교류가 많고 자유로운 성적 에너지가 있습니다.",
  정관: "배우자궁에 정관. 원칙과 도리를 중시. 성적으로 도덕적이고 진지합니다.",
  편관: "배우자궁에 편관. 강한 자기주장과 카리스마. 관계에서 주도하거나 극적인 패턴.",
  식신: "배우자궁에 식신. 풍요롭고 여유로운 성적 에너지. 상대를 잘 챙기고 즐겁게 해줍니다.",
  상관: "배우자궁에 상관. 파격적이고 자유로운 성적 표현. 기존 틀을 벗어나는 에너지.",
  비견: "배우자궁에 비견. 대등한 파트너십 추구. 상대와 경쟁하거나 독립적인 관계.",
  겁재: "배우자궁에 겁재. 강한 소유욕과 집착. 관계에서 강렬한 에너지가 나옵니다.",
  정인: "배우자궁에 정인. 모성/부성적 보호 에너지. 감싸고 보살피는 따뜻한 성적 관계.",
  편인: "배우자궁에 편인. 신비롭고 독립적. 잡힐 듯 잡히지 않는 매력.",
};
const 월지_조후: Record<string, string> = {
  사: "조열(燥熱) 사주. 열기가 강합니다. 여름 같이 뜨거운 성적 에너지. 단 과열되면 번아웃 주의.",
  오: "조열(燥熱) 사주. 열기가 강합니다. 여름 같이 뜨거운 성적 에너지. 단 과열되면 번아웃 주의.",
  미: "조열(燥熱) 사주. 열기가 강합니다. 여름 같이 뜨거운 성적 에너지. 단 과열되면 번아웃 주의.",
  해: "한랭(寒冷) 사주. 차갑고 깊은 에너지. 쉽게 뜨겁지 않지만 일단 열리면 깊습니다.",
  자: "한랭(寒冷) 사주. 차갑고 깊은 에너지. 쉽게 뜨겁지 않지만 일단 열리면 깊습니다.",
  축: "한랭(寒冷) 사주. 차갑고 깊은 에너지. 쉽게 뜨겁지 않지만 일단 열리면 깊습니다.",
  인: "온난(溫暖) 사주. 따뜻하고 자연스럽게 성장하는 에너지. 균형 잡힌 성적 기운.",
  묘: "온난(溫暖) 사주. 따뜻하고 자연스럽게 성장하는 에너지. 균형 잡힌 성적 기운.",
  진: "온난(溫暖) 사주. 따뜻하고 자연스럽게 성장하는 에너지. 균형 잡힌 성적 기운.",
  신: "서늘(凉) 사주. 냉정하고 절제된 에너지. 깊이 파고들면 섬세하고 감각적.",
  유: "서늘(凉) 사주. 냉정하고 절제된 에너지. 깊이 파고들면 섬세하고 감각적.",
  술: "서늘(凉) 사주. 냉정하고 절제된 에너지. 깊이 파고들면 섬세하고 감각적.",
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
  const [form, setForm]     = useState<BirthFormData>(defaultBirthData("female"));
  const resultRef = useRef<SajuResult | null>(null);

  async function handleAnalyze() {
    const yr = typeof form.birthYear === "number" ? form.birthYear : 0;
    const mo = typeof form.birthMonth === "number" ? form.birthMonth : 0;
    const dy = typeof form.birthDay === "number" ? form.birthDay : 0;
    if (!yr || !mo || !dy) return;

    let fy = yr, fm = mo, fd = dy;
    if (form.calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(fy, fm, fd, form.isLeapMonth);
        const sol = cal.getSolarCalendar();
        if (sol?.year) { fy = sol.year; fm = sol.month; fd = sol.day; }
      } catch {}
    }

    resultRef.current = analyzeSaju({
      birthYear: fy, birthMonth: fm, birthDay: fd,
      birthHour: form.birthHour, birthMinute: form.birthMinute ?? 0,
      name: "나", gender: form.gender,
      birthPlace: form.city || "서울", style: "auto", productType: "report", useJajasi: form.useJajasi,
    });
    setStep("loading");
  }

  // ── 진입 ────────────────────────────────────────────────────────────────
  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#08010f] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[700px] h-[700px] rounded-full bg-rose-950/40 blur-[160px]" />
          <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-purple-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-5 py-16 text-center">
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
        </div>
      </main>
    );
  }

  // ── 폼 ──────────────────────────────────────────────────────────────────
  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#08010f] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-rose-950/35 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">내 정보 입력</h2>
            <p className="text-gray-500 text-sm">시간을 알면 더 정밀한 분석이 가능합니다</p>
          </div>
          <div className="space-y-5">
            <BirthInputForm value={form} onChange={setForm} accent="#ec4899" />
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
  const _rpd = result.pillarsDetail;
  const hasMokYok = [_rpd.year, _rpd.month, _rpd.day, _rpd.hour].filter(Boolean).some(p => p?.uunseong === "목욕");
  const erosAllSipseong = [_rpd.year, _rpd.month, _rpd.day, _rpd.hour].filter(Boolean).flatMap(p => [p?.sipseongCg, p?.sipseongJj]).filter(Boolean);
  const hasPyeongwan = erosAllSipseong.includes("편관");
  const haHwa     = result.dominant.includes("화");

  // 음간(을·정·기·신·계) = 음기 강함
  const 음간목록 = ["을","정","기","신","계"];
  const ilganForScore = result.pillarsDetail.day.cg;
  const is음간 = 음간목록.includes(ilganForScore);
  // 수기운 점수: 수 오행 포함 기둥 수 (임·계 천간, 자·해 지지 포함)
  const 수기운천간 = ["임","계"];
  const 수기운지지 = ["자","해","축"];
  const pd = result.pillarsDetail;
  const 수기운기둥수 = [pd.year, pd.month, pd.day, pd.hour].filter(p => p && (
    수기운천간.includes(p.cg) || 수기운지지.includes(p.jj))
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
  if (form.gender === "female") {
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
  const sexData = form.gender === "female" ? sex.female : sex.male;
  const hidden = ILJI_HIDDEN_CHARM[ilji] ?? { charm: "알면 알수록 빠져드는 매력", weapon: "깊은 내면의 에너지" };
  const tips   = SEDUCTION_TIPS[ilgan] ?? SEDUCTION_TIPS["무"];
  const tipList = form.gender === "female" ? tips.male : tips.female;
  const outerImage = WOLGGAN_OUTER[wolggan] ?? "사회적으로 안정적이고 신뢰감 있는 이미지.";

  const charmSinsals: { name: string; desc: string }[] = [];
  if (has진도화) charmSinsals.push({ name: "진도화(眞桃花)", desc: "일지 기준 진짜 도화. 이성이 먼저 다가오는 강한 기운입니다." });
  if (has홍염)   charmSinsals.push({ name: "홍염살(紅艶殺)", desc: "색정적 매력이 강합니다. 이성이 본능적으로 끌리는 기운입니다." });
  if (has도화)   charmSinsals.push({ name: "도화살(桃花殺)", desc: "자연스럽게 이성을 끌어당기는 에너지입니다." });
  if (hasMokYok) charmSinsals.push({ name: `일지 목욕(沐浴) — ${ilji}`, desc: "12운성 중 감각과 관능이 가장 강한 위치입니다." });

  const targetGender = form.gender === "female" ? "남자" : "여자";

  // ── 암합·지지합·충 분석 ──────────────────────────────────────────────────
  const cgList = [pd.year.cg, pd.month.cg, pd.day.cg, pd.hour?.cg].filter(Boolean);
  const jjList = [pd.year.jj, pd.month.jj, pd.day.jj, pd.hour?.jj].filter(Boolean);

  const found천간합: typeof 천간합목록 = [];
  for (let i = 0; i < cgList.length; i++) {
    for (let j = i + 1; j < cgList.length; j++) {
      const match = 천간합목록.find(h =>
        (h.a === cgList[i] && h.b === cgList[j]) ||
        (h.a === cgList[j] && h.b === cgList[i])
      );
      if (match && !found천간합.includes(match)) found천간합.push(match);
    }
  }
  const found지지합: typeof 지지합목록 = [];
  for (let i = 0; i < jjList.length; i++) {
    for (let j = i + 1; j < jjList.length; j++) {
      const match = 지지합목록.find(h =>
        (h.a === jjList[i] && h.b === jjList[j]) ||
        (h.a === jjList[j] && h.b === jjList[i])
      );
      if (match && !found지지합.includes(match)) found지지합.push(match);
    }
  }
  const found충: typeof 충목록 = [];
  for (let i = 0; i < jjList.length; i++) {
    for (let j = i + 1; j < jjList.length; j++) {
      const match = 충목록.find(h =>
        (h.a === jjList[i] && h.b === jjList[j]) ||
        (h.a === jjList[j] && h.b === jjList[i])
      );
      if (match && !found충.includes(match)) found충.push(match);
    }
  }

  // ── 요망력 (끌어당김 · 색기 · 밀당) ─────────────────────────────────────────
  const 끌림력 = Math.min(100, 40 + (has도화 ? 25 : 0) + (has진도화 ? 25 : 0) + (has역마 ? 10 : 0));
  const 색기력 = Math.min(100, 30 + (has홍염 ? 35 : 0) + (hasMokYok ? 25 : 0) + (haHwa ? 10 : 0));
  const 밀당력 = Math.min(100, 35 + found충.length * 25 + (found천간합.length + found지지합.length) * 15);
  const 신체매력 = Math.min(100, 45 + (hasMokYok ? 20 : 0) + (haHwa ? 15 : 0) + (has도화 ? 10 : 0) + (has홍염 ? 10 : 0));
  const 요망력 = Math.round((끌림력 + 색기력 + 밀당력) / 3);

  // 오행 조합 매력 코드 (설명 없이 결과 라벨만)
  const dom = result.dominant;
  const charmCodes: string[] = [];
  if (dom.includes("금") && dom.includes("수")) charmCodes.push("금수쌍청 · 차가운 미녀상");
  if (dom.includes("목") && dom.includes("화")) charmCodes.push("목화통명 · 밝고 따뜻한 인상");
  if (dom.length === 1 && dom[0] === "수") charmCodes.push("수다자 · 물 같은 분위기");
  const 요망등급 =
    요망력 >= 85 ? "치명적 요망형 — 마주치면 위험" :
    요망력 >= 70 ? "고급 요망형 — 은근하지만 강력" :
    요망력 >= 50 ? "잠재 요망형 — 가까워질수록 발현" :
    "순둥 매력형 — 요망기는 약하지만 진정성으로 어필";

  // 배우자궁 십성 & 조후
  const iljiSipseong = pd.day.sipseongJj ?? "";
  const iljiSipseongDesc = ILJI_SIPSEONG[iljiSipseong] ?? null;
  const woljiJohu = 월지_조후[pd.month.jj] ?? null;

  return (
    <main className="min-h-screen bg-[#08010f] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full blur-[140px]" style={{ backgroundColor: grade.color + "18" }} />
        <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-purple-950/20 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-24" id="eros-result">


        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-block px-2 py-0.5 rounded-full bg-rose-900/40 border border-rose-700/30 text-rose-400 text-[10px] font-bold tracking-wider mb-2">19금</div>
          <h2 className="text-3xl font-black mb-1">{ilgan}{ilji}일주</h2>
          <p className="text-gray-400 text-xs">{result.fourPillars}</p>
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
              <p className="text-xs text-gray-300">/ 100</p>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 mb-3">
            <div className="h-full rounded-full" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${grade.color}, #a855f7)` }} />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{grade.desc}</p>
          <p className="text-sm font-bold mt-2" style={{ color: grade.color }}>→ {grade.oneliner}</p>
        </div>

        {/* ①-2 요망력 */}
        <div className="bg-white/[0.03] border border-pink-700/20 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-pink-400 font-bold tracking-widest uppercase">요망력 지수</p>
            <p className="text-2xl font-black text-pink-300">{요망력}<span className="text-sm text-gray-500">/100</span></p>
          </div>
          <p className="text-sm font-bold text-pink-200 mb-3">{요망등급}</p>
          <div className="space-y-2.5">
            {[
              { label: "끌림력", desc: "가만히 있어도 시선을 끌어당기는 힘", value: 끌림력, color: "#f472b6" },
              { label: "색기력", desc: "분위기·말투에서 흘러나오는 관능적 에너지", value: 색기력, color: "#fb7185" },
              { label: "밀당력", desc: "다가왔다 멀어지며 상대를 더 끌리게 만드는 긴장감", value: 밀당력, color: "#c084fc" },
              { label: "신체매력", desc: "체형·실루엣에서 드러나는 본능적인 매력", value: 신체매력, color: "#fbbf24" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-300">{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
                  <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }} />
                </div>
                <p className="text-[11px] text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          {charmCodes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {charmCodes.map(c => (
                <span key={c} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/25">
                  {c}
                </span>
              ))}
            </div>
          )}
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
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">나의 성적 에너지 — {ilgan}{ilji}일주</p>
          <div className="space-y-3">
            <div className="bg-rose-950/20 border border-rose-900/20 rounded-xl px-4 py-3">
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
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-rose-400 font-semibold mb-1">낮져밤이 vs 낮이밤져</p>
              <p className="text-sm text-gray-200">{ILGAN_DAYNIGHT[ilgan]?.[form.gender === "female" ? "female" : "male"] ?? "낮과 밤의 모습이 비슷한 타입."}</p>
            </div>
          </div>
          {hasMokYok && (
            <div className="mt-3 bg-rose-950/30 border border-rose-700/30 rounded-xl px-4 py-3">
              <p className="text-xs text-rose-300 font-bold mb-1">목욕(沐浴) — 특별 분석</p>
              <p className="text-xs text-gray-200">12운성 중 감각과 관능이 가장 강한 위치. {form.gender === "female" ? "음기가 극도로 풍부하며 이성이 본능적으로 끌려. " : "양기가 강하고 이성을 끌어당기는 에너지가 있어. "}패션 감각이 타고나서 약간의 노출도 고급스럽게 소화하고, 어딜 가나 스타일로 시선을 싹쓸이하는 게 자연스럽게 성적 매력으로 연결돼.</p>
            </div>
          )}
          {hasPyeongwan && (
            <div className="mt-3 bg-purple-950/30 border border-purple-700/30 rounded-xl px-4 py-3">
              <p className="text-xs text-purple-300 font-bold mb-1">편관(偏官) — 카리스마 성적 매력</p>
              <p className="text-xs text-gray-200">편관이 있으면 섹시하면서도 강렬한 인상을 남겨. 말 한마디 없이도 포스가 느껴지고, 압도적인 분위기 자체가 이성을 끌어당기는 에너지가 돼. 가끔 부드러운 면을 보여주는 반전 매력까지 더해지면 치명적이야.</p>
            </div>
          )}
          {form.gender === "female" && has수기운강 && (
            <div className="mt-3 bg-blue-950/30 border border-blue-700/30 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-300 font-bold mb-1">수기운(水氣運) — 명기력(命氣力) 강화</p>
              <p className="text-xs text-gray-200">수(水)는 흡인·수용·생식의 기운입니다. 이 기운이 강한 여성은 상대를 깊이 끌어당기는 자기장 같은 매력이 있습니다. 몸의 에너지가 농밀하고 관계에서 상대가 벗어나기 어렵습니다.</p>
            </div>
          )}
          {form.gender === "female" && is음간 && has수기운강 && (
            <div className="mt-3 bg-purple-950/30 border border-purple-700/30 rounded-xl px-4 py-3">
              <p className="text-xs text-purple-300 font-bold mb-1">음간(陰干) — 음기(陰氣) 집중형</p>
              <p className="text-xs text-gray-200">음간 일간은 수용·집중·흡수의 기운이 강합니다. 겉으로는 조용해 보여도 내면에 강한 음기가 모여있어, 관계에서 상대가 의존하게 되는 흡인력이 자연스럽게 발산됩니다.</p>
            </div>
          )}
        </div>

        {/* ③-1 사주로 보는 성향 인사이트 */}
        {(() => {
          const sexlifeInsights = getSexlifeInsights(result);
          if (sexlifeInsights.length === 0) return null;
          return (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">사주로 보는 성향 인사이트</p>
              <div className="space-y-2.5">
                {sexlifeInsights.map(ins => (
                  <div key={ins.title} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-sm font-bold mb-1" style={{ color: ins.color }}>{ins.title}</p>
                    <p className="text-xs leading-relaxed text-gray-300">{ins.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ④ 암합·지지합 분석 */}
        {(found천간합.length > 0 || found지지합.length > 0) && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">암합(暗合) · 지지합(地支合) 분석</p>
            <p className="text-xs text-gray-400 mb-4">사주 기둥 사이에 숨겨진 합(合)의 에너지</p>
            {found천간합.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-rose-400 font-semibold mb-2">천간합(天干合)</p>
                <div className="space-y-2">
                  {found천간합.map((h) => (
                    <div key={h.a+h.b} className="bg-rose-950/20 border border-rose-900/25 rounded-xl px-4 py-3">
                      <p className="text-sm font-bold text-rose-300 mb-0.5">{h.a}{h.b}합 → 합화 {h.합화}</p>
                      <p className="text-xs text-gray-200">{h.desc}</p>
                      {(h.a === "정" || h.b === "정") && (
                        <p className="text-xs text-purple-300 mt-1 font-semibold">★ 정임합이 사주에 숨어있으면 &quot;숨겨진 성적 매력&quot; — 겉으로 드러나지 않지만 가까워지면 폭발합니다.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {found지지합.length > 0 && (
              <div>
                <p className="text-xs text-purple-400 font-semibold mb-2">지지합(地支合)</p>
                <div className="space-y-2">
                  {found지지합.map((h) => (
                    <div key={h.a+h.b} className="bg-purple-950/20 border border-purple-900/25 rounded-xl px-4 py-3">
                      <p className="text-sm font-bold text-purple-300 mb-0.5">{h.a}{h.b}합 → 합화 {h.합화}</p>
                      <p className="text-xs text-gray-200">{h.desc}</p>
                      <p className="text-xs text-gray-300 mt-1">음양이 맞아 자연스럽게 끌리는 기운입니다.</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ⑤ 충 — 성적 긴장 */}
        {found충.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">충(沖) — 성적 긴장 에너지</p>
            <p className="text-xs text-amber-500/80 mb-3">충(沖)이 있는 사주는 긴장감과 자극이 강합니다. 정적인 관계보다 역동적이고 자극적인 관계에서 에너지가 살아납니다.</p>
            <div className="space-y-2">
              {found충.map((c) => (
                <div key={c.a+c.b} className="bg-amber-950/20 border border-amber-900/25 rounded-xl px-4 py-3">
                  <p className="text-sm font-bold text-amber-300 mb-0.5">{c.a}{c.b}충(沖)</p>
                  <p className="text-xs text-gray-200">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⑥ 배우자궁·조후 분석 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">배우자궁(配偶者宮) 분석</p>
          <p className="text-xs text-gray-400 mb-4">일지(日支) = 배우자궁. 나의 관계 에너지의 핵심.</p>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-semibold mb-1">배우자궁 — {ilji}</p>
              <p className="text-sm text-gray-200">{ILJI_HIDDEN_CHARM[ilji]?.charm ?? "알면 알수록 빠져드는 매력"}</p>
            </div>
            {iljiSipseongDesc && (
              <div className="bg-rose-950/20 border border-rose-900/20 rounded-xl px-4 py-3">
                <p className="text-xs text-rose-400 font-semibold mb-1">십성(十星) — {iljiSipseong}</p>
                <p className="text-sm text-gray-300">{iljiSipseongDesc}</p>
              </div>
            )}
            {woljiJohu && (
              <div className="bg-blue-950/20 border border-blue-900/20 rounded-xl px-4 py-3">
                <p className="text-xs text-blue-400 font-semibold mb-1">조후(調候) — 월지 {pd.month.jj}</p>
                <p className="text-sm text-gray-300">{woljiJohu}</p>
              </div>
            )}
          </div>
        </div>

        {/* ⑧ 은근한 매력 (일지) */}
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

        {/* ⑨ 월주 분석 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">월주 분석 — {result.pillarsDetail.month.cg}{result.pillarsDetail.month.jj}월주</p>
          <p className="text-xs text-gray-400 mb-3">사회적으로 드러나는 외부 이미지</p>
          <p className="text-sm text-gray-300 leading-relaxed">{outerImage}</p>
        </div>

        {/* ⑩ 도화 신살 */}
        {charmSinsals.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">사주 속 도화 기운</p>
            <div className="space-y-3">
              {charmSinsals.map(({ name, desc }) => (
                <div key={name} className="flex items-start gap-3 bg-rose-950/20 border border-rose-900/25 rounded-xl px-4 py-3">
                  <span className="text-rose-400 text-sm mt-0.5 shrink-0">●</span>
                  <div>
                    <p className="text-sm font-bold text-rose-300">{name}</p>
                    <p className="text-xs text-gray-200 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⑪ 꼬시는 팁 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">{targetGender}를 꼬시는 법</p>
          <p className="text-xs text-gray-400 mb-4">{ilgan}일간 맞춤 공략법</p>
          <div className="space-y-2">
            {tipList.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span className="text-rose-400 font-black text-sm shrink-0">{i + 1}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <DohwaFormulaList result={result} />
        <SipseongInsight result={result} title="이성 매력의 뿌리 — 사주 속 핵심 기운" />

        {/* 면책 */}
        <div className="bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3 mb-6">
          <p className="text-xs text-gray-400 leading-relaxed text-center">
            본 분석은 사주 명리학 기반 19금 엔터테인먼트 콘텐츠입니다.<br />
            만 19세 이상만 이용하세요.
          </p>
        </div>

        <ShareButton />
        <button onClick={() => { setForm(defaultBirthData("female")); setStep("form"); }}
          className="w-full mt-3 py-3.5 rounded-2xl font-bold text-sm border border-rose-700/40 text-rose-400 hover:bg-rose-950/30 transition-all">
          다시 분석하기
        </button>
        <ShareImageButton targetId="eros-result" fileName="매력살" />
      </div>
    </main>
  );
}

export default function ErosPage() {
  return <ErosContent />;
}
