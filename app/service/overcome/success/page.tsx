"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import ShareImageButton from "@/components/ShareImageButton";

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
    overcome:["고독을 적으로 삼지 마세요. 창의적 힘으로 전환하세요.","명상·수련·종교 활동이 에너지를 안정시킵니다.","혼자만의 공간과 시간을 충분히 확보하세요.","소수의 진짜 관계를 추구하세요."],
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
        birthHour: null, birthMinute: null, name: "", gender: form.gender || "female",
        birthPlace: "서울", style: "auto", productType: "report", useJajasi: false,
      });
      setSinsals(r.sinsalList.map((s: { name: string }) => s.name));
      setDominant(r.dominant);
      setLacking(r.lacking);
      setDayCg(r.pillarsDetail.day.cg);
      setDayJj(r.pillarsDetail.day.jj);
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
            <p className="text-sm text-gray-500">사주 극복법 맞춤 분석</p>
          </div>
        )}

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

        <p className="text-center text-xs text-gray-700">본 내용은 사주 이론 기반 참고 자료입니다.</p>
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
