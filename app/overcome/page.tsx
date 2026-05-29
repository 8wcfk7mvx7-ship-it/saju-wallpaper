"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";

export const dynamic = "force-dynamic";

// ── 신살별 극복법 ─────────────────────────────────────────────────────────────
const SINSAL_OVERCOME: Record<string, {
  icon: string; color: string; name: string;
  problem: string; overcome: string[]; caution: string;
}> = {
  역마살: {
    icon: "🏃", color: "#16a34a", name: "역마살(驛馬殺)",
    problem: "정착하지 못하고 이직·이사가 잦습니다. 한곳에 오래 머물면 답답함이 극에 달합니다.",
    overcome: [
      "이동을 막지 말고 오히려 적극 활용하세요. 여행업·무역·해외 관련 직종이 길합니다.",
      "정기적인 여행 계획을 세워 이동 욕구를 해소하면 관계·직장에서 안정이 생깁니다.",
      "한국보다 해외에서 더 잘 풀리는 경우가 많습니다. 해외 거주를 두려워 마세요.",
      "역마살이 있으면 '한 곳에서 대박'보다 '여러 곳에서 수익'이 자연스럽습니다.",
    ],
    caution: "억지로 정착을 강요하면 더 큰 이탈이 옵니다. 파트너에게 이 점을 미리 이해시키세요.",
  },
  화개살: {
    icon: "🌙", color: "#818cf8", name: "화개살(華蓋殺)",
    problem: "고독함이 강하고 주류에 섞이기 어렵습니다. 예술·종교에 지나치게 탐닉할 수 있습니다.",
    overcome: [
      "고독을 적으로 삼지 말고 창의적 힘으로 승화하세요. 화개살 예술가들이 가장 독보적인 작품을 냅니다.",
      "명상·수련·종교 활동이 화개살의 에너지를 안정시키고 방향을 잡아줍니다.",
      "혼자만의 공간과 시간을 충분히 확보하세요. 강제로 사교 활동을 늘리면 더 힘들어집니다.",
      "화개살의 고독함은 '깊이'입니다. 많은 인맥보다 소수의 진짜 관계를 추구하세요.",
    ],
    caution: "술·도박·게임 등 현실 도피 수단에 빠지기 쉽습니다. 대신 예술과 영성으로 에너지를 쏟으세요.",
  },
  겁살: {
    icon: "💥", color: "#f97316", name: "겁살(劫殺)",
    problem: "갑작스러운 사고·충돌·빼앗김의 에너지. 노력한 것을 갑자기 잃는 경험을 합니다.",
    overcome: [
      "직업에서 겁살 에너지를 사용하세요. 운동선수·군인·경찰·소방관·의사 등 날카로운 에너지가 필요한 직종에서 빛납니다.",
      "결정을 내리기 전 충분히 숙고하는 습관을 들이세요. 충동적 행동이 겁살을 악화시킵니다.",
      "재물을 한곳에 집중하지 마세요. 분산 투자·적금·보험으로 갑작스러운 손실을 대비하세요.",
      "체력 관리와 정기 건강 검진이 필수입니다. 겁살은 신체적 충격에도 취약합니다.",
    ],
    caution: "화를 내거나 무리하게 몰아붙이면 겁살의 에너지가 증폭됩니다. 침착함이 최고의 무기입니다.",
  },
  재살: {
    icon: "⚡", color: "#dc2626", name: "재살(災殺)",
    problem: "예기치 않은 재난·사고·관재의 에너지. 물·불·교통사고에 특히 주의가 필요합니다.",
    overcome: [
      "물가·운전·고소공포 관련 상황에서 더욱 주의를 기울이세요. 사고 예방이 최우선입니다.",
      "재살이 있는 해(대운·세운 겹침)에는 큰 거래·투자·수술을 피하는 것이 좋습니다.",
      "매년 정기적으로 부적·기도·산제(山祭) 등 전통적 액막이 의식을 행하면 기운이 완화됩니다.",
      "직업으로 승화하세요. 재살 에너지는 위험 관련 직종(보험·안전·구조)에서 오히려 강점이 됩니다.",
    ],
    caution: "겨울철과 자(子)월에 특히 조심하세요. 물 관련 사고 예방에 힘쓰세요.",
  },
  천살: {
    icon: "🌪️", color: "#6d28d9", name: "천살(天殺)",
    problem: "하늘의 기운에 따른 변화·천재지변·예측 불가한 재난의 에너지. 기상이변에 영향을 받습니다.",
    overcome: [
      "기상 예보와 자연 현상에 민감하게 반응하세요. 천살이 있는 사람은 자연 재해 전에 직감이 옵니다.",
      "하늘과 연결되는 활동(기도·명상·등산·천문)으로 에너지를 정화하세요.",
      "불규칙한 생활패턴이 천살을 자극합니다. 규칙적인 일상이 안정을 가져옵니다.",
      "음양 균형이 중요합니다. 극단적 행동(과식·과로·과음)을 피하세요.",
    ],
    caution: "여름 장마철과 태풍 시즌에 야외 활동을 자제하세요.",
  },
  망신살: {
    icon: "😳", color: "#ef4444", name: "망신살(亡身殺)",
    problem: "구설·명예 손상·망신스러운 일이 생기기 쉽습니다. SNS 논란이나 공개적 실수에 주의하세요.",
    overcome: [
      "말과 행동을 신중하게 하세요. 망신살이 있을 때 '설마'하는 일이 공개되는 경향이 있습니다.",
      "SNS·언론 노출을 최소화하고, 공개 발언 전에 충분히 검토하세요.",
      "의상·외모에 신경 쓰세요. 망신살은 종종 외적인 실수로 나타납니다.",
      "정직하게 행동하세요. 숨기거나 속이는 일이 가장 크게 폭로되는 것이 망신살입니다.",
    ],
    caution: "이성 관계에서 특히 조심하세요. 비밀 관계나 불륜이 가장 먼저 망신살로 발현됩니다.",
  },
  고신살: {
    icon: "🌟", color: "#64748b", name: "고신살(孤神殺)",
    problem: "고독하고 의지할 곳이 없는 기운. 인연이 끊어지거나 혼자 남겨지는 경험을 합니다.",
    overcome: [
      "고독을 두려워하지 마세요. 고신살 있는 사람은 혼자일 때 오히려 에너지가 충전됩니다.",
      "종교·봉사·예술 활동으로 의미 있는 연결을 만들어 가세요.",
      "반려동물이 큰 위안이 됩니다. 인간 관계의 빈자리를 채워주는 존재입니다.",
      "자기 계발에 집중하세요. 고신살이 있는 사람은 혼자 노력해서 성공하는 자수성가 기운이 있습니다.",
    ],
    caution: "억지로 결혼이나 연애를 강행하면 더 큰 고독이 찾아옵니다. 좋은 인연이 올 때를 기다리세요.",
  },
  귀문관살: {
    icon: "🔮", color: "#c084fc", name: "귀문관살(鬼門關殺)",
    problem: "신경이 예민하고 영적 감수성이 강해 정신적 소진이 잦습니다. 불안·공황·불면에 시달리기 쉽습니다.",
    overcome: [
      "예민함을 억누르지 말고 예술·상담·치유 분야로 승화하세요. 귀문관살 있는 사람은 최고의 상담사·예술가·무속인이 됩니다.",
      "잠들기 전 마음을 정화하는 루틴(명상·기도·일기 쓰기)을 만드세요.",
      "인파가 많은 곳에 오래 있으면 에너지가 소진됩니다. 혼자 충전하는 시간을 반드시 확보하세요.",
      "음양 오행의 균형을 잡아주는 보석(블랙투르말린·흑요석)이나 정화 소금이 도움됩니다.",
    ],
    caution: "카페인·술·담배는 귀문관살의 예민함을 폭발시킵니다. 가능하면 줄이세요.",
  },
  양인살: {
    icon: "🗡️", color: "#f87171", name: "양인살(羊刃殺)",
    problem: "충동적이고 강한 추진력이 부작용을 낳습니다. 사고·부상·다툼이 잦고 주변을 다치게 할 수 있습니다.",
    overcome: [
      "강한 에너지를 사회적으로 유용한 곳에 사용하세요. 운동·군인·경찰·수술의사·소방관이 길합니다.",
      "결정적 순간에 '잠깐 멈추는' 습관을 들이세요. 충동적 행동이 양인살의 가장 큰 적입니다.",
      "규칙적인 운동(격투기·무술·수영)으로 과잉 에너지를 건강하게 소비하세요.",
      "쇠붙이(칼·가위·주사기)를 다루는 직업에서 오히려 대성할 수 있습니다.",
    ],
    caution: "음주 후 충동적 행동이 가장 위험합니다. 술자리를 신중하게 관리하세요.",
  },
  홍염살: {
    icon: "🔥", color: "#dc2626", name: "홍염살(紅艶殺)",
    problem: "이성 관계가 복잡해지기 쉽습니다. 색정 구설이나 불륜·삼각 관계에 휘말릴 수 있습니다.",
    overcome: [
      "뛰어난 이성 매력을 예술·공연·서비스업으로 승화하세요. 연예인·유튜버·바텐더가 잘 어울립니다.",
      "한 사람에게 집중하는 연습을 하세요. 홍염살은 여러 이성에 분산되면 에너지가 낭비됩니다.",
      "결혼 전에 충분히 연애 경험을 쌓아두는 것이 오히려 결혼 후 안정에 도움이 됩니다.",
      "사회적으로 매력을 발산할 수 있는 취미(댄스·음악·연극)를 가지세요.",
    ],
    caution: "결혼 후에도 이성 인연이 계속 들어옵니다. 경계를 명확히 하는 습관이 중요합니다.",
  },
  // ── 지지충(六沖) ──────────────────────────────────────────────────────────────
  자오충: {
    icon: "💧", color: "#0ea5e9", name: "자오충(子午沖)",
    problem: "수(水)와 화(火)가 충돌해 감정 기복이 극심합니다. 직업과 거주지 변동이 잦고 심장·신장이 약해질 수 있습니다.",
    overcome: [
      "감정 기복을 관리하는 루틴(명상·일기·호흡법)이 필수입니다. 감정을 즉각 표현하지 말고 하루 숙성하는 습관을 들이세요.",
      "직업에서 변화를 수용하는 구조를 만드세요. 프리랜서·컨설팅·다채널 수익으로 충의 이동 에너지를 자산으로 전환하세요.",
      "심장과 신장을 동시에 보호하는 생활 습관: 염분 줄이기, 적당한 유산소 운동, 충분한 수분 섭취.",
      "자오충이 강한 시기(자·오 세운 겹침)에는 큰 이직·이사·투자 결정을 피하고 현상 유지 전략을 택하세요.",
    ],
    caution: "연애·결혼에서 충동적인 이별과 재결합을 반복하기 쉽습니다. 감정이 식은 후 냉정하게 판단하세요.",
  },
  축미충: {
    icon: "🏔️", color: "#92400e", name: "축미충(丑未沖)",
    problem: "토(土) 끼리의 충돌로 재산 손실과 부부·가족 갈등이 반복됩니다. 토지·부동산·상속 관련 분쟁에 휘말리기 쉽습니다.",
    overcome: [
      "부동산 거래와 상속 문제는 반드시 법적 서류와 전문가 자문을 거치세요. 구두 약속은 절대 믿지 마세요.",
      "가족 간 금전 거래를 최소화하세요. 빌려주면 돌려받기 어렵고 관계도 나빠집니다.",
      "소화기(위·비장) 건강을 관리하세요. 스트레스를 폭식이나 음주로 풀지 말고 위를 보호하는 식습관을 유지하세요.",
      "부부 사이에 재정 구조를 투명하게 공유하세요. 숨기는 돈이 있으면 충이 더 크게 발현됩니다.",
    ],
    caution: "토지·공동사업 투자는 축미충 있는 사람에게 큰 손실 위험이 있습니다. 충분히 검토 후 진행하세요.",
  },
  인신충: {
    icon: "⚡", color: "#7c3aed", name: "인신충(寅申沖)",
    problem: "목(木)과 금(金)의 강렬한 충돌. 예기치 않은 사고·교통 충돌·수술 등 신체적 위험이 따릅니다. 직업 변동도 잦습니다.",
    overcome: [
      "교통수단 이용 시 항상 방어 운전과 안전벨트 착용을 철저히 하세요. 인신충은 교통사고 에너지가 가장 강합니다.",
      "강한 추진력과 행동력을 직업으로 승화하세요. 스포츠·구조·응급의료·군인·경찰에서 최고의 성과를 냅니다.",
      "충동적 결정을 내리기 전 '72시간 규칙'을 적용하세요. 3일 후에도 같은 생각이면 행동하세요.",
      "정기적으로 신체 검진을 받으세요. 특히 팔·다리·척추 부위의 외상과 관절 건강에 주의하세요.",
    ],
    caution: "인신충이 대운·세운에서 겹치는 시기에는 해외여행과 모험적 활동을 자제하세요.",
  },
  묘유충: {
    icon: "🌸", color: "#be185d", name: "묘유충(卯酉沖)",
    problem: "목(木)과 금(金)의 충돌로 부부·형제 갈등이 반복됩니다. 간·폐 건강이 약해지고 감정적 상처가 쌓이기 쉽습니다.",
    overcome: [
      "부부·파트너와의 소통 방식을 개선하세요. 직접 충돌하지 말고 중재자(상담사·중간 인물)를 통한 소통이 효과적입니다.",
      "간과 폐를 동시에 관리하세요. 절주·금연이 최우선이며, 녹즙·과일로 간을 보호하세요.",
      "형제·자매와 금전 거래를 피하세요. 가족 간 재정 분쟁이 관계를 돌이킬 수 없게 만듭니다.",
      "봄(묘월)과 가을(유월)에 건강과 관계 충돌이 심화됩니다. 이 시기에 중요한 결정을 미루세요.",
    ],
    caution: "묘유충은 이혼·별거 에너지가 강합니다. 파트너십 문제는 조기에 상담을 받으세요.",
  },
  진술충: {
    icon: "⚖️", color: "#059669", name: "진술충(辰戌沖)",
    problem: "토(土) 끼리의 충돌로 관재·구설·재산 다툼이 따릅니다. 소화기 건강과 직업적 명예에 손상이 올 수 있습니다.",
    overcome: [
      "계약서와 법적 문서를 꼼꼼히 검토하는 습관을 들이세요. 구두 약속은 절대 믿지 않는 원칙을 세우세요.",
      "직업에서 법적 분쟁 가능성이 있는 행동을 미리 차단하세요. 변호사·노무사 상담을 선제적으로 활용하세요.",
      "위·대장 건강을 관리하세요. 스트레스를 받으면 소화기 문제가 먼저 옵니다. 규칙적인 식사와 식이섬유 섭취가 필수입니다.",
      "토지·부동산 관련 소송이 생기기 쉽습니다. 부동산 거래 시 전문가 감정과 등기부등본 확인을 철저히 하세요.",
    ],
    caution: "진술충이 세운에 겹치는 해에는 소송·세금·행정 처분을 조심하세요.",
  },
  사해충: {
    icon: "🌊", color: "#0369a1", name: "사해충(巳亥沖)",
    problem: "화(火)와 수(水)의 격렬한 충돌. 예기치 못한 사고·화재·수난(水難)의 에너지가 강합니다. 심장·신장 건강도 약해집니다.",
    overcome: [
      "화재와 물(홍수·수영·바다) 관련 사고를 특히 조심하세요. 가스 잠금, 전기 점검, 구명조끼 착용이 필수입니다.",
      "급격한 변화를 두려워하지 말고 유연하게 받아들이는 마음가짐이 사해충의 에너지를 줄입니다.",
      "심장과 신장을 동시에 보호하세요. 격렬한 운동 전 준비운동을 철저히 하고, 염분과 카페인을 줄이세요.",
      "사해충의 변동 에너지를 사업 전환·창업·이직에 활용하세요. 큰 변화 직전에 새 기회가 옵니다.",
    ],
    caution: "겨울(해월)과 여름(사월)에 에너지 충돌이 최고조에 달합니다. 이 시기 큰 결정을 자제하세요.",
  },
  // ── 삼형살(三刑殺) 및 형(刑) ─────────────────────────────────────────────────
  인사신삼형: {
    icon: "⚔️", color: "#b91c1c", name: "인사신삼형(寅巳申三刑)",
    problem: "지세지형(持勢之刑). 권력욕이 극단으로 치닫아 자기 자신을 파괴합니다. 관재·수술·사고가 잦고 주변과 갈등이 극심합니다.",
    overcome: [
      "권력욕과 지배 욕구를 긍정적으로 승화하세요. 리더십·경영·정치·군 지휘관 등 합법적 권한 구조 안에서 최대한 발휘하세요.",
      "남을 통제하려는 욕구를 자기 관리로 전환하세요. 자기 수련(무술·명상·운동)이 삼형살의 파괴적 에너지를 안으로 담아냅니다.",
      "외과·응급·소방·군인 등 강한 에너지가 직업적으로 요구되는 분야가 삼형살의 올바른 출구입니다.",
      "인사신 세운이 겹치는 시기에는 소송·충돌·수술을 각별히 조심하세요. 이 시기엔 최대한 몸을 낮추세요.",
    ],
    caution: "권력을 위해 도덕과 법을 넘으면 삼형살의 폭발이 옵니다. 원칙을 지키는 것이 최고의 보호막입니다.",
  },
  축술미삼형: {
    icon: "🐂", color: "#78350f", name: "축술미삼형(丑戌未三刑)",
    problem: "무은지형(無恩之刑). 은혜를 잊고 배신하거나 배신당합니다. 다리·위장 건강이 약하고 인맥에서 배신이 반복됩니다.",
    overcome: [
      "가까운 사람과 금전·사업 거래를 최소화하세요. 신의를 저버린 관계는 오래 끌지 말고 깔끔히 정리하세요.",
      "의리를 강요하지 마세요. 축술미삼형 있는 사람은 과거 관계에 집착할수록 더 큰 배신이 옵니다.",
      "다리·무릎·소화기(위·비장)를 관리하세요. 관절 검진과 규칙적인 식사가 삼형살의 신체 영향을 줄입니다.",
      "혼자 결정하는 자율적 업무 환경이 맞습니다. 공동 대표나 공동 계좌보다는 독립적 구조를 택하세요.",
    ],
    caution: "보증·연대보증은 절대 서지 마세요. 삼형살 있는 사람이 보증을 서면 반드시 손실이 옵니다.",
  },
  자묘형: {
    icon: "💬", color: "#0f766e", name: "자묘형(子卯刑)",
    problem: "무례지형(無禮之刑). 예의 없는 행동이나 말실수로 구설수에 오릅니다. 선을 넘는 농담과 무신경한 언행이 관계를 망칩니다.",
    overcome: [
      "말하기 전에 '이 말이 상대방에게 어떻게 들릴까?'를 먼저 생각하는 습관을 들이세요.",
      "공식 석상에서의 언행을 절제하세요. 친한 자리에서 한 무례한 농담이 공개돼 망신살로 연결됩니다.",
      "SNS와 온라인 발언에 특히 조심하세요. 자묘형은 온라인 구설이 빠르게 확산됩니다.",
      "예의와 예절 교육을 스스로 받아보세요. 의사소통 강의·비폭력 대화(NVC) 연습이 큰 도움이 됩니다.",
    ],
    caution: "자묘형이 있는 해에는 공개 발언과 미디어 노출을 최소화하세요. 침묵이 황금입니다.",
  },
  자형살: {
    icon: "🔄", color: "#475569", name: "자형살(自刑殺)",
    problem: "같은 지지가 겹쳐 스스로 화를 자초합니다. 자기 파괴적 결정을 반복하며, 잘 되다가 스스로 망치는 패턴이 반복됩니다.",
    overcome: [
      "자기 파괴 패턴을 인식하는 것이 첫 번째 단계입니다. 상담사나 코치와 함께 반복 패턴을 분석하세요.",
      "중요한 결정 전에 반드시 신뢰할 수 있는 제3자의 의견을 구하세요. 혼자 결정할수록 자형이 심해집니다.",
      "자기 비하·자학적 사고를 인식하고 중단하는 연습(인지행동치료·마음챙김)이 자형살의 핵심 극복법입니다.",
      "성공 경험을 기록하고 자주 돌아보세요. 자형살 있는 사람은 성공보다 실패에 집중하는 경향이 있습니다.",
    ],
    caution: "술과 도박은 자형살의 자기 파괴 에너지를 폭발시킵니다. 의존적 습관을 경계하세요.",
  },
  // ── 지지파(地支破) / 지지해(地支害) ──────────────────────────────────────────
  지지파: {
    icon: "💔", color: "#9333ea", name: "지지파(地支破)",
    problem: "이별·손재·인연 파탄의 기운입니다. 소중한 관계가 갑자기 끊어지거나, 재물이 새어나가는 경험이 반복됩니다.",
    overcome: [
      "중요한 인연을 당연하게 여기지 마세요. 파살이 있는 사람은 소홀히 하면 갑자기 잃습니다. 먼저 연락하는 습관을 들이세요.",
      "재물이 새는 구멍을 찾아 막으세요. 자동 이체 확인, 구독 서비스 정리, 불필요한 지출 삭제가 파살의 손재를 줄입니다.",
      "계약·거래 전 세부 조건을 꼼꼼히 검토하세요. 파살이 있으면 세부 조항에서 손해를 봅니다.",
      "물질보다 관계에 집중하세요. 파살의 에너지는 '잃음'을 통해 진짜 소중한 것을 알게 해주는 가르침입니다.",
    ],
    caution: "파살 기운이 강한 시기(해당 지지 세운)에는 큰 투자나 보증을 피하세요.",
  },
  지지해: {
    icon: "🗡️", color: "#991b1b", name: "지지해(地支害)",
    problem: "육해(六害). 가까운 사람에게 방해와 배신을 당합니다. 인간관계에서 음모와 질투, 뒤에서 발목 잡는 일이 생기기 쉽습니다.",
    overcome: [
      "모든 사람을 다 믿지 마세요. 특히 가장 가까운 자리의 사람(직장 동료·가족)에게서 배신이 오는 경향이 있습니다.",
      "비밀을 최소화하세요. 해살이 있는 사람의 비밀은 반드시 새어나갑니다. 투명하게 행동하는 것이 방어막입니다.",
      "인맥을 넓히기보다 깊이 있는 관계 소수를 유지하세요. 해살은 광범위한 인맥에서 배신자가 섞여 들어옵니다.",
      "경쟁자와 직접 대결보다 실력으로 묵묵히 전진하는 전략을 택하세요. 해살은 정면 충돌보다 우회로가 효과적입니다.",
    ],
    caution: "해살이 강한 시기에는 중요한 프로젝트나 인맥의 핵심 정보를 넓게 공유하지 마세요.",
  },
};

