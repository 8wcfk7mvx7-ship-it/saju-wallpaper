"use client";
import { useRouter } from "next/navigation";

const Li = ({
  icon,
  children,
}: {
  icon: "check" | "x" | "dot";
  children: React.ReactNode;
}) => {
  const iconEl =
    icon === "check" ? (
      <span className="text-green-400 shrink-0 mt-0.5">✓</span>
    ) : icon === "x" ? (
      <span className="text-red-400 shrink-0 mt-0.5">✕</span>
    ) : (
      <span className="text-gray-600 shrink-0 mt-1">·</span>
    );
  return (
    <li className="flex items-start gap-2">
      {iconEl}
      <span>{children}</span>
    </li>
  );
};

export default function RefundPage() {
  const router = useRouter();
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
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-4">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Summer Palace</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">환불 규정</h1>
          <p className="text-sm text-gray-600">최종 수정일: 2026년 5월 29일 &middot; 시행일: 2025년 1월 1일</p>
        </div>

        {/* 핵심 안내 박스 */}
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 mb-10">
          <p className="text-amber-300 font-bold text-sm mb-2">📌 결제 전 반드시 확인하세요</p>
          <p className="text-amber-200/80 text-xs leading-relaxed">
            Summer Palace는 결제 즉시 AI가 개인 맞춤 콘텐츠를 생성하는 <strong>디지털 콘텐츠 서비스</strong>입니다.
            「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 따라,
            <strong> AI 콘텐츠 생성이 시작된 이후에는 청약철회(환불)가 법적으로 제한</strong>됩니다.
            결제 화면에서 이 사실에 명시적으로 동의하신 경우, 생성 완료 후 단순 변심 환불은 불가합니다.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          {/* 1. 기본 원칙 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400 font-black">1.</span>
              기본 원칙
            </h2>
            <div className="text-gray-400 pl-5 space-y-2">
              <p>
                ① 여름궁전(Summer Palace)의 모든 유료 서비스는 결제 즉시 AI 콘텐츠 생성이 시작되는
                <strong className="text-white"> 디지털 콘텐츠</strong>로, 「전자상거래법」 제17조 제2항 제5호
                「콘텐츠산업 진흥법」 제27조에 근거하여 일정 조건 하에 청약철회가 제한됩니다.
              </p>
              <p>
                ② 회사는 소비자 보호를 위해 전자상거래법이 허용하는 범위 내에서 최대한 환불을 처리하며,
                환불 불가 조건은 결제 화면에 명시하고 이용자의 사전 동의를 받습니다.
              </p>
              <p>③ 모든 환불은 원결제 수단으로 처리됩니다.</p>
            </div>
          </section>

          {/* 2. 환불 가능 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-green-400 font-black">2.</span>
              환불 가능한 경우 <span className="text-green-400 text-xs font-normal">(전액 환불)</span>
            </h2>
            <div className="text-gray-400 pl-5">
              <ul className="space-y-2.5">
                <Li icon="check">
                  <span><strong className="text-gray-300">결제 후 생성 미시작</strong>: 결제 완료 후 10분 이내에 환불을 요청하고,
                  AI 콘텐츠 생성이 아직 시작되지 않은 경우</span>
                </Li>
                <Li icon="check">
                  <span><strong className="text-gray-300">시스템 오류</strong>: 회사 서버 오류, AI API 장애 등으로 인해 콘텐츠가 정상 생성·제공되지 않은 경우</span>
                </Li>
                <Li icon="check">
                  <span><strong className="text-gray-300">이중 결제</strong>: 동일 주문건이 두 번 결제된 경우 (중복 결제 금액 전액)</span>
                </Li>
                <Li icon="check">
                  <span><strong className="text-gray-300">금액 오류</strong>: 결제 금액이 서비스 화면에 표시된 금액과 다른 경우 (차액 또는 전액)</span>
                </Li>
                <Li icon="check">
                  <span><strong className="text-gray-300">미성년자 결제</strong>: 만 14세 미만 이용자가 법정대리인 동의 없이 결제한 경우 (법정대리인 확인 후)</span>
                </Li>
              </ul>
            </div>
          </section>

          {/* 3. 환불 불가 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-red-400 font-black">3.</span>
              환불 불가한 경우
            </h2>
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 mb-3">
              <p className="text-red-300/80 text-xs">
                아래 경우는 「전자상거래법」 제17조 제2항 제5호에 의거, 디지털 콘텐츠의 특성상
                법적으로 청약철회가 제한됩니다. 결제 전 동의하신 내용입니다.
              </p>
            </div>
            <div className="text-gray-400 pl-5">
              <ul className="space-y-2.5">
                <Li icon="x">
                  <span>AI 콘텐츠(배경화면 이미지, 분석 보고서, PDF, 운세 텍스트)가 <strong className="text-gray-300">생성 완료</strong>되어 화면에 표시된 경우</span>
                </Li>
                <Li icon="x">
                  <span>생성된 결과물을 <strong className="text-gray-300">화면에서 확인(열람)</strong>한 경우</span>
                </Li>
                <Li icon="x">
                  <span>PDF 파일을 <strong className="text-gray-300">다운로드</strong>한 경우</span>
                </Li>
                <Li icon="x">
                  <span>이미지를 <strong className="text-gray-300">저장하거나 공유</strong>한 경우</span>
                </Li>
                <Li icon="x">
                  <span>콘텐츠 내용이 <strong className="text-gray-300">마음에 들지 않거나 기대와 다른 경우</strong> (사주 이론 기반 오락 콘텐츠임을 결제 전 인지·동의한 경우)</span>
                </Li>
                <Li icon="x">
                  <span>결제 후 <strong className="text-gray-300">10분이 경과</strong>한 경우 (시스템 오류 제외)</span>
                </Li>
                <Li icon="x">
                  <span>단순 변심 또는 서비스에 대한 주관적 불만족 (운세·점술 콘텐츠의 특성상 결과를 사전에 검토할 수 없음)</span>
                </Li>
                <Li icon="x">
                  <span>이용자가 입력한 생년월일·이름·성별 등 <strong className="text-gray-300">정보 오입력</strong>으로 인한 결과 불만족</span>
                </Li>
              </ul>
            </div>
          </section>

          {/* 4. 환불 신청 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400 font-black">4.</span>
              환불 신청 방법
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
                  <span className="text-2xl">💬</span>
                  <div>
                    <p className="font-bold text-yellow-300 text-sm">카카오 채널</p>
                    <p className="text-xs text-yellow-400/70 mt-0.5">pf.kakao.com/_cuksX</p>
                    <p className="text-xs text-gray-500 mt-0.5">평균 응답 1시간 이내</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <span className="text-2xl">📧</span>
                  <div>
                    <p className="font-bold text-indigo-300 text-sm">이메일 문의</p>
                    <p className="text-xs text-indigo-400/70 mt-0.5">support@summerpalace.ai.kr</p>
                    <p className="text-xs text-gray-500 mt-0.5">영업일 기준 24시간 이내</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. 환불 처리 기간 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400 font-black">5.</span>
              환불 처리 기간 및 방법
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
              <p>③ 환불 처리 현황은 문의 채널을 통해 확인하실 수 있습니다.</p>
            </div>
          </section>

          {/* 6. 부정 환불 방지 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400 font-black">6.</span>
              부정 환불 및 차지백 안내
            </h2>
            <div className="text-gray-400 pl-5 space-y-2">
              <p>① 이용자가 콘텐츠를 이용한 뒤 환불 불가 조건임에도 카드사에 이의를 제기(차지백, Chargeback)하는 경우:</p>
              <ul className="space-y-1 ml-2">
                <Li icon="dot">회사는 결제 기록, 콘텐츠 생성 로그, 열람 기록 등 관련 증거를 카드사에 제출합니다.</Li>
                <Li icon="dot">차지백 신청으로 발생한 수수료·손해를 이용자에게 청구할 수 있습니다.</Li>
                <Li icon="dot">허위 차지백 신청은 민·형사상 책임이 따를 수 있습니다.</Li>
              </ul>
              <p>② 정당한 사유가 있다면 카드사 이의제기 전에 먼저 회사 고객센터를 통해 협의해주세요.</p>
            </div>
          </section>

          {/* 7. 소비자 상담 기관 */}
          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400 font-black">7.</span>
              소비자 분쟁 조정 기관
            </h2>
            <div className="text-gray-400 pl-5 space-y-2">
              <p>회사와 협의가 되지 않을 경우, 아래 기관에 도움을 요청하실 수 있습니다.</p>
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

        {/* 서비스 성격 고지 */}
        <div className="mt-10 bg-violet-500/5 border border-violet-500/15 rounded-2xl p-5">
          <p className="text-violet-300 font-bold text-sm mb-2">서비스 성격 재고지</p>
          <p className="text-violet-200/70 text-xs leading-relaxed">
            Summer Palace의 모든 유료 서비스(사주 분석, 오행 배경화면, 대운·세운 보고서, 매력 분석, 도시 추천 등)는
            동양 철학 이론과 AI를 결합한 <strong>순수 오락·참고 목적의 디지털 콘텐츠</strong>입니다.
            분석 결과는 과학적 근거가 없으며, 실제 미래를 예측하지 않습니다.
            결제 전 이 사실을 충분히 인지하시기 바랍니다.
          </p>
        </div>

        {/* 사업자 정보 */}
        <div className="mt-8 border-t border-white/5 pt-6">
          <div className="text-xs text-gray-700 text-center space-y-1 leading-relaxed">
            <p>여름궁전(Summer Palace) &middot; support@summerpalace.ai.kr</p>
            <p>summerpalace.ai.kr &middot; 카카오채널: pf.kakao.com/_cuksX</p>
            <p className="text-gray-800 mt-2">ⓒ 2025 Summer Palace. All rights reserved.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
