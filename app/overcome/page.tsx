"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";

export const dynamic = "force-dynamic";

const SINSAL_OVERCOME: Record<string, {
  icon: string; color: string; name: string;
  problem: string; overcome: string[]; caution: string;
}> = {
  역마살: {
    icon: "🏃", color: "#16a34a", name: "역마살(驛馬殺)",
    problem: "정착이 안 됩니다.\n이직·이사가 잦습니다.\n한곳에 오래 있으면 답답해서 미칩니다.\n이건 의지의 문제가 아닙니다. 타고난 이동 에너지입니다.",
    overcome: [
      "이동을 막지 마세요. 이동하게 해주세요. 여행업·무역·해외 관련 직종이 맞습니다.",
      "정기적인 여행 계획을 세우세요. 이동 욕구가 해소되면 관계와 직장이 안정됩니다.",
      "한국보다 해외에서 더 잘 풀리는 경우가 많습니다. 해외 거주를 두려워 마세요.",
      "한곳에서 대박보다 여러 곳에서 수익이 자연스러운 구조를 만드세요.",
    ],
    caution: "억지로 정착을 강요하면 더 큰 이탈이 옵니다. 파트너에게 미리 이해시키세요.",
  },
  화개살: {
    icon: "🌙", color: "#818cf8", name: "화개살(華蓋殺)",
    problem: "고독합니다.\n주류에 섞이기가 어렵습니다.\n예술이나 종교에 지나치게 빠집니다.\n혼자 있어야 충전이 됩니다.",
    overcome: [
      "고독을 적으로 삼지 마세요. 창의적 힘으로 전환하세요. 화개살 예술가가 가장 독보적입니다.",
      "명상·수련·종교 활동이 화개살 에너지를 안정시킵니다.",
      "혼자만의 공간과 시간을 충분히 확보하세요. 강제 사교는 더 힘들게 합니다.",
      "많은 인맥보다 소수의 진짜 관계를 추구하세요. 이게 화개살의 방식입니다.",
    ],
    caution: "술·도박·게임 등 현실 도피에 빠지기 쉽습니다. 예술과 영성으로 에너지를 쏟으세요.",
  },
  겁살: {
    icon: "💥", color: "#f97316", name: "겁살(劫殺)",
    problem: "갑작스러운 사고·충돌·빼앗김이 옵니다.\n노력한 것을 갑자기 잃는 경험이 반복됩니다.\n충동이 강합니다.",
    overcome: [
      "겁살 에너지를 직업으로 사용하세요. 운동선수·군인·경찰·소방관·의사에서 빛납니다.",
      "결정 전 충분히 숙고하는 습관을 들이세요. 충동적 행동이 겁살을 악화시킵니다.",
      "재물을 한곳에 집중하지 마세요. 분산 투자·적금·보험으로 갑작스러운 손실을 대비하세요.",
      "정기 건강 검진이 필수입니다. 겁살은 신체적 충격에도 취약합니다.",
    ],
    caution: "화를 내거나 무리하게 몰아붙이면 겁살이 증폭됩니다. 침착함이 최고의 무기입니다.",
  },
  재살: {
    icon: "⚡", color: "#dc2626", name: "재살(災殺)",
    problem: "예기치 않은 재난·사고·관재가 옵니다.\n물·불·교통사고에 특히 주의가 필요합니다.",
    overcome: [
      "물가·운전·고소 상황에서 더욱 주의하세요. 사고 예방이 최우선입니다.",
      "재살이 겹치는 해에는 큰 거래·투자·수술을 피하는 것이 좋습니다.",
      "매년 정기적으로 액막이 의식을 행하면 기운이 완화됩니다.",
      "위험 관련 직종(보험·안전·구조)에서 오히려 강점이 됩니다.",
    ],
    caution: "겨울철과 자(子)월에 특히 조심하세요. 물 관련 사고를 특히 조심하세요.",
  },
  천살: {
    icon: "🌪️", color: "#6d28d9", name: "천살(天殺)",
    problem: "하늘의 변화·천재지변·예측 불가한 재난의 에너지입니다.\n기상이변에 영향을 받습니다.",
    overcome: [
      "기상 예보와 자연 현상에 민감하게 반응하세요. 재해 전에 직감이 옵니다.",
      "기도·명상·등산·천문 활동으로 에너지를 정화하세요.",
      "불규칙한 생활패턴이 천살을 자극합니다. 규칙적인 일상이 안정을 줍니다.",
      "극단적 행동(과식·과로·과음)을 피하세요.",
    ],
    caution: "여름 장마철과 태풍 시즌에 야외 활동을 자제하세요.",
  },
  망신살: {
    icon: "😳", color: "#ef4444", name: "망신살(亡身殺)",
    problem: "구설·명예 손상이 생기기 쉽습니다.\nSNS 논란이나 공개적 실수에 주의하세요.\n숨기던 것이 공개되는 경향이 있습니다.",
    overcome: [
      "말과 행동을 신중하게 하세요. '설마'하는 일이 공개되는 경향이 있습니다.",
      "SNS·언론 노출을 최소화하고, 공개 발언 전에 충분히 검토하세요.",
      "의상·외모에 신경 쓰세요. 망신살은 외적 실수로도 나타납니다.",
      "정직하게 행동하세요. 숨기거나 속이는 일이 가장 크게 폭로됩니다.",
    ],
    caution: "이성 관계에서 특히 조심하세요. 비밀 관계가 가장 먼저 망신살로 발현됩니다.",
  },
  고신살: {
    icon: "🌟", color: "#64748b", name: "고신살(孤神殺)",
    problem: "고독합니다.\n의지할 곳이 없는 느낌이 강합니다.\n인연이 끊어지거나 혼자 남겨지는 경험을 합니다.",
    overcome: [
      "고독을 두려워하지 마세요. 혼자일 때 오히려 에너지가 충전됩니다.",
      "종교·봉사·예술 활동으로 의미 있는 연결을 만들어 가세요.",
      "반려동물이 큰 위안이 됩니다.",
      "자기 계발에 집중하세요. 자수성가 기운이 있습니다.",
    ],
    caution: "억지로 결혼이나 연애를 강행하면 더 큰 고독이 찾아옵니다.",
  },
  귀문관살: {
    icon: "🔮", color: "#c084fc", name: "귀문관살(鬼門關殺)",
    problem: "신경이 예민합니다.\n영적 감수성이 강해 정신적 소진이 잦습니다.\n불안·공황·불면에 시달리기 쉽습니다.",
    overcome: [
      "예민함을 예술·상담·치유 분야로 승화하세요. 귀문관살 있는 사람이 최고의 상담사가 됩니다.",
      "잠들기 전 마음을 정화하는 루틴(명상·기도·일기 쓰기)을 만드세요.",
      "인파가 많은 곳에 오래 있으면 에너지가 소진됩니다. 혼자 충전하는 시간을 확보하세요.",
      "블랙투르말린·흑요석이나 정화 소금이 도움됩니다.",
    ],
    caution: "카페인·술·담배는 귀문관살의 예민함을 폭발시킵니다.",
  },
  양인살: {
    icon: "🗡️", color: "#f87171", name: "양인살(羊刃殺)",
    problem: "충동적이고 강한 추진력이 부작용을 낳습니다.\n사고·부상·다툼이 잦습니다.\n주변을 다치게 할 수 있습니다.",
    overcome: [
      "강한 에너지를 사회적으로 유용한 곳에 사용하세요. 운동·군인·경찰·외과의사가 맞습니다.",
      "결정적 순간에 '잠깐 멈추는' 습관을 들이세요.",
      "규칙적인 운동(격투기·무술·수영)으로 과잉 에너지를 소비하세요.",
      "쇠붙이(칼·가위·주사기)를 다루는 직업에서 오히려 대성합니다.",
    ],
    caution: "음주 후 충동적 행동이 가장 위험합니다.",
  },
  홍염살: {
    icon: "🔥", color: "#dc2626", name: "홍염살(紅艶殺)",
    problem: "이성 관계가 복잡해지기 쉽습니다.\n색정 구설이나 삼각 관계에 휘말릴 수 있습니다.",
    overcome: [
      "뛰어난 이성 매력을 예술·공연·서비스업으로 승화하세요. 연예인·유튜버가 잘 어울립니다.",
      "한 사람에게 집중하는 연습을 하세요.",
      "결혼 전에 충분히 연애 경험을 쌓는 것이 오히려 결혼 후 안정에 도움됩니다.",
      "댄스·음악·연극 같은 취미로 매력을 건강하게 발산하세요.",
    ],
    caution: "결혼 후에도 이성 인연이 계속 들어옵니다. 경계를 명확히 하는 습관이 중요합니다.",
  },
  자오충: {
    icon: "💧", color: "#0ea5e9", name: "자오충(子午沖)",
    problem: "수(水)와 화(火)가 충돌합니다.\n감정 기복이 극심합니다.\n직업과 거주지 변동이 잦습니다.",
    overcome: [
      "감정 기복을 관리하는 루틴(명상·일기·호흡법)이 필수입니다.",
      "프리랜서·컨설팅·다채널 수익으로 이동 에너지를 자산으로 전환하세요.",
      "심장과 신장을 동시에 보호하세요. 염분 줄이기, 유산소 운동, 충분한 수분 섭취.",
      "자·오 세운 겹침 시기에는 큰 이직·이사·투자를 피하세요.",
    ],
    caution: "연애에서 충동적인 이별과 재결합을 반복하기 쉽습니다.",
  },
  축미충: {
    icon: "🏔️", color: "#92400e", name: "축미충(丑未沖)",
    problem: "토(土)끼리 충돌합니다.\n재산 손실과 가족 갈등이 반복됩니다.\n토지·부동산·상속 분쟁이 생기기 쉽습니다.",
    overcome: [
      "부동산 거래와 상속 문제는 반드시 법적 서류와 전문가 자문을 거치세요.",
      "가족 간 금전 거래를 최소화하세요.",
      "소화기 건강을 관리하세요. 규칙적인 식사와 식이섬유 섭취가 필수입니다.",
      "부부 사이에 재정 구조를 투명하게 공유하세요.",
    ],
    caution: "토지·공동사업 투자는 충분히 검토 후 진행하세요.",
  },
  인신충: {
    icon: "⚡", color: "#7c3aed", name: "인신충(寅申沖)",
    problem: "목(木)과 금(金)의 강렬한 충돌입니다.\n예기치 않은 사고·교통 충돌·수술이 따릅니다.",
    overcome: [
      "교통수단 이용 시 항상 방어 운전을 하세요. 인신충은 교통사고 에너지가 가장 강합니다.",
      "강한 추진력을 직업으로 승화하세요. 스포츠·구조·응급의료에서 최고의 성과를 냅니다.",
      "중요한 결정 전 72시간 규칙을 적용하세요. 3일 후에도 같은 생각이면 행동하세요.",
      "팔·다리·척추 부위의 외상과 관절 건강에 주의하세요.",
    ],
    caution: "인신충이 대운·세운에서 겹치는 시기에는 해외여행과 모험 활동을 자제하세요.",
  },
  묘유충: {
    icon: "🌸", color: "#be185d", name: "묘유충(卯酉沖)",
    problem: "목(木)과 금(金)의 충돌로 부부·형제 갈등이 반복됩니다.\n간·폐 건강이 약해집니다.",
    overcome: [
      "파트너와 소통 방식을 개선하세요. 중재자를 통한 소통이 효과적입니다.",
      "간과 폐를 동시에 관리하세요. 절주·금연이 최우선입니다.",
      "형제·자매와 금전 거래를 피하세요.",
      "봄(묘월)과 가을(유월)에 건강과 관계 충돌이 심화됩니다.",
    ],
    caution: "묘유충은 이혼·별거 에너지가 강합니다. 파트너십 문제는 조기에 상담을 받으세요.",
  },
  진술충: {
    icon: "⚖️", color: "#059669", name: "진술충(辰戌沖)",
    problem: "토(土)끼리 충돌합니다.\n관재·구설·재산 다툼이 따릅니다.\n소화기 건강에 손상이 올 수 있습니다.",
    overcome: [
      "계약서와 법적 문서를 꼼꼼히 검토하는 습관을 들이세요.",
      "직업에서 법적 분쟁 가능성이 있는 행동을 미리 차단하세요.",
      "위·대장 건강을 관리하세요. 규칙적인 식사가 필수입니다.",
      "부동산 거래 시 전문가 감정과 등기부등본 확인을 철저히 하세요.",
    ],
    caution: "진술충이 세운에 겹치는 해에는 소송·세금·행정 처분을 조심하세요.",
  },
  사해충: {
    icon: "🌊", color: "#0369a1", name: "사해충(巳亥沖)",
    problem: "화(火)와 수(水)의 격렬한 충돌입니다.\n예기치 못한 사고·화재·수난의 에너지가 강합니다.",
    overcome: [
      "화재와 물 관련 사고를 특히 조심하세요. 가스 잠금, 전기 점검이 필수입니다.",
      "급격한 변화를 유연하게 받아들이는 마음가짐이 충 에너지를 줄입니다.",
      "심장과 신장을 동시에 보호하세요.",
      "변동 에너지를 사업 전환·창업·이직에 활용하세요. 변화 직전에 새 기회가 옵니다.",
    ],
    caution: "겨울(해월)과 여름(사월)에 에너지 충돌이 최고조에 달합니다.",
  },
  인사신삼형: {
    icon: "⚔️", color: "#b91c1c", name: "인사신삼형(寅巳申三刑)",
    problem: "권력욕이 극단으로 치닫아 자기 자신을 파괴합니다.\n관재·수술·사고가 잦습니다.\n주변과 갈등이 극심합니다.",
    overcome: [
      "권력욕을 긍정적으로 승화하세요. 리더십·경영·정치에서 합법적으로 발휘하세요.",
      "남을 통제하려는 욕구를 자기 관리로 전환하세요. 자기 수련이 삼형살을 담아냅니다.",
      "외과·응급·소방·군인 등 강한 에너지가 요구되는 분야가 올바른 출구입니다.",
      "인사신 세운이 겹치는 시기에는 소송·충돌·수술을 각별히 조심하세요.",
    ],
    caution: "권력을 위해 도덕과 법을 넘으면 삼형살의 폭발이 옵니다.",
  },
  축술미삼형: {
    icon: "🐂", color: "#78350f", name: "축술미삼형(丑戌未三刑)",
    problem: "은혜를 잊고 배신하거나 배신당합니다.\n인맥에서 배신이 반복됩니다.\n다리·위장 건강이 약합니다.",
    overcome: [
      "가까운 사람과 금전·사업 거래를 최소화하세요.",
      "의리를 강요하지 마세요. 과거 관계에 집착할수록 더 큰 배신이 옵니다.",
      "다리·무릎·소화기를 관리하세요. 관절 검진과 규칙적인 식사가 필요합니다.",
      "공동 대표나 공동 계좌보다는 독립적 구조를 택하세요.",
    ],
    caution: "보증·연대보증은 절대 서지 마세요.",
  },
  자묘형: {
    icon: "💬", color: "#0f766e", name: "자묘형(子卯刑)",
    problem: "예의 없는 행동이나 말실수로 구설수에 오릅니다.\n선을 넘는 농담이 관계를 망칩니다.",
    overcome: [
      "'이 말이 상대방에게 어떻게 들릴까?' 먼저 생각하는 습관을 들이세요.",
      "공식 석상에서의 언행을 절제하세요.",
      "SNS와 온라인 발언에 특히 조심하세요. 자묘형은 온라인 구설이 빠르게 확산됩니다.",
      "의사소통 강의·비폭력 대화(NVC) 연습이 큰 도움이 됩니다.",
    ],
    caution: "자묘형이 있는 해에는 공개 발언과 미디어 노출을 최소화하세요.",
  },
  자형살: {
    icon: "🔄", color: "#475569", name: "자형살(自刑殺)",
    problem: "스스로 화를 자초합니다.\n잘 되다가 스스로 망치는 패턴이 반복됩니다.",
    overcome: [
      "자기 파괴 패턴을 인식하는 것이 첫 번째입니다. 상담사와 함께 반복 패턴을 분석하세요.",
      "중요한 결정 전에 반드시 신뢰할 수 있는 제3자의 의견을 구하세요.",
      "자기 비하·자학적 사고를 인식하고 중단하는 연습(인지행동치료)이 핵심 극복법입니다.",
      "성공 경험을 기록하고 자주 돌아보세요.",
    ],
    caution: "술과 도박은 자형살의 자기 파괴 에너지를 폭발시킵니다.",
  },
  지지파: {
    icon: "💔", color: "#9333ea", name: "지지파(地支破)",
    problem: "이별·손재·인연 파탄의 기운입니다.\n소중한 관계가 갑자기 끊어집니다.\n재물이 새어나갑니다.",
    overcome: [
      "중요한 인연을 당연하게 여기지 마세요. 먼저 연락하는 습관을 들이세요.",
      "자동 이체 확인, 구독 서비스 정리, 불필요한 지출 삭제가 손재를 줄입니다.",
      "계약·거래 전 세부 조건을 꼼꼼히 검토하세요.",
      "물질보다 관계에 집중하세요.",
    ],
    caution: "파살 기운이 강한 시기에는 큰 투자나 보증을 피하세요.",
  },
  지지해: {
    icon: "🗡️", color: "#991b1b", name: "지지해(地支害)",
    problem: "가까운 사람에게 방해와 배신을 당합니다.\n음모와 질투, 뒤에서 발목 잡는 일이 생깁니다.",
    overcome: [
      "모든 사람을 다 믿지 마세요. 가장 가까운 자리의 사람에게서 배신이 오는 경향이 있습니다.",
      "비밀을 최소화하세요. 해살이 있는 사람의 비밀은 반드시 새어나갑니다.",
      "광범위한 인맥보다 깊이 있는 관계 소수를 유지하세요.",
      "경쟁자와 직접 대결보다 실력으로 묵묵히 전진하는 전략을 택하세요.",
    ],
    caution: "해살이 강한 시기에는 중요한 프로젝트 정보를 넓게 공유하지 마세요.",
  },
};

