"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import StarShower from "@/components/StarShower";
import { analyzeSaju, calcDaewoon, calcSewoon, ILGAN_PERSONALITY, getSipseong, getUunseong, getDayPillar, getJijiRelations, CHEONGAN_ELEMENT } from "@/lib/saju";
import type { DaewoonResult, SewoonItem } from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";
import ProfilePicker from "@/components/ProfilePicker";
import SaveProfilePrompt from "@/components/SaveProfilePrompt";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

const PRICE = 15000;

// ─── 월건 계산 ────────────────────────────────────────────────────────────────
const _WOLJEON_BASE: Record<string, number> = { 갑:2, 기:2, 을:4, 경:4, 병:6, 신:6, 정:8, 임:8, 무:0, 계:0 };
const _CG_LIST = ["갑","을","병","정","무","기","경","신","임","계"];
const _JJ_LIST = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const _MONTH_JJ_IDX = [2,3,4,5,6,7,8,9,10,11,0,1];
function getMonthPillar(yearCg: string, month: number): { cg: string; jj: string } {
  const base = _WOLJEON_BASE[yearCg] ?? 0;
  const cgIdx = (base + (month - 1)) % 10;
  const jjIdx = _MONTH_JJ_IDX[month - 1];
  return { cg: _CG_LIST[cgIdx], jj: _JJ_LIST[jjIdx] };
}

const ELEMENT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  목: { bg: "#052e16", text: "#4ade80", border: "#14532d" },
  화: { bg: "#450a0a", text: "#f87171", border: "#7f1d1d" },
  토: { bg: "#2d1a00", text: "#fbbf24", border: "#78350f" },
  금: { bg: "#0f0e2e", text: "#a5b4fc", border: "#1e1b4b" },
  수: { bg: "#0a1f3a", text: "#60a5fa", border: "#0c2a4a" },
};

// 천간합(쌍의 첫번째가 결과 오행/색 기준), 천간충(쌍의 첫번째가 충을 당해 약해지는 쪽 — 그 오행 색을 사용)
const CG_HAP_PAIRS: { a: string; b: string; result: string }[] = [
  { a: "갑", b: "기", result: "토" },
  { a: "을", b: "경", result: "금" },
  { a: "병", b: "신", result: "수" },
  { a: "정", b: "임", result: "목" },
  { a: "무", b: "계", result: "화" },
];
const CG_CHUNG_PAIRS: [string, string][] = [["갑", "경"], ["을", "신"], ["병", "임"], ["정", "계"]];

const JIJI_REL_STYLE: Record<string, { label: string; color: string }> = {
  육합: { label: "육합", color: "#4ade80" },
  삼합: { label: "삼합", color: "#34d399" },
  충: { label: "충", color: "#f87171" },
  형: { label: "형", color: "#c084fc" },
  파: { label: "파", color: "#fb923c" },
  해: { label: "해", color: "#9ca3af" },
  원진: { label: "원진", color: "#f472b6" },
};

// 세운(또는 대운) 한 기둥과 원국 4기둥 사이의 합충형파 관계를 모두 찾는다
function getYearRelations(natal: { cg: string; jj: string }[], target: { cg: string; jj: string }) {
  const results: { label: string; color: string; desc: string }[] = [];

  // 천간합/충
  for (const p of natal) {
    for (const hap of CG_HAP_PAIRS) {
      if ((p.cg === hap.a && target.cg === hap.b) || (p.cg === hap.b && target.cg === hap.a)) {
        const color = ELEMENT_COLOR[hap.result]?.text || "#fbbf24";
        results.push({ label: `${hap.a}${hap.b}합`, color, desc: `원국 ${p.cg}와 ${target.cg}이 합을 이뤄 ${hap.result} 기운이 강해져요.` });
      }
    }
    for (const [a, b] of CG_CHUNG_PAIRS) {
      if ((p.cg === a && target.cg === b) || (p.cg === b && target.cg === a)) {
        const color = ELEMENT_COLOR[CHEONGAN_ELEMENT[a]]?.text || "#f87171";
        results.push({ label: `${a}${b}충`, color, desc: `원국 ${p.cg}와 ${target.cg}이 충돌해요. ${a}(${CHEONGAN_ELEMENT[a]}) 기운이 흔들려요.` });
      }
    }
  }

  // 지지 관계 (육합·삼합·충·형·파·해·원진)
  const jjs = [...natal.map(p => p.jj), target.jj];
  const targetIdx = jjs.length - 1;
  for (const rel of getJijiRelations(jjs)) {
    if (rel.a !== targetIdx && rel.b !== targetIdx) continue;
    const otherJj = rel.a === targetIdx ? rel.jjA : rel.jjB;
    const style = JIJI_REL_STYLE[rel.type];
    results.push({ label: `${otherJj}${target.jj} ${style.label}`, color: style.color, desc: `원국 지지 ${otherJj}와 ${target.jj}이 ${style.label} 관계예요.` });
  }

  return results;
}

const SIPSEONG_COLOR: Record<string, string> = {
  비견:"#4ade80", 겁재:"#f87171", 식신:"#60a5fa", 상관:"#fb923c",
  편재:"#fbbf24", 정재:"#f59e0b", 편관:"#c084fc", 정관:"#a78bfa",
  편인:"#94a3b8", 정인:"#e2e8f0",
};