// ── 오행 과부족 극복법 ────────────────────────────────────────────────────────
const ELEMENT_OVERCOME: Record<string, {
  color: string; icon: string; problem: string; solutions: string[];
}> = {
  목: {
    color: "#16a34a", icon: "🌿",
    problem: "목(木)이 과다하면: 고집·분노·간 건강 악화. 목이 부족하면: 의욕 저하·우유부단·결단력 부족",
    solutions: [
      "목 과다 → 금(金)으로 균형: 흰색 계열, 서쪽 방향, 금속 액세서리, 매운 음식",
      "목 부족 → 목을 보충: 초록색 인테리어, 식물 기르기, 새벽 운동, 신맛 음식",
      "간·담낭 건강에 주의하세요. 숙면과 절주가 필수입니다.",
      "새벽 3~7시가 목의 활성 시간. 이 시간 활동이 목 에너지를 강화합니다.",
    ],
  },
  화: {
    color: "#dc2626", icon: "🔥",
    problem: "화(火)가 과다하면: 급한 성격·심장 부담·불면·화병. 화가 부족하면: 표현력 부족·소극적·추진력 감소",
    solutions: [
      "화 과다 → 수(水)로 균형: 파란색 계열, 북쪽 방향, 수영·목욕, 차가운 음료",
      "화 부족 → 화를 보충: 붉은색 인테리어, 촛불 명상, 낮 11시~오후 1시 활동",
      "심장·혈압·눈 건강에 주의하세요. 화 과다는 고혈압과 연결됩니다.",
      "화가 강한 사람은 여름에 더 에너지가 넘칩니다. 이 시기를 적극 활용하세요.",
    ],
  },
  토: {
    color: "#92400e", icon: "🏔️",
    problem: "토(土)가 과다하면: 비만·소화기 문제·완고함·변화 거부. 부족하면: 신뢰 부족·현실감 약함·불안정",
    solutions: [
      "토 과다 → 목(木)으로 균형: 초록색, 동쪽 방향, 등산·산책, 신맛 음식",
      "토 부족 → 토를 보충: 황토·자연 소재 인테리어, 단맛 음식(고구마·호박), 규칙적 생활",
      "소화기·비장·위 건강에 주의하세요. 과식·폭식이 가장 위험합니다.",
      "환절기(계절이 바뀌는 시기)에 건강이 나빠지기 쉽습니다. 미리 대비하세요.",
    ],
  },
  금: {
    color: "#7c3aed", icon: "⚔️",
    problem: "금(金)이 과다하면: 냉정함·폐 건강 악화·지나친 완벽주의·냉혹함. 부족하면: 의지력 약화·판단력 흐림",
    solutions: [
      "금 과다 → 화(火)로 균형: 붉은색, 남쪽 방향, 활동적 취미, 매운 음식",
      "금 부족 → 금을 보충: 흰색·실버 인테리어, 서쪽 방향, 저녁 5~9시 활동, 매운 음식",
      "폐·대장·피부 건강에 주의하세요. 미세먼지와 호흡기 질환을 조심하세요.",
      "가을이 금의 계절. 이 시기에 결단과 매듭짓는 일을 하면 잘 풀립니다.",
    ],
  },
  수: {
    color: "#0369a1", icon: "🌊",
    problem: "수(水)가 과다하면: 우울·신장 부담·두려움·지나친 고집. 부족하면: 지혜 감소·건망증·의지력 약화",
    solutions: [
      "수 과다 → 토(土)로 균형: 황토색, 중앙 방향, 단맛 음식, 규칙적 생활",
      "수 부족 → 수를 보충: 파란색·검은색 인테리어, 북쪽 방향, 밤 9시~1시 활동, 해산물",
      "신장·방광·뼈 건강에 주의하세요. 겨울철 특히 조심하세요.",
      "겨울이 수의 계절. 이 시기에 학습·계획·저축을 하면 가장 효과적입니다.",
    ],
  },
};

