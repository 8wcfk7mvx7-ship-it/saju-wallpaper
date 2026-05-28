"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";

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
    const desc=`${branches.join("")} (${el}국) — ${isComplete?"완전삼합":"반합"}${broken.length>0?` ⚡${broken.join(", ")}으로 일부 파괴`:""}`;;
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
  if(isPair(JIJI_CHUNG,jj1,jj2)) ev.push({type:'충',desc:`지지충 ${jj1}↔${jj2}`,score:-14*weight});
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
interface PI{name:string;gender:'male'|'female';year:string;month:string;day:string;birthTime:BirthTimeValue;birthPlace:string;}
const empty=():PI=>({name:'',gender:'male',year:'',month:'',day:'',birthTime:{hour:null,minute:null,unknown:false,useJajasi:false},birthPlace:'서울'});


/* ─── 엔트리 랜딩 애니메이션 ─── */
const ENTRY_LINES=[
  {text:"원진살 커플은",delay:200,big:false},
  {text:"노력해도 결국 깨집니다.",delay:750,big:true},
  {text:"지금 사귀는 사람,",delay:1500,big:false},
  {text:"내 에너지를 갉아먹는 사주인가요?",delay:2200,big:true},
];

function EntryLine({text,delay,big}:{text:string;delay:number;big:boolean}){
  const [v,setV]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setV(true),delay);return()=>clearTimeout(t);},[delay]);
  return(
    <p style={{
      margin:'0 0 16px',
      opacity:v?1:0,
      transform:v?'translateY(0)':'translateY(22px)',
      transition:`opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      fontSize:big?28:20,
      fontWeight:big?900:500,
      letterSpacing:'-0.02em',
      lineHeight:1.2,
      background:big?'linear-gradient(135deg,#c4b5fd,#818cf8,#f9a8d4)':'none',
      WebkitBackgroundClip:big?'text':'unset',
      WebkitTextFillColor:big?'transparent':'rgba(255,255,255,0.6)',
      color:big?'transparent':'rgba(255,255,255,0.6)',
    }}>{text}</p>
  );
}

export default function GunghapPage(){
  const [p1,setP1]=useState<PI>(empty());
  const [p2,setP2]=useState<PI>(empty());
  const [result,setResult]=useState<null|{
    johu:JohuResult; samhap:SamhapResult[]; pillars:PillarResult[];
    baram:BaramResult; yongsinDesc:string; ohaengDesc:string;
    totalScore:number; grade:string; gradeColor:string; gradeEmoji:string;
    gradeTitle:string; gradeDesc:string;
    r1:ReturnType<typeof analyzeSaju>; r2:ReturnType<typeof analyzeSaju>;
  }>(null);
  const [counter]=useState(()=>Math.floor(Math.random()*1200)+1800);
  const [showEntryBtn,setShowEntryBtn]=useState(false);
  const [step,setStep]=useState<'entry'|'form'|'result'>('entry');
  useEffect(()=>{const t=setTimeout(()=>setShowEntryBtn(true),3400);return()=>clearTimeout(t);},[]);

  const fillP1=useCallback(()=>{
    const saved=loadSajuData();
    if(!saved) return;
    setP1({
      name:saved.name||'',gender:saved.gender||'male',
      year:String(saved.birthYear),month:String(saved.birthMonth),day:String(saved.birthDay),
      birthTime:{
        hour:saved.birthHourUnknown?null:saved.birthHour,
        minute:saved.birthHourUnknown?null:saved.birthMinute,
        unknown:saved.birthHourUnknown||false,
        useJajasi:saved.useJajasi||false,
      },
      birthPlace:saved.birthPlace||'서울',
    });
  },[]);

  const calc=()=>{
    const y1=+p1.year,m1=+p1.month,d1=+p1.day;
    const y2=+p2.year,m2=+p2.month,d2=+p2.day;
    if(!p1.name||!p2.name||!y1||!m1||!d1||!y2||!m2||!d2) return;
    const h1=p1.birthTime.unknown?null:p1.birthTime.hour;
    const min1=p1.birthTime.unknown?null:(p1.birthTime.minute??0);
    const h2=p2.birthTime.unknown?null:p2.birthTime.hour;
    const min2=p2.birthTime.unknown?null:(p2.birthTime.minute??0);
    const r1=analyzeSaju({birthYear:y1,birthMonth:m1,birthDay:d1,birthHour:h1,birthMinute:h1!=null?min1:null,name:p1.name,gender:p1.gender,birthPlace:p1.birthPlace||'서울',style:'auto',productType:'report',useJajasi:p1.birthTime.useJajasi});
    const r2=analyzeSaju({birthYear:y2,birthMonth:m2,birthDay:d2,birthHour:h2,birthMinute:h2!=null?min2:null,name:p2.name,gender:p2.gender,birthPlace:p2.birthPlace||'서울',style:'auto',productType:'report',useJajasi:p2.birthTime.useJajasi});
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
    setStep('result');
  };

  const inp=(s?:React.CSSProperties):React.CSSProperties=>({
    width:'100%',padding:'11px 13px',border:'1.5px solid rgba(255,255,255,0.1)',
    borderRadius:10,fontSize:13,background:'rgba(255,255,255,0.05)',
    color:'#fff',outline:'none',boxSizing:'border-box',fontFamily:'inherit',...s,
  });
  const selStyle=(s?:React.CSSProperties):React.CSSProperties=>({...inp(),appearance:'none' as const,...s});

  const gradeColors:{[k:string]:string}={합:'#10ac84',삼합:'#10ac84',암합:'#4ecdc4',충:'#ee5a24',원진:'#c0392b',해:'#e67e22',파:'#e67e22',형:'#e74c3c',암충:'#e74c3c'};

  const Form=({p,setP,idx}:{p:PI;setP:(v:PI)=>void;idx:1|2})=>(
    <div style={{background:'rgba(255,255,255,0.04)',borderRadius:18,padding:'18px 16px',
      border:'1px solid rgba(255,255,255,0.07)',marginBottom:idx===1?12:0}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <p style={{color:'rgba(255,255,255,0.4)',fontSize:11,fontWeight:700,letterSpacing:'0.12em',margin:0}}>
          {idx===1?'첫 번째 사람':'두 번째 사람'}
        </p>
        {idx===1&&(
          <button type="button" onClick={fillP1} style={{
            fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid rgba(167,139,250,0.35)',
            background:'rgba(167,139,250,0.08)',color:'#c4b5fd',borderRadius:20,padding:'4px 12px',
          }}>내 사주로 채우기</button>
        )}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        {(['male','female'] as const).map(g=>(
          <button key={g} onClick={()=>setP({...p,gender:g})} style={{
            flex:1,padding:'9px 0',borderRadius:8,border:'1.5px solid',cursor:'pointer',fontSize:13,fontWeight:700,
            borderColor:p.gender===g?(g==='male'?'#4f8ef7':'#f97bb1'):'rgba(255,255,255,0.08)',
            background:p.gender===g?(g==='male'?'rgba(79,142,247,0.1)':'rgba(249,123,177,0.1)'):'transparent',
            color:p.gender===g?(g==='male'?'#7eb0ff':'#f9a8d4'):'rgba(255,255,255,0.35)'}}>
            {g==='male'?'👨 남성':'👩 여성'}
          </button>
        ))}
      </div>
      <input style={{...inp(),marginBottom:8}} placeholder="이름 또는 별명" value={p.name} onChange={e=>setP({...p,name:e.target.value})}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:7,marginBottom:10}}>
        <input style={inp()} placeholder="출생연도" type="number" value={p.year} onChange={e=>setP({...p,year:e.target.value})}/>
        <select style={selStyle()} value={p.month} onChange={e=>setP({...p,month:e.target.value})}>
          <option value="">월</option>
          {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}월</option>)}
        </select>
        <select style={selStyle()} value={p.day} onChange={e=>setP({...p,day:e.target.value})}>
          <option value="">일</option>
          {Array.from({length:31},(_,i)=><option key={i+1} value={i+1}>{i+1}일</option>)}
        </select>
      </div>
      <div style={{marginBottom:10}}>
        <p style={{color:'rgba(255,255,255,0.35)',fontSize:11,fontWeight:700,marginBottom:8}}>태어난 시간</p>
        <BirthTimePicker
          value={p.birthTime}
          onChange={bt=>setP({...p,birthTime:bt})}
          accent="violet"
        />
      </div>
      <input style={inp()} placeholder="출생 도시 (서울 / 부산 등)" value={p.birthPlace} onChange={e=>setP({...p,birthPlace:e.target.value})}/>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0d0d1a 0%,#1a1a2e 45%,#16213e 100%)',
      fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif",color:'#fff'}}>

      {/* ══ ENTRY — 애니메이션 엔트리 ══ */}
      {step==='entry'&&(
        <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',
          maxWidth:420,margin:'0 auto',padding:'0 28px 80px',textAlign:'center',position:'relative'}}>

          {/* 배경 글로우 */}
          <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
            <div style={{position:'absolute',top:'-15%',left:'-10%',width:520,height:520,
              borderRadius:'50%',background:'rgba(99,102,241,0.13)',filter:'blur(140px)'}}/>
            <div style={{position:'absolute',bottom:'-20%',right:'-10%',width:440,height:440,
              borderRadius:'50%',background:'rgba(244,114,182,0.10)',filter:'blur(120px)'}}/>
          </div>

          <div style={{position:'relative',zIndex:1,width:'100%'}}>
            <div style={{fontSize:54,marginBottom:48,
              filter:'drop-shadow(0 0 36px rgba(196,181,253,0.55))'}}>💑</div>

            <div style={{marginBottom:52}}>
              {ENTRY_LINES.map((l,i)=>(
                <EntryLine key={i} text={l.text} delay={l.delay} big={l.big}/>
              ))}
            </div>

            <div style={{fontSize:12,color:'rgba(255,255,255,0.22)',marginBottom:40,
              opacity:showEntryBtn?1:0,transition:'opacity 0.8s ease 200ms'}}>
              사주팔자 기반 궁합 분석 · 무료 · 3분
            </div>

            <div style={{
              opacity:showEntryBtn?1:0,
              transform:showEntryBtn?'translateY(0) scale(1)':'translateY(24px) scale(0.95)',
              transition:'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)',
            }}>
              <button onClick={()=>setStep('form')} style={{
                width:'100%',maxWidth:320,padding:'20px 0',borderRadius:18,border:'none',cursor:'pointer',
                background:'linear-gradient(135deg,#7c3aed,#6366f1)',
                color:'#fff',fontSize:18,fontWeight:900,letterSpacing:'0.01em',
                boxShadow:'0 8px 40px rgba(124,58,237,0.55)',
                display:'block',margin:'0 auto 16px',
              }}>
                시작하기 →
              </button>
              <p style={{fontSize:11,color:'rgba(255,255,255,0.18)'}}>가입 없음 · 광고 없음 · 완전 무료</p>
            </div>
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
          <div style={{textAlign:'center',padding:'14px 18px 0'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,
              background:'rgba(255,107,107,0.08)',border:'1px solid rgba(255,107,107,0.22)',
              borderRadius:100,padding:'6px 16px'}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#ff6b6b',display:'inline-block',animation:'pulse 1.5s infinite'}}/>
              <span style={{color:'#ff9f9f',fontSize:13,fontWeight:600}}>
                오늘 <strong style={{color:'#fff'}}>{counter.toLocaleString()}명</strong>이 확인했습니다
              </span>
            </div>
          </div>

          <div style={{maxWidth:520,margin:'0 auto',padding:'18px 16px 80px'}}>
            {step==='form'?(
              <>
                <div style={{textAlign:'center',marginBottom:22}}>
                  <h1 style={{fontSize:24,fontWeight:900,lineHeight:1.35,marginBottom:10}}>
                    지금 사귀는 사람,<br/><span style={{color:'#a78bfa'}}>진짜 내 편인가요?</span>
                  </h1>
                  <p style={{color:'rgba(255,255,255,0.45)',fontSize:13,lineHeight:1.6}}>
                    조후·삼합·합충·원진살·바람기 — <strong style={{color:'rgba(255,255,255,0.7)'}}>사주가 처음부터 알고 있었습니다</strong>
                  </p>
                </div>
                <div style={{background:'rgba(167,139,250,0.07)',border:'1px solid rgba(167,139,250,0.18)',
                  borderRadius:12,padding:'11px 16px',marginBottom:18,textAlign:'center'}}>
                  <p style={{color:'#c4b5fd',fontSize:13,margin:0,lineHeight:1.6}}>
                    ⚠️ 원진살 커플 + 조후 불일치 조합은<br/>
                    3년이 지나도 결국 <strong>서로를 갉아먹습니다</strong>
                  </p>
                </div>
                <Form p={p1} setP={setP1} idx={1}/>
                <div style={{textAlign:'center',padding:'8px 0',fontSize:18,color:'rgba(255,255,255,0.18)',fontWeight:900}}>VS</div>
                <Form p={p2} setP={setP2} idx={2}/>
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
              <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',marginBottom:4}}>
                {p1.name}({p1.year}) {p1.gender==='male'?'👨':'👩'} &nbsp;+&nbsp; {p2.name}({p2.year}) {p2.gender==='male'?'👨':'👩'}
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
                  <p style={{fontSize:14,fontWeight:700}}>{JOHU_LABEL[result.johu.g1]}</p>
                </div>
                <div style={{display:'flex',alignItems:'center',color:'rgba(255,255,255,0.2)',fontSize:18}}>↔</div>
                <div style={{flex:1,background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'8px',textAlign:'center'}}>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:3}}>{p2.name}</p>
                  <p style={{fontSize:14,fontWeight:700}}>{JOHU_LABEL[result.johu.g2]}</p>
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
                {[{name:p1.name,dohwa:result.baram.p1dohwa,hongyeom:result.baram.p1hongyeom},
                  {name:p2.name,dohwa:result.baram.p2dohwa,hongyeom:result.baram.p2hongyeom}].map((b,i)=>(
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
            </div>

            {/* ④ 주별 분석 */}
            <div style={{marginBottom:12}}>
              <p style={{fontSize:12,color:'rgba(255,255,255,0.35)',fontWeight:700,letterSpacing:'0.1em',marginBottom:8}}>주별 합충 분석</p>
              {result.pillars.map((pl,i)=>(
                <div key={i} style={{background:'rgba(255,255,255,0.03)',borderRadius:13,padding:'12px 14px',
                  marginBottom:8,border:`1px solid ${pl.subScore>=0?'rgba(16,172,132,0.15)':'rgba(238,90,36,0.2)'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:pl.events.length?8:0}}>
                    <div>
                      <span style={{fontSize:12,fontWeight:800,color:pl.label==='일주'?'#ffd700':'rgba(255,255,255,0.65)'}}>
                        {pl.label}{pl.label==='일주'?' ⭐':''}
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

            {/* ⑤ 용신/오행 */}
            <div style={{background:'rgba(255,255,255,0.03)',borderRadius:13,padding:'14px',marginBottom:14,border:'1px solid rgba(255,255,255,0.06)'}}>
              <p style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.35)',marginBottom:8,letterSpacing:'0.1em'}}>용신·오행 조화</p>
              <p style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginBottom:5,lineHeight:1.5}}>{result.yongsinDesc}</p>
              <p style={{fontSize:12,color:'rgba(255,255,255,0.45)',lineHeight:1.5}}>{result.ohaengDesc}</p>
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
