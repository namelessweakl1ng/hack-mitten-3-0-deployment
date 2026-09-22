import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// `trustHost` is a runtime option in NextAuth v4.24+ that lets NextAuth trust
// the X-Forwarded-Host header (required when running behind Vercel's edge /
// any TLS-terminating proxy). It's missing from the v4 type definitions, so
// we add it via an intersection.
type AuthOptionsWithTrustHost = NextAuthOptions & { trustHost?: boolean };

export const authOptions: AuthOptionsWithTrustHost = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7 days
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;
        const id = credentials.identifier.trim();
        // Try matching by email (lowercased) OR exact username (case-sensitive)
        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: id.toLowerCase() },
              { username: id },
            ],
          },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.username,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  // Required at runtime — NextAuth throws in production if NEXTAUTH_SECRET is
  // missing. No dev fallback is provided here.
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};

// Type augmentation so role is visible on session.user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: import("@prisma/client").Role;
    };
  }
  interface User {
    role: import("@prisma/client").Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: import("@prisma/client").Role;
  }
}
