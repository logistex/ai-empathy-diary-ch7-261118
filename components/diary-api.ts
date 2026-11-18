// 2026-11-18 11:55 KST
// 일기 API 호출(CONTRACT.md 2장). 실패하면 사용자에게 보여 줄 한국어 문장을 담은 Error를 던짐.
//  - saveEntry     -> POST /api/entries                (2.2절)
//  - fetchEntries  -> GET  /api/entries                (2.3절)
//  - reanalyzeEntry-> POST /api/entries/{id}/reanalyze (2.4절)
import type { Entry } from "@/lib/types/entry";

const MESSAGES: Record<number, string> = {
  400: "일기는 1자 이상 500자 이하로 써 주세요.",
  401: "로그인이 풀렸어요. 다시 로그인해 주세요.",
  404: "기록을 찾을 수 없어요.",
};
const SERVER_ERROR = "문제가 생겨 일기가 저장되지 않았어요. 잠시 뒤에 다시 시도해 주세요.";
const SERVER_ERROR_READ = "문제가 생겼어요. 잠시 뒤에 다시 시도해 주세요.";

async function request<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error(fallback);
  }
  if (!res.ok) throw new Error(MESSAGES[res.status] ?? fallback);
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error(fallback);
  }
}

export async function saveEntry(content: string): Promise<Entry> {
  const { entry } = await request<{ entry: Entry }>(
    "/api/entries",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
    SERVER_ERROR,
  );
  return entry;
}

export async function fetchEntries(): Promise<Entry[]> {
  const { entries } = await request<{ entries: Entry[] }>(
    "/api/entries",
    { method: "GET" },
    SERVER_ERROR_READ,
  );
  return entries;
}

export async function reanalyzeEntry(id: string): Promise<Entry> {
  const { entry } = await request<{ entry: Entry }>(
    `/api/entries/${encodeURIComponent(id)}/reanalyze`,
    { method: "POST" },
    SERVER_ERROR_READ,
  );
  return entry;
}
