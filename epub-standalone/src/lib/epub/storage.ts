import { del, get, set } from "idb-keyval";
import type { Book } from "./types";

const STORAGE_KEY = "epub-creator-draft";

/** 현재 작업 중인 초안(아직 "저장"을 누르지 않았어도 항상 자동 저장됨). */
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

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: number;
}

const PROJECTS_INDEX_KEY = "epub-creator-projects-index";
const projectKey = (id: string) => `epub-creator-project-${id}`;

/** "파일 > 저장/다른 이름으로 저장"으로 이름을 붙여 보관한 프로젝트 목록(최신순). */
export async function listProjects(): Promise<ProjectMeta[]> {
  try {
    const index = (await get<ProjectMeta[]>(PROJECTS_INDEX_KEY)) ?? [];
    return [...index].sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function saveProject(id: string, name: string, book: Book): Promise<void> {
  await set(projectKey(id), book);
  const index = (await get<ProjectMeta[]>(PROJECTS_INDEX_KEY)) ?? [];
  const next = [...index.filter(p => p.id !== id), { id, name, updatedAt: Date.now() }];
  await set(PROJECTS_INDEX_KEY, next);
}

export async function loadProject(id: string): Promise<Book | null> {
  const saved = await get<Book>(projectKey(id));
  return saved ?? null;
}

export async function deleteProject(id: string): Promise<void> {
  await del(projectKey(id));
  const index = (await get<ProjectMeta[]>(PROJECTS_INDEX_KEY)) ?? [];
  await set(PROJECTS_INDEX_KEY, index.filter(p => p.id !== id));
}
