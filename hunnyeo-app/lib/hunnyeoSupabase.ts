// ── 로그인 · 기록 동기화용 Supabase 클라이언트 ───────────────────────────────
// 훈녀생정 전용 프로젝트. summerpalace 웹사이트와는 완전히 별개다.
// publishable(anon) 키는 앱 안에 들어가도 안전하도록 설계된 키다.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nroolpdtabmovzwjiihi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_S3KVPDfpUwfR87PX4AAZbw_TD3JlTLL";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
