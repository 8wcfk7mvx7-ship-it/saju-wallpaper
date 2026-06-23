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
          <p className="text-sm text-gray-600">최종 수정일: 2026년 6월 23일 · 시행일: 2026년 6월 23일</p>
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
              <p>회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만 관련 법령의 규정에 의하여 보존할 필요가 있는 경우, 회사는 아래와 같이 관계 법령에서 정한 일정한 기간 동안 보관합니다.</p>
              <p>이용자가 입력한 사주 정보(이름, 생년월일, 출생지 등)는 <strong className="text-gray-300">브라우저의 로컬스토리지·세션스토리지에만 저장</strong>되며, 서버에 영구 보관되지 않습니다.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                <li>대금결제 및 재화·서비스 공급에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                <li>접속 로그(IP 등)에 관한 기록: 3개월 (통신비밀보호법)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">5</span>
              개인정보 파기 절차 및 방법
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>서비스는 원칙적으로 개인정보를 서버에 저장하지 않으며, 입력정보는 이용자의 브라우저(로컬스토리지·세션스토리지)에만 보관됩니다. 이용자가 브라우저 데이터를 삭제하거나 보유 목적이 달성되면 별도 조치 없이 즉시 파기된 것으로 봅니다.</p>
              <p>전자적 파일 형태로 저장된 정보(결제 기록 등 법령에 따라 보관하는 정보)는 보유 기간이 만료되면 복구가 불가능한 방법으로 영구 삭제합니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">6</span>
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
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">7</span>
              개인정보 처리위탁
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>서비스는 원활한 업무 처리를 위해 위 6번 항목의 수탁 업체에 개인정보 처리 업무를 위탁하고 있습니다. 위탁 계약 시 「개인정보 보호법」에 따라 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독합니다.</p>
              <p>위탁 업체나 위탁 내용이 변경될 경우, 변경 사항을 본 방침을 통해 지체 없이 공지합니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">8</span>
              쿠키 및 자동 수집 장치
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <div>
                <p className="text-gray-300 font-medium mb-1">가. 쿠키의 운영에 관한 사항</p>
                <p>회사는 이용자의 정보를 수시로 저장하고 찾아내는 &lsquo;쿠키(cookie)&rsquo;를 운용합니다. 쿠키란 웹사이트를 운영하는 서버가 이용자의 브라우저에 보내는 아주 작은 텍스트 파일로서, 이용자의 컴퓨터·모바일 기기에 저장됩니다.</p>
              </div>
              <div>
                <p className="text-gray-300 font-medium mb-1">나. 쿠키 사용 목적</p>
                <p>접속 빈도·방문 시간 분석, 이용자의 관심분야 파악 및 서비스 이용 패턴 분석, Google AdSense 등 광고 플랫폼을 통한 관심사 기반 광고 제공을 위해 사용됩니다.</p>
              </div>
              <div>
                <p className="text-gray-300 font-medium mb-1">다. 쿠키 설정 거부 방법</p>
                <p>이용자는 웹 브라우저의 옵션을 설정하여 모든 쿠키를 허용하거나, 쿠키 저장 시마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다. (설정 경로: 브라우저 설정 → 개인정보/보안 → 쿠키 차단) 단, 쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 발생할 수 있습니다.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">9</span>
              개인정보의 기술적·관리적 보호 대책
            </h2>
            <div className="text-gray-400 pl-7 space-y-3">
              <p>회사는 이용자의 개인정보를 취급함에 있어 분실, 도난, 누출, 변조 또는 훼손되지 않도록 안정성 확보를 위하여 다음과 같은 기술적·관리적 대책을 강구하고 있습니다.</p>
              <div>
                <p className="text-gray-300 font-medium mb-1">[기술적 대책]</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>이용자와 서버 간 통신 구간에 암호화(HTTPS/TLS)를 적용하여 데이터를 안전하게 전송합니다.</li>
                  <li>결제 정보는 PG사(Toss Payments)가 직접 처리하며, 회사는 카드번호 등 민감한 결제 정보를 저장하지 않습니다.</li>
                  <li>입력정보를 서버에 저장하지 않고 이용자의 브라우저에만 보관하는 원칙(로컬 저장)을 통해 외부 유출 위험을 최소화합니다.</li>
                  <li>해킹 등 외부 침입에 대비하여 시스템적인 보안성을 확보하기 위해 가능한 기술적 장치를 갖추려 노력하고 있습니다.</li>
                </ul>
              </div>
              <div>
                <p className="text-gray-300 font-medium mb-1">[관리적 대책]</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>개인정보를 취급하는 담당자를 업무상 필요한 최소한의 인원으로 제한하고 있습니다.</li>
                  <li>담당자에 대한 정기적인 교육을 통해 본 방침의 준수를 강조하고 있으며, 이행 여부를 수시로 점검하여 문제가 발견될 경우 즉시 시정 조치합니다.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">10</span>
              이용자 및 법정대리인의 권리
            </h2>
            <div className="text-gray-400 pl-7 space-y-2">
              <p>이용자(만 14세 미만인 경우 법정대리인)는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>개인정보 열람·정정·삭제 요구권</li>
                <li>개인정보 처리 정지 요구권 및 동의 철회권</li>
                <li>브라우저 저장 데이터 직접 삭제: 브라우저 → 개발자도구 → Application → Local Storage 삭제</li>
              </ul>
              <p className="mt-2">권리 행사 요청을 받은 경우 회사는 지체 없이 필요한 조치를 취합니다. 개인정보 관련 문의는 아래 연락처로 접수하시기 바랍니다.</p>
              <p className="mt-2">정보주체는 개인정보 침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 개인정보침해신고센터 등에 분쟁해결이나 상담을 신청할 수 있습니다. 그 밖의 개인정보 침해 신고·상담은 아래 기관에 문의하시기 바랍니다.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
                <li>개인정보침해신고센터: 국번없이 118 (privacy.kisa.or.kr)</li>
                <li>대검찰청: 국번없이 1301 (www.spo.go.kr)</li>
                <li>경찰청 사이버범죄 신고시스템: 국번없이 182 (ecrm.police.go.kr)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">11</span>
              개인정보 보호책임자 및 문의
            </h2>
            <div className="text-gray-400 pl-7">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm space-y-1">
                <p><span className="text-gray-500">서비스명:</span> <span className="text-gray-300">Summer Palace</span></p>
                <p><span className="text-gray-500">이메일:</span> <span className="text-gray-300">smple@outlook.kr</span></p>
                <p><span className="text-gray-500">사이트:</span> <span className="text-gray-300">summerpalace.ai.kr</span></p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">12</span>
              고지의 의무
            </h2>
            <div className="text-gray-400 pl-7 space-y-1">
              <p>현 개인정보처리방침 내용 추가, 삭제 및 수정이 있을 경우에는 개정 최소 7일 전부터 서비스 내 공지사항을 통하여 고지할 것입니다. 다만, 이용자 권리의 중대한 변경이 있을 경우에는 최소 30일 전에 고지합니다.</p>
              <p>- 공고일자: 2026년 6월 23일</p>
              <p>- 시행일자: 2026년 6월 23일</p>
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
