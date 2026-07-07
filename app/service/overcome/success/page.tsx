"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju, getJijiRelations, getDohwaJj, CHEONUL_JJ, calcDaewoon, CHEONGAN_ELEMENT } from "@/lib/saju";
import { GANYEOJIDONG_PAIRS } from "@/lib/saju2";
import ResultFooterActions from "@/components/ResultFooterActions";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

const SINSAL_OVERCOME: Record<string, {
  color: string; name: string;
  problem: string; overcome: string[]; caution: string;
}> = {
  역마살: { color:"#16a34a",name:"역마살",
    problem:"정착보다 이동·변화에서 에너지가 살아남",
    overcome:["이동을 막지 말고, 여행·무역·해외 관련 직종으로 흘러가게 하세요","정기적인 여행 계획이 있으면 관계와 직장이 안정돼요","한국보다 해외에서 더 잘 풀리는 경우가 많아요","한곳 대박보다 여러 거점에서 수익 구조를 만드세요"],
    caution:"억지로 정착 강요하면 더 큰 이탈이 와요" },
  화개살: { color:"#818cf8",name:"화개살",
    problem:"고독·이질감이 강하고 혼자일 때 충전됨",
    overcome:["고독을 창의적 힘으로 전환하세요","명상·수련·종교 활동이 에너지를 안정시켜요","혼자만의 공간과 시간을 충분히 확보하세요","소수의 진짜 관계에 집중하세요"],
    caution:"술·도박·게임 같은 현실 도피에 빠지기 쉬워요" },
  겁살: { color:"#f97316",name:"겁살",
    problem:"충동·사고·충돌 에너지가 강함",
    overcome:["운동·군인·경찰·소방관 계통으로 에너지를 사용하세요","결정 전 충분히 숙고하는 습관을 만드세요","재물은 분산 투자·적금·보험으로 손실을 대비하세요","정기 건강 검진이 필수예요"],
    caution:"침착함이 이 기운을 가장 잘 다루는 무기예요" },
  재살: { color:"#dc2626",name:"재살",
    problem:"예기치 않은 재난·사고 에너지",
    overcome:["물가·운전·법적 상황에서 더욱 주의하세요","재살이 겹치는 해에는 큰 거래·투자·수술을 피하세요","위험 관련 직종에서 오히려 강점이 돼요"],
    caution:"겨울철과 자월에 특히 조심하세요" },
  천살: { color:"#6d28d9",name:"천살",
    problem:"예측 불가 재난의 에너지",
    overcome:["규칙적인 일상이 안정을 줘요","기도·명상·등산으로 에너지를 정화하세요","극단적 행동을 피하세요"],
    caution:"여름 장마·태풍 시즌 야외 활동을 자제하세요" },
  망신살: { color:"#ef4444",name:"망신살",
    problem:"구설·명예 손상이 잦음",
    overcome:["말과 행동을 신중하게 하세요","SNS 노출을 최소화하고 공개 발언을 사전 검토하세요","정직하게 행동하는 것이 최고의 방어예요"],
    caution:"이성 관계에서 특히 조심하세요" },
  고신살: { color:"#64748b",name:"고신살",
    problem:"고독·단절 경험이 잦음",
    overcome:["고독을 두려워하지 마세요","종교·봉사·예술로 연결을 만드세요","반려동물이 큰 위안이 돼요"],
    caution:"억지로 결혼·연애를 강행하면 더 큰 고독이 와요" },
  귀문관살: { color:"#c084fc",name:"귀문관살",
    problem:"신경 예민·불안·불면이 잦음",
    overcome:["예민함을 예술·상담·치유 분야로 승화하세요","잠들기 전 마음을 정화하는 루틴을 만드세요","혼자 충전하는 시간을 충분히 확보하세요"],
    caution:"카페인·술·담배는 예민함을 폭발시켜요" },
  양인살: { color:"#f87171",name:"양인살",
    problem:"충동적 추진력이 사고·다툼으로 이어짐",
    overcome:["에너지를 운동·군인·경찰·외과의사로 사용하세요","결정적 순간에 '잠깐 멈추는' 습관을 만드세요","격투기·무술·수영으로 과잉 에너지를 소비하세요"],
    caution:"음주 후 충동적 행동이 가장 위험해요" },
  홍염살: { color:"#dc2626",name:"홍염살",
    problem:"이성 관계가 복잡해지기 쉬움",
    overcome:["이성 매력을 예술·공연·서비스업으로 승화하세요","한 사람에게 집중하는 연습을 하세요","댄스·음악·연극 같은 취미로 매력을 발산하세요"],
    caution:"결혼 후에도 이성 인연이 계속 들어와요" },
  장성살: { color:"#f59e0b",name:"장성살",
    problem:"남 밑에서 지시받으면 에너지 고갈",
    overcome:["독립 또는 팀장 이상의 자리를 노리세요","리더십이 발휘되는 위치에서 능력이 폭발해요","군인·경찰·경영자 계통에서 강점이 드러나요"],
    caution:"아랫사람에게 독재자처럼 굴지 않도록 위임 연습을 하세요" },
  반안살: { color:"#10b981",name:"반안살",
    problem:"교만해지면 복이 새기 쉬움",
    overcome:["겸손을 유지하면 재물과 지위가 자연스럽게 따라와요","외모·이미지 관리에 투자하세요","귀한 물건을 가까이 두면 기운이 올라가요"],
    caution:"잘나갈 때 자만하면 급전직하하는 기운이에요" },
  지살: { color:"#0891b2",name:"지살",
    problem:"한곳에 정착하기 어렵고 넓은 활동 반경이 필요",
    overcome:["타지·외지·해외에서 새로운 기회를 열어가세요","여행·무역·교류가 많은 직종이 잘 맞아요","거점은 유지하되 활동 반경을 넓게 가져가세요"],
    caution:"충동적 이사·이직보다 전략적 이동을 선택하세요" },
  년살: { color:"#db2777",name:"년살",
    problem:"이성 인연 복잡·소비 과다",
    overcome:["이성 매력을 직업에 적극 활용하세요","지출 관리를 시스템화하세요 — 자동이체·적금이 핵심이에요","외향적인 직종(영업·서비스·엔터)에서 강점이 드러나요"],
    caution:"겉멋과 허영에 흔들리면 재물이 흩어져요" },
  월살: { color:"#7c3aed",name:"월살",
    problem:"시작은 쉬운데 결실까지 오래 걸림",
    overcome:["빠른 성과보다 장기적으로 꾸준히 쌓는 방식이 맞아요","인내심을 무기로 삼으세요 — 대기만성형이에요","전문성을 꾸준히 쌓는 직종에서 결국 두각을 나타내요"],
    caution:"급하게 성과 내려다 모두 잃는 패턴을 조심하세요" },
  육해살: { color:"#6d28d9",name:"육해살",
    problem:"인간관계 어긋남·만성 잔병치레",
    overcome:["인간관계의 거리를 의도적으로 조율하세요","빠른 두뇌 회전을 분석·기획 계통에서 활용하세요","운의 기복이 크니 고점에서 아끼고 저점을 대비하세요"],
    caution:"충돌이 잦을수록 혼자만의 회복 시간을 꼭 가지세요" },
};