const UUNSEONG_FORTUNE: Record<string, { label: string; score: number; color: string; desc: string; narrative: string; caution: string; keyword: string }> = {
  장생: {
    label:"장생(長生)", score:9, color:"#4ade80",
    desc:"새로운 생명이 태어나듯 에너지가 솟구치는 시기.",
    narrative:"아기가 세상에 막 나온 것처럼 모든 것이 새롭고 신선하게 느껴지는 구간이다. 몸에 기운이 넘치고 주변 사람들이 자연스럽게 따라오며, 시작하는 것마다 뭔가 될 것 같은 생동감이 있다. 이 시기에 시작한 일, 만난 사람, 내린 결정들이 이후 수십 년의 토대가 된다. 건강 상태가 전반적으로 좋고, 도전에 대한 두려움보다 설렘이 앞선다.",
    caution:"시작의 기운이 강한 만큼 경험이 쌓이기 전이라 판단이 섣부를 수 있다. 넘치는 에너지로 무리하게 벌이기보다 방향을 잘 잡는 게 관건이다.",
    keyword:"시작 · 생명력 · 도전 · 건강"
  },
  목욕: {
    label:"목욕(沐浴)", score:6, color:"#34d399",
    desc:"감성과 욕망이 폭발하는 시기. 유혹이 많고 인간관계가 복잡해진다.",
    narrative:"목욕이란 글자 그대로 옷을 다 벗고 알몸이 되는 것이다. 자기의 날것이 그대로 드러나는 구간이라, 이성에 대한 끌림이 강해지고 감각적인 즐거움을 좇게 된다. 예술·음악·이성·술·유흥 등 감각을 자극하는 것들에 집착이 생기기 쉽고, 도화기운이 강해져 이성 관계가 복잡해지는 경우가 많다. 반면 이 에너지를 창작이나 예술 방향으로 틀면 뛰어난 결과물이 나오기도 한다.",
    caution:"충동적인 결정, 이성 문제, 주색에 주의. 감정에 휩쓸려 중요한 것을 잃기 쉬운 구간이다.",
    keyword:"감성 · 욕망 · 도화 · 예술 · 이성"
  },
  관대: {
    label:"관대(冠帶)", score:8, color:"#60a5fa",
    desc:"사회에 나가 관복을 처음 입는 시기. 배움과 성장이 폭발적이다.",
    narrative:"사회에 처음 나서면서 이름을 알리고 능력을 인정받기 시작하는 구간이다. 학업·자격증·진학·취업처럼 사회적 기반을 쌓는 활동들이 잘 풀리고, 주변에서 기대를 걸기 시작한다. 아직 완성형은 아니지만 성장하고 있다는 확신이 있어 흔들리지 않는다. 스승이나 멘토를 만날 가능성도 높고, 이때 쌓은 실력이 이후 건록·제왕 대운의 성공을 결정짓는다.",
    caution:"배우는 것에 집중해야 할 때를 빨리 치고 나가려는 조급함을 경계해야 한다.",
    keyword:"배움 · 성장 · 사회진출 · 인정 · 기반구축"
  },
  건록: {
    label:"건록(建祿)", score:10, color:"#818cf8",
    desc:"인생에서 가장 안정적이고 실력이 빛나는 최전성기.",
    narrative:"건록은 공무원이 정식으로 녹봉을 받는 상태다. 실력·지위·재물이 가장 균형 잡혀 있고, 해온 일들이 결실을 맺는 구간이다. 직장인은 핵심 인력으로 인정받고, 사업가는 탄탄한 수익 구조가 만들어지며, 관계는 믿을 수 있는 사람들로 정리된다. 억지로 욕심내지 않아도 자연스럽게 채워지는 시기라 심리적으로도 가장 안정적이다.",
    caution:"너무 편안한 나머지 도전을 멈추면 다음 쇠·병 대운의 하락이 더 크게 느껴질 수 있다. 이 시기에 체력과 자산을 비축해두는 것이 중요하다.",
    keyword:"안정 · 실력발휘 · 결실 · 최전성기 · 녹봉"
  },
  제왕: {
    label:"제왕(帝旺)", score:10, color:"#c084fc",
    desc:"에너지가 최고조에 달한 왕의 시기. 그러나 정점 이후엔 내리막이 시작된다.",
    narrative:"제왕은 말 그대로 왕의 기운이다. 자기 분야에서 정점에 서게 되고, 타인을 이끌고 지배하는 위치가 된다. 카리스마가 넘쳐 사람들이 자연스럽게 따르고, 원하는 것을 밀어붙이면 이뤄지는 쾌감이 있다. 그러나 정점이기 때문에 이 뒤엔 쇠의 시기가 온다는 것을 알아야 한다. 오만해지거나 무리하게 확장하면 이 시기의 성과가 한 번에 무너지는 경우도 있다.",
    caution:"정점에서의 방심이 가장 위험하다. 지금이 영원하지 않음을 인식하고 이 시기에 버퍼를 만들어야 한다. 독선적 결정이 관계를 파괴하기 쉽다.",
    keyword:"정점 · 카리스마 · 지배 · 최강 · 오만 경계"
  },
  쇠: {
    label:"쇠(衰)", score:5, color:"#94a3b8",
    desc:"에너지가 꺾이기 시작하는 시기. 무리보다 내실을 다져야 한다.",
    narrative:"제왕에서 지나온 절정 이후 몸과 마음이 슬슬 지치기 시작하는 구간이다. 예전만큼 추진력이 나오지 않고, 해왔던 방식이 통하지 않는다는 느낌이 온다. 이 시기는 무언가를 새로 벌이기보다 지금까지 쌓아온 것을 정리하고 내실화하는 데 집중해야 한다. 건강 신호가 미미하게 오기 시작할 수 있으니 생활 습관을 점검하는 게 좋다.",
    caution:"억지로 기운을 회복하려다 더 소모된다. 조용히 재정비하는 것이 다음 대운을 위한 준비다.",
    keyword:"정리 · 내실 · 하강 시작 · 재정비 · 건강신호"
  },
  병: {
    label:"병(病)", score:3, color:"#fb923c",
    desc:"몸과 마음이 본격적으로 지치는 시기. 과욕을 버리고 쉬어야 한다.",
    narrative:"병이라는 글자처럼 기운이 아프다. 체력이 눈에 띄게 떨어지고, 의욕이 줄어들며, 해온 일이 잘 안 풀리거나 장애물이 생기기 시작한다. 인간관계에서도 오해나 다툼이 생기기 쉽고, 정서적으로 불안정해지기 쉬운 구간이다. 이때 억지로 욕심을 내면 건강이 무너지거나 큰 손실이 생긴다. 병 대운의 사람들 중 이 시기를 담담하게 버텨낸 사람이 이후 반등이 더 컸다.",
    caution:"건강 검진은 필수. 새 투자·사업 확장·이직 같은 큰 결정을 이 시기에 내리지 않는 것이 좋다.",
    keyword:"체력저하 · 장애물 · 인내 · 건강 · 과욕경계"
  },
  사: {
    label:"사(死)", score:1, color:"#ef4444",
    desc:"에너지가 멈춘 사(死)의 시기. 생각은 많고 몸이 움직이지 않는다.",
    narrative:"사는 죽음이 아니라 에너지가 완전히 정지한 상태다. 이 시기엔 아무리 노력해도 결과가 나오지 않는 느낌이 강하다. 생각은 많은데 실행으로 이어지지 않고, 주변에서는 답답해 보일 수 있다. 어린 나이에 이 대운이 오면 또래보다 생각이 깊고 '애늙은이' 소리를 듣거나, 몸이 약해 활발하게 뛰어놀지 못하는 시기를 보낼 수 있다. 이 정체의 시간이 사실은 다음 절·태·양으로 넘어가기 위한 충전의 기간이다.",
    caution:"이 시기의 성과 없음을 자신의 무능으로 오해하지 말아야 한다. 억지로 뚫으려 할수록 더 막힌다. 멈춤을 받아들이는 것이 최선이다.",
    keyword:"정지 · 애늙은이 · 체력저하 · 충전 · 인내"
  },
  묘: {
    label:"묘(墓)", score:1, color:"#dc2626",
    desc:"무덤에 갇힌 형국. 활동 반경이 좁고 정신적 답답함이 극에 달한다.",
    narrative:"묘는 무덤이다. 외부 활동이 제한되고 심리적으로 굉장히 갇힌 느낌이 드는 구간이다. 하고 싶은 것은 많은데 현실의 벽이 너무 두껍게 느껴지고, 노력해도 제자리인 것 같아 무기력과 우울감이 찾아올 수 있다. 특히 사춘기에 이 대운이 겹치면 억압받는다는 느낌, 부모·환경에 대한 답답함이 매우 강하게 나타난다. 이 시기는 외부 확장보다 내면의 공부, 명상, 자기 탐구에 집중하는 것이 훨씬 유리하다.",
    caution:"충동적 탈출을 시도하면 오히려 더 깊이 갇힌다. 지금 닦는 내면의 깊이가 이후의 자산이 된다.",
    keyword:"폐쇄 · 억압감 · 우울 · 내면탐구 · 답답함"
  },
  절: {
    label:"절(絶)", score:2, color:"#9333ea",
    desc:"모든 기반이 끊어지고 리셋되는 시기. 고독과 단절이 운명처럼 찾아온다.",
    narrative:"절은 끊어질 절 자다. 기운이 완전히 소멸해서 우주 공간에 먼지처럼 둥둥 떠 있는 상태, 인생의 에너지가 리셋되는 구간이다. 이 시기에 느끼는 극도의 외로움과 고독, 주변 인간관계의 단절은 내가 아무리 발버둥 쳐도 현실적 에너지가 뒷받침되지 않기 때문이다. 기존의 모든 인간관계와 환경이 가차 없이 잘려 나가는 시기다. 하지만 역설적으로 이 절의 시간이 있었기 때문에 불필요한 것들이 청소되고 진짜 나 자신이 남는다.",
    caution:"이 시기에 맺는 인연, 시작하는 일은 오래 가지 않는 경우가 많다. 큰 투자나 결혼 같은 중요한 결정은 다음 태·양 대운을 기다리는 편이 낫다.",
    keyword:"단절 · 고독 · 리셋 · 청소 · 새출발 준비"
  },
  태: {
    label:"태(胎)", score:6, color:"#f97316",
    desc:"새 씨앗이 잉태되는 시기. 아직 세상에 나오지 않은 가능성의 구간.",
    narrative:"어머니 뱃속에 씨앗이 막 자리를 잡은 상태다. 아직 세상에 드러나지 않았지만 내부에서 새로운 것이 조용히 형성되고 있는 구간이다. 이 시기엔 외부 성과보다 내면에서 새로운 아이디어, 방향, 목표가 싹트기 시작한다. 지금 당장 결과가 보이지 않아 조급할 수 있지만, 이 잉태의 시간이 충분히 무르익어야 이후 양·장생 대운에서 폭발적인 성장이 가능하다.",
    caution:"아직 때가 아닌 시기다. 무리하게 외부로 치고 나가기보다 구상·준비·공부에 집중하는 것이 훨씬 유리하다.",
    keyword:"잉태 · 준비 · 가능성 · 조용한 성장 · 구상"
  },
  양: {
    label:"양(養)", score:7, color:"#fbbf24",
    desc:"뱃속에서 무럭무럭 자라는 시기. 조용하지만 착실하게 실력이 쌓인다.",
    narrative:"뱃속에서 태아가 세상에 나올 준비를 하는 구간이다. 태 대운에서 잉태된 씨앗이 이제 구체적인 형태를 갖춰가기 시작한다. 아직 세상에 화려하게 등장하진 않지만 꾸준히 공부하고 실력을 쌓으면 그것이 그대로 다음 장생 대운의 도약대가 된다. 주변에서 인정을 많이 받지 못해도 지금 하는 노력이 반드시 의미 있다는 확신을 가져도 좋다.",
    caution:"인정받지 못해도 포기하지 않는 것이 핵심이다. 꾸준함이 이 대운의 유일한 전략이다.",
    keyword:"성장 · 준비 · 꾸준함 · 도약 전 단계 · 실력축적"
  },
};

