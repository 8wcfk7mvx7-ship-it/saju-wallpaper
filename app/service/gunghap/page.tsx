"use client";
import { useState, useEffect, useCallback, useRef, type CSSProperties, type ReactNode, memo } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";
import ProfilePicker from "@/components/ProfilePicker";
import SaveProfilePrompt from "@/components/SaveProfilePrompt";
import AnalysisLoading from "@/components/AnalysisLoading";
import SipseongInsight from "@/components/SipseongInsight";
import ProfileSaveModal from "@/components/ProfileSaveModal";
import BirthInputForm, { BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ShareImageButton from "@/components/ShareImageButton";
import HapchungDiagram from "@/components/HapchungDiagram";
import { getSpouseFortuneAnalysis, getFaithfulSpouseAnalysis } from "@/lib/saju2";


/* ═══════════════════════════════════════════════════════════════
   관계 테이블
═══════════════════════════════════════════════════════════════ */
const CHEONGAN_HAP: [string,string,string][] = [
  ["갑","기","토"],["을","경","금"],["병","신","수"],["정","임","목"],["무","계","화"],
];
const CHEONGAN_CHUNG: [string,string][] = [
  ["갑","경"],["을","신"],["병","임"],["정","계"],
];
const JIJI_YUKHAP: [string,string,string][] = [
  ["자","축","토"],["인","해","목"],["묘","술","화"],
  ["진","유","금"],["사","신","수"],["오","미","토"],
];
const SAMHAP_GROUPS: {branches:[string,string,string];center:string;el:string}[] = [
  {branches:["인","오","술"], center:"오", el:"화"},
  {branches:["해","묘","미"], center:"묘", el:"목"},
  {branches:["신","자","진"], center:"자", el:"수"},
  {branches:["사","유","축"], center:"유", el:"금"},
];
const JIJI_CHUNG: [string,string][] = [
  ["자","오"],["축","미"],["인","신"],["묘","유"],["진","술"],["사","해"],
];
const JIJI_HAE: [string,string][] = [
  ["자","미"],["축","오"],["인","사"],["묘","진"],["신","해"],["유","술"],
];
const JIJI_PA: [string,string][] = [
  ["자","유"],["오","묘"],["인","해"],["사","신"],["진","축"],["술","미"],
];
const WONJIN: [string,string][] = [
  ["자","미"],["축","오"],["인","유"],["묘","신"],["진","해"],["사","술"],
];
const JIJANGAN_ALL: Record<string,string[]> = {
  자:["임","계"], 축:["기","신","계"], 인:["무","병","갑"], 묘:["갑","을"],
  진:["을","계","무"], 사:["무","경","병"], 오:["병","기","정"], 미:["정","을","기"],
  신:["무","임","경"], 유:["경","신"], 술:["신","정","무"], 해:["무","갑","임"],
};
/* 12운성 관계 에너지 */
const UUNSEONG_COMPAT: Record<string,{desc:string;keyword:string;color:string;smj:boolean}> = {
  장생:{desc:"성장과 시작의 에너지. 관계에 신선한 자극과 설렘을 불어넣습니다.",keyword:"생동감·성장형",color:"#4ade80",smj:false},
  목욕:{desc:"감각적이고 매력적인 에너지. 상대에게 강하게 끌리지만 감정 기복이 있을 수 있습니다.",keyword:"감각·매력형",color:"#c4b5fd",smj:false},
  관대:{desc:"자신감과 리더십이 넘칩니다. 관계에서 이끌어가려는 성향이 강합니다.",keyword:"자신감·리더형",color:"#86efac",smj:false},
  건록:{desc:"독립심이 강하고 자기 페이스를 중시합니다. 관계에서 자유와 존중이 필요합니다.",keyword:"독립·자존형",color:"#fbbf24",smj:false},
  제왕:{desc:"강한 카리스마와 결단력. 관계의 주도권을 잡으려 하지만 고집이 셀 수 있습니다.",keyword:"카리스마·주도형",color:"#f59e0b",smj:false},
  쇠:  {desc:"성숙하고 안정된 에너지. 관계에서 신뢰와 안정을 추구합니다.",keyword:"성숙·안정형",color:"#94a3b8",smj:false},
  병:  {desc:"섬세하고 배려심이 깊습니다. 상대의 감정을 잘 헤아리지만 자기 에너지 관리가 필요합니다.",keyword:"섬세·배려형",color:"#64748b",smj:true},
  사:  {desc:"조용하고 내면 중심적인 에너지. 관계에서 깊은 유대는 있으나 표현이 부족할 수 있습니다.",keyword:"내면·침잠형",color:"#f87171",smj:true},
  묘:  {desc:"현실적이고 안정적인 관계를 추구합니다. 서두르지 않고 관계를 오래 유지합니다.",keyword:"현실·지속형",color:"#ef4444",smj:true},
  절:  {desc:"변화와 새 출발의 에너지. 관계에서 전환점이 잦고 예측하기 어렵습니다.",keyword:"전환·변화형",color:"#dc2626",smj:true},
  태:  {desc:"순수하고 꿈꾸는 에너지. 관계에서 이상적인 모습을 그리며 시작합니다.",keyword:"순수·이상형",color:"#818cf8",smj:false},
  양:  {desc:"잠재력이 자라나는 에너지. 관계가 깊어질수록 진가가 드러납니다.",keyword:"성장·잠재형",color:"#a78bfa",smj:false},
};

/* 지장간 궁합 에너지 */
const JIJANGAN_COMPAT: Record<string,string> = {
  자:"임수·계수의 기운. 지혜롭고 냉철하나 감정 표현이 서툴 수 있습니다. 상대의 따뜻한 이해가 필요합니다.",
  축:"기토·신금·계수. 인내심 강하고 신뢰를 중시합니다. 느리게 쌓이는 관계에서 빛납니다.",
  인:"무토·병화·갑목. 생명력과 추진력이 관계를 이끕니다. 새로운 경험을 함께 만들어갑니다.",
  묘:"갑목·을목. 창의적이고 부드러운 기운. 예술적 감성과 섬세함으로 상대를 배려합니다.",
  진:"을목·계수·무토. 변화와 재생의 힘. 관계에서 위기를 함께 극복하는 강한 유대를 만듭니다.",
  사:"무토·경금·병화. 강한 의지와 열정. 관계를 주도하지만 때로 상대를 압박할 수 있습니다.",
  오:"병화·기토·정화. 따뜻한 열정과 명랑함. 관계에 활기를 불어넣으나 감정 기복 주의가 필요합니다.",
  미:"정화·을목·기토. 포용력과 예술적 감성. 상대를 부드럽게 감싸는 따뜻한 기운입니다.",
  신:"무토·임수·경금. 결단력과 이성적 판단. 관계에서 신뢰와 논리를 중요하게 여깁니다.",
  유:"경금·신금. 정밀하고 완벽주의적 기운. 깊은 신뢰 관계를 원하지만 까다로울 수 있습니다.",
  술:"신금·정화·무토. 카리스마와 의지. 관계에서 강한 존재감을 발휘하며 보호자 역할을 합니다.",
  해:"무토·갑목·임수. 지혜와 생명력. 관계에서 새로운 시작을 함께할 때 에너지가 가장 빛납니다.",
};

const CG_HAP_MAP: Record<string,{partner:string;el:string}> = {};
CHEONGAN_HAP.forEach(([a,b,el])=>{CG_HAP_MAP[a]={partner:b,el};CG_HAP_MAP[b]={partner:a,el};});
const CG_CHUNG_SET=new Set(CHEONGAN_CHUNG.map(([a,b])=>`${a}-${b}`).concat(CHEONGAN_CHUNG.map(([a,b])=>`${b}-${a}`)));

/* 조후(調候) — 월지 → 온도 그룹 */
const JOHU_GROUP: Record<string,"한"|"온"|"열"|"냉"> = {
  해:"한", 자:"한", 축:"한",
  인:"온", 묘:"온", 진:"온",
  사:"열", 오:"열", 미:"열",
  신:"냉", 유:"냉", 술:"냉",
};
const JOHU_LABEL: Record<string,string> = {한:"❄️ 한랭(冬)",온:"🌱 온화(春)",열:"🔥 열기(夏)",냉:"🍂 서늘(秋)"};

/* 도화살 */
const JIJI = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
function getDohwaJj(yeonji:string){
  const yi=JIJI.indexOf(yeonji);
  if([2,6,10].includes(yi)) return "묘";
  if([11,3,7].includes(yi)) return "자";
  if([8,0,4].includes(yi)) return "유";
  return "오";
}
/* 홍염살 */
const HONGYEOM_JJ: Record<string,string> = {
  갑:"오",을:"신",병:"인",정:"미",무:"오",기:"미",경:"술",신:"유",임:"자",계:"신",
};

function isPair(table:[string,string][],a:string,b:string){
  return table.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
}

/* ═══════════════════════════════════════════════════════════════
   조후 궁합 분석
═══════════════════════════════════════════════════════════════ */
interface JohuResult {
  g1:"한"|"온"|"열"|"냉"; g2:"한"|"온"|"열"|"냉";
  score: number;
  grade: "최상"|"좋음"|"보통"|"주의"|"위험";
  desc: string;
}
function analyzeJohu(monthJj1:string, monthJj2:string, n1:string, n2:string): JohuResult {
  const g1=JOHU_GROUP[monthJj1]??"온";
  const g2=JOHU_GROUP[monthJj2]??"온";
  // 한↔열: 최고 보완 / 온↔냉: 좋음 / 한↔냉·열↔온: 중립 / 한↔온·열↔냉·같은계열: 주의
  const opp:{[k:string]:string}={한:"열",열:"한",온:"냉",냉:"온"};
  if(opp[g1]===g2){
    const score=g1==="한"||g2==="한"?28:20;
    const desc=g1==="한"||g2==="한"
      ?`${JOHU_LABEL[g1]} × ${JOHU_LABEL[g2]} — 한 사람이 온기로 녹이고 한 사람이 열기를 식혀줍니다. 조후 궁합 최고입니다.`
      :`${JOHU_LABEL[g1]} × ${JOHU_LABEL[g2]} — 따뜻함과 서늘함이 균형을 이룹니다.`;
    return {g1,g2,score,grade:"최상",desc};
  }
  if((g1==="한"&&g2==="냉")||(g1==="냉"&&g2==="한")){
    return {g1,g2,score:-12,grade:"위험",
      desc:`${JOHU_LABEL[g1]} × ${JOHU_LABEL[g2]} — 두 사람 모두 냉기가 강합니다. 서로 차갑게 굳어버릴 수 있습니다.`};
  }
  if((g1==="열"&&g2==="온")||(g1==="온"&&g2==="열")){
    return {g1,g2,score:10,grade:"좋음",
      desc:`${JOHU_LABEL[g1]} × ${JOHU_LABEL[g2]} — 온기 위에 열기가 더해집니다. 잘 맞지만 가끔 과열 주의.`};
  }
  if((g1==="한"&&g2==="온")||(g1==="온"&&g2==="한")){
    return {g1,g2,score:5,grade:"보통",
      desc:`${JOHU_LABEL[g1]} × ${JOHU_LABEL[g2]} — 봄기운이 한기를 조금 녹여줍니다. 노력이 필요한 조합.`};
  }
  if(g1===g2){
    const bad=g1==="한"||g1==="열";
    return {g1,g2,score:bad?-10:-3,grade:bad?"주의":"보통",
      desc:`${JOHU_LABEL[g1]} × ${JOHU_LABEL[g2]} — 같은 기운끼리. ${bad?"에너지가 한쪽으로 치우쳐 조절이 어렵습니다.":"서로 비슷한 분위기라 편하지만 자극이 적습니다."}`};
  }
  return {g1,g2,score:0,grade:"보통",
    desc:`${JOHU_LABEL[g1]} × ${JOHU_LABEL[g2]} — 중립적인 조후 조합.`};
}

/* ═══════════════════════════════════════════════════════════════
   두 사람 사이 삼합 분석 (크로스)
═══════════════════════════════════════════════════════════════ */
interface SamhapResult {
  group: string; el: string; found: string[]; isComplete: boolean;
  score: number; broken: string[]; desc: string;
}
function analyzeCrossSamhap(jjs1:string[], jjs2:string[]): SamhapResult[] {
  const all=[...jjs1,...jjs2];
  const results:SamhapResult[]=[];
  for(const {branches,center,el} of SAMHAP_GROUPS){
    const found=branches.filter(b=>all.includes(b));
    if(found.length<2) continue;
    const isComplete=found.length>=3;
    const hasCenter=found.includes(center);
    // 충으로 깨지는지 체크
    const broken:string[]=[];
    for(const jj of found){
      const chungPair=JIJI_CHUNG.find(([a,b])=>a===jj||b===jj);
      if(chungPair){
        const partner=chungPair[0]===jj?chungPair[1]:chungPair[0];
        if(all.includes(partner)) broken.push(`${jj}↔${partner}충`);
      }
    }
    const breakScore=broken.length*(-8);
    const baseScore=isComplete?18:(hasCenter?12:8);
    const score=baseScore+breakScore;
    const inOSulNote = el==='화' ? ' ※ 상대의 단점까지 감싸려는 포용 과잉 주의' : '';
    const desc=`${branches.join("")} (${el}국) — ${isComplete?"완전삼합":"반합"}${inOSulNote}${broken.length>0?` ⚡${broken.join(", ")}으로 일부 파괴`:""}`;;
    results.push({group:branches.join(""),el,found,isComplete,score,broken,desc});
  }
  return results;
}

/* ═══════════════════════════════════════════════════════════════
   주별 분석 (년↔년 월↔월 일↔일 시↔시)
═══════════════════════════════════════════════════════════════ */
interface PillarEvent {type:'합'|'충'|'해'|'파'|'형'|'삼합'|'원진'|'암합'|'암충';desc:string;score:number}
interface PillarResult {
  label:string; weight:number; cg1:string;jj1:string;cg2:string;jj2:string;
  events:PillarEvent[]; subScore:number;
}
function analyzePillar(label:string,weight:number,cg1:string,jj1:string,cg2:string,jj2:string):PillarResult{
  const ev:PillarEvent[]=[];
  if(CG_HAP_MAP[cg1]?.partner===cg2)
    ev.push({type:'합',desc:`천간합 ${cg1}${cg2}→${CG_HAP_MAP[cg1].el}`,score:12});
  if(CG_CHUNG_SET.has(`${cg1}-${cg2}`))
    ev.push({type:'충',desc:`천간충 ${cg1}↔${cg2}`,score:-10});
  const yh=JIJI_YUKHAP.find(([a,b])=>(a===jj1&&b===jj2)||(a===jj2&&b===jj1));
  if(yh) ev.push({type:'합',desc:`육합 ${jj1}${jj2}→${yh[2]}`,score:14*weight});
  // 삼합 반합 (같은 주끼리 2개)
  for(const {branches,center,el} of SAMHAP_GROUPS){
    if(branches.includes(jj1)&&branches.includes(jj2)&&jj1!==jj2){
      if(!yh) ev.push({type:'삼합',desc:`삼합 반합 ${jj1}·${jj2}(${el}국)${[jj1,jj2].includes(center)?"★":""}`,score:10*weight});
    }
  }
  if(isPair(JIJI_CHUNG,jj1,jj2)){
    const isJaO=(jj1==='자'&&jj2==='오')||(jj1==='오'&&jj2==='자');
    ev.push({
      type:'충',
      desc: isJaO
        ? `자오충(水火) — 강렬한 자극과 케미. 식지 않는 긴장감, 단 감정 기복 주의`
        : `지지충 ${jj1}↔${jj2} — 마찰과 자극. 자극추구형엔 케미, 안정추구형엔 소모`,
      score: isJaO ? -6*weight : -11*weight,
    });
  }
  if(isPair(WONJIN,jj1,jj2))     ev.push({type:'원진',desc:`원진살 ${jj1}↔${jj2}`,score:-18*weight});
  if(isPair(JIJI_HAE,jj1,jj2))   ev.push({type:'해',desc:`지지해 ${jj1}↔${jj2}`,score:-9*weight});
  if(isPair(JIJI_PA,jj1,jj2))    ev.push({type:'파',desc:`지지파 ${jj1}↔${jj2}`,score:-7*weight});
  // 자묘형
  if((jj1==="자"&&jj2==="묘")||(jj1==="묘"&&jj2==="자"))
    ev.push({type:'형',desc:`이형 자묘형`,score:-8*weight});
  // 지장간 암합/암충
  const g1=JIJANGAN_ALL[jj1]||[], g2=JIJANGAN_ALL[jj2]||[];
  for(const a of g1) for(const b of g2){
    if(CG_HAP_MAP[a]?.partner===b) ev.push({type:'암합',desc:`지장간 ${a}${b}합`,score:5});
    if(CG_CHUNG_SET.has(`${a}-${b}`)) ev.push({type:'암충',desc:`지장간 ${a}${b}충`,score:-4});
  }
  return {label,weight,cg1,jj1,cg2,jj2,events:ev,subScore:ev.reduce((s,e)=>s+e.score,0)};
}

/* ═══════════════════════════════════════════════════════════════
   바람기 분석
═══════════════════════════════════════════════════════════════ */
interface BaramResult {
  p1dohwa:string[]; p1hongyeom:boolean;
  p2dohwa:string[]; p2hongyeom:boolean;
  total:number; grade:string; desc:string; emoji:string;
}
function analyzeBaram(r1:ReturnType<typeof analyzeSaju>, r2:ReturnType<typeof analyzeSaju>, n1:string, n2:string):BaramResult{
  const pd1=r1.pillarsDetail, pd2=r2.pillarsDetail;
  const jjs1=[pd1.year.jj,pd1.month.jj,pd1.day.jj,...(pd1.hour?[pd1.hour.jj]:[])];
  const jjs2=[pd2.year.jj,pd2.month.jj,pd2.day.jj,...(pd2.hour?[pd2.hour.jj]:[])];
  const dohwa1=getDohwaJj(pd1.year.jj);
  const dohwa2=getDohwaJj(pd2.year.jj);
  const p1dohwa=jjs1.filter(j=>j===dohwa1).map(()=>"도화");
  const p2dohwa=jjs2.filter(j=>j===dohwa2).map(()=>"도화");
  const p1hongyeom=jjs1.includes(HONGYEOM_JJ[pd1.day.cg]||"");
  const p2hongyeom=jjs2.includes(HONGYEOM_JJ[pd2.day.cg]||"");
  const total=p1dohwa.length+p2dohwa.length+(p1hongyeom?1:0)+(p2hongyeom?1:0);
  let grade="안전", desc="", emoji="✅";
  if(total===0){
    desc=`${n1}·${n2} 모두 도화·홍염 없음. 바람기 위험도 낮습니다.`; emoji="✅"; grade="안전";
  } else if(total===1){
    const who=p1dohwa.length>0||p1hongyeom?n1:n2;
    desc=`${who}에게 도화·홍염 기운이 있습니다. 이성에게 매력적이지만 크게 위험하지는 않습니다.`; emoji="💃"; grade="주의";
  } else if(total===2){
    desc=`둘 다 이성에게 매력적인 기운이 있습니다. 서로가 서로를 의심하게 될 수 있어요.`; emoji="👀"; grade="경고";
  } else {
    desc=`도화·홍염 기운이 사주 전체에 강하게 퍼져 있습니다. 감각적 유혹에 취약한 조합입니다.`; emoji="🔥"; grade="위험";
  }
  return {p1dohwa,p1hongyeom,p2dohwa,p2hongyeom,total,grade,desc,emoji};
}

/* ═══════════════════════════════════════════════════════════════
   오행 상생/상극
═══════════════════════════════════════════════════════════════ */
const GENERATES:Record<string,string>={목:"화",화:"토",토:"금",금:"수",수:"목"};
const CONTROLS:Record<string,string>={목:"토",토:"수",수:"화",화:"금",금:"목"};
function ohaengRel(a:string,b:string):'상생'|'상극'|'중립'{
  if(GENERATES[a]===b||GENERATES[b]===a) return '상생';
  if(CONTROLS[a]===b||CONTROLS[b]===a) return '상극';
  return '중립';
}

/* ═══════════════════════════════════════════════════════════════
   입력/상태
═══════════════════════════════════════════════════════════════ */
interface PI { name: string; birthData: BirthFormData; }
const empty = (): PI => ({ name: '', birthData: defaultBirthData('male') });

// 한국어 IME 커서 튐 방지: uncontrolled name input
const NameInput = memo(function NameInput({ defaultValue, onBlur, style }: { defaultValue: string; onBlur: (v: string) => void; style: CSSProperties }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current && ref.current.value !== defaultValue) ref.current.value = defaultValue; }, [defaultValue]);
  return <input ref={ref} defaultValue={defaultValue} style={style} placeholder="이름 또는 별명" onBlur={e => onBlur(e.target.value)} />;
});


