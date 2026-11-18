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
    // token.sub에는 Auth.js가 로그인마다 새로 만드는 무작위 ID가 들어가므로 쓰지 않음
    // (@auth/core lib/actions/callback/oauth/callback.js의 getUserAndAccount).
    // 구글 계정 고유 ID(sub)는 로그인할 때만 받는 account.providerAccountId에 있으므로 토큰에 따로 담음.
    jwt({ token, account }) {
      if (account?.provider === "google" && account.providerAccountId) {
        token.googleId = account.providerAccountId;
      }
      return token;
    },
    // 구글 계정 ID가 없는 옛 세션은 사용자 ID를 비워 두어 다시 로그인하게 함
    session({ session, token }) {
      session.user.id = typeof token.googleId === "string" ? token.googleId : "";
      return session;
    },
  },
});
