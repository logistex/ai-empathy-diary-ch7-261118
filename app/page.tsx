// 2026-11-18 11:22 KST
import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="p-8">
      {session?.user ? (
        <>
          <p>{session.user.name}님, 안녕하세요.</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit">로그아웃</button>
          </form>
        </>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button type="submit">구글로 로그인</button>
        </form>
      )}
    </main>
  );
}
