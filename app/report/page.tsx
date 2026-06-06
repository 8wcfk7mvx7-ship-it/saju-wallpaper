"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ILJU_60, SINGANG_TRAITS, OHAENG_HEALTH, OHAENG_CAREER } from "@/lib/saju";

// ── 상수 및 타입 ────────────────────────────────────────────────────────────
const CG_ELEMENT: Record<string, string> = {
  갑:"목",을:"목",병:"화",정:"화",무:"토",기:"토",경:"금",신:"금",임:"수",계:"수",
};
const CG_HANJA: Record<string, string> = {
  갑:"甲",을:"乙",병:"丙",정:"丁",무:"戊",기:"己",경:"庚",신:"辛",임:"壬",계:"癸",
};
const JJ_HANJA: Record<string, string> = {
  자:"子",축:"丑",인:"寅",묘:"卯",진:"辰",사:"巳",오:"午",미:"未",신:"申",유:"酉",술:"戌",해:"亥",
};
const EL_COLOR: Record<string, string> = {
  목:"#4ade80",화:"#f87171",토:"#d4a373",금:"#e2e8f0",수:"#7dd3fc",
};
const EL_EMOJI: Record<string, string> = { 목:"🌿",화:"🔥",토:"🌍",금:"⚡",수:"💧" };
const EL_HANJA: Record<string, string> = { 목:"木",화:"火",토:"土",금:"金",수:"水" };
const SS_COLOR: Record<string, string> = {
  비견:"#cbd5e1",겁재:"#94a3b8",식신:"#fb923c",상관:"#f97316",
  편재:"#34d399",정재:"#10b981",편관:"#f87171",정관:"#ef4444",
  편인:"#a5b4fc",정인:"#818cf8",
};
const JIJANGAN_DISP: Record<string, Array<{stem:string;role:string}>> = {
  자:[{stem:"임",role:"여기"},{stem:"계",role:"정기"}],
  축:[{stem:"계",role:"여기"},{stem:"신",role:"중기"},{stem:"기",role:"정기"}],
  인:[{stem:"무",role:"여기"},{stem:"병",role:"중기"},{stem:"갑",role:"정기"}],
  묘:[{stem:"갑",role:"여기"},{stem:"을",role:"정기"}],
  진:[{stem:"을",role:"여기"},{stem:"계",role:"중기"},{stem:"무",role:"정기"}],
  사:[{stem:"무",role:"여기"},{stem:"경",role:"중기"},{stem:"병",role:"정기"}],
  오:[{stem:"병",role:"여기"},{stem:"기",role:"중기"},{stem:"정",role:"정기"}],
  미:[{stem:"정",role:"여기"},{stem:"을",role:"중기"},{stem:"기",role:"정기"}],
  신:[{stem:"무",role:"여기"},{stem:"임",role:"중기"},{stem:"경",role:"정기"}],
  유:[{stem:"경",role:"여기"},{stem:"신",role:"정기"}],
  술:[{stem:"신",role:"여기"},{stem:"정",role:"중기"},{stem:"무",role:"정기"}],
  해:[{stem:"무",role:"여기"},{stem:"갑",role:"중기"},{stem:"임",role:"정기"}],
};

// 합/충/형/파/해
const CHEONGAN_HAP = [
  {stems:["갑","기"],result:"토",ko:"갑기합토"},{stems:["을","경"],result:"금",ko:"을경합금"},
  {stems:["병","신"],result:"수",ko:"병신합수"},{stems:["정","임"],result:"목",ko:"정임합목"},
  {stems:["무","계"],result:"화",ko:"무계합화"},
];
const YUKHAM = [
  {branches:["자","축"],result:"토",ko:"자축합토"},{branches:["인","해"],result:"목",ko:"인해합목"},
  {branches:["묘","술"],result:"화",ko:"묘술합화"},{branches:["진","유"],result:"금",ko:"진유합금"},
  {branches:["사","신"],result:"수",ko:"사신합수"},{branches:["오","미"],result:"토",ko:"오미합토"},
];
const SAMHAP = [
  {branches:["인","오","술"],result:"화",ko:"인오술 삼합화"},
  {branches:["해","묘","미"],result:"목",ko:"해묘미 삼합목"},
  {branches:["신","자","진"],result:"수",ko:"신자진 삼합수"},
  {branches:["사","유","축"],result:"금",ko:"사유축 삼합금"},
];
const BANGHAP = [
  {branches:["인","묘","진"],result:"목",ko:"인묘진 방합목"},
  {branches:["사","오","미"],result:"화",ko:"사오미 방합화"},
  {branches:["신","유","술"],result:"금",ko:"신유술 방합금"},
  {branches:["해","자","축"],result:"수",ko:"해자축 방합수"},
];
const CHUNG = [
  {branches:["자","오"],ko:"자오충"},{branches:["축","미"],ko:"축미충"},
  {branches:["인","신"],ko:"인신충"},{branches:["묘","유"],ko:"묘유충"},
  {branches:["진","술"],ko:"진술충"},{branches:["사","해"],ko:"사해충"},
];
const CG_CHUNG = [
  {stems:["갑","경"],ko:"갑경충"},{stems:["을","신"],ko:"을신충"},
  {stems:["병","임"],ko:"병임충"},{stems:["정","계"],ko:"정계충"},
];
const HYEONG = [
  {branches:["인","사","신"],type:"삼형",ko:"인사신 삼형"},
  {branches:["축","술","미"],type:"삼형",ko:"축술미 삼형"},
  {branches:["자","묘"],type:"이형",ko:"자묘형"},
];
const HAE = [
  {branches:["자","미"],ko:"자미해"},{branches:["축","오"],ko:"축오해"},
  {branches:["인","사"],ko:"인사해"},{branches:["묘","진"],ko:"묘진해"},
  {branches:["신","해"],ko:"신해해"},{branches:["유","술"],ko:"유술해"},
];
const PA = [
  {branches:["자","유"],ko:"자유파"},{branches:["오","묘"],ko:"오묘파"},
  {branches:["사","신"],ko:"사신파"},{branches:["인","해"],ko:"인해파"},
  {branches:["축","진"],ko:"축진파"},{branches:["술","미"],ko:"술미파"},
];

