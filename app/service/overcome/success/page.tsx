"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju, getJijiRelations, getDohwaJj, CHEONUL_JJ, calcDaewoon } from "@/lib/saju";
import { GANYEOJIDONG_PAIRS } from "@/lib/saju2";
import ResultFooterActions from "@/components/ResultFooterActions";

export const dynamic = "force-dynamic";

const SINSAL_OVERCOME: Record<string, {
  icon: string; color: string; name: string;
  problem: string; overcome: string[]; caution: string;
}> = {
  역마살: { icon:"🏃",color:"#16a34a",name:"역마살(驛馬殺)",
    problem:"정착이 안 됩니다. 이직·이사가 잦습니다. 한곳에 오래 있으면 답답해서 미칩니다.",
    overcome:["이동을 막지 마세요. 이동하게 해주세요. 여행업·무역·해외 관련 직종이 맞습니다.","정기적인 여행 계획을 세우세요. 이동 욕구가 해소되면 관계와 직장이 안정됩니다.","한국보다 해외에서 더 잘 풀리는 경우가 많습니다. 해외 거주를 두려워 마세요.","한곳에서 대박보다 여러 곳에서 수익이 자연스러운 구조를 만드세요."],
    caution:"억지로 정착을 강요하면 더 큰 이탈이 옵니다." },
  화개살: { icon:"🌙",color:"#818cf8",name:"화개살(華蓋殺)",
    problem:"고독합니다. 주류에 섞이기가 어렵습니다. 혼자 있어야 충전이 됩니다.",
    overcome:["고독을 적으로 삼지 마세요. 창의적 힘으로 전환하세요.","명상·수련·종교 활동이 에너지를 안정시킵니다.","혼자만의 공간과 시간을 충분히 확보하세요.","소수의 진짜 관계를 추구하세요.","여기저기 옮겨 다니면 재물이 흩어지기 쉬운 기운이라, 한 직장·한 분야에서 진득하게 버틸수록 결국 그 판의 전문가가 되어 실속을 챙기게 됩니다."],
    caution:"술·도박·게임 등 현실 도피에 빠지기 쉽습니다." },
  겁살: { icon:"💥",color:"#f97316",name:"겁살(劫殺)",
    problem:"갑작스러운 사고·충돌·빼앗김이 옵니다. 충동이 강합니다.",
    overcome:["겁살 에너지를 운동선수·군인·경찰·소방관·의사로 사용하세요.","결정 전 충분히 숙고하는 습관을 들이세요.","재물을 분산 투자·적금·보험으로 갑작스러운 손실을 대비하세요.","정기 건강 검진이 필수입니다."],
    caution:"침착함이 최고의 무기입니다." },
  재살: { icon:"⚡",color:"#dc2626",name:"재살(災殺)",
    problem:"예기치 않은 재난·사고·관재가 옵니다.",
    overcome:["물가·운전·고소 상황에서 더욱 주의하세요.","재살이 겹치는 해에는 큰 거래·투자·수술을 피하세요.","매년 정기적으로 액막이 의식을 행하면 기운이 완화됩니다.","위험 관련 직종에서 오히려 강점이 됩니다."],
    caution:"겨울철과 자월에 특히 조심하세요." },
  천살: { icon:"🌪️",color:"#6d28d9",name:"천살(天殺)",
    problem:"예측 불가한 재난의 에너지입니다.",
    overcome:["기상 예보에 민감하게 반응하세요.","기도·명상·등산 활동으로 에너지를 정화하세요.","규칙적인 일상이 안정을 줍니다.","극단적 행동을 피하세요."],
    caution:"여름 장마철과 태풍 시즌에 야외 활동을 자제하세요." },
  망신살: { icon:"😳",color:"#ef4444",name:"망신살(亡身殺)",
    problem:"구설·명예 손상이 생기기 쉽습니다.",
    overcome:["말과 행동을 신중하게 하세요.","SNS 노출을 최소화하고, 공개 발언 전에 충분히 검토하세요.","의상·외모에 신경 쓰세요.","정직하게 행동하세요."],
    caution:"이성 관계에서 특히 조심하세요." },
  고신살: { icon:"✦",color:"#64748b",name:"고신살(孤神殺)",
    problem:"고독합니다. 인연이 끊어지거나 혼자 남겨지는 경험을 합니다.",
    overcome:["고독을 두려워하지 마세요.","종교·봉사·예술 활동으로 연결을 만들어 가세요.","반려동물이 큰 위안이 됩니다.","자기 계발에 집중하세요."],
    caution:"억지로 결혼이나 연애를 강행하면 더 큰 고독이 찾아옵니다." },
  귀문관살: { icon:"🔮",color:"#c084fc",name:"귀문관살(鬼門關殺)",
    problem:"신경이 예민합니다. 불안·공황·불면에 시달리기 쉽습니다.",
    overcome:["예민함을 예술·상담·치유 분야로 승화하세요.","잠들기 전 마음을 정화하는 루틴을 만드세요.","혼자 충전하는 시간을 확보하세요.","흑요석이나 정화 소금이 도움됩니다."],
    caution:"카페인·술·담배는 예민함을 폭발시킵니다." },
  양인살: { icon:"🗡️",color:"#f87171",name:"양인살(羊刃殺)",
    problem:"충동적 추진력이 부작용을 낳습니다. 사고·다툼이 잦습니다.",
    overcome:["강한 에너지를 운동·군인·경찰·외과의사로 사용하세요.","결정적 순간에 '잠깐 멈추는' 습관을 들이세요.","격투기·무술·수영으로 과잉 에너지를 소비하세요.","쇠붙이 다루는 직업에서 오히려 대성합니다."],
    caution:"음주 후 충동적 행동이 가장 위험합니다." },
  홍염살: { icon:"🔥",color:"#dc2626",name:"홍염살(紅艶殺)",
    problem:"이성 관계가 복잡해지기 쉽습니다.",
    overcome:["이성 매력을 예술·공연·서비스업으로 승화하세요.","한 사람에게 집중하는 연습을 하세요.","댄스·음악·연극 같은 취미로 매력을 발산하세요.","결혼 후 이성 경계를 명확히 하세요."],
    caution:"결혼 후에도 이성 인연이 계속 들어옵니다." },
  장성살: { icon:"🏆",color:"#f59e0b",name:"장성살(將星殺)",
    problem:"남 밑에서 지시받으면 답답합니다. 주도권이 없는 환경에서 에너지가 고갈됩니다.",
    overcome:["조직보다 독립 또는 팀장 이상의 자리를 노리세요.","리더십이 발휘되는 위치에서 능력이 폭발합니다.","강한 카리스마를 팀 성과로 전환하세요.","군인·경찰·경영자 계통에서 강점이 두드러집니다."],
    caution:"아랫사람에게 독재자처럼 굴지 않도록 의식적으로 위임하는 연습을 하세요." },
  반안살: { icon:"✨",color:"#10b981",name:"반안살(攀鞍殺)",
    problem:"교만해지면 복이 새기 쉽습니다. 겸손을 잃는 순간 운이 급변합니다.",
    overcome:["겸손을 유지하면 재물과 지위가 자연스럽게 따라옵니다.","외모·이미지 관리에 투자하세요. 첫인상이 결정적입니다.","귀한 물건을 가까이 두면 기운이 올라갑니다.","주변을 잘 챙기는 습관이 복덩이 역할을 합니다."],
    caution:"잘나갈 때 자만하면 급전직하하는 기운이에요." },
  지살: { icon:"🌍",color:"#0891b2",name:"지살(地殺)",
    problem:"한곳에 정착하기 어렵습니다. 넓은 활동 반경이 필요합니다.",
    overcome:["역마살과 달리 내가 선택해서 움직이는 기운이에요. 이 선택권을 충분히 활용하세요.","타지·외지·해외에서 새로운 기회를 열어가세요.","여행·무역·교류가 많은 직종이 잘 맞습니다.","거점 기지는 유지하되 활동 반경을 넓게 가져가세요."],
    caution:"충동적인 이사·이직보다 전략적 이동을 선택하세요." },
  년살: { icon:"🌸",color:"#db2777",name:"년살(年殺)",
    problem:"이성 인연이 복잡해지고 소비·사치로 재물이 새기 쉽습니다.",
    overcome:["이성 매력을 적극적으로 직업에 활용하세요.","지출 관리를 시스템화하세요. 자동이체·적금이 핵심입니다.","한 사람과 깊이 있는 관계를 유지하는 연습을 하세요.","외향적인 직종(영업·서비스·엔터테인먼트)에서 강점이 드러납니다."],
    caution:"겉멋과 허영에 흔들리면 재물이 흩어집니다." },
  월살: { icon:"🌑",color:"#7c3aed",name:"월살(月殺)",
    problem:"시작은 쉬운데 결실까지 유난히 오래 걸립니다. 인덕이 부족하게 느껴집니다.",
    overcome:["빠른 성과보다 장기적으로 꾸준히 쌓는 방식이 이 기운에 맞아요.","서두르지 말고 인내심을 무기로 삼으세요.","월살이 있는 분들은 대기만성형입니다.","전문성을 꾸준히 쌓는 직종에서 결국 두각을 나타냅니다."],
    caution:"급하게 성과를 내려다 모두 잃는 패턴을 조심하세요." },
  육해살: { icon:"⚡",color:"#6d28d9",name:"육해살(六害殺)",
    problem:"인간관계가 어긋나고 만성적인 잔병치레가 따르기 쉽습니다.",
    overcome:["인간관계의 거리를 의도적으로 조율하세요.","시간 약속과 일정 관리에 강점이 있으니 이를 살리세요.","빠른 두뇌 회전을 분석·기획 계통에서 활용하세요.","운의 기복이 크니 고점에서 아끼고 저점을 대비하세요."],
    caution:"주변과의 충돌이 잦을수록 혼자만의 회복 시간을 꼭 가지세요." },
};

