"use client";
import { useState, useEffect, useRef } from "react";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}
import { analyzeSaju, ILGAN_PERSONALITY, ILGAN_INNER_OUTER, CHEONGAN_ELEMENT } from "@/lib/saju";
import { loadSajuData, saveSajuData } from "@/lib/savedSaju";
import type { SajuResult } from "@/lib/saju";
import ProfilePicker from "@/components/ProfilePicker";
import SaveProfilePrompt from "@/components/SaveProfilePrompt";
import AnalysisLoading from "@/components/AnalysisLoading";
import SipseongInsight from "@/components/SipseongInsight";
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";
import ResultFooterActions from "@/components/ResultFooterActions";
import BackButton from "@/components/BackButton";

const CY_MB = new Date().getFullYear();
const YEARS_MB = Array.from({ length: CY_MB - 1919 }, (_, i) => CY_MB - i);
const MONTHS_MB = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS_MB = Array.from({ length: 31 }, (_, i) => i + 1);

function MbPicker({ value, options, onChange, placeholder, suffix }: {
  value: string; options: { v: string; label: string }[];
  onChange: (v: string) => void; placeholder: string; suffix?: string;
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
        className={`flex items-center justify-between bg-white/5 border rounded-xl px-3 py-2.5 cursor-pointer transition select-none hover:border-violet-500/60 ${open ? "border-violet-500" : "border-white/10"}`}>
        <span className={`text-sm ${display ? "text-white" : "text-gray-600"}`}>
          {display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}
        </span>
        <span className={`text-gray-500 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </div>
      {open && (
        <div ref={listRef} className="absolute z-50 w-full mt-1 bg-[#12121e] border border-white/20 rounded-xl overflow-y-auto shadow-2xl" style={{ maxHeight: 180 }}>
          {options.map(opt => (
            <div key={opt.v} data-v={opt.v}
              onClick={() => { onChange(opt.v); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${value === opt.v ? "text-violet-300 bg-violet-900/50 font-semibold" : "text-gray-300 hover:bg-white/8"}`}>
              {opt.label}{suffix && opt.v ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MBTI_TYPES = ["INTJ","INTP","INFJ","INFP","ISTJ","ISTP","ISFJ","ISFP","ENTJ","ENTP","ENFJ","ENFP","ESTJ","ESTP","ESFJ","ESFP"] as const;
type MBTI = typeof MBTI_TYPES[number];

type Element = "목" | "화" | "토" | "금" | "수";

// MBTI별 오행 주력 매핑
const MBTI_ELEMENT: Record<MBTI, { primary: Element; secondary: Element; desc: string }> = {
  INTJ: { primary:"금", secondary:"수", desc:"냉철한 전략가. 금(金)의 결단과 수(水)의 통찰이 조화를 이룹니다. 목표를 정하면 감정보다 논리를 앞세워 끝까지 밀어붙이는 힘이 있습니다." },
  INTP: { primary:"수", secondary:"금", desc:"논리적 사색가. 수(水)의 지혜와 금(金)의 분석력이 빛납니다. 복잡한 것을 해체하고 원리를 찾는 것에서 진정한 즐거움을 느끼는 유형입니다." },
  INFJ: { primary:"수", secondary:"목", desc:"통찰력 있는 이상주의자. 수(水)의 직관과 목(木)의 성장이 어우러집니다. 사람의 내면을 꿰뚫어 보며 조용하지만 깊은 영향력을 발휘합니다." },
  INFP: { primary:"목", secondary:"수", desc:"창의적 몽상가. 목(木)의 감수성과 수(水)의 상상력이 핵심입니다. 자신만의 감성 세계를 가지며, 표현하지 않아도 내면에 풍부한 이야기를 품고 있습니다." },
  ISTJ: { primary:"토", secondary:"금", desc:"신뢰할 수 있는 관리자. 토(土)의 안정과 금(金)의 정밀함이 강점입니다. 약속과 책임을 매우 중시하며, 한번 맡은 일은 반드시 끝을 보는 사람입니다." },
  ISTP: { primary:"금", secondary:"토", desc:"용감한 실험가. 금(金)의 실행력과 토(土)의 현실감각이 탁월합니다. 도구와 원리를 다루는 데 뛰어나고, 위기 상황에서도 냉정하게 최선책을 찾아냅니다." },
  ISFJ: { primary:"토", secondary:"수", desc:"헌신적인 수호자. 토(土)의 포용과 수(水)의 공감이 특징입니다. 주변을 묵묵히 살피며, 말보다 행동으로 신뢰를 쌓아가는 유형입니다." },
  ISFP: { primary:"목", secondary:"토", desc:"호기심 넘치는 예술가. 목(木)의 자유와 토(土)의 따뜻함이 조화롭습니다. 아름다운 것에 대한 감수성이 섬세하고, 자기 페이스로 깊이 있는 표현을 이어갑니다." },
  ENTJ: { primary:"화", secondary:"금", desc:"대담한 지도자. 화(火)의 열정과 금(金)의 추진력이 최강입니다. 전략과 실행을 동시에 장악하며, 조직을 빠르게 목표 지점으로 이끄는 능력이 탁월합니다." },
  ENTP: { primary:"화", secondary:"수", desc:"뜨거운 변론가. 화(火)의 창의와 수(水)의 통찰로 새로운 길을 엽니다. 기존 틀을 흔드는 데서 에너지를 얻으며, 토론과 새 아이디어 탐구를 즐깁니다." },
  ENFJ: { primary:"화", secondary:"목", desc:"카리스마 있는 주인공. 화(火)의 리더십과 목(木)의 인문 에너지가 빛납니다. 사람의 가능성을 먼저 보고, 그 성장을 이끌어내는 데서 가장 큰 보람을 느낍니다." },
  ENFP: { primary:"목", secondary:"화", desc:"열정적인 활동가. 목(木)의 성장과 화(火)의 표현이 무한한 가능성을 만듭니다. 영감을 받으면 에너지가 폭발적으로 올라오고, 주변 사람들까지 끌어들이는 힘이 있습니다." },
  ESTJ: { primary:"토", secondary:"화", desc:"확고한 관리자. 토(土)의 실용주의와 화(火)의 추진력이 조직을 이끕니다. 규칙과 질서 안에서 일이 명확하게 돌아갈 때 가장 큰 효율을 발휘합니다." },
  ESTP: { primary:"화", secondary:"토", desc:"모험을 즐기는 사업가. 화(火)의 즉흥성과 토(土)의 현실감각이 기회를 잡습니다. 이론보다 행동이 앞서며, 실제 현장에서 빠르게 결과를 만들어내는 능력이 탁월합니다." },
  ESFJ: { primary:"토", secondary:"목", desc:"사교적인 외교관. 토(土)의 조화와 목(木)의 인간관계가 사람을 모읍니다. 관계의 조화를 매우 중시하며, 주변 사람들이 편안할 때 자신도 만족감을 느낍니다." },
  ESFP: { primary:"화", secondary:"목", desc:"자유로운 연예인. 화(火)의 표현력과 목(木)의 창의성으로 무대를 빛냅니다. 현재 이 순간을 충분히 즐기는 것을 가장 중요하게 여기며, 그 에너지가 주변에 활력을 줍니다." },
};

// MBTI × 일간 조합 시너지
const ILGAN_MBTI_SYNERGY: Record<string, Record<string, string>> = {
  갑: {
    ENTJ: "큰 나무처럼 위로 뻗으려는 성질이 타고난 리더십 기질과 맞물리면, 조직을 세우고 방향을 선포하는 데서 누구도 범접하기 힘든 존재감을 내뿜어요. 목표를 정하면 중간에 꺾이지 않고 밀어붙이는 힘이 있고, 카리스마보다 압도적인 추진력으로 사람을 끌어당겨요. 다만 타인의 페이스를 무시한 채 혼자 달리기 쉬우니, '같이 간다'는 감각을 의식적으로 키우면 정말 무서운 리더가 됩니다.",
    ENFJ: "성장하려는 에너지와 사람을 움직이고 싶은 욕구가 시너지를 이루면, 스스로 모범을 보이면서 주변을 끌어올리는 스타일의 리더가 돼요. 교육·코칭·조직 문화 분야에서 특히 강하게 빛나고, '내가 믿는 방향으로 같이 가자'는 설득력이 비범해요. 한 가지 함정은 타인을 지나치게 끌어안다가 자기 에너지를 소진하는 것 — 때로는 혼자 뻗어야 하는 나무임을 잊지 마세요.",
    INTJ: "독립심과 큰 그림을 그리는 능력이 합쳐지면, 장기 목표를 혼자 조용히 설계하고 반드시 완성시키는 유형이에요. 겉으로 유연해 보여도 핵심 방향을 잘 바꾸지 않고, 자신만의 전략을 차근차근 실현하는 뚝심이 있어요. 타인의 인정에 크게 흔들리지 않는 대신, 감정을 표현하는 데 서툴러서 고독하다는 느낌을 자주 받을 수 있어요.",
    INFP: "자라나려는 생명력과 깊은 내면의 이상주의가 만나면, 현실보다 한 발 앞선 세계를 그리고 그걸 언어나 예술로 담아내는 창작자가 돼요. 글쓰기·음악·그림 등에서 독자적인 미적 세계를 구축하고, 남들이 보지 못하는 곳에서 씨앗을 심어두는 사람이에요. 다만 방향이 너무 많이 바뀌면 결실을 맺기 전에 지치기 쉬우니, 한 가지 작품을 완성하는 경험이 중요해요.",
    ISTJ: "곧게 뻗으려는 성질과 묵묵히 성실하게 쌓아가는 기질이 결합하면, 흔들림 없이 장기 프로젝트를 끌고 가는 사람이 돼요. 스타트가 느릴 수 있지만 한번 방향을 정하면 포기가 드물고, 시간이 지날수록 신뢰 자산이 쌓여 기회가 자연스럽게 따라오는 유형이에요. 변화에 적응하는 유연성을 조금 더 키우면, 안정성과 성장력을 동시에 갖춘 드문 사람이 됩니다.",
    ENTP: "확장하려는 에너지와 새로운 아이디어를 끊임없이 뒤집고 쌓아가는 기질이 만나면, 신사업이나 벤처처럼 판을 키우는 환경에서 폭발적으로 빛이 나요. 아이디어가 너무 많아서 방향을 못 잡는 게 약점인데, 갑목 특유의 한 방향으로 뻗으려는 힘이 그 산만함을 잡아줘요. 한 가지를 선택하고 나면 누구보다 빠르게 가지를 치고 세력을 넓히는 스타일로 변신해요.",
    INFJ: "크고 곧게 자라려는 생명력과 사람의 내면을 꿰뚫어 보는 통찰이 어우러지면, 상담가·작가·교육자처럼 오랜 시간에 걸쳐 한 사람의 인생을 바꾸는 영향력을 발휘해요. 겉으로는 온화하지만 믿는 방향에 대한 고집이 강해서, 한번 뿌리내리면 쉽게 흔들리지 않아요. 완벽한 답을 찾으려다가 행동을 미루는 경향이 있으니, 계획이 70%일 때 움직이는 연습이 필요해요.",
  },
  을: {
    INFP: "바람에 흔들리면서도 뿌리를 놓지 않는 유연한 생명력과, 이상적인 세계를 마음속에 품고 그것을 표현하고 싶어하는 감수성이 만나면 예술과 글쓰기에서 독보적인 세계를 만들어내요. 어디서든 적응하면서 자기만의 색을 잃지 않는 것이 이 조합의 강점이고, 누군가를 가르치거나 설득하기보다 조용히 공감하고 스며드는 방식으로 사람을 움직여요. 마감과 현실적인 실행 계획을 잡아줄 외부 구조를 의도적으로 만들어두는 게 결실을 맺는 열쇠예요.",
    ISFJ: "환경에 맞게 유연하게 자리를 잡는 성질과, 주변 사람을 세심하게 살피고 돌보는 기질이 합쳐지면 어느 공동체에서나 없어서는 안 되는 존재가 돼요. 눈에 띄지 않아도 조용히 시스템을 지탱하고, 누군가 힘들어할 때 먼저 알아채고 다가가는 사람이에요. 정작 본인의 피로와 경계는 표현하지 않다가 한꺼번에 무너지는 게 반복 패턴이니, 자기 소진 전에 먼저 말하는 연습이 중요해요.",
    ENFP: "어디서든 꽃피우는 적응력과 열정적으로 새로운 가능성에 몸을 던지는 성격이 만나면, 상황이 아무리 바뀌어도 무너지지 않고 오히려 새 환경에서 더 빛나는 사람이 돼요. 아이디어와 사람을 연결하는 감각이 뛰어나고, 분위기를 부드럽게 만들면서도 흐름을 자기가 원하는 방향으로 이끄는 묘한 힘이 있어요. 너무 여러 방향에 에너지를 쓰다 정작 자기 뿌리를 잃는 경우가 있으니, 무엇이 진짜 내 것인지 주기적으로 점검하세요.",
    INTP: "섬세하게 관찰하고 맥락을 읽는 감각과 논리적으로 분석하고 체계를 잡는 능력이 조화를 이루면, 복잡한 문제를 조용히 해체하고 가장 우아한 해법을 찾아내는 사람이 돼요. 언어·음악 이론·심리학처럼 미묘한 차이를 다루는 분야에서 특히 강하고, 남들이 무심코 지나친 디테일을 잡아내는 눈을 가졌어요. 결론을 내리는 데 시간이 너무 오래 걸리는 게 약점이니, 적당한 시점에 '지금 아는 것으로 결정한다'는 결단 습관이 필요해요.",
    ISFP: "자연의 아름다움을 본능적으로 느끼는 감각과 몸과 감각으로 세상을 경험하는 성향이 만나면, 손에 잡히는 아름다움을 만들어내는 예술가 기질이 완성돼요. 화려하게 어필하기보다 작품 자체의 완성도로 조용히 존재감을 드러내는 스타일이고, 음식·수공예·패션·사진 등 감각적인 분야에서 두드러진 성과를 내요. 자신의 작품에 상업적 가치를 붙이는 것을 어색해하는 경향이 있는데, 이 점을 극복하면 더 넓은 무대로 나아갈 수 있어요.",
    INTJ: "겉으로는 부드럽고 맞춰주는 것 같지만, 안으로는 자기만의 전략과 기준을 단단히 잡고 있는 유형이에요. 관계나 환경을 파악하는 속도가 빠르고, 필요한 것을 조용히 계산하면서 장기 목표를 향해 묵묵히 움직여요. 자신의 계획을 쉽게 드러내지 않기 때문에 주변에서 읽기 어려운 사람으로 느껴질 수 있는데, 이 신비로운 분위기가 오히려 강점이 되는 경우가 많아요.",
    ENFJ: "어느 자리에나 스며들어 자리를 잡는 유연함과 사람들에게 영감을 주고 싶은 욕구가 결합하면, 부드러운 카리스마로 공동체를 이끄는 사람이 돼요. 강압적으로 밀어붙이기보다 자연스럽게 분위기를 만들어 사람들이 자발적으로 따르게 하는 방식이 특기예요. 지나치게 타인의 시선을 의식하다가 정작 자기 방향을 잃는 순간이 찾아올 수 있으니, 내가 원하는 것을 먼저 정해두는 버릇을 들이는 게 중요해요.",
  },
  병: {
    ENTJ: "태양처럼 주변을 밝히고 열을 주는 에너지와 결과를 향해 조직을 밀어붙이는 힘이 결합하면, 역사에 남는 규모의 리더십을 발휘해요. 분위기를 장악하는 것뿐만 아니라 사람들로 하여금 자신도 모르게 움직이게 만드는 자연스러운 권위를 갖고 있어요. 다만 속도가 너무 빨라서 뒤처지는 사람을 놓치기 쉽고, 자신의 그늘이 타인에게 얼마나 짙은지 인식하지 못하는 경우가 있어요.",
    ENFJ: "따뜻하게 빛을 뿌리는 에너지와 사람에게 영감을 주고 변화를 일으키고 싶은 강한 욕구가 만나면, 말 한마디로 수백 명을 움직이는 멘토형 리더가 돼요. 강의·방송·사회 운동 같은 무대에서 특히 강하고, 에너지가 밖으로 발산될수록 더 충전되는 구조라 대중 앞에서 오히려 활력이 생겨요. 사람들의 기대에 부응하려다 자신의 경계를 잃는 소진이 패턴으로 반복될 수 있으니 주의하세요.",
    ESTP: "즉흥적으로 빠르게 불을 피우는 에너지와 지금 이 순간 기회를 낚아채는 현장 감각이 결합하면, 비즈니스·영업·협상처럼 실시간 판단이 중요한 환경에서 타의 추종을 불허해요. 분위기를 순식간에 바꾸는 능력이 있고, 처음 보는 사람도 금방 끌어당기는 매력이 있어요. 즉흥성이 강한 만큼 사후 수습이나 관계 유지에 소홀해질 수 있으니, 잘 맞는 사람에게는 꾸준함을 의식적으로 보여주는 게 좋아요.",
    ESFP: "밝고 뜨거운 에너지와 지금 이 순간 최대한 화려하게 자신을 표현하고 싶은 욕구가 만나면, 무대 위에서 자연스럽게 주인공이 되는 사람이 돼요. 공연·방송·이벤트처럼 감각적인 순간을 연출하는 일에서 빛나고, 주변 사람들의 에너지를 끌어올리는 능력이 탁월해요. 깊이 있는 집중력과 마감을 지키는 습관을 기르면 순간적인 인기를 지속적인 커리어로 전환할 수 있어요.",
    ENTP: "창의적인 불꽃과 기존의 논리를 뒤집고 새로운 구도를 제시하는 기질이 만나면, 트렌드를 새로 만들거나 업계의 판을 바꾸는 혁신가 유형이에요. 아이디어가 식기 전에 실행으로 옮기는 추진력이 남달리 강하고, 다른 사람들이 '그게 될까?'라고 할 때 이미 결과를 내고 있는 경우가 많아요. 단점은 지루해지면 에너지가 급격히 빠지는 것 — 다음 프로젝트를 미리 준비해두면 흐름이 끊기지 않아요.",
    ENFP: "뜨겁게 타오르는 에너지와 가능성을 보고 열정적으로 뛰어드는 기질이 합쳐지면, 어떤 분야든 초반의 뜨거운 바람을 만들어내는 사람이 돼요. 새로운 사람, 새로운 프로젝트, 새로운 아이디어에 신나게 불을 붙이고, 그 흥분이 주변으로 전염되는 효과가 있어요. 뜨겁게 시작한 만큼 빠르게 식는 패턴이 반복되지 않도록, 초반의 열기를 지속시킬 구조를 잡아두는 것이 성과로 이어지는 핵심이에요.",
    ISTJ: "밝게 비추고 싶어하는 에너지와 책임감 있게 안정적으로 지켜나가려는 성향이 만나면, 겉으로 활발해 보이면서도 약속과 규칙은 반드시 지키는 신뢰할 수 있는 사람이 돼요. 공직·금융·의료처럼 신뢰를 기반으로 하는 분야에서 강하고, 사람들에게 좋은 인상을 주면서도 실제로 믿을 수 있는 드문 조합이에요. 때로는 하고 싶은 것과 해야 하는 것 사이의 갈등을 느낄 수 있으니, 자기 표현의 공간을 확보해두세요.",
  },
  정: {
    INFJ: "촛불처럼 가까이 있는 사람에게 은은하게 빛을 주는 에너지와 사람의 본질과 미래를 꿰뚫어 보는 직관이 결합하면, 말 한마디로 타인의 인생 방향을 바꾸는 신비로운 영향력을 가져요. 상담·글쓰기·교육 분야에서 특히 강하고, 자신은 조용히 있어도 주변이 자연스럽게 끌려오는 분위기가 있어요. 너무 많은 사람을 동시에 감당하려다가 소진되기 쉬운 구조이니, 에너지를 나눌 사람의 수를 의식적으로 조절하세요.",
    ENFP: "가까운 사람에게 깊은 감성으로 빛을 나눠주는 성질과 세상 모든 가능성을 향해 열정적으로 달려가는 기질이 만나면, 예술·상담·교육에서 사람의 마음을 움직이는 깊은 감동을 줘요. 아이디어를 감성적으로 포장해서 전달하는 능력이 탁월하고, 처음에는 산만해 보여도 자기가 진심으로 원하는 것을 찾으면 놀라운 집중력을 발휘해요. 에너지가 폭발했다가 갑자기 꺼지는 사이클을 인식하고, 회복 루틴을 미리 설계해두면 번아웃을 예방할 수 있어요.",
    ISFJ: "세심하고 따뜻하게 불을 밝히는 에너지와 헌신적으로 주변을 돌보는 기질이 결합하면, 의료·복지·상담·교육처럼 사람의 결핍을 채워주는 분야에서 타의 추종을 불허하는 역량을 발휘해요. 떠들썩하지 않아도 자기 자리에서 묵묵하게 빛을 내고, 그 빛이 오래 남는 유형이에요. 타인의 필요에 지나치게 응하다가 자신의 감정과 필요는 뒤로 미루는 습관이 생기지 않도록, 정기적으로 자기 자신과 마주하는 시간을 반드시 지키세요.",
    INTJ: "조용하고 정밀하게 빛을 쏘아 원하는 곳을 비추는 에너지와 장기적인 전략을 치밀하게 실행하는 능력이 만나면, 고독하지만 강한 영향력을 가진 전문가 유형이 돼요. 자신이 중요하게 여기는 분야에 대한 집념이 비범하고, 한번 목표를 정하면 세부 계획까지 완성도 있게 짜는 능력이 있어요. 감정과 직관을 억누르고 논리만으로 결정하려다 정작 스스로 무엇을 원하는지 잃어버리는 경우가 있으니, 내면의 감각을 외면하지 마세요.",
    INFP: "섬세하게 가까운 곳을 비추는 에너지와 자기만의 이상적인 세계를 창조하고픈 욕구가 만나면, 시·소설·음악·드라마처럼 인간 내면의 복잡한 감정을 담아내는 작품에서 독보적인 세계를 구축해요. 남들이 놓치는 감정의 미묘한 결을 포착하는 능력이 있고, 그걸 아름다운 형태로 표현하는 것을 사명처럼 여겨요. 자기 작품에 대한 가혹한 자기 비판이 창작을 막는 경우가 있으니, 완성을 목표로 일단 끝내는 경험을 반복하는 게 중요해요.",
    ENTP: "따뜻하게 빛을 발하면서도 속에서 끊임없이 아이디어가 타오르는 에너지와 기존 틀을 뒤집는 논리 게임을 즐기는 기질이 만나면, 겉으로는 따뜻한데 대화를 시작하면 놀라운 날카로움을 발휘하는 사람이 돼요. 감성으로 문을 열고 논리로 설득하는 방식이 탁월해서, 협상이나 기획처럼 복잡한 이해관계를 다루는 분야에서 강해요. 때로는 논쟁이 길어져 관계가 어색해지는 경우가 있으니, 이겼다는 느낌보다 상대가 납득했다는 느낌을 목표로 삼으세요.",
    ISFP: "은은하게 감성을 밝히는 에너지와 몸과 감각으로 세상의 아름다움을 경험하는 성향이 결합하면, 작지만 섬세한 아름다움을 찾아내고 그것을 표현하는 예술가 유형이에요. 빠른 성과보다 작품 하나하나에 진심을 담는 방식으로 일하고, 그 진심이 오랫동안 사람들에게 남는 경우가 많아요. 자신의 작품을 세상에 내놓는 것에 두려움을 느끼는 경향이 있는데, 적은 수의 신뢰할 수 있는 사람에게 먼저 보여주는 것부터 시작해보세요.",
  },
  무: {
    ESTJ: "산처럼 묵직하고 흔들리지 않는 에너지와 조직을 체계적으로 관리하는 능력이 결합하면, 어떤 조직에서도 중심축 역할을 하는 사람이 돼요. 규칙과 원칙을 지키는 것을 중요하게 여기고, 모두가 지쳤을 때도 자리를 지키며 버티는 지구력이 뛰어나요. 자신의 기준이 너무 강해 융통성이 부족하다는 소리를 들을 수 있으니, '틀린 게 아니라 다르다'는 감각을 의식적으로 연습하세요.",
    ISTJ: "두터운 신뢰감과 책임을 끝까지 다하는 성실함이 만나면, 조직 내에서 '이 사람은 반드시 해낸다'는 신뢰를 얻는 핵심 인재가 돼요. 장기간에 걸쳐 누군가를 보호하거나 시스템을 지키는 역할에서 특히 강하고, 화려하진 않아도 없으면 무너지는 기둥 같은 존재예요. 변화에 강한 저항감을 느끼는 것이 유일한 약점인데, 현실이 바뀌면 전략도 유연하게 바꿀 줄 안다는 자기 신뢰를 키워두면 좋아요.",
    ENTJ: "품고 포용하는 에너지와 결과를 향해 사람을 이끄는 리더십이 결합하면, 큰 조직을 다양한 사람을 담아내면서도 방향을 잃지 않고 운영하는 경영자 유형이에요. 섬세한 감정적 요구까지 놓치지 않으면서 큰 방향을 드라이하게 결정하는 드문 밸런스를 갖고 있어요. 방어적으로 자기 영역을 지키려는 본능이 협업의 발목을 잡을 수 있으니, 때로는 경계를 열고 사람을 받아들이는 연습이 필요해요.",
    ISFJ: "모든 것을 품어주는 포용력과 구석구석까지 세심하게 돌보는 헌신이 만나면, 가정·조직·공동체에서 없어서는 안 되는 버팀목이 돼요. 누군가가 아프거나 힘들 때 가장 먼저 느끼고 가장 오래 곁에 있는 사람이고, 그 안정감이 주변을 조용히 지켜줘요. 자기 감정이나 필요는 표현하지 않고 혼자 감당하다 지쳐가는 패턴에 주의하고, 주변에 짐을 나눠줄 용기를 기르세요.",
    ESFJ: "중심을 잡아주는 안정된 기운과 사람들 사이의 분위기를 부드럽게 만드는 사교성이 결합하면, 공동체가 조화롭게 굴러가도록 자연스럽게 연결하는 역할을 해요. 갈등 상황에서 어느 편도 들지 않으면서 중재하는 능력이 있고, 다양한 성격의 사람들이 함께 일할 수 있는 환경을 만드는 데 탁월해요. 자신의 의견을 뚜렷하게 드러내지 않아서 때로는 '무슨 생각인지 모르겠다'는 말을 들을 수 있는데, 주관을 조금 더 꺼내는 연습이 신뢰를 높여줘요.",
    ENTP: "포용하는 넓은 에너지와 새로운 아이디어로 기존 틀을 흔들고 싶어하는 기질이 만나면, 겉으로는 안정적으로 보이면서도 속에서는 계속 새로운 것을 시도하는 유형이에요. 사람을 담는 그릇이 크기 때문에 아이디어가 아무리 파격적이어도 사람들이 당황하지 않고 따라오는 편이에요. 너무 많은 아이디어가 실행되지 않고 쌓이면 스스로 답답해지니, 정기적으로 가장 중요한 것 하나를 골라 마무리하는 리듬을 만들어두세요.",
    INFP: "묵직하게 품어주는 에너지와 내면에 가득한 이상과 이야기가 만나면, 겉으로는 꾸준하고 안정적인데 안에서는 계속 새로운 세계를 상상하는 복잡한 내면을 가진 사람이에요. 철학·상담·집필처럼 시간이 오래 걸리지만 깊은 곳을 건드리는 분야에서 천천히 빛나요. 완성되지 않은 작품이 쌓여 스스로를 무능하다고 느끼는 경우가 있는데, 작은 것이라도 끝내는 경험이 자기 신뢰를 회복하는 열쇠예요.",
  },
  기: {
    ISFJ: "촉촉하고 따뜻하게 주변을 돌보는 에너지와 헌신적으로 사람을 챙기는 기질이 만나면, 세상에서 가장 믿음직한 사람이 돼요. 화려하게 앞에 나서기보다 조용히 곁을 지키면서 필요한 것을 미리 채워주는 유형이고, 그 세심함이 오랜 신뢰로 쌓여요. 남을 돌보다가 자신이 필요한 것을 마지막으로 미루는 습관이 굳어지면 지치게 되니, 본인이 원하는 것을 표현하는 연습을 의도적으로 해두세요.",
    ISFP: "실용적이고 현실에 발을 딛고 있는 에너지와 감각적인 아름다움을 추구하는 예술 기질이 결합하면, 생활 속에서 쓸모 있으면서도 아름다운 것을 만들어내는 사람이 돼요. 요리·인테리어·수공예·플로리스트 같은 일상의 감각을 다루는 분야에서 자신만의 영역을 만들어요. 자신이 만든 것에 상업적 가치를 매기는 것을 어색해하는 경향이 있는데, 가치를 인정받을수록 더 좋은 것을 만들 수 있다는 발상 전환이 필요해요.",
    ESFJ: "부드럽게 모든 것을 연결하는 에너지와 사람들 사이에서 분위기를 만들고 조율하는 능력이 결합하면, 어디서나 친화력과 신뢰감을 동시에 주는 사람이 돼요. 모임·서비스·복지처럼 다양한 사람을 상대해야 하는 분야에서 특히 강하고, 갈등 상황에서도 분위기를 부드럽게 유지하는 능력이 있어요. 자신의 평가나 판단을 숨기고 중립적으로 보이려다가 정작 중요한 순간에 의견을 내지 못하는 경우가 있으니, 자기 생각을 말하는 연습을 꾸준히 하세요.",
    INFJ: "현실적으로 발을 딛고 있는 에너지와 사람의 내면을 깊이 읽는 통찰이 만나면, 이상적인 비전을 실제로 실현 가능한 계획으로 전환하는 능력이 뛰어난 상담사형 리더가 돼요. 꿈을 꾸면서도 실질적인 변화를 이끌어내는 드문 조합이고, 조직이나 공동체 안에서 방향을 잡아주는 역할을 자연스럽게 맡게 돼요. 스스로 너무 많은 것을 파악하고 감당하려다가 혼자 지쳐가는 경우가 있으니, 신뢰할 수 있는 사람에게 나눠주는 연습을 해두세요.",
    ISTJ: "성실하게 자기 자리를 지키는 에너지와 정확하게 꼼꼼하게 일을 처리하는 기질이 결합하면, 어떤 디테일도 놓치지 않고 약속한 것은 반드시 해내는 업무의 달인이 돼요. 빠른 성과보다 정확한 완성을 추구하고, 그 꾸준함이 시간이 지날수록 두터운 신뢰로 쌓여요. 변화에 적응하는 속도가 느린 것이 유일한 약점인데, 새로운 방식을 '다른 것'으로 수용하는 마음가짐을 키우면 더 넓은 영역에서 활약할 수 있어요.",
    INTP: "실용적으로 현실에 뿌리를 두는 에너지와 복잡한 것을 분석해서 원리를 찾아내는 논리력이 만나면, 추상적인 이론을 실제로 사용할 수 있는 무언가로 만들어내는 능력이 탁월해요. 프로그래밍·회계·언어 분석·데이터 등 정밀도가 요구되는 분야에서 조용하지만 강하게 빛나요. 완벽한 답을 찾는 과정이 너무 길어져서 결론을 내기 전에 지치거나 프로젝트를 방치하는 경우가 있으니, '지금 상태로 충분하다'는 판단을 내리는 연습이 필요해요.",
    ENFJ: "부드럽게 환경에 맞추는 에너지와 사람에게 영감을 주고 변화를 만들고 싶은 욕구가 결합하면, 가르치거나 이끄는 역할에서 자연스럽게 존경받는 사람이 돼요. 강요하지 않아도 사람들이 따르게 되는 분위기를 만드는 능력이 있고, 공동체 내에서 신뢰와 방향을 동시에 제공하는 역할을 맡게 돼요. 타인의 성장에 지나치게 몰두하다가 자신의 성장을 미루는 경우가 있으니, 내 발전에도 같은 에너지를 쏟는 밸런스를 잡으세요.",
  },
  경: {
    INTJ: "날카롭게 쳐내고 정확하게 방향을 결정하는 에너지와 장기 전략을 치밀하게 설계하는 능력이 결합하면, 아무도 따라올 수 없는 냉철한 전략가가 돼요. 감정보다 논리를 앞세우고, 불필요한 것을 잘라내는 데 주저함이 없어서 조직이나 프로젝트를 빠르게 효율화해요. 자신의 방향이 확실한 만큼 타인의 다른 방식을 인정하기 어려울 수 있는데, '다른 경로도 정답일 수 있다'는 여유를 조금 만들어두면 협력자가 늘어나요.",
    ENTJ: "결단력 있게 밀어붙이는 에너지와 사람과 자원을 조직해서 결과를 만드는 능력이 결합하면, 경쟁이 치열한 분야에서도 압도적인 성과를 내는 유형이에요. 숫자와 구조를 빠르게 파악하고, 약한 고리를 찾아내서 먼저 강화하는 전략적 감각이 뛰어나요. 너무 빠르게 결단을 내리는 것이 때로 충분히 검토하지 않은 실수로 이어질 수 있으니, 중요한 결정 전에 반드시 한 단계 멈추는 습관을 들이세요.",
    ISTP: "정확하게 필요한 것만 남기는 에너지와 손으로 직접 문제를 해결하는 기술적 감각이 만나면, 전문 영역에서 장인의 경지에 이르는 사람이 돼요. 실용적이고 군더더기 없이 핵심만 남기는 스타일이며, 외과 수술처럼 정밀도가 요구되는 환경에서 특히 강해요. 감정 표현이 거의 없어서 주변에서 차갑게 느낄 수 있는데, 관계가 중요한 상황에서는 의식적으로 따뜻함을 드러내는 신호를 보내주세요.",
    ESTJ: "원칙을 지키고 불필요한 것을 쳐내는 에너지와 체계적으로 조직을 운영하는 관리력이 결합하면, 규칙과 성과를 동시에 강조하는 관리자 유형이에요. '왜?'보다 '어떻게?'로 빠르게 넘어가는 실용적인 결정 방식이 조직에서 신뢰를 얻고, 명확한 기준 덕분에 부하직원들도 무엇을 해야 할지 헷갈리지 않아요. 융통성이 없다는 말을 들을 수 있으니, 예외적인 상황에서 유연하게 판단하는 경험을 쌓아두면 리더십이 더 완성돼요.",
    ESTP: "빠르고 과감하게 움직이는 에너지와 경쟁에서 이기고 싶은 본능적인 승부사 기질이 결합하면, 비즈니스·협상·투자처럼 순간 판단이 돈이 되는 환경에서 연전연승해요. 위험을 두려워하지 않고 오히려 리스크가 있는 상황에서 더 선명하게 판단이 서는 유형이에요. 빠른 판단이 장점인 동시에 실수의 원인이 되기도 하니, 손실이 컸을 때 반드시 복기하는 습관을 들이면 더 무서운 플레이어가 돼요.",
    INTP: "날카롭게 핵심을 자르는 에너지와 체계를 분석하고 논리로 해체하는 능력이 만나면, 복잡한 시스템을 가장 효율적인 구조로 재설계하는 사람이 돼요. 엔지니어링·금융 분석·법률처럼 정밀하고 체계적인 사고가 요구되는 분야에서 강하고, 감정보다 논리로 판단하기 때문에 편향이 적어요. 결론을 내리기 전에 너무 많은 가능성을 검토하다가 결정이 늦어지는 경향이 있으니, 분석의 마감을 스스로 정해두는 것이 중요해요.",
    ISTJ: "원칙을 고수하는 에너지와 정확하게 절차를 따르는 성실함이 결합하면, 공직·감사·법무처럼 규정 준수가 중요한 환경에서 타의 추종을 불허하는 전문가가 돼요. 한번 정해진 방향에서는 흔들리지 않고, 주변의 압력에도 원칙을 지키는 뚝심이 신뢰의 핵심이에요. 새로운 환경이나 방식에 적응하는 데 에너지가 많이 들기 때문에, 변화가 왔을 때 미리 충분한 준비 시간을 확보해두면 부담이 줄어요.",
  },
  신: {
    INTP: "보석처럼 불순물을 제거하고 핵심만 남기는 에너지와 정밀하게 분석하고 논리로 재구성하는 능력이 만나면, 아이디어를 다듬고 정제해서 가장 예리한 형태로 완성하는 사람이 돼요. 언어학·수학·철학처럼 정확함이 핵심인 분야에서 독자적인 발견을 하는 경우가 많아요. 분석이 지나치게 세밀해져서 전체 그림을 놓치는 경우가 있으니, 주기적으로 한 발 물러서서 큰 맥락을 점검하는 루틴을 만들어두세요.",
    INTJ: "완벽하게 완성하려는 에너지와 치밀한 전략으로 장기 목표를 실행하는 능력이 결합하면, 결과물의 완성도에서 타협하지 않는 사람이 돼요. 겉으로는 조용하게 일하는 것 같지만 내부 기준이 매우 높아서, 퀄리티로 결국 인정받는 유형이에요. 완벽하지 않으면 내놓지 않으려는 경향 때문에 결과물이 늦게 나오는 경우가 많으니, '완벽'이 아닌 '완성'을 목표로 삼는 전환이 필요해요.",
    ISFP: "정밀한 심미안과 손에 잡히는 감각으로 아름다움을 만드는 기질이 결합하면, 주얼리·패션·공예·사진처럼 정교한 감각이 요구되는 분야에서 압도적인 완성도를 발휘해요. 화려하게 어필하지 않아도 작품 자체가 조용히 말을 걸어오는 유형이고, 한 분야에서 자기만의 미적 세계를 완성하면 강한 팬층이 생겨요. 스스로를 드러내는 것을 꺼리기 때문에 기회를 놓치는 경우가 있으니, 작품을 먼저 내놓고 평가는 그다음에 받겠다는 태도가 필요해요.",
    INFJ: "직관적으로 아름다움과 진실을 감지하는 에너지와 사람의 내면을 깊이 읽는 통찰이 만나면, 심리·상담·글쓰기에서 사람의 본질을 꿰뚫어 보는 드문 능력을 가진 유형이에요. 겉으로 조용해 보여도 관찰하는 것을 멈추지 않고, 상대가 말하지 않은 것까지 읽어내는 감각이 있어요. 너무 많은 것을 감지하고 혼자 처리하다 보면 에너지가 고갈되기 쉬우니, 정기적으로 혼자만의 시간을 통해 충전하는 리듬을 유지하세요.",
    ISTP: "불필요한 것을 제거하고 핵심만 남기는 에너지와 실용적으로 문제를 해결하는 기술적 감각이 결합하면, 정밀한 전문직에서 장인의 경지에 이르는 사람이 돼요. 과정의 미적 완성도와 실용적 기능을 동시에 추구하는 드문 조합이고, 자기 기준에서 타협하지 않으면서도 실제로 작동하는 것을 만드는 능력이 있어요. 완벽을 추구하다 마감을 놓치는 경우가 있으니, 80%에서 내놓고 나머지를 개선하는 실용적 마인드셋도 필요해요.",
    ENFP: "세밀하게 다듬고 완성하는 에너지와 가능성을 향해 열정적으로 뛰어드는 기질이 만나면, 아이디어는 무궁무진하면서도 그것을 섬세하게 실현하는 사람이 돼요. 기획·콘텐츠·브랜딩처럼 감각과 표현이 중요한 분야에서 특히 강하고, 완성도 있는 결과물로 주변을 놀라게 하는 경우가 많아요. 너무 많은 방향으로 에너지가 분산되면 어느 것도 자신이 원하는 완성도에 이르지 못하는 아쉬움이 남으니, 하나에 집중하는 기간을 의도적으로 만드세요.",
    INFP: "정밀하게 내면을 들여다보는 에너지와 자기만의 이상적인 세계를 창조하고 싶은 감수성이 만나면, 섬세하고 완성도 높은 내면 세계를 예술로 표현하는 창작가 유형이에요. 빠르게 많이 만드는 것보다 하나를 오래 다듬어서 완성하는 방식을 선호하고, 그 신중함이 깊이 있는 작품으로 이어져요. 너무 완벽하게 다듬으려다 시작조차 못하는 경우가 있으니, 처음 버전을 일단 완성하는 것을 가장 중요한 목표로 삼으세요.",
  },
  임: {
    ENTP: "바다처럼 넓고 깊게 흐르는 에너지와 기존의 논리를 뒤집고 새로운 구도를 제시하는 기질이 만나면, 무한한 아이디어를 현실 가능한 형태로 만들어내는 혁신가가 돼요. 어떤 분야에서든 판을 새로 짜는 발상을 하고, 그 아이디어에 설득력까지 갖추고 있어서 사람들을 실제로 움직이게 만들어요. 아이디어가 너무 많아서 실행으로 이어지지 않는 것이 가장 큰 약점이니, 하나를 끝내기 전까지 다음 아이디어는 메모만 해두는 규칙을 만들어보세요.",
    INTP: "깊이 있게 흐르는 지혜의 에너지와 모든 것을 논리적으로 해체하고 원리를 찾아내는 능력이 결합하면, 학문·연구에서 아무도 가지 않은 길을 개척하는 유형이에요. 인과관계를 추적하는 집중력이 뛰어나고, 복잡한 시스템 안에서 남들이 보지 못하는 패턴을 발견해요. 발견한 것을 혼자 간직하고 외부에 꺼내는 것을 꺼리는 경향이 있는데, 공유할수록 더 깊어지는 아이디어의 속성을 믿고 내놓는 연습을 해보세요.",
    INFJ: "깊고 조용하게 흐르는 에너지와 사람의 내면과 미래를 꿰뚫어 보는 직관이 결합하면, 상담·심리·영성처럼 보이지 않는 것을 다루는 분야에서 심오한 통찰을 발휘해요. 한 사람의 인생 흐름을 읽는 능력이 뛰어나고, 말하지 않아도 상대의 상태를 감지하는 감각이 있어요. 스스로의 감정과 피로는 잘 인식하지 못하는 경우가 많으니, 정기적으로 자기 자신의 내면을 들여다보는 시간을 의도적으로 가지세요.",
    ENTJ: "전략적으로 흐르는 에너지와 결과를 향해 사람과 자원을 조직하는 능력이 결합하면, 비즈니스·투자·정책처럼 큰 흐름을 설계하는 분야에서 두드러진 성과를 내요. 숲을 먼저 보고 나무를 배치하는 방식으로 일하고, 복잡한 환경에서도 핵심을 빠르게 파악해서 의사결정 속도가 빠른 편이에요. 사람을 수단으로 보는 인상을 줄 수 있으니, 관계에서 진심을 표현하는 순간을 의식적으로 만들어두면 신뢰가 더 두터워져요.",
    ENFP: "자유롭게 흐르는 에너지와 가능성을 향해 열정적으로 경계를 넘어가는 기질이 만나면, 국내와 해외, 온라인과 오프라인, 장르와 장르 사이의 경계를 자유롭게 오가는 크리에이터 유형이에요. 다양한 영역을 연결하는 감각이 탁월하고, 예상치 못한 조합에서 새로운 가치를 만들어내는 것을 즐겨요. 시작은 많은데 완성이 적은 패턴이 반복되지 않도록, 하나의 프로젝트를 끝내는 것을 최우선 목표로 삼는 주기를 갖는 게 중요해요.",
    INFP: "조용하고 깊게 흐르는 에너지와 내면에 가득한 이상을 창조하고픈 욕구가 만나면, 표면적으로는 잔잔해 보여도 안에서는 끊임없이 무언가를 만들어가는 사람이에요. 소설·시·음악처럼 오랜 시간을 들여야 완성되는 창작에서 진가가 드러나고, 서두르지 않을수록 더 깊어지는 작품을 만들어요. 외부 기준에 맞추려다 자기 목소리를 잃는 경우가 있으니, '내가 만들고 싶은 것'이 판단의 첫 번째 기준이 되어야 해요.",
    INTJ: "깊고 전략적으로 흐르는 에너지와 치밀하게 장기 계획을 실행하는 능력이 결합하면, 움직임이 크지 않은 것 같아도 결국 가장 중요한 자리에 있게 되는 사람이에요. 판을 읽는 능력이 탁월해서 기회가 언제 오는지 알고 있고, 때가 되면 정확하게 움직여요. 외부에 자신을 거의 드러내지 않기 때문에 과소평가를 받는 경우가 있는데, 이 점을 역으로 이용해 상대의 방심을 활용하는 것도 전략이 될 수 있어요.",
  },
  계: {
    INFP: "이슬처럼 섬세하고 조용하게 스며드는 에너지와 자기만의 이상적인 세계를 품고 표현하고 싶어하는 감수성이 만나면, 말 없이도 마음을 건드리는 작품을 만드는 사람이 돼요. 겉으로는 조용하지만 안에는 무한한 감성의 샘이 있어서, 제대로 표현의 통로를 찾으면 폭발적인 창의력이 쏟아져요. 좋은 아이디어가 머릿속에만 머물고 실제로 내놓지 못하는 패턴이 반복된다면, 작은 것이라도 일단 완성하고 꺼내는 습관부터 만들어보세요.",
    INFJ: "은은하게 깊이 스며드는 에너지와 사람의 본질과 미래를 꿰뚫어 보는 직관이 결합하면, 영적 탐구·심리·글쓰기처럼 보이지 않는 것을 다루는 분야에서 독보적인 통찰을 발휘해요. 조용히 있어도 곁에 있는 것만으로 사람의 마음이 안정되는 분위기를 만들고, 깊은 이야기를 편안하게 꺼내게 하는 능력이 있어요. 너무 많은 것을 감지하고 혼자 처리하다 고갈되는 사이클이 반복되니, 감당하는 관계의 수를 의식적으로 조절하세요.",
    ISFP: "감각적으로 아름다움을 포착하는 에너지와 몸으로 세상을 경험하고 표현하는 예술 기질이 결합하면, 눈에 보이지 않는 감정의 결을 섬세하게 작품으로 옮기는 사람이 돼요. 음악·사진·수채화처럼 섬세한 감각이 요구되는 표현 방식에서 독자적인 스타일을 완성해요. 자신의 작품이 충분히 완성되지 않았다는 느낌 때문에 좀처럼 내놓지 않는 경향이 있는데, 불완전한 것을 내놓는 것이 성장의 시작이라는 걸 기억하세요.",
    INTP: "성찰하며 깊이 들여다보는 에너지와 모든 전제를 의심하고 논리적으로 해체하는 능력이 결합하면, 철학·수학·언어학처럼 깊은 원리를 추적하는 분야에서 남들이 생각지 못한 곳에서 발견을 해요. 자신만의 사고 체계를 천천히 구축해가는 스타일이고, 서두르지 않을수록 더 단단한 결론에 이르는 유형이에요. 혼자 오래 생각하다가 외부와 단절되는 경향이 있으니, 주기적으로 생각을 글로 정리하거나 신뢰하는 사람과 나누는 루틴을 만들어두세요.",
    ISFJ: "깊은 공감과 내면의 온기로 조용히 상대를 이해하는 에너지와 헌신적으로 돌보는 기질이 결합하면, 치유·복지·교육처럼 사람의 결핍을 채우는 분야에서 고요하지만 강한 힘을 발휘해요. 겉으로는 잔잔해 보여도 한번 관계가 맺어지면 오래도록 이어지는 깊은 유대를 만들어내는 유형이에요. 타인의 감정에 지나치게 동화되어 자신의 감정과 필요를 잃는 경우가 있으니, 자신이 느끼는 것을 주기적으로 확인하고 표현하는 연습을 하세요.",
    INTJ: "깊고 조용하게 흐르는 에너지와 치밀하게 계획을 세우고 실행하는 능력이 만나면, 겉으로는 아무것도 안 하는 것 같지만 속에서는 항상 장기 전략을 운영하고 있는 사람이에요. 자신을 잘 드러내지 않기 때문에 만만해 보일 수 있지만, 결정적인 순간에 움직이면 주변이 놀라는 유형이에요. 너무 오래 혼자 담아두면 계획이 실행되지 않고 머릿속에서만 완성되는 경우가 있으니, 중간 체크포인트를 정해두고 외부에 공유하는 방식을 활용하세요.",
    ENFP: "감성적으로 스며드는 에너지와 새로운 가능성을 향해 열정적으로 뛰어드는 기질이 만나면, 처음에는 조용해 보여도 친해지면 예상 밖의 에너지와 아이디어를 쏟아내는 사람이에요. 감성과 창의력의 결합이 강점이고, 예술·상담·교육·마케팅처럼 감각과 열정이 모두 필요한 분야에서 빛나요. 시작한 것들을 끝맺지 못하고 새로운 것으로 계속 옮겨가는 패턴이 있다면, 현재 진행 중인 것을 완성하는 것을 가장 우선순위에 두는 연습이 필요해요.",
    ENTP: "조용하게 스며들지만 한번 흐르기 시작하면 막기 어려운 에너지와 기존 논리를 뒤집는 아이디어를 즐기는 기질이 만나면, 예상치 못한 방향에서 날카로운 한 방을 날리는 사람이에요. 겉으로 잔잔한 이미지 덕분에 상대가 방심하고, 그 순간 논리적으로 압도하는 방식을 자연스럽게 구사해요. 논쟁이 길어지면 자신의 감정이 상하거나 상대와의 관계가 어색해지는 경우가 있으니, 이기는 것보다 이해시키는 것을 목표로 삼는 연습이 필요해요.",
  },
};

// 오행 × MBTI 궁합
const ELEMENT_MBTI_COMPAT: Record<Element, { best: MBTI[]; good: MBTI[]; caution: MBTI[] }> = {
  목: { best:["ENFP","INFP","ENFJ","ENTJ"], good:["INFJ","ENTP","INTJ","ISFP"], caution:["ESTJ","ISTJ","ESTP","ISTP"] },
  화: { best:["ENFJ","ENTJ","ESTP","ENFP"], good:["ESFP","ENTP","ESTJ","ESFJ"], caution:["INTP","INFP","INTJ","ISFP"] },
  토: { best:["ISTJ","ESFJ","ESTJ","ISFJ"], good:["ISTP","ISFP","ENTJ","ESFP"], caution:["INTP","INFP","ENTP","INFJ"] },
  금: { best:["INTJ","ENTJ","ISTJ","ISTP"], good:["ESTJ","INTP","ESTP","ENTP"], caution:["INFP","ENFP","ISFP","ESFP"] },
  수: { best:["INTP","INTJ","INFJ","INFP"], good:["ENTP","ENFJ","ISFJ","ISFP"], caution:["ESTJ","ESFJ","ESTP","ESFP"] },
};

const ELEMENT_COLOR: Record<Element, string> = {
  목:"#4ade80", 화:"#f87171", 토:"#fbbf24", 금:"#a5b4fc", 수:"#60a5fa",
};

const MBTI_CAREER: Record<MBTI, string[]> = {
  INTJ:["전략 컨설턴트","시스템 아키텍트","과학자","투자 분석가"],
  INTP:["연구원","수학자","철학자","소프트웨어 개발자"],
  INFJ:["상담사","작가","심리치료사","사회적 기업가"],
  INFP:["작가·시인","예술가","교육자","NGO 활동가"],
  ISTJ:["공무원","회계사","관리자","의사"],
  ISTP:["엔지니어","외과의","파일럿","스포츠 선수"],
  ISFJ:["간호사","교사","사회복지사","영양사"],
  ISFP:["디자이너","사진작가","셰프","음악가"],
  ENTJ:["CEO·경영자","변호사","정치인","사업가"],
  ENTP:["스타트업 창업자","발명가","토론가","마케터"],
  ENFJ:["강사·코치","NGO 리더","배우·앵커","HR 전문가"],
  ENFP:["크리에이터","홍보 전문가","광고인","심리상담사"],
  ESTJ:["군·경찰 간부","판사","프로젝트 매니저","은행원"],
  ESTP:["영업 전문가","기업가","응급의학과 의사","운동선수"],
  ESFJ:["이벤트 플래너","교사","의료 코디네이터","영업직"],
  ESFP:["연예인·가수","이벤트 사회자","관광 가이드","뷰티 전문가"],
};


// ── 사주 기반 5가지 성향 축 (MBTI 스타일 차트) ──────────────────────────────────
const YANG_GAN = new Set(["갑", "병", "무", "경", "임"]);
type SajuAxis = { key: string; left: string; right: string; score: number; color: string; desc: string };

function calcSajuMbtiAxes(result: SajuResult): SajuAxis[] {
  const ilgan = result.pillarsDetail.day.cg;
  const isYang = YANG_GAN.has(ilgan);
  const total = Object.values(result.scores).reduce((a, b) => a + b, 0) || 1;
  const pct = (el: "목" | "화" | "토" | "금" | "수") => (result.scores[el] / total) * 100;
  const clamp = (n: number) => Math.max(6, Math.min(94, Math.round(n)));

  // 십성 그룹 카운트 (연·월·일·시 천간/지지, 일간 자신 제외)
  const pillars = [result.pillarsDetail.year, result.pillarsDetail.month, result.pillarsDetail.day, result.pillarsDetail.hour].filter(Boolean) as { sipseongCg: string; sipseongJj: string }[];
  const sipCounts: Record<string, number> = {};
  pillars.forEach((p, i) => {
    if (!(i === 2)) sipCounts[p.sipseongCg] = (sipCounts[p.sipseongCg] || 0) + 1; // 일간 천간(자기 자신) 제외
    sipCounts[p.sipseongJj] = (sipCounts[p.sipseongJj] || 0) + 1;
  });
  const cnt = (...names: string[]) => names.reduce((a, n) => a + (sipCounts[n] || 0), 0);

  // ① 외향성 ↔ 내향성 (일간 음양 + 화/수/금 기운)
  const eiScore = clamp(50 + (isYang ? 12 : -12) + (pct("화") - 20) * 0.7 - (pct("수") - 20) * 0.6 - (pct("금") - 20) * 0.4);

  // ② 추상적 사고 ↔ 현실적 사고 (수·목=직관/사색, 토·금=감각/현실)
  const abstractRealScore = clamp(50 - (pct("수") + pct("목") - 40) * 0.6 + (pct("토") + pct("금") - 40) * 0.6);

  // ③ 결과지향 ↔ 과정지향 (금·화=속도와 완성, 목·수=흐름과 성장)
  const resultProcessScore = clamp(50 - (pct("금") + pct("화") - 40) * 0.55 + (pct("목") + pct("수") - 40) * 0.55);

  // ④ 통제형(계획·관리) ↔ 자유형(판단에 얽매이지 않음) — 관성 vs 식상
  const gwanCnt = cnt("정관", "편관"), siksangCnt = cnt("식신", "상관");
  const controlFreeScore = clamp(50 + (gwanCnt - siksangCnt) * 11);

  // ⑤ 자기주도형 ↔ 신중형 — 비겁 vs 인성
  const bigyeopCnt = cnt("비견", "겁재"), inseongCnt = cnt("편인", "정인");
  const leadCarefulScore = clamp(50 + (bigyeopCnt - inseongCnt) * 11);

  return [
    {
      key: "ei", left: "내향(I)", right: "외향(E)", score: eiScore, color: "#f472b6",
      desc: eiScore >= 50
        ? `일간이 ${isYang ? "양간(陽干)이라 에너지가 밖으로 발산" : "음간(陰干)이지만 화(火) 기운이 강해 표현 욕구가 살아있"}는 구조예요. 사람들과 부대끼며 에너지를 얻고, 생각을 입 밖으로 꺼내며 정리하는 타입이에요.`
        : `일간이 ${!isYang ? "음간(陰干)이라 에너지를 안으로 갈무리" : "양간이지만 수(水)·금(金) 기운이 안정적으로 받쳐주어 차분하게 가라앉히"}는 구조예요. 혼자만의 시간 속에서 에너지를 충전하고, 생각을 충분히 정리한 뒤에 표현하는 타입이에요.`
    },
    {
      key: "ns", left: "현실 감각(S)", right: "추상·직관(N)", score: abstractRealScore, color: "#60a5fa",
      desc: abstractRealScore >= 50
        ? `사주에 수(水)·목(木)의 기운이 두드러져, 눈에 보이지 않는 가능성과 의미를 먼저 떠올리는 사고방식이에요. 아이디어와 큰 그림을 그리는 데 강하고, 추상적인 개념을 다루는 일에서 빛이 나요.`
        : `사주에 토(土)·금(金)의 기운이 두드러져, 눈에 보이고 손에 잡히는 사실과 데이터를 먼저 신뢰하는 사고방식이에요. 현실적인 절차와 검증을 중시하고, 구체적인 결과물을 만드는 일에서 강점을 보여요.`
    },
    {
      key: "tf_like", left: "과정지향", right: "결과지향", score: resultProcessScore, color: "#fbbf24",
      desc: resultProcessScore >= 50
        ? `금(金)·화(火)의 추진력이 강해, 목표를 정하면 가장 빠르고 확실한 길로 밀어붙여 결과부터 만들어내는 스타일이에요. 완성된 성과로 스스로를 증명하고 싶어 해요.`
        : `목(木)·수(水)의 흐름이 강해, 결과보다 그 과정에서 무엇을 배우고 어떻게 성장했는지를 더 중요하게 여기는 스타일이에요. 차근차근 쌓아가는 여정 자체에서 의미를 찾아요.`
    },
    {
      key: "jp_like", left: "자유형(판단에 얽매이지 않음)", right: "통제형(계획·관리)", score: controlFreeScore, color: "#a78bfa",
      desc: controlFreeScore >= 50
        ? `사주에 규칙과 책임을 따르는 기운이 표현하고 발산하는 기운보다 강해, 규칙과 체계 안에서 안정감을 느끼고 계획한 대로 차근차근 관리해 나가는 통제형이에요. 정해진 틀이 있을 때 오히려 능률이 올라가요.`
        : `사주에 표현하고 발산하는 기운이 규칙과 책임을 따르는 기운보다 강해, 정해진 틀보다 그때그때의 흐름과 영감을 따라 움직이는 자유형이에요. 계획에 얽매이기보다 상황에 맞춰 유연하게 대응할 때 빛을 발해요.`
    },
    {
      key: "lead_careful", left: "신중형", right: "자기주도형", score: leadCarefulScore, color: "#4ade80",
      desc: leadCarefulScore >= 50
        ? `사주에 스스로 밀고 나가는 기운이 배우고 의지하는 기운보다 강해, 남의 의견에 기대기보다 스스로 판단하고 밀고 나가는 자기주도형이에요. 직접 부딪히며 배우는 것을 선호하고 주체성이 강해요.`
        : `사주에 배우고 의지하는 기운이 스스로 밀고 나가는 기운보다 강해, 충분히 따져보고 주변의 조언을 들은 뒤에 움직이는 신중형이에요. 성급한 결정보다 숙고를 거친 선택이 후회를 줄여줘요.`
    },
  ];
}

function SajuAxisChart({ axes }: { axes: SajuAxis[] }) {
  return (
    <div className="space-y-4">
      {axes.map(a => (
        <div key={a.key}>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className={a.score < 50 ? "font-black" : ""} style={{ color: a.score < 50 ? a.color : "rgba(255,255,255,0.35)" }}>{a.left}</span>
            <span className={a.score >= 50 ? "font-black" : ""} style={{ color: a.score >= 50 ? a.color : "rgba(255,255,255,0.35)" }}>{a.right}</span>
          </div>
          <div className="h-2 rounded-full relative overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="absolute left-1/2 top-0 bottom-0 w-px z-10" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="absolute top-0 bottom-0 rounded-full" style={{
              left: a.score < 50 ? `${a.score}%` : "50%",
              right: a.score < 50 ? "50%" : `${100 - a.score}%`,
              background: a.color,
            }} />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mt-2">{a.desc}</p>
        </div>
      ))}
      <p className="text-[9px] text-right" style={{ color: "rgba(255,255,255,0.25)" }}>※ 50을 기준으로 어느 쪽 기운이 더 강한지 보여주는 상대 지수예요</p>
    </div>
  );
}

// ── 나와 잘 맞는 사주 (상생 관계 기준) ───────────────────────────────────────────
const EL_GENERATES: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const EL_GENERATED_BY: Record<Element, Element> = { 화: "목", 토: "화", 금: "토", 수: "금", 목: "수" };
const ELEMENT_HANJA: Record<Element, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

function getCompatibleSaju(ilganEl: Element, gender: "male" | "female") {
  // 여자: 나를 생(生)하는 남자의 오행 / 남자: 내가 생(生)하는 여자의 오행
  const targetEl = gender === "female" ? EL_GENERATED_BY[ilganEl] : EL_GENERATES[ilganEl];
  const ganList = Object.entries(CHEONGAN_ELEMENT).filter(([, el]) => el === targetEl).map(([gan]) => gan);
  const reason = gender === "female"
    ? `여성의 사주에서는 나를 채워주고 길러주는 기운에 해당하는 오행을 가진 남성과 만났을 때 보살핌과 지지를 받는 흐름이 형성돼요. 내 오행 ${ilganEl}(${ELEMENT_HANJA[ilganEl]})을 채워주는 ${targetEl}(${ELEMENT_HANJA[targetEl]}) 기운의 일간을 가진 남성이라면, 나를 키워주고 받쳐주는 인연이 되기 쉬워요.`
    : `남성의 사주에서는 내가 베풀어주는 기운에 해당하는 오행을 가진 여성과 만났을 때 자연스럽게 챙겨주고 베푸는 관계가 형성돼요. 내 오행 ${ilganEl}(${ELEMENT_HANJA[ilganEl]})이 채워주는 ${targetEl}(${ELEMENT_HANJA[targetEl]}) 기운의 일간을 가진 여성이라면, 내가 자연스럽게 베풀어주는 좋은 흐름이 만들어져요.`;
  return { targetEl, ganList, reason };
}

export default function MbtiPage() {
  const [counter] = useState(() => Math.floor(Math.random() * 400) + 1600);
  const [mbti, setMbti] = useState<MBTI | "">("");
  const [sajuResult, setSajuResult] = useState<SajuResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pendingResultRef = useRef<null | {
    ilgan: string; dominant: Element;
    mbtiEl: { primary: Element; secondary: Element; desc: string };
    synergy: string; careers: string[];
    compat: { best: MBTI[]; good: MBTI[]; caution: MBTI[] };
    elMatch: "완벽" | "좋음" | "보통" | "주의";
    elMatchColor: string; elMatchDesc: string;
  }>(null);
  const [result, setResult] = useState<null | {
    ilgan: string;
    dominant: Element;
    mbtiEl: { primary: Element; secondary: Element; desc: string };
    synergy: string;
    careers: string[];
    compat: { best: MBTI[]; good: MBTI[]; caution: MBTI[] };
    elMatch: "완벽" | "좋음" | "보통" | "주의";
    elMatchColor: string;
    elMatchDesc: string;
  }>(null);

  // 생년월일 입력 폼 상태
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [birthYear, setBirthYear] = useState("1995");
  const [birthMonth, setBirthMonth] = useState("6");
  const [birthDay, setBirthDay] = useState("2");
  const [birthTime, setBirthTime] = useState<BirthTimeValue>({ hour: null, minute: null, unknown: true, useJajasi: false });
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  useEffect(() => {
    // pre-fill form from localStorage (don't auto-analyze)
    try {
      const saved = loadSajuData();
      if (!saved) return;
      // 이름은 placeholder로 표시 — 직접 입력하게
      if (saved.gender) setGender(saved.gender as "female" | "male");
      if (saved.birthYear) setBirthYear(String(saved.birthYear));
      if (saved.birthMonth) setBirthMonth(String(saved.birthMonth));
      if (saved.birthDay) setBirthDay(String(saved.birthDay));
      if (saved.birthHour != null && !saved.birthHourUnknown) {
        setBirthTime({ hour: saved.birthHour, minute: (saved as any).birthMinute ?? 30, unknown: false, useJajasi: (saved as any).useJajasi || false });
      }
    } catch {}
  }, []);

  async function handleConfirmSaju() {
    const y = parseInt(birthYear), mo = parseInt(birthMonth), d = parseInt(birthDay);
    if (!name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (isNaN(y) || isNaN(mo) || isNaN(d)) {
      alert("생년월일을 모두 선택해주세요.");
      return;
    }
    let sy = y, smo = mo, sd = d;
    if (calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(y, mo, d, isLeapMonth);
        const s = cal.getSolarCalendar();
        if (!s?.year) throw new Error();
        sy = s.year; smo = s.month; sd = s.day;
      } catch {
        alert("음력 날짜를 양력으로 변환할 수 없습니다. 날짜를 다시 확인해주세요.");
        return;
      }
    }
    const h = birthTime.unknown ? null : birthTime.hour;
    const min = birthTime.unknown ? null : birthTime.minute;
    saveSajuData({ name, gender, birthYear: sy, birthMonth: smo, birthDay: sd, birthHour: h, birthMinute: min, birthHourUnknown: h == null, birthPlace: "서울", style: "auto", useJajasi: birthTime.useJajasi });
    try {
      const r = analyzeSaju({
        birthYear: sy, birthMonth: smo, birthDay: sd, birthHour: h,
        birthMinute: min, name: name || "분석", gender, birthPlace: "서울",
        style: "auto", productType: "mobile", useJajasi: birthTime.useJajasi,
      });
      setSajuResult(r);
    } catch {
      alert("사주 정보를 다시 확인해주세요.");
    }
  }

  function analyze() {
    if (!mbti || !sajuResult) return;
    const ilgan = sajuResult.pillarsDetail.day.cg;
    const dominant = (sajuResult.dominant[0] || "토") as Element;
    const mbtiEl = MBTI_ELEMENT[mbti];
    const synergies = ILGAN_MBTI_SYNERGY[ilgan];
    const synergy = synergies?.[mbti] || `${ilgan}일간 + ${mbti}의 조합은 독창적인 에너지를 만듭니다. 사주의 ${dominant} 기운이 ${mbti}의 특성을 뒷받침하며 독자적인 길을 개척합니다.`;
    const careers = MBTI_CAREER[mbti] || [];
    const compat = ELEMENT_MBTI_COMPAT[dominant];

    let elMatch: "완벽" | "좋음" | "보통" | "주의";
    let elMatchColor: string;
    let elMatchDesc: string;

    if (compat.best.includes(mbti)) {
      elMatch = "완벽"; elMatchColor = "#4ade80";
      elMatchDesc = `${dominant} 오행과 ${mbti}는 최고의 조합입니다. 사주 에너지와 성격 유형이 완벽히 시너지를 이루어 타고난 잠재력을 100% 발휘할 수 있습니다.`;
    } else if (compat.good.includes(mbti)) {
      elMatch = "좋음"; elMatchColor = "#fbbf24";
      elMatchDesc = `${dominant} 오행과 ${mbti}는 잘 맞습니다. 약간의 노력으로 에너지를 극대화할 수 있으며, 서로의 강점이 보완됩니다.`;
    } else if (compat.caution.includes(mbti)) {
      elMatch = "주의"; elMatchColor = "#f87171";
      elMatchDesc = `${dominant} 오행과 ${mbti}는 에너지 방향이 다소 엇갈립니다. 단점을 의식적으로 보완하면 오히려 강점이 될 수 있습니다.`;
    } else {
      elMatch = "보통"; elMatchColor = "#94a3b8";
      elMatchDesc = `${dominant} 오행과 ${mbti}는 균형 잡힌 조합입니다. 특별한 시너지보다 안정적인 에너지 흐름이 특징입니다.`;
    }

    pendingResultRef.current = { ilgan, dominant, mbtiEl, synergy, careers, compat, elMatch, elMatchColor, elMatchDesc };
    setIsAnalyzing(true);
  }

  if (isAnalyzing) return (
    <>
      <BackButton />
      <AnalysisLoading
        subject={`${name || ""}님의 사주 MBTI`}
        onDone={() => { setResult(pendingResultRef.current); setIsAnalyzing(false); }}
      />
    </>
  );

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-950/40 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-950/40 blur-[140px]" />
      </div>

      <BackButton />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24" id="mbti-result">
        <FadeIn delay={0}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🧬</div>
            <h1 className="text-2xl font-black mb-2">사주 × MBTI 조합 분석</h1>
            <p className="text-sm text-gray-400">타고난 사주 에너지와 MBTI 성격 유형의<br />시너지를 분석합니다</p>
          </div>
        </FadeIn>

        {!sajuResult ? (
          <>
          <ProfilePicker onSelect={p => {
            setName(p.name);
            setGender(p.gender);
            setBirthYear(String(p.birthYear));
            setBirthMonth(String(p.birthMonth));
            setBirthDay(String(p.birthDay));
            if (!p.birthHourUnknown && p.birthHour >= 0) {
              setBirthTime({ hour: p.birthHour, minute: (p as any).birthMinute ?? 30, unknown: false, useJajasi: false });
            } else {
              setBirthTime({ hour: null, minute: null, unknown: true, useJajasi: false });
            }
          }} />
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
            <p className="text-sm font-bold text-gray-300">생년월일 입력</p>

            <div>
              <label className="text-xs text-gray-500 block mb-1">이름 <span className="text-red-400">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동 (필수)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition" />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">성별</label>
              <div className="flex gap-2">
                {(["female","male"] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${gender === g ? "bg-violet-600 text-white" : "bg-white/5 text-gray-400 border border-white/10"}`}>
                    {g === "female" ? "여성" : "남성"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">생년월일</label>
                <div className="flex overflow-hidden rounded-lg border border-white/10">
                  {(["solar","lunar"] as const).map(t => (
                    <button key={t} type="button" onClick={() => { setCalendarType(t); setIsLeapMonth(false); setBirthMonth(""); setBirthDay(""); }}
                      className={`px-3 py-1 text-xs font-medium transition ${calendarType === t ? "bg-violet-600 text-white" : "text-gray-400 hover:bg-white/5"}`}>
                      {t === "solar" ? "양력" : "음력"}
                    </button>
                  ))}
                </div>
              </div>
              {calendarType === "lunar" && (
                <label className="flex items-center gap-2 text-xs text-gray-400 mb-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isLeapMonth} onChange={e => setIsLeapMonth(e.target.checked)} className="accent-violet-500" />
                  윤달
                </label>
              )}
              <div className="grid grid-cols-3 gap-2">
                <MbPicker value={birthYear} options={YEARS_MB.map(y => ({ v: String(y), label: String(y) }))}
                  onChange={setBirthYear} placeholder="연도" suffix="년" />
                <MbPicker value={birthMonth} options={MONTHS_MB.map(m => ({ v: String(m), label: String(m) }))}
                  onChange={setBirthMonth} placeholder="월" suffix="월" />
                <MbPicker value={birthDay} options={DAYS_MB.map(d => ({ v: String(d), label: String(d) }))}
                  onChange={setBirthDay} placeholder="일" suffix="일" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-2">태어난 시간 <span className="text-gray-700 font-normal">(선택사항)</span></label>
              <BirthTimePicker value={birthTime} onChange={setBirthTime} accent="violet" />
            </div>

            <button onClick={handleConfirmSaju}
              className="w-full py-3 rounded-xl font-black text-sm text-white transition"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              사주 분석 시작 →
            </button>
          </div>
          </>
        ) : (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">분석 사주</p>
              <p className="text-sm text-white font-bold">{sajuResult.fourPillars}</p>
              <p className="text-xs text-gray-400 mt-0.5">일간 {sajuResult.pillarsDetail.day.cg} · 주력 오행 {sajuResult.dominant[0]}</p>
            </div>
            <button onClick={() => { setSajuResult(null); setResult(null); setMbti(""); }}
              className="text-xs text-gray-500 hover:text-gray-300 transition px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
              다시 입력
            </button>
          </div>
        )}

        {/* MBTI 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-300 mb-3">내 MBTI를 선택하세요</label>
          <div className="grid grid-cols-4 gap-2">
            {MBTI_TYPES.map(m => {
              const el = MBTI_ELEMENT[m];
              const selected = mbti === m;
              return (
                <button
                  key={m}
                  onClick={() => { setMbti(m); setResult(null); }}
                  className="py-2.5 rounded-xl text-sm font-black transition-all border"
                  style={{
                    background: selected ? `${ELEMENT_COLOR[el.primary]}22` : "rgba(255,255,255,0.04)",
                    borderColor: selected ? `${ELEMENT_COLOR[el.primary]}66` : "rgba(255,255,255,0.08)",
                    color: selected ? ELEMENT_COLOR[el.primary] : "rgba(255,255,255,0.5)",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {mbti && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">선택한 MBTI</p>
            <p className="font-bold text-white">{mbti}</p>
            <p className="text-xs text-gray-400 mt-1">{MBTI_ELEMENT[mbti].desc}</p>
            <div className="flex gap-2 mt-2">
              {[MBTI_ELEMENT[mbti].primary, MBTI_ELEMENT[mbti].secondary].map((el, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full font-bold" style={{ background:`${ELEMENT_COLOR[el]}22`, color:ELEMENT_COLOR[el], border:`1px solid ${ELEMENT_COLOR[el]}44` }}>
                  {i===0?"주":"부"}오행 {el}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={analyze}
          disabled={!mbti || !sajuResult}
          className="w-full py-4 rounded-2xl font-black text-base mb-8 transition-all disabled:opacity-30"
          style={{ background: mbti && sajuResult ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : undefined }}
        >
          {!sajuResult ? "사주 정보 없음" : !mbti ? "MBTI를 선택하세요" : "🧬 조합 분석하기"}
        </button>

        {result && (
          <div className="space-y-4">
            <SaveProfilePrompt
              name={name}
              birthYear={parseInt(birthYear)} birthMonth={parseInt(birthMonth)} birthDay={parseInt(birthDay)}
              birthHour={birthTime.unknown ? null : birthTime.hour}
              birthHourUnknown={birthTime.unknown}
              gender={gender}
            />
            {/* 오행 × MBTI 궁합 */}
            <div className="rounded-3xl border p-6" style={{ borderColor:`${result.elMatchColor}44`, background:`${result.elMatchColor}11` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-widest" style={{ color:result.elMatchColor }}>오행 × MBTI 궁합</p>
                <span className="text-lg font-black px-3 py-1 rounded-full" style={{ background:`${result.elMatchColor}22`, color:result.elMatchColor }}>
                  {result.elMatch}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{result.elMatchDesc}</p>
            </div>

            {/* 일간 × MBTI 시너지 */}
            <div className="bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/25 rounded-2xl p-5">
              <p className="text-xs font-bold tracking-widest text-violet-300 mb-3">일간({result.ilgan}) × {mbti} 시너지</p>
              <p className="text-sm text-gray-200 leading-relaxed">{result.synergy}</p>
            </div>

            {/* 주력 오행 분석 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-semibold tracking-widest mb-3">사주 주력 오행 ({result.dominant})</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-black" style={{ color:ELEMENT_COLOR[result.dominant] }}>{result.dominant}</span>
                <div>
                  <p className="text-sm text-white font-bold">MBTI 주력 오행: {result.mbtiEl.primary}</p>
                  <p className="text-xs text-gray-400">보조 오행: {result.mbtiEl.secondary}</p>
                </div>
              </div>
              {result.dominant === result.mbtiEl.primary ? (
                <div className="bg-green-500/10 border border-green-500/25 rounded-xl p-3">
                  <p className="text-xs text-green-400 font-bold">완벽 일치!</p>
                  <p className="text-xs text-gray-300 mt-1">사주와 MBTI가 같은 오행 에너지를 공유합니다. 내면과 외면이 일치하는 일관된 사람입니다.</p>
                </div>
              ) : result.dominant === result.mbtiEl.secondary ? (
                <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-3">
                  <p className="text-xs text-yellow-400 font-bold">보조 에너지 일치</p>
                  <p className="text-xs text-gray-300 mt-1">사주의 주력 오행이 MBTI의 보조 에너지와 연결됩니다. 깊이 파고들수록 진가가 드러나는 유형입니다.</p>
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-400">사주와 MBTI의 오행이 다릅니다. 이는 내면(사주)과 표현 방식(MBTI)이 다른 다층적인 성격을 의미합니다.</p>
                </div>
              )}
            </div>

            {/* 추천 직업 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-semibold tracking-widest mb-3">사주 × MBTI 추천 직업</p>
              <div className="flex flex-wrap gap-2">
                {result.careers.map((c, i) => (
                  <span key={i} className="text-sm px-3 py-1.5 rounded-full font-medium" style={{ background:"rgba(139,92,246,0.15)", color:"#c4b5fd", border:"1px solid rgba(139,92,246,0.3)" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* MBTI 궁합 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-semibold tracking-widest mb-4">내 오행과 맞는 MBTI</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-green-400 mb-1.5">최고 궁합</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.compat.best.map(m => (
                      <span key={m} className="text-xs px-2.5 py-1 rounded-full font-bold bg-green-500/15 text-green-300 border border-green-500/30">{m}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-yellow-400 mb-1.5">좋은 궁합</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.compat.good.map(m => (
                      <span key={m} className="text-xs px-2.5 py-1 rounded-full font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">{m}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-red-400 mb-1.5">주의 궁합</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.compat.caution.map(m => (
                      <span key={m} className="text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/15 text-red-300 border border-red-500/30">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 일간 성격 심층 분석 */}
            {(() => {
              const info = ILGAN_PERSONALITY[result.ilgan];
              if (!info) return null;
              return (
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                  <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">일간 성격 심층 분석</p>
                  <p className="text-sm font-bold text-violet-300 mb-2">{info.short}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {info.keyword.split("·").map(k => (
                      <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">{k}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{info.detail}</p>
                  {info.genderDetail && gender && (
                    <p className="text-xs leading-relaxed mt-3 pt-3 text-gray-400" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      {gender === "male" ? info.genderDetail.male : info.genderDetail.female}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* 겉모습 vs 속마음 */}
            {(() => {
              const io = ILGAN_INNER_OUTER[result.ilgan];
              if (!io) return null;
              return (
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                  <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">겉모습 vs 속마음 — {result.ilgan}일간</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-violet-500/10 border border-violet-500/25 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-violet-300 mb-1">타인이 보는 나</p>
                      <p className="text-sm font-bold text-white">{io.outer}</p>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-indigo-300 mb-1">내면의 진짜 욕구</p>
                      <p className="text-sm font-bold text-white">{io.inner}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{io.synthesis}</p>
                </div>
              );
            })()}

            {/* 사주로 보는 5가지 성향 축 */}
            {sajuResult && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-1">사주로 보는 나의 성향 축</p>
                <p className="text-[11px] text-gray-600 mb-4">MBTI 검사 없이도, 사주 안에 새겨진 기질을 5가지 축으로 풀어봤어요</p>
                <SajuAxisChart axes={calcSajuMbtiAxes(sajuResult)} />
              </div>
            )}

            {sajuResult && <SipseongInsight result={sajuResult} title="MBTI 너머 — 사주 속 핵심 기운" />}

            {/* 나와 잘 맞는 사주 */}
            {sajuResult && (() => {
              const ilganEl = CHEONGAN_ELEMENT[result.ilgan];
              const { targetEl, ganList, reason } = getCompatibleSaju(ilganEl, gender);
              return (
                <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-400/25 rounded-2xl p-5">
                  <p className="text-xs font-bold tracking-widest text-pink-300 mb-1">💗 나와 잘 맞는 사주</p>
                  <p className="text-[11px] text-gray-500 mb-3">
                    {gender === "female" ? "여성 기준 — 나를 생(生)해주는 남자" : "남성 기준 — 내가 생(生)해주는 여자"}
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">{reason}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-3 py-1.5 rounded-full font-black" style={{ background: `${ELEMENT_COLOR[targetEl]}22`, color: ELEMENT_COLOR[targetEl], border: `1px solid ${ELEMENT_COLOR[targetEl]}44` }}>
                      {targetEl}({ELEMENT_HANJA[targetEl]}) 기운의 일간
                    </span>
                    {ganList.map(g => (
                      <span key={g} className="text-xs px-2.5 py-1 rounded-full font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">{g}일간</span>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="text-center pt-2">
              <p className="text-xs text-gray-700">본 분석은 사주·MBTI 이론 기반 오락용 콘텐츠입니다. summerpalace.ai.kr</p>
            </div>
            <ResultFooterActions targetId="mbti-result" fileName="사주MBTI" />
          </div>
        )}
      </div>
    </main>
  );
}
