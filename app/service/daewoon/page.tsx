"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju, calcDaewoon, calcSewoon, ILGAN_PERSONALITY } from "@/lib/saju";
import type { DaewoonResult, SewoonItem } from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";
import ProfilePicker from "@/components/ProfilePicker";
import SaveProfilePrompt from "@/components/SaveProfilePrompt";
import AnalysisLoading from "@/components/AnalysisLoading";

const CY = new Date().getFullYear();
const YEARS_DW  = Array.from({ length: CY - 1919 }, (_, i) => CY - i);
const MONTHS_DW = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS_DW   = Array.from({ length: 31 }, (_, i) => i + 1);
const SIJIN_DW = [
  { v: "",   label: "모름 (시간 불명)" },
  { v: "23", label: "자시(子時) 23:00 – 00:59" },
  { v: "1",  label: "축시(丑時) 01:00 – 02:59" },
  { v: "3",  label: "인시(寅時) 03:00 – 04:59" },
  { v: "5",  label: "묘시(卯時) 05:00 – 06:59" },
  { v: "7",  label: "진시(辰時) 07:00 – 08:59" },
  { v: "9",  label: "사시(巳時) 09:00 – 10:59" },
  { v: "11", label: "오시(午時) 11:00 – 12:59" },
  { v: "13", label: "미시(未時) 13:00 – 14:59" },
  { v: "15", label: "신시(申時) 15:00 – 16:59" },
  { v: "17", label: "유시(酉時) 17:00 – 18:59" },
  { v: "19", label: "술시(戌時) 19:00 – 20:59" },
  { v: "21", label: "해시(亥時) 21:00 – 22:59" },
];

