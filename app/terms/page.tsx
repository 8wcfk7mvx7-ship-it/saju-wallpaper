"use client";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <div className="max-w-2xl mx-auto px-5 py-12 pb-24">
        <button
          onClick={() => router.back()}
          className="text-xs text-gray-600 hover:text-gray-400 transition mb-8 inline-flex items-center gap-1"
        >
          ← 뒤로가기
        </button>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-4">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Summer Palace</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">이용약관</h1>
          <p className="text-sm text-gray-600">최종 수정일: 2026년 5월 29일 · 시행일: 2025년 1월 1일</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold">1</span>
              목적
            </h2>
            <div className="text-gray-400 pl-7">
              <p>이 약관은 Summer Palace(이하 "서비스")가 제공하는 AI 사주 분석 서비스의 이용 조건 및 절차, 서비스 이용자(이하 "이용자")와 서비스 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold">2</span>
              서비스의 성격 및 면책 고지
            </h2>
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 ml-7 mb-3">
              <p className="text-amber-300 font-semibold text-sm mb-1">⚠️ 중요: 오락·참고 목적 서비스</p>
              <p className="text-amber-200/80 text-xs leading-relaxed">
                Summer Palace의 모든 사주 분석 결과는 <strong>순수 오락·참고용 콘텐츠</strong>이며, 실제 운세·투자·의료·법률·진로 결정의 근거로 활용해서는 안 됩니다.<br /><br />
                특히 <strong>주식·코인 투자 분석</strong>은 전통 사주 오행 이론을 기반으로 한 오락 콘텐츠로, 금융투자 자문이 아닙니다. 실제 투자 결정은 공인 금융 전문가와 상담하시기 바랍니다.
              </p>
            </div>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>서비스는 AI 및 전통 사주 이론을 활용하여 개인화된 콘텐츠를 생성합니다. 분석 결과의 정확성을 보장하지 않으며, 결과의 해석과 활용은 전적으로 이용자의 책임입니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold">3</span>
              이용 자격 및 계약
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>만 14세 이상 누구나 별도 회원 가입 없이 서비스를 이용할 수 있습니다.</p>
              <p>서비스 접속 및 이용 시 본 약관에 동의한 것으로 간주됩니다.</p>
              <p>만 14세 미만은 보호자의 동의 없이 결제 서비스를 이용할 수 없습니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold">4</span>
              유료 서비스 및 환불 정책
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>서비스 내 일부 콘텐츠(전체 보고서, 배경화면 생성 등)는 유료로 제공됩니다.</p>
              <p>결제는 Toss Payments를 통해 처리되며, 관련 법령에 따라 청약철회가 가능합니다.</p>
              <div>
                <p className="text-gray-300 font-medium mb-1">환불 기준</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>AI 콘텐츠가 생성되기 전: 전액 환불</li>
                  <li>AI 콘텐츠 생성 완료 후: 「디지털콘텐츠 이용약관」에 따라 환불이 제한될 수 있음</li>
                  <li>서비스 오류로 인한 미생성: 전액 환불</li>
                </ul>
              </div>
              <p>환불 문의: support@summerpalace.ai.kr</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold">5</span>
              이용자 금지 행위
            </h2>
            <div className="text-gray-400 pl-7">
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>서비스의 무단 크롤링, 스크래핑, 자동화 접근</li>
                <li>타인의 개인정보를 무단 입력하거나 허위 정보 입력</li>
                <li>생성된 콘텐츠의 무단 상업적 재판매·배포</li>
                <li>서비스 인프라에 과부하를 유발하는 행위</li>
                <li>관련 법령 위반 행위</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold">6</span>
              지적재산권
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>서비스 내 UI 디자인, 텍스트 콘텐츠, 알고리즘은 Summer Palace에 귀속됩니다.</p>
              <p>이용자가 결제하여 생성한 배경화면 이미지는 개인적 사용 목적에 한해 이용 가능합니다. 상업적 이용 또는 제3자 배포를 위해서는 별도 라이선스가 필요합니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold">7</span>
              서비스 변경·중단
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>서비스는 운영 정책 변경, 기술적 사유, 경영 판단 등에 의해 서비스 내용을 변경하거나 일시 중단할 수 있습니다.</p>
              <p>서비스 중단 시 사전 공지를 원칙으로 하나, 긴급한 사유로 사전 공지가 어려울 수 있습니다.</p>
              <p>결제 완료 후 서비스 전면 종료 시에는 미사용 금액을 환불합니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold">8</span>
              책임의 한계
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>서비스는 AI가 생성한 사주 분석 결과의 정확성, 완전성, 적합성에 대해 어떠한 명시적·묵시적 보증도 하지 않습니다.</p>
              <p>이용자가 분석 결과를 근거로 내린 투자·의료·진로·관계 관련 결정으로 발생한 손해에 대해 서비스는 책임을 지지 않습니다.</p>
              <p>천재지변, 해킹, 통신장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-bold">9</span>
              준거법 및 분쟁 해결
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>본 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련하여 분쟁이 발생할 경우 서울중앙지방법원을 전속적 관할 법원으로 합니다.</p>
            </div>
          </section>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mt-8">
            <p className="text-xs text-gray-600 leading-relaxed">
              본 이용약관은 서비스 정책 변경에 따라 수시로 개정될 수 있습니다. 변경 시 서비스 내 공지 또는 이메일을 통해 안내드립니다. 개정 약관은 공지 후 7일이 지나면 효력이 발생합니다.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
