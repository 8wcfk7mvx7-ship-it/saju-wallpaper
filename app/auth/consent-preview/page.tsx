import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "네이버 로그인 정보제공 동의 - Summer Palace",
  robots: { index: false },
};

export default function ConsentPreviewPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f5",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'Malgun Gothic', '맑은 고딕', sans-serif",
    }}>
      {/* 네이버 로그인 동의창 */}
      <div style={{
        width: "100%",
        maxWidth: 440,
        background: "#fff",
        borderRadius: 4,
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        overflow: "hidden",
      }}>
        {/* 네이버 헤더 */}
        <div style={{
          background: "#03C75A",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#fff"/>
          </svg>
          <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>NAVER</span>
        </div>

        {/* 서비스명 + 안내 */}
        <div style={{ padding: "24px 24px 0" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 8,
              background: "#06060e",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="#1a1a2e"/>
                <path d="M16 6 L18 13 L25 13 L19.5 17.5 L21.5 24.5 L16 20 L10.5 24.5 L12.5 17.5 L7 13 L14 13 Z" fill="#c9a84c"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#191919" }}>여름궁전 (Summer Palace)</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>summerpalace.ai.kr</p>
            </div>
          </div>

          <div style={{
            background: "#f7f8fa",
            border: "1px solid #e5e8ed",
            borderRadius: 6,
            padding: "14px 16px",
            marginBottom: 20,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
              <strong style={{ color: "#191919" }}>여름궁전 (Summer Palace)</strong>에서<br/>
              네이버 회원 정보 제공을 요청합니다.<br/>
              동의하신 항목은 서비스 이용을 위해 활용됩니다.
            </p>
          </div>

          {/* 필수 동의 항목 */}
          <div style={{ marginBottom: 8 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#191919" }}>필수 제공 항목</span>
              <span style={{
                fontSize: 11, color: "#fff", background: "#03C75A",
                padding: "2px 8px", borderRadius: 10, fontWeight: 600,
              }}>필수</span>
            </div>

            {[
              {
                label: "이름",
                desc: "서비스 내 사용자 이름 표시 및 사주 분석 결과 개인화에 사용됩니다.",
              },
              {
                label: "프로필 사진",
                desc: "마이페이지(보관함) 상단 프로필 영역에 표시됩니다.",
              },
              {
                label: "이메일 주소",
                desc: "결제 영수증 발송 및 서비스 중요 알림 전달에 사용됩니다.",
              },
            ].map((item) => (
              <div key={item.label} style={{
                border: "1px solid #e5e8ed",
                borderRadius: 6,
                padding: "12px 14px",
                marginBottom: 8,
                background: "#fafafa",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#191919" }}>{item.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#777", lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* 선택 동의 항목 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#191919" }}>선택 제공 항목</span>
              <span style={{
                fontSize: 11, color: "#666", background: "#f0f0f0",
                padding: "2px 8px", borderRadius: 10, fontWeight: 600,
              }}>선택</span>
            </div>

            {[
              {
                label: "생년월일",
                desc: "사주팔자 분석의 핵심 정보로, 입력된 생년월일로 사주팔자(년주·월주·일주·시주)를 산출합니다. 본 서비스의 핵심 기능인 AI 사주 분석·대운 계산·궁합 서비스에 활용됩니다. 외부 공개 또는 제3자 제공 없이 분석 목적으로만 사용됩니다.",
              },
              {
                label: "휴대전화번호",
                desc: "서비스 이용 중 본인 인증 및 중요 알림 수신에 사용됩니다. 마케팅 목적으로는 활용하지 않습니다.",
              },
            ].map((item) => (
              <div key={item.label} style={{
                border: "1px solid #e5e8ed",
                borderRadius: 6,
                padding: "12px 14px",
                marginBottom: 8,
                background: "#fafafa",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#191919" }}>{item.label}</span>
                  </div>
                  {/* 선택 체크박스 */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 3,
                    border: "2px solid #03C75A",
                    background: "#03C75A",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 3.5L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#777", lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* 안내 문구 */}
          <div style={{
            background: "#fff9e6",
            border: "1px solid #ffe082",
            borderRadius: 6,
            padding: "10px 14px",
            marginBottom: 20,
          }}>
            <p style={{ margin: 0, fontSize: 11, color: "#7a6200", lineHeight: 1.6 }}>
              · 선택 항목에 동의하지 않아도 서비스 이용은 가능합니다.<br/>
              · 수집된 개인정보는 서비스 제공 목적 이외에 사용되지 않습니다.<br/>
              · 회원 탈퇴 시 모든 개인정보는 즉시 삭제됩니다.
            </p>
          </div>
        </div>

        {/* 동의 버튼 */}
        <div style={{ padding: "0 24px 24px", display: "flex", gap: 8 }}>
          <button style={{
            flex: 1, padding: "13px 0",
            background: "#fff", border: "1px solid #d0d0d0",
            borderRadius: 4, fontSize: 14, fontWeight: 600,
            color: "#555", cursor: "pointer",
          }}>
            취소
          </button>
          <button style={{
            flex: 2, padding: "13px 0",
            background: "#03C75A", border: "none",
            borderRadius: 4, fontSize: 14, fontWeight: 700,
            color: "#fff", cursor: "pointer",
          }}>
            동의하기
          </button>
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 11, color: "#aaa", textAlign: "center" }}>
        본 화면은 네이버 정보제공 동의창 UI 미리보기입니다.
      </p>
    </div>
  );
}