const ELEMENT_OVERCOME: Record<string, {
  color: string; icon: string; overDesc: string; lackDesc: string;
  overFix: string; lackFix: string; chakColor: string; direction: string;
  numbers: string; objects: string; food: string; healthTip: string; activity: string;
}> = {
  목: { color:"#16a34a",icon:"🌿",overDesc:"고집이 끝이 없습니다. 분노가 자주 올라옵니다. 간 건강이 나빠집니다.",lackDesc:"의욕이 없습니다. 결단을 못 내립니다. 시작을 자꾸 미룹니다.",overFix:"흰색·은색 계열을 가까이 하세요. 서쪽 방향으로 앉으세요.",lackFix:"초록색을 인테리어에 넣으세요. 동쪽 방향으로 앉으세요.",chakColor:"초록색, 연두색",direction:"동쪽",numbers:"3, 8",objects:"관엽식물, 나무 소품",food:"신맛 — 귤, 레몬, 키위",healthTip:"간·담낭을 챙기세요. 절주 필수.",activity:"숲·공원 산책, 등산, 식물 가꾸기, 아침 스트레칭" },
  화: { color:"#dc2626",icon:"🔥",overDesc:"급합니다. 잠을 못 잡니다. 심장이 두근거립니다.",lackDesc:"표현을 못 합니다. 소극적으로 변합니다.",overFix:"파란색 계열을 들이세요. 수영, 차가운 음료.",lackFix:"붉은색을 인테리어에 넣으세요. 촛불 명상.",chakColor:"붉은색, 주황색",direction:"남쪽",numbers:"2, 7",objects:"촛불, 붉은 꽃",food:"쓴맛 — 커피, 녹차, 씀바귀",healthTip:"심장·혈압·눈을 챙기세요.",activity:"노래·춤·공연 관람, 사람들과 어울리는 모임, 햇볕 쬐기" },
  토: { color:"#92400e",icon:"🏔️",overDesc:"고집이 세지고 완고해집니다. 소화가 잘 안 됩니다.",lackDesc:"믿음을 주지 못합니다. 불안정한 느낌이 강합니다.",overFix:"초록색·나무 소품을 들이세요. 신맛 음식.",lackFix:"황토 소재를 집에 넣으세요. 단맛 음식.",chakColor:"황토색, 노란색",direction:"중앙",numbers:"5, 10",objects:"황토 소품, 도자기",food:"단맛 — 고구마, 꿀, 대추",healthTip:"소화기·비장·위를 챙기세요.",activity:"명상, 요가, 텃밭·화분 가꾸기, 규칙적인 산책" },
  금: { color:"#7c3aed",icon:"⚔️",overDesc:"너무 냉정해집니다. 완벽주의로 주변이 힘들어합니다.",lackDesc:"의지력이 떨어집니다. 결단을 못 내립니다.",overFix:"붉은색을 가까이 하세요. 활동적인 취미.",lackFix:"흰색·실버 계열을 들이세요. 서쪽 방향을 활용하세요.",chakColor:"흰색, 은색",direction:"서쪽",numbers:"4, 9",objects:"금속 소품, 시계",food:"매운맛 — 마늘, 생강, 고추",healthTip:"폐·대장·피부를 챙기세요.",activity:"헬스·근력 운동, 정리정돈, 무술·격투 운동" },
  수: { color:"#0369a1",icon:"🌊",overDesc:"우울감이 옵니다. 신장이 무거워집니다.",lackDesc:"지혜가 흐려집니다. 건망증이 생깁니다.",overFix:"황토색을 들이세요. 단맛 음식.",lackFix:"파란색·검은색을 인테리어에 넣으세요. 북쪽을 활용하세요.",chakColor:"파란색, 검은색",direction:"북쪽",numbers:"1, 6",objects:"수족관, 파란 소품",food:"짠맛 — 해산물, 된장, 미역",healthTip:"신장·방광·뼈를 챙기세요.",activity:"독서, 수영, 글쓰기·일기, 충분한 수면" },
};