const ELEMENT_GAEWUN: Record<string, {
  color: string; label: string;
  colors: string; direction: string; numbers: string; food: string;
  activity: string; healthTip: string; items: string;
}> = {
  목: { color:"#4ade80", label:"목(木)",
    colors:"초록·연두", direction:"동쪽", numbers:"3·8", food:"신맛 — 귤, 레몬, 키위",
    activity:"숲 산책, 등산, 식물 가꾸기, 아침 스트레칭", healthTip:"간·담낭 챙기기, 절주 필수", items:"관엽식물, 나무 소품" },
  화: { color:"#f87171", label:"화(火)",
    colors:"빨강·주황", direction:"남쪽", numbers:"2·7", food:"쓴맛 — 커피, 녹차, 씀바귀",
    activity:"노래, 춤, 공연 관람, 모임·사교, 햇볕 쬐기", healthTip:"심장·혈압·눈 챙기기", items:"촛불, 붉은 꽃" },
  토: { color:"#fbbf24", label:"토(土)",
    colors:"황토·노랑", direction:"중앙", numbers:"5·10", food:"단맛 — 고구마, 꿀, 대추",
    activity:"명상, 요가, 텃밭·화분 가꾸기, 규칙적 산책", healthTip:"소화기·비장·위 챙기기", items:"황토 소품, 도자기, 악세서리" },
  금: { color:"#c4b5fd", label:"금(金)",
    colors:"흰색·은색", direction:"서쪽", numbers:"4·9", food:"매운맛 — 마늘, 생강, 고추",
    activity:"헬스·근력 운동, 정리정돈, 무술", healthTip:"폐·대장·피부 챙기기", items:"금속 소품, 시계" },
  수: { color:"#60a5fa", label:"수(水)",
    colors:"파랑·검정", direction:"북쪽", numbers:"1·6", food:"짠맛 — 해산물, 된장, 미역",
    activity:"독서, 수영, 글쓰기·일기, 충분한 수면", healthTip:"신장·방광·뼈 챙기기", items:"수족관, 파란 소품" },
};

