"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Tab = "terms" | "refund";

const Section = ({ num, title, children }: { num: number; title: string; children: React.ReactNode }) => (
  <section className="border-b border-white/5 pb-7">
    <h2 className="text-base font-bold text-white mb-3 flex items-start gap-2.5">
      <span className="shrink-0 w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold mt-0.5">
        {num}
      </span>
      제{num}조 {title}
    </h2>
    <div className="text-gray-400 pl-8 space-y-2 text-sm leading-relaxed">{children}</div>
  </section>
);

const Li = ({ children, icon = "dot" }: { children: React.ReactNode; icon?: "check" | "x" | "dot" }) => {
  const iconEl = icon === "check"
    ? <span className="text-green-400 shrink-0 mt-0.5">✓</span>
    : icon === "x"
    ? <span className="text-red-400 shrink-0 mt-0.5">✕</span>
    : <span className="text-violet-500/60 shrink-0 mt-1">·</span>;
  return (
    <li className="flex items-start gap-2">{iconEl}<span>{children}</span></li>
  );
};

function TermsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("terms");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "refund") setTab("refund");
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <div className="max-w-2xl mx-auto px-5 py-12 pb-28">
        <button
          onClick={() => router.back()}
          className="text-xs text-gray-600 hover:text-gray-400 transition mb-8 inline-flex items-center gap-1"
        >
          ← 뒤로가기
        </button>

        {/* 헤더 */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-4">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Summer Palace</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">이용약관 · 환불규정</h1>
          <p className="text-sm text-gray-600">최종 수정일: 2026년 6월 23일 &middot; 시행일: 2026년 6월 23일</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab("terms")}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
              tab === "terms"
                ? "bg-violet-600 text-white"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            이용약관
          </button>
          <button
            onClick={() => setTab("refund")}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
              tab === "refund"
                ? "bg-amber-600 text-white"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            환불규정
          </button>
        </div>

        {/* ── 이용약관 탭 ── */}
        {tab === "terms" && (
          <>
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 mb-10">
              <p className="text-amber-300 font-bold text-sm mb-2">!서비스 이용 전 반드시 확인하세요</p>
              <p className="text-amber-200/80 text-xs leading-relaxed">
                Summer Palace의 모든 사주·오행·MBTI·운세·배경화면·보고서 서비스는 <strong>순수 오락·참고 목적</strong>의 AI 생성 콘텐츠입니다.
                분석 결과는 <strong>투자·의료·법률·진로·관계 등 실생활 결정의 근거로 사용할 수 없으며</strong>,
                그로 인한 결과에 대해 서비스 운영자는 법적 책임을 지지 않습니다.
              </p>
            </div>

            <div className="space-y-7">
              <Section num={1} title="목적">
                <p>
                  이 약관은 여름궁전(Summer Palace)이 운영하는 AI 사주 분석 서비스 summerpalace.ai.kr의
                  이용 조건 및 절차, 회사와 이용자 사이의 권리·의무·책임에 관한 사항을 규정합니다.
                </p>
              </Section>

              <Section num={2} title="정의">
                <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                <ul className="space-y-1.5">
                  <Li><strong className="text-gray-300">회사</strong>: 본 서비스를 제공하는 여름궁전(Summer Palace)을 말합니다.</Li>
                  <Li><strong className="text-gray-300">서비스</strong>: AI 사주 분석, 오행 배경화면 생성, 보고서, MBTI 조합 분석 등 회사가 제공하는 일체의 기능을 말합니다.</Li>
                  <Li><strong className="text-gray-300">이용자</strong>: 본 약관에 동의하고 서비스 화면에 접속하여 서비스를 이용하는 자를 말합니다. 본 서비스는 별도의 회원가입 절차를 두지 않으므로 회원·비회원의 구분 없이 서비스에 접속한 모든 자를 이용자로 봅니다.</Li>
                  <Li><strong className="text-gray-300">콘텐츠</strong>: AI가 생성한 분석 텍스트, 이미지, PDF 등 서비스 이용 과정에서 생성되는 모든 결과물을 말합니다.</Li>
                  <Li><strong className="text-gray-300">유료 서비스</strong>: 이용자가 요금을 결제한 후에 이용할 수 있는 서비스 및 콘텐츠를 말합니다.</Li>
                  <Li><strong className="text-gray-300">디지털 콘텐츠</strong>: 「콘텐츠산업 진흥법」 제2조 제1호에 따른 부호·문자·도형·색채·음성·음향·이미지 및 영상 등을 말합니다.</Li>
                  <Li><strong className="text-gray-300">입력정보</strong>: 사주 분석을 위해 이용자가 직접 입력하는 이름, 생년월일, 출생 시간, 성별 등의 정보를 말합니다.</Li>
                </ul>
              </Section>

              <Section num={3} title="약관의 효력 및 변경">
                <p>① 이 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</p>
                <p>② 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」 등 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.</p>
                <p>③ 약관 변경 시 적용 일자 및 변경 사유를 명시하여 시행일 7일 전(이용자에게 불리한 변경의 경우 30일 전)부터 서비스 내 공지합니다.</p>
                <p>④ 이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수 있습니다. 변경 공지 후 7일이 경과하도록 이의를 제기하지 않으면 변경 약관에 동의한 것으로 봅니다.</p>
              </Section>

              <Section num={4} title="서비스 제공 및 변경">
                <p>① 회사는 다음의 서비스를 제공합니다.</p>
                <ul className="space-y-1 ml-2">
                  <Li>AI 사주팔자·오행 분석 (무료/유료)</Li>
                  <Li>맞춤형 오행 배경화면 생성</Li>
                  <Li>대운·세운·교운기 프리미엄 보고서</Li>
                  <Li>사주 도시·국가 추천 서비스</Li>
                  <Li>사주 × MBTI 조합 분석</Li>
                  <Li>사주 매력 분석 보고서</Li>
                  <Li>기타 회사가 추가로 개발하거나 제휴를 통해 제공하는 서비스</Li>
                </ul>
                <p>② 회사는 서비스 내용을 변경할 수 있으며, 변경 시 사전 공지합니다.</p>
                <p>③ 무료 서비스는 언제든지 수정·중단될 수 있으며, 무료 서비스의 변경·중단에 대해 회사는 별도의 보상을 제공하지 않습니다.</p>
              </Section>

              <Section num={5} title="이용 신청 및 자격">
                <p>① 서비스는 별도의 회원 가입 없이 이용할 수 있습니다. 서비스 접속 및 유료 결제 시 본 약관에 동의한 것으로 간주합니다.</p>
                <p>② 만 14세 미만 이용자는 개인정보(입력정보)의 수집·이용 목적을 충분히 숙지하고, 법정대리인의 사전 동의를 얻은 후에만 입력정보를 제공하거나 유료 서비스를 이용할 수 있습니다.</p>
                <p>③ 회사는 법정대리인의 동의 확인 절차를 거치지 않은 만 14세 미만 이용자의 유료 서비스 이용을 제한 또는 취소할 수 있습니다.</p>
                <p>④ 만 14세 미만 이용자의 법정대리인은 해당 이용자의 입력정보에 대한 열람·정정·삭제를 요청하거나 동의를 철회할 수 있으며, 이 경우 회사는 지체 없이 필요한 조치를 취합니다.</p>
                <p>⑤ 다음에 해당하는 경우 서비스 이용을 제한할 수 있습니다.</p>
                <ul className="space-y-1 ml-2">
                  <Li>이용자가 허위 정보를 입력한 경우</Li>
                  <Li>서비스 정상 운영을 방해하거나 약관을 위반한 경우</Li>
                  <Li>관련 법령 위반 행위를 한 경우</Li>
                </ul>
              </Section>

              <Section num={6} title="서비스의 성격 및 면책 고지 (필독)">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-3">
                  <p className="text-red-300 font-bold text-sm mb-2">서비스 결과물의 한계</p>
                  <ul className="space-y-1 text-xs text-red-200/80">
                    <Li>모든 분석 결과는 <strong>동양 철학 이론(사주팔자, 오행 등)과 AI 알고리즘을 결합한 오락·참고용 콘텐츠</strong>입니다.</Li>
                    <Li>분석 결과에는 과학적·의학적·법적 근거가 없으며, 실제 사실 또는 미래를 예언하지 않습니다.</Li>
                    <Li>투자(주식·코인·부동산 포함), 의료, 법률, 진로, 대인관계 결정의 근거로 사용할 수 없습니다.</Li>
                    <Li>AI가 생성한 콘텐츠는 동일한 입력값에도 매번 상이한 결과가 생성될 수 있습니다.</Li>
                  </ul>
                </div>
                <p>① 서비스는 결과물의 정확성, 완전성, 적합성에 대해 명시적·묵시적 어떠한 보증도 하지 않습니다.</p>
                <p>② 이용자가 분석 결과를 근거로 내린 의사결정으로 발생한 손해에 대해 회사는 일절 책임을 지지 않습니다.</p>
              </Section>

              <Section num={7} title="유료 서비스 및 결제">
                <p>① 유료 서비스 이용을 위해서는 사전에 요금을 결제해야 합니다. 결제는 Toss Payments(토스페이먼츠)를 통해 처리됩니다.</p>
                <p>② 결제 수단: 신용카드, 체크카드, 토스페이, 간편결제 등 회사가 지정하는 방법</p>
                <p>③ 이용자는 결제 전 해당 유료 서비스의 내용, 요금, 환불 조건을 충분히 확인해야 합니다.</p>
                <p>④ 회사는 서비스 요금을 변경할 수 있으며, 변경 전에 서비스 내 공지합니다.</p>
              </Section>

              <Section num={8} title="청약철회 및 환불">
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-3">
                  <p className="text-violet-300 font-bold text-sm mb-1">자세한 환불 정책</p>
                  <p className="text-violet-200/80 text-xs leading-relaxed">
                    상단의 <strong>환불규정 탭</strong>에서 전체 환불 정책을 확인하세요.
                    「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 따라,
                    AI가 생성을 시작한 디지털 콘텐츠는 청약철회가 제한됩니다.
                  </p>
                  <button
                    onClick={() => setTab("refund")}
                    className="mt-2 text-xs text-violet-400 hover:text-violet-300 font-semibold transition underline"
                  >
                    → 환불규정 전체 보기
                  </button>
                </div>
              </Section>

              <Section num={9} title="서비스 이용 제한 및 중단">
                <p>① 회사는 다음 사유 발생 시 서비스를 일시 중단할 수 있습니다.</p>
                <ul className="space-y-1 ml-2">
                  <Li>시스템 점검·보수·업데이트</Li>
                  <Li>통신 장애, 서버 장애 등 기술적 사유</Li>
                  <Li>천재지변, 국가비상사태, 정전 등 불가항력</Li>
                  <Li>AI API 공급 업체(OpenAI, Anthropic 등) 서비스 장애</Li>
                </ul>
                <p>② 회사는 서비스를 영구 종료할 경우 60일 전 서비스 내 공지합니다.</p>
              </Section>

              <Section num={10} title="이용자의 의무 및 금지 행위">
                <p>이용자는 서비스 이용 시 다음 행위를 하여서는 안 됩니다.</p>
                <ul className="space-y-1 ml-2">
                  <Li>타인의 개인정보(이름, 생년월일 등)를 무단으로 입력·도용하는 행위</Li>
                  <Li>서비스에 대한 무단 크롤링, 스크래핑, 자동화 접근</Li>
                  <Li>역공학, 소스코드 추출, 해킹 시도</Li>
                  <Li>생성된 콘텐츠를 회사의 사전 동의 없이 상업적으로 재판매·재배포</Li>
                  <Li>서비스를 이용하여 타인을 기만·사기하는 행위</Li>
                  <Li>관련 법령을 위반하는 일체의 행위</Li>
                </ul>
              </Section>

              <Section num={11} title="콘텐츠 저작권 및 이용 라이선스">
                <p>① 서비스의 UI·디자인·텍스트·알고리즘·브랜드에 대한 지식재산권은 회사에 귀속됩니다.</p>
                <p>② AI가 생성한 분석 텍스트, 배경화면 이미지, PDF 보고서의 저작권은 회사에 귀속됩니다. 단, 이용자는 다음과 같이 이용할 수 있습니다.</p>
                <ul className="space-y-1 ml-2">
                  <Li><strong className="text-gray-300">허용:</strong> 개인 비상업적 사용(배경화면 설정, 개인 소장, 비공개 공유)</Li>
                  <Li><strong className="text-gray-300">허용:</strong> SNS에 &ldquo;Summer Palace 출처 표기&rdquo;와 함께 공유</Li>
                  <Li><strong className="text-red-400">금지:</strong> 상업적 재판매, 인쇄물·굿즈 제작 판매</Li>
                  <Li><strong className="text-red-400">금지:</strong> 출처 미표기 대규모 배포</Li>
                </ul>
              </Section>

              <Section num={12} title="개인정보 보호">
                <p>① 회사는 「개인정보 보호법」 및 관련 법령에 따라 이용자의 개인정보를 보호합니다.</p>
                <p>② 이용자가 입력하는 사주 정보(이름, 생년월일, 출생 시간 등)는 AI 분석 처리 후 결과 생성에만 사용됩니다.</p>
                <p>③ 결제 정보는 Toss Payments(토스페이먼츠)에서 직접 처리하며, 회사는 카드번호 등 민감 결제 정보를 저장하지 않습니다.</p>
                <p>④ 자세한 내용은 서비스 내 <strong className="text-violet-300">개인정보처리방침</strong>을 참조하시기 바랍니다.</p>
              </Section>

              <Section num={13} title="책임의 한계 및 면책">
                <p>① 회사는 다음의 경우에 대해 책임을 지지 않습니다.</p>
                <ul className="space-y-1 ml-2">
                  <Li>AI 생성 콘텐츠의 정확성·완전성·신뢰성 결여로 인한 손해</Li>
                  <Li>이용자가 분석 결과를 투자·의료·법률 등 실제 결정에 활용하여 발생한 손해</Li>
                  <Li>천재지변, 해킹, 통신 장애 등 불가항력으로 인한 서비스 중단</Li>
                  <Li>이용자의 귀책 사유(잘못된 정보 입력, 기기 오류 등)로 인한 결과 불만족</Li>
                </ul>
                <p>② 회사의 손해배상 책임이 인정되는 경우, 그 범위는 해당 서비스 결제 금액을 초과하지 않습니다.</p>
              </Section>

              <Section num={14} title="분쟁 해결 및 관할">
                <p>① 서비스 이용 관련 분쟁 발생 시 이용자는 먼저 고객센터를 통해 불만을 접수해 주세요. 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하여 적절하고 신속한 조치를 취합니다. 다만 신속한 처리가 곤란한 경우에는 이용자에게 그 사유와 처리 일정을 통보합니다.</p>
                <p>② 이 약관은 대한민국 법률에 따라 해석하고 적용합니다.</p>
                <p>③ 서비스 이용과 관련한 소송은 서울중앙지방법원을 전속적 합의 관할 법원으로 합니다.</p>
              </Section>
            </div>

            <div className="mt-10 bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-bold mb-2">부칙</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                본 약관은 2025년 1월 1일부터 시행합니다.
                2026년 5월 31일 개정 약관은 공지 후 2026년 6월 7일부터 적용됩니다.
              </p>
            </div>
          </>
        )}

        {/* ── 환불규정 탭 ── */}
        {tab === "refund" && (
          <>
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-6">
              <p className="text-red-300 font-black text-sm mb-2">결제 전 필수 고지 (법적 효력)</p>
              <p className="text-red-200/80 text-xs leading-relaxed">
                Summer Palace의 모든 유료 서비스는 <strong>결제 완료 즉시 서버에서 AI 콘텐츠 생성이 시작</strong>됩니다.
                이용자가 결제 화면에서 동의 체크박스를 선택함으로써 본 환불불가 조건에 사전 동의한 것으로 처리됩니다.
                「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호 및 「콘텐츠산업 진흥법」 제27조에 따라,
                <strong> 사전 동의한 디지털 콘텐츠의 경우 제공 즉시 청약철회가 불가합니다.</strong>
              </p>
            </div>

            {/* 서비스 제공 기간 및 방법 */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8 text-sm">
              <p className="text-white font-bold mb-3">서비스 제공 기간 및 방법</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <span className="text-gray-500">제공 시점</span>
                <span className="text-white font-bold">결제 완료 즉시 (수 초 이내)</span>
                <span className="text-gray-500">제공 방법</span>
                <span className="text-gray-300">서비스 화면 내 텍스트·이미지 표시</span>
                <span className="text-gray-500">이용 기간</span>
                <span className="text-gray-300">결제 후 영구 이용 가능 (서비스 운영 기간 내)</span>
                <span className="text-gray-500">교환</span>
                <span className="text-red-400 font-bold">불가 — 디지털 콘텐츠 특성상 교환 없음</span>
                <span className="text-gray-500">반품</span>
                <span className="text-red-400 font-bold">불가 — 디지털 콘텐츠 특성상 반품 없음</span>
              </div>
            </div>

            <div className="space-y-8 text-sm leading-relaxed">

              <section>
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-amber-400 font-black">1.</span> 기본 원칙
                </h2>
                <div className="text-gray-400 pl-5 space-y-2">
                  <p>① 본 서비스의 모든 유료 콘텐츠는 결제 완료와 동시에 서버에서 AI 생성이 시작되는 즉시 제공 디지털 콘텐츠입니다. 결제 화면의 동의 체크 선택으로 이용자는 본 조건에 사전 동의한 것으로 간주됩니다.</p>
                  <p>② 「전자상거래법」 제17조 제2항 제5호·「콘텐츠산업 진흥법」 제27조에 따라, 사전 동의한 즉시 제공 디지털 콘텐츠는 원칙적으로 청약철회가 불가합니다.</p>
                  <p>③ 단, 회사의 귀책 사유(시스템 오류·이중 결제·금액 오류)에 해당하는 경우에 한해 환불을 처리합니다.</p>
                  <p>④ 모든 환불은 원결제 수단으로만 처리되며, 현금·포인트·다른 결제 수단으로의 변경은 불가합니다.</p>
                </div>
              </section>

              <section>
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-gray-500 font-black">2.</span> 취소 가능 시점
                </h2>
                <div className="text-gray-400 pl-5 space-y-2">
                  <p className="text-white text-xs font-bold bg-white/5 rounded-lg px-3 py-2">결제창에서 결제 버튼을 누르기 전까지만 취소 가능</p>
                  <p>결제 버튼 클릭 후 결제가 승인된 시점부터는 취소 불가합니다. 결제 진행 중 이탈·타임아웃의 경우 PG사(토스페이먼츠) 처리 결과에 따릅니다.</p>
                </div>
              </section>

              <section>
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-green-400 font-black">3.</span>
                  환불 가능한 경우 <span className="text-green-400 text-xs font-normal">(회사 귀책 한정, 전액 환불)</span>
                </h2>
                <div className="text-gray-400 pl-5">
                  <ul className="space-y-2.5">
                    <Li icon="check"><span><strong className="text-gray-300">서비스 미제공</strong>: 결제 완료 후 서버 오류·API 장애 등으로 콘텐츠가 생성되지 않고 빈 화면·오류가 표시된 경우 (스크린샷 등 증빙 필요)</span></Li>
                    <Li icon="check"><span><strong className="text-gray-300">이중 결제</strong>: 동일 주문번호(orderId)가 두 번 결제 처리된 경우 (중복분 전액)</span></Li>
                    <Li icon="check"><span><strong className="text-gray-300">금액 오류</strong>: 서비스 화면에 명시된 금액과 실제 청구 금액이 다른 경우</span></Li>
                    <Li icon="check"><span><strong className="text-gray-300">미성년자 결제</strong>: 만 14세 미만이 법정대리인 동의 없이 결제한 것이 증명된 경우</span></Li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-red-400 font-black">4.</span> 환불 불가한 경우 (원칙적 전면 불가)
                </h2>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-3">
                  <p className="text-red-300/90 text-xs font-bold">
                    아래 모든 경우는 「전자상거래법」 제17조 제2항 제5호에 의거, 결제 화면 사전 동의에 따라 청약철회가 불가합니다.
                  </p>
                </div>
                <div className="text-gray-400 pl-5">
                  <ul className="space-y-2.5">
                    <Li icon="x"><span>결제 완료 즉시 — <strong className="text-gray-300">서버에서 AI 생성이 개시된 경우</strong> (결제 승인 후 즉시 해당)</span></Li>
                    <Li icon="x"><span>생성된 결과물을 화면에서 <strong className="text-gray-300">1초라도 확인</strong>한 경우</span></Li>
                    <Li icon="x"><span>분석 내용이 <strong className="text-gray-300">기대와 다르거나 마음에 들지 않는</strong> 경우</span></Li>
                    <Li icon="x"><span>이용자가 생년월일·성별·시간 등 <strong className="text-gray-300">정보를 잘못 입력</strong>하여 원하지 않는 결과가 나온 경우</span></Li>
                    <Li icon="x"><span>사주 해석의 <strong className="text-gray-300">주관적 불만족</strong> (AI 특성상 동일 입력값에도 결과가 달라질 수 있음을 사전 고지)</span></Li>
                    <Li icon="x"><span><strong className="text-gray-300">다른 서비스와 중복 이용</strong>하거나 다른 플랫폼에서 유사 분석을 이미 받은 경우</span></Li>
                    <Li icon="x"><span>결제 후 <strong className="text-gray-300">단순 변심</strong></span></Li>
                    <Li icon="x"><span>PDF 다운로드·이미지 저장·캡처·공유 등 <strong className="text-gray-300">콘텐츠를 외부로 반출</strong>한 경우</span></Li>
                    <Li icon="x"><span>AI 채팅 서비스 이용 중 <strong className="text-gray-300">음란물·불법행위 등 AI가 답변할 수 없는 내용을 질문</strong>하여 답변이 거부된 경우 (별조각은 정상 차감되며 환불 대상이 아님)</span></Li>
                    <Li icon="x"><span>결제 화면에서 <strong className="text-gray-300">이용약관·환불불가 조건에 동의 체크</strong> 후 결제를 진행한 경우 (모든 결제에 해당)</span></Li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-amber-400 font-black">4.</span> 환불 신청 방법
                </h2>
                <div className="pl-5 space-y-3">
                  <p className="text-gray-400">환불 신청 시 아래 정보를 준비하여 문의해주세요.</p>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-gray-400 space-y-1">
                    <p className="text-gray-300 font-bold mb-2">필수 제출 정보</p>
                    <p>· 주문번호 (orderId) — 결제 화면 또는 영수증에서 확인</p>
                    <p>· 결제 일시 및 결제 금액</p>
                    <p>· 결제 수단 (카드 종류, 토스페이 등)</p>
                    <p>· 환불 사유 (구체적으로 기재)</p>
                    <p>· 연락처 (이메일 또는 카카오)</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <span className="text-sm text-yellow-400 font-bold">채팅</span>
                      <div>
                        <p className="font-bold text-yellow-300 text-sm">카카오 채널</p>
                        <p className="text-xs text-yellow-400/70 mt-0.5">pf.kakao.com/_cuksX</p>
                        <p className="text-xs text-gray-500 mt-0.5">평균 응답 1시간 이내</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                      <span className="text-sm text-indigo-400 font-bold">메일</span>
                      <div>
                        <p className="font-bold text-indigo-300 text-sm">이메일 문의</p>
                        <p className="text-xs text-indigo-400/70 mt-0.5">smple@outlook.kr</p>
                        <p className="text-xs text-gray-500 mt-0.5">영업일 기준 1~2일 이내</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-amber-400 font-black">5.</span> 환불 처리 기간 및 방법
                </h2>
                <div className="text-gray-400 pl-5 space-y-2">
                  <p>① 환불 승인 후 처리 기간은 결제 수단에 따라 다를 수 있습니다.</p>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <span className="text-gray-400">신용·체크카드</span>
                      <span className="text-gray-300">영업일 3~5일 (카드사 처리 최대 7일)</span>
                      <span className="text-gray-400">토스페이</span>
                      <span className="text-gray-300">영업일 1~3일</span>
                      <span className="text-gray-400">기타 간편결제</span>
                      <span className="text-gray-300">영업일 3~5일</span>
                    </div>
                  </div>
                  <p>② 환불은 원결제 수단으로 처리되며, 현금 환급으로 변경은 불가합니다.</p>
                </div>
              </section>

              <section>
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-amber-400 font-black">6.</span> 소비자 분쟁 조정 기관
                </h2>
                <div className="text-gray-400 pl-5">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-28 shrink-0">공정거래위원회</span>
                      <span>소비자상담센터 1372 / www.ftc.go.kr</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-28 shrink-0">한국소비자원</span>
                      <span>www.kca.go.kr / 1372</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-28 shrink-0">전자거래분쟁</span>
                      <span>전자거래분쟁조정위원회 / www.ecmc.or.kr</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-28 shrink-0">콘텐츠분쟁</span>
                      <span>콘텐츠분쟁조정위원회 / www.kcdrc.kr</span>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </>
        )}

        {/* 사업자 정보 */}
        <div className="mt-10 border-t border-white/5 pt-6">
          <div className="text-xs text-gray-700 text-center space-y-1 leading-relaxed">
            <p>여름궁전(Summer Palace) &middot; smple@outlook.kr</p>
            <p>summerpalace.ai.kr &middot; 카카오채널: pf.kakao.com/_cuksX</p>
            <p className="text-gray-800 mt-2">ⓒ 2026 Summer Palace. All rights reserved.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#06060e]" />}>
      <TermsContent />
    </Suspense>
  );
}