/* ─── 페이드인 유틸 ─── */
function FadeSlide({children,delay=0,style}:{children:ReactNode;delay?:number;style?:CSSProperties}){
  const [v,setV]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setV(true),delay);return()=>clearTimeout(t);},[delay]);
  return(
    <div style={{
      opacity:v?1:0,
      transform:v?'translateY(0)':'translateY(24px)',
      transition:`opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   관계 유형
═══════════════════════════════════════════════════════════════ */
const RELATION_TYPES: {
  id: string; emoji: string; label: string;
  formTitle: string; formSub: string; p2Label: string;
}[] = [
  { id:"애인",    emoji:"💝", label:"애인",    formTitle:"지금 사귀는 사람,",   formSub:"이 사람, 진짜 내 편인가요?",          p2Label:"애인" },
  { id:"배우자",  emoji:"💍", label:"배우자",  formTitle:"배우자와 나,",          formSub:"우리 사이의 진짜 에너지는?",          p2Label:"배우자" },
  { id:"전애인",  emoji:"💔", label:"전애인",  formTitle:"헤어진 그 사람,",       formSub:"왜 안 됐는지 사주가 말해줍니다",     p2Label:"전애인" },
  { id:"전배우자",emoji:"🖤", label:"전배우자",formTitle:"전배우자와 나,",        formSub:"사주가 처음부터 알고 있었습니다",     p2Label:"전배우자" },
  { id:"친구",    emoji:"🤝", label:"친구",    formTitle:"그 친구와 나,",         formSub:"진짜 맞는 친구인지 확인하세요",       p2Label:"친구" },
  { id:"짝사랑",  emoji:"🫀", label:"짝사랑",  formTitle:"짝사랑하는 그 사람,",   formSub:"사주가 허락한 인연인가요?",           p2Label:"그 사람" },
  { id:"반려동물",emoji:"🐾", label:"반려동물",formTitle:"반려동물과 나,",        formSub:"우리가 서로 잘 맞는지 알아봐요",      p2Label:"반려동물" },
  { id:"가족",    emoji:"👨‍👩‍👧", label:"가족",    formTitle:"가족과 나,",            formSub:"가족과의 사주 에너지를 확인하세요",  p2Label:"가족" },
  { id:"기타",    emoji:"❓", label:"기타",    formTitle:"그 사람과 나,",         formSub:"사주가 처음부터 알고 있었습니다",     p2Label:"그 사람" },
];

const FEATURES=[
  {icon:"🌡️",title:"조후(調候) 궁합",desc:"두 사람의 사주 온도가 맞지 않으면 함께할수록 소모됩니다"},
  {icon:"✴️",title:"삼합 에너지",desc:"인오술·해묘미… 이 조합이 두 사람을 하나로 묶거나 끊어냅니다"},
  {icon:"🌸",title:"바람기 살 분석",desc:"도화살·홍염살 — 상대방에게 있는지 지금 확인하세요"},
  {icon:"💀",title:"원진·충 경고",desc:"모르면 반복되는 갈등의 진짜 원인이 여기에 있습니다"},
];

export default function GunghapPage(){
  const router=useRouter();
  const [p1,setP1]=useState<PI>(empty());
  const [p2,setP2]=useState<PI>(empty());
  const [result,setResult]=useState<null|{
    johu:JohuResult; samhap:SamhapResult[]; pillars:PillarResult[];
    baram:BaramResult; yongsinDesc:string; ohaengDesc:string;
    totalScore:number; grade:string; gradeColor:string; gradeEmoji:string;
    gradeTitle:string; gradeDesc:string;
    r1:ReturnType<typeof analyzeSaju>; r2:ReturnType<typeof analyzeSaju>;
  }>(null);
  const [showEntryBtn,setShowEntryBtn]=useState(false);
  const [step,setStep]=useState<'entry'|'form'|'loading'|'result'>('entry');
  const [relationType,setRelationType]=useState('');
  const selectedRelation=RELATION_TYPES.find(r=>r.id===relationType)||null;
  useEffect(()=>{const t=setTimeout(()=>setShowEntryBtn(true),3400);return()=>clearTimeout(t);},[]);

  const fillP1=useCallback(()=>{
    const saved=loadSajuData();
    if(!saved) return;
    setP1({
      name:saved.name||'',
      birthData:{
        name:saved.name||'',
        gender:saved.gender||'male',
        birthYear:saved.birthYear||'',
        birthMonth:saved.birthMonth||'',
        birthDay:saved.birthDay||'',
        birthHour:saved.birthHourUnknown?null:saved.birthHour,
        birthMinute:saved.birthHourUnknown?null:saved.birthMinute,
        city:saved.birthPlace||'서울',
        calendarType:'solar',
        useJajasi:saved.useJajasi||false,
        isLeapMonth:false,
      },
    });
  },[]);

  const calc=async()=>{
    let y1=p1.birthData.birthYear===''?NaN:Number(p1.birthData.birthYear);
    let m1=p1.birthData.birthMonth===''?NaN:Number(p1.birthData.birthMonth);
    let d1=p1.birthData.birthDay===''?NaN:Number(p1.birthData.birthDay);
    let y2=p2.birthData.birthYear===''?NaN:Number(p2.birthData.birthYear);
    let m2=p2.birthData.birthMonth===''?NaN:Number(p2.birthData.birthMonth);
    let d2=p2.birthData.birthDay===''?NaN:Number(p2.birthData.birthDay);
    if(!p1.name||!p2.name||isNaN(y1)||isNaN(m1)||isNaN(d1)||isNaN(y2)||isNaN(m2)||isNaN(d2)) { alert('두 사람의 이름과 생년월일을 모두 입력해주세요.'); return; }
    if(p1.birthData.calendarType==='lunar'){
      try{
        // @ts-ignore
        const KLC=(await import('korean-lunar-calendar')).default;
        const klc=new KLC(); klc.setLunarDate(y1,m1,d1,p1.birthData.isLeapMonth);
        const sol=klc.getSolarCalendar(); if(!sol?.year) throw new Error();
        y1=sol.year; m1=sol.month; d1=sol.day;
      } catch { alert('첫 번째 사람의 음력 날짜를 변환할 수 없습니다.'); return; }
    }
    if(p2.birthData.calendarType==='lunar'){
      try{
        // @ts-ignore
        const KLC=(await import('korean-lunar-calendar')).default;
        const klc=new KLC(); klc.setLunarDate(y2,m2,d2,p2.birthData.isLeapMonth);
        const sol=klc.getSolarCalendar(); if(!sol?.year) throw new Error();
        y2=sol.year; m2=sol.month; d2=sol.day;
      } catch { alert('두 번째 사람의 음력 날짜를 변환할 수 없습니다.'); return; }
    }
    const h1=p1.birthData.birthHour;
    const min1=p1.birthData.birthMinute??0;
    const h2=p2.birthData.birthHour;
    const min2=p2.birthData.birthMinute??0;
    const r1=analyzeSaju({birthYear:y1,birthMonth:m1,birthDay:d1,birthHour:h1,birthMinute:h1!=null?min1:null,name:p1.name,gender:p1.birthData.gender,birthPlace:p1.birthData.city||'서울',style:'auto',productType:'report',useJajasi:p1.birthData.useJajasi});
    const r2=analyzeSaju({birthYear:y2,birthMonth:m2,birthDay:d2,birthHour:h2,birthMinute:h2!=null?min2:null,name:p2.name,gender:p2.birthData.gender,birthPlace:p2.birthData.city||'서울',style:'auto',productType:'report',useJajasi:p2.birthData.useJajasi});
    const pd1=r1.pillarsDetail, pd2=r2.pillarsDetail;
    const jjs1=[pd1.year.jj,pd1.month.jj,pd1.day.jj,...(pd1.hour?[pd1.hour.jj]:[])];
    const jjs2=[pd2.year.jj,pd2.month.jj,pd2.day.jj,...(pd2.hour?[pd2.hour.jj]:[])];

    // 조후
    const johu=analyzeJohu(pd1.month.jj,pd2.month.jj,p1.name,p2.name);
    // 삼합 (크로스)
    const samhap=analyzeCrossSamhap(jjs1,jjs2);
    // 주별
    const pillars:PillarResult[]=[
      analyzePillar('일주',2.2,pd1.day.cg,pd1.day.jj,pd2.day.cg,pd2.day.jj),
      analyzePillar('년주',1.2,pd1.year.cg,pd1.year.jj,pd2.year.cg,pd2.year.jj),
      analyzePillar('월주',1.0,pd1.month.cg,pd1.month.jj,pd2.month.cg,pd2.month.jj),
      ...(pd1.hour&&pd2.hour?[analyzePillar('시주',0.8,pd1.hour.cg,pd1.hour.jj,pd2.hour.cg,pd2.hour.jj)]:[] as PillarResult[]),
    ];
    // 바람기
    const baram=analyzeBaram(r1,r2,p1.name,p2.name);
    // 용신
    const ys1=r1.yongshin.yongshin, ys2=r2.yongshin.yongshin;
    const rel=ohaengRel(ys1,ys2);
    const yongsinScore=rel==='상생'?10:rel==='상극'?-8:3;
    const yongsinDesc=rel==='상생'?`${p1.name}의 용신(${ys1}) ↔ ${p2.name}의 용신(${ys2}) 상생 ✅`:rel==='상극'?`${p1.name}의 용신(${ys1}) ↔ ${p2.name}의 용신(${ys2}) 상극 ⚠️`:`${p1.name}의 용신(${ys1}) ↔ ${p2.name}의 용신(${ys2}) 중립`;
    let ohaengBonus=0;
    for(const el of r1.lacking) if(r2.dominant.includes(el)) ohaengBonus+=6;
    for(const el of r2.lacking) if(r1.dominant.includes(el)) ohaengBonus+=6;
    const ohaengDesc=ohaengBonus>0?`서로 부족한 오행을 채워주는 조합 (+${ohaengBonus})`:'오행 보완 효과 없음';

    // 총점
    let s=50;
    s+=johu.score*1.3; // 조후 가중치 강화
    s+=samhap.reduce((a,b)=>a+b.score,0);
    s+=pillars.reduce((a,b)=>a+b.subScore,0);
    s+=yongsinScore+ohaengBonus;
    const totalScore=Math.max(10,Math.min(99,Math.round(s)));

    let grade='',gradeColor='',gradeEmoji='',gradeTitle='',gradeDesc='';
    if(totalScore>=90){grade='천생연분';gradeColor='#ff6b6b';gradeEmoji='💘';gradeTitle='이 사람, 놓치면 진짜 후회합니다';gradeDesc='수천 가지 조합 중 상위 2%. 사주가 허락한 인연입니다.';}
    else if(totalScore>=78){grade='최상';gradeColor='#ff9f43';gradeEmoji='🔥';gradeTitle='주변이 부러워할 궁합';gradeDesc='서로를 성장시키는 강력한 시너지. 함께할수록 더 강해집니다.';}
    else if(totalScore>=65){grade='좋음';gradeColor='#10ac84';gradeEmoji='✨';gradeTitle='노력하면 충분히 행복해질 궁합';gradeDesc='큰 문제 없음. 이해하려는 노력이 관계를 빛나게 합니다.';}
    else if(totalScore>=50){grade='보통';gradeColor='#54a0ff';gradeEmoji='🌊';gradeTitle='지금 이 순간이 중요한 궁합';gradeDesc='지금 어떻게 하느냐에 따라 운명이 갈립니다.';}
    else if(totalScore>=35){grade='주의';gradeColor='#feca57';gradeEmoji='⚠️';gradeTitle='모르고 있었다면 지금이라도';gradeDesc='서로 다른 방향을 바라보는 조합. 솔직한 대화가 필요합니다.';}
    else{grade='위험';gradeColor='#ee5a24';gradeEmoji='💀';gradeTitle='에너지를 갉아먹는 궁합';gradeDesc='상극 에너지가 강합니다. 의식적 노력 없이는 소모적인 관계가 됩니다.';}

    setResult({johu,samhap,pillars,baram,yongsinDesc,ohaengDesc,totalScore,grade,gradeColor,gradeEmoji,gradeTitle,gradeDesc,r1,r2});
    setStep('loading');
  };

  const inp=(s?:CSSProperties):CSSProperties=>({
    width:'100%',padding:'11px 13px',border:'1.5px solid rgba(255,255,255,0.1)',
    borderRadius:10,fontSize:13,background:'rgba(255,255,255,0.05)',
    color:'#fff',outline:'none',boxSizing:'border-box',fontFamily:'inherit',...s,
  });

  const gradeColors:{[k:string]:string}={합:'#10ac84',삼합:'#10ac84',암합:'#4ecdc4',충:'#ee5a24',원진:'#c0392b',해:'#e67e22',파:'#e67e22',형:'#e74c3c',암충:'#e74c3c'};

  if(step==='loading') return (
    <AnalysisLoading subject={`${p1.name}·${p2.name} 궁합`} onDone={()=>setStep('result')} />
  );

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0d0d1a 0%,#1a1a2e 45%,#16213e 100%)',
      color:'#fff'}}>

      {/* ══ ENTRY ══ */}
      {step==='entry'&&(
        <div className="page-fade-in" style={{minHeight:'100vh',position:'relative',overflowX:'hidden'}}>
          {/* 배경 글로우 */}
          <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
            <div style={{position:'absolute',top:'-15%',left:'-10%',width:520,height:520,
              borderRadius:'50%',background:'rgba(99,102,241,0.15)',filter:'blur(150px)'}}/>
            <div style={{position:'absolute',bottom:'-20%',right:'-10%',width:440,height:440,
              borderRadius:'50%',background:'rgba(244,114,182,0.12)',filter:'blur(130px)'}}/>
            <div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',
              width:260,height:260,borderRadius:'50%',background:'rgba(139,92,246,0.07)',filter:'blur(90px)'}}/>
          </div>

          {/* 홈 버튼 */}
          <FadeSlide delay={0} style={{position:'absolute',top:20,left:20,zIndex:10}}>
            <button onClick={()=>router.push('/')} style={{background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.1)',borderRadius:100,padding:'6px 14px',
              color:'rgba(255,255,255,0.4)',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
              ← 여름궁전
            </button>
          </FadeSlide>

          <div style={{position:'relative',zIndex:1,maxWidth:420,margin:'0 auto',
            padding:'72px 24px 80px',textAlign:'center'}}>

            {/* 헤드라인 */}
            <FadeSlide delay={250}>
              <h1 style={{fontSize:32,fontWeight:900,lineHeight:1.25,marginBottom:16,
                letterSpacing:'-0.03em',color:'#fff'}}>
                그 사람과 나,<br/>
                <span style={{background:'linear-gradient(135deg,#c4b5fd,#818cf8,#f9a8d4)',
                  WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                  진짜 맞는 사이인가요?
                </span>
              </h1>
            </FadeSlide>

            {/* 서브타이틀 */}
            <FadeSlide delay={400}>
              <p style={{color:'rgba(255,255,255,0.45)',fontSize:14,lineHeight:1.75,marginBottom:32}}>
                느낌만으로 관계를 판단하는 시대는 끝났습니다.<br/>
                당신 주변의 누군가는 이미 사주로 확인했습니다.
              </p>
            </FadeSlide>

            {/* 피처 카드 */}
            <FadeSlide delay={560}>
              <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:20,padding:'6px 0',marginBottom:28,textAlign:'left'}}>
                {FEATURES.map((f,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:14,
                    padding:'13px 20px',borderBottom:i<FEATURES.length-1?'1px solid rgba(255,255,255,0.05)':'none'}}>
                    <span style={{fontSize:22,flexShrink:0,marginTop:1}}>{f.icon}</span>
                    <div>
                      <p style={{fontSize:14,fontWeight:800,color:'#fff',margin:'0 0 3px'}}>{f.title}</p>
                      <p style={{fontSize:12,color:'rgba(255,255,255,0.4)',margin:0,lineHeight:1.5}}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeSlide>

            {/* 통계 */}
            <FadeSlide delay={720}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:28}}>
                {[
                  {val:'98%',label:'분석 정확도'},
                  {val:'3분',label:'소요 시간'},
                  {val:'무료',label:'완전 무료'},
                ].map((s,i)=>(
                  <div key={i} style={{textAlign:'center'}}>
                    <p style={{fontSize:22,fontWeight:900,color:'#fff',margin:'0 0 3px'}}>{s.val}</p>
                    <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',margin:0}}>{s.label}</p>
                  </div>
                ))}
              </div>
            </FadeSlide>

            {/* CTA */}
            <FadeSlide delay={900}>
              <button onClick={()=>setStep('form')} style={{
                width:'100%',padding:'20px 0',borderRadius:18,border:'none',cursor:'pointer',
                background:'linear-gradient(135deg,#7c3aed,#6366f1,#a855f7)',
                color:'#fff',fontSize:18,fontWeight:900,letterSpacing:'0.01em',
                boxShadow:'0 8px 40px rgba(124,58,237,0.55)',
              }}>
                💑 지금 궁합 확인하기
              </button>
              <p style={{fontSize:12,color:'rgba(255,255,255,0.2)',marginTop:12}}>
                가입 없음 · 광고 없음 · 완전 무료
              </p>
            </FadeSlide>
          </div>
        </div>
      )}

      {/* ══ FORM + RESULT ══ */}
      {(step==='form'||step==='result')&&(
        <div>
          <div style={{padding:'22px 18px 0',maxWidth:520,margin:'0 auto'}}>
            <button onClick={()=>{if(step==='result'){setResult(null);setStep('form');}else setStep('entry');}}
              style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',fontSize:13,cursor:'pointer',padding:0,fontFamily:'inherit'}}>
              ← {step==='result'?'다시 입력':'처음으로'}
            </button>
          </div>

          <div style={{maxWidth:520,margin:'0 auto',padding:'18px 16px 80px'}} id={step==='result'?'gunghap-result':undefined}>
            {step==='form'?(
              <>
                <div style={{textAlign:'center',marginBottom:22}}>
                  <h1 style={{fontSize:24,fontWeight:900,lineHeight:1.35,marginBottom:10}}>
                    {selectedRelation?selectedRelation.formTitle:'그 사람과 나,'}<br/>
                    <span style={{color:'#a78bfa'}}>
                      {selectedRelation?selectedRelation.formSub:'진짜 내 편인가요?'}
                    </span>
                  </h1>
                  <p style={{color:'rgba(255,255,255,0.45)',fontSize:13,lineHeight:1.6}}>
                    조후·삼합·합충·원진살·바람기 — <strong style={{color:'rgba(255,255,255,0.7)'}}>사주가 처음부터 알고 있었습니다</strong>
                  </p>
                </div>

                {/* 관계 선택 드롭다운 */}
                <div style={{marginBottom:18}}>
                  <p style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,
                    letterSpacing:'0.12em',marginBottom:8}}>어떤 관계인가요?</p>
                  <div style={{position:'relative'}}>
                    <select
                      value={relationType}
                      onChange={e=>setRelationType(e.target.value)}
                      style={{
                        width:'100%',padding:'13px 40px 13px 14px',
                        border:'1.5px solid rgba(167,139,250,0.35)',
                        borderRadius:12,fontSize:14,fontWeight:700,
                        background:'rgba(167,139,250,0.08)',
                        color:relationType?'#c4b5fd':'rgba(255,255,255,0.35)',
                        outline:'none',cursor:'pointer',
                        appearance:'none' as const,fontFamily:'inherit',
                      }}
                    >
                      <option value="" style={{background:'#1a1a2e',color:'rgba(255,255,255,0.5)'}}>
                        관계를 선택하세요
                      </option>
                      {RELATION_TYPES.map(rt=>(
                        <option key={rt.id} value={rt.id} style={{background:'#1a1a2e',color:'#fff'}}>
                          {rt.emoji} {rt.label}
                        </option>
                      ))}
                    </select>
                    <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',
                      color:'rgba(255,255,255,0.3)',fontSize:10,pointerEvents:'none'}}>▼</span>
                  </div>
                </div>

                <ProfilePicker onSelect={p => setP1({
                  name: p.name || '',
                  birthData: {
                    ...defaultBirthData(p.gender),
                    gender: p.gender,
                    birthYear: p.birthYear || '',
                    birthMonth: p.birthMonth || '',
                    birthDay: p.birthDay || '',
                    birthHour: p.birthHourUnknown ? null : p.birthHour,
                    birthMinute: null,
                    useJajasi: false,
                  },
                })} />
                <div style={{background:'rgba(255,255,255,0.04)',borderRadius:18,padding:'18px 16px',border:'1px solid rgba(255,255,255,0.07)',marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <p style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,letterSpacing:'0.12em',margin:0}}>나</p>
                    <button type="button" onClick={fillP1} style={{fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid rgba(167,139,250,0.35)',background:'rgba(167,139,250,0.08)',color:'#c4b5fd',borderRadius:20,padding:'4px 12px'}}>내 사주로 채우기</button>
                  </div>
                  <NameInput defaultValue={p1.name} onBlur={v=>setP1({...p1,name:v})} style={{...inp(),marginBottom:12}} />
                  <BirthInputForm value={p1.birthData} onChange={v=>setP1({...p1,birthData:v})} label="나" accent="#f43f5e" showName={false} />
                </div>
                <div style={{textAlign:'center',padding:'8px 0',fontSize:14,color:'rgba(255,255,255,0.2)',fontWeight:900}}>
                  {selectedRelation?`${selectedRelation.emoji} ${selectedRelation.label} 궁합`:'VS'}
                </div>
                <div style={{background:'rgba(255,255,255,0.04)',borderRadius:18,padding:'18px 16px',border:'1px solid rgba(255,255,255,0.07)'}}>
                  <p style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,letterSpacing:'0.12em',margin:'0 0 12px'}}>
                    {selectedRelation?.p2Label||'상대방'}
                  </p>
                  <NameInput defaultValue={p2.name} onBlur={v=>setP2({...p2,name:v})} style={{...inp(),marginBottom:12}} />
                  <BirthInputForm value={p2.birthData} onChange={v=>setP2({...p2,birthData:v})} label="상대방" accent="#818cf8" showName={false} />
                </div>
                <button onClick={calc} style={{
                  width:'100%',marginTop:18,padding:'18px',borderRadius:16,border:'none',
                  background:'linear-gradient(135deg,#7c3aed,#6366f1)',color:'#fff',
                  fontSize:16,fontWeight:900,cursor:'pointer',
                  boxShadow:'0 8px 28px rgba(124,58,237,0.45)'}}>
                  💑 사주 궁합 분석하기
                </button>
                <p style={{textAlign:'center',color:'rgba(255,255,255,0.18)',fontSize:12,marginTop:10}}>
                  출생시간 입력 시 더 정확 · 모든 성별 조합 가능
                </p>
              </>
            ):(result&&(
              <>
            {/* 점수 */}
            <div style={{textAlign:'center',marginBottom:20}}>
              <div style={{fontSize:44,marginBottom:4}}>{result.gradeEmoji}</div>
              {selectedRelation&&(
                <div style={{marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:700,padding:'3px 12px',borderRadius:100,
                    background:'rgba(167,139,250,0.15)',border:'1px solid rgba(167,139,250,0.3)',color:'#c4b5fd'}}>
                    {selectedRelation.emoji} {selectedRelation.label} 궁합
                  </span>
                </div>
              )}
              <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',marginBottom:4}}>
                {p1.name}({p1.birthData.birthYear}) {p1.birthData.gender==='male'?'👨':'👩'} &nbsp;+&nbsp; {p2.name}({p2.birthData.birthYear}) {p2.birthData.gender==='male'?'👨':'👩'}
              </div>
              <div style={{width:120,height:120,borderRadius:'50%',margin:'12px auto',
                background:`conic-gradient(${result.gradeColor} ${result.totalScore}%, rgba(255,255,255,0.04) 0%)`,
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div style={{width:94,height:94,borderRadius:'50%',background:'#0d0d1a',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:28,fontWeight:900,color:result.gradeColor,lineHeight:1}}>{result.totalScore}</span>
                  <span style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>/ 99</span>
                </div>
              </div>
              <div style={{fontSize:17,fontWeight:900,color:result.gradeColor,marginBottom:5}}>{result.grade}</div>
              <div style={{fontSize:14,fontWeight:800,marginBottom:5}}>{result.gradeTitle}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.45)',lineHeight:1.6}}>{result.gradeDesc}</div>
              <SaveProfilePrompt
                name={p1.name}
                birthYear={Number(p1.birthData.birthYear) || 0}
                birthMonth={Number(p1.birthData.birthMonth) || 0}
                birthDay={Number(p1.birthData.birthDay) || 0}
                birthHour={p1.birthData.birthHour}
                birthHourUnknown={p1.birthData.birthHour === null}
                gender={p1.birthData.gender}
              />
            </div>

            {/* 사주 */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
              {[{r:result.r1,p:p1},{r:result.r2,p:p2}].map(({r,p:pp},i)=>(
                <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'12px',border:'1px solid rgba(255,255,255,0.06)'}}>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:5,fontWeight:700}}>{pp.name}</p>
                  <p style={{fontSize:12,color:'rgba(255,255,255,0.7)',fontFamily:'monospace',letterSpacing:'0.06em',marginBottom:3}}>{r.fourPillars}</p>
                  <p style={{fontSize:10,color:r.yongshin.strength==='신강'?'#ff9f43':'#54a0ff',marginBottom:1}}>{r.yongshin.strength} 용신:{r.yongshin.yongshin}</p>
                </div>
              ))}
            </div>

            {/* 12운성 관계 에너지 */}
            {(()=>{
              const pd1=result.r1.pillarsDetail, pd2=result.r2.pillarsDetail;
              const uu1=pd1.day.uunseong, uu2=pd2.day.uunseong;
              const d1=uu1?UUNSEONG_COMPAT[uu1]:null, d2=uu2?UUNSEONG_COMPAT[uu2]:null;
              if(!d1&&!d2) return null;
              return (
                <div style={{borderRadius:15,padding:'16px',marginBottom:12,
                  background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <p style={{fontSize:13,fontWeight:900,color:'#ffd700',marginBottom:10}}>☯ 일주 12운성 관계 에너지</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                    {[{name:p1.name,uu:uu1,d:d1},{name:p2.name,uu:uu2,d:d2}].map((x,i)=>x.d&&(
                      <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:'10px',
                        border:x.d.smj?'1px solid rgba(248,113,113,0.25)':'1px solid rgba(255,255,255,0.06)'}}>
                        <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',margin:'0 0 4px'}}>{x.name}</p>
                        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:5,flexWrap:'wrap'}}>
                          <span style={{fontSize:13,fontWeight:900,color:x.d.color}}>{x.uu}</span>
                          {x.d.smj&&<span style={{fontSize:9,background:'rgba(248,113,113,0.2)',color:'#fca5a5',
                            border:'1px solid rgba(248,113,113,0.25)',borderRadius:4,padding:'1px 5px'}}>사묘절</span>}
                        </div>
                        <p style={{fontSize:10,color:x.d.color,marginBottom:4,fontWeight:700}}>{x.d.keyword}</p>
                        <p style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.5,margin:0}}>{x.d.desc}</p>
                      </div>
                    ))}
                  </div>
                  {(d1?.smj||d2?.smj)&&(
                    <div style={{background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',
                      borderRadius:8,padding:'8px 12px'}}>
                      <p style={{fontSize:11,color:'#fca5a5',lineHeight:1.5,margin:0}}>
                        ⚠️ 사묘절(死墓絶) 에너지: 일간의 기력이 소진·정체·단절되는 운성입니다.
                        관계에서 에너지 소모가 크거나 표현이 위축될 수 있으니 서로 배려가 필요합니다.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 지장간 숨은 궁합 에너지 */}
            {(()=>{
              const pd1=result.r1.pillarsDetail, pd2=result.r2.pillarsDetail;
              const jj1=pd1.day.jj, jj2=pd2.day.jj;
              const desc1=jj1?JIJANGAN_COMPAT[jj1]:null, desc2=jj2?JIJANGAN_COMPAT[jj2]:null;
              if(!desc1&&!desc2) return null;
              return (
                <div style={{borderRadius:15,padding:'16px',marginBottom:12,
                  background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <p style={{fontSize:13,fontWeight:900,color:'#ffd700',marginBottom:4}}>🌀 지장간 — 숨은 궁합 에너지</p>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:10,lineHeight:1.5}}>
                    일지(日支) 안에 숨어 있는 천간의 기운이 상대에게 어떻게 작용하는지 보여줍니다.
                  </p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {([{name:p1.name,jj:jj1,desc:desc1},{name:p2.name,jj:jj2,desc:desc2}] as {name:string;jj:string;desc:string|null}[]).map((x,i)=>x.desc&&(
                      <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:'10px',
                        border:'1px solid rgba(255,255,255,0.06)'}}>
                        <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',margin:'0 0 3px'}}>{x.name}</p>
                        <p style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.7)',margin:'0 0 5px'}}>일지 {x.jj}</p>
                        <p style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.5,margin:0}}>{x.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ① 조후 궁합 */}
            <div style={{borderRadius:15,padding:'16px',marginBottom:12,
              border:`1.5px solid ${result.johu.grade==='최상'?'rgba(16,172,132,0.4)':result.johu.grade==='위험'?'rgba(238,90,36,0.4)':'rgba(255,255,255,0.1)'}`,
              background:result.johu.grade==='최상'?'rgba(16,172,132,0.06)':result.johu.grade==='위험'?'rgba(238,90,36,0.06)':'rgba(255,255,255,0.03)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:900,color:'#ffd700'}}>🌡️ 조후 궁합 (가장 중요)</span>
                <span style={{fontSize:12,fontWeight:800,
                  color:result.johu.score>=20?'#10ac84':result.johu.score>=10?'#ffd700':result.johu.score>=0?'#54a0ff':'#ee5a24'}}>
                  {result.johu.score>=0?'+':''}{Math.round(result.johu.score*1.3)}
                </span>
              </div>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <div style={{flex:1,background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'8px',textAlign:'center'}}>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:3}}>{p1.name}</p>
                  <p style={{fontSize:14,fontWeight:700}}>{JOHU_LABEL[result.johu.g1 as string]}</p>
                </div>
                <div style={{display:'flex',alignItems:'center',color:'rgba(255,255,255,0.2)',fontSize:18}}>↔</div>
                <div style={{flex:1,background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'8px',textAlign:'center'}}>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:3}}>{p2.name}</p>
                  <p style={{fontSize:14,fontWeight:700}}>{JOHU_LABEL[result.johu.g2 as string]}</p>
                </div>
              </div>
              <p style={{fontSize:13,color:'rgba(255,255,255,0.65)',lineHeight:1.6,margin:0}}>{result.johu.desc}</p>
            </div>

            {/* ② 삼합 크로스 */}
            {result.samhap.length>0&&(
              <div style={{borderRadius:15,padding:'16px',marginBottom:12,
                background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <p style={{fontSize:13,fontWeight:900,color:'#ffd700',marginBottom:10}}>🔺 삼합 분석</p>
                {result.samhap.map((sh,i)=>(
                  <div key={i} style={{borderBottom:i<result.samhap.length-1?'1px solid rgba(255,255,255,0.05)':'none',paddingBottom:8,marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <p style={{fontSize:13,color:'rgba(255,255,255,0.7)',lineHeight:1.5,margin:0,flex:1}}>{sh.desc}</p>
                      <span style={{fontSize:12,fontWeight:800,flexShrink:0,marginLeft:8,
                        color:sh.score>=0?'#10ac84':'#ee5a24'}}>{sh.score>=0?'+':''}{sh.score}</span>
                    </div>
                    {sh.broken.length>0&&(
                      <p style={{fontSize:12,color:'#ff6b6b',margin:'4px 0 0'}}>
                        ⚡ {sh.broken.join(' ')} → 삼합 에너지가 충격받음
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ③ 바람기 */}
            <div style={{borderRadius:15,padding:'16px',marginBottom:12,
              background:result.baram.total>=3?'rgba(255,107,107,0.08)':'rgba(255,255,255,0.03)',
              border:`1px solid ${result.baram.total>=3?'rgba(255,107,107,0.3)':'rgba(255,255,255,0.08)'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <p style={{fontSize:13,fontWeight:900,color:result.baram.total>=2?'#ff6b6b':'rgba(255,255,255,0.6)',margin:0}}>
                  {result.baram.emoji} 바람기 분석
                </p>
                <span style={{fontSize:12,fontWeight:700,
                  color:result.baram.grade==='안전'?'#10ac84':result.baram.grade==='주의'?'#feca57':'#ff6b6b'}}>
                  {result.baram.grade}
                </span>
              </div>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                {([{name:p1.name,dohwa:result.baram.p1dohwa,hongyeom:result.baram.p1hongyeom},
                  {name:p2.name,dohwa:result.baram.p2dohwa,hongyeom:result.baram.p2hongyeom}]).map((b,i)=>(
                  <div key={i} style={{flex:1,background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'8px'}}>
                    <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:4}}>{b.name}</p>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {b.dohwa.map((_,j)=><span key={j} style={{fontSize:10,background:'rgba(255,107,107,0.3)',color:'#ffaaaa',borderRadius:4,padding:'2px 6px'}}>도화살</span>)}
                      {b.hongyeom&&<span style={{fontSize:10,background:'rgba(255,200,50,0.3)',color:'#ffe082',borderRadius:4,padding:'2px 6px'}}>홍염살</span>}
                      {b.dohwa.length===0&&!b.hongyeom&&<span style={{fontSize:11,color:'rgba(255,255,255,0.25)'}}>없음</span>}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.5,margin:0}}>{result.baram.desc}</p>
              {(()=>{
                const fs1=getFaithfulSpouseAnalysis(result.r1);
                const fs2=getFaithfulSpouseAnalysis(result.r2);
                if(!fs1&&!fs2) return null;
                return (
                  <p style={{fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.5,margin:'8px 0 0',paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                    {fs1&&`${p1.name} ▸ ${fs1.desc}`}
                    {fs1&&fs2&&<br/>}
                    {fs2&&`${p2.name} ▸ ${fs2.desc}`}
                  </p>
                );
              })()}
            </div>

            {/* ④ 주별 분석 */}
            <div style={{marginBottom:12}}>
              <p style={{fontSize:12,color:'rgba(255,255,255,0.35)',fontWeight:700,letterSpacing:'0.1em',marginBottom:6}}>주별 합충 분석</p>
              <p style={{fontSize:11,color:'rgba(255,255,255,0.22)',lineHeight:1.6,marginBottom:10}}>
                충(沖)은 무조건 나쁜 게 아닙니다. 두 사람 사이에 강한 자극과 긴장을 만들어 처음엔 강하게 끌리게 하는 에너지이기도 합니다. 자극추구형 커플에게는 충이 오히려 케미의 원천이 됩니다.
              </p>
              {result.pillars.map((pl,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,0.03)',borderRadius:13,padding:'12px 14px',
                  marginBottom:8,border:`1px solid ${pl.subScore>=0?'rgba(16,172,132,0.15)':'rgba(238,90,36,0.2)'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:pl.events.length?8:0}}>
                    <div>
                      <span style={{fontSize:12,fontWeight:800,color:pl.label==='일주'?'#ffd700':'rgba(255,255,255,0.65)'}}>
                        {pl.label}{pl.label==='일주'?' ✦':''}
                      </span>
                      <span style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginLeft:8,fontFamily:'monospace'}}>
                        {pl.cg1}{pl.jj1} ↔ {pl.cg2}{pl.jj2}
                      </span>
                    </div>
                    <span style={{fontSize:12,fontWeight:800,color:pl.subScore>=0?'#10ac84':'#ee5a24'}}>
                      {pl.subScore>=0?'+':''}{Math.round(pl.subScore)}
                    </span>
                  </div>
                  {pl.events.length===0&&<p style={{fontSize:11,color:'rgba(255,255,255,0.2)',margin:0}}>특별 관계 없음</p>}
                  {pl.events.map((ev,j)=>(
                    <div key={j} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                      padding:'4px 0',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <span style={{fontSize:10,background:gradeColors[ev.type]||'#666',color:'#fff',borderRadius:3,padding:'1px 5px',fontWeight:700}}>{ev.type}</span>
                        <span style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>{ev.desc}</span>
                      </div>
                      <span style={{fontSize:11,color:ev.score>=0?'#10ac84':'#ee5a24',fontWeight:700,flexShrink:0,marginLeft:6}}>
                        {ev.score>=0?'+':''}{Math.round(ev.score)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* ④-2 합충 다이어그램 — 같은 자리(연주-연주·월주-월주·일주-일주·시주-시주)끼리만 비교 */}
            <HapchungDiagram
              mySaju={result.r1} targetSaju={result.r2}
              myName={p1.name || "나"} targetName={p2.name || "그 사람"}
            />

            {/* ⑤ 용신/오행 */}
            <div style={{background:'rgba(255,255,255,0.03)',borderRadius:13,padding:'14px',marginBottom:14,border:'1px solid rgba(255,255,255,0.06)'}}>
              <p style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.35)',marginBottom:8,letterSpacing:'0.1em'}}>용신·오행 조화</p>
              <p style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginBottom:5,lineHeight:1.5}}>{result.yongsinDesc}</p>
              <p style={{fontSize:12,color:'rgba(255,255,255,0.45)',lineHeight:1.5,marginBottom:8}}>{result.ohaengDesc}</p>
              {(()=>{
                const sf1=getSpouseFortuneAnalysis(result.r1,p1.birthData.gender);
                const sf2=getSpouseFortuneAnalysis(result.r2,p2.birthData.gender);
                const text1=sf1.points.join(" ");
                const text2=sf2.points.join(" ");
                if(!text1&&!text2) return null;
                return (
                  <div style={{paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                    {text1&&<p style={{fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:text2?6:0}}>{p1.name} ▸ {text1}</p>}
                    {text2&&<p style={{fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.6,margin:0}}>{p2.name} ▸ {text2}</p>}
                  </div>
                );
              })()}
            </div>

            {/* 끌리는 이유 */}
            {(()=>{
              const WHY_LIKE_MAP: Record<string,string> = {
                비견:"대등하게 맞서는 자존심과 독립심이 상대를 자극합니다. 질 수 없다는 본능이 끌림으로 이어집니다.",
                겁재:"강한 에너지와 매력이 상대의 소유욕을 자극합니다. 가지고 싶어지는 존재로 보입니다.",
                식신:"따뜻함과 여유가 상대를 편하게 만듭니다. 옆에 있으면 행복하다고 느낍니다.",
                상관:"자유로움과 독창성이 상대를 매혹합니다. 예측불허한 매력에 빠져듭니다.",
                정재:"안정감과 신뢰감이 상대가 원하는 파트너상과 맞습니다.",
                편재:"다채로운 매력과 자유로움이 상대를 설레게 합니다. 잡고 싶은 존재로 느껴집니다.",
                정관:"원칙과 품격이 상대가 추구하는 파트너와 일치합니다.",
                편관:"강인함과 카리스마가 상대의 본능을 자극합니다.",
                정인:"지적 깊이와 포용력이 상대를 안심시킵니다. 기대고 싶어집니다.",
                편인:"신비로움과 독립성이 상대의 호기심을 끊임없이 자극합니다.",
              };
              const ss1 = result.r1.pillarsDetail.day.sipseongJj;
              const ss2 = result.r2.pillarsDetail.day.sipseongJj;
              const SIPSEONG_PLAIN: Record<string,string> = {
                비견:"대등한 자존심", 겁재:"강한 에너지", 식신:"따뜻한 여유", 상관:"자유로운 독창성",
                정재:"안정과 신뢰", 편재:"다채로운 매력", 정관:"원칙과 품격", 편관:"강인한 카리스마",
                정인:"지적인 포용력", 편인:"신비로운 독립성",
              };
              return (
                <div style={{borderRadius:15,padding:'16px',marginBottom:12,
                  background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <p style={{fontSize:13,fontWeight:900,color:'#ffd700',marginBottom:4}}>💘 사주로 보는 서로 끌리는 이유</p>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:12,lineHeight:1.5}}>
                    태어난 날의 기운을 기준으로 — 상대의 그 기운이 나에게 어떻게 작용하는지 보여줍니다.
                  </p>
                  <div style={{marginBottom:10}}>
                    <p style={{fontSize:12,fontWeight:800,color:'#f9a8d4',marginBottom:4}}>
                      {p1.name}이 {p2.name}에게 끌리는 이유
                    </p>
                    <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:5}}>
                      {p2.name}의 태어난 날 기운: <span style={{color:'#c4b5fd',fontWeight:700}}>{ss2?(SIPSEONG_PLAIN[ss2]||ss2):"—"}</span>
                    </p>
                    <p style={{fontSize:13,color:'rgba(255,255,255,0.65)',lineHeight:1.6}}>
                      {ss2&&WHY_LIKE_MAP[ss2]?WHY_LIKE_MAP[ss2]:`${p2.name}의 일지 에너지가 ${p1.name}에게 독특한 방식으로 끌림을 만들어냅니다.`}
                    </p>
                  </div>
                  <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:10}}>
                    <p style={{fontSize:12,fontWeight:800,color:'#93c5fd',marginBottom:4}}>
                      {p2.name}이 {p1.name}에게 끌리는 이유
                    </p>
                    <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:5}}>
                      {p1.name}의 태어난 날 기운: <span style={{color:'#c4b5fd',fontWeight:700}}>{ss1?(SIPSEONG_PLAIN[ss1]||ss1):"—"}</span>
                    </p>
                    <p style={{fontSize:13,color:'rgba(255,255,255,0.65)',lineHeight:1.6}}>
                      {ss1&&WHY_LIKE_MAP[ss1]?WHY_LIKE_MAP[ss1]:`${p1.name}의 일지 에너지가 ${p2.name}에게 독특한 방식으로 끌림을 만들어냅니다.`}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* 우리의 마찰 원인은? */}
            {(()=>{
              const negEvents = result.pillars.flatMap(pl=>pl.events.filter(e=>e.score<0).map(e=>({...e,label:pl.label})));
              negEvents.sort((a,b)=>a.score-b.score);
              const top = negEvents.slice(0,3);
              if(top.length===0 && result.johu.score>=0) return null;
              const FRICTION_ADVICE: Record<string,string> = {
                충:"서로 다른 방향으로 끌어당기는 힘입니다. 같은 목표를 두고도 방식이 정반대라 부딪힙니다. 결정 전에 '왜 그렇게 생각해?'를 먼저 물어보는 습관이 갈등을 줄여줍니다.",
                원진:"이유 없이 서운하고 답답한 감정이 쌓이는 관계입니다. 작은 말투 하나에도 예민해질 수 있으니, 감정이 격해졌을 땐 즉시 대화하지 말고 시간을 두는 게 낫습니다.",
                해:"서로의 좋은 의도가 엇갈려서 오해로 번지는 구조입니다. 말보다 행동으로, 행동보다 명확한 말로 확인하는 게 도움이 됩니다.",
                파:"꾸준히 쌓아온 것이 예상치 못한 순간에 흔들리는 기운입니다. 큰 결정(이사, 동거, 재정 합치기 등)은 충분히 시간을 두고 결정하세요.",
                형:"날카로운 신경전이 발생하기 쉬운 조합입니다. 피곤하거나 컨디션이 안 좋을 때 대화는 잠시 미루는 게 현명합니다.",
                암충:"겉으로는 멀쩡한데 속으로 미묘하게 안 맞는 부분이 있습니다. 평소엔 괜찮다가 특정 주제(돈, 가족 등)에서만 갑자기 부딪힐 수 있습니다.",
              };
              return (
                <div style={{borderRadius:15,padding:'16px',marginBottom:12,
                  background:'rgba(238,90,36,0.06)',border:'1px solid rgba(238,90,36,0.2)'}}>
                  <p style={{fontSize:13,fontWeight:900,color:'#ff9f43',marginBottom:4}}>⚡ 우리의 마찰 원인은?</p>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:10,lineHeight:1.5}}>
                    두 사람의 사주에서 가장 강하게 부딪히는 지점과, 그걸 다루는 방법입니다.
                  </p>
                  {top.length===0 ? (
                    <p style={{fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.6,margin:0}}>
                      {result.johu.desc}<br/>큰 충돌 요소는 적지만, 같은 기운끼리는 자극이 부족해 자칫 권태로워질 수 있으니 의도적으로 새로운 자극을 만들어보세요.
                    </p>
                  ):top.map((ev,i)=>(
                    <div key={i} style={{marginBottom:i<top.length-1?10:0,paddingBottom:i<top.length-1?10:0,
                      borderBottom:i<top.length-1?'1px solid rgba(255,255,255,0.06)':'none'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                        <span style={{fontSize:10,background:gradeColors[ev.type]||'#666',color:'#fff',borderRadius:3,padding:'1px 5px',fontWeight:700}}>{ev.type}</span>
                        <span style={{fontSize:12,fontWeight:800,color:'rgba(255,255,255,0.7)'}}>{(ev as any).label} — {ev.desc}</span>
                      </div>
                      <p style={{fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.6,margin:0}}>
                        {FRICTION_ADVICE[ev.type]||"서로 다른 기운이 부딪히는 지점입니다. 차이를 인정하고 거리를 조절하는 것이 핵심입니다."}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div style={{marginBottom:12}}>
              <SipseongInsight result={result.r1} title={`${p1.name}의 핵심 기운`} />
              <SipseongInsight result={result.r2} title={`${p2.name}의 핵심 기운`} />
            </div>

            {/* 공유 */}
            <div style={{background:'rgba(255,107,107,0.06)',border:'1px solid rgba(255,107,107,0.15)',borderRadius:12,padding:'12px',marginBottom:12,textAlign:'center'}}>
              <p style={{color:'#ffaaaa',fontSize:13,margin:'0 0 4px',fontWeight:700}}>내 친구의 궁합도 확인해보세요 →</p>
              <p style={{color:'rgba(255,255,255,0.3)',fontSize:11,margin:0}}>링크 공유하고 같이 분석해보기</p>
            </div>
            <button onClick={()=>{
              if(navigator.share) navigator.share({title:'사주 궁합',text:`${p1.name}+${p2.name} 궁합 ${result.totalScore}점(${result.grade})`,url:window.location.href});
              else{navigator.clipboard.writeText(window.location.href);alert('링크 복사됨!');}
            }} style={{width:'100%',padding:'13px',borderRadius:12,border:'none',
              background:'linear-gradient(135deg,#6c5ce7,#a29bfe)',color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer',marginBottom:10}}>
              🔗 결과 공유하기
            </button>
            <button onClick={()=>{setResult(null);setStep('form');}} style={{width:'100%',padding:'12px',borderRadius:12,
              border:'1px solid rgba(255,255,255,0.08)',background:'transparent',color:'rgba(255,255,255,0.35)',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
              다시 하기
            </button>
            <ShareImageButton targetId="gunghap-result" fileName="궁합" />
              </>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.5)}}
        select option{background:#1a1a2e;color:#fff}
        input::placeholder{color:rgba(255,255,255,0.2)}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
      `}</style>
    </div>
  );
}
