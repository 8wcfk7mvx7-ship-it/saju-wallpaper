"use client";
// lib/feedback.ts — 소리·진동 피드백
// 효과음은 별도 음원 파일 없이 Web Audio API로 그 자리에서 짧은 종소리를 합성한다
// (라이선스 걱정도 없고, 앱 용량도 늘지 않음). 진동은 @capacitor/haptics를 쓰고,
// 웹 프리뷰에서는 플러그인이 조용히 아무 동작도 하지 않는다.
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const ENABLED_KEY = "luck_feedback_enabled";

export function getFeedbackEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(ENABLED_KEY);
  return raw === null ? true : raw === "1"; // 기본값 켜짐
}

export function setFeedbackEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
}

let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

// 짧은 2음 종소리(도-미 느낌) — 오실레이터 2개 + 감쇠 엔벨로프로 합성
function playChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  [523.25, 659.25].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.09;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.9);
  });
}

export function playLuckChime(): void {
  if (!getFeedbackEnabled()) return;
  try { playChime(); } catch { /* 오디오를 지원하지 않는 환경 — 조용히 무시 */ }
}

export async function hapticLight(): Promise<void> {
  if (!getFeedbackEnabled()) return;
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* 웹 프리뷰 등 미지원 환경 */ }
}

export async function hapticSuccess(): Promise<void> {
  if (!getFeedbackEnabled()) return;
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* 웹 프리뷰 등 미지원 환경 */ }
}
