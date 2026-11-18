// 2026-11-18 11:22 KST
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// 세션은 JWT 방식이며 데이터베이스 어댑터를 쓰지 않음.
// 환경 변수 AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET은 Auth.js가 자동으로 읽음.
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    // token.sub는 Auth.js가 구글 프로필의 sub(구글 계정 고유 ID)로 채움
    session({ session, token }) {
      session.user.id = token.sub as string;
      return session;
    },
  },
});