// 일간별 특성 테이블
const ILGAN_PROFILE: Record<string, {
  symbol:string; element:string; nature:string; personality:string;
  strength:string; weakness:string; jobs:string; health:string;
}> = {
  갑:{symbol:"큰 나무 (大木)",element:"양목(陽木)",nature:"강직·도전·리더십",
    personality:"크고 곧은 나무처럼 한 방향으로 뻗어 나가는 강한 추진력과 리더십을 지닙니다. 고집이 있지만 정의감이 강하고, 새로운 일에 선구자적으로 뛰어들며 주변을 이끄는 힘이 있습니다.",
    strength:"도전정신·리더십·정의감·추진력·독립심",weakness:"고집·융통성 부족·타협 어려움·완고함",
    jobs:"경영자, 정치인, 의사, 군인, 스포츠 선수, 건축가, 외과의",
    health:"간(肝)·담낭, 눈, 근육, 신경계 주의"},
  을:{symbol:"풀꽃 (小木)",element:"음목(陰木)",nature:"유연·적응·친화력",
    personality:"바람에 흔들려도 꺾이지 않는 풀처럼 유연하고 적응력이 뛰어납니다. 섬세한 감수성과 예술적 감각이 있으며, 사람과 사람 사이를 부드럽게 연결하는 능력이 탁월합니다.",
    strength:"적응력·친화력·예술감각·섬세함·공감능력",weakness:"우유부단·자기주장 약함·눈치 과다·의존성",
    jobs:"예술가, 디자이너, 상담사, 교육자, 플로리스트, 작가, 뷰티/패션",
    health:"간·담낭, 눈, 손발 저림, 자율신경 주의"},
  병:{symbol:"태양 (大火)",element:"양화(陽火)",nature:"열정·표현·사교성",
    personality:"태양처럼 밝고 강렬한 에너지로 주변을 따뜻하게 비춥니다. 표현력과 사교성이 뛰어나 어디서든 분위기를 주도하고, 열정적이고 낙관적인 성격으로 사람들에게 활기를 줍니다.",
    strength:"열정·사교성·표현력·낙관주의·추진력",weakness:"충동적·과장·자기중심·끈기 부족",
    jobs:"연예인, 방송인, 강사, 영업직, 정치인, 이벤트기획, 광고",
    health:"심장·소장, 혈압, 안구건조, 피부열 주의"},
  정:{symbol:"촛불 (小火)",element:"음화(陰火)",nature:"섬세·직관·예의",
    personality:"촛불처럼 은은하고 따뜻한 빛을 발합니다. 직관력과 공감 능력이 뛰어나고, 예의 바르고 섬세한 감성으로 깊은 인간관계를 형성합니다. 예술적 재능이 있습니다.",
    strength:"직관력·섬세함·예의·공감력·예술성",weakness:"감정 기복·예민함·지나친 걱정·내성적",
    jobs:"상담사, 작가, 예술가, 디자이너, 교육자, 의료인, 심리치료사",
    health:"심장·소장, 불면증, 우울감, 혈액순환 주의"},
  무:{symbol:"산·대지 (大土)",element:"양토(陽土)",nature:"포용·신의·안정",
    personality:"높은 산처럼 묵직하고 포용력이 큽니다. 믿음직스럽고 의리가 강해 주변 사람들의 든든한 버팀목이 됩니다. 한번 신뢰를 쌓으면 오래 지속되는 깊은 관계를 만들어갑니다.",
    strength:"포용력·신의·안정감·인내심·책임감",weakness:"변화 거부·느린 결단·고집·수동적",
    jobs:"공무원, 부동산, 농업, 교육자, 건설업, 경영관리, 의사",
    health:"비장·위장, 소화기, 관절, 피부 주의"},
  기:{symbol:"논밭 (小土)",element:"음토(陰土)",nature:"실용·세심·중재",
    personality:"기름진 논밭처럼 실용적이고 세심합니다. 사람들 사이에서 중재자 역할을 잘 하며, 작은 것도 놓치지 않는 꼼꼼함과 현실적인 감각으로 안정적인 성과를 만들어냅니다.",
    strength:"세심함·실용성·중재능력·꼼꼼함·현실감각",weakness:"소심함·걱정과다·우유부단·보수적",
    jobs:"회계사, 행정직, 요리사, 영양사, 의료보조직, 중소기업, 관리직",
    health:"비장·위장, 소화불량, 당뇨, 피부 주의"},
  경:{symbol:"바위·쇠 (大金)",element:"양금(陽金)",nature:"강직·결단·원칙",
    personality:"단단한 바위나 쇠처럼 강인하고 원칙을 중요시합니다. 결단력이 탁월하고 정의감이 강하며, 한번 결정한 일은 끝까지 밀어붙이는 불굴의 의지를 지닙니다.",
    strength:"결단력·강직함·원칙주의·의지력·정의감",weakness:"냉정함·고집·타협 어려움·융통성 부족",
    jobs:"군인, 경찰, 외과의, 엔지니어, 철강업, 법조인, 무역",
    health:"폐·대장, 피부, 치아, 뼈 주의"},
  신:{symbol:"보석·칼날 (小金)",element:"음금(陰金)",nature:"예민·완벽·심미안",
    personality:"정교하게 다듬어진 보석처럼 뛰어난 심미안과 완벽주의적 성향을 지닙니다. 예민하고 섬세한 감각으로 예술과 기술 분야에서 탁월한 능력을 발휘합니다.",
    strength:"완벽주의·심미안·예민함·분석력·기술적 재능",weakness:"예민함·비판적·완벽주의로 인한 스트레스·소심",
    jobs:"보석세공사, 의사, 치과의, 예술가, 패션디자이너, 애널리스트",
    health:"폐·대장, 피부, 알레르기, 호흡기 주의"},
  임:{symbol:"큰 강·바다 (大水)",element:"양수(陽水)",nature:"지혜·포용·자유",
    personality:"크고 깊은 강처럼 지혜롭고 자유로운 정신을 지닙니다. 폭넓은 식견과 포용력으로 다양한 분야를 넘나들며, 창의적인 사고와 강한 기획력을 발휘합니다.",
    strength:"지혜·기획력·창의성·포용력·자유로움",weakness:"변덕·끈기 부족·현실감 부족·방랑기",
    jobs:"기획자, 작가, 연구원, 예술가, 여행업, IT, 철학자, 심리학자",
    health:"신장·방광, 귀, 허리, 생식기 주의"},
  계:{symbol:"빗물·이슬 (小水)",element:"음수(陰水)",nature:"감수성·직관·은밀",
    personality:"가늘고 섬세하게 스며드는 빗물처럼 깊은 감수성과 직관력을 지닙니다. 은밀하고 내성적이지만 한번 신뢰가 쌓이면 깊은 충성심을 보여주며, 뛰어난 분석력으로 복잡한 문제를 해결합니다.",
    strength:"감수성·직관력·분석력·충성심·세심함",weakness:"내성적·의심많음·폐쇄적·자기비하",
    jobs:"연구원, 상담사, 심리학자, 작가, 의사, 데이터분석가, 철학자",
    health:"신장·방광, 귀, 관절, 냉증 주의"},
};

// 오행별 직업·색상·방향·음식 조언
const ELEMENT_BOOST: Record<string, {
  color:string; direction:string; food:string; jobs:string; material:string; tip:string;
}> = {
  목:{color:"초록·녹색·파란 계열",direction:"동쪽(東)",food:"신맛(식초, 레몬, 녹차), 채소류",
    jobs:"교육, 의료, 출판, 원예, 목공, 패션, 환경",
    material:"나무, 식물, 대나무, 천연소재",
    tip:"초록 식물을 책상에 두거나 초록색 계열 소품으로 환경을 꾸미세요. 매일 산책이나 자연 감상으로 목의 기운을 보충하세요."},
  화:{color:"빨강·주황·보라 계열",direction:"남쪽(南)",food:"쓴맛(커피, 쑥, 쓴 채소류), 붉은 채소/과일",
    jobs:"예술, 방송, 교육, 마케팅, 광고, 요식업, 미용",
    material:"촛불, 조명, 붉은 소품",
    tip:"따뜻하고 밝은 조명을 활용하고 붉은색 소품이나 의상을 더하세요. 명랑한 사람들과의 교류가 화의 기운을 높입니다."},
  토:{color:"황토·베이지·갈색 계열",direction:"중앙(中)",food:"단맛(고구마, 단호박, 꿀, 대추), 노란 음식",
    jobs:"부동산, 농업, 건설, 금융, 요식업, 행정",
    material:"도자기, 황토, 돌, 흙 소품",
    tip:"베이지·황토색 인테리어로 공간을 안정감 있게 꾸미세요. 규칙적인 생활 패턴과 정리정돈이 토의 기운을 강화합니다."},
  금:{color:"흰색·은색·금색 계열",direction:"서쪽(西)",food:"매운맛(고추, 생강, 마늘, 무), 흰 음식",
    jobs:"금융, 법조, 군경, 의료, 기계, 제조업, 보석",
    material:"금속, 철재, 은/금 소품",
    tip:"흰색이나 금속성 소품으로 공간에 질서를 부여하세요. 명확한 목표설정과 계획표 작성이 금의 기운을 도웁니다."},
  수:{color:"검정·남색·파란 계열",direction:"북쪽(北)",food:"짠맛(소금, 간장, 해조류), 검은 음식",
    jobs:"연구, IT, 철학, 심리, 수산업, 무역, 여행업",
    material:"물, 유리, 거울, 수변 이미지",
    tip:"파란색·남색 계열의 물이나 밤하늘 이미지를 활용하세요. 독서와 명상, 물가 산책이 수의 기운을 채워줍니다."},
};

// 십성 해설
const SIPSEONG_DESC: Record<string, {symbol:string; meaning:string; positive:string; negative:string}> = {
  비견:{symbol:"比肩",meaning:"나와 같은 오행, 형제·동료·경쟁자",
    positive:"독립심, 승부욕, 자존감, 팀워크",negative:"고집, 경쟁심 과다, 나눔 부족"},
  겁재:{symbol:"劫財",meaning:"나와 같은 오행(음양 반대), 경쟁자·탈취",
    positive:"추진력, 행동력, 승부욕",negative:"재물 손실, 충동적, 경쟁 과다"},
  식신:{symbol:"食神",meaning:"내가 생하는 오행(같은 음양), 표현·자식",
    positive:"표현력, 창의성, 여유, 식복, 자식운",negative:"게으름, 안일함, 의존"},
  상관:{symbol:"傷官",meaning:"내가 생하는 오행(다른 음양), 재능·반항",
    positive:"재능, 표현력, 예술성, 자유로움",negative:"반항심, 관재수, 관계갈등"},
  편재:{symbol:"偏財",meaning:"내가 극하는 오행(같은 음양), 편재·투기",
    positive:"사업수완, 투자력, 활동성, 재물운",negative:"투기, 변동성, 불안정"},
  정재:{symbol:"正財",meaning:"내가 극하는 오행(다른 음양), 정재·노력",
    positive:"성실함, 안정된 재물, 신용, 저축",negative:"보수적, 융통성 부족, 지나친 절약"},
  편관:{symbol:"偏官",meaning:"나를 극하는 오행(같은 음양), 편관·권력",
    positive:"권위, 리더십, 추진력, 직업운",negative:"스트레스, 갈등, 법적 문제"},
  정관:{symbol:"正官",meaning:"나를 극하는 오행(다른 음양), 정관·명예",
    positive:"명예, 규율, 직업, 자녀운(여자)",negative:"완고함, 책임 과부하"},
  편인:{symbol:"偏印",meaning:"나를 생하는 오행(같은 음양), 편인·학문",
    positive:"직관, 학문, 예술, 종교, 특수능력",negative:"편편함, 의심, 고독"},
  정인:{symbol:"正印",meaning:"나를 생하는 오행(다른 음양), 정인·학문",
    positive:"학문, 인내, 자애, 명예, 귀인운",negative:"의존성, 수동적, 결단력 부족"},
};

