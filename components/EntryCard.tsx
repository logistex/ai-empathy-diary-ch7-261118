// 2026-11-18 11:55 KST
"use client";

import { useState } from "react";
import type { Entry } from "@/lib/types/entry";
import CrisisNotice from "./CrisisNotice";
import { reanalyzeEntry } from "./mock-diary-api";

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  dateStyle: "long",
  timeStyle: "short",
});

export default function EntryCard({
  entry,
  onChange,
}: {
  entry: Entry;
  onChange: (entry: Entry) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReanalyze() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await reanalyzeEntry(entry.id));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "다시 분석하지 못했어요. 잠시 뒤에 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      <time dateTime={entry.createdAt} className="text-sm text-muted">
        {dateFormat.format(new Date(entry.createdAt))}
      </time>
      <p className="mt-2 whitespace-pre-wrap break-words">{entry.content}</p>

      {entry.analysisStatus === "completed" ? (
        <div className="mt-4 rounded-xl bg-soft p-4">
          <p className="text-sm text-muted">
            오늘의 감정{" "}
            <span className="ml-1 rounded-full bg-card px-3 py-0.5 font-semibold text-foreground">
              {entry.emotion}
            </span>
          </p>
          <p className="mt-2">{entry.empathyMessage}</p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-soft p-4">
          <p>지금은 공감 메시지를 만들지 못했어요. 일기는 안전하게 저장됐어요.</p>
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={busy}
            aria-busy={busy}
            className="mt-3 min-h-11 rounded-full border border-accent px-5 font-medium text-accent hover:bg-card disabled:opacity-60"
          >
            {busy ? "분석하는 중이에요…" : "다시 분석"}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-accent">
              {error}
            </p>
          )}
        </div>
      )}

      {entry.isCrisis && <CrisisNotice />}
    </article>
  );
}
