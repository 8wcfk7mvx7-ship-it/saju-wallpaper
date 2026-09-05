export const metadata = { title: "이용약관 — 행운의 어플" };

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-12" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <div className="max-w-lg mx-auto space-y-5 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        <h1 className="text-xl font-black" style={{ color: "var(--ink)" }}>이용약관</h1>

        <section>
          <h2 className="font-bold mb-1" style={{ color: "var(--ink)" }}>1. 서비스의 목적</h2>
          <p>
            행운의 어플은 24절기 세시풍속과 사주 명리학 이론(용신)을 바탕으로 한 오락·라이프스타일 콘텐츠를
            제공합니다. 제공되는 개운법·행운 정보는 전통 문화 콘텐츠이자 참고용 정보이며, 의학적·법률적·재정적
            조언을 대체하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-1" style={{ color: "var(--ink)" }}>2. 이용자 콘텐츠</h2>
          <p>
            이용자가 작성한 메모·기록은 기기 안에만 저장되며, 이용자 본인의 책임하에 관리합니다. 앱 삭제·기기
            분실 시 복구되지 않을 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="font-bold mb-1" style={{ color: "var(--ink)" }}>3. 면책</h2>
          <p>
            개운법·행운 콘텐츠의 활용 결과에 대해 개발자는 책임을 지지 않습니다.
          </p>
        </section>

        <p className="text-xs" style={{ color: "var(--ink-soft)" }}>최종 업데이트: 2026년 9월</p>
      </div>
    </main>
  );
}