function PillarBox({label, cg, jj, sipseongCg, sipseongJj, uunseong, isDay=false}:{
  label:string;cg:string;jj:string;sipseongCg?:string;sipseongJj?:string;uunseong?:string;isDay?:boolean;
}) {
  const cgEl = CG_ELEMENT[cg] || "";
  const jja = JIJANGAN_DISP[jj] || [];
  const bongi = jja.find(h=>h.role==="정기")?.stem||"";
  const jjEl = bongi ? CG_ELEMENT[bongi] : "";
  return (
    <div style={{
      border:`2px solid ${isDay?"#6366f1":"#334155"}`,
      borderRadius:8,textAlign:"center",overflow:"hidden",
      background:isDay?"rgba(99,102,241,0.08)":"rgba(255,255,255,0.03)",
      minWidth:70,
    }}>
      <div style={{background:isDay?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.05)",
        padding:"4px 0",fontSize:11,fontWeight:600,color:isDay?"#a5b4fc":"#64748b",
        letterSpacing:"0.1em"}}>
        {label}
      </div>
      {sipseongCg && <div style={{fontSize:10,color:SS_COLOR[sipseongCg]||"#64748b",padding:"4px 0 0",minHeight:18}}>{sipseongCg}</div>}
      <div style={{fontSize:36,fontWeight:700,lineHeight:1.1,color:EL_COLOR[cgEl]||"#e2e8f0",padding:"4px 0 0"}}>{cg}</div>
      <div style={{fontSize:13,opacity:0.5,color:EL_COLOR[cgEl]||"#e2e8f0"}}>{CG_HANJA[cg]}</div>
      <div style={{fontSize:10,color:EL_COLOR[cgEl]||"#e2e8f0",opacity:0.7,marginBottom:4}}>{cgEl}</div>
      <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:4}}>
        {sipseongJj && <div style={{fontSize:10,color:SS_COLOR[sipseongJj]||"#64748b",minHeight:18}}>{sipseongJj}</div>}
        <div style={{fontSize:36,fontWeight:700,lineHeight:1.1,color:EL_COLOR[jjEl]||"#c4b5fd"}}>{jj}</div>
        <div style={{fontSize:13,opacity:0.5,color:EL_COLOR[jjEl]||"#c4b5fd"}}>{JJ_HANJA[jj]}</div>
        <div style={{fontSize:10,color:EL_COLOR[jjEl]||"#c4b5fd",opacity:0.7}}>{jjEl}</div>
      </div>
      <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"4px 2px"}}>
        <div style={{display:"flex",justifyContent:"center",gap:2,marginBottom:2}}>
          {jja.map((item,i)=>{
            const el=CG_ELEMENT[item.stem]||"";
            return <span key={i} style={{fontSize:11,fontWeight:700,
              color:EL_COLOR[el]||"#4b5563",opacity:item.role==="정기"?1:0.55}}>{item.stem}</span>;
          })}
        </div>
        {uunseong && <div style={{fontSize:10,color:"#94a3b8"}}>{uunseong}</div>}
      </div>
    </div>
  );
}

function ScoreBar({label,emoji,score,max,color,note}:{label:string;emoji:string;score:number;max:number;color:string;note?:string}) {
  const pct = Math.min(100,(score/max)*100);
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
      <div style={{width:60,display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
        <span>{emoji}</span>
        <span style={{color,fontSize:13,fontWeight:700}}>{label}</span>
      </div>
      <div style={{flex:1,background:"rgba(255,255,255,0.08)",borderRadius:99,height:12,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:12,borderRadius:99,background:color,transition:"width 0.5s"}}/>
      </div>
      <div style={{width:80,textAlign:"right",flexShrink:0}}>
        <span style={{fontSize:12,color:"#94a3b8"}}>{score.toFixed(1)}</span>
        {note && <span style={{fontSize:11,marginLeft:4,color:note==="부족"?"#f87171":note==="과다"?"#fbbf24":"#94a3b8"}}>{note}</span>}
      </div>
    </div>
  );
}

function SectionHeader({n,title,color="#6366f1"}:{n:number;title:string;color?:string}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:color,
        display:"flex",alignItems:"center",justifyContent:"center",
        color:"#fff",fontWeight:700,fontSize:16,flexShrink:0}}>
        {n}
      </div>
      <h2 style={{margin:0,fontSize:18,fontWeight:700,color:"#e2e8f0"}}>{title}</h2>
    </div>
  );
}