const ELEMENT_OVERCOME: Record<string, {
  color: string; icon: string;
  overDesc: string; lackDesc: string;
  chakColor: string; direction: string; numbers: string; objects: string; food: string;
  healthTip: string; overFix: string; lackFix: string;
}> = {
  목: {
    color: "#16a34a", icon: "🌿",
    overDesc: "고집이 끝이 없습니다.\n분노가 자주 올라옵니다.\n간 건강이 나빠집니다.",
    lackDesc: "의욕이 없습니다.\n결단을 못 내립니다.\n시작을 자꾸 미룹니다.",
    overFix: "흰색·은색 계열을 가까이 하세요. 서쪽 방향으로 앉으세요. 매운 음식.",
    lackFix: "초록색을 인테리어에 넣으세요. 동쪽 방향으로 앉으세요. 새벽 산책을 하세요.",
    chakColor: "초록색, 연두색",
    direction: "동쪽",
    numbers: "3, 8",
    objects: "관엽식물, 나무 소품, 대나무",
    food: "신맛 — 귤, 레몬, 키위, 식초",
    healthTip: "간·담낭을 챙기세요. 절주 필수.",
  },
  화: {
    color: "#dc2626", icon: "🔥",
    overDesc: "급합니다.\n잠을 못 잡니다.\n심장이 두근거립니다.",
    lackDesc: "표현을 못 합니다.\n소극적으로 변합니다.\n추진력이 사라집니다.",
    overFix: "파란색 계열을 들이세요. 북쪽 방향을 활용하세요. 수영, 차가운 음료.",
    lackFix: "붉은색을 인테리어에 넣으세요. 남쪽 방향을 활용하세요. 촛불 명상.",
    chakColor: "붉은색, 주황색",
    direction: "남쪽",
    numbers: "2, 7",
    objects: "촛불, 붉은 꽃, 화분",
    food: "쓴맛 — 커피, 녹차, 쑥, 씀바귀",
    healthTip: "심장·혈압·눈을 챙기세요.",
  },
  토: {
    color: "#92400e", icon: "🏔️",
    overDesc: "고집이 세지고 완고해집니다.\n소화가 잘 안 됩니다.\n변화가 너무 싫어집니다.",
    lackDesc: "믿음을 주지 못합니다.\n현실감이 흐려집니다.\n불안정한 느낌이 강합니다.",
    overFix: "초록색·나무 소품을 들이세요. 동쪽 방향을 활용하세요. 신맛 음식.",
    lackFix: "황토·자연 소재를 집에 넣으세요. 규칙적인 생활을 하세요. 단맛 음식.",
    chakColor: "황토색, 노란색",
    direction: "중앙",
    numbers: "5, 10",
    objects: "황토 소품, 도자기, 돌",
    food: "단맛 — 고구마, 호박, 꿀, 대추",
    healthTip: "소화기·비장·위를 챙기세요.",
  },
  금: {
    color: "#7c3aed", icon: "⚔️",
    overDesc: "너무 냉정해집니다.\n완벽주의로 주변이 힘들어합니다.\n폐 건강이 약해집니다.",
    lackDesc: "의지력이 떨어집니다.\n판단력이 흐려집니다.\n결단을 못 내립니다.",
    overFix: "붉은색을 가까이 하세요. 남쪽 방향을 활용하세요. 활동적인 취미.",
    lackFix: "흰색·실버 계열을 들이세요. 서쪽 방향을 활용하세요. 저녁 5~9시를 적극 활용.",
    chakColor: "흰색, 은색, 골드",
    direction: "서쪽",
    numbers: "4, 9",
    objects: "금속 소품, 흰색 인테리어, 시계",
    food: "매운맛 — 마늘, 생강, 고추, 무",
    healthTip: "폐·대장·피부를 챙기세요.",
  },
  수: {
    color: "#0369a1", icon: "🌊",
    overDesc: "우울감이 옵니다.\n신장이 무거워집니다.\n두려움이 강해집니다.",
    lackDesc: "지혜가 흐려집니다.\n건망증이 생깁니다.\n의지력이 약해집니다.",
    overFix: "황토색을 들이세요. 규칙적인 생활을 하세요. 단맛 음식.",
    lackFix: "파란색·검은색을 인테리어에 넣으세요. 북쪽 방향을 활용하세요. 밤 9시~1시 집중.",
    chakColor: "파란색, 검은색",
    direction: "북쪽",
    numbers: "1, 6",
    objects: "수족관, 분수대, 파란 소품",
    food: "짠맛 — 해산물, 된장, 미역, 다시마",
    healthTip: "신장·방광·뼈를 챙기세요.",
  },
};

