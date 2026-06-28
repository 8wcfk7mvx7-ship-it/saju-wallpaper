// 한글 받침 유무에 따라 조사(은/는, 을/를, 이/가, 와/과, 으로/로)를 동적으로 고르는 유틸.
// 사용자 이름·도시명·일간·오행 등 실행 중에 바뀌는 한글 단어에 조사를 붙일 때 사용한다.

function hasBatchim(word: string): boolean {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절이 아니면 받침 없는 것으로 취급
  return (code - 0xac00) % 28 !== 0;
}

export function eunNeun(word: string): "은" | "는" {
  return hasBatchim(word) ? "은" : "는";
}

export function eulReul(word: string): "을" | "를" {
  return hasBatchim(word) ? "을" : "를";
}

export function igaGa(word: string): "이" | "가" {
  return hasBatchim(word) ? "이" : "가";
}

export function waGwa(word: string): "와" | "과" {
  return hasBatchim(word) ? "과" : "와";
}

export function euroRo(word: string): "으로" | "로" {
  return hasBatchim(word) ? "으로" : "로";
}