// A4 페이지 컴포넌트
function Page({children,pageNum,totalPages=10}:{children:React.ReactNode;pageNum:number;totalPages?:number}) {
  return (
    <div className="report-page" style={{
      width:"210mm",minHeight:"297mm",
      background:"#0d0d1a",color:"#e2e8f0",
      padding:"18mm 16mm",boxSizing:"border-box",
      position:"relative",pageBreakAfter:"always",
      fontFamily:"'Noto Sans KR', 'Malgun Gothic', sans-serif",
    }}>
      {children}
      {/* 페이지 하단 */}
      <div style={{position:"absolute",bottom:"12mm",left:"16mm",right:"16mm",
        display:"flex",justifyContent:"space-between",alignItems:"center",
        borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:8}}>
        <span style={{fontSize:10,color:"#475569"}}>사주팔자 상세 분석 보고서 · SajuWallpaper</span>
        <span style={{fontSize:10,color:"#475569"}}>{pageNum} / {totalPages}</span>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function ReportPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [locked, setLocked] = useState(false);
  const [aiContent, setAiContent] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = sessionStorage.getItem("sajuResult");
    const formRaw = sessionStorage.getItem("sajuForm");
    if (!raw) { router.push("/"); return; }
    const parsed = JSON.parse(raw);
    const f = formRaw ? JSON.parse(formRaw) : {};
    setData(parsed);
    setForm(f);
    // 결제 확인: paymentDone 플래그 또는 report/bundle 상품 (개발 중 preview)
    const paid = sessionStorage.getItem("paymentDone") === "true";
    const pt = f.productType || "mobile";
    if (!paid && pt === "mobile") setLocked(true);
    // AI 생성 보고서 텍스트 로드
    try {
      const aiRaw = sessionStorage.getItem("aiReportContent");
      if (aiRaw) setAiContent(JSON.parse(aiRaw));
    } catch {}
  }, [router]);

  if (!data || !form) return null;

  const { sajuResult } = data;
  const scores: Record<string,number> = sajuResult.scores || {};
  const raw: Record<string,number> = sajuResult.rawScores || scores;
  const det = sajuResult.pillarsDetail || {};
  const pillarsRaw: string[] = (sajuResult.fourPillars || "").split(" ").filter(Boolean);
  // pillarsRaw: [시, 일, 월, 연] 순서
  const stems = pillarsRaw.map((p:string)=>p[0]).filter(Boolean);
  const branches = pillarsRaw.map((p:string)=>p[1]).filter(Boolean);

  const elements = ["목","화","토","금","수"];
  const maxScore = Math.max(...elements.map(e=>scores[e]||0),1);
  const sorted = [...elements].sort((a,b)=>(scores[a]||0)-(scores[b]||0));
  const lacking = sorted.slice(0,2).filter(e=>(scores[e]||0)<=2.5);
  const excess = sorted.slice(-2).filter(e=>(scores[e]||0)>=3.5);
  const dayCg = det.day?.cg || "";
  const dayJj = det.day?.jj || "";
  const iljuInfo = ILJU_60[dayCg + dayJj] || null;
  const profile = ILGAN_PROFILE[dayCg] || null;
  const yong = sajuResult.yongshin;
  const sinsalList: any[] = sajuResult.sinsalList || [];

  // 합/충/형 감지
  const cgHap = CHEONGAN_HAP.filter(r=>stems.includes(r.stems[0])&&stems.includes(r.stems[1]));
  const yukhap = YUKHAM.filter(r=>branches.includes(r.branches[0])&&branches.includes(r.branches[1]));
  const samhap = SAMHAP.map(r=>({...r,cnt:r.branches.filter(b=>branches.includes(b)).length})).filter(r=>r.cnt>=2);
  const banghap = BANGHAP.map(r=>({...r,cnt:r.branches.filter(b=>branches.includes(b)).length})).filter(r=>r.cnt>=3);
  const chung = CHUNG.filter(r=>branches.includes(r.branches[0])&&branches.includes(r.branches[1]));
  const cgChung = CG_CHUNG.filter(r=>stems.includes(r.stems[0])&&stems.includes(r.stems[1]));
  const hyeong = HYEONG.map(r=>({...r,cnt:r.branches.filter(b=>branches.includes(b)).length})).filter(r=>r.type==="이형"?r.cnt>=2:r.cnt>=3);
  const hae = HAE.filter(r=>branches.includes(r.branches[0])&&branches.includes(r.branches[1]));
  const pa = PA.filter(r=>branches.includes(r.branches[0])&&branches.includes(r.branches[1]));

  // 십성 분포
  const allSS: string[] = [];
  (["year","month","day","hour"] as const).forEach(k=>{
    const d=(det as any)[k];
    if(d){allSS.push(d.sipseongCg,d.sipseongJj);}
  });
  const ssCounts: Record<string,number>={};
  allSS.filter(Boolean).forEach(s=>{ ssCounts[s]=(ssCounts[s]||0)+1; });

  const name = form.name || "";
  const birthPlace = form.birthPlace || "";
  const gender = form.gender === "male" ? "남" : "여";
  const today = new Date();
  const todayStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;

  // 생년월일 문자열
  const bdStr = `${form.birthYear}년 ${form.birthMonth}월 ${form.birthDay}일` +
    (form.birthHour != null ? ` ${form.birthHour}시` : "") +
    (form.birthMinute != null ? ` ${form.birthMinute}분` : "");

  if (locked) {
    return (
      <main style={{minHeight:"100vh",background:"#080810",color:"#e2e8f0",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
        <div style={{fontSize:48,marginBottom:16}}>🔒</div>
        <h1 style={{fontSize:22,fontWeight:700,marginBottom:8,textAlign:"center"}}>상세 보고서는 결제 후 열람 가능합니다</h1>
        <p style={{color:"#64748b",marginBottom:24,textAlign:"center"}}>
          상세 보고서 또는 패키지 상품을 구매하시면<br/>10페이지 분량의 심층 사주 분석 보고서를 받으실 수 있습니다.
        </p>
        <button onClick={()=>router.push("/result")} style={{
          background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
          color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",
          fontSize:15,fontWeight:700,cursor:"pointer"}}>
          ← 결과 페이지로 돌아가기
        </button>
      </main>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
        body { margin:0; background:#040408; }
        .report-page { display:block; }
        .print-btn {
          position:fixed;top:20px;right:20px;z-index:999;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          color:#fff;border:none;border-radius:12px;
          padding:12px 24px;font-size:14px;font-weight:700;cursor:pointer;
          box-shadow:0 4px 20px rgba(99,102,241,0.4);
        }
        .back-btn {
          position:fixed;top:20px;left:20px;z-index:999;
          background:rgba(255,255,255,0.08);
          color:#94a3b8;border:1px solid rgba(255,255,255,0.12);borderRadius:12px;
          padding:10px 18px;font-size:13px;cursor:pointer;border-radius:12px;
        }
        @media print {
          .print-btn,.back-btn { display:none !important; }
          body { background:#fff !important; }
          .report-page {
            background:#fff !important;
            color:#1a1a2e !important;
            page-break-after:always;
            width:210mm !important;
            min-height:297mm !important;
          }
        }
      `}</style>

      <button className="print-btn" onClick={()=>window.print()}>📄 PDF 저장</button>
      <button className="back-btn" onClick={()=>router.push("/result")}>← 결과로</button>

      {/* ─── Page 1: 표지 ─── */}
      <Page pageNum={1}>
        <div style={{textAlign:"center",paddingTop:"10mm"}}>
          <div style={{fontSize:52,marginBottom:16}}>🔮</div>
          <div style={{fontSize:11,letterSpacing:"0.3em",color:"#6366f1",marginBottom:8,fontWeight:600}}>
            SAJU WALLPAPER · 사주팔자 상세 분석
          </div>
          <h1 style={{fontSize:28,fontWeight:700,margin:"0 0 6px",
            background:"linear-gradient(135deg,#a5b4fc,#e879f9)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            {name}님의 사주 분석 보고서
          </h1>
          <p style={{color:"#64748b",fontSize:13,margin:"0 0 32px"}}>발행일: {todayStr}</p>

          {/* 기본 정보 */}
          <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",
            borderRadius:16,padding:"20px 32px",display:"inline-block",marginBottom:32,textAlign:"left",minWidth:280}}>
            <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"8px 16px",fontSize:13}}>
              <span style={{color:"#6366f1",fontWeight:600}}>이름</span><span>{name}</span>
              <span style={{color:"#6366f1",fontWeight:600}}>생년월일</span><span>{bdStr}</span>
              <span style={{color:"#6366f1",fontWeight:600}}>성별</span><span>{gender}성</span>
              {birthPlace && <><span style={{color:"#6366f1",fontWeight:600}}>출생지</span><span>{birthPlace}</span></>}
            </div>
          </div>

          {/* 사주팔자 4기둥 */}
          <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:32}}>
            {[
              {label:"시주",d:det.hour,key:"hour"},
              {label:"일주",d:det.day,key:"day"},
              {label:"월주",d:det.month,key:"month"},
              {label:"연주",d:det.year,key:"year"},
            ].map(({label,d,key})=>
              d ? <PillarBox key={key} label={label} cg={d.cg} jj={d.jj}
                sipseongCg={d.sipseongCg} sipseongJj={d.sipseongJj}
                uunseong={d.uunseong} isDay={key==="day"}/> :
              <div key={key} style={{minWidth:70,border:"1px solid #1e293b",borderRadius:8,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#334155",fontSize:12,padding:"40px 0"}}>{label}</div>
            )}
          </div>

          {/* 오행 차트 */}
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:16,padding:"20px 24px",textAlign:"left"}}>
            <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:600,color:"#94a3b8"}}>⚖️ 오행 점수 분포</h3>
            {elements.map(el=>{
              const s=scores[el]||0;
              const isL=lacking.includes(el);
              const isE=excess.includes(el);
              return <ScoreBar key={el} label={EL_HANJA[el]} emoji={EL_EMOJI[el]}
                score={s} max={maxScore} color={EL_COLOR[el]}
                note={isL?"부족":isE?"과다":undefined}/>;
            })}
          </div>

          {sajuResult.localTimeNote && (
            <p style={{marginTop:16,fontSize:11,color:"#4f46e5"}}>⏱ {sajuResult.localTimeNote}</p>
          )}
        </div>
      </Page>

      {/* ─── Page 2: 사주팔자 원국 상세 ─── */}
      <Page pageNum={2}>
        <SectionHeader n={1} title="사주팔자 원국 상세표" />
        <div style={{display:"flex",gap:12,marginBottom:24,justifyContent:"center"}}>
          {[
            {label:"시주(時柱)",d:det.hour,key:"hour"},
            {label:"일주(日柱)",d:det.day,key:"day"},
            {label:"월주(月柱)",d:det.month,key:"month"},
            {label:"연주(年柱)",d:det.year,key:"year"},
          ].map(({label,d,key})=>
            d ? <PillarBox key={key} label={label} cg={d.cg} jj={d.jj}
              sipseongCg={d.sipseongCg} sipseongJj={d.sipseongJj}
              uunseong={d.uunseong} isDay={key==="day"}/> :
            <div key={key} style={{minWidth:80,border:"1px dashed #334155",borderRadius:8,
              display:"flex",alignItems:"center",justifyContent:"center",color:"#334155",fontSize:12,padding:"40px 0"}}>미입력</div>
          )}
        </div>

        {/* 상세 테이블 */}
        <div style={{overflowX:"auto",marginBottom:20}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"rgba(99,102,241,0.15)"}}>
                {["구분","연주","월주","일주","시주"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"center",
                    border:"1px solid rgba(255,255,255,0.08)",color:"#a5b4fc",fontWeight:600}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {row:"천간(天干)", vals:[det.year?.cg,det.month?.cg,det.day?.cg,det.hour?.cg]},
                {row:"지지(地支)", vals:[det.year?.jj,det.month?.jj,det.day?.jj,det.hour?.jj]},
                {row:"천간 오행", vals:[det.year?.cg,det.month?.cg,det.day?.cg,det.hour?.cg].map(c=>c?CG_ELEMENT[c]:"")},
                {row:"십성(천간)", vals:[det.year?.sipseongCg,det.month?.sipseongCg,det.day?.sipseongCg,det.hour?.sipseongCg]},
                {row:"십성(지지)", vals:[det.year?.sipseongJj,det.month?.sipseongJj,det.day?.sipseongJj,det.hour?.sipseongJj]},
                {row:"12운성", vals:[det.year?.uunseong,det.month?.uunseong,det.day?.uunseong,det.hour?.uunseong]},
                {row:"지장간", vals:[det.year?.jijangan,det.month?.jijangan,det.day?.jijangan,det.hour?.jijangan]},
                {row:"신살", vals:[det.year?.sinsal,det.month?.sinsal,det.day?.sinsal,det.hour?.sinsal]},
              ].map(({row,vals},ri)=>(
                <tr key={ri} style={{background:ri%2===0?"transparent":"rgba(255,255,255,0.02)"}}>
                  <td style={{padding:"7px 10px",border:"1px solid rgba(255,255,255,0.06)",
                    color:"#94a3b8",fontWeight:600,whiteSpace:"nowrap"}}>{row}</td>
                  {vals.map((v,vi)=>(
                    <td key={vi} style={{padding:"7px 10px",textAlign:"center",
                      border:"1px solid rgba(255,255,255,0.06)",color:"#e2e8f0"}}>
                      {v||"—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 일주 설명 */}
        {profile && (
          <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",
            borderRadius:12,padding:"14px 18px",marginBottom:12}}>
            <div style={{fontWeight:700,color:"#a5b4fc",marginBottom:6,fontSize:14}}>
              ✦ 일간 — {dayCg}({profile.symbol})
            </div>
            <p style={{margin:0,fontSize:12,lineHeight:1.7,color:"#cbd5e1"}}>{profile.personality}</p>
          </div>
        )}

        {iljuInfo && (
          <div style={{background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.25)",
            borderRadius:12,padding:"14px 18px",marginBottom:12}}>
            <div style={{fontWeight:700,color:"#c4b5fd",marginBottom:8,fontSize:14}}>
              🔮 {dayCg}{dayJj}일주 60갑자 분석 — {iljuInfo.image}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
              <span style={{background:"rgba(139,92,246,0.2)",borderRadius:99,padding:"3px 10px",fontSize:11,color:"#c4b5fd",fontWeight:600}}>{iljuInfo.uunseong}</span>
              <span style={{background:"rgba(255,255,255,0.06)",borderRadius:99,padding:"3px 10px",fontSize:11,color:"#94a3b8"}}>{iljuInfo.keyword}</span>
            </div>
            <p style={{margin:"0 0 8px",fontSize:12,lineHeight:1.7,color:"#cbd5e1"}}>{iljuInfo.personality}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:11}}>
              <div style={{background:"rgba(244,63,94,0.08)",borderRadius:8,padding:"8px 10px"}}>
                <div style={{color:"#f87171",fontWeight:600,marginBottom:3}}>❤️ 연애</div>
                <div style={{color:"#fca5a5",lineHeight:1.6}}>{iljuInfo.love}</div>
              </div>
              <div style={{background:"rgba(245,158,11,0.08)",borderRadius:8,padding:"8px 10px"}}>
                <div style={{color:"#f59e0b",fontWeight:600,marginBottom:3}}>💼 직업</div>
                <div style={{color:"#fde68a",lineHeight:1.6}}>{iljuInfo.career}</div>
              </div>
            </div>
            <div style={{marginTop:8,background:"rgba(249,115,22,0.08)",borderRadius:8,padding:"8px 10px",fontSize:11}}>
              <span style={{color:"#fb923c",fontWeight:600}}>⚠️ 주의: </span>
              <span style={{color:"#fed7aa"}}>{iljuInfo.caution}</span>
            </div>
          </div>
        )}

        {sajuResult.localTimeNote && (
          <div style={{background:"rgba(79,70,229,0.1)",border:"1px solid rgba(79,70,229,0.25)",
            borderRadius:10,padding:"10px 14px"}}>
            <p style={{margin:0,fontSize:11,color:"#818cf8"}}>⏱ 진태양시 / 야자시·조자시 보정: {sajuResult.localTimeNote}</p>
          </div>
        )}
      </Page>

      {/* ─── Page 3: 오행 분석 ─── */}
      <Page pageNum={3}>
        <SectionHeader n={2} title="오행(五行) 분석" color="#10b981"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 18px"}}>
            <div style={{fontWeight:600,color:"#94a3b8",marginBottom:12,fontSize:13}}>보정 후 오행 점수</div>
            {elements.map(el=>{
              const s=scores[el]||0;
              const isL=lacking.includes(el);
              const isE=excess.includes(el);
              return <ScoreBar key={el} label={EL_HANJA[el]} emoji={EL_EMOJI[el]}
                score={s} max={maxScore} color={EL_COLOR[el]}
                note={isL?"부족":isE?"과다":undefined}/>;
            })}
          </div>
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 18px"}}>
            <div style={{fontWeight:600,color:"#94a3b8",marginBottom:12,fontSize:13}}>보정 전 원점수</div>
            {(() => {
              const rawMax = Math.max(...elements.map(e=>raw[e]||0),1);
              return elements.map(el=>(
                <ScoreBar key={el} label={EL_HANJA[el]} emoji={EL_EMOJI[el]}
                  score={raw[el]||0} max={rawMax} color={EL_COLOR[el]}/>
              ));
            })()}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {elements.map(el=>{
            const s=scores[el]||0;
            const isL=lacking.includes(el);
            const isE=excess.includes(el);
            const status=isL?"부족":isE?"과다":"균형";
            const statusColor=isL?"#f87171":isE?"#fbbf24":"#4ade80";
            const info=ELEMENT_BOOST[el];
            return (
              <div key={el} style={{background:"rgba(255,255,255,0.03)",
                border:`1px solid ${isL?"rgba(248,113,113,0.25)":isE?"rgba(251,191,36,0.25)":"rgba(255,255,255,0.07)"}`,
                borderRadius:10,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{fontSize:18}}>{EL_EMOJI[el]}</span>
                  <span style={{fontWeight:700,color:EL_COLOR[el],fontSize:14}}>{el}({EL_HANJA[el]})</span>
                  <span style={{marginLeft:"auto",fontSize:11,fontWeight:600,color:statusColor,
                    background:`${statusColor}22`,borderRadius:99,padding:"2px 8px"}}>{status}</span>
                </div>
                <p style={{margin:"0 0 6px",fontSize:11,lineHeight:1.6,color:"#94a3b8"}}>
                  {isL?"이 기운이 부족하면 "+el+"이 관장하는 영역에서 반복적 어려움이 생길 수 있습니다.":
                   isE?"이 기운이 과다하면 균형을 잃고 "+el+"의 부정적 측면이 나타날 수 있습니다.":
                   "이 기운이 균형 잡혀 있어 안정적입니다."}
                </p>
                <div style={{fontSize:11,color:"#64748b"}}>
                  <span style={{color:"#6366f1",fontWeight:600}}>보완: </span>{info.color}
                </div>
              </div>
            );
          })}
        </div>

        {lacking.length>0&&(
          <div style={{marginTop:16,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontWeight:700,color:"#a5b4fc",marginBottom:8,fontSize:13}}>💡 핵심 권장 사항</div>
            {lacking.map(el=>(
              <p key={el} style={{margin:"0 0 6px",fontSize:12,lineHeight:1.6,color:"#cbd5e1"}}>
                <strong style={{color:EL_COLOR[el]}}>{EL_EMOJI[el]} {el}({EL_HANJA[el]}) 보완:</strong> {ELEMENT_BOOST[el].tip}
              </p>
            ))}
          </div>
        )}
      </Page>

      {/* ─── Page 4: 신강/신약 & 용신/희신/기신 ─── */}
      <Page pageNum={4}>
        <SectionHeader n={3} title="신강·신약 분석 & 용신(用神)" color="#f59e0b"/>
        {yong ? (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
              <div style={{textAlign:"center",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:12,padding:"16px 8px"}}>
                <div style={{fontSize:11,color:"#6366f1",marginBottom:4,fontWeight:600}}>신강·신약 판정</div>
                <div style={{fontSize:22,fontWeight:700,color:yong.strength==="신강"?"#f87171":yong.strength==="신약"?"#7dd3fc":"#4ade80"}}>
                  {yong.strength}
                </div>
                <div style={{fontSize:11,color:"#64748b",marginTop:4}}>
                  {yong.strength==="신강"?"일간의 힘이 강함":yong.strength==="신약"?"일간의 힘이 약함":"균형 잡힌 상태"}
                </div>
              </div>
              <div style={{textAlign:"center",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:12,padding:"16px 8px"}}>
                <div style={{fontSize:11,color:"#10b981",marginBottom:4,fontWeight:600}}>용신 (用神)</div>
                <div style={{fontSize:22,fontWeight:700,color:EL_COLOR[yong.yongshin]||"#e2e8f0"}}>
                  {EL_EMOJI[yong.yongshin]} {yong.yongshin}
                </div>
                <div style={{fontSize:11,color:"#64748b",marginTop:4}}>사주 균형의 핵심 오행</div>
              </div>
              <div style={{textAlign:"center",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:12,padding:"16px 8px"}}>
                <div style={{fontSize:11,color:"#f59e0b",marginBottom:4,fontWeight:600}}>희신 (喜神)</div>
                <div style={{fontSize:22,fontWeight:700,color:EL_COLOR[yong.heeshin]||"#e2e8f0"}}>
                  {EL_EMOJI[yong.heeshin]} {yong.heeshin}
                </div>
                <div style={{fontSize:11,color:"#64748b",marginTop:4}}>용신을 도와주는 오행</div>
              </div>
            </div>

            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 18px",marginBottom:16}}>
              <div style={{fontWeight:600,color:"#e2e8f0",marginBottom:8,fontSize:14}}>📖 용신 분석 해설</div>
              <p style={{margin:0,fontSize:13,lineHeight:1.8,color:"#cbd5e1"}}>{yong.desc}</p>
            </div>

            <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:12,padding:"14px 18px",marginBottom:20}}>
              <div style={{fontWeight:600,color:"#f87171",marginBottom:6,fontSize:13}}>⚠️ 기신 (忌神) — 피해야 할 오행</div>
              <p style={{margin:0,fontSize:12,lineHeight:1.7,color:"#fca5a5"}}>
                <strong>{EL_EMOJI[yong.gishin]} {yong.gishin}({EL_HANJA[yong.gishin]})</strong>이 기신입니다.
                {yong.gishin} 기운을 강화하는 환경·색상·음식은 피하는 것이 좋습니다.
              </p>
            </div>

            <div style={{background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:12,padding:"14px 18px"}}>
              <div style={{fontWeight:600,color:"#a5b4fc",marginBottom:10,fontSize:14}}>🎯 용신 활용법</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,fontSize:12}}>
                <div>
                  <div style={{color:"#6366f1",fontWeight:600,marginBottom:4}}>추천 색상</div>
                  <div style={{color:"#94a3b8"}}>{ELEMENT_BOOST[yong.yongshin]?.color}</div>
                </div>
                <div>
                  <div style={{color:"#6366f1",fontWeight:600,marginBottom:4}}>추천 방향</div>
                  <div style={{color:"#94a3b8"}}>{ELEMENT_BOOST[yong.yongshin]?.direction}</div>
                </div>
                <div>
                  <div style={{color:"#6366f1",fontWeight:600,marginBottom:4}}>추천 음식</div>
                  <div style={{color:"#94a3b8"}}>{ELEMENT_BOOST[yong.yongshin]?.food}</div>
                </div>
                <div>
                  <div style={{color:"#6366f1",fontWeight:600,marginBottom:4}}>유리한 직종</div>
                  <div style={{color:"#94a3b8"}}>{ELEMENT_BOOST[yong.yongshin]?.jobs}</div>
                </div>
              </div>
              <div style={{marginTop:12,fontSize:12,color:"#64748b",lineHeight:1.7}}>
                💡 {ELEMENT_BOOST[yong.yongshin]?.tip}
              </div>
            </div>

            {/* 신강/신약 심리 특성 */}
            {(() => {
              const st = yong.strength as "신강"|"신약"|"중화";
              const traits = SINGANG_TRAITS[st];
              if (!traits) return null;
              return (
                <div style={{marginTop:16,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"14px 18px"}}>
                  <div style={{fontWeight:600,color:"#e2e8f0",marginBottom:10,fontSize:14}}>🧭 {st} 심리 특성</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:11}}>
                    {[
                      {label:"사고 방식",v:traits.mindset},{label:"대인 관계",v:traits.boundary},
                      {label:"정신적 강점",v:traits.mental},{label:"삶의 스타일",v:traits.style},
                    ].map((item,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{color:"#6366f1",fontWeight:600,marginBottom:3}}>{item.label}</div>
                        <div style={{color:"#94a3b8",lineHeight:1.6}}>{item.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:8,background:"rgba(249,115,22,0.08)",borderRadius:8,padding:"8px 10px",fontSize:11}}>
                    <span style={{color:"#fb923c",fontWeight:600}}>주의: </span>
                    <span style={{color:"#fed7aa"}}>{traits.caution}</span>
                  </div>
                </div>
              );
            })()}
          </>
        ) : (
          <p style={{color:"#64748b"}}>용신 데이터를 불러올 수 없습니다.</p>
        )}
      </Page>

      {/* ─── Page 5: 일간 심층 분석 ─── */}
      <Page pageNum={5}>
        <SectionHeader n={4} title={`일간(日干) 심층 분석 — ${dayCg}일간`} color="#8b5cf6"/>
        {profile ? (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              <div style={{background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.25)",borderRadius:12,padding:"14px 16px"}}>
                <div style={{fontSize:11,color:"#8b5cf6",fontWeight:600,marginBottom:4}}>상징</div>
                <div style={{fontSize:16,fontWeight:700,color:"#e2e8f0"}}>{profile.symbol}</div>
              </div>
              <div style={{background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.25)",borderRadius:12,padding:"14px 16px"}}>
                <div style={{fontSize:11,color:"#8b5cf6",fontWeight:600,marginBottom:4}}>오행/음양</div>
                <div style={{fontSize:16,fontWeight:700,color:"#e2e8f0"}}>{profile.element}</div>
              </div>
            </div>

            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 18px",marginBottom:14}}>
              <div style={{fontWeight:700,color:"#e2e8f0",marginBottom:8,fontSize:14}}>🧠 성격 분석</div>
              <p style={{margin:0,fontSize:13,lineHeight:1.8,color:"#cbd5e1"}}>
                {aiContent.personality || profile.personality}
              </p>
              {aiContent.personality&&(
                <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                  <p style={{margin:0,fontSize:11,color:"#4b5563",display:"flex",alignItems:"center",gap:4}}>
                    <span>✨</span> Claude AI 개인 맞춤 분석
                  </p>
                </div>
              )}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:12,padding:"14px 16px"}}>
                <div style={{fontWeight:600,color:"#10b981",marginBottom:8,fontSize:13}}>✅ 장점</div>
                {profile.strength.split("·").map((s,i)=>(
                  <div key={i} style={{fontSize:12,color:"#a7f3d0",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{color:"#10b981",fontSize:10}}>▶</span>{s}
                  </div>
                ))}
              </div>
              <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:12,padding:"14px 16px"}}>
                <div style={{fontWeight:600,color:"#f87171",marginBottom:8,fontSize:13}}>⚠️ 단점·주의점</div>
                {profile.weakness.split("·").map((s,i)=>(
                  <div key={i} style={{fontSize:12,color:"#fca5a5",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{color:"#f87171",fontSize:10}}>▶</span>{s}
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:12,padding:"14px 18px",marginBottom:14}}>
              <div style={{fontWeight:600,color:"#f59e0b",marginBottom:8,fontSize:13}}>💼 추천 직업군</div>
              <p style={{margin:0,fontSize:12,lineHeight:1.7,color:"#fde68a"}}>{profile.jobs}</p>
            </div>

            <div style={{background:"rgba(248,113,113,0.06)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:12,padding:"14px 18px"}}>
              <div style={{fontWeight:600,color:"#f87171",marginBottom:6,fontSize:13}}>🏥 건강 주의 부위</div>
              <p style={{margin:0,fontSize:12,lineHeight:1.7,color:"#fca5a5"}}>{profile.health}</p>
            </div>
          </>
        ) : (
          <p style={{color:"#64748b"}}>일간 데이터가 없습니다.</p>
        )}
      </Page>

      {/* ─── Page 6: 십성 분포 분석 ─── */}
      <Page pageNum={6}>
        <SectionHeader n={5} title="십성(十星) 분포 분석" color="#06b6d4"/>
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
            {Object.entries(ssCounts).sort(([,a],[,b])=>b-a).map(([ss,cnt])=>(
              <div key={ss} style={{background:`${SS_COLOR[ss]||"#475569"}22`,
                border:`1px solid ${SS_COLOR[ss]||"#475569"}55`,
                borderRadius:20,padding:"6px 14px",display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:SS_COLOR[ss]||"#94a3b8",fontWeight:700,fontSize:13}}>{ss}</span>
                <span style={{color:"#e2e8f0",fontSize:12,fontWeight:600}}>{cnt}개</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {Object.entries(ssCounts).sort(([,a],[,b])=>b-a).map(([ss,cnt])=>{
            const desc=SIPSEONG_DESC[ss];
            if(!desc) return null;
            return (
              <div key={ss} style={{background:"rgba(255,255,255,0.03)",
                border:`1px solid ${SS_COLOR[ss]||"#334155"}44`,
                borderRadius:10,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{color:SS_COLOR[ss]||"#94a3b8",fontWeight:700,fontSize:14}}>{ss}</span>
                  <span style={{fontSize:11,color:"#64748b"}}>{desc.symbol}</span>
                  <span style={{marginLeft:"auto",fontSize:12,color:"#94a3b8",fontWeight:600}}>{cnt}개</span>
                </div>
                <div style={{fontSize:11,color:"#64748b",marginBottom:6}}>{desc.meaning}</div>
                <div style={{fontSize:11,color:"#4ade80",marginBottom:3}}>+ {desc.positive}</div>
                <div style={{fontSize:11,color:"#f87171"}}>- {desc.negative}</div>
              </div>
            );
          })}
        </div>

        {sajuResult.personality && (
          <div style={{marginTop:16,background:"rgba(6,182,212,0.08)",border:"1px solid rgba(6,182,212,0.2)",borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontWeight:600,color:"#06b6d4",marginBottom:8,fontSize:13}}>🎯 AI 성격 분석 요약</div>
            <p style={{margin:0,fontSize:12,lineHeight:1.8,color:"#a5f3fc"}}>{sajuResult.personality}</p>
          </div>
        )}
      </Page>

      {/* ─── Page 7: 신살 분석 ─── */}
      <Page pageNum={7}>
        <SectionHeader n={6} title="신살(神煞) 분석" color="#f59e0b"/>
        {sinsalList.length===0 ? (
          <p style={{color:"#64748b"}}>해당 사주에서 특별한 신살이 발견되지 않았습니다.</p>
        ) : (
          <>
            {[{cat:"lucky",label:"길신(吉神)",color:"#10b981"},{cat:"unlucky",label:"흉신(凶神)",color:"#f87171"},{cat:"neutral",label:"중성(中性)",color:"#94a3b8"}].map(({cat,label,color})=>{
              const list = sinsalList.filter((s:any)=>s.category===cat);
              if(list.length===0) return null;
              return (
                <div key={cat} style={{marginBottom:20}}>
                  <div style={{fontWeight:700,color,fontSize:14,marginBottom:12,
                    display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:`${color}22`,borderRadius:99,padding:"2px 12px"}}>{label} ({list.length}개)</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {list.map((s:any,i:number)=>(
                      <div key={i} style={{background:`${color}08`,
                        border:`1px solid ${color}25`,borderRadius:10,padding:"12px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          <span style={{color,fontWeight:700,fontSize:13}}>{s.name}</span>
                          <span style={{fontSize:11,color:"#475569"}}>{s.hanja}</span>
                          {s.pillars?.length>0&&(
                            <span style={{marginLeft:"auto",fontSize:10,color:"#64748b"}}>
                              {s.pillars.join("·")}주
                            </span>
                          )}
                        </div>
                        <p style={{margin:0,fontSize:11,lineHeight:1.7,color:"#94a3b8"}}>{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Page>

      {/* ─── Page 8: 합·충·형·파·해 ─── */}
      <Page pageNum={8}>
        <SectionHeader n={7} title="합(合)·충(沖)·형(刑)·파(破)·해(害) 분석" color="#ec4899"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {/* 합 */}
          <div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontWeight:700,color:"#10b981",marginBottom:10,fontSize:13}}>🤝 합(合) — 결합·강화</div>
            {cgHap.length===0&&yukhap.length===0&&samhap.length===0&&banghap.length===0
              ?<p style={{color:"#475569",fontSize:12}}>해당 없음</p>
              :<>
                {cgHap.map((r,i)=><div key={i} style={{fontSize:12,color:"#a7f3d0",marginBottom:4}}>✓ {r.ko} (결과:{r.result})</div>)}
                {yukhap.map((r,i)=><div key={i} style={{fontSize:12,color:"#a7f3d0",marginBottom:4}}>✓ {r.ko} (결과:{r.result})</div>)}
                {samhap.map((r,i)=><div key={i} style={{fontSize:12,color:"#a7f3d0",marginBottom:4}}>✓ {r.ko} {r.cnt===3?"(삼합 완전)":"(반합 半合)"}</div>)}
                {banghap.map((r,i)=><div key={i} style={{fontSize:12,color:"#a7f3d0",marginBottom:4}}>✓ {r.ko}</div>)}
              </>
            }
          </div>
          {/* 충 */}
          <div style={{background:"rgba(248,113,113,0.06)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontWeight:700,color:"#f87171",marginBottom:10,fontSize:13}}>⚡ 충(沖) — 충돌·변화</div>
            {cgChung.length===0&&chung.length===0
              ?<p style={{color:"#475569",fontSize:12}}>해당 없음</p>
              :<>
                {cgChung.map((r,i)=><div key={i} style={{fontSize:12,color:"#fca5a5",marginBottom:4}}>✗ {r.ko}</div>)}
                {chung.map((r,i)=><div key={i} style={{fontSize:12,color:"#fca5a5",marginBottom:4}}>✗ {r.ko}</div>)}
              </>
            }
          </div>
          {/* 형 */}
          <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontWeight:700,color:"#ef4444",marginBottom:10,fontSize:13}}>🔺 형(刑) — 갈등·문제</div>
            {hyeong.length===0
              ?<p style={{color:"#475569",fontSize:12}}>해당 없음</p>
              :hyeong.map((r,i)=><div key={i} style={{fontSize:12,color:"#fca5a5",marginBottom:4}}>✗ {r.ko}</div>)
            }
          </div>
          {/* 파+해 */}
          <div style={{background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontWeight:700,color:"#f59e0b",marginBottom:10,fontSize:13}}>🌀 파(破)·해(害) — 손상</div>
            {pa.length===0&&hae.length===0
              ?<p style={{color:"#475569",fontSize:12}}>해당 없음</p>
              :<>
                {pa.map((r,i)=><div key={i} style={{fontSize:12,color:"#fde68a",marginBottom:4}}>△ {r.ko} (파)</div>)}
                {hae.map((r,i)=><div key={i} style={{fontSize:12,color:"#fde68a",marginBottom:4}}>△ {r.ko} (해)</div>)}
              </>
            }
          </div>
        </div>

        {/* 합충 종합 해설 */}
        <div style={{marginTop:16,background:"rgba(236,72,153,0.06)",border:"1px solid rgba(236,72,153,0.2)",borderRadius:12,padding:"14px 18px"}}>
          <div style={{fontWeight:600,color:"#ec4899",marginBottom:8,fontSize:13}}>📝 종합 해설</div>
          <p style={{margin:0,fontSize:12,lineHeight:1.8,color:"#f9a8d4"}}>
            {cgHap.length+yukhap.length+samhap.length+banghap.length>0
              ?"사주에 합(合) 관계가 있어 오행의 결합이 발생합니다. 이는 해당 오행의 에너지가 전환되거나 강화됨을 의미합니다. ":""}
            {(cgChung.length+chung.length)>0
              ?"충(沖) 관계는 강한 변화와 이동을 나타내며, 직업·거주지 변동이 잦을 수 있고 건강·사고에도 주의가 필요합니다. ":""}
            {hyeong.length>0
              ?"형(刑) 관계는 법적 문제, 수술·사고, 인간관계 갈등을 암시합니다. 조심스럽고 신중한 행동이 요구됩니다. ":""}
            {(pa.length+hae.length)>0
              ?"파·해 관계는 진행 중인 일이 방해받거나 인간관계에 균열이 생길 수 있음을 나타냅니다. ":""}
            {cgHap.length+yukhap.length+samhap.length+banghap.length+cgChung.length+chung.length+hyeong.length+pa.length+hae.length===0
              ?"이 사주는 합·충·형·파·해가 없는 순수한 구성입니다. 큰 변동 없이 안정적인 삶의 흐름이 기대됩니다.":""}
          </p>
        </div>
      </Page>

      {/* ─── Page 9: 직업·재물·건강·인간관계 ─── */}
      <Page pageNum={9}>
        <SectionHeader n={8} title="직업·재물·건강·인간관계 분석" color="#f97316"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {/* 직업 */}
          <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontWeight:700,color:"#a5b4fc",marginBottom:10,fontSize:13}}>💼 직업·적성</div>
            {profile&&<p style={{margin:"0 0 8px",fontSize:12,lineHeight:1.7,color:"#c7d2fe"}}>
              <strong>일간 기반:</strong> {profile.jobs}
            </p>}
            {yong&&<p style={{margin:0,fontSize:12,lineHeight:1.7,color:"#c7d2fe"}}>
              <strong>용신 기반:</strong> {ELEMENT_BOOST[yong.yongshin]?.jobs}
            </p>}
          </div>
          {/* 재물 */}
          <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontWeight:700,color:"#10b981",marginBottom:10,fontSize:13}}>💰 재물운</div>
            <p style={{margin:0,fontSize:12,lineHeight:1.7,color:"#a7f3d0"}}>
              {(()=>{
                const jaeCnt=allSS.filter(s=>s==="정재"||s==="편재").length;
                const biCnt=allSS.filter(s=>s==="비견"||s==="겁재").length;
                if(jaeCnt>=2) return "재성(재물성)이 2개 이상으로 재물 복이 풍부합니다. 사업이나 투자에 유리한 구성입니다.";
                if(biCnt>=2&&jaeCnt>=1) return "비겁이 많아 재물이 분산되기 쉽습니다. 동업·공동투자는 신중히 하세요. 혼자 관리하는 재물이 더 안전합니다.";
                if(biCnt>=3) return "비겁이 강해 재물이 손에 쥐어지기 어렵습니다. 절약과 저축 습관이 중요합니다.";
                return "재물운은 꾸준한 노력으로 쌓아가는 스타일입니다. 성실한 저축과 안정적 투자가 맞습니다.";
              })()}
            </p>
          </div>
          {/* 건강 */}
          <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontWeight:700,color:"#f87171",marginBottom:10,fontSize:13}}>🏥 건강 주의사항</div>
            <p style={{margin:"0 0 6px",fontSize:12,lineHeight:1.7,color:"#fca5a5"}}>
              {profile&&<><strong>일간 관련:</strong> {profile.health}</>}
            </p>
            {lacking[0] && (() => {
              const h = OHAENG_HEALTH[lacking[0] as "목"|"화"|"토"|"금"|"수"];
              if (!h) return null;
              return (
                <div style={{marginTop:8}}>
                  <p style={{margin:"0 0 4px",fontSize:11,color:"#f87171",fontWeight:600}}>부족 오행({lacking[0]}) 취약 장기: {h.organs}</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
                    {h.symptoms.map((s,i)=>(
                      <span key={i} style={{fontSize:10,background:"rgba(248,113,113,0.15)",color:"#fca5a5",borderRadius:99,padding:"2px 7px"}}>{s}</span>
                    ))}
                  </div>
                  <p style={{margin:0,fontSize:11,color:"#fca5a5",lineHeight:1.6}}>💡 {h.lifestyle}</p>
                </div>
              );
            })()}
          </div>
          {/* 인간관계 */}
          <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontWeight:700,color:"#f59e0b",marginBottom:10,fontSize:13}}>🤝 인간관계·연애</div>
            <p style={{margin:0,fontSize:12,lineHeight:1.7,color:"#fde68a"}}>
              {(()=>{
                const guanCnt=allSS.filter(s=>s==="정관"||s==="편관").length;
                const inCnt=allSS.filter(s=>s==="정인"||s==="편인").length;
                const sikCnt=allSS.filter(s=>s==="식신"||s==="상관").length;
                if(guanCnt>=2) return "관성이 강해 사회적 규범을 중시하고 책임감이 높습니다. 리더 역할을 자연스럽게 맡게 됩니다.";
                if(sikCnt>=2) return "식상이 강해 표현력이 풍부하고 주변을 즐겁게 합니다. 인기운이 좋고 이성에게 매력적입니다.";
                if(inCnt>=2) return "인성이 강해 학문과 지식을 추구하며, 주변 사람들에게 지혜로운 조언을 잘 해줍니다.";
                return "균형 잡힌 십성 구성으로 다양한 인간관계를 유연하게 이끌어갑니다. 특정 유형에 치우치지 않는 중화된 관계패턴을 보입니다.";
              })()}
            </p>
          </div>
        </div>

        {/* 세운 조언 */}
        {yong&&(
          <div style={{marginTop:16,background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontWeight:600,color:"#a5b4fc",marginBottom:8,fontSize:13}}>📅 올해 운세 방향</div>
            <p style={{margin:0,fontSize:12,lineHeight:1.8,color:"#c7d2fe"}}>
              {aiContent.thisYear
                ? aiContent.thisYear
                : <>
                    용신인 {EL_EMOJI[yong.yongshin]}<strong>{yong.yongshin}({EL_HANJA[yong.yongshin]})</strong>의 기운이 활성화되는 해에 운이 열립니다.
                    {yong.yongshin}과 관련된 색상, 방향, 음식을 생활 속에 자연스럽게 통합하세요.
                    반대로 기신인 <strong>{yong.gishin}({EL_HANJA[yong.gishin]})</strong>의 기운이 강한 환경은 피하는 것이 좋습니다.
                  </>
              }
            </p>
            {aiContent.thisYear&&(
              <p style={{margin:"8px 0 0",fontSize:11,color:"#4b5563",display:"flex",alignItems:"center",gap:4}}>
                <span>✨</span> Claude AI 개인 맞춤 분석
              </p>
            )}
          </div>
        )}
      </Page>

      {/* ─── Page 10: 종합 조언 & 오행 보완법 ─── */}
      <Page pageNum={10}>
        <SectionHeader n={9} title="종합 조언 & 오행 보완법" color="#14b8a6"/>
        <div style={{marginBottom:20}}>
          <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.12))",
            border:"1px solid rgba(99,102,241,0.25)",borderRadius:16,padding:"18px 20px",marginBottom:16}}>
            <div style={{fontWeight:700,color:"#a5b4fc",marginBottom:10,fontSize:15}}>🔮 종합 운세 요약</div>
            <p style={{margin:0,fontSize:13,lineHeight:1.9,color:"#c7d2fe"}}>
              {aiContent.overall
                ? aiContent.overall
                : <>
                    {name}님의 일간은 <strong style={{color:EL_COLOR[CG_ELEMENT[dayCg]||""]||"#e2e8f0"}}>{dayCg}({profile?.element})</strong>으로,
                    {profile?.nature} 특성을 지닙니다.
                    {yong&&` 신강/신약 판정은 ${yong.strength}으로, 용신은 ${yong.yongshin}(${EL_HANJA[yong.yongshin]})입니다.`}
                    {lacking.length>0&&` 현재 ${lacking.map(e=>e+"("+EL_HANJA[e]+")").join(", ")} 기운이 부족하여 이를 보완하는 것이 운을 열어가는 핵심입니다.`}
                  </>
              }
            </p>
            {aiContent.overall&&(
              <p style={{margin:"8px 0 0",fontSize:11,color:"#4b5563",display:"flex",alignItems:"center",gap:4}}>
                <span>✨</span> Claude AI 개인 맞춤 분석
              </p>
            )}
          </div>
        </div>

        {lacking.length>0&&(
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:700,color:"#14b8a6",marginBottom:12,fontSize:14}}>⚡ 부족 오행 보완 실천법</div>
            {lacking.map(el=>{
              const info=ELEMENT_BOOST[el];
              return (
                <div key={el} style={{background:"rgba(20,184,166,0.06)",
                  border:"1px solid rgba(20,184,166,0.2)",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <span style={{fontSize:20}}>{EL_EMOJI[el]}</span>
                    <span style={{fontWeight:700,color:EL_COLOR[el],fontSize:15}}>{el}({EL_HANJA[el]}) 보완 가이드</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,fontSize:11}}>
                    <div><div style={{color:"#5eead4",fontWeight:600,marginBottom:3}}>색상·환경</div><div style={{color:"#94a3b8"}}>{info.color}</div></div>
                    <div><div style={{color:"#5eead4",fontWeight:600,marginBottom:3}}>방향</div><div style={{color:"#94a3b8"}}>{info.direction}</div></div>
                    <div><div style={{color:"#5eead4",fontWeight:600,marginBottom:3}}>음식</div><div style={{color:"#94a3b8"}}>{info.food}</div></div>
                  </div>
                  <div style={{marginTop:8,fontSize:11,color:"#94a3b8",lineHeight:1.7}}>
                    <strong style={{color:"#5eead4"}}>소재/오브제:</strong> {info.material}
                  </div>
                  <div style={{marginTop:6,fontSize:12,color:"#a5f3fc",lineHeight:1.7,fontStyle:"italic"}}>
                    💡 {info.tip}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:12,padding:"14px 18px",marginBottom:14}}>
          <div style={{fontWeight:600,color:"#a5b4fc",marginBottom:8,fontSize:13}}>📱 배경화면 활용법</div>
          <p style={{margin:0,fontSize:12,lineHeight:1.8,color:"#c7d2fe"}}>
            하루 평균 150번 이상 스마트폰을 봅니다. 용신({yong?.yongshin||"—"})과 부족 오행의 색상이 담긴 배경화면을 매일 눈에 담으면,
            잠재의식을 통해 그 오행의 에너지를 자연스럽게 보충할 수 있습니다.
            SajuWallpaper에서 제공하는 맞춤 배경화면을 활용해 매일 운의 기운을 충전하세요.
          </p>
        </div>

        <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(236,72,153,0.15))",
          border:"1px solid rgba(99,102,241,0.3)",borderRadius:16,padding:"18px 20px",textAlign:"center"}}>
          <div style={{fontSize:24,marginBottom:8}}>✨</div>
          <p style={{margin:0,fontSize:13,lineHeight:1.9,color:"#e2e8f0"}}>
            사주는 타고난 에너지의 지도입니다.<br/>
            이 보고서가 {name}님만의 길을 찾는 데 작은 나침반이 되길 바랍니다.<br/>
            <span style={{color:"#a5b4fc",fontWeight:600}}>— SajuWallpaper</span>
          </p>
        </div>
      </Page>
    </>
  );
}
