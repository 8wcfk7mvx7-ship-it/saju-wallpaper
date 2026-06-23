-- ─────────────────────────────────────────────
-- chat_questions 테이블 생성
-- 월령도사 챗봇에 들어온 질문을 익명화·정규화해 집계만 저장한다.
-- 원문 그대로는 저장하지 않고, 숫자(생년월일 등)와 특수문자를 제거한 정규화 문구별 카운트만 쌓는다.
-- Supabase SQL Editor에서 실행하세요
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_questions (
  question_norm  text        PRIMARY KEY,
  count          integer     NOT NULL DEFAULT 1,
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE chat_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_public" ON chat_questions
  FOR ALL
  TO public
  USING (false);

CREATE OR REPLACE FUNCTION increment_chat_question(q text)
RETURNS void AS $$
BEGIN
  INSERT INTO chat_questions (question_norm, count, updated_at)
  VALUES (q, 1, now())
  ON CONFLICT (question_norm) DO UPDATE
    SET count = chat_questions.count + 1, updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 확인용 조회
-- SELECT * FROM chat_questions ORDER BY count DESC LIMIT 20;