const SIPSEONG_DAEWOON: Record<string, { title: string; color: string; desc: string; life: string; caution: string }> = {
  비견: {
    title:"비견(比肩) 대운", color:"#4ade80",
    desc:"나와 같은 기운이 들어오는 대운. 자존심과 독립심이 강해지고 혼자 해내고자 하는 의지가 커진다.",
    life:"경쟁이 많아지는 시기다. 형제·친구·동료와의 갈등 혹은 연대가 동시에 일어난다. 사업가라면 동업이나 경쟁자 출현, 직장인이라면 같은 라인의 동료들과 경쟁이 심화된다. 재물을 분산시키는 힘도 있어 재물복보다 관계복이 먼저 온다.",
    caution:"고집과 아집이 강해져 주변과의 마찰이 잦아질 수 있다. 독불장군 행세를 경계해야 한다."
  },
  겁재: {
    title:"겁재(劫財) 대운", color:"#f87171",
    desc:"빼앗는 기운이 강한 대운. 재물이 나갈 일이 생기고 인간관계에서 배신이나 손해가 발생하기 쉽다.",
    life:"겁재는 나의 재물과 관계를 빼앗아 가는 기운이다. 이 대운에는 예상치 못한 지출, 사기·배신·투자 손실이 발생하기 쉽다. 반면 기존의 잘못된 관계나 미련이 강제로 청소되는 효과도 있다. 운동, 경쟁 분야, 군인·경찰처럼 강한 의지가 필요한 분야에서는 오히려 유리하게 작용한다.",
    caution:"이 시기에 투자·보증·동업은 각별히 주의. 재물이 새어나가는 경로를 미리 차단해야 한다."
  },
  식신: {
    title:"식신(食神) 대운", color:"#60a5fa",
    desc:"내가 표현하고 먹고 즐기는 기운이 극대화되는 대운. 창의력과 여유가 넘치는 시기.",
    life:"식신 대운에는 먹고 사는 것, 즉 의식주와 관련된 복이 들어온다. 요리·예술·콘텐츠·교육처럼 무언가를 만들어 내는 활동들이 빛을 발한다. 이 시기에는 지나치게 애쓰지 않아도 자연스럽게 살이 붙듯 복이 따라온다. 성격이 온화해지고 인간관계도 원만해지며 주변 사람들이 편하게 여긴다.",
    caution:"너무 편안한 나머지 안주하거나 게을러질 수 있다. 관성(직장·남편운)을 제압하는 기운도 있어 여성이라면 남편과의 갈등 혹은 남편이 힘을 잃는 상황이 생길 수 있다."
  },
  상관: {
    title:"상관(傷官) 대운", color:"#fb923c",
    desc:"관성을 상하게 하는 기운. 직장·규범·권위에 반발하는 시기. 창의적이지만 파란이 많다.",
    life:"상관 대운은 기존의 질서와 권위에 강하게 반발하는 시기다. 직장을 그만두거나 규칙을 깨뜨리고 싶은 충동이 강해진다. 반면 이 에너지를 예술·창작·혁신 쪽으로 쓰면 탁월한 결과물이 나온다. 언어 능력이 강해져 말이나 글로 인정받기도 하지만, 말 실수나 구설수가 함께 오기도 한다.",
    caution:"여성이라면 이 시기에 남편운이 약해지거나 이별·이혼이 발생하기 쉽다. 직장인은 충동적인 사직을 경계해야 한다."
  },
  편재: {
    title:"편재(偏財) 대운", color:"#fbbf24",
    desc:"예상치 못한 곳에서 재물이 들어오는 대운. 투자·사업·이성 운이 활발해진다.",
    life:"편재는 흐르는 돈, 움직이는 재물이다. 부동산이나 은행 이자 같은 안정된 수입이 아니라 투자·사업·아이디어로 돈을 버는 기운이다. 활발하고 사교적이 되어 이성 관계도 활발해진다. 이 시기에 과감한 투자나 사업 도전이 빛을 발하는 경우가 많다.",
    caution:"들어오는 만큼 나가기도 쉬운 기운이다. 한탕주의적 투기는 금물이며, 들어온 돈을 관리하는 체계가 없으면 흩어진다."
  },
  정재: {
    title:"정재(正財) 대운", color:"#f59e0b",
    desc:"성실하게 쌓이는 재물의 대운. 꾸준한 노력이 착실한 자산으로 변환된다.",
    life:"정재는 월급·이자·임대수입처럼 안정적이고 예측 가능한 재물이다. 이 대운에는 투기보다 성실한 노동의 대가가 제대로 돌아온다. 절약과 저축이 잘 되고, 재산이 착실하게 불어나는 시기다. 남성이라면 좋은 배우자를 만날 가능성이 높은 대운이기도 하다.",
    caution:"너무 안정 지향적이 되어 큰 도전을 놓칠 수 있다. 재물에 대한 지나친 집착이 관계를 망치기도 한다."
  },
  편관: {
    title:"편관(偏官) 대운 — 칠살(七殺)", color:"#c084fc",
    desc:"강한 외부 압박과 통제가 들어오는 대운. 극복하면 성공, 못하면 큰 고통.",
    life:"편관, 즉 칠살 대운은 사주에서 가장 강렬한 기운 중 하나다. 외부에서 강한 압박·통제·경쟁이 몰려오는 시기로, 이 압력을 견뎌내면 오히려 강해지지만 버티지 못하면 크게 무너진다. 군인·경찰·정치·스포츠처럼 강한 경쟁 분야에서는 오히려 성공하기 좋은 기운이다. 여성이라면 강하고 카리스마 있는 남성과의 인연이 오기도 한다.",
    caution:"무리한 일처리, 사고, 법적 문제가 생기기 쉽다. 스스로를 너무 몰아붙이지 않도록 주의해야 한다."
  },
  정관: {
    title:"정관(正官) 대운", color:"#a78bfa",
    desc:"사회적 명예와 규범의 대운. 직장·지위·명예가 높아지는 가장 안정된 시기.",
    life:"정관 대운은 사주의 가장 귀한 기운 중 하나로 꼽힌다. 사회적 규범을 따르면서 명예와 지위가 자연스럽게 올라가는 시기다. 직장인은 승진, 사업가는 공신력 향상, 학생은 좋은 성적과 진학으로 이어지기 쉽다. 여성이라면 좋은 배우자를 만나거나 결혼이 이루어지는 시기이기도 하다.",
    caution:"명예를 지키기 위해 지나치게 눈치를 보거나 자기 생각을 억누르는 경향이 생길 수 있다."
  },
  편인: {
    title:"편인(偏印) 대운 — 효신(梟神)", color:"#94a3b8",
    desc:"불규칙하고 신비로운 배움의 대운. 직관과 영감이 강해지지만 불안정하다.",
    life:"편인 대운에는 종교·철학·신비학·예술처럼 비주류적이고 깊은 학문에 빠져들기 쉽다. 직관력과 통찰력이 강해지고 남다른 아이디어가 떠오른다. 반면 현실적인 활동 능력이 약해져 먹고 사는 문제에 소홀해질 수 있다. 식신을 극하는 성질이 있어 건강과 식복(食福)이 약해지기도 한다.",
    caution:"사이비 종교, 투자 사기 등 비현실적인 것에 빠지기 쉬운 대운이다. 현실적 판단력을 유지하는 것이 중요하다."
  },
  정인: {
    title:"정인(正印) 대운", color:"#e2e8f0",
    desc:"어머니의 기운, 배움과 인정의 대운. 안정적인 도움과 지지를 받는 시기.",
    life:"정인 대운은 학업·자격증·논문·공부처럼 배움과 관련된 모든 활동이 빛을 발하는 시기다. 어머니나 선배·스승·기관으로부터 도움을 받기 쉽고, 심리적으로 안정감이 있다. 이 대운에 시험을 보거나 자격을 취득하면 좋은 결과가 나온다. 명예롭고 인정받는 방식으로 살고 싶은 욕구가 강해진다.",
    caution:"지나치게 의존적이 되거나 독립심이 약해질 수 있다. 새로운 도전보다 안전함만 추구하면 성장이 멈춘다."
  },
};