const UUNSEONG_GAEWUN: Record<string, { phase: string; tip: string }> = {
  장생: { phase:"시작·도전의 시기", tip:"지금 시작하는 일이 이후 10년의 토대가 돼요. 새로운 인연·분야·공부를 적극적으로 시작하세요." },
  목욕: { phase:"감각·욕망이 강한 시기", tip:"넘치는 에너지를 창작·예술 방향으로 돌리면 의외로 뛰어난 결과물이 나와요. 충동적 결정은 하루 재고하세요." },
  관대: { phase:"배움·성장의 시기", tip:"자격증·기술·학업에 집중하는 시기예요. 이 시기에 쌓은 실력이 건록·제왕 대운의 성공을 결정해요." },
  건록: { phase:"최전성기·결실의 시기", tip:"지금까지 해온 일들이 결실을 맺는 시기예요. 부동산·장기 투자·안정적 자산 형성에 집중하기 좋아요." },
  제왕: { phase:"정점·카리스마의 시기", tip:"정점이니 방심이 가장 위험해요. 지금 번 것의 일부를 반드시 비축하고, 독단적 결정은 한 번 더 확인하세요." },
  쇠: { phase:"내실 다지기의 시기", tip:"새로 벌이기보다 지금 가진 것을 정리하고 내실화하세요. 리스크 높은 투자는 피하고 현금 유동성을 확보하세요." },
  병: { phase:"체력 회복이 필요한 시기", tip:"새 사업·큰 결정을 미루고 건강 검진과 비상금 마련에 집중하세요. 담담하게 버텨낸 사람이 이후 반등이 더 커요." },
  사: { phase:"충전·내면 탐구의 시기", tip:"독서·공부·명상·내면 탐구에 시간을 투자하세요. 지금 쌓은 것이 다음 대운에서 빛을 발해요." },
  묘: { phase:"내면 공부의 시기", tip:"외부 확장보다 내면의 공부, 명상, 자기 탐구에 에너지를 쓰세요. 폐쇄된 기운을 억지로 뚫으려 하면 더 막혀요." },
  절: { phase:"리셋·청소의 시기", tip:"불필요한 것들이 정리되는 시기예요. 현금을 확보하고 고정비를 줄이세요. 새 시작보다 탐색에 집중하세요." },
  태: { phase:"잉태·준비의 시기", tip:"지금 구상하는 것이 장생 대운에서 현실이 돼요. 자격 취득·네트워크 구축·아이디어 발굴에 집중하세요." },
  양: { phase:"꾸준한 성장의 시기", tip:"빛나지 않아도 성실하게 쌓아가는 것이 이 시기의 전략이에요. 소액 저축과 신뢰 관계를 만들어가세요." },
};

const CHEONGAN_GAEWUN: Record<string, string> = {
  갑:"나무처럼 위를 향해 성장하는 기운이에요. 리더십과 주도성을 살리세요. 새 프로젝트 시작, 진취적 도전이 잘 맞아요.",
  을:"유연하게 적응하는 기운이에요. 협력·네트워크·인간관계에서 빛을 발하는 시기예요.",
  병:"태양처럼 밝게 빛나는 기운이에요. 대외 활동·브랜딩·사람들과의 교류에서 에너지를 얻어요.",
  정:"은은하고 지속적인 불꽃 기운이에요. 꾸준한 창작·학습·심화 공부에 집중하세요.",
  무:"묵직하고 중심 잡힌 기운이에요. 신뢰를 쌓고 중심적 역할을 맡는 것이 유리해요.",
  기:"비옥한 토양의 기운이에요. 사람을 키우고 내조하는 역할에서 강점이 드러나요.",
  경:"날카롭고 강한 금속 기운이에요. 결단력과 추진력으로 성과를 내는 시기예요.",
  신:"세련된 금속 기운이에요. 예술적 감각과 완성도 높은 작업에서 빛을 발해요.",
  임:"흐르는 큰 강의 기운이에요. 지혜·전략·글쓰기에서 탁월한 성과를 낼 수 있어요.",
  계:"잔잔하고 깊은 물의 기운이에요. 섬세한 감수성과 분석력으로 내면을 탐구하는 시기예요.",
};

