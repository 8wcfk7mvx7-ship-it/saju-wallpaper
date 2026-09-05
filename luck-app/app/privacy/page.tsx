export const metadata = { title: "개인정보처리방침 — 행운의 어플" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-12" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <div className="max-w-lg mx-auto space-y-5 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        <h1 className="text-xl font-black" style={{ color: "var(--ink)" }}>개인정보처리방침</h1>
        <p>행운의 어플(이하 &quot;앱&quot;)은 이용자의 개인정보를 소중히 다룹니다.</p>

        <section>
          <h2 className="font-bold mb-1" style={{ color: "var(--ink)" }}>1. 수집하는 정보와 저장 위치</h2>
          <p>
            앱은 생년월일시·성별·별명(사주 정보), 오늘의 메모, 하루 행운 점수 기록을 이용자가 직접 입력합니다.
            현재 버전에서는 이 정보를 <b>이용자의 기기 안(localStorage)</b>에만 저장하며, 별도 서버로 전송하거나
            회사가 수집·보관하지 않습니다. 앱을 삭제하거나 기기 저장공간을 초기화하면 함께 삭제됩니다.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-1" style={{ color: "var(--ink)" }}>2. 향후 계정 연동 기능 추가 시</h2>
          <p>
            여러 기기 간 동기화를 위한 로그인 기능이 추가되는 경우, 위 정보는 암호화된 서버(Supabase)에 저장되며
            본 방침을 사전에 갱신하고 이용자 동의를 받습니다.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-1" style={{ color: "var(--ink)" }}>3. 제3자 제공</h2>
          <p>앱은 수집한 정보를 제3자에게 제공하지 않습니다.</p>
        </section>

        <section>
          <h2 className="font-bold mb-1" style={{ color: "var(--ink)" }}>4. 문의</h2>
          <p>개인정보 관련 문의는 앱스토어 등록 개발자 연락처로 문의해주세요.</p>
        </section>

        <p className="text-xs" style={{ color: "var(--ink-soft)" }}>최종 업데이트: 2026년 9월</p>
      </div>
    </main>
  );
}
