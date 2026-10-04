"use client";
// lib/feedback.ts — 진동 피드백. @capacitor/haptics를 쓰고,
// 웹 프리뷰에서는 플러그인이 조용히 아무 동작도 하지 않는다.
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export async function hapticLight(): Promise<void> {
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* 웹 프리뷰 등 미지원 환경 */ }
}

export async function hapticSuccess(): Promise<void> {
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* 웹 프리뷰 등 미지원 환경 */ }
}