// ── 십성 그룹별 · 성별별 상세 운세 (직업·재물·애정/배우자·자녀) ──────────────────
type GenderDomain = { domain: string; icon: string; male: string; female: string };
const SIPSEONG_GENDER_DETAIL: Record<"비겁" | "식상" | "재성" | "관성" | "인성", GenderDomain[]> = {
  비겁: [
    { domain: "직업운", icon: "💼",
      male: "독립·창업·동업 이슈가 부각되는 시기예요. 내 이름을 걸고 일하고 싶은 욕구가 커지고, 조직보다 스스로 판을 짜는 쪽이 유리해져요. 다만 동료·경쟁자와의 마찰도 함께 늘어나요.",
      female: "주체적으로 일을 끌고 가려는 의지가 강해져요. 직장 내 라인 경쟁이나 동료와의 신경전이 생기기 쉽고, 본인 사업·프리랜서 전환을 고민하게 되는 흐름도 자주 나타나요." },
    { domain: "재물운", icon: "💰",
      male: "형제·동업자·지인과 돈이 얽히는 일이 늘어요. 함께 벌 수도 있지만 분산되거나 빠져나가는 쪽으로도 작용하니, 동업·보증은 신중해야 해요.",
      female: "내 손으로 직접 벌어들이는 재물에 대한 의욕이 커지는 시기예요. 다만 지출도 함께 늘어나는 경향이 있어 씀씀이 관리가 관건이에요." },
    { domain: "애정·배우자운", icon: "💑",
      male: "배우자나 연인보다 친구·동료 관계에 에너지가 쏠리기 쉬워요. 관계에서 주도권 다툼이 생기면 거리가 멀어질 수 있으니 균형이 필요해요.",
      female: "내 주장이 강해지는 시기라 연인·배우자와 기 싸움이 생기기 쉬워요. 서로 한 발씩 양보하는 노력이 관계를 지켜줘요." },
    { domain: "자녀운", icon: "👶",
      male: "자녀보다 본인의 사회적 입지·경쟁에 신경이 쏠리는 시기예요. 자녀와 보내는 시간을 의식적으로 늘리면 좋아요.",
      female: "자녀가 독립적이고 고집 센 모습을 보일 수 있는 시기예요. 통제하기보다 대화로 이끄는 편이 잘 맞아요." },
  ],
  식상: [
    { domain: "직업운", icon: "💼",
      male: "표현력과 아이디어가 빛을 발하는 시기예요. 기획·창작·교육·서비스 분야에서 두각을 나타내기 좋고, 조직보다 자기 색깔을 살리는 일이 잘 맞아요.",
      female: "재능과 끼가 자연스럽게 드러나는 시기예요. 콘텐츠·예술·상담·교육 등 자기 표현이 곧 일이 되는 분야에서 성과가 나기 쉬워요. 다만 직장 내 권위와는 마찰이 생길 수 있어요." },
    { domain: "재물운", icon: "💰",
      male: "내가 만들어낸 결과물이 곧 수입으로 연결되는 흐름이에요. 의식주·먹고사는 복이 자연스럽게 따라오는 시기예요.",
      female: "능력과 활동을 통해 스스로 돈을 만들어내는 힘이 강해져요. 부업·창작 활동·사업 확장에 좋은 시기예요." },
    { domain: "애정·배우자운", icon: "💑",
      male: "표현이 풍부해지고 매력이 살아나 이성에게 어필하는 힘이 커져요. 다만 자유로움을 추구하다 보니 한 사람에게 집중하기 어려울 수 있어요.",
      female: "이 시기는 배우자운(관성)을 누르는 기운이 강해지는 때라, 배우자와의 관계에서 갈등이 불거지거나 거리가 생기기 쉬워요. 표현을 다듬는 노력이 관계를 지켜줘요." },
    { domain: "자녀운", icon: "👶",
      male: "자녀와의 관계에서 자유롭고 친구 같은 분위기가 형성돼요. 자녀의 재능을 발견하고 키워주기 좋은 시기예요.",
      female: "여성에게 식상은 자녀를 직접 상징하는 기운이에요. 임신·출산·자녀와 관련된 변화가 이 시기에 일어날 가능성이 높고, 자녀와의 정서적 교감도 깊어져요." },
  ],
  재성: [
    { domain: "직업운", icon: "💼",
      male: "성과와 결과로 인정받는 시기예요. 영업·사업·재무·투자처럼 돈의 흐름을 다루는 분야에서 능력을 발휘하기 좋아요.",
      female: "현실 감각과 실무 능력이 빛을 발하는 시기예요. 재무·기획·사업 영역에서 인정받기 좋고, 직접 돈을 굴리는 역할을 맡게 될 가능성도 커져요." },
    { domain: "재물운", icon: "💰",
      male: "이 시기 전체를 통틀어 재물운이 가장 직접적으로 들어오는 기운이에요. 정재면 꾸준한 수입과 자산 형성, 편재면 투자·사업·예상 밖의 수입으로 흐름이 갈려요.",
      female: "스스로 일군 재물이 쌓이기 좋은 시기예요. 다만 씀씀이와 관리의 균형이 중요하고, 시댁·부모님과 관련된 경제적 이슈가 함께 따라올 수 있어요." },
    { domain: "애정·배우자운", icon: "💑",
      male: "재성은 남자에게 곧 여자(아내·연인)를 상징하는 기운이에요. 이성과의 인연이 활발해지고, 정재면 좋은 배우자를 만나거나 결혼으로 이어지기 좋은 시기예요. 편재라면 다양한 인연이 스쳐가는 흐름이 될 수 있어요.",
      female: "본인의 활동력과 매력이 커지면서 이성에게 어필하는 힘도 함께 강해지는 시기예요. 다만 일이 바빠지며 관계에 쏟는 에너지는 상대적으로 줄어들 수 있어요." },
    { domain: "자녀운", icon: "👶",
      male: "재성은 자녀(특히 부친 입장에서 자식)를 부양하고 책임지는 힘과 연결돼요. 경제적으로 자녀를 든든히 뒷받침할 수 있는 시기예요.",
      female: "자녀보다 본인의 활동·성과에 무게가 실리는 시기예요. 일과 육아 사이의 균형 잡기가 화두가 될 수 있어요." },
  ],
  관성: [
    { domain: "직업운", icon: "💼",
      male: "조직·사회에서의 위치, 승진·평가와 직결되는 핵심 운이에요. 정관이면 안정적인 인정과 승진, 편관(칠살)이면 강한 압박 속에서 성과를 내야 하는 경쟁적인 흐름이 강해져요.",
      female: "사회적 평가와 직장 내 입지가 뚜렷하게 좌우되는 시기예요. 정관이면 신뢰받고 안정적으로 자리를 잡고, 편관이면 책임이 무거워지고 경쟁이 치열한 환경에 놓이기 쉬워요." },
    { domain: "재물운", icon: "💰",
      male: "재물 자체보다 사회적 지위·평판이 우선시되는 시기예요. 명예가 오르면 자연스럽게 기회와 수입도 따라오는 구조예요.",
      female: "직접적인 재물보다 직장·조직을 통한 안정적 기반이 우선시돼요. 명예와 신뢰가 곧 기회로 연결돼요." },
    { domain: "애정·배우자운(이성운)", icon: "💑",
      male: "관성은 남자에게 자기 자신을 통제하는 기운이라, 연애보다 사회적 책임·역할에 무게가 실려요. 본인을 다스리는 절제력이 관계에도 긍정적으로 작용해요.",
      female: "여성에게 관성은 곧 남자(배우자·연인)를 상징하는 기운이에요. 정관이면 안정적이고 책임감 있는 사람과 인연이 닿아 결혼으로 이어지기 좋고, 편관(칠살)이면 카리스마 있고 강한 사람과 강렬하게 끌리는 인연이 들어오기 쉬워요. 다만 그 끌림 뒤에 갈등도 함께 따라올 수 있어요." },
    { domain: "자녀운", icon: "👶",
      male: "남성에게 관성은 자녀(특히 아들)를 상징하는 기운 중 하나예요. 자녀와 관련된 책임·역할이 부각되고, 자녀의 사회 진출·성장과 관련된 소식이 들려오기 좋은 시기예요.",
      female: "여성에게 관성은 자녀(특히 딸)와도 연결되는 기운이에요. 임신·출산 소식이나 자녀의 진학·진로 같은 변화가 이 시기에 맞물려 나타나기 쉬워요." },
  ],
  인성: [
    { domain: "직업운", icon: "💼",
      male: "공부·자격·연구·문서와 관련된 일에서 빛을 보는 시기예요. 조직보다 전문성으로 인정받는 흐름이 강해지고, 윗사람·기관의 후원을 받기 좋아요.",
      female: "배움과 자격이 곧 커리어의 발판이 되는 시기예요. 교육·연구·전문직 분야에서 성장하기 좋고, 멘토나 기관의 도움을 받을 가능성이 커요." },
    { domain: "재물운", icon: "💰",
      male: "직접 버는 재물보다 명예·자격·문서를 통한 간접적인 이득이 들어오는 시기예요. 부모·기관으로부터의 지원도 기대할 수 있어요.",
      female: "안정적인 지원과 후원이 따르는 시기예요. 다만 직접 활동을 통한 수입(식상·재성)은 상대적으로 약해질 수 있어요." },
    { domain: "애정·배우자운", icon: "💑",
      male: "관계보다 자기 내면의 성장, 배움에 더 끌리는 시기예요. 다소 신중하고 조심스러운 태도가 관계의 속도를 늦출 수 있어요.",
      female: "안정감과 신뢰를 우선시하게 되는 시기예요. 어머니·집안 어른의 의견이 인연 선택에 영향을 주는 경우도 많아요." },
    { domain: "자녀운", icon: "👶",
      male: "자녀의 교육·학업에 마음이 많이 쓰이는 시기예요. 자녀에게 든든한 정신적 지원자가 되어주기 좋아요.",
      female: "인성은 여성에게 자녀를 보살피고 품는 기운과도 연결돼요. 자녀의 학업·성장을 챙기는 데 마음과 시간이 많이 쓰이는 시기예요." },
  ],
};
function getGenderDetail(sipseong: string): GenderDomain[] | null {
  const SIPSEONG_GROUP: Record<string, "비겁" | "식상" | "재성" | "관성" | "인성"> = {
    비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상",
    편재: "재성", 정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성",
  };
  const g = SIPSEONG_GROUP[sipseong];
  return g ? SIPSEONG_GENDER_DETAIL[g] : null;
}

