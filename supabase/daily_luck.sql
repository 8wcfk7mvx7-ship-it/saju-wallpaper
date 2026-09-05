-- ─────────────────────────────────────────────
-- "오늘의 행운" 기능 — 일일 메모 + 하루 행운 기록
-- Supabase SQL Editor에서 실행하세요 (profiles.sql이 먼저 적용되어 있어야 합니다)
-- ─────────────────────────────────────────────

-- 하루 한 줄 메모 (날짜별 1건, 같은 날 다시 쓰면 덮어씀)
CREATE TABLE IF NOT EXISTS daily_memos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memo_date   date        NOT NULL,
  content     text        NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, memo_date)
);

ALTER TABLE daily_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_memo" ON daily_memos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 클라이언트 직접 쓰기는 막고, 저장/수정은 서비스 role(API)에서만 처리 (다른 테이블과 동일한 정책 패턴)
-- 필요 시 INSERT/UPDATE 정책을 추가하려면 authServer.ts를 거치지 않는 클라이언트 직접 저장 경로를 만들 때만 고려하세요.

-- 하루 행운 기록 — 오늘 하루가 얼마나 운이 좋았는지 스스로 남기는 간단한 로그
CREATE TABLE IF NOT EXISTS daily_luck_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    date        NOT NULL,
  rating      smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags        text[]      NOT NULL DEFAULT '{}',
  note        text        NOT NULL DEFAULT '',
  solar_term  text,                          -- 기록 당시 절기 (예: "곡우") — 나중에 절기별 통계에 활용
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, log_date)
);

ALTER TABLE daily_luck_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_luck_log" ON daily_luck_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_memos_updated_at ON daily_memos;
CREATE TRIGGER trg_daily_memos_updated_at
  BEFORE UPDATE ON daily_memos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_daily_luck_logs_updated_at ON daily_luck_logs;
CREATE TRIGGER trg_daily_luck_logs_updated_at
  BEFORE UPDATE ON daily_luck_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_daily_memos_user_date ON daily_memos (user_id, memo_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_luck_logs_user_date ON daily_luck_logs (user_id, log_date DESC);