export default function OvercomePage() {
  const router = useRouter();
  const [step, setStep] = useState<"splash" | "main">("splash");
  const [name, setName] = useState("나");
  const [dominant, setDominant] = useState<string[]>([]);
  const [lacking, setLacking] = useState<string[]>([]);
  const [mySinsals, setMySinsals] = useState<string[]>([]);
  const [hasSaju, setHasSaju] = useState(false);
  const [activeTab, setActiveTab] = useState<"sinsal" | "element">("sinsal");
  const [counter] = useState(() => Math.floor(Math.random() * 500) + 3200);

  useEffect(() => {
    const saved = loadSajuData();
    if (saved) {
      setHasSaju(true);
      setName(saved.name || "나");
      try {
        const r = analyzeSaju({
          birthYear: saved.birthYear, birthMonth: saved.birthMonth, birthDay: saved.birthDay,
          birthHour: saved.birthHour ?? null, birthMinute: saved.birthMinute ?? null,
          name: saved.name || "", gender: saved.gender || "female",
          birthPlace: saved.birthPlace || "서울", style: "auto",
          productType: "report", useJajasi: saved.useJajasi || false,
        });
        setDominant(r.dominant);
        setLacking(r.lacking);
        setMySinsals(r.sinsalList.map(s => s.name));
      } catch {}
    }
  }, []);

  // ── 스플래시 ──
  if (step === "splash") {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col relative overflow-hidden">
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 2s ease-in-out infinite}`}</style>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[160px]" style={{ background: "rgba(239,68,68,0.1)" }} />
          <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: "rgba(139,92,246,0.08)" }} />
        </div>

        <div className="relative z-10 flex items-center px-5 py-4">
          <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>
          <span className="ml-3 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/15">무료</span>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full pb-12">

          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-red-400 pulse" />
            <span className="text-xs text-gray-400">지금까지 <strong className="text-red-400">{counter.toLocaleString()}명</strong>이 확인함</span>
          </div>

          <div className="mb-8 space-y-3">
            <p className="text-xl font-black" style={{ color: "rgba(255,255,255,0.5)" }}>나쁜 사주?</p>
            <p className="text-4xl font-black leading-tight text-white">없습니다.</p>
            <p className="text-4xl font-black leading-tight" style={{ color: "#f87171" }}>방향만 바꾸면<br />됩니다.</p>
            <p className="text-sm text-gray-500 leading-relaxed pt-2">
              모든 신살(神殺)과 오행 불균형에는<br />
              극복법이 있습니다.<br />
              어떤 에너지도 방향만 맞으면 강점이 됩니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: "⚡", title: "신살 극복법", desc: "역마·화개·귀문관살 등 15가지" },
              { icon: "🌿", title: "오행 불균형", desc: "부족·과다 오행 채우는 법" },
              { icon: "🎨", title: "색·방향·숫자", desc: "오행별 개운 아이템 총정리" },
              { icon: "🍽️", title: "음식·물건", desc: "일상에서 기운 채우는 방법" },
            ].map(f => (
              <div key={f.title} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-2xl">{f.icon}</span>
                <p className="text-sm font-bold text-white mt-2">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          {hasSaju && (mySinsals.length > 0 || lacking.length > 0) && (
            <div className="mb-6 p-4 rounded-2xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-xs font-bold text-red-400 mb-2">⚠️ {name}님의 사주 기반 분석 준비됨</p>
              <div className="flex flex-wrap gap-2">
                {mySinsals.slice(0, 3).map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-300">{s}</span>
                ))}
                {lacking.map(el => (
                  <span key={el} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">{el} 부족</span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setStep("main")}
            className="w-full py-5 rounded-2xl font-black text-lg text-white shadow-2xl transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)" }}
          >
            내 사주 극복법 보기 →
          </button>
          <p className="text-center text-xs text-gray-600 mt-3">무료 · 신살 15가지 + 오행 불균형 가이드</p>
        </div>
      </main>
    );
  }

  // ── 본문 ──
  const relevantSinsals = Object.keys(SINSAL_OVERCOME).filter(k => mySinsals.includes(k));
  const neutralSinsals = Object.keys(SINSAL_OVERCOME).filter(k => !mySinsals.includes(k));

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-red-950/20 to-transparent" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep("splash")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 뒤로</button>
          <span className="text-xs text-green-400/60 bg-green-500/10 border border-green-500/15 px-2 py-1 rounded-full">무료</span>
        </div>

        <div className="text-center mb-6">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-2xl font-black mb-2">
            <span className="text-red-400">사주 극복</span> 가이드
          </h1>
          <p className="text-gray-400 text-sm">
            {hasSaju ? `${name}님의 사주 기반 맞춤 극복 가이드` : "신살과 오행 불균형 극복 완벽 가이드"}
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
          <p className="text-sm text-red-200/80 leading-relaxed">
            <strong className="text-red-300">&quot;나쁜 사주는 없습니다.&quot;</strong><br />
            모든 신살과 오행 불균형에는 극복법이 있습니다.
          </p>
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={() => setActiveTab("sinsal")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition border ${activeTab === "sinsal" ? "text-white border-white/20 bg-white/10" : "text-gray-500 border-white/5 bg-white/[0.02]"}`}>
            신살 극복법
          </button>
          <button onClick={() => setActiveTab("element")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition border ${activeTab === "element" ? "text-white border-white/20 bg-white/10" : "text-gray-500 border-white/5 bg-white/[0.02]"}`}>
            오행 불균형 극복
          </button>
        </div>

        {activeTab === "sinsal" && (
          <div>
            {hasSaju && relevantSinsals.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-xs text-red-400 font-bold">{name}님의 신살</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="space-y-4 mb-8">
                  {relevantSinsals.map(key => (
                    <SinsalCard key={key} s={SINSAL_OVERCOME[key]} isOwned />
                  ))}
                </div>
              </>
            )}

            {hasSaju && relevantSinsals.length === 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6">
                <p className="text-sm text-green-300">✅ 주요 흉살이 없는 사주입니다. 아래 내용은 참고용입니다.</p>
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-xs text-gray-600">전체 신살 극복법</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="space-y-4">
              {(hasSaju ? neutralSinsals : Object.keys(SINSAL_OVERCOME)).map(key => (
                <SinsalCard key={key} s={SINSAL_OVERCOME[key]} isOwned={false} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "element" && (
          <div>
            {hasSaju && (dominant.length > 0 || lacking.length > 0) && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  {dominant.length > 0 && (
                    <div>
                      <p className="text-xs text-red-400 font-bold mb-2">과다 오행</p>
                      <div className="flex flex-wrap gap-1">
                        {dominant.slice(0, 2).map(el => (
                          <span key={el} className="text-sm font-black px-3 py-1 rounded-full"
                            style={{ backgroundColor: `${ELEMENT_OVERCOME[el]?.color || "#666"}33`, color: ELEMENT_OVERCOME[el]?.color || "#fff" }}>
                            {ELEMENT_OVERCOME[el]?.icon} {el}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {lacking.length > 0 && (
                    <div>
                      <p className="text-xs text-blue-400 font-bold mb-2">부족 오행</p>
                      <div className="flex flex-wrap gap-1">
                        {lacking.map(el => (
                          <span key={el} className="text-sm font-black px-3 py-1 rounded-full bg-blue-500/10 text-blue-400">
                            {ELEMENT_OVERCOME[el]?.icon} {el}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(ELEMENT_OVERCOME).map(([el, data]) => {
                const isOver = dominant.includes(el);
                const isLack = lacking.includes(el);
                return (
                  <div key={el} className={`rounded-2xl border p-5 ${isOver ? "border-red-500/30 bg-red-500/5" : isLack ? "border-blue-500/30 bg-blue-500/5" : "border-white/10 bg-white/[0.03]"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{data.icon}</span>
                        <span className="font-black text-white text-base">{el}(</span>
                        <span className="font-black" style={{ color: data.color }}>{el}木火土金水</span>
                        <span className="font-black text-white">)</span>
                      </div>
                      {isOver && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">과다</span>}
                      {isLack && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">부족</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-[10px] font-bold text-red-400 mb-1">과다일 때</p>
                        <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "rgba(255,255,255,0.55)" }}>{data.overDesc}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-[10px] font-bold text-blue-400 mb-1">부족일 때</p>
                        <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "rgba(255,255,255,0.55)" }}>{data.lackDesc}</p>
                      </div>
                    </div>

                    {isLack && (
                      <div className="rounded-xl p-4 mb-3" style={{ background: `${data.color}10`, border: `1px solid ${data.color}25` }}>
                        <p className="text-xs font-bold mb-3" style={{ color: data.color }}>{el} 기운 채우는 법</p>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                          <div><span className="text-gray-500">색 </span><span className="text-white font-semibold">{data.chakColor}</span></div>
                          <div><span className="text-gray-500">방향 </span><span className="text-white font-semibold">{data.direction}</span></div>
                          <div><span className="text-gray-500">숫자 </span><span className="text-white font-semibold">{data.numbers}</span></div>
                          <div><span className="text-gray-500">건강 </span><span className="text-white font-semibold">{data.healthTip}</span></div>
                          <div className="col-span-2"><span className="text-gray-500">물건 </span><span className="text-white font-semibold">{data.objects}</span></div>
                          <div className="col-span-2"><span className="text-gray-500">음식 </span><span className="text-white font-semibold">{data.food}</span></div>
                        </div>
                      </div>
                    )}

                    {!isLack && (
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2 text-xs text-gray-400">
                          <span style={{ color: data.color }} className="shrink-0 mt-0.5 font-bold">→</span>
                          {isOver ? data.overFix : data.lackFix}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
                          <span><span className="text-gray-600">색 </span><span style={{ color: data.color }}>{data.chakColor}</span></span>
                          <span><span className="text-gray-600">방향 </span><span style={{ color: data.color }}>{data.direction}</span></span>
                          <span><span className="text-gray-600">음식 </span><span style={{ color: data.color }}>{data.food}</span></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 bg-gradient-to-br from-pink-600/10 to-violet-600/10 border border-pink-500/20 rounded-2xl p-5 text-center">
          <p className="text-sm font-bold text-white mb-1">내 사주의 숨은 매력도 확인해보세요</p>
          <p className="text-xs text-gray-400 mb-3">나쁜 기운이 있어도 매력은 따로 있습니다</p>
          <button onClick={() => router.push("/charm")} className="bg-gradient-to-r from-pink-600 to-violet-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition active:scale-[0.97]">
            ✨ 나의 매력 분석 (무료)
          </button>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">본 내용은 사주 이론 기반 참고 자료입니다. 의료·법률 조언이 아닙니다.</p>
      </div>
    </main>
  );
}