const CHEONGAN_HAP_PAIRS: [string, string][] = [["갑","기"],["을","경"],["병","신"],["정","임"],["무","계"]];
const CHEONGAN_CHUNG_PAIRS: [string, string][] = [["갑","경"],["을","신"],["병","임"],["정","계"]];
const pairMatch = (a: string, b: string, list: [string, string][]) =>
  list.some(([p, q]) => (p === a && q === b) || (p === b && q === a));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeTrashFindings(r: any, gender: string): { title: string; desc: string }[] {
  const findings: { title: string; desc: string }[] = [];
  const py = r.pillarsDetail.year, pm = r.pillarsDetail.month, pd = r.pillarsDetail.day, ph = r.pillarsDetail.hour;
  const ilgan = pd.cg;
  const ilji = pd.jj;

  const labeled: { label: string; jj: string }[] = [
    { label: "년", jj: py.jj }, { label: "월", jj: pm.jj }, { label: "일", jj: pd.jj },
  ];
  if (ph) labeled.push({ label: "시", jj: ph.jj });
  const jjs = labeled.map(l => l.jj);
  const rel = getJijiRelations(jjs);

  const otherCgs = [pm.cg, ph?.cg].filter(Boolean) as string[];
  const dayCombines = otherCgs.some(c => pairMatch(ilgan, c, CHEONGAN_HAP_PAIRS));
  const dayClashes = otherCgs.some(c => pairMatch(ilgan, c, CHEONGAN_CHUNG_PAIRS));
  if (r.yongshin.strength === "신약" && (dayCombines || dayClashes)) {
    findings.push({
      title: "내 기운이 주변에 자꾸 쏠려요",
      desc: "본인 기운이 약한 편인데 그 중심이 주변 기둥과 묶이거나 부딪혀요. 중요한 결정을 내릴 때는 혼자 충분히 생각할 시간을 갖고, 남의 말에 휩쓸려 급하게 움직이지 않는 게 핵심이에요.",
    });
  }

  const haeImportant = (r.yongshin.yongshin === "수" || r.yongshin.heeshin === "수");
  if (haeImportant && jjs.includes("해") && jjs.includes("사")) {
    findings.push({
      title: "꼭 필요한 기운이 불안정한 자리에 있어요",
      desc: "가장 필요한 기운이 정반대 기운과 부딪히는 자리에 있어요. 특정 시기에 갑자기 컨디션이 무너지거나 일이 꼬이기 쉬워요. 충분한 수면·휴식, 물 가까이 두는 습관이 이 기운을 지켜줘요.",
    });
  }

  const dohwaJj = getDohwaJj(py.jj);
  if (dohwaJj === "묘" && jjs.includes("묘") && jjs.includes("유")) {
    findings.push({
      title: "인기와 매력이 오히려 갈등을 만들어요",
      desc: "이성에게 매력적으로 비치는 기운이 정반대 기운과 부딪혀요. 인기는 분명히 있는데 구설이나 갑작스러운 이별·갈등으로 이어지기 쉬워요. 한 사람에게 집중하고 관계를 천천히 만드는 연습이 도움이 돼요.",
    });
  }

  const cheonulJjs: string[] = CHEONUL_JJ[ilgan] || [];
  if (cheonulJjs.includes(ilji)) {
    const iljiHit = rel.find((x: { jjA: string; jjB: string; type: string }) =>
      (x.jjA === ilji || x.jjB === ilji) && (x.type === "충" || x.type === "파" || x.type === "형"));
    if (iljiHit) {
      findings.push({
        title: "귀인이 있는데 타이밍이 자꾸 어긋나요",
        desc: "도움을 주는 귀인의 기운이 있는데, 그 자리가 다른 기운과 충돌해요. 막상 필요한 순간 타이밍이 맞지 않는 경우가 많아요. 배우자·동업자 관계에서 갈등이 잦다면 감정을 가라앉힌 뒤 대화하는 습관이 필요해요.",
      });
    }
  }

  const allSipseong: string[] = [py.sipseongCg, py.sipseongJj, pm.sipseongCg, pm.sipseongJj, pd.sipseongJj];
  if (ph) allSipseong.push(ph.sipseongCg, ph.sipseongJj);
  const noBigyeop = allSipseong.every(s => s !== "비견" && s !== "겁재");
  if (noBigyeop) {
    findings.push({
      title: "나와 같은 기운의 동반자가 없는 구조예요",
      desc: "'딱 나 같은 사람'을 만나기가 유독 어렵고, 형제자매·동료·동업자 관계에서 늘 혼자 이끌거나 책임지는 위치에 서기 쉬워요. 억지로 비슷한 사람을 찾기보다 혼자서도 단단한 삶의 구조를 만드는 쪽이 훨씬 잘 맞아요.",
    });
  }

  if ((ilgan === "무" || ilgan === "기") && gender === "female" && r.dominant.includes("토")) {
    findings.push({
      title: "혼자만의 삶에 유독 강한 구조예요",
      desc: "누군가와 꼭 붙어 지내는 삶보다 혼자서 자기 일과 생활을 꾸려가는 삶에서 오히려 더 편안하고 잘 풀리는 경우가 많아요. 비혼이나 늦은 결혼을 택해도 불안해할 필요 없는 사주예요.",
    });
  }

  return findings;
}

const CURRENT_YEAR = 2026;

