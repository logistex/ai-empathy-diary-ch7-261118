// 2026-11-18 11:55 KST
"use client";

import { useCallback, useEffect, useState } from "react";
import type { Entry } from "@/lib/types/entry";
import EntryCard from "./EntryCard";
import { fetchEntries } from "./diary-api";

export default function HistoryList() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setEntries(await fetchEntries());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "지난 기록을 불러오지 못했어요.",
      );
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (error) {
    return (
      <div role="alert">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            load();
          }}
          className="mt-3 min-h-11 rounded-full border border-accent px-5 font-medium text-accent hover:bg-soft"
        >
          다시 불러오기
        </button>
      </div>
    );
  }
  if (entries === null) {
    return (
      <p role="status" className="text-muted">
        지난 기록을 불러오는 중이에요…
      </p>
    );
  }
  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">
        아직 쓴 일기가 없어요. 오늘의 이야기를 처음으로 적어 보세요.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {entries.map((entry) => (
        <li key={entry.id}>
          <EntryCard
            entry={entry}
            onChange={(next) =>
              setEntries((list) =>
                list ? list.map((e) => (e.id === next.id ? next : e)) : list,
              )
            }
          />
        </li>
      ))}
    </ul>
  );
}
