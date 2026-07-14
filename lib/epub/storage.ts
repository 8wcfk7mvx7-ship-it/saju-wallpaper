import { get, set } from "idb-keyval";
import type { Book } from "./types";

const STORAGE_KEY = "epub-creator-draft";

export async function loadDraft(): Promise<Book | null> {
  try {
    const saved = await get<Book>(STORAGE_KEY);
    return saved ?? null;
  } catch {
    return null;
  }
}

export async function saveDraft(book: Book): Promise<void> {
  try {
    await set(STORAGE_KEY, book);
  } catch {
    // 저장 공간이 부족하거나(사진 다량 첨부 등) 브라우저가 IndexedDB를 막은 경우.
    // 편집 자체는 계속 가능해야 하므로 조용히 무시한다.
  }
}
