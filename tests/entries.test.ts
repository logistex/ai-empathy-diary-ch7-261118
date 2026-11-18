// 2026-11-18 11:55 KST
// 실제 dr_diary.dr_entries를 쓰되, 각 시험을 트랜잭션 안에서 돌리고 끝에 롤백함(행이 남지 않음).
// 실행: npm test (node --env-file=.env 로 DATABASE_URL을 읽음)
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import {
  findEntry,
  insertEntry,
  listEntries,
  updateAnalysis,
  type Db,
} from "../lib/db/entries";
import { normalizeContent } from "../lib/types/content";
import type { AnalysisResult } from "../lib/types/entry";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL 환경 변수가 없음");
const sql = postgres(url, { prepare: false, max: 1, ssl: "require" });

const pending: AnalysisResult = {
  status: "pending",
  emotion: null,
  empathyMessage: null,
  isCrisis: false,
  modelUsed: null,
};
const completed: AnalysisResult = {
  status: "completed",
  emotion: "기쁨",
  empathyMessage: "시험용 메시지",
  isCrisis: false,
  modelUsed: "test-model",
};

class Rollback extends Error {}

// fn을 트랜잭션 안에서 돌리고 항상 롤백함. fn이 던진 오류(단언 실패 포함)는 그대로 전달함.
async function inRollback(fn: (db: Db) => Promise<void>) {
  let failure: unknown;
  try {
    await sql.begin(async (tx) => {
      try {
        await fn(tx);
      } catch (e) {
        failure = e;
      }
      throw new Rollback();
    });
  } catch (e) {
    if (!(e instanceof Rollback)) throw e;
  }
  if (failure) throw failure;
}

async function countRows(): Promise<number> {
  const [r] = await sql`select count(*)::int as n from dr_diary.dr_entries`;
  return r.n;
}

describe("dr_entries", () => {
  let before_n = 0;
  before(async () => {
    before_n = await countRows();
  });
  after(async () => {
    const after_n = await countRows();
    await sql.end();
    assert.equal(after_n, before_n, "시험 전후로 행 수가 같아야 함");
  });

  it("사용자 A의 일기가 사용자 B의 조회에 나오지 않음", () =>
    inRollback(async (db) => {
      const a = await insertEntry(db, "test-user-A", "A의 일기", pending);
      await insertEntry(db, "test-user-B", "B의 일기", pending);
      const listA = await listEntries(db, "test-user-A");
      const listB = await listEntries(db, "test-user-B");
      assert.deepEqual(listA.map((e) => e.content), ["A의 일기"]);
      assert.deepEqual(listB.map((e) => e.content), ["B의 일기"]);
      assert.ok(!listB.some((e) => e.id === a.id));
    }));

  it("B가 A의 일기 ID로 1건 조회하면 없음", () =>
    inRollback(async (db) => {
      const a = await insertEntry(db, "test-user-A", "A의 일기", pending);
      assert.equal(await findEntry(db, "test-user-B", a.id), null);
      assert.equal((await findEntry(db, "test-user-A", a.id))?.id, a.id);
    }));

  it("B는 A의 일기 분석 결과를 갱신할 수 없음", () =>
    inRollback(async (db) => {
      const a = await insertEntry(db, "test-user-A", "A의 일기", pending);
      assert.equal(await updateAnalysis(db, "test-user-B", a.id, completed), null);
      assert.equal((await findEntry(db, "test-user-A", a.id))?.analysisStatus, "pending");
      const ok = await updateAnalysis(db, "test-user-A", a.id, completed);
      assert.equal(ok?.analysisStatus, "completed");
      assert.equal(ok?.emotion, "기쁨");
      assert.equal(ok?.content, "A의 일기");
    }));

  it("최근 30건만 최신순으로 돌려줌", () =>
    inRollback(async (db) => {
      // 한 트랜잭션 안에서는 now()가 같으므로 created_at을 직접 달리 넣음
      for (let i = 0; i < 32; i++) {
        await db`insert into dr_diary.dr_entries (user_id, content, created_at)
                 values ('test-user-A', ${"일기 " + i}, now() + ${i} * interval '1 second')`;
      }
      const list = await listEntries(db, "test-user-A");
      assert.equal(list.length, 30);
      assert.equal(list[0].content, "일기 31");
      assert.equal(list[29].content, "일기 2");
    }));

  it("pending으로 저장하면 분석 필드가 null임", () =>
    inRollback(async (db) => {
      const e = await insertEntry(db, "test-user-A", "내용", pending);
      assert.equal(e.analysisStatus, "pending");
      assert.equal(e.emotion, null);
      assert.equal(e.empathyMessage, null);
      assert.equal(e.modelUsed, null);
      assert.match(e.createdAt, /^\d{4}-\d{2}-\d{2}T.*Z$/);
    }));

  it("공백뿐이거나 501자인 내용은 데이터베이스도 거부함", async () => {
    await assert.rejects(() =>
      inRollback((db) => insertEntry(db, "test-user-A", "   ", pending).then(() => {})),
      /dr_entries_content/,
    );
    await assert.rejects(() =>
      inRollback((db) =>
        insertEntry(db, "test-user-A", "가".repeat(501), pending).then(() => {}),
      ),
      /dr_entries_content_length/,
    );
  });
});

describe("normalizeContent", () => {
  it("빈 일기를 거부함", () => assert.equal(normalizeContent(""), null));
  it("공백뿐인 일기를 거부함", () =>
    assert.equal(normalizeContent(" \n\t　 "), null));
  it("문자열이 아니면 거부함", () => {
    assert.equal(normalizeContent(undefined), null);
    assert.equal(normalizeContent(123), null);
  });
  it("501자를 거부하고 500자는 받음", () => {
    assert.equal(normalizeContent("가".repeat(501)), null);
    assert.equal(normalizeContent("가".repeat(500)), "가".repeat(500));
  });
  it("앞뒤 공백을 지우고 이모지를 1자로 셈", () => {
    assert.equal(normalizeContent("  안녕  "), "안녕");
    assert.equal(normalizeContent("😀".repeat(500))?.length, 1000);
    assert.equal(normalizeContent("😀".repeat(501)), null);
  });
});
