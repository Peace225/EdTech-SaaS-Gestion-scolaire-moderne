
import type { ReactNode } from "react";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import TeacherShell from "./TeacherShell";
import "./teacher-scroll.css";

export const dynamic = "force-dynamic";

// ========================================
// TYPES
// ========================================

interface TeacherLayoutProps {
  children: ReactNode;
}

type TeacherRole = "TEACHER" | "ADMIN";

interface TeacherUser {
  name: string;
  email: string;
  role: TeacherRole;
}

// ========================================
// SERVER ACTION — DÉCONNEXION
// ========================================

async function logoutAction(): Promise<void> {
  "use server";

  await signOut({
    redirectTo: "/login",
  });
}

// ========================================
// LAYOUT ENSEIGNANT
// ========================================

export default async function TeacherLayout({
  children,
}: TeacherLayoutProps) {
  // ========================================
  // 1. AUTHENTIFICATION
  // ========================================

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // ========================================
  // 2. VÉRIFICATION DU COMPTE
  // ========================================

  // Nous récupérons le rôle réel en base.
  // Le rôle présent dans la session ne suffit
  // pas pour autoriser l'accès.

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // ========================================
  // 3. VÉRIFICATION DES AUTORISATIONS
  // ========================================

  // IMPORTANT :
  // On limite explicitement les rôles
  // autorisés au portail enseignant.

  const authorizedRole: TeacherRole | null =
    user.role === "TEACHER"
      ? "TEACHER"
      : user.role === "ADMIN"
        ? "ADMIN"
        : null;

  if (!authorizedRole) {
    redirect("/dashboard");
  }

  const isTeacher = authorizedRole === "TEACHER";

  // ========================================
  // 4. NOTIFICATIONS DES NOTES REJETÉES
  // ========================================

  // Un enseignant voit uniquement les notes
  // qu'il a lui-même soumises et qui ont été
  // rejetées par l'administration.
  //
  // Pour un administrateur, le compteur reste
  // à zéro dans cet espace.

  const rejectedGradesCount = isTeacher
    ? await prisma.grade.count({
        where: {
          submittedById: user.id,
          status: "REJECTED",
        },
      })
    : 0;

  // ========================================
  // 5. INFORMATIONS DU PORTAIL
  // ========================================

  // Le rôle est maintenant strictement typé :
  // "TEACHER" | "ADMIN".
  //
  // Cela corrige l'erreur TS2322 lors du
  // passage de user à TeacherShell.

  const teacherUser: TeacherUser = {
    name:
      user.name?.trim() ||
      (isTeacher ? "Enseignant" : "Administrateur"),

    email: user.email?.trim() ?? "",

    role: authorizedRole,
  };

  // ========================================
  // 6. RENDU DU PORTAIL
  // ========================================

  return (
    <TeacherShell
      user={teacherUser}
      rejectedGradesCount={rejectedGradesCount}
      logoutAction={logoutAction}
    >
      {children}
    </TeacherShell>
  );
}
