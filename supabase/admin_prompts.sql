-- ─────────────────────────────────────────────
-- admin_prompts 테이블 생성
-- Supabase SQL Editor에서 실행하세요
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_prompts (
  key         text        PRIMARY KEY,
  value       text        NOT NULL,
  updated_at  timestamptz DEFAULT now()
);

-- Row Level Security: 서버(service key)만 접근 가능, 클라이언트 직접 접근 차단
ALTER TABLE admin_prompts ENABLE ROW LEVEL SECURITY;

-- 외부(anon/authenticated) 에서는 일절 접근 불가
-- service_role key로만 접근 (서버 API에서만 사용)
CREATE POLICY "deny_all_public" ON admin_prompts
  FOR ALL
  TO public
  USING (false);

-- 확인용 조회
-- SELECT * FROM admin_prompts;