const CHEONGAN_HAP_PAIRS: [string, string][] = [["갑","기"],["을","경"],["병","신"],["정","임"],["무","계"]];
const CHEONGAN_CHUNG_PAIRS: [string, string][] = [["갑","경"],["을","신"],["병","임"],["정","계"]];
const pairMatch = (a: string, b: string, list: [string, string][]) =>
  list.some(([p, q]) => (p === a && q === b) || (p === b && q === a));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeTrashFindings(r: any, gender: string): { icon: string; title: string; desc: string }[] {
  const findings: { icon: string; title: string; desc: string }[] = [];
  const py = r.pillarsDetail.year, pm = r.pillarsDetail.month, pd = r.pillarsDetail.day, ph = r.pillarsDetail.hour;
  const ilgan = pd.cg;
  const ilji = pd.jj;

  const labeled: { label: string; jj: string }[] = [
    { label: "년", jj: py.jj }, { label: "월", jj: pm.jj }, { label: "일", jj: pd.jj },
  ];
  if (ph) labeled.push({ label: "시", jj: ph.jj });
  const jjs = labeled.map(l => l.jj);
  const rel = getJijiRelations(jjs);

  // 1) 신약 + 일간이 시간/월간과 합·충
  const otherCgs = [pm.cg, ph?.cg].filter(Boolean) as string[];
  const dayCombines = otherCgs.some(c => pairMatch(ilgan, c, CHEONGAN_HAP_PAIRS));
  const dayClashes = otherCgs.some(c => pairMatch(ilgan, c, CHEONGAN_CHUNG_PAIRS));
  if (r.yongshin.strength === "신약" && (dayCombines || dayClashes)) {
    findings.push({
      icon: "💧",
      title: "안 그래도 약한 기운이 자꾸 다른 데로 쏠려요",
      desc: "본인 기운 자체가 약한 편인데, 그 기운의 중심인 일간이 바로 옆 기둥과 자꾸 묶이거나 부딪혀요. 그래서 내 의지대로 끌고 가기보다 주변 상황이나 사람에게 휘둘리기 쉬운 흐름이에요. 중요한 결정을 내릴 때는 혼자 충분히 생각할 시간을 갖고, 남의 말에 휩쓸려 급하게 움직이지 않는 게 핵심이에요.",
    });
  }

  // 2) 가장 쓸만한 해수가 사해충
  const haeImportant = (r.yongshin.yongshin === "수" || r.yongshin.heeshin === "수");
  if (haeImportant && jjs.includes("해") && jjs.includes("사")) {
    findings.push({
      icon: "🌊",
      title: "꼭 필요한 기운 하나가 흔들리는 자리에 있어요",
      desc: "지금 가장 필요한 기운이 수(水)인데, 그 기운이 자리한 자리가 정반대 기운과 정면으로 부딪히는 자리예요. 평소엔 멀쩡하다가도 특정 시기(겨울·여름 환절기 등)에 갑자기 컨디션이 무너지거나 일이 꼬이는 식으로 나타나기 쉬워요. 충분한 휴식과 수면, 물 가까이 두는 습관이 이 기운을 지키는 데 도움이 돼요.",
    });
  }

  // 3) 묘목이 도화인데 묘유충
  const dohwaJj = getDohwaJj(py.jj);
  if (dohwaJj === "묘" && jjs.includes("묘") && jjs.includes("유")) {
    findings.push({
      icon: "🌸",
      title: "인기 끄는 매력이 자꾸 부딪히는 일을 만들어요",
      desc: "이성에게 매력적으로 비치는 기운이 묘목 자리에 있는데, 그 자리가 정반대 기운과 정면으로 부딪혀요. 인기와 매력은 분명히 있는데, 그게 오히려 구설수나 갑작스러운 이별·갈등으로 이어지기 쉬운 구조예요. 매력을 숨기기보다, 한 사람에게 집중하고 관계를 천천히 만들어가는 연습이 도움이 돼요.",
    });
  }

  // 4) 일지 천을귀인인데 충/파/형
  const cheonulJjs: string[] = CHEONUL_JJ[ilgan] || [];
  if (cheonulJjs.includes(ilji)) {
    const iljiHit = rel.find((x: { jjA: string; jjB: string; type: string }) =>
      (x.jjA === ilji || x.jjB === ilji) && (x.type === "충" || x.type === "파" || x.type === "형"));
    if (iljiHit) {
      findings.push({
        icon: "⚠️",
        title: "결정적일 때 도와줄 사람이 있는데, 그 자리가 흔들려요",
        desc: "본인 자리에 위기마다 도와주는 귀인의 기운이 자리해 있는데, 그 자리가 다른 기둥과 부딪히거나 어긋나는 관계예요. 도움이 아예 없는 건 아니지만, 막상 필요한 순간에 타이밍이 어긋나거나 도움의 손길이 늦게 오는 경우가 많아요. 배우자·동업자 관계에서 갈등이 잦다면 거리를 두고 감정을 가라앉힌 뒤 대화하는 습관이 필요해요.",
      });
    }
  }

  // 5) 무비겁 — 같은 기운을 가진 동료/짝이 사주 안에 없는 구조
  const allSipseong: string[] = [py.sipseongCg, py.sipseongJj, pm.sipseongCg, pm.sipseongJj, pd.sipseongJj];
  if (ph) allSipseong.push(ph.sipseongCg, ph.sipseongJj);
  const noBigyeop = allSipseong.every(s => s !== "비견" && s !== "겁재");
  if (noBigyeop) {
    findings.push({
      icon: "🧍",
      title: "사주 안에 나와 같은 기운을 가진 자리가 없어요",
      desc: "사주 여덟 글자 중에 나와 똑같은 기운을 가진 자리가 하나도 없는 구조예요. 그래서 '딱 나 같은 사람'을 만나기가 유독 어렵고, 형제자매·동료·동업자 같은 동등한 관계에서도 늘 혼자 이끌거나 혼자 책임지는 위치에 서기 쉬워요. 억지로 비슷한 사람을 찾기보다, 자기 페이스를 지키며 혼자서도 단단한 삶의 구조를 만드는 쪽이 훨씬 잘 맞아요.",
    });
  }

  // 6) 무토/기토 여성 + 토 과다 — 혼자서도 잘 사는 구조
  if ((ilgan === "무" || ilgan === "기") && gender === "female" && r.dominant.includes("토")) {
    findings.push({
      icon: "🏔️",
      title: "혼자만의 삶에 유독 강한 구조예요",
      desc: "본인 기운 자체가 흙처럼 묵직하고 안정적인데, 그 기운이 사주 전체에 과하게 몰려 있어요. 이런 구조는 결혼이나 동거처럼 누군가와 꼭 붙어 지내는 삶보다, 혼자서도 흔들림 없이 자기 일과 생활을 꾸려가는 삶에서 오히려 더 편안하고 잘 풀리는 경우가 많아요. 비혼이나 늦은 결혼을 택해도 불안해할 필요 없는 사주예요.",
    });
  }

  return findings;
}

