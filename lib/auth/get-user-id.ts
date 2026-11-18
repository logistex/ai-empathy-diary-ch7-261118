// 2026-11-18 11:22 KST
import "server-only";
import { auth } from "@/auth";

// 로그인한 사용자의 ID(구글 계정 고유 ID)를 돌려줌. 로그인하지 않았거나 ID가 비어 있으면 null.
// dr_entries.user_id에 쓰는 값이며, 화면에서 받은 사용자 ID는 믿지 않고 항상 이 함수로 얻음.
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}
