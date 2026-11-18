// 2026-11-18 11:55 KST
// 2단계 가짜 데이터. 3단계에서 아래 함수 3개의 안쪽만 실제 API 호출로 바꿈.
//  - saveEntry     -> POST /api/entries                     (CONTRACT.md 2.2절)
//  - fetchEntries  -> GET  /api/entries                     (CONTRACT.md 2.3절)
//  - reanalyzeEntry-> POST /api/entries/{id}/reanalyze      (CONTRACT.md 2.4절)
// 실패하면 사용자에게 보여 줄 한국어 문장을 담은 Error를 던짐(CONTRACT.md 2.1절 error.message).
import type { Entry } from "@/lib/types/entry";

const DELAY_MS = 900;
const wait = () => new Promise((r) => setTimeout(r, DELAY_MS));

let store: Entry[] = [
  {
    id: "6f1c3a52-0c1e-4b0e-9d52-3f6f6a1d2c11",
    content: "오늘은 발표가 잘 끝나서 마음이 가벼웠다.",
    emotion: "기쁨",
    empathyMessage:
      "발표를 잘 마치셨군요. 그동안 준비한 시간이 보람으로 돌아온 것 같아요. 오늘은 충분히 뿌듯해하셔도 좋아요.",
    isCrisis: false,
    modelUsed: "nvidia/nemotron-3-ultra-550b-a55b:free",
    analysisStatus: "completed",
    createdAt: "2026-11-17T02:30:00.000Z",
  },
  {
    id: "0b7d2a9e-5f43-4c8e-8a61-2d9e7c4b1a22",
    content: "요즘 아무것도 하기 싫고, 다 끝내고 싶다는 생각이 든다.",
    emotion: "슬픔",
    empathyMessage:
      "많이 지치고 힘든 시간을 보내고 계시군요. 이렇게 마음을 적어 주셔서 고마워요. 지금의 마음을 그대로 말해도 괜찮아요.",
    isCrisis: true,
    modelUsed: "nvidia/nemotron-3-ultra-550b-a55b:free",
    analysisStatus: "completed",
    createdAt: "2026-11-16T13:10:00.000Z",
  },
  {
    id: "c3a8f1d4-91b2-4e67-a0d5-7b6e2f8c3d33",
    content: "점심에 오랜만에 친구를 만나 수다를 떨었다.",
    emotion: null,
    empathyMessage: null,
    isCrisis: false,
    modelUsed: null,
    analysisStatus: "pending",
    createdAt: "2026-11-15T05:20:00.000Z",
  },
];

export async function saveEntry(content: string): Promise<Entry> {
  await wait();
  const text = content.trim();
  const entry: Entry = {
    id: crypto.randomUUID(),
    content: text,
    emotion: "평온",
    empathyMessage:
      "오늘 하루를 차분히 돌아보셨군요. 이렇게 적어 두는 것만으로도 마음이 한결 정리될 거예요.",
    isCrisis: /죽고 싶|사라지고 싶/.test(text),
    modelUsed: "nvidia/nemotron-3-ultra-550b-a55b:free",
    analysisStatus: "completed",
    createdAt: new Date().toISOString(),
  };
  store = [entry, ...store];
  return entry;
}

export async function fetchEntries(): Promise<Entry[]> {
  await wait();
  return [...store].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function reanalyzeEntry(id: string): Promise<Entry> {
  await wait();
  const found = store.find((e) => e.id === id);
  if (!found) throw new Error("일기를 찾지 못했어요.");
  const updated: Entry = {
    ...found,
    emotion: "기쁨",
    empathyMessage:
      "친구와 나눈 수다가 마음을 포근하게 해 주었겠어요. 오랜만의 만남이라 더 반가웠을 것 같아요.",
    modelUsed: "nvidia/nemotron-3-ultra-550b-a55b:free",
    analysisStatus: "completed",
  };
  store = store.map((e) => (e.id === id ? updated : e));
  return updated;
}