const CURRENT_YEAR = 2026;

const JIJI_CHUNG_PAIRS: [string, string][] = [["자","오"],["축","미"],["인","신"],["묘","유"],["진","술"],["사","해"]];
const WONJIN_PAIRS: [string, string][] = [["자","미"],["축","오"],["인","유"],["묘","신"],["진","해"],["사","술"]];
const PA_PAIRS: [string, string][] = [["자","유"],["오","묘"],["인","해"],["사","신"],["진","축"],["술","미"]];
const HYEONG_GROUPS: string[][] = [["인","사","신"],["축","술","미"],["자","묘"]];
// 삼합/반합 완화 맵: natal 지지 → [완화해주는 대운 지지들]
const SAMHAP_MITIGATE: Record<string, string[]> = {
  "인": ["오","술"],   "오": ["인","술"],   "술": ["인","오"],
  "사": ["유","축"],   "유": ["사","축"],   "축": ["사","유"],
  "신": ["자","진"],   "자": ["신","진"],   "진": ["신","자"],
  "해": ["묘","미"],   "묘": ["해","미"],   "미": ["해","묘"],
};
// 육합 완화 맵: natal 지지 → 완화해주는 대운 지지
const YUKHAP_MITIGATE: Record<string, string> = {
  "자":"축","축":"자","인":"해","해":"인","묘":"술","술":"묘","진":"유","유":"진","사":"신","신":"사","오":"미","미":"오",
};

