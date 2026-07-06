"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import { type SajuResult, getSexlifeInsights } from "@/lib/saju";
import { getSexEnergyAnalysis, getAppearanceAnalysis } from "@/lib/saju2";
import SipseongInsight from "@/components/SipseongInsight";
import DohwaFormulaList from "@/components/DohwaFormulaList";
import ResultFooterActions from "@/components/ResultFooterActions";
import type { BirthFormData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

// ── 외모 (일간별) ─────────────────────────────────────────────────────────────
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

const ILGAN_DAYNIGHT: Record<string, { female: string; male: string }> = {
  갑: { female: "낮에는 주도적이고 당당하지만 밤에는 의외로 순해지는 반전이 있음.", male: "대외적으로 강하고 주도적인 이미지지만 가까워지면 의외로 수동적이 됨." },
  을: { female: "평소엔 여리여리하고 순해 보이지만 믿는 사람 앞에서는 능동적으로 변하는 반전 타입.", male: "평소엔 부드럽고 조용하지만 실제로는 리드하고 싶은 욕구가 강함." },
  병: { female: "낮에도 밤에도 에너지가 넘치고 주도적. 열정이 24시간 유지되는 타입.", male: "항상 뜨겁고 적극적. 수동적인 상황을 못 견딤." },
  정: { female: "평소엔 조용하고 단아하지만 믿는 사람 앞에서는 완전히 달라짐. 불꽃처럼 타오름.", male: "겉보기엔 차분하지만 감정이 개방되면 강렬해지는 타입." },
  무: { female: "낮에도 밤에도 편안하고 포용적. 상대를 완전히 받아주는 스타일.", male: "언제나 안정적이고 흔들리지 않음. 느리지만 깊고 묵직함." },
  기: { female: "평소엔 섬세하고 조용하지만 신뢰가 쌓이면 전혀 다른 사람이 됨.", male: "수줍어 보이지만 내면에 강한 욕구가 숨겨져 있음." },
  경: { female: "낮에는 강하고 도도하지만 밤에는 의외로 순해지는 반전 매력.", male: "강인하고 주도적인 모습이 그대로 유지됨. 절대 수동적이 되지 않음." },
  신: { female: "낮에는 완벽하고 차갑지만 믿는 사람 앞에서 섬세하고 수동적으로 변하는 반전.", male: "날카롭고 강한 이미지지만 신뢰하는 사람 앞에서 유순해짐." },
  임: { female: "논리적이고 냉정한 모습이 그대로 유지됨. 감성보다 선택과 직관이 지배.", male: "깊고 강한 에너지가 일관됨. 깊어질수록 더 강해지는 타입." },
  계: { female: "청순하고 조용한 낮의 모습과 달리 믿는 사람 앞에서 완전히 달라지는 반전 끝판왕.", male: "소심해 보이지만 실제로는 섬세하고 집요하게 파고드는 타입." },
};

const ILGAN_SEX: Record<string, { female: { power: string; energy: string; style: string }; male: { power: string; energy: string; style: string } }> = {
  갑: {
    female: { power: "생명력 강한 목(木)의 음기. 탄탄하고 탄력 있는 에너지.", energy: "큰 나무처럼 강인. 리드당하기보다 자기 리듬을 가짐.", style: "주도당하는 것보다 파트너와 대등하게 이끌어가는 타입." },
    male:   { power: "강인한 양기. 끈질긴 지구력.", energy: "큰 나무처럼 버팀. 강하고 오래가는 에너지.", style: "처음부터 끝까지 주도하고 싶어하는 타입." },
  },
  을: {
    female: { power: "덩굴처럼 부드럽게 감아드는 음기.", energy: "유연하고 적응력 높음. 상대에 맞추되 자기 페이스를 잃지 않음.", style: "결국 상대가 더 원하게 만드는 끌어당김의 달인." },
    male:   { power: "부드러운 외면과 달리 집요한 음기.", energy: "서서히 쌓아가는 스타일. 폭발력보다 지속력.", style: "상대를 서서히 자기 리듬으로 끌어들이는 타입." },
  },
  병: {
    female: { power: "뜨거운 화(火)의 양기. 불처럼 타오르는 열정.", energy: "순간 에너지가 폭발적. 분위기를 한 순간에 바꿈.", style: "적극적이고 주도적. 열정을 숨기지 않음." },
    male:   { power: "강렬한 태양 같은 에너지.", energy: "끝없는 열정과 체력.", style: "상대를 압도하는 강렬함. 눈빛만으로도 설레게 만드는 타입." },
  },
  정: {
    female: { power: "촉촉하고 따뜻한 화(火)의 음기.", energy: "천천히 달아오르지만 한번 불이 붙으면 끝까지 타오름.", style: "감성으로 상대를 녹이는 타입." },
    male:   { power: "은은한 촛불 같은 에너지.", energy: "초반엔 조용하지만 가까워질수록 강렬해짐.", style: "따뜻한 말 한마디로 상대의 마음을 완전히 열어버리는 타입." },
  },
  무: {
    female: { power: "안정적이고 포용적인 토(土)의 음기.", energy: "편안하고 따뜻함. 상대를 완전히 수용함.", style: "압박하지 않고 자연스럽게 받아주는 타입." },
    male:   { power: "산처럼 묵직하고 안정적인 에너지.", energy: "빠르지 않지만 깊고 진함.", style: "천천히 깊이 파고드는 타입. 느리지만 오래 기억되는 경험을 만듦." },
  },
  기: {
    female: { power: "세심하고 섬세한 토(土)의 음기.", energy: "부드럽게 감아드는 스타일. 상대의 반응을 잘 읽음.", style: "완벽하게 맞춰주는 타입. 상대가 원하는 걸 먼저 알아채는 감각이 있음." },
    male:   { power: "섬세하고 포용적인 에너지.", energy: "세심하게 상대의 상태를 읽으며 맞춰감.", style: "챙겨주는 능력이 탁월. 상대를 편안하게 해주는 것이 가장 큰 무기." },
  },
  경: {
    female: { power: "차갑고 날카로운 금(金)의 음기.", energy: "겉은 도도하지만 일단 열리면 강렬한 반전.", style: "지배당하는 것처럼 보이지만 실은 상황을 통제하는 타입." },
    male:   { power: "강인하고 날카로운 양기.", energy: "강하고 주도적. 절대 수동적이 되지 않음.", style: "완전히 주도하는 타입. 강함 자체가 매력." },
  },
  신: {
    female: { power: "섬세하고 고급스러운 금(金)의 음기.", energy: "차갑지만 완벽하게 관리된 에너지.", style: "천천히 상대를 끌어들이는 타입. 허용하는 순간 엄청난 반전." },
    male:   { power: "날카롭고 정제된 에너지.", energy: "절제되어 있지만 폭발적인 잠재력.", style: "냉정해 보이지만 신뢰하는 사람 앞에서는 부드러워지는 반전 타입." },
  },
  임: {
    female: { power: "깊고 신비로운 수(水)의 음기.", energy: "고요한 심해 같은 에너지. 깊어질수록 더 강함.", style: "상대를 완전히 빠져들게 만드는 흡인력." },
    male:   { power: "강하고 유연한 양수(陽水)의 에너지.", energy: "큰 강처럼 유연하지만 강인함.", style: "깊고 일관된 에너지. 상대를 압도하면서도 자유롭게 두는 타입." },
  },
  계: {
    female: { power: "촉촉하고 은밀한 수(水)의 음기.", energy: "조용히 스며드는 에너지. 저항할 수 없는 흡인력.", style: "겉보기와 달리 깊고 농밀한 타입. 가까워질수록 빠져나올 수 없음." },
    male:   { power: "섬세하고 집요한 음수(陰水)의 에너지.", energy: "서서히 파고드는 끈기.", style: "청순해 보이지만 일단 집중하면 집요하게 파고드는 타입." },
  },
};

const ILJI_HIDDEN_CHARM: Record<string, { charm: string; weapon: string }> = {
  자: { charm: "배우자궁에 자수(子水)가 자리해, 안에서 흘러나오는 신비롭고 촉촉한 분위기가 있습니다.", weapon: "잔잔하지만 깊이를 알 수 없는 눈빛" },
  축: { charm: "배우자궁에 축토(丑土)가 자리해, 믿음직하고 안정감 있는 매력이 있습니다.", weapon: "묵묵한 충성심과 포용력" },
  인: { charm: "배우자궁에 인목(寅木)이 자리해, 자연스럽고 활기 있는 생명력이 매력입니다.", weapon: "거침없는 진취적 에너지" },
  묘: { charm: "배우자궁에 묘목(卯木)이 자리해, 부드럽고 섬세한 감성 매력이 있습니다.", weapon: "봄꽃처럼 섬세하게 파고드는 감성" },
  진: { charm: "배우자궁에 진토(辰土)가 자리해, 신비롭고 깊은 에너지가 내면에 있습니다.", weapon: "잡힐 듯 잡히지 않는 신비감" },
  사: { charm: "배우자궁에 사화(巳火)가 자리해, 지적이면서도 관능적인 이중 매력이 있습니다.", weapon: "지성과 관능이 공존하는 이중성" },
  오: { charm: "배우자궁에 오화(午火)가 자리해, 열정적이고 직접적인 매력이 있습니다.", weapon: "태양처럼 뜨거운 열정과 직선적 끌림" },
  미: { charm: "배우자궁에 미토(未土)가 자리해, 따뜻하고 포근한 흡인력이 있습니다.", weapon: "여름 오후 같은 포근하고 나른한 끌림" },
  신: { charm: "배우자궁에 신금(申金)이 자리해, 날카롭고 강인한 매력이 있습니다.", weapon: "예측 불가능한 강렬함" },
  유: { charm: "배우자궁에 유금(酉金)이 자리해, 섬세하고 정제된 매력이 있습니다.", weapon: "보석처럼 빛나는 고급스러운 분위기" },
  술: { charm: "배우자궁에 술토(戌土)가 자리해, 깊고 열정적인 내면 에너지가 있습니다.", weapon: "늦가을 저녁처럼 깊고 쓸쓸한 끌림" },
  해: { charm: "배우자궁에 해수(亥水)가 자리해, 자유롭고 신비로운 매력이 있습니다.", weapon: "깊은 바다처럼 끝을 알 수 없는 신비감" },
};

const ILJU_NIGHT_CHARM: Record<string, string> = {
  갑자:"수면 아래 흐르는 잔잔한 강처럼 조용히 스며드는 밤의 매력이 있다.", 을축:"묵직한 포용력 안에 부드러움이 숨겨져 있다.", 병인:"뜨거운 열정이 자연스럽게 흘러나오는 타입이다.", 정묘:"꽃처럼 섬세하고 깊은 감성이 밤에 피어난다.", 무진:"신비로운 기운이 깊이 감춰져 있어 알면 알수록 빠져든다.", 기사:"은근히 끌리는 분위기가 있어 자꾸 생각나게 만든다.", 경오:"강인한 낮의 모습과 달리 은근한 반전이 밤을 압도한다.", 신미:"우아하고 세련된 매력이 저녁이 되면 더욱 짙어진다.", 임신:"깊고 유연한 에너지가 있어 밤이 길어질수록 더 강해진다.", 계유:"보석처럼 정제된 매력이 어둠 속에서 빛난다.",
  갑술:"가을 깊은 밤처럼 열정과 깊이가 공존한다.", 을해:"자유롭고 신비로운 분위기 속에서 부드럽게 감아드는 매력이 있다.", 병자:"뜨거운 열정과 차가운 신비가 극적으로 충돌하는 타입이다.", 정축:"은은한 빛이 어둠 속에서도 사라지지 않는 타입이다.", 무인:"자연스럽고 따뜻한 생명력이 밤의 분위기를 지배한다.", 기묘:"섬세하고 포용적인 에너지가 밤에 더 깊어진다.", 경진:"강함 속에 신비로운 에너지가 숨겨진 타입이다.", 신사:"지적이고 관능적인 이중 매력이 밤에 빛난다.", 임오:"깊은 수(水)와 강한 화(火)가 충돌하여 극적인 에너지가 생긴다.", 계미:"포근하고 촉촉한 분위기가 자연스럽게 상대를 끌어당긴다.",
  갑신:"강인함과 유연함이 공존하는 밤의 에너지가 있다.", 을유:"정제되고 섬세한 매력이 밤에 더욱 빛난다.", 병술:"뜨거운 열정과 깊은 내면의 에너지가 공존한다.", 정해:"신비로운 물의 기운 속에서 불꽃이 타오르는 독특한 매력.", 무자:"묵직한 중심 속에 흐르는 신비로운 수(水)의 에너지가 있다.", 기축:"섬세하고 포용적인 토(土)의 에너지가 어둠 속에서 빛난다.", 경인:"강인함과 자유로운 에너지가 공존하는 역동적인 매력이 있다.", 신묘:"섬세하고 부드러운 분위기가 밤에 극적으로 드러난다.", 임진:"신비롭고 깊은 에너지가 밤의 분위기를 압도한다.", 계사:"차가운 물과 뜨거운 불의 충돌이 강렬한 매력을 만든다.",
  갑오:"강인한 에너지가 밤에도 꺾이지 않는 타입이다.", 을미:"포근하고 부드러운 감성이 밤에 더욱 짙어진다.", 병신:"강렬한 존재감과 날카로운 매력이 공존한다.", 정유:"섬세한 감성과 고급스러운 분위기가 밤의 매력을 완성한다.", 무술:"깊고 열정적인 내면이 밤이 되면 표면으로 올라온다.", 기해:"포근함 속에 신비로운 흡인력이 숨어있다.", 경자:"차갑고 날카로운 이미지와 달리 밤엔 부드러운 반전이 있다.", 신축:"완벽하게 절제된 낮의 모습과 달리 밤에는 완전히 다른 모습이 나온다.", 임인:"큰 강물처럼 자유롭고 깊은 에너지가 밤에 흘러넘친다.", 계묘:"청순하고 섬세한 매력이 밤에 더욱 짙어진다.",
  갑진:"신비롭고 역동적인 에너지가 공존하는 밤의 압도적 존재.", 을사:"은근히 끌리는 분위기가 있어 자꾸 생각나게 만든다.", 병오:"태양과 불꽃이 겹친 최고조의 열정. 가까이 있기만 해도 뜨거움이 전해진다.", 정미:"따뜻하고 포근한 감성이 밤에 더욱 짙게 드러난다.", 무신:"날카롭고 안정적인 에너지가 공존하는 특별한 매력이 있다.", 기유:"섬세하고 고급스러운 분위기가 밤의 매력을 완성한다.", 경술:"강인하고 열정적인 기운이 가을 밤처럼 깊어진다.", 신해:"자유롭고 신비로운 기운 속에서 정제된 매력이 빛난다.", 임자:"같은 수(水) 기운이 겹쳐 신비롭고 깊은 흡인력이 생긴다.", 계축:"포용적이고 섬세한 에너지가 어둠 속에서 더욱 농밀해진다.",
  갑인:"생명력 넘치는 목(木)의 에너지가 밤에도 꺾이지 않는다.", 을묘:"부드럽고 섬세한 감성이 밤에 극적으로 드러난다.", 병진:"신비롭고 뜨거운 에너지가 공존하는 극적인 밤의 매력.", 정사:"지적이고 감성적인 이중 매력이 밤에 완전히 꽃핀다.", 무오:"안정감 속에 뜨거운 열정이 숨어있는 타입이다.", 기미:"포근하고 포용적인 에너지가 밤에 더욱 깊어진다.", 경신:"강인하고 날카로운 기운이 두 배로 증폭되어 압도적 에너지를 만든다.", 신유:"정제된 고급스러움이 두 배로 증폭되어 독보적 분위기를 만든다.", 임술:"깊고 열정적인 수화(水火)의 에너지가 밤에 폭발한다.", 계해:"같은 수(水) 기운이 겹쳐 신비롭고 끝을 알 수 없는 흡인력이 생긴다.",
};

const ILJU_NIGHT_RANK: Record<string, number> = {
  갑자:1,을축:2,병인:3,정묘:4,무진:5,기사:6,경오:7,신미:8,임신:9,계유:10,
  갑술:11,을해:12,병자:13,정축:14,무인:15,기묘:16,경진:17,신사:18,임오:19,계미:20,
  갑신:21,을유:22,병술:23,정해:24,무자:25,기축:26,경인:27,신묘:28,임진:29,계사:30,
  갑오:31,을미:32,병신:33,정유:34,무술:35,기해:36,경자:37,신축:38,임인:39,계묘:40,
  갑진:41,을사:42,병오:43,정미:44,무신:45,기유:46,경술:47,신해:48,임자:49,계축:50,
  갑인:51,을묘:52,병진:53,정사:54,무오:55,기미:56,경신:57,신유:58,임술:59,계해:60,
};

const FIRSTIMPRESSION_SPECIAL: Record<string, string> = {
  "진:신해": "첫인상부터 분위기가 남달라 말을 걸지 않아도 자연스럽게 시선을 끌고 번호를 먼저 물어보는 사람이 생기기 쉬운 편입니다.",
  "오:병오": "환한 미소와 자신감이 먼저 눈에 들어오는 타입이라 어디서나 존재감이 커 자연스럽게 이성의 관심을 받습니다.",
  "묘:정묘": "청순하면서도 묘한 분위기가 있어 처음엔 조용해 보여도 가까이 있을수록 더 매력적으로 느껴지는 타입입니다.",
  "신:임신": "유머 감각과 센스가 뛰어나 처음 만난 자리에서도 자연스럽게 분위기를 주도하고 호감을 얻는 편입니다.",
  "유:계유": "세련된 스타일과 깔끔한 이미지가 첫인상에서 강하게 작용해 자기관리 잘 하는 사람으로 기억됩니다.",
};

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

const SEDUCTION_TIPS: Record<string, { female: string[]; male: string[] }> = {
  갑: { female: ["쉽게 주지 말고 쿨하게 — 갑목은 노력해서 얻어야 하는 상대에게 끌림", "힘들 때 조용히 옆에 있어주기 — 든든한 사람에게 약함", "능력·자립심 어필 — 기댈 사람보다 대등한 파트너를 원함"], male: ["보호자처럼 먼저 챙겨주기 — 실질적인 도움", "큰 나무 역할 — 네가 기댈 수 있어 라는 느낌", "좋아한다 직접 말하기 — 모호함은 통하지 않음"] },
  을: { female: ["먼저 다가오게 만들기 — 고양이처럼 관심 있다 없다 반복", "지성·능력으로 어필 — 을목은 한번 인정하면 완전히 빠짐", "서두르지 말 것 — 느리게 서서히 파고들기"], male: ["여자가 말한 작은 것 기억해서 다음에 언급하기", "가볍게 먼저 챙겨주면 엄청나게 고마워함", "섬세하게 감아드는 방식으로 — 절대 강압적으로 접근하지 말 것"] },
  병: { female: ["어디에 있어도 가장 밝고 에너지 넘치게 — 병화는 빛나는 곳에 끌림", "같이 있으면 신나는 사람이 돼라", "직접적으로 어필 — 모호한 제스처 통하지 않음"], male: ["웃음이 전염되는 밝은 에너지를 만들어라", "파티나 그룹 자리에서 가장 빛나는 존재가 돼라", "먼저 설레게 하는 대담한 제안 — 망설이지 말 것"] },
  정: { female: ["단 둘이 있는 조용한 공간에서 진심 어린 대화", "정화는 감성이 통하는 사람에게 마음이 열림", "속 이야기를 털어놓게 만들기 — 비밀 공유가 열쇠"], male: ["특별한 분위기를 만들어라 — 좋은 음식, 조용한 공간", "진심 어린 관심을 표현해라. 과장 없이 진짜로", "감성적인 공감으로 먼저 마음을 연결해라"] },
  무: { female: ["든든하게 받아주기 — 무토는 기댈 수 있는 사람에게 약함", "힘들 때 가장 먼저 옆에 있어주기", "무토의 말 한마디 한마디를 진지하게 들어주기"], male: ["안정감을 줘라 — 너와 있으면 편안해 라는 느낌", "실질적인 도움을 먼저 제공해라", "힘들 때 해결해주는 능력 있는 사람처럼 보여라"] },
  기: { female: ["작은 것 하나하나 세심하게 챙겨주기", "기토는 자신을 완벽하게 이해해주는 사람에게 약함", "완벽하게 맞춰주는 게 포인트"], male: ["밥은 먹었어? 같은 작은 챙김부터 시작", "여자가 좋아하는 것을 미리 파악하고 준비해라", "잔소리보다 행동으로 챙겨라"] },
  경: { female: ["쉽게 주지 말고 잡고 싶게 만들기 — 경금은 도전적인 상대에게 끌림", "능력·당당함 어필 — 나약해 보이면 흥미 잃음", "이유와 함께 직접적으로 어필할 것"], male: ["솔직하고 직접적으로 좋아한다고 표현해라", "강하고 주도적인 이미지를 보여줘라", "모호하게 굴지 말고 확실하게 행동해라"] },
  신: { female: ["분위기 + 외모 + 향기까지 완벽하게 세팅 — 신금은 디테일에 예민", "기억에 남는 특별한 경험을 만들어줘라", "절대 촌스러운 방식은 통하지 않음"], male: ["낭만적인 연출이 최강 — 꽃, 특별한 장소, 음악", "섬세하고 고급스럽게 대우해줘라", "아름다운 것으로 접근해라 — 음식, 장소, 선물의 격을 올려라"] },
  임: { female: ["능력과 지성으로 어필 — 임수 여자는 논리와 실력에 끌림", "오글거리는 감성 표현 NO — 직접적이고 담백하게", "한심해 보이는 순간 끝. 단단하고 자기 기준이 있는 사람임을 보여줘라"], male: ["쉽게 주지 말고 차갑게 — 임수 남자는 쉬운 상대에 흥미를 잃음", "감성 오버는 역효과. 논리적이고 냉정한 매력을 보여줘라", "능력·지성·자기관리를 어필해라"] },
  계: { female: ["취향을 공유하고 감성 교감으로 서서히 파고들기", "계수는 나를 완벽히 이해해주는 사람에게 약함", "감성적인 연결고리를 먼저 만들어라"], male: ["같은 음악, 같은 영화 취향으로 공감대를 만들어라", "감성적으로 공감해줘라 — 내 마음을 다 알아버린다는 느낌", "섬세하게 감각적으로 접근해라"] },
};

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

const ILJI_SIPSEONG: Record<string, string> = {
  정재: "배우자 자리의 기운이 안정적이고 지속적인 파트너십을 원합니다. 성적으로도 신뢰와 책임감이 있습니다.",
  편재: "배우자 자리의 기운이 다양한 이성과 교류가 많고 자유로운 성적 에너지를 띱니다.",
  정관: "배우자 자리의 기운이 원칙과 도리를 중시합니다. 성적으로 도덕적이고 진지합니다.",
  편관: "배우자 자리의 기운이 강한 자기주장과 카리스마를 띱니다. 관계에서 주도하거나 극적인 패턴이 나타납니다.",
  식신: "배우자 자리의 기운이 풍요롭고 여유로운 성적 에너지를 띱니다. 상대를 잘 챙기고 즐겁게 해줍니다.",
  상관: "배우자 자리의 기운이 파격적이고 자유로운 성적 표현을 선호합니다. 기존 틀을 벗어나는 에너지입니다.",
  비견: "배우자 자리의 기운이 대등한 파트너십을 추구합니다. 상대와 경쟁하거나 독립적인 관계를 만듭니다.",
  겁재: "배우자 자리의 기운이 강한 소유욕과 집착을 띱니다. 관계에서 강렬한 에너지가 나옵니다.",
  정인: "배우자 자리의 기운이 모성/부성적 보호 에너지를 띱니다. 감싸고 보살피는 따뜻한 성적 관계입니다.",
  편인: "배우자 자리의 기운이 신비롭고 독립적입니다. 잡힐 듯 잡히지 않는 매력이 있습니다.",
};
const 월지_조후: Record<string, string> = {
  사: "타고난 기운이 뜨겁고 건조한 편입니다. 여름 같이 뜨거운 성적 에너지.",
  오: "타고난 기운이 뜨겁고 건조한 편입니다. 여름 같이 뜨거운 성적 에너지.",
  미: "타고난 기운이 뜨겁고 건조한 편입니다. 여름 같이 뜨거운 성적 에너지.",
  해: "타고난 기운이 차갑고 깊은 편입니다. 쉽게 뜨겁지 않지만 일단 열리면 깊습니다.",
  자: "타고난 기운이 차갑고 깊은 편입니다. 쉽게 뜨겁지 않지만 일단 열리면 깊습니다.",
  축: "타고난 기운이 차갑고 깊은 편입니다. 쉽게 뜨겁지 않지만 일단 열리면 깊습니다.",
  인: "타고난 기운이 따뜻하고 자연스럽게 성장하는 편입니다. 균형 잡힌 성적 기운.",
  묘: "타고난 기운이 따뜻하고 자연스럽게 성장하는 편입니다. 균형 잡힌 성적 기운.",
  진: "타고난 기운이 따뜻하고 자연스럽게 성장하는 편입니다. 균형 잡힌 성적 기운.",
  신: "서늘(凉) 사주. 냉정하고 절제된 에너지. 깊이 파고들면 섬세하고 감각적.",
  유: "서늘(凉) 사주. 냉정하고 절제된 에너지. 깊이 파고들면 섬세하고 감각적.",
  술: "서늘(凉) 사주. 냉정하고 절제된 에너지. 깊이 파고들면 섬세하고 감각적.",
};

const GRADES = [
  { min: 86, grade: "S", label: "본능형", color: "#f43f5e", bg: "rgba(244,63,94,0.15)", border: "rgba(244,63,94,0.35)", desc: "타고난 매력이 치명적인 수준입니다. 의도하지 않아도 이성이 먼저 다가옵니다.", oneliner: "근처에 있기만 해도 주변 이성이 흔들립니다." },
  { min: 71, grade: "A", label: "매혹형", color: "#ec4899", bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.30)", desc: "강한 이성 매력을 타고났습니다. 노력하지 않아도 자연스럽게 끌립니다.", oneliner: "이성이 먼저 연락하는 타입입니다." },
  { min: 46, grade: "B", label: "감성형", color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)", desc: "은근하고 깊은 매력입니다. 처음엔 몰랐다가 시간이 지나면서 중독됩니다.", oneliner: "가까워질수록 빠져드는 타입입니다." },
  { min: 21, grade: "C", label: "은은형", color: "#8b5cf6", bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.22)", desc: "외면보다는 인격과 내면에서 매력이 나옵니다.", oneliner: "알면 알수록 좋아지는 타입입니다." },
  { min: 0,  grade: "D", label: "지성형", color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.20)", desc: "타고난 매력은 강한 편이 아니지만, 실력과 능력으로 매력을 만드는 타입입니다.", oneliner: "잘될수록 더 매력적으로 보이는 타입입니다." },
];

function getGrade(score: number) { return GRADES.find(g => score >= g.min) ?? GRADES[GRADES.length - 1]; }

function ErosSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const paymentKey = params.get("paymentKey") || "";
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 4900);

  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const resultRef = useRef<{ form: BirthFormData; result: SajuResult } | null>(null);

  useEffect(() => {
    async function init() {
      // Confirm payment (skip for STARPIECE)
      if (paymentKey !== "STARPIECE") {
        try {
          const res = await fetch("/api/payment/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentKey, orderId, amount }),
          });
          if (!res.ok) { setErrorMsg("결제 확인에 실패했습니다."); return; }
        } catch {
          setErrorMsg("결제 확인 중 오류가 발생했습니다."); return;
        }
      }

      try {
        const raw = sessionStorage.getItem("erosData");
        if (!raw) { setErrorMsg("분석 데이터가 없습니다. 처음부터 다시 시도해주세요."); return; }
        resultRef.current = JSON.parse(raw);
        setReady(true);
      } catch {
        setErrorMsg("데이터를 불러오는 중 오류가 발생했습니다.");
      }
    }
    init();
  }, [paymentKey, orderId, amount]);

  if (errorMsg) {
    return (
      <main className="min-h-screen bg-[#08010f] text-white flex flex-col items-center justify-center px-4">
        <BackButton />
        <div className="text-center max-w-sm">
          <p className="text-red-400 text-lg font-bold mb-3">오류 발생</p>
          <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
          <button onClick={() => router.push("/service/eros")} className="px-6 py-3 rounded-2xl bg-rose-600 text-white font-bold text-sm">다시 시도</button>
        </div>
      </main>
    );
  }

  if (!ready || !resultRef.current) {
    return (
      <main className="min-h-screen bg-[#08010f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">결과를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  const { form, result } = resultRef.current;

  const hasSinsal = (n: string) => result.sinsalList.some(s => s.name === n);
  const getSinsalPillars = (n: string) => result.sinsalList.find(s => s.name === n)?.pillars ?? [];
  const has도화   = hasSinsal("도화살");
  const has홍염   = hasSinsal("홍염살");
  const has진도화  = hasSinsal("진도화");
  const has역마   = hasSinsal("역마살");
  const has편야도화 = hasSinsal("편야도화");
  const has나체도화 = hasSinsal("나체도화");
  const has곤랑도화 = hasSinsal("곤랑도화");
  const has녹방도화 = hasSinsal("녹방도화");
  const has함지살  = hasSinsal("함지살");
  const 함지살기둥  = getSinsalPillars("함지살");
  const _rpd = result.pillarsDetail;
  const hasMokYok = [_rpd.year, _rpd.month, _rpd.day, _rpd.hour].filter(Boolean).some(p => p?.uunseong === "목욕");
  const mokYokStrong = _rpd.day?.uunseong === "목욕" || _rpd.hour?.uunseong === "목욕";
  const erosAllSipseong = [_rpd.year, _rpd.month, _rpd.day, _rpd.hour].filter(Boolean).flatMap(p => [p?.sipseongCg, p?.sipseongJj]).filter(Boolean);
  const hasPyeongwan = erosAllSipseong.includes("편관");
  const haHwa     = result.dominant.includes("화");

  const 음간목록 = ["을","정","기","신","계"];
  const 양간목록 = ["갑","병","무","경","임"];
  const ilganForScore = result.pillarsDetail.day.cg;
  const is음간 = 음간목록.includes(ilganForScore);
  const is양간 = 양간목록.includes(ilganForScore);
  const 수기운천간 = ["임","계"];
  const 수기운지지 = ["자","해","축"];
  const 화목기운천간 = ["갑","을","병","정"];
  const 화목기운지지 = ["인","묘","사","오"];
  const pd = result.pillarsDetail;
  const 수기운기둥수 = [pd.year, pd.month, pd.day, pd.hour].filter(p => p && (수기운천간.includes(p.cg) || 수기운지지.includes(p.jj))).length;
  const 화목기운기둥수 = [pd.year, pd.month, pd.day, pd.hour].filter(p => p && (화목기운천간.includes(p.cg) || 화목기운지지.includes(p.jj))).length;
  const has수기운강 = 수기운기둥수 >= 2 || result.dominant.includes("수");
  const has화목기운강 = 화목기운기둥수 >= 2 || result.dominant.includes("화") || result.dominant.includes("목");

  type ScoreFactor = { label: string; points: number; reason: string };
  const factors: ScoreFactor[] = [];
  let coreSignalCount = 0;

  if (has함지살) { factors.push({ label: "함지살 기운", points: 28, reason: `삼명통회 기준 도화 상위 매력살 — ${함지살기둥.join("·")}주에 자리` }); coreSignalCount++; }

  if (has편야도화) { factors.push({ label: "도화 기운 (전방위형)", points: 24, reason: "사주 곳곳에 퍼진 압도적인 인기 신호" }); coreSignalCount++; }
  else if (has도화) {
    const dohwaPillars = getSinsalPillars("도화살");
    const strong = dohwaPillars.includes("일") || dohwaPillars.includes("시");
    factors.push({ label: `도화 기운 (${dohwaPillars.join("·")}주)`, points: strong ? 14 : 9, reason: strong ? "본인의 매력으로 직접 드러나는 신호" : "분위기·환경에서 묻어나는 신호" }); coreSignalCount++;
  }

  if (has홍염) { factors.push({ label: "홍염 기운", points: 21, reason: "한 사람에게 강하게 꽂히는 1대1 색기 신호" }); coreSignalCount++; }
  if (has진도화)  { factors.push({ label: "도화 기운 (진성)",     points: 30, reason: "타고난 진짜 인기 신호 — 다수에게 풍기는 매력의 정점" }); coreSignalCount++; }
  if (has나체도화) { factors.push({ label: "본능형 일주 구조",     points: 30, reason: "솔직하고 직관적인 매력의 일주" }); coreSignalCount++; }
  if (has녹방도화) { factors.push({ label: "격있는 도화 기운",     points: 30, reason: "품격과 함께 자리한 매력" }); coreSignalCount++; }
  if (has곤랑도화) { factors.push({ label: "합·형 색기 구조",      points: 15, reason: "흔치 않지만 결이 다른 색기 구조" }); coreSignalCount++; }

  if (hasMokYok) { factors.push({ label: "관능 기운", points: mokYokStrong ? 22 : 13, reason: mokYokStrong ? "본인 매력·관능이 가장 강하게 드러나는 자리" : "관능적 감각을 타고난 기운" }); coreSignalCount++; }
  if (has역마) factors.push({ label: "활동적인 매력", points: 8, reason: "자유롭고 역동적인 인상" });
  if (haHwa)   factors.push({ label: "화(火) 기운 우세", points: 10, reason: "열정적이고 표현력 있는 매력" });

  if (form.gender === "female") {
    if (has수기운강) factors.push({ label: "깊은 음기·물 기운", points: 15, reason: "깊고 농밀한 흡인력" });
    if (is음간)      factors.push({ label: "음간 일간", points: 10, reason: "은근하고 깊은 음기의 매력" });
  } else {
    if (has화목기운강) factors.push({ label: "뜨거운 양기·화목 기운", points: 15, reason: "적극적이고 강한 흡인력" });
    if (is양간)        factors.push({ label: "양간 일간", points: 10, reason: "강하고 적극적인 양기의 매력" });
  }

  let comboBonus = 0;
  if (coreSignalCount >= 4) comboBonus = 36;
  else if (coreSignalCount >= 3) comboBonus = 22;
  else if (coreSignalCount >= 2) comboBonus = 10;
  if (comboBonus > 0) factors.push({ label: "매력 신호 동시 발현", points: comboBonus, reason: `${coreSignalCount}가지 매력 신호가 겹쳐 서로를 증폭시킴` });

  const _iljuKey = pd.day.cg + pd.day.jj;
  const _nightRank = ILJU_NIGHT_RANK[_iljuKey];
  if (_nightRank !== undefined) {
    const rankPts = _nightRank <= 20 ? 3 : _nightRank <= 54 ? 2 : 1;
    factors.push({ label: "일주 밤 매력", points: rankPts, reason: _nightRank <= 20 ? "밤의 분위기를 압도하는 일주" : "은근히 스며드는 밤의 매력" });
  }

  const rawScore = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.min(rawScore, 100);
  const grade  = getGrade(score);
  const ilgan  = result.pillarsDetail.day.cg;
  const ilji   = result.pillarsDetail.day.jj;
  const wolggan = result.pillarsDetail.month.cg;
  const app    = ILGAN_APPEARANCE[ilgan] ?? ILGAN_APPEARANCE["무"];
  const sex    = ILGAN_SEX[ilgan] ?? ILGAN_SEX["무"];
  const sexData = form.gender === "female" ? sex.female : sex.male;
  const hidden = ILJI_HIDDEN_CHARM[ilji] ?? { charm: "알면 알수록 빠져드는 매력입니다.", weapon: "깊은 내면의 에너지" };
  const tips   = SEDUCTION_TIPS[ilgan] ?? SEDUCTION_TIPS["무"];
  const tipList = form.gender === "female" ? tips.male : tips.female;
  const outerImage = WOLGGAN_OUTER[wolggan] ?? "사회적으로 안정적이고 신뢰감 있는 이미지.";

  const firstImpKey = `${pd.year.jj}:${ilgan}${ilji}`;
  const firstImpSpecial = FIRSTIMPRESSION_SPECIAL[firstImpKey] ?? null;

  const charmSinsals: { name: string; desc: string }[] = [];
  if (has함지살)  charmSinsals.push({ name: "함지살(咸池煞)", desc: `삼명통회 기준 도화보다 차원 깊은 매력살. 애교·교태·감각적 매력이 자연스럽게 흘러나오는 기운입니다. (${함지살기둥.join("·")}주)` });
  if (has진도화) charmSinsals.push({ name: "진도화(眞桃花)", desc: "이성이 먼저 다가오는 강한 끌림의 기운을 가지고 있습니다." });
  if (has홍염)   charmSinsals.push({ name: "홍염살(紅艶殺)", desc: "색정적 매력이 강해, 이성이 본능적으로 끌리는 기운입니다." });
  if (has도화)   charmSinsals.push({ name: "도화살(桃花殺)", desc: "자연스럽게 이성을 끌어당기는 에너지를 타고났습니다." });

  const targetGender = form.gender === "female" ? "남자" : "여자";

  const cgList = [pd.year.cg, pd.month.cg, pd.day.cg, pd.hour?.cg].filter(Boolean) as string[];
  const jjList = [pd.year.jj, pd.month.jj, pd.day.jj, pd.hour?.jj].filter(Boolean) as string[];

  const found천간합: typeof 천간합목록 = [];
  for (let i = 0; i < cgList.length; i++) for (let j = i + 1; j < cgList.length; j++) {
    const match = 천간합목록.find(h => (h.a === cgList[i] && h.b === cgList[j]) || (h.a === cgList[j] && h.b === cgList[i]));
    if (match && !found천간합.includes(match)) found천간합.push(match);
  }
  const found지지합: typeof 지지합목록 = [];
  for (let i = 0; i < jjList.length; i++) for (let j = i + 1; j < jjList.length; j++) {
    const match = 지지합목록.find(h => (h.a === jjList[i] && h.b === jjList[j]) || (h.a === jjList[j] && h.b === jjList[i]));
    if (match && !found지지합.includes(match)) found지지합.push(match);
  }
  const found충: typeof 충목록 = [];
  for (let i = 0; i < jjList.length; i++) for (let j = i + 1; j < jjList.length; j++) {
    const match = 충목록.find(h => (h.a === jjList[i] && h.b === jjList[j]) || (h.a === jjList[j] && h.b === jjList[i]));
    if (match && !found충.includes(match)) found충.push(match);
  }

  const 끌림력 = Math.min(100, 40 + (has도화 ? 25 : 0) + (has진도화 ? 25 : 0) + (has역마 ? 10 : 0) + (has함지살 ? 20 : 0));
  const 색기력 = Math.min(100, 30 + (has홍염 ? 35 : 0) + (hasMokYok ? 25 : 0) + (haHwa ? 10 : 0) + (has함지살 ? 15 : 0));
  const 밀당력 = Math.min(100, 35 + found충.length * 25 + (found천간합.length + found지지합.length) * 15);
  const 신체매력 = Math.min(100, 45 + (hasMokYok ? 20 : 0) + (haHwa ? 15 : 0) + (has도화 ? 10 : 0) + (has홍염 ? 10 : 0));
  const 요망력 = Math.round((끌림력 + 색기력 + 밀당력) / 3);

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
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24" id="eros-result">

        <div className="text-center mb-6">
          <h2 className="text-3xl font-black mb-1">나의 성적 매력</h2>
          <p className="text-gray-400 text-xs">{result.fourPillars}</p>
        </div>

        {/* 함지살 배너 (있을 때만) */}
        {has함지살 && (
          <div className="rounded-2xl p-4 mb-4 border border-amber-500/30" style={{ background: "rgba(245,158,11,0.08)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 text-xs font-black tracking-widest uppercase">함지살(咸池煞)</span>
              <span className="text-[10px] text-amber-500/60">삼명통회 기준 도화 상위 매력살</span>
            </div>
            <p className="text-sm text-amber-100/80 leading-relaxed">
              사주에 함지살이 자리해 애교·교태·감각적 매력이 자연스럽게 흘러나옵니다. 도화살과는 다른 개념으로, 음기(陰氣)와 풍류 에너지를 깊이 품은 매력이며 예술적 재능과도 연결됩니다.
            </p>
          </div>
        )}

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
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-2.5">점수 구성</p>
            <div className="space-y-2">
              {factors.map((f, i) => (
                <div key={i} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-200">{f.label}</p>
                    <p className="text-[11px] text-gray-500">{f.reason}</p>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: grade.color }}>+{f.points}</span>
                </div>
              ))}
            </div>
            {rawScore > 100 && (
              <p className="text-[11px] text-gray-500 mt-2.5 pt-2.5 border-t border-white/5">합산 {rawScore}점 → 100점 만점 기준 {score}점으로 환산</p>
            )}
          </div>
        </div>

        {/* ②  요망력 */}
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
                <span key={c} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/25">{c}</span>
              ))}
            </div>
          )}
        </div>

        {/* ③ 외모 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">나의 외모</p>
          <p className="text-sm text-gray-200 leading-relaxed">
            {app.face} {app.body} {app.vibe} 비슷한 분위기로는 <span className="font-semibold" style={{ color: grade.color }}>{app.celeb}</span> 같은 이미지가 있습니다.
            {" "}{getAppearanceAnalysis(result).points.join(" ")}
          </p>
        </div>

        {/* ④ 성적 에너지 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">나의 성적 에너지</p>
          <p className="text-sm text-gray-200 leading-relaxed">
            {sexData.power} {sexData.energy} {sexData.style} {ILGAN_DAYNIGHT[ilgan]?.[form.gender === "female" ? "female" : "male"] ?? "낮과 밤의 모습이 비슷한 타입입니다."}
            {hasMokYok && ` 게다가 감각과 관능이 가장 강한 위치를 타고나, ${form.gender === "female" ? "음기가 극도로 풍부하며 이성이 본능적으로 끌리고," : "양기가 강하고 이성을 끌어당기는 에너지가 있으며,"} 약간의 노출도 고급스럽게 소화합니다.`}
            {hasPyeongwan && " 강한 카리스마가 있어 말 한마디 없이도 포스가 느껴지고 압도적인 분위기 자체가 이성을 끌어당깁니다."}
            {form.gender === "female" && has수기운강 && " 수(水) 기운이 강해 상대를 깊이 끌어당기는 자기장 같은 매력이 있습니다."}
            {" "}{getSexlifeInsights(result).map(ins => ins.desc).join(" ")}
            {" "}{getSexEnergyAnalysis(result).points.join(" ")}
          </p>
        </div>

        {/* ⑤ 합·충 분석 */}
        {(found천간합.length > 0 || found지지합.length > 0 || found충.length > 0) && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">사주 기둥 사이에 숨겨진 합(合)·충(沖)의 에너지</p>
            <p className="text-sm text-gray-200 leading-relaxed">
              {found천간합.map(h => `${h.a}${h.b}합으로 합화 ${h.합화}을 이루어 ${h.desc}`).join(" ")}
              {found지지합.length > 0 && " " + found지지합.map(h => `${h.a}${h.b}합으로 합화 ${h.합화}을 이루어 ${h.desc}`).join(" ") + " 음양이 맞아 자연스럽게 끌리는 기운입니다."}
              {found충.length > 0 && ` 한편 ${found충.map(c => `${c.a}${c.b}충`).join(", ")}이 있어 긴장감과 자극이 강한 편입니다. ` + found충.map(c => c.desc).join(" ")}
            </p>
          </div>
        )}

        {/* ⑥ 배우자궁 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">배우자궁 분석</p>
          <p className="text-sm text-gray-200 leading-relaxed">
            {ILJI_HIDDEN_CHARM[ilji]?.charm ?? "알면 알수록 빠져드는 매력입니다."}
            {iljiSipseongDesc && ` ${iljiSipseongDesc}`}
            {woljiJohu && ` ${woljiJohu}`}
          </p>
        </div>

        {/* ⑦ 은근한 매력 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">은근한 매력</p>
          <p className="text-sm text-gray-200 leading-relaxed">
            {hidden.charm} 나의 은밀한 무기는 <span className="font-semibold" style={{ color: grade.color }}>{hidden.weapon}</span>입니다. 사회적으로 드러나는 외부 이미지로는, {outerImage}{ILJU_NIGHT_CHARM[ilgan + ilji] ? ` ${ILJU_NIGHT_CHARM[ilgan + ilji]}` : ""}{firstImpSpecial ? ` ${firstImpSpecial}` : ""}
          </p>
        </div>

        {/* ⑧ 타고난 매력 신호 */}
        {charmSinsals.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">타고난 매력 신호</p>
            <p className="text-sm text-gray-200 leading-relaxed">
              {charmSinsals.map(({ name, desc }) => `${name} — ${desc}`).join(" ")}
            </p>
          </div>
        )}

        {/* ⑨ 꼬시는 팁 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">{targetGender}를 꼬시는 법</p>
          <p className="text-sm text-gray-300 leading-relaxed">{tipList.join(" ")}</p>
        </div>

        <DohwaFormulaList result={result} />
        <SipseongInsight result={result} title="이성 매력의 뿌리 — 사주 속 핵심 기운" />

        <button onClick={() => router.push("/service/eros")}
          className="w-full mt-3 py-3.5 rounded-2xl font-bold text-sm border border-rose-700/40 text-rose-400 hover:bg-rose-950/30 transition-all">
          다시 분석하기
        </button>
        <ResultFooterActions targetId="eros-result" fileName="매력살" shareTitle="내 사주 분석 결과" shareText="Summer Palace에서 내 사주를 분석했어요" />
      </div>
    </main>
  );
}

export default function ErosSuccessPage() {
  return (
    <Suspense>
      <ErosSuccessContent />
    </Suspense>
  );
}
