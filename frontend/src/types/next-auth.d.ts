
import type { DefaultSession } from "next-auth";

export type AppRole =
  | "ADMIN"
  | "TEACHER"
  | "PARENT"
  | "STUDENT";

// Extension des types Auth.js
declare module "next-auth" {
  interface User {
    role?: AppRole;
  }

  interface Session {
    user: {
      id?: string;
      role?: AppRole;
    } & DefaultSession["user"];
  }
}

// Extension du JWT
declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
  }
}