// 사생지(인신사해)·사왕지(자오묘유)·사고지(진술축미)
const SASAENGJI = new Set(["인","신","사","해"]);
const SAWANGJI = new Set(["자","오","묘","유"]);
const SAGOJI = new Set(["진","술","축","미"]);

function jjPairMatch(a: string, b: string, list: [string,string][]): boolean {
  return list.some(([p,q]) => (p===a&&q===b)||(p===b&&q===a));
}
function hyeongMatch(a: string, b: string): boolean {
  return HYEONG_GROUPS.some(g => g.includes(a) && g.includes(b));
}

interface DaewoonInsight {
  type: "good" | "warn" | "neutral";
  icon: string;
  title: string;
  desc: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeDaewoonInsights(r: any, form: { year: number; month: number; day: number; gender: string }): DaewoonInsight[] {
  const insights: DaewoonInsight[] = [];
  const gender = (form.gender === "male" ? "male" : "female") as "male" | "female";
  const ilgan: string = r.pillarsDetail.day.cg;
  const monthPillar = { cg: r.pillarsDetail.month.cg, jj: r.pillarsDetail.month.jj };

  let daewoonResult;
  try {
    daewoonResult = calcDaewoon(form.year, form.month, form.day, gender, ilgan, monthPillar);
  } catch { return insights; }

  const pillars = daewoonResult.pillars as { yearStart: number; jj: string; cg: string; age: number }[];
  const currentPillar = pillars.find(p => p.yearStart <= CURRENT_YEAR && CURRENT_YEAR < p.yearStart + 10);
  if (!currentPillar) return insights;

  const dj = currentPillar.jj; // 현재 대운 지지
  const age = CURRENT_YEAR - form.year + 1; // 만 나이 근사
  const remaining = (currentPillar.yearStart + 10) - CURRENT_YEAR;

  const py = r.pillarsDetail.year, pm = r.pillarsDetail.month, pd = r.pillarsDetail.day, ph = r.pillarsDetail.hour;
  const natalJjs: string[] = [py.jj, pm.jj, pd.jj];
  if (ph) natalJjs.push(ph.jj);

  // 사생지 분석: 인신사해는 이동·변동·시작의 강한 기운
  const sasaengNatal = natalJjs.filter(j => SASAENGJI.has(j));
  if (sasaengNatal.length >= 2) {
    insights.push({
      type: "neutral",
      icon: "🌀",
      title: "강한 변화 에너지 — 흐름을 막으면 역효과예요",
      desc: `사주에 인·신·사·해처럼 변화·시작의 기운이 ${sasaengNatal.length}개나 있어요. 이런 구조는 억지로 한 자리에 고정시키면 기운이 막혀 오히려 사고·이탈·충돌로 나타납니다. 직업·거주지 변화를 적으로 삼지 말고, 이동과 새로운 시작을 의식적으로 설계해서 내 것으로 만드세요. 기운을 긍정적으로 이용하는 게 극복법입니다.`,
    });
  }

  // 사왕지 분석: 자오묘유는 왕성한 기운 — 한 방향으로 집중
  const sawangNatal = natalJjs.filter(j => SAWANGJI.has(j));
  if (sawangNatal.length >= 2) {
    insights.push({
      type: "neutral",
      icon: "⚡",
      title: "기운이 한 방향으로 강하게 쏠려요",
      desc: `자·오·묘·유처럼 왕성한 에너지를 가진 지지가 ${sawangNatal.length}개예요. 이 기운은 한 방향으로 집중하면 폭발적인 성과를 내지만, 분산되면 충돌과 소진으로 이어집니다. 한 가지 목표에 에너지를 집중하고, 여러 일을 동시에 벌이는 건 피하세요. 에너지가 많다는 게 장점이니 이걸 무기로 삼으세요.`,
    });
  }

  // 사고지 분석: 진술축미는 저장·마무리·창고
  const sagoNatal = natalJjs.filter(j => SAGOJI.has(j));
  if (sagoNatal.length >= 2) {
    insights.push({
      type: "neutral",
      icon: "🏔️",
      title: "쌓고 저장하는 에너지 — 마무리에 강해요",
      desc: `진·술·축·미처럼 저장·마무리의 기운이 ${sagoNatal.length}개예요. 처음 시작보다 기존 것을 완성·관리·축적하는 역할에서 빛납니다. 창업보다 기존 조직 안에서 자기 포지션을 단단히 굳히는 쪽이 유리하고, 무엇이든 꾸준히 쌓는 사람으로 이름을 낼 수 있어요.`,
    });
  }

  // 대운 지지가 natal 충을 완화하는지 확인 (삼합·반합·육합)
  for (const nj of natalJjs) {
    const chungPartner = JIJI_CHUNG_PAIRS.find(([a,b]) => a===nj||b===nj)?.find(x=>x!==nj);
    if (!chungPartner || !natalJjs.includes(chungPartner)) continue;
    // nj와 chungPartner가 natal에 충하는 상황
    // 대운 지지가 삼합으로 nj 또는 chungPartner를 합하면 충 완화
    const mitigateSrc = (SAMHAP_MITIGATE[nj] || []).includes(dj) ? nj :
                        (SAMHAP_MITIGATE[chungPartner] || []).includes(dj) ? chungPartner : null;
    const mitigateYukhap = YUKHAP_MITIGATE[nj] === dj ? nj : YUKHAP_MITIGATE[chungPartner] === dj ? chungPartner : null;
    if (mitigateSrc || mitigateYukhap) {
      const target = mitigateSrc || mitigateYukhap;
      insights.push({
        type: "good",
        icon: "🤝",
        title: `지금 대운이 ${nj}${chungPartner} 충돌을 완화해줘요`,
        desc: `사주 안에서 ${nj}과 ${chungPartner}이 서로 부딪히는 구조인데, 지금 대운 ${dj}이 들어와 ${target}을 합으로 감싸주면서 충돌이 완화됩니다. 앞으로 ${remaining}년간은 이 기운이 안정되는 흐름이에요. 이 시기에 그동안 미뤄왔던 일을 밀고 나가기 좋습니다.`,
      });
    }
  }

  // 대운 지지가 natal 충을 강화하는지 (대운이 충 상대방과 삼합·반합)
  for (const nj of natalJjs) {
    const chungPartner = JIJI_CHUNG_PAIRS.find(([a,b]) => a===nj||b===nj)?.find(x=>x!==nj);
    if (!chungPartner || !natalJjs.includes(chungPartner)) continue;
    // 대운이 충 상대방을 강화하는지
    const amplifiesPartner = (SAMHAP_MITIGATE[chungPartner] || []).includes(dj);
    if (amplifiesPartner) {
      insights.push({
        type: "warn",
        icon: "⚠️",
        title: `지금 대운이 ${nj}${chungPartner} 충돌을 더 강하게 만들어요`,
        desc: `사주 안에서 ${nj}과 ${chungPartner}이 이미 부딪히는 구조인데, 지금 대운 ${dj}이 ${chungPartner} 세력을 더 강하게 만들어요. 앞으로 ${remaining}년간 이 기운의 영향이 커집니다. 무리한 확장·이직·투자보다 현재 자리를 지키고 내실을 다지는 데 집중하세요.`,
      });
    }
  }

  // 대운에서 원진 들어올 때
  for (const nj of natalJjs) {
    if (jjPairMatch(nj, dj, WONJIN_PAIRS)) {
      insights.push({
        type: "warn",
        icon: "😤",
        title: `지금 대운에서 ${nj}과 원진(怨嗔) 기운이 들어와요`,
        desc: `원진은 서로 껄끄럽고 어긋나는 기운이에요. 사람과의 관계에서 이유 없이 안 맞는 느낌, 노력해도 공 인정받기 어려운 상황, 주변과의 불화가 이 기간에 더 빈번하게 나타날 수 있어요. 앞으로 ${remaining}년간은 대인관계에서 너무 완벽한 이해를 기대하지 말고, 소수의 신뢰할 수 있는 관계에 집중하세요. 억울함은 내려놓는 연습이 필요합니다.`,
      });
    }
  }

  // 대운에서 파(破) 들어올 때
  for (const nj of natalJjs) {
    if (jjPairMatch(nj, dj, PA_PAIRS)) {
      insights.push({
        type: "warn",
        icon: "💔",
        title: `지금 대운에서 ${nj}과 파(破) 기운이 들어와요`,
        desc: `파는 시작은 좋은데 끝에 가서 어긋나거나 깨지는 기운이에요. 프로젝트·계약·관계가 마무리 단계에서 틀어지는 경험을 할 수 있어요. 앞으로 ${remaining}년간은 중요한 계약이나 마무리 단계에서 꼼꼼하게 점검하세요. 시작의 들뜬 감정에 치우치지 말고, 끝까지 세부 사항을 확인하는 습관이 손실을 막아줍니다.`,
      });
    }
  }

  // 대운에서 형(刑) 들어올 때
  for (const nj of natalJjs) {
    if (hyeongMatch(nj, dj)) {
      insights.push({
        type: "warn",
        icon: "🔒",
        title: `지금 대운에서 ${nj}과 형(刑) 기운이 들어와요`,
        desc: `형은 겉으로는 비슷한 것 같은데 서로 억압하거나 옭아매는 기운이에요. 법적 문제·규칙과의 충돌·억압적인 환경에 놓일 수 있어요. 앞으로 ${remaining}년간은 계약서를 꼼꼼히 읽고, 규정을 어기는 행동은 최대한 자제하세요. 억울하게 엮이는 상황을 예방하는 게 최우선입니다.`,
      });
    }
  }

  // 대운 지지가 나의 사생지와 충
  if (SASAENGJI.has(dj)) {
    const chungNatal = natalJjs.find(nj => jjPairMatch(nj, dj, JIJI_CHUNG_PAIRS));
    if (chungNatal) {
      insights.push({
        type: "warn",
        icon: "🌪️",
        title: `대운의 강한 변화 기운이 사주 내 기둥을 흔들어요`,
        desc: `지금 대운 ${dj}은 강한 이동·변화의 기운인데, 내 사주 ${chungNatal}과 정면으로 충돌해요. 이 시기에 의도치 않은 큰 변화(이사·이직·이별)가 찾아올 수 있습니다. 앞으로 ${remaining}년간은 변화를 막으려 버티기보다, 내가 주도적으로 변화를 설계하고 미리 움직이는 게 훨씬 낫습니다.`,
      });
    }
  }

  // 대운 세력 설명 — age 표시
  insights.unshift({
    type: "neutral",
    icon: "🌊",
    title: `현재 대운 (${age}세 전후, ${currentPillar.cg}${currentPillar.jj} 대운)`,
    desc: `지금은 ${currentPillar.cg}${currentPillar.jj} 대운 안에 있어요. 이 대운은 ${currentPillar.yearStart}년부터 시작해 앞으로 ${remaining}년이 남아 있습니다. 아래는 이 대운이 내 사주와 어떻게 맞물리는지 분석한 내용이에요.`,
  });

  return insights;
}

type Stage = "confirming" | "done" | "error";

function SuccessContent() {
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("confirming");
  const [errorMsg, setErrorMsg] = useState("");
  const [sinsals, setSinsals] = useState<string[]>([]);
  const [dominant, setDominant] = useState<string[]>([]);
  const [lacking, setLacking] = useState<string[]>([]);
  const [dayCg, setDayCg] = useState("");
  const [dayJj, setDayJj] = useState("");
  const [trashFindings, setTrashFindings] = useState<{ icon: string; title: string; desc: string }[]>([]);
  const [daewoonInsights, setDaewoonInsights] = useState<DaewoonInsight[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("overcomeData");
      if (!raw) {
        setErrorMsg("분석 정보가 올바르지 않습니다.");
        setStage("error");
        return;
      }
      const { form } = JSON.parse(raw);
      const r = analyzeSaju({
        birthYear: form.year, birthMonth: form.month, birthDay: form.day,
        birthHour: form.hour ?? null, birthMinute: 0, name: form.name || "", gender: form.gender || "female",
        birthPlace: "서울", style: "auto", productType: "report", useJajasi: false,
      });
      setSinsals(r.sinsalList.map((s: { name: string }) => s.name));
      setDominant(r.dominant);
      setLacking(r.lacking);
      setDayCg(r.pillarsDetail.day.cg);
      setDayJj(r.pillarsDetail.day.jj);
      setTrashFindings(computeTrashFindings(r, form.gender || "female"));
      setDaewoonInsights(computeDaewoonInsights(r, { year: form.year, month: form.month, day: form.day, gender: form.gender || "female" }));
      setStage("done");
    } catch {
      setErrorMsg("분석 정보가 올바르지 않습니다.");
      setStage("error");
    }
  }, []);

  if (stage === "error") {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-4">
        <p className="text-red-400 text-lg font-bold mb-4">⚠️ {errorMsg}</p>
        <button onClick={() => router.push("/service/overcome")} className="text-sm text-gray-400 underline">처음으로 돌아가기</button>
      </main>
    );
  }

  if (stage === "confirming") {
    return (
      <main className="min-h-screen bg-[#06060e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">분석 중...</p>
        </div>
      </main>
    );
  }

  const mySinsals = sinsals.filter(s => s in SINSAL_OVERCOME);

  return (
    <main className="min-h-screen bg-[#06060e] text-white" style={{ animation: "fadeIn 0.45s ease-out" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[160px]" style={{ background:"rgba(239,68,68,0.08)" }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-20" id="overcome-result">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>
          <span className="text-xs text-green-400/70 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">✓ 분석 완료</span>
        </div>

        {/* 일주 */}
        {dayCg && (
          <div className="text-center mb-8 p-6 rounded-3xl" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs text-gray-600 font-bold tracking-widest uppercase mb-2">일주</p>
            <p className="text-5xl font-black text-white mb-1">{dayCg}{dayJj}</p>
            <p className="text-sm text-gray-500">
              사주 극복법 맞춤 분석
              {GANYEOJIDONG_PAIRS[`${dayCg}${dayJj}`] && " — 위아래가 같은 기운으로 단단히 뭉친 일주라 고집과 주체성이 굉장히 강합니다. 환경 변화에 휩쓸려 잦은 이직이나 이동을 하면 에너지만 낭비되기 쉬우니, 뚝심 있게 한곳을 지키며 자기 브랜딩을 쌓아갈수록 돈과 기회가 따라옵니다."}
            </p>
          </div>
        )}

        {/* 내 사주의 쓰레기력 */}
        <div className="mb-8">
          <h2 className="text-lg font-black text-white mb-1">내 사주의 쓰레기력은?</h2>
          <p className="text-xs text-gray-500 mb-4">충이나 신약 자체가 나쁜 게 아니라, 특정 조합이 겹칠 때만 약점이 됩니다</p>
          {trashFindings.length > 0 ? (
            <div className="space-y-4">
              {trashFindings.map((f, i) => (
                <div key={i} className="rounded-2xl border p-5" style={{ borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{f.icon}</span>
                    <p className="font-black text-white">{f.title}</p>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl" style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)" }}>
              <p className="text-sm text-green-300">✅ 특별히 약점으로 겹치는 조합이 발견되지 않았습니다.</p>
            </div>
          )}
        </div>

        {/* 신살 극복법 */}
        {mySinsals.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-lg font-black text-white mb-1">내 신살 극복법</h2>
            <p className="text-xs text-gray-500 mb-4">사주에서 발견된 {mySinsals.length}개의 신살</p>
            <div className="space-y-4">
              {mySinsals.map(key => {
                const s = SINSAL_OVERCOME[key];
                return (
                  <div key={key} className="rounded-2xl border p-5" style={{ borderColor: s.color + "40", background: s.color + "08" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <p className="font-black text-white">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.problem.split("\n")[0]}</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      {s.overcome.map((o, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="shrink-0 mt-0.5 font-black" style={{ color: s.color }}>{i + 1}.</span>{o}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl p-3" style={{ background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.15)" }}>
                      <p className="text-xs text-yellow-300/80">⚠️ {s.caution}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-8 p-4 rounded-2xl" style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)" }}>
            <p className="text-sm text-green-300">✅ 주요 흉살이 없는 사주입니다.</p>
          </div>
        )}

        {/* 대운 흐름 분석 */}
        {daewoonInsights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-black text-white mb-1">지금 대운 흐름</h2>
            <p className="text-xs text-gray-500 mb-4">현재 10년 대운이 내 사주와 어떻게 맞물리는지</p>
            <div className="space-y-4">
              {daewoonInsights.map((ins, i) => {
                const borderColor = ins.type === "good" ? "rgba(34,197,94,0.3)" : ins.type === "warn" ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.1)";
                const bgColor = ins.type === "good" ? "rgba(34,197,94,0.06)" : ins.type === "warn" ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.03)";
                return (
                  <div key={i} className="rounded-2xl border p-5" style={{ borderColor, background: bgColor }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{ins.icon}</span>
                      <p className="font-black text-white">{ins.title}</p>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{ins.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 오행 불균형 */}
        {(dominant.length > 0 || lacking.length > 0) && (
          <div className="mb-8">
            <h2 className="text-lg font-black text-white mb-1">오행 불균형 극복법</h2>
            <p className="text-xs text-gray-500 mb-4">내 오행 기반 맞춤 솔루션</p>

            {dominant.map(el => {
              const d = ELEMENT_OVERCOME[el];
              if (!d) return null;
              return (
                <div key={el} className="rounded-2xl border p-5 mb-4" style={{ borderColor:d.color+"40", background:d.color+"08" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{d.icon}</span>
                      <span className="font-black text-white">{el} 과다</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">과다</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 whitespace-pre-line">{d.overDesc}</p>
                  <div className="text-xs text-gray-300">
                    <p className="mb-1"><span className="text-gray-500">극복: </span>{d.overFix}</p>
                    <p className="mb-1"><span className="text-gray-500">건강: </span>{d.healthTip}</p>
                    <p><span className="text-gray-500">활동·행동: </span>{d.activity}</p>
                  </div>
                </div>
              );
            })}

            {lacking.map(el => {
              const d = ELEMENT_OVERCOME[el];
              if (!d) return null;
              return (
                <div key={el} className="rounded-2xl border p-5 mb-4" style={{ borderColor:d.color+"40", background:d.color+"08" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{d.icon}</span>
                      <span className="font-black text-white">{el} 부족</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">부족</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{d.lackDesc}</p>
                  <div className="rounded-xl p-4" style={{ background:d.color+"10", border:`1px solid ${d.color}25` }}>
                    <p className="text-xs font-bold mb-3" style={{ color:d.color }}>{el} 기운 채우는 법</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                      <div><span className="text-gray-500">색 </span><span className="text-white font-semibold">{d.chakColor}</span></div>
                      <div><span className="text-gray-500">방향 </span><span className="text-white font-semibold">{d.direction}</span></div>
                      <div><span className="text-gray-500">숫자 </span><span className="text-white font-semibold">{d.numbers}</span></div>
                      <div><span className="text-gray-500">건강 </span><span className="text-white font-semibold">{d.healthTip}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">물건 </span><span className="text-white font-semibold">{d.objects}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">음식 </span><span className="text-white font-semibold">{d.food}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">활동·행동 </span><span className="text-white font-semibold">{d.activity}</span></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 개운법 */}
        {gaewunRanking.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}>
            <p className="text-sm font-black text-white mb-1">나에게 맞는 색·방향·음식·숫자</p>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>오행 기운을 기준으로 좋은 오행 3가지를 우선 활용해보세요</p>
            <div className="space-y-2.5">
              {gaewunRanking.map(g => (
                <div key={g.element} className="rounded-xl px-4 py-3" style={{ background: g.isGood ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${g.isGood ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.08)"}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: g.isGood ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.08)", color: g.isGood ? "#fbbf24" : "rgba(255,255,255,0.4)" }}>{g.rank}순위</span>
                    <span className="text-sm font-black" style={{ color: g.colorHex }}>{g.color}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>방향 {g.direction} · 음식 {g.food} · 맛 {g.taste} · 운동 {g.exercise} · 아이템 {g.items} · 숫자 {g.numbers}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-700">본 분석은 사주 이론 기반 오락용 콘텐츠입니다.</p>
        <ResultFooterActions targetId="overcome-result" fileName="신살극복법" shareTitle="내 신살 극복법" shareText="Summer Palace에서 내 신살 극복법을 확인했어요" />
      </div>
    </main>
  );
}

export default function OvercomeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#06060e] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
