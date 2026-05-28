"use client";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-black text-white mb-2">개인정보처리방침</h1>
          <p className="text-sm text-gray-600">최종 수정일: 2026년 5월 28일 · 시행일: 2025년 1월 1일</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">1</span>
              총칙
            </h2>
            <div className="text-gray-400 space-y-2 pl-7">
              <p>Summer Palace(이하 "서비스")는 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 및 관련 법령을 준수합니다.</p>
              <p>본 방침은 서비스가 수집하는 개인정보의 항목, 수집 방법, 이용 목적, 제3자 제공, 보유 기간 및 이용자 권리에 관하여 안내합니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">2</span>
              수집하는 개인정보 항목
            </h2>
            <div className="text-gray-400 pl-7 space-y-3">
              <div>
                <p className="text-gray-300 font-medium mb-1">서비스 이용 시 자동 수집</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>접속 IP 주소, 브라우저 종류, 운영체제</li>
                  <li>방문 일시, 서비스 이용 기록</li>
                  <li>쿠키(Cookie) 및 세션 데이터</li>
                </ul>
              </div>
              <div>
                <p className="text-gray-300 font-medium mb-1">서비스 이용 시 직접 입력</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>이름(닉네임), 성별</li>
                  <li>생년월일, 출생 시간, 출생지</li>
                  <li>결제 시: 결제 수단 정보(PG사 처리, 서비스는 저장하지 않음)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">3</span>
              개인정보 수집 및 이용 목적
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>수집된 정보는 다음 목적으로만 이용됩니다.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>사주팔자 오행 분석 및 AI 결과 생성</li>
                <li>배경화면·보고서·궁합·투자·매력 분석 서비스 제공</li>
                <li>결제 처리 및 서비스 이용 내역 확인</li>
                <li>서비스 품질 개선 및 통계 분석(비식별화 처리)</li>
                <li>부정 이용 방지 및 법적 의무 이행</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">4</span>
              개인정보 보유 및 이용 기간
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>이용자가 입력한 사주 정보(이름, 생년월일, 출생지 등)는 <strong className="text-gray-300">브라우저의 로컬스토리지·세션스토리지에만 저장</strong>되며, 서버에 영구 보관되지 않습니다.</p>
              <p>결제 관련 기록은 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 5년간 보관합니다.</p>
              <p>서버 접속 로그는 3개월간 보관 후 자동 삭제됩니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">5</span>
              개인정보 제3자 제공
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우 예외로 합니다.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령에 의거하거나 수사기관의 적법한 요청이 있는 경우</li>
              </ul>
              <div className="mt-3">
                <p className="text-gray-300 font-medium mb-1">업무 위탁 현황</p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                  <div className="grid grid-cols-2 gap-2 font-medium text-gray-400 border-b border-white/10 pb-1 mb-1">
                    <span>수탁 업체</span><span>업무 내용</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2"><span>Anthropic (Claude AI)</span><span>사주 분석 AI 처리</span></div>
                  <div className="grid grid-cols-2 gap-2"><span>OpenAI (DALL-E)</span><span>배경화면 이미지 생성</span></div>
                  <div className="grid grid-cols-2 gap-2"><span>Supabase</span><span>데이터베이스 운영</span></div>
                  <div className="grid grid-cols-2 gap-2"><span>Toss Payments</span><span>결제 처리</span></div>
                  <div className="grid grid-cols-2 gap-2"><span>Google (AdSense)</span><span>광고 게재</span></div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">6</span>
              쿠키 및 광고 추적
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>서비스는 Google AdSense 등 광고 플랫폼의 쿠키를 사용할 수 있습니다. 광고 쿠키는 이용자의 관심사 기반 광고를 위해 사용되며, 브라우저 설정에서 거부할 수 있습니다.</p>
              <p>쿠키 거부 방법: 브라우저 설정 → 개인정보/보안 → 쿠키 차단</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">7</span>
              이용자의 권리
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>개인정보 열람·정정·삭제 요구권</li>
                <li>개인정보 처리 정지 요구권</li>
                <li>브라우저 저장 데이터 직접 삭제: 브라우저 → 개발자도구 → Application → Local Storage 삭제</li>
              </ul>
              <p className="mt-2">개인정보 관련 문의는 아래 연락처로 접수하시기 바랍니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">8</span>
              개인정보 보호책임자 및 문의
            </h2>
            <div className="text-gray-400 pl-7">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm space-y-1">
                <p><span className="text-gray-500">서비스명:</span> <span className="text-gray-300">Summer Palace</span></p>
                <p><span className="text-gray-500">이메일:</span> <span className="text-gray-300">support@summerpalace.ai.kr</span></p>
                <p><span className="text-gray-500">사이트:</span> <span className="text-gray-300">summerpalace.ai.kr</span></p>
              </div>
            </div>
          </section>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mt-8">
            <p className="text-xs text-gray-600 leading-relaxed">
              본 개인정보처리방침은 법령 변경 또는 서비스 정책 변경에 따라 수시로 개정될 수 있습니다. 변경 시 서비스 내 공지를 통해 안내드립니다.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