// ── 운 지수 계산 (평균 50점 기준 0~100점) ───────────────────────────────────────
type LuckIdx = { label: string; score: number; color: string };

function calcLuckIndices(sipseongCg: string, sipseongJj: string, uunseong: string, gender: "male" | "female"): LuckIdx[] {
  const SIPSEONG_GROUP: Record<string, "비겁" | "식상" | "재성" | "관성" | "인성"> = {
    비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상",
    편재: "재성", 정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성",
  };
  const groups: Record<"비겁" | "식상" | "재성" | "관성" | "인성", number> = { 비겁: 50, 식상: 50, 재성: 50, 관성: 50, 인성: 50 };
  for (const s of [sipseongCg, sipseongJj]) {
    const g = SIPSEONG_GROUP[s];
    if (g) groups[g] += 22;
  }

  const uf = UUNSEONG_FORTUNE[uunseong];
  const uScore = uf ? uf.score : 5; // 0~10
  const uDelta = (uScore - 5) * 5; // 약 -25 ~ +25

  let marriage = 50 + uDelta * 0.6;
  if (gender === "female" && (sipseongCg === "정관" || sipseongJj === "정관")) marriage += 18;
  if (gender === "male" && (sipseongCg === "정재" || sipseongJj === "정재")) marriage += 18;
  if (uunseong === "목욕") marriage += 6;
  if (["묘", "절", "병", "사"].includes(uunseong)) marriage -= 10;

  let birth = 50 + uDelta * 0.5;
  if (["식신", "상관"].includes(sipseongCg) || ["식신", "상관"].includes(sipseongJj)) birth += 16;
  if (["장생", "관대", "제왕", "태"].includes(uunseong)) birth += 8;
  if (["묘", "절", "사"].includes(uunseong)) birth -= 12;

  let change = 50 - uDelta * 0.4;
  if (["겁재", "상관", "편관"].includes(sipseongCg) || ["겁재", "상관", "편관"].includes(sipseongJj)) change += 14;
  if (["정인", "정관"].includes(sipseongCg) && ["정인", "정관"].includes(sipseongJj)) change -= 12;
  if (["목욕", "병", "묘", "절", "태"].includes(uunseong)) change += 8;
  if (["관대", "건록", "제왕"].includes(uunseong)) change -= 6;

  const clamp = (n: number) => Math.max(4, Math.min(96, Math.round(n)));
  return [
    { label: "비겁", score: clamp(groups.비겁), color: "#4ade80" },
    { label: "식상", score: clamp(groups.식상), color: "#60a5fa" },
    { label: "재성", score: clamp(groups.재성), color: "#fbbf24" },
    { label: "관성", score: clamp(groups.관성), color: "#c084fc" },
    { label: "인성", score: clamp(groups.인성), color: "#e2e8f0" },
    { label: "결혼 확률", score: clamp(marriage), color: "#f472b6" },
    { label: "출생·자녀 확률", score: clamp(birth), color: "#34d399" },
    { label: "변화 지수", score: clamp(change), color: "#fb7185" },
  ];
}