export default function OvercomePage() {
  const router = useRouter();
  const [name, setName] = useState("나");
  const [dominant, setDominant] = useState<string[]>([]);
  const [lacking, setLacking] = useState<string[]>([]);
  const [mySinsals, setMySinsals] = useState<string[]>([]);
  const [hasSaju, setHasSaju] = useState(false);
  const [activeTab, setActiveTab] = useState<"sinsal" | "element">("sinsal");

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

  const relevantSinsals = Object.keys(SINSAL_OVERCOME).filter(k => mySinsals.includes(k));
  const neutralSinsals = Object.keys(SINSAL_OVERCOME).filter(k => !mySinsals.includes(k));

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-red-950/20 to-transparent" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 뒤로</button>
          <span className="text-xs text-green-400/60 bg-green-500/10 border border-green-500/15 px-2 py-1 rounded-full">무료</span>
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-2xl font-black mb-2">
            <span className="text-red-400">쓰레기 사주</span> 극복법
          </h1>
          <p className="text-gray-400 text-sm">
            {hasSaju ? `${name}님의 사주 기반 맞춤 극복 가이드` : "신살과 오행 불균형 극복 완벽 가이드"}
          </p>
        </div>

        {/* 안내 배너 */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
          <p className="text-sm text-red-200/80 leading-relaxed">
            <strong className="text-red-300">&quot;나쁜 사주는 없습니다.&quot;</strong><br />
            모든 신살과 오행 불균형에는 극복법이 있습니다. 어떤 에너지도 방향만 맞으면 강점이 됩니다.
            아래 가이드로 내 사주를 최대한 활용하세요.
          </p>
        </div>

        {/* 탭 */}
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

        {/* 신살 탭 */}
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
                  {relevantSinsals.map(key => {
                    const s = SINSAL_OVERCOME[key];
                    return (
                      <SinsalCard key={key} s={s} isOwned />
                    );
                  })}
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
              {(hasSaju ? neutralSinsals : Object.keys(SINSAL_OVERCOME)).map(key => {
                const s = SINSAL_OVERCOME[key];
                return <SinsalCard key={key} s={s} isOwned={false} />;
              })}
            </div>
          </div>
        )}

        {/* 오행 탭 */}
        {activeTab === "element" && (
          <div>
            {hasSaju && (dominant.length > 0 || lacking.length > 0) && (
              <>
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    {dominant.length > 0 && (
                      <div>
                        <p className="text-xs text-red-400 font-bold mb-2">과다 오행</p>
                        <div className="flex flex-wrap gap-1">
                          {dominant.slice(0, 2).map(el => (
                            <span key={el} className="text-sm font-black px-3 py-1 rounded-full" style={{ backgroundColor: `${ELEMENT_OVERCOME[el]?.color || "#666"}33`, color: ELEMENT_OVERCOME[el]?.color || "#fff" }}>
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
              </>
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
                        <span className="font-black text-white text-base">{el}(木火土金水의 {el}) 오행</span>
                      </div>
                      {isOver && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">과다</span>}
                      {isLack && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">부족</span>}
                    </div>
                    <p className="text-xs text-gray-400 mb-3 leading-relaxed">{data.problem}</p>
                    <div className="space-y-1.5">
                      {data.solutions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <span style={{ color: data.color }} className="shrink-0 mt-0.5">→</span>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 매력 분석 CTA */}
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
          <p className="text-xs text-gray-500 truncate">{s.problem.slice(0, 40)}...</p>
        </div>
        {isOwned && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 shrink-0">해당</span>}
        <span className="text-gray-600 text-xs shrink-0">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          <p className="text-xs text-gray-400 mb-3 leading-relaxed border-t border-white/5 pt-3">{s.problem}</p>
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