function DwPicker({ value, options, onChange, placeholder, suffix }: {
  value: string; options: {v:string;label:string}[];
  onChange: (v:string) => void; placeholder: string; suffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    if (open && listRef.current && value) {
      const el = listRef.current.querySelector(`[data-v="${value}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);
  const display = options.find(o => o.v === value)?.label ?? "";
  return (
    <div ref={ref} className="relative w-full">
      <div onClick={() => setOpen(!open)}
        className={`flex items-center justify-between bg-white/5 border rounded-xl px-4 py-3 cursor-pointer transition select-none hover:border-violet-500/60 ${open ? "border-violet-500" : "border-white/10"}`}>
        <span className={display ? "text-white text-sm" : "text-gray-600 text-sm"}>
          {display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}
        </span>
        <span className={`text-gray-500 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </div>
      {open && (
        <div ref={listRef} className="absolute z-50 w-full mt-1 bg-[#12121e] border border-white/20 rounded-xl overflow-y-auto shadow-2xl" style={{ maxHeight: 200 }}>
          {options.map(opt => (
            <div key={opt.v} data-v={opt.v}
              onClick={() => { onChange(opt.v); setOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt.v ? "text-violet-300 bg-violet-900/50 font-semibold" : "text-gray-300 hover:bg-white/8"}`}>
              {opt.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";

const PRICE = 15000;

const ELEMENT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  목: { bg: "#052e16", text: "#4ade80", border: "#14532d" },
  화: { bg: "#450a0a", text: "#f87171", border: "#7f1d1d" },
  토: { bg: "#2d1a00", text: "#fbbf24", border: "#78350f" },
  금: { bg: "#0f0e2e", text: "#a5b4fc", border: "#1e1b4b" },
  수: { bg: "#0a1f3a", text: "#60a5fa", border: "#0c2a4a" },
};

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

export default function DaewoonPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [birthYear, setBirthYear] = useState(1995);
  const [birthMonth, setBirthMonth] = useState(6);
  const [birthDay, setBirthDay] = useState(2);
  const [birthHour, setBirthHour] = useState<number | null>(11);
  const [useJajasi, setUseJajasi] = useState(false);
  const [birthPlace, setBirthPlace] = useState("서울");
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [daewoon, setDaewoon] = useState<DaewoonResult | null>(null);
  const [sewoon, setSewoon] = useState<SewoonItem[]>([]);
  const [ilgan, setIlgan] = useState("");
  const [monthJj, setMonthJj] = useState("");
  const [step, setStep] = useState<"splash" | "entry" | "loading" | "preview">("splash");
  const [isPaid, setIsPaid] = useState(false);
  const [blueberries, setBlueberries] = useState(0);
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
      setGender((saved.gender as "male" | "female") || "female");
      setBirthYear(saved.birthYear);
      setBirthMonth(saved.birthMonth);
      setBirthDay(saved.birthDay);
      if (saved.birthHour != null) setBirthHour(saved.birthHour);
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
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 2s ease-in-out infinite}`}</style>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[160px]" style={{ background: "rgba(251,191,36,0.12)" }} />
          <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: "rgba(192,132,252,0.1)" }} />
        </div>

        <div className="relative z-10 flex items-center px-5 py-4">
          <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>
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
        <div className="max-w-lg mx-auto px-5 py-10 pb-24">
          <button onClick={() => setStep("splash")} className="text-xs text-gray-600 hover:text-gray-400 mb-6 inline-flex items-center gap-1 transition">← 뒤로</button>

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
            setName(p.name);
            setGender(p.gender);
            setBirthYear(p.birthYear);
            setBirthMonth(p.birthMonth);
            setBirthDay(p.birthDay);
            if (!p.birthHourUnknown && p.birthHour >= 0) setBirthHour(p.birthHour);
            else setBirthHour(null);
          }} />

          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">이름 (선택)</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">성별</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as "male" | "female")}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition"
              >
                <option value="female">여성</option>
                <option value="male">남성</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-2">생년월일</label>
              <div className="flex gap-2 mb-3">
                {(["solar", "lunar"] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setCalendarType(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${calendarType === t ? "bg-violet-600 text-white" : "bg-white/5 text-gray-400 border border-white/10"}`}
                  >
                    {t === "solar" ? "양력" : "음력"}
                  </button>
                ))}
              </div>
              {calendarType === "lunar" && (
                <label className="flex items-center gap-2 text-xs text-gray-400 mb-3 cursor-pointer select-none">
                  <input type="checkbox" checked={isLeapMonth} onChange={e => setIsLeapMonth(e.target.checked)} className="accent-violet-500" />
                  윤달
                </label>
              )}
              <div className="grid grid-cols-3 gap-2">
                <DwPicker
                  value={String(birthYear)}
                  options={YEARS_DW.map(y => ({ v: String(y), label: String(y) }))}
                  onChange={v => setBirthYear(Number(v))}
                  placeholder="연도" suffix="년"
                />
                <DwPicker
                  value={String(birthMonth)}
                  options={MONTHS_DW.map(m => ({ v: String(m), label: String(m) }))}
                  onChange={v => setBirthMonth(Number(v))}
                  placeholder="월" suffix="월"
                />
                <DwPicker
                  value={String(birthDay)}
                  options={DAYS_DW.map(d => ({ v: String(d), label: String(d) }))}
                  onChange={v => setBirthDay(Number(v))}
                  placeholder="일" suffix="일"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">출생시간 (선택)</label>
              <DwPicker
                value={birthHour == null ? "" : String(birthHour)}
                options={SIJIN_DW}
                onChange={v => setBirthHour(v === "" ? null : Number(v))}
                placeholder="출생시간 선택 (선택)"
              />
            </div>
          </div>

          {/* 야자시/조자시 */}
          {birthHour !== null && (
            <button
              type="button"
              onClick={() => setUseJajasi(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition w-full"
              style={{
                background: useJajasi ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.04)",
                border: useJajasi ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.1)",
                color: useJajasi ? "#fbbf24" : "rgba(255,255,255,0.4)",
              }}
            >
              <span className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                style={{ borderColor: useJajasi ? "#fbbf24" : "rgba(255,255,255,0.2)" }}>
                {useJajasi && <span className="text-[10px] font-black">✓</span>}
              </span>
              야자시·조자시 적용 (23시~01시생)
            </button>
          )}

          {/* 태어난 도시 */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">태어난 도시 (경도 보정)</label>
            <input
              type="text"
              value={birthPlace}
              onChange={e => setBirthPlace(e.target.value)}
              placeholder="서울 / 부산 / 대구 등"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500 transition"
            />
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
      <div className="max-w-lg mx-auto px-5 py-8 pb-32">
        <button onClick={() => setStep("entry")} className="text-xs text-gray-600 hover:text-gray-400 mb-6 inline-flex items-center gap-1 transition">← 다시 입력</button>

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
          name={name} birthYear={birthYear} birthMonth={birthMonth} birthDay={birthDay}
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

                return (
                  <div key={s.year} className="rounded-xl border p-3 text-center relative" style={{
                    minWidth: 76,
                    background: s.isCurrent ? `${elStyle.bg}cc` : `${elStyle.bg}55`,
                    borderColor: s.isCurrent ? "#fbbf24" : elStyle.border,
                    borderWidth: s.isCurrent ? 2 : 1,
                  }}>
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
                    const next = blueberries - PRICE;
                    localStorage.setItem("sp_blueberries", String(next));
                    sessionStorage.setItem("daewoonPaid", "true");
                    setBlueberries(next);
                    setIsPaid(true);
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 font-black text-white text-base shadow-xl hover:opacity-90 transition-opacity"
                >
                  ⭐ 별조각 {PRICE.toLocaleString()}개로 즉시 열기
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
