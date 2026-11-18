// 2026-11-18 11:55 KST
"use client";

import { useEffect, useRef, useState } from "react";
import type { Entry } from "@/lib/types/entry";
import EntryCard from "./EntryCard";
import HistoryList from "./HistoryList";
import WriteForm from "./WriteForm";

type View = "write" | "result" | "history";

const TITLES: Record<View, string> = {
  write: "일기 쓰기",
  result: "오늘의 공감",
  history: "지난 기록",
};

export default function DiaryApp() {
  const [view, setView] = useState<View>("write");
  const [current, setCurrent] = useState<Entry | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // 화면이 바뀌면 제목으로 초점을 옮겨 스크린리더와 키보드 사용자가 위치를 알 수 있게 함
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [view]);

  const tabClass = (active: boolean) =>
    `min-h-11 rounded-full px-5 font-medium ${
      active ? "bg-accent text-white" : "text-accent hover:bg-soft"
    }`;

  return (
    <>
      <nav aria-label="일기장 메뉴" className="flex gap-2">
        <button
          type="button"
          aria-current={view !== "history" ? "page" : undefined}
          onClick={() => setView("write")}
          className={tabClass(view !== "history")}
        >
          일기 쓰기
        </button>
        <button
          type="button"
          aria-current={view === "history" ? "page" : undefined}
          onClick={() => setView("history")}
          className={tabClass(view === "history")}
        >
          지난 기록
        </button>
      </nav>

      <section className="mt-6">
        <h2 ref={headingRef} tabIndex={-1} className="mb-4 text-xl font-bold">
          {TITLES[view]}
        </h2>
        {view === "write" && (
          <WriteForm
            onSaved={(entry) => {
              setCurrent(entry);
              setView("result");
            }}
          />
        )}
        {view === "result" && current && (
          <>
            <EntryCard entry={current} onChange={setCurrent} />
            <button
              type="button"
              onClick={() => setView("write")}
              className="mt-4 min-h-11 rounded-full border border-accent px-5 font-medium text-accent hover:bg-soft"
            >
              새 일기 쓰기
            </button>
          </>
        )}
        {view === "history" && <HistoryList />}
      </section>
    </>
  );
}