interface DiagramScore {
  key: string; label: string; description: string; color: string;
  score: number; boosted: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeDiagramScores(r: any, sinsals: string[]): DiagramScore[] {
  const py = r.pillarsDetail.year, pm = r.pillarsDetail.month, pd = r.pillarsDetail.day, ph = r.pillarsDetail.hour;
  const allSipseong: string[] = [py.sipseongCg, py.sipseongJj, pm.sipseongCg, pm.sipseongJj, pd.sipseongJj];
  if (ph) allSipseong.push(ph.sipseongCg, ph.sipseongJj);
  const countS = (names: string[]) => allSipseong.filter(s => names.includes(s)).length;

  const hasJegwan = countS(["정재","편재"]);
  const hasGwansung = countS(["정관","편관"]);
  const hasSiksang = countS(["식신","상관"]);
  const hasBigyeop = countS(["비견","겁재"]);
  const hasInsung = countS(["정인","편인"]);
  const isWeak = r.yongshin?.strength === "신약";
  const hasDohwa = sinsals.some(s => ["도화살","함지살"].includes(s));
  const hasHomyeom = sinsals.includes("홍염살");
  const hasYeokma = sinsals.includes("역마살");
  const hasGwimun = sinsals.includes("귀문관살");
  const hasGosin = sinsals.includes("고신살");
  const hasHwagae = sinsals.includes("화개살");
  const hasGeopsal = sinsals.includes("겁살");
  const hasJaesal = sinsals.includes("재살");
  const hasYangIn = sinsals.includes("양인살");
  const hasWolsal = sinsals.includes("월살");
  const clamp = (n: number) => Math.max(12, Math.min(94, Math.round(n)));
  const boost = (n: number) => Math.min(97, Math.round(n * 1.3));

  let charm = 42;
  if (hasDohwa) charm += 15; if (hasHomyeom) charm += 10;
  if (hasJegwan >= 2) charm += 10; if (hasGwansung >= 2) charm += 8;
  if (hasSiksang >= 1) charm += 5; if (isWeak) charm -= 5;
  charm = clamp(charm);

  let money = 42;
  if (hasJegwan >= 2) money += 15; if (hasSiksang >= 1) money += 10;
  if (hasYeokma) money += 5; if (isWeak && hasSiksang === 0) money -= 10;
  if (r.yongshin?.yongshin === "재") money += 10;
  money = clamp(money);

  let social = 48;
  if (hasGwansung >= 1) social += 10; if (hasSiksang >= 1) social += 10;
  if (hasBigyeop >= 1) social += 5; if (hasGosin || hasHwagae) social -= 12;
  social = clamp(social);

  let persistence = 48;
  if (hasInsung >= 2) persistence += 15; else if (hasInsung >= 1) persistence += 7;
  if (hasBigyeop >= 2) persistence += 5; if (hasWolsal) persistence += 10;
  if (isWeak) persistence -= 8;
  persistence = clamp(persistence);

  let creative = 42;
  if (hasSiksang >= 2) creative += 20; else if (hasSiksang >= 1) creative += 10;
  if (hasGwimun) creative += 12; if (r.dominant?.includes("화")) creative += 5;
  creative = clamp(creative);

  let health = 58;
  if (hasGeopsal || hasJaesal) health -= 12; if (hasYangIn) health -= 5;
  if (!r.lacking?.length) health += 5;
  health = clamp(health);

  return [
    { key:"charm",       label:"매력·연애운",    description:"이성과 인연이 맺어지는 기운", color:"#f472b6", score:charm,       boosted:boost(charm) },
    { key:"money",       label:"재물·금전운",    description:"돈이 모이고 불어나는 기운",    color:"#fbbf24", score:money,       boosted:boost(money) },
    { key:"social",      label:"사회생활·인맥",  description:"조직과 사람 속에서의 기운",    color:"#60a5fa", score:social,      boosted:boost(social) },
    { key:"persistence", label:"끈기·인내력",    description:"버티고 쌓는 힘",             color:"#a78bfa", score:persistence, boosted:boost(persistence) },
    { key:"creative",    label:"창의력·표현력",  description:"아이디어와 감성의 힘",         color:"#34d399", score:creative,    boosted:boost(creative) },
    { key:"health",      label:"건강·체력",      description:"몸과 에너지의 기운",           color:"#f87171", score:health,      boosted:boost(health) },
  ];
}

interface DaewoonGaewun {
  cg: string; jj: string; age: number; remaining: number;
  uunseong: string;
  cgGaewun: string;
  phaseLabel: string;
  phaseTip: string;
  elGaewun: typeof ELEMENT_GAEWUN[string];
  el: string;
  generalTip: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeDaewoonGaewun(r: any, form: { year: number; month: number; day: number; gender: string }): DaewoonGaewun | null {
  const gender = (form.gender === "male" ? "male" : "female") as "male" | "female";
  const ilgan: string = r.pillarsDetail.day.cg;
  const monthPillar = { cg: r.pillarsDetail.month.cg, jj: r.pillarsDetail.month.jj };

  let daewoonResult;
  try { daewoonResult = calcDaewoon(form.year, form.month, form.day, gender, ilgan, monthPillar); }
  catch { return null; }

  const pillars = daewoonResult.pillars as { yearStart: number; jj: string; cg: string; age: number; uunseong: string; element: string }[];
  const currentPillar = pillars.find(p => p.yearStart <= CURRENT_YEAR && CURRENT_YEAR < p.yearStart + 10);
  if (!currentPillar) return null;

  const remaining = (currentPillar.yearStart + 10) - CURRENT_YEAR;
  const el = CHEONGAN_ELEMENT[currentPillar.cg] || currentPillar.element || "토";
  const elGaewun = ELEMENT_GAEWUN[el] || ELEMENT_GAEWUN["토"];
  const uunseong = currentPillar.uunseong || "건록";
  const uGaewun = UUNSEONG_GAEWUN[uunseong] || UUNSEONG_GAEWUN["건록"];
  const cgGaewun = CHEONGAN_GAEWUN[currentPillar.cg] || "";

  // 대운 지지와 원국 전체 관계를 보고 일반적인 조언
  const py = r.pillarsDetail.year, pm = r.pillarsDetail.month, pd = r.pillarsDetail.day, ph = r.pillarsDetail.hour;
  const natalJjs: string[] = [py.jj, pm.jj, pd.jj];
  if (ph) natalJjs.push(ph.jj);

  const JIJI_CHUNG_PAIRS: [string, string][] = [["자","오"],["축","미"],["인","신"],["묘","유"],["진","술"],["사","해"]];
  const clashCount = natalJjs.filter(nj => JIJI_CHUNG_PAIRS.some(([a,b]) => (a===nj&&b===currentPillar.jj)||(b===nj&&a===currentPillar.jj))).length;
  const YUKHAP: Record<string,string> = {"자축":"토","인해":"목","묘술":"화","진유":"금","사신":"수","오미":"화"};
  const harmonyCount = natalJjs.filter(nj => YUKHAP[`${nj}${currentPillar.jj}`] || YUKHAP[`${currentPillar.jj}${nj}`]).length;

  let generalTip = "";
  if (clashCount > harmonyCount && clashCount > 0) generalTip = `이 대운에서 에너지 충돌이 있는 시기예요. 새 시작보다 내실 다지기에 집중하고, 변화는 직접 주도해서 내 것으로 만드세요. 앞으로 ${remaining}년이 남아 있어요.`;
  else if (harmonyCount > clashCount && harmonyCount > 0) generalTip = `이 대운은 원국과 자연스럽게 합을 이루는 좋은 흐름이에요. 그동안 미뤄왔던 일을 밀고 나가기 좋은 시기예요. 앞으로 ${remaining}년이 남아 있어요.`;
  else if (clashCount > 0 && harmonyCount > 0) generalTip = `이 대운은 충돌과 합이 동시에 작용하는 복합적인 시기예요. 합의 흐름을 살리면서 충돌 에너지를 능동적으로 전환하면 큰 도약이 가능해요. 앞으로 ${remaining}년이 남아 있어요.`;
  else generalTip = `이 대운은 원국과 큰 충돌 없이 흘러가는 시기예요. 꾸준한 노력이 차곡차곡 쌓여가는 흐름이에요. 앞으로 ${remaining}년이 남아 있어요.`;

  return {
    cg: currentPillar.cg, jj: currentPillar.jj,
    age: CURRENT_YEAR - form.year + 1,
    remaining, uunseong,
    cgGaewun,
    phaseLabel: uGaewun.phase,
    phaseTip: uGaewun.tip,
    elGaewun, el, generalTip,
  };
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
  const [trashFindings, setTrashFindings] = useState<{ title: string; desc: string }[]>([]);
  const [daewoonGaewun, setDaewoonGaewun] = useState<DaewoonGaewun | null>(null);
  const [gaewunEl, setGaewunEl] = useState<string>("");
  const [diagramScores, setDiagramScores] = useState<DiagramScore[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("overcomeData");
      if (!raw) { setErrorMsg("분석 정보가 올바르지 않아요."); setStage("error"); return; }
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
      setDaewoonGaewun(computeDaewoonGaewun(r, { year: form.year, month: form.month, day: form.day, gender: form.gender || "female" }));
      // 개운 오행: 용신 또는 부족한 오행 우선
      setGaewunEl(r.yongshin.yongshin || r.lacking[0] || "");
      setDiagramScores(computeDiagramScores(r, r.sinsalList.map((s: { name: string }) => s.name)));
      setStage("done");
    } catch {
      setErrorMsg("분석 정보가 올바르지 않아요."); setStage("error");
    }
  }, []);

