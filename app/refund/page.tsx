"use client";
import { useRouter } from "next/navigation";

export default function RefundPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-[#06060e] text-white px-5 py-10 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-xs text-gray-600 hover:text-gray-400 mb-8 block transition">← 뒤로</button>

      <h1 className="text-2xl font-black mb-2">환불 규정</h1>
      <p className="text-gray-500 text-sm mb-8">최종 수정일: 2026년 5월 29일</p>

      <div className="space-y-8 text-sm text-gray-300 leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-amber-400">1.</span> 기본 원칙
          </h2>
          <p>
            여름궁전(summerpalace.ai.kr)의 서비스는 결제 즉시 AI가 개인 맞춤형 콘텐츠를 생성하는 디지털 콘텐츠 서비스입니다.
            전자상거래법 제17조 제2항 제5호에 따라, <strong className="text-white">디지털 콘텐츠 특성상 콘텐츠가 생성되거나 전달된 이후에는 청약철회가 제한</strong>될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-amber-400">2.</span> 환불 가능한 경우
          </h2>
          <ul className="space-y-2 list-none">
            {[
              "결제 후 AI 콘텐츠 생성이 시작되지 않은 경우 (결제 후 10분 이내 요청 시)",
              "서버 오류 또는 시스템 장애로 인해 콘텐츠가 생성되지 않은 경우",
              "이중 결제(동일 주문이 두 번 결제된 경우)",
              "결제 금액이 상품 가격과 다른 경우",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-amber-400">3.</span> 환불 불가한 경우
          </h2>
          <ul className="space-y-2 list-none">
            {[
              "AI 콘텐츠(배경화면, 보고서, 매력 분석 보고서)가 이미 생성·제공된 경우",
              "PDF 파일을 다운로드한 경우",
              "콘텐츠를 열람하거나 저장한 경우",
              "마음에 들지 않거나 기대와 다른 경우 (사주 이론 기반 오락 콘텐츠임을 인지한 상태에서 결제)",
              "결제 후 10분이 경과한 경우",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-amber-400">4.</span> 환불 신청 방법
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <p>환불은 아래 방법으로 신청하실 수 있습니다:</p>
            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <span className="text-2xl">💬</span>
              <div>
                <p className="font-bold text-yellow-300">카카오 채널 문의</p>
                <a
                  href="http://pf.kakao.com/_cuksX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-yellow-400/80 underline"
                >
                  http://pf.kakao.com/_cuksX
                </a>
              </div>
            </div>
            <p className="text-gray-400 text-xs">
              환불 신청 시 주문번호(orderId), 결제 일시, 결제 금액을 함께 알려주세요.
              영업일 기준 1~3일 이내 처리됩니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-amber-400">5.</span> 환불 처리 기간 및 방법
          </h2>
          <p>
            환불 승인 시 결제 수단으로 영업일 기준 3~5일 이내 환불됩니다.
            카드 결제의 경우 카드사 처리 기간에 따라 최대 7일이 소요될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-amber-400">6.</span> 서비스 안내
          </h2>
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
            <p className="text-amber-200/80 text-xs leading-relaxed">
              본 서비스는 사주 이론을 기반으로 한 <strong>순수 오락 목적의 AI 콘텐츠</strong>입니다.
              결과는 과학적 근거가 없으며, 실제 인생 결정에 활용하지 않도록 권고합니다.
              결제 전 이 사항을 충분히 확인하시기 바랍니다.
            </p>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-white/10">
        <p className="text-xs text-gray-700 text-center">여름궁전 · summerpalace.ai.kr</p>
      </div>
    </main>
  );
}
