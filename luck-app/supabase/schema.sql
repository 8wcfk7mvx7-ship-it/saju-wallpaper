-- ─────────────────────────────────────────────────────────────────
-- 행운의 어플 — 데이터베이스 설계 (Supabase / Postgres)
--
-- v1 앱은 로그인 없이 기기 안 localStorage(lib/storage.ts)만으로 동작합니다.
-- 이 스키마는 "여러 기기 동기화 + 로그인"을 붙이는 v2를 위한 설계도이며,
-- Supabase 프로젝트를 새로 만든 뒤 SQL Editor에서 그대로 실행하면 바로 쓸 수 있습니다.
-- (Supabase 프로젝트 생성 자체는 계정 소유자만 할 수 있는 부분입니다 — docs/APP_STORE_SUBMISSION.md 참고)
-- ─────────────────────────────────────────────────────────────────

-- ── 1. profiles — 사용자당 1건, 사주 원본 입력값 + 계산 결과 캐시 ──────────────
-- 사주 계산(analyzeSaju)은 결정적(deterministic)이라 매번 다시 계산해도 되지만,
-- 앱 로딩 속도를 위해 결과를 캐시해두고 birth_* 값이 바뀔 때만 재계산합니다.
CREATE TABLE IF NOT EXISTS profiles (
  id                uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname          text,
  birth_year        smallint    NOT NULL,
  birth_month       smallint    NOT NULL CHECK (birth_month BETWEEN 1 AND 12),
  birth_day         smallint    NOT NULL CHECK (birth_day BETWEEN 1 AND 31),
  birth_hour        smallint    CHECK (birth_hour BETWEEN 0 AND 23),  -- NULL = 시간 모름
  calendar_type     text        NOT NULL DEFAULT 'solar' CHECK (calendar_type IN ('solar', 'lunar')),
  is_leap_month     boolean     NOT NULL DEFAULT false,
  gender            text        NOT NULL CHECK (gender IN ('male', 'female')),
  -- 계산 결과 캐시 (lib/saju.ts analyzeSaju 결과 중 자주 쓰는 값만 비정규화 저장)
  yongshin          text        CHECK (yongshin IN ('목','화','토','금','수')),
  heeshin           text        CHECK (heeshin IN ('목','화','토','금','수')),
  gishin            text        CHECK (gishin  IN ('목','화','토','금','수')),
  day_master        text,        -- 일간 (예: '갑','을'...)
  strength          text        CHECK (strength IN ('신강','신약','중화')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "upsert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- 회원가입 시 자동으로 빈 profiles 행을 만들지는 않음 — 온보딩에서 생년월일을 입력해야
-- 비로소 유효한 사주 프로필이 생기는 구조라, 회원가입 트리거 대신 온보딩 완료 시 클라이언트가 upsert.

-- ── 2. daily_memos — 하루 한 줄 메모 (날짜별 1건) ──────────────────────────
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
CREATE POLICY "own_memos" ON daily_memos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 3. daily_luck_logs — 하루 행운 점수 기록 ────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_luck_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    date        NOT NULL,
  rating      smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags        text[]      NOT NULL DEFAULT '{}',
  note        text        NOT NULL DEFAULT '',
  solar_term  text,                          -- 기록 당시 절기명 (예: "곡우") — 절기별 통계용
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, log_date)
);

ALTER TABLE daily_luck_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_luck_logs" ON daily_luck_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 4. solar_terms — 24절기 콘텐츠 (참조 테이블) ────────────────────────────
-- 지금은 lib/solarTerms.ts에 정적 데이터로 들어있음. 운영 중 앱 재배포 없이
-- 콘텐츠(개운법 문구 등)를 수정하고 싶어지면 이 테이블로 옮기고 앱에서 조회하면 됩니다.
CREATE TABLE IF NOT EXISTS solar_terms (
  term_key      text PRIMARY KEY,      -- lunar-typescript 원본 키 (예: "立春")
  name          text NOT NULL,         -- 한글 이름 (예: "입춘")
  hanja         text NOT NULL,
  season        text NOT NULL CHECK (season IN ('봄','여름','가을','겨울')),
  element       text NOT NULL CHECK (element IN ('목','화','토','금','수')),
  meaning       text NOT NULL,
  ganwoon_tips  text[] NOT NULL,
  aegmagi_tip   text NOT NULL,
  lucky_color   text NOT NULL,
  lucky_item    text NOT NULL,
  sort_order    smallint NOT NULL
);
-- 읽기는 누구나(로그인 불필요), 쓰기는 관리자만 — 관리자 쓰기는 service role 키로 서버에서만 수행
ALTER TABLE solar_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_solar_terms" ON solar_terms FOR SELECT TO anon, authenticated USING (true);

-- ── 5. push_tokens — 매일 알림(선택) 발송용 디바이스 토큰 ───────────────────
-- "하루에 하나씩 알려주고" 요구사항을 푸시 알림으로 확장할 때 사용.
-- APNs/FCM 발급은 계정 소유자가 해야 하는 부분이라 v1에는 미포함, 스키마만 준비.
CREATE TABLE IF NOT EXISTS push_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform    text        NOT NULL CHECK (platform IN ('ios', 'android')),
  token       text        NOT NULL,
  notify_hour smallint    NOT NULL DEFAULT 9 CHECK (notify_hour BETWEEN 0 AND 23), -- 알림 받고 싶은 시(KST)
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_push_tokens" ON push_tokens FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── updated_at 자동 갱신 트리거 ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_daily_memos_updated_at ON daily_memos;
CREATE TRIGGER trg_daily_memos_updated_at BEFORE UPDATE ON daily_memos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_daily_luck_logs_updated_at ON daily_luck_logs;
CREATE TRIGGER trg_daily_luck_logs_updated_at BEFORE UPDATE ON daily_luck_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 인덱스 ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_daily_memos_user_date ON daily_memos (user_id, memo_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_luck_logs_user_date ON daily_luck_logs (user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens (user_id);