  if (stage === "error") {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-4">
        <p className="text-red-400 text-lg font-bold mb-4">{errorMsg}</p>
        <button onClick={() => router.push("/service/overcome")} className="text-sm text-gray-400 underline">처음으로 돌아가기</button>
      </main>
    );
  }

  if (stage === "confirming") {
    return (
      <main className="min-h-screen bg-[#06060e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">분석 중...</p>
        </div>
      </main>
    );
  }

  const mySinsals = sinsals.filter(s => s in SINSAL_OVERCOME);
  const primaryGaewunEl = ELEMENT_GAEWUN[gaewunEl] || null;

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <BackButton />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background:"rgba(239,68,68,0.07)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background:"rgba(251,191,36,0.05)" }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-5 pt-8 pb-24" id="overcome-result">

        {/* 헤더 */}
        <div className="mb-8">
          <p className="text-xs text-gray-600 font-bold tracking-widest uppercase mb-2">Summer Palace</p>
          {dayCg && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-5xl font-black text-white leading-none">{dayCg}{dayJj}</p>
                <p className="text-[10px] text-gray-600 mt-1">일주</p>
              </div>
              <div>
                <p className="text-xl font-black text-white leading-tight">쓰레기 사주<br /><span className="text-red-400">극복법</span></p>
                {GANYEOJIDONG_PAIRS[`${dayCg}${dayJj}`] && (
                  <p className="text-[10px] text-gray-500 mt-1 max-w-[200px] leading-relaxed">위아래 기운이 같아 고집·주체성이 강한 일주</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 다이어그램 */}
        {diagramScores.length > 0 && (
          <section className="mb-8">
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-base font-black text-white">내 기운 다이어그램</h2>
              <span className="text-xs text-gray-600">개운 전·후 비교</span>
            </div>
            <div className="rounded-2xl p-5" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)" }}>
              <div className="space-y-5">
                {diagramScores.map(d => (
                  <div key={d.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-bold text-white">{d.label}</span>
                        <span className="text-[10px] text-gray-600">{d.description}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-sm font-black tabular-nums" style={{ color:d.color }}>{d.score}</span>
                        <span className="text-[10px] text-gray-600">→</span>
                        <span className="text-sm font-black tabular-nums text-white">{d.boosted}</span>
                        <span className="text-[9px] text-gray-600">점</span>
                      </div>
                    </div>
                    <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                      {/* boosted bar (lighter) */}
                      <div className="absolute left-0 top-0 h-full rounded-full" style={{ width:`${d.boosted}%`, background:`${d.color}30` }} />
                      {/* current bar (solid) */}
                      <div className="absolute left-0 top-0 h-full rounded-full" style={{ width:`${d.score}%`, background:d.color }} />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[9px] text-gray-700">0</span>
                      <span className="text-[9px] text-gray-600">개운 후 +{d.boosted - d.score}점 예상</span>
                      <span className="text-[9px] text-gray-700">100</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-700 mt-4 text-center border-t border-white/5 pt-3">개운법을 꾸준히 실천할 때의 기대 향상치예요</p>
            </div>
          </section>
        )}

        {/* ① 내 사주의 약점 */}
        <section className="mb-8">
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-base font-black text-white">내 사주의 약점</h2>
            <span className="text-xs text-gray-600">충이나 신약 자체가 나쁜 게 아니에요</span>
          </div>
          {trashFindings.length > 0 ? (
            <div className="space-y-3">
              {trashFindings.map((f, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.18)" }}>
                  <p className="font-bold text-sm text-white mb-1.5">{f.title}</p>
                  <p className="text-xs text-gray-300 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl p-4" style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.18)" }}>
              <p className="text-sm text-green-300 font-semibold">특별히 약점으로 겹치는 조합이 없어요</p>
            </div>
          )}
        </section>

        {/* ② 신살 극복법 */}
        {mySinsals.length > 0 && (
          <section className="mb-8">
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-base font-black text-white">신살 극복법</h2>
              <span className="text-xs text-gray-600">{mySinsals.length}개 발견</span>
            </div>
            <div className="space-y-4">
              {mySinsals.map(key => {
                const s = SINSAL_OVERCOME[key];
                return (
                  <div key={key} className="rounded-2xl overflow-hidden" style={{ border:`1px solid ${s.color}30` }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ background:`${s.color}15` }}>
                      <p className="font-black text-white">{s.name}</p>
                      <p className="text-xs" style={{ color:`${s.color}cc` }}>{s.problem}</p>
                    </div>
                    <div className="px-4 py-3" style={{ background:"rgba(0,0,0,0.2)" }}>
                      <div className="space-y-2 mb-3">
                        {s.overcome.map((o, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5" style={{ background:`${s.color}25`, color:s.color }}>{i+1}</span>
                            <p className="text-xs text-gray-200 leading-relaxed">{o}</p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl px-3 py-2" style={{ background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.15)" }}>
                        <p className="text-xs text-yellow-400/80">주의 — {s.caution}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ③ 지금 대운 개운법 */}
        {daewoonGaewun && (
          <section className="mb-8">
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-base font-black text-white">지금 대운 개운법</h2>
              <span className="text-xs text-gray-600">{daewoonGaewun.cg}{daewoonGaewun.jj} 대운 · {daewoonGaewun.remaining}년 남음</span>
            </div>

            {/* 대운 개요 카드 */}
            <div className="rounded-2xl p-5 mb-3" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="text-center shrink-0">
                  <p className="text-4xl font-black text-white leading-none">{daewoonGaewun.cg}</p>
                  <p className="text-4xl font-black text-white leading-none">{daewoonGaewun.jj}</p>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 mb-2 inline-block">{daewoonGaewun.phaseLabel}</span>
                  <p className="text-xs text-gray-300 leading-relaxed">{daewoonGaewun.generalTip}</p>
                </div>
              </div>
              <div className="rounded-xl p-3" style={{ background:"rgba(255,255,255,0.04)" }}>
                <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wider">이 대운 천간의 기운</p>
                <p className="text-xs text-gray-200 leading-relaxed">{daewoonGaewun.cgGaewun}</p>
              </div>
            </div>

            {/* 12운성 개운 팁 */}
            <div className="rounded-2xl p-4 mb-3" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">이 시기에 운을 여는 방법</p>
              <p className="text-sm text-white font-semibold leading-relaxed">{daewoonGaewun.phaseTip}</p>
            </div>

            {/* 대운 오행 개운법 */}
            <div className="rounded-2xl p-4" style={{ background:`${daewoonGaewun.elGaewun.color}10`, border:`1px solid ${daewoonGaewun.elGaewun.color}25` }}>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color:daewoonGaewun.elGaewun.color }}>대운 {daewoonGaewun.el}(
              {daewoonGaewun.elGaewun.label}) 기운 활용법</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label:"색상", val:daewoonGaewun.elGaewun.colors },
                  { label:"방향", val:daewoonGaewun.elGaewun.direction },
                  { label:"숫자", val:daewoonGaewun.elGaewun.numbers },
                  { label:"건강", val:daewoonGaewun.elGaewun.healthTip },
                  { label:"음식", val:daewoonGaewun.elGaewun.food },
                  { label:"활동", val:daewoonGaewun.elGaewun.activity },
                ].map(r => (
                  <div key={r.label} className="rounded-xl px-3 py-2" style={{ background:"rgba(0,0,0,0.2)" }}>
                    <p className="text-[9px] text-gray-500 mb-0.5">{r.label}</p>
                    <p className="text-white font-semibold leading-tight">{r.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ④ 오행 개운법 */}
        {(dominant.length > 0 || lacking.length > 0) && (
          <section className="mb-8">
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-base font-black text-white">오행 개운법</h2>
              <span className="text-xs text-gray-600">과다·부족 오행 맞춤</span>
            </div>

            <div className="space-y-4">
              {dominant.map(el => {
                const d = ELEMENT_GAEWUN[el];
                if (!d) return null;
                return (
                  <div key={el} className="rounded-2xl overflow-hidden" style={{ border:`1px solid ${d.color}30` }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ background:`${d.color}15` }}>
                      <p className="font-black text-white">{d.label} 과다</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">억제 필요</span>
                    </div>
                    <div className="px-4 py-3 space-y-2" style={{ background:"rgba(0,0,0,0.2)" }}>
                      <p className="text-xs text-gray-400">반대 기운으로 균형 맞추기 — 색상 {d.colors}보다 상극 오행 색을 활용, 활동: {d.activity}</p>
                      <p className="text-xs text-gray-400">건강: {d.healthTip}</p>
                    </div>
                  </div>
                );
              })}

              {lacking.map(el => {
                const d = ELEMENT_GAEWUN[el];
                if (!d) return null;
                return (
                  <div key={el} className="rounded-2xl overflow-hidden" style={{ border:`1px solid ${d.color}30` }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ background:`${d.color}15` }}>
                      <p className="font-black text-white">{d.label} 부족</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">보충 필요</span>
                    </div>
                    <div className="px-4 py-3" style={{ background:"rgba(0,0,0,0.2)" }}>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label:"색상", val:d.colors },
                          { label:"방향", val:d.direction },
                          { label:"숫자", val:d.numbers },
                          { label:"아이템", val:d.items },
                          { label:"음식", val:d.food },
                          { label:"건강", val:d.healthTip },
                        ].map(r => (
                          <div key={r.label} className="rounded-xl px-3 py-2" style={{ background:"rgba(255,255,255,0.04)" }}>
                            <p className="text-[9px] text-gray-500 mb-0.5">{r.label}</p>
                            <p className="text-white font-semibold leading-tight">{r.val}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">활동: {d.activity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ⑤ 나에게 맞는 개운 오행 — 용신 기준 */}
        {primaryGaewunEl && (
          <section className="mb-8">
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-base font-black text-white">나에게 맞는 기운</h2>
              <span className="text-xs text-gray-600">용신 {gaewunEl}(
              {primaryGaewunEl.label}) 기준</span>
            </div>
            <div className="rounded-2xl p-5" style={{ background:`${primaryGaewunEl.color}0d`, border:`1px solid ${primaryGaewunEl.color}30` }}>
              <p className="text-sm font-black mb-4" style={{ color:primaryGaewunEl.color }}>{primaryGaewunEl.label} 기운을 가까이 하면 운이 열려요</p>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {[
                  { label:"행운 색상", val:primaryGaewunEl.colors },
                  { label:"행운 방향", val:primaryGaewunEl.direction },
                  { label:"행운 숫자", val:primaryGaewunEl.numbers },
                  { label:"행운 아이템", val:primaryGaewunEl.items },
                  { label:"행운 음식", val:primaryGaewunEl.food },
                  { label:"건강 팁", val:primaryGaewunEl.healthTip },
                ].map(r => (
                  <div key={r.label} className="rounded-xl px-3 py-2.5" style={{ background:"rgba(255,255,255,0.05)" }}>
                    <p className="text-[10px] text-gray-500 mb-0.5">{r.label}</p>
                    <p className="text-white font-bold">{r.val}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background:"rgba(255,255,255,0.04)" }}>
                <p className="text-[10px] text-gray-500 mb-1">추천 활동</p>
                <p className="text-xs text-gray-200">{primaryGaewunEl.activity}</p>
              </div>
            </div>
          </section>
        )}

        {dominant.includes("토") && (
          <div className="rounded-2xl p-5 mb-6" style={{ background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)" }}>
            <p className="text-sm font-black text-amber-300 mb-2">토(土) 과다 사주 — 악세서리 개운법</p>
            <p className="text-xs leading-relaxed text-gray-300">
              토 기운이 강한 사주는 반지·귀걸이·팔찌·목걸이 같은 금속 장신구를 착용하면 그 기운이 순환돼요. 착용 습관을 들이면 기운이 안정되고 재물 흐름이 부드러워져요.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-gray-700 mb-4">본 분석은 사주 이론 기반 오락용 콘텐츠예요.</p>
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