function SinsalCard({ s, isOwned }: { s: typeof SINSAL_OVERCOME[string]; isOwned: boolean }) {
  const [open, setOpen] = useState(isOwned);
  return (
    <div className={`rounded-2xl border ${isOwned ? "border-red-500/30 bg-red-500/5" : "border-white/8 bg-white/[0.02]"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left">
        <span className="text-2xl">{s.icon}</span>
        <div className="flex-1">
          <p className={`font-bold ${isOwned ? "text-red-200" : "text-gray-300"}`}>{s.name}</p>
          <p className="text-xs text-gray-500 truncate">{s.problem.split("\n")[0]}</p>
        </div>
        {isOwned && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 shrink-0">해당</span>}
        <span className="text-gray-600 text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          <p className="text-xs text-gray-400 mb-3 leading-relaxed whitespace-pre-line border-t border-white/5 pt-3">{s.problem}</p>
          <div className="space-y-2 mb-3">
            {s.overcome.map((o, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <span style={{ color: s.color }} className="shrink-0 mt-0.5 font-bold">{i + 1}.</span>
                {o}
              </div>
            ))}
          </div>
          <div className="bg-yellow-500/8 border border-yellow-500/15 rounded-xl p-3">
            <p className="text-xs text-yellow-300/80">⚠️ 주의: {s.caution}</p>
          </div>
        </div>
      )}
    </div>
  );
}
