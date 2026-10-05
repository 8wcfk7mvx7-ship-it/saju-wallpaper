"use client";
// lib/fontSize.ts — 글자 크기(작게/중간/크게) 설정.
// Tailwind의 text-xs~2xl은 전부 rem 단위라 <html>의 font-size만 바꾸면 앱 전체 글자가
// 비율대로 같이 커지고 작아진다 — 컴포넌트마다 글자 크기를 따로 건드릴 필요가 없다.
const KEY = "luck_font_size";
export type FontSize = "small" | "medium" | "large";

export function getFontSize(): FontSize {
  if (typeof window === "undefined") return "medium";
  const raw = localStorage.getItem(KEY);
  return raw === "small" || raw === "large" ? raw : "medium";
}

export function applyFontSize(size: FontSize): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.fontSize = size;
}

export function setFontSize(size: FontSize): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, size);
  applyFontSize(size);
}
