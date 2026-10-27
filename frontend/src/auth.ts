
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

import type { AppRole } from "@/types/next-auth";

// Validation des rôles
function isAppRole(role: unknown): role is AppRole {
  return (
    role === "ADMIN" ||
    role === "TEACHER" ||
    role === "PARENT" ||
    role === "STUDENT"
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "Identifiants EdTech",

      credentials: {
        email: {
          label: "Adresse e-mail",
          type: "email",
        },
        password: {
          label: "Mot de passe",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
          },
        });

        if (!user?.password || !isAppRole(user.role)) {
          return null;
        }

        const validPassword = await compare(
          password,
          user.password
        );

        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;

        if (isAppRole(user.role)) {
          token.role = user.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }

      session.user.role = isAppRole(token.role)
        ? token.role
        : undefined;

      return session;
    },
  },
});
