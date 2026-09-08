"use client";
// lib/cloudSync.ts — 로그인 시 로컬(localStorage) ↔ Supabase 데이터 동기화
// 정책: 이 계정으로 처음 로그인(클라우드에 프로필 없음) → 지금 이 기기의 로컬 데이터를 클라우드로 올림.
//      이미 클라우드에 데이터가 있는 계정으로 로그인(다른 기기에서 만든 계정 등) → 클라우드 데이터를
//      이 기기로 내려받아 덮어씀. 실시간 양방향 동기화가 아니라, 로그인 시점에 한 번 맞추는
//      "백업/복원" 개념의 v1 동기화다.
import { getSupabase } from "@/lib/supabase";
import {
  getProfile, saveProfile, getAllMemos, setMemo, getAllLogs, setLog, getAllCalls, setCall,
  type SajuProfile,
} from "@/lib/storage";

async function pushLocalToCloud(userId: string) {
  const supabase = getSupabase();
  const profile = getProfile();
  if (profile) {
    await supabase.from("profiles").upsert({
      id: userId,
      nickname: profile.name || null,
      birth_year: profile.birthYear,
      birth_month: profile.birthMonth,
      birth_day: profile.birthDay,
      birth_hour: profile.birthHour,
      calendar_type: profile.calendarType,
      is_leap_month: profile.isLeapMonth,
      gender: profile.gender,
    });
  }

  const memos = getAllMemos();
  if (memos.length) {
    await supabase.from("daily_memos").upsert(
      memos.map((m) => ({ user_id: userId, memo_date: m.date, content: m.content })),
    );
  }

  const logs = getAllLogs();
  if (logs.length) {
    await supabase.from("daily_luck_logs").upsert(
      logs.map((l) => ({ user_id: userId, log_date: l.date, rating: l.entry.rating, tags: l.entry.tags, note: l.entry.note })),
    );
  }

  const calls = getAllCalls();
  if (calls.length) {
    await supabase.from("daily_luck_calls").upsert(
      calls.map((c) => ({ user_id: userId, call_date: c.date, text: c.text })),
    );
  }
}

async function pullCloudToLocal(userId: string) {
  const supabase = getSupabase();

  const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (profileRow) {
    const profile: SajuProfile = {
      name: profileRow.nickname ?? "",
      birthYear: profileRow.birth_year,
      birthMonth: profileRow.birth_month,
      birthDay: profileRow.birth_day,
      birthHour: profileRow.birth_hour,
      calendarType: profileRow.calendar_type,
      isLeapMonth: profileRow.is_leap_month,
      gender: profileRow.gender,
    };
    saveProfile(profile);
  }

  const { data: memoRows } = await supabase.from("daily_memos").select("memo_date, content").eq("user_id", userId);
  memoRows?.forEach((r) => setMemo(r.memo_date, r.content));

  const { data: logRows } = await supabase.from("daily_luck_logs").select("log_date, rating, tags, note").eq("user_id", userId);
  logRows?.forEach((r) => setLog(r.log_date, { rating: r.rating, tags: r.tags ?? [], note: r.note ?? "" }));

  const { data: callRows } = await supabase.from("daily_luck_calls").select("call_date, text").eq("user_id", userId);
  callRows?.forEach((r) => setCall(r.call_date, r.text));
}

// 로그인 직후 한 번 호출. 반환값은 어느 방향으로 동기화했는지 — UI에서 안내 문구를 다르게 보여줄 때 사용.
export async function syncOnLogin(userId: string): Promise<"pulled" | "pushed" | "error"> {
  try {
    const supabase = getSupabase();
    const { data: existing } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (existing) {
      await pullCloudToLocal(userId);
      return "pulled";
    }
    await pushLocalToCloud(userId);
    return "pushed";
  } catch {
    return "error";
  }
}
