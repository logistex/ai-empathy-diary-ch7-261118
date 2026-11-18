// 2026-11-18 11:55 KST
"use client";

import { useState } from "react";
import type { Entry } from "@/lib/types/entry";
import { saveEntry } from "./diary-api";

const MAX_LENGTH = 500;

export default function WriteForm({ onSaved }: { onSaved: (entry: Entry) => void }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 서버와 같은 기준: 앞뒤 공백을 지우고 유니코드 코드 포인트 수로 셈(CONTRACT.md 2.2절)
  const length = [...content.trim()].length;
  const remaining = MAX_LENGTH - length;
  const tooLong = remaining < 0;
  const canSave = length > 0 && !tooLong && !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      onSaved(await saveEntry(content));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.",
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="diary-content" className="block font-medium">
        오늘 하루는 어땠나요?
      </label>
      <textarea
        id="diary-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        readOnly={saving}
        aria-describedby="diary-count"
        aria-invalid={tooLong}
        placeholder="오늘 있었던 일이나 마음을 편하게 적어 보세요."
        className="mt-2 w-full resize-y rounded-2xl border border-line bg-card p-4 placeholder:text-muted"
      />
      <p
        id="diary-count"
        className={`mt-1 text-right text-sm ${tooLong ? "font-semibold text-accent" : "text-muted"}`}
      >
        {tooLong
          ? `${-remaining}자 넘었어요. 500자까지 쓸 수 있어요.`
          : `${remaining}자 남았어요`}
      </p>
      {saving && (
        <p role="status" className="mt-2 text-muted">
          일기를 저장하고 마음을 읽는 중이에요. 최대 30초쯤 걸릴 수 있어요.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-accent">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!canSave}
        aria-busy={saving}
        className="mt-4 min-h-12 w-full rounded-full bg-accent px-6 font-semibold text-white hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
      >
        {saving ? "마음을 읽고 있어요…" : "저장하기"}
      </button>
    </form>
  );
}