function LuckBars({ items, compact }: { items: LuckIdx[]; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      {items.map(it => (
        <div key={it.label} className="flex items-center gap-2">
          <span className="text-[10px] shrink-0" style={{ width: 78, color: "rgba(255,255,255,0.45)" }}>{it.label}</span>
          <div className="flex-1 h-2 rounded-full relative overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="absolute left-1/2 top-0 bottom-0 w-px z-10" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="h-2 rounded-full transition-all" style={{ width: `${it.score}%`, background: it.color }} />
          </div>
          <span className="text-[10px] w-7 text-right font-black" style={{ color: it.color }}>{it.score}</span>
        </div>
      ))}
      {!compact && <p className="text-[9px] text-right mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>※ 평균(50점)을 기준으로 한 상대 지수예요</p>}
    </div>
  );
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function DaewoonPage() {
  const router = useRouter();
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));
  const { name, gender, birthYear, birthMonth, birthDay, birthHour, useJajasi, calendarType, isLeapMonth } = form;
  const birthPlace = form.city;
  const [daewoon, setDaewoon] = useState<DaewoonResult | null>(null);
  const [sewoon, setSewoon] = useState<SewoonItem[]>([]);
  const [ilgan, setIlgan] = useState("");
  const [monthJj, setMonthJj] = useState("");
  const [natalPillars, setNatalPillars] = useState<{ cg: string; jj: string }[]>([]);
  const [step, setStep] = useState<"splash" | "entry" | "loading" | "preview">("splash");
  const [isPaid, setIsPaid] = useState(false);
  const [blueberries, setBlueberries] = useState(0);
  const [showering, setShowering] = useState(false);
  const [openSewoonYear, setOpenSewoonYear] = useState<number | null>(null);
  const [openIlwoon, setOpenIlwoon] = useState<string | null>(null);
  const [counter] = useState(() => Math.floor(Math.random() * 400) + 1800);
  const [totalCount] = useState(() => Math.floor(Math.random() * 1500) + 7200);

  useEffect(() => {
    const isAdmin = localStorage.getItem("sp_admin") === "true";
    setIsPaid(isAdmin || sessionStorage.getItem("daewoonPaid") === "true");
    const bb = parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
    setBlueberries(isNaN(bb) ? 0 : bb);
    const saved = loadSajuData();
    if (saved) {
      // 이름은 placeholder로 표시 — 직접 입력하게
      setForm(prev => ({
        ...prev,
        gender: (saved.gender as "male" | "female") || "female",
        birthYear: saved.birthYear,
        birthMonth: saved.birthMonth,
        birthDay: saved.birthDay,
        birthHour: saved.birthHour != null ? saved.birthHour : prev.birthHour,
      }));
    }
  }, []);

  async function analyze() {
    if (!birthYear || !birthMonth || !birthDay || birthYear < 1920 || birthMonth < 1 || birthDay < 1) {
      alert("생년월일을 모두 선택해주세요.");
      return;
    }
    let y = birthYear, mo = birthMonth, d = birthDay;
    if (calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(y, mo, d, isLeapMonth);
        const s = cal.getSolarCalendar();
        if (!s?.year) throw new Error();
        y = s.year; mo = s.month; d = s.day;
      } catch {
        alert("음력 날짜를 양력으로 변환할 수 없습니다. 날짜를 다시 확인해주세요.");
        return;
      }
    }
    try {
      const r = analyzeSaju({
        birthYear: y, birthMonth: mo, birthDay: d,
        birthHour, birthMinute: 0,
        name: name || "분석", gender,
        birthPlace: birthPlace || "서울", style: "auto", productType: "report", useJajasi,
      });
      const mp = r.pillarsDetail.month;
      const dw = calcDaewoon(y, mo, d, gender, r.pillarsDetail.day.cg, mp);
      const sw = calcSewoon(y, r.pillarsDetail.day.cg);
      setIlgan(r.pillarsDetail.day.cg);
      setMonthJj(mp.jj);
      setNatalPillars([
        { cg: r.pillarsDetail.year.cg, jj: r.pillarsDetail.year.jj },
        { cg: r.pillarsDetail.month.cg, jj: r.pillarsDetail.month.jj },
        { cg: r.pillarsDetail.day.cg, jj: r.pillarsDetail.day.jj },
        ...(r.pillarsDetail.hour ? [{ cg: r.pillarsDetail.hour.cg, jj: r.pillarsDetail.hour.jj }] : []),
      ]);
      setDaewoon(dw);
      setSewoon(sw);
      setStep("loading");
    } catch {
      alert("사주 정보를 다시 확인해주세요.");
    }
  }

  function goPay() {
    const orderId = `dw-${Date.now()}`;
    sessionStorage.setItem("daewoonData", JSON.stringify({ name, gender, birthYear, birthMonth, birthDay, birthHour }));
    router.push(`/daewoon/pay?orderId=${orderId}&amount=${PRICE}`);
  }

  // ── 로딩 ──
  if (step === "loading") return (
    <AnalysisLoading subject={`${name || ""}님의 대운·세운`} onDone={() => setStep("preview")} />
  );

  // ── 스플래시 ──
  if (step === "splash") {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col relative overflow-hidden">
        <BackButton />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 2s ease-in-out infinite}`}</style>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[160px]" style={{ background: "rgba(251,191,36,0.12)" }} />
          <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: "rgba(192,132,252,0.1)" }} />
        </div>


        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full pb-12">

          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-yellow-400 pulse" />
            <span className="text-xs text-gray-400">지금 <strong className="text-yellow-400">{counter.toLocaleString()}명</strong>이 대운 확인 중</span>
          </div>

          <div className="mb-8 space-y-3">
            <p className="text-4xl font-black leading-tight">
              대운을 모르고<br />
              <span className="text-yellow-400">하는 결정은</span><br />
              전부 도박입니다
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              지금 상승기인지, 침체기인지도 모른 채<br />
              투자·이직·결혼·창업을 결정하고 있습니다.<br />
              결과가 안 나오는 이유가 여기 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: "🌊", title: "대운 80년 흐름", desc: "10년 단위 8개 대운 전체" },
              { icon: "📅", title: "세운 14년치", desc: "연도별 상세 흐름" },
              { icon: "⏰", title: "교운기 정확 계산", desc: "첫 대운 진입 나이" },
              { icon: "🤖", title: "AI 대운 해설", desc: "대운별 인생 조언" },
            ].map(f => (
              <div key={f.title} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-2xl">{f.icon}</span>
                <p className="text-sm font-bold text-white mt-2">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mb-8 py-4 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex-1 text-center">
              <p className="text-lg font-black text-yellow-400">{totalCount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">누적 분석</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-lg font-black text-white">★ 4.9</p>
              <p className="text-[10px] text-gray-600 mt-0.5">평균 평점</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-lg font-black text-green-400">무료</p>
              <p className="text-[10px] text-gray-600 mt-0.5">미리보기</p>
            </div>
          </div>

          <button
            onClick={() => setStep("entry")}
            className="w-full py-5 rounded-2xl font-black text-lg text-black shadow-2xl transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" }}
          >
            내 대운 확인하기 →
          </button>
          <p className="text-center text-xs text-gray-600 mt-3">미리보기 무료 · 전체 보고서 ₩{PRICE.toLocaleString()}</p>
        </div>
      </main>
    );
  }

  // ── 입력 화면 ──
  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#06060e] text-white">
        <BackButton />
        <StarShower active={showering} />
        <div className="max-w-lg mx-auto px-5 py-10 pb-24">

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Summer Palace</span>
            </div>
            <h1 className="text-2xl font-black mb-2">대운·세운 분석</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              10년 단위 대운, 연도별 세운, 교운기까지<br />
              내 인생의 큰 흐름을 한눈에 봅니다
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-950/60 to-yellow-950/60 border border-yellow-700/30 rounded-2xl p-5 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-yellow-500 font-semibold uppercase tracking-wider">프리미엄 보고서</span>
              <span className="text-2xl font-black text-yellow-400">₩{PRICE.toLocaleString()}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> 대운 8개 전체 (80년 흐름)</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> 연도별 세운 14년치</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> 교운기 진입 나이 정확 계산</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> AI 대운별 인생 조언</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> PDF 다운로드 포함</li>
            </ul>
          </div>

          <ProfilePicker onSelect={p => {
            setForm(prev => ({
              ...prev,
              name: p.name,
              gender: p.gender,
              birthYear: p.birthYear,
              birthMonth: p.birthMonth,
              birthDay: p.birthDay,
              birthHour: (!p.birthHourUnknown && p.birthHour >= 0) ? p.birthHour : null,
            }));
          }} />

          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
            <BirthInputForm value={form} onChange={setForm} accent="#f59e0b" />
          </div>

          <button
            onClick={analyze}
            className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 font-black text-lg text-white shadow-lg hover:opacity-90 transition-opacity"
          >
            대운·세운 미리 보기 →
          </button>
          <p className="text-center text-xs text-gray-600 mt-3">미리보기는 무료 · 상세 분석은 ₩{PRICE.toLocaleString()}</p>
        </div>
      </main>
    );
  }

  // ── 미리보기 / 결과 화면 ──
  if (!daewoon) return null;

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <BackButton />
      <div className="max-w-lg mx-auto px-5 py-8 pb-32">

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Summer Palace</span>
          </div>
          <h1 className="text-xl font-black">
            {name ? `${name}님의 ` : ""}대운·세운
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            일간 <strong className="text-white">{ilgan}</strong> ·
            월지 <strong className="text-white">{monthJj}</strong> ·
            {daewoon.direction} ({daewoon.direction === "순행" ? "양남/음녀" : "음남/양녀"})
          </p>
        </div>

        <SaveProfilePrompt
          name={name} birthYear={Number(birthYear)} birthMonth={Number(birthMonth)} birthDay={Number(birthDay)}
          birthHour={birthHour} birthHourUnknown={birthHour == null} gender={gender}
        />

        <div className="bg-violet-500/10 border border-violet-500/25 rounded-2xl p-4 mb-6">
          <p className="text-xs text-violet-400 font-semibold mb-1">⏰ 교운기 (첫 대운 진입)</p>
          <p className="text-2xl font-black text-violet-300">{daewoon.startAge}세</p>
          <p className="text-xs text-gray-500 mt-1">
            출생 후 {daewoon.startAge}세에 첫 대운이 시작됩니다.
            이후 10년마다 대운이 바뀌며 인생의 큰 흐름이 전환됩니다.
          </p>
        </div>

        {/* 일간 성격 */}
        {(() => {
          const info = ILGAN_PERSONALITY[ilgan];
          if (!info) return null;
          return (
            <div className="mb-6 rounded-2xl p-4 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-2">일간 기질 — {info.short}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {info.keyword.split("·").map(k => (
                  <span key={k} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>{k}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{info.detail}</p>
            </div>
          );
        })()}

        {/* ── 대운 흐름 ── */}
        <div className="mb-8">
          <div className="flex items-end gap-2 mb-4">
            <h2 className="text-base font-black text-white">대운 흐름 — 80년 인생 지도</h2>
            <span className="text-xs text-gray-600 mb-0.5">10년 단위</span>
          </div>

          {/* 현재 대운 심층 분석 카드 */}
          {daewoon.currentIdx >= 0 && (() => {
            const cur = daewoon.pillars[daewoon.currentIdx];
            const elStyle = ELEMENT_COLOR[cur.element] || ELEMENT_COLOR["토"];
            const uunsF = UUNSEONG_FORTUNE[cur.uunseong];
            const sipCg = SIPSEONG_DAEWOON[cur.sipseongCg];
            const sipJj = SIPSEONG_DAEWOON[cur.sipseongJj];
            return (
              <div className="rounded-2xl p-5 mb-6 border-2" style={{ background: `${elStyle.bg}cc`, borderColor: "#ca8a04" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-500/25 text-yellow-400">현재 대운 심층 분석</span>
                  <span className="text-[10px] text-gray-500">{cur.age}세 ~ {cur.age + 9}세 ({cur.yearStart}~{cur.yearStart + 9})</span>
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-center shrink-0">
                    <p className="text-4xl font-black leading-none" style={{ color: elStyle.text }}>{cur.cg}</p>
                    <p className="text-4xl font-black leading-none" style={{ color: elStyle.text }}>{cur.jj}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{cur.element}({cur.element})</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${SIPSEONG_COLOR[cur.sipseongCg] || "#fff"}22`, color: SIPSEONG_COLOR[cur.sipseongCg] || "#fff", border: `1px solid ${SIPSEONG_COLOR[cur.sipseongCg] || "#fff"}44` }}>{cur.sipseongCg} (천간)</span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${SIPSEONG_COLOR[cur.sipseongJj] || "#fff"}22`, color: SIPSEONG_COLOR[cur.sipseongJj] || "#fff", border: `1px solid ${SIPSEONG_COLOR[cur.sipseongJj] || "#fff"}44` }}>{cur.sipseongJj} (지지)</span>
                      {uunsF && <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${uunsF.color}22`, color: uunsF.color }}>{uunsF.label}</span>}
                    </div>
                    {uunsF && <p className="text-sm font-semibold" style={{ color: uunsF.color }}>{uunsF.desc}</p>}
                  </div>
                </div>

                {uunsF && (
                  <div className="rounded-xl p-4 mb-3" style={{ background: "rgba(0,0,0,0.3)" }}>
                    <p className="text-xs font-bold mb-1.5 text-gray-300">이 대운이 당신에게 미치는 영향</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{uunsF.narrative}</p>
                  </div>
                )}

                {sipCg && (
                  <div className="rounded-xl p-4 mb-3" style={{ background: "rgba(0,0,0,0.25)" }}>
                    <p className="text-xs font-bold mb-1" style={{ color: sipCg.color }}>{sipCg.title} — 천간의 기운</p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{sipCg.desc}</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{sipCg.life}</p>
                    <p className="text-xs mt-2 px-2 py-1.5 rounded-lg" style={{ background: "rgba(255,100,100,0.08)", color: "#f87171" }}>주의: {sipCg.caution}</p>
                  </div>
                )}

                {sipJj && sipJj.title !== sipCg?.title && (
                  <div className="rounded-xl p-4 mb-3" style={{ background: "rgba(0,0,0,0.25)" }}>
                    <p className="text-xs font-bold mb-1" style={{ color: sipJj.color }}>{sipJj.title} — 지지의 기운</p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{sipJj.desc}</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{sipJj.life}</p>
                  </div>
                )}

                {uunsF && (
                  <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(255,180,0,0.08)", border: "1px solid rgba(255,180,0,0.2)" }}>
                    <span className="text-yellow-400 shrink-0 mt-0.5">!</span>
                    <div>
                      <p className="text-xs font-bold text-yellow-400 mb-0.5">이 시기 핵심 키워드</p>
                      <p className="text-xs text-yellow-300">{uunsF.keyword}</p>
                      <p className="text-xs text-yellow-200/60 mt-1">{uunsF.caution}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 전체 대운 타임라인 */}
          <div className="space-y-3">
            {daewoon.pillars.map((p, i) => {
              const isCurrentDw = i === daewoon.currentIdx;
              const elStyle = ELEMENT_COLOR[p.element] || ELEMENT_COLOR["토"];
              const uunsF = UUNSEONG_FORTUNE[p.uunseong];
              const sipCg = SIPSEONG_DAEWOON[p.sipseongCg];
              const sipJj = SIPSEONG_DAEWOON[p.sipseongJj];
              const isBlurred = !isPaid && i >= 3;
              const ageLabel = p.age < 10 ? "유아기" : p.age < 20 ? "청소년기" : p.age < 30 ? "청년기" : p.age < 40 ? "30대" : p.age < 50 ? "40대" : p.age < 60 ? "50대" : "노년기";

              return (
                <div key={i} className="rounded-2xl border overflow-hidden relative"
                  style={isCurrentDw
                    ? { background: `${elStyle.bg}cc`, borderColor: "#ca8a04", borderWidth: 2 }
                    : { background: `${elStyle.bg}55`, borderColor: elStyle.border }
                  }
                >
                  {isBlurred && (
                    <div className="absolute inset-0 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10 gap-2"
                      style={{ background: "rgba(6,6,14,0.82)" }}>
                      <p className="text-sm font-bold text-gray-400">프리미엄 전용</p>
                      <p className="text-xs text-gray-600">{p.age}세~{p.age+9}세 상세 분석</p>
                    </div>
                  )}

                  {/* 헤더 */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div className="text-center shrink-0 min-w-[44px]">
                      <p className="text-xl font-black leading-none" style={{ color: elStyle.text }}>{p.cg}{p.jj}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{p.yearStart}년~</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white">{p.age}세 ~ {p.age+9}세</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>{ageLabel}</span>
                        {isCurrentDw && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">현재</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${SIPSEONG_COLOR[p.sipseongCg] || "#fff"}20`, color: SIPSEONG_COLOR[p.sipseongCg] || "#fff" }}>{p.sipseongCg}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${SIPSEONG_COLOR[p.sipseongJj] || "#fff"}20`, color: SIPSEONG_COLOR[p.sipseongJj] || "#fff" }}>{p.sipseongJj}</span>
                        {uunsF && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${uunsF.color}20`, color: uunsF.color }}>{uunsF.label}</span>}
                      </div>
                    </div>
                  </div>

                  {/* 12운성 서술 */}
                  {uunsF && (
                    <div className="px-4 pb-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <p className="text-xs font-bold mt-3 mb-1.5" style={{ color: uunsF.color }}>{uunsF.label} — {p.uunseong}</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{uunsF.narrative}</p>
                      <p className="text-xs text-gray-500 leading-relaxed mt-2">{uunsF.caution}</p>
                    </div>
                  )}

                  {/* 십성 해석 */}
                  {(sipCg || sipJj) && (
                    <div className="px-4 pb-4 space-y-2">
                      {sipCg && (
                        <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(0,0,0,0.25)" }}>
                          <p className="text-[10px] font-bold mb-1" style={{ color: sipCg.color }}>{sipCg.title}</p>
                          <p className="text-xs text-gray-400 leading-relaxed">{sipCg.life}</p>
                        </div>
                      )}
                      {sipJj && sipJj.title !== sipCg?.title && (
                        <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(0,0,0,0.2)" }}>
                          <p className="text-[10px] font-bold mb-1" style={{ color: sipJj.color }}>{sipJj.title}</p>
                          <p className="text-xs text-gray-400 leading-relaxed">{sipJj.life}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 운 지수 차트 */}
                  <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] font-black mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>📊 이 시기의 운 지수</p>
                    <LuckBars items={calcLuckIndices(p.sipseongCg, p.sipseongJj, p.uunseong, gender)} />
                  </div>

                  {/* 성별 맞춤 상세 — 직업·재물·애정·자녀 */}
                  {(() => {
                    const detail = getGenderDetail(p.sipseongJj) || getGenderDetail(p.sipseongCg);
                    if (!detail) return null;
                    return (
                      <div className="px-4 pb-4 pt-1 border-t space-y-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <p className="text-[10px] font-black mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                          🔍 {gender === "male" ? "남성" : "여성"} 기준 상세 — 관운·재운·직업·자녀까지
                        </p>
                        {detail.map(d => (
                          <div key={d.domain} className="rounded-xl px-3 py-2.5" style={{ background: "rgba(0,0,0,0.22)" }}>
                            <p className="text-[10px] font-bold mb-1" style={{ color: elStyle.text }}>{d.icon} {d.domain}</p>
                            <p className="text-xs text-gray-400 leading-relaxed">{gender === "male" ? d.male : d.female}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 세운 ── */}
        <div className="mb-8">
          <h2 className="text-base font-black text-white mb-1">세운 — 연도별 흐름</h2>
          <p className="text-xs text-gray-600 mb-4">올해를 포함한 전후 흐름. 대운과 세운이 겹치는 해가 인생의 변곡점이다.</p>
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="flex gap-2 pb-2" style={{ minWidth: "max-content" }}>
              {sewoon.map((s, i) => {
                const elStyle = ELEMENT_COLOR[s.element] || ELEMENT_COLOR["토"];
                const uunsF = UUNSEONG_FORTUNE[s.uunseong];
                const isBlurredSw = !isPaid && i >= 4;

                const isOpen = openSewoonYear === s.year;
                return (
                  <div key={s.year} className="flex flex-col" style={{ minWidth: 76 }}>
                    <div
                      className="rounded-xl border p-3 text-center relative cursor-pointer"
                      style={{
                        background: s.isCurrent ? `${elStyle.bg}cc` : `${elStyle.bg}55`,
                        borderColor: isOpen ? elStyle.text : s.isCurrent ? "#fbbf24" : elStyle.border,
                        borderWidth: s.isCurrent || isOpen ? 2 : 1,
                      }}
                      onClick={() => !isBlurredSw && setOpenSewoonYear(isOpen ? null : s.year)}
                    >
                      {isBlurredSw && (
                        <div className="absolute inset-0 backdrop-blur-sm rounded-xl flex items-center justify-center z-10" style={{ background: "rgba(6,6,14,0.82)" }}>
                          <p className="text-[10px] text-gray-600">🔒</p>
                        </div>
                      )}
                      {s.isCurrent && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <span className="text-[9px] bg-yellow-500 text-black px-1.5 py-0.5 rounded-full font-black whitespace-nowrap">올해</span>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-500 mb-1">{s.year}</p>
                      <p className="text-lg font-black leading-none" style={{ color: elStyle.text }}>{s.cg}{s.jj}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-semibold">{s.sipseongJj}</p>
                      {uunsF && <p className="text-[9px] mt-0.5 font-bold" style={{ color: uunsF.color }}>{s.uunseong}</p>}
                      <p className="text-[8px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>{isOpen ? "▲ 닫기" : "▼ 월별"}</p>
                    </div>
                    {isOpen && (
                      <div className="mt-1.5 rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${elStyle.border}`, minWidth: 220 }}>
                        <p className="text-[9px] font-bold mb-1.5" style={{ color: elStyle.text }}>📊 {s.year}년 운 지수</p>
                        <LuckBars compact items={calcLuckIndices(s.sipseongCg, s.sipseongJj, s.uunseong, gender)} />

                        {/* 원국과의 합충형파 한눈에 보기 */}
                        {(() => {
                          const rels = getYearRelations(natalPillars, { cg: s.cg, jj: s.jj });
                          if (rels.length === 0) return null;
                          return (
                            <div className="mt-3">
                              <p className="text-[9px] font-bold mb-1.5" style={{ color: elStyle.text }}>🔀 원국과의 합충형파</p>
                              <div className="space-y-1">
                                {rels.map((r, ri) => (
                                  <div key={ri} className="rounded-lg px-2 py-1.5" style={{ background: `${r.color}1a`, border: `1px solid ${r.color}44` }}>
                                    <span className="text-[10px] font-black" style={{ color: r.color }}>{r.label}</span>
                                    <span className="text-[9px] ml-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{r.desc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        <p className="text-[9px] font-bold text-center mt-3 mb-1.5" style={{ color: elStyle.text }}>{s.year}년 월주 — 클릭하면 일운까지 보여요</p>
                        <div className="grid grid-cols-3 gap-1">
                          {Array.from({ length: 12 }, (_, mi) => {
                            const mp = getMonthPillar(s.cg, mi + 1);
                            const mKey = `${s.year}-${mi + 1}`;
                            const mOpen = openIlwoon === mKey;
                            return (
                              <div key={mi}
                                className="rounded-lg p-1 text-center cursor-pointer"
                                style={{ background: mOpen ? `${elStyle.bg}aa` : "rgba(255,255,255,0.04)", border: `1px solid ${mOpen ? elStyle.text : "rgba(255,255,255,0.06)"}` }}
                                onClick={() => setOpenIlwoon(mOpen ? null : mKey)}
                              >
                                <p className="text-[8px] text-gray-600">{mi + 1}월</p>
                                <p className="text-[11px] font-black" style={{ color: elStyle.text }}>{mp.cg}{mp.jj}</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* 일운 — 선택한 달의 날짜별 흐름 */}
                        {(() => {
                          const sel = openIlwoon && openIlwoon.startsWith(`${s.year}-`) ? Number(openIlwoon.split("-")[1]) : null;
                          if (!sel) return null;
                          const nDays = daysInMonth(s.year, sel);
                          return (
                            <div className="mt-3 rounded-xl p-2" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <p className="text-[9px] font-bold mb-1.5" style={{ color: elStyle.text }}>🗓 {s.year}년 {sel}월 — 일운 흐름</p>
                              <div className="grid grid-cols-5 gap-1">
                                {Array.from({ length: nDays }, (_, di) => {
                                  const dp = getDayPillar(s.year, sel, di + 1);
                                  const dUun = getUunseong(ilgan, dp.jj);
                                  const duf = UUNSEONG_FORTUNE[dUun];
                                  const dScore = duf ? Math.max(4, Math.min(96, Math.round(50 + (duf.score - 5) * 9))) : 50;
                                  const dColor = dScore >= 65 ? "#4ade80" : dScore <= 38 ? "#f87171" : "#94a3b8";
                                  return (
                                    <div key={di} className="rounded-md py-1 text-center" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${dColor}33` }}>
                                      <p className="text-[7px] text-gray-600">{di + 1}일</p>
                                      <p className="text-[9px] font-black" style={{ color: dColor }}>{dp.cg}{dp.jj}</p>
                                      <p className="text-[8px] font-bold" style={{ color: dColor }}>{dScore}</p>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-[8px] text-right mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>※ 일주 십이운성 기준 종합 컨디션 지수 (평균 50)</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 현재 세운 설명 */}
          {(() => {
            const cur = sewoon.find(s => s.isCurrent);
            if (!cur) return null;
            const uunsF = UUNSEONG_FORTUNE[cur.uunseong];
            const sipJj = SIPSEONG_DAEWOON[cur.sipseongJj];
            if (!uunsF && !sipJj) return null;
            return (
              <div className="mt-3 rounded-2xl p-4" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <p className="text-xs font-black text-yellow-400 mb-2">{cur.year}년 세운 분석 — {cur.cg}{cur.jj}</p>
                {uunsF && <p className="text-xs text-gray-300 leading-relaxed mb-2">{uunsF.narrative}</p>}
                {sipJj && (
                  <>
                    <p className="text-xs font-bold mb-1" style={{ color: sipJj.color }}>{sipJj.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{sipJj.life}</p>
                    <p className="text-xs text-gray-500 mt-1.5">{sipJj.caution}</p>
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {!isPaid && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#06060e] via-[#06060e]/95 to-transparent">
            <div className="max-w-lg mx-auto">
              {blueberries >= PRICE ? (
                <button
                  onClick={() => {
                    setShowering(true);
                    const next = blueberries - PRICE;
                    localStorage.setItem("sp_blueberries", String(next));
                    sessionStorage.setItem("daewoonPaid", "true");
                    setBlueberries(next);
                    setTimeout(() => { setIsPaid(true); setShowering(false); }, 700);
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 font-black text-white text-base shadow-xl hover:opacity-90 transition-opacity"
                >
                  ✦ 별조각 뿌리고 보기 ({PRICE.toLocaleString()}개)
                </button>
              ) : (
                <button
                  onClick={goPay}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 font-black text-white text-base shadow-xl hover:opacity-90 transition-opacity"
                >
                  전체 보고서 + AI 해설 + PDF — ₩{PRICE.toLocaleString()}
                </button>
              )}
              <p className="text-center text-xs text-gray-600 mt-2">교운기·대운 8개 전체·세운 14년치 완전 공개</p>
            </div>
          </div>
        )}

        {isPaid && (
          <div className="bg-green-500/10 border border-green-500/25 rounded-xl p-4 text-center">
            <p className="text-green-400 font-semibold text-sm">✓ 프리미엄 보고서 활성화됨</p>
            <p className="text-xs text-gray-500 mt-1">대운 8개 전체 · 세운 14년치 · AI 해설 포함</p>
          </div>
        )}
      </div>
    </main>
  );
}
