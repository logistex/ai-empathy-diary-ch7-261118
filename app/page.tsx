// 2026-11-18 11:22 KST
import { auth, signIn, signOut } from "@/auth";
import DiaryApp from "@/components/DiaryApp";

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold">마음 일기</h1>
      {session?.user ? (
        <>
          <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted">{session.user.name}님, 안녕하세요.</p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="min-h-11 rounded-full px-4 text-accent underline underline-offset-2 hover:bg-soft"
              >
                로그아웃
              </button>
            </form>
          </div>
          <DiaryApp />
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-line bg-card p-6 text-center shadow-sm">
          <p>하루를 적으면 따뜻한 공감을 건네 드려요.</p>
          <form
            className="mt-5"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="min-h-12 rounded-full bg-accent px-6 font-semibold text-white hover:bg-accent-hover"
            >
              구글로 로그인
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
