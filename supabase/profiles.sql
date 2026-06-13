-- ─────────────────────────────────────────────
-- profiles 테이블 — 회원별 별조각 잔액 + 본인인증 상태
-- Supabase SQL Editor에서 실행하세요
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text,
  balance         bigint      NOT NULL DEFAULT 0,
  phone_verified  boolean     NOT NULL DEFAULT false,
  phone_hash      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 본인 정보만 조회 가능 (잔액 등). 클라이언트에서 직접 잔액 수정은 막아둠 — 잔액 변경은 service role(API)에서만.
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 회원가입 시 자동으로 profiles 행 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
