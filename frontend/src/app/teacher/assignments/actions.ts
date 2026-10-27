
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import type { Prisma } from "@prisma/client";

import { revalidatePath } from "next/cache";

// ========================================
// AUTHENTIFICATION ET AUTORISATIONS
// ========================================

async function getAuthorizedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error(
      "Session expirée. Veuillez vous reconnecter."
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (
    !user ||
    (user.role !== "TEACHER" &&
      user.role !== "ADMIN")
  ) {
    throw new Error(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  }

  return user;
}

// ========================================
// VALIDATION DE L'IDENTIFIANT
// ========================================

function getHomeworkId(formData: FormData): string {
  const value = formData.get("id");

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      "Identifiant du devoir invalide."
    );
  }

  return value.trim();
}

// ========================================
// FILTRE DE SÉCURITÉ
// ========================================

function getAuthorizedScope(
  user: Awaited<
    ReturnType<typeof getAuthorizedUser>
  >
): Prisma.HomeworkWhereInput {
  // ADMIN : accès à tous les devoirs.
  if (user.role === "ADMIN") {
    return {};
  }

  // TEACHER : uniquement les devoirs
  // liés à ses affectations pédagogiques.
  return {
    assignment: {
      is: {
        teacherId: user.id,
      },
    },
  };
}

// ========================================
// 1. PUBLIER UN DEVOIR
// ========================================

export async function publishHomeworkAction(
  formData: FormData
): Promise<void> {
  const user = await getAuthorizedUser();
  const id = getHomeworkId(formData);

  const now = new Date();

  // Les compositions ONLINE restent
  // en brouillon jusqu'à l'intégration
  // du moteur de questions interactives.

  const result = await prisma.homework.updateMany({
    where: {
      id,

      ...getAuthorizedScope(user),

      status: "DRAFT",
      type: "UPLOAD",

      dueDate: {
        gt: now,
      },
    },

    data: {
      status: "PUBLISHED",
      publishedAt: now,
    },
  });

  if (result.count !== 1) {
    throw new Error(
      "Publication impossible. Vérifiez vos droits, " +
      "le statut du devoir et sa date limite."
    );
  }

  revalidatePath("/teacher/assignments");
}

// ========================================
// 2. ARCHIVER UN DEVOIR
// ========================================

export async function archiveHomeworkAction(
  formData: FormData
): Promise<void> {
  const user = await getAuthorizedUser();
  const id = getHomeworkId(formData);

  const result = await prisma.homework.updateMany({
    where: {
      id,

      ...getAuthorizedScope(user),

      status: {
        in: ["DRAFT", "PUBLISHED"],
      },
    },

    data: {
      status: "ARCHIVED",
    },
  });

  if (result.count !== 1) {
    throw new Error(
      "Archivage impossible. Ce devoir est " +
      "introuvable, déjà archivé ou non autorisé."
    );
  }

  // Le devoir reste enregistré dans PostgreSQL.
  revalidatePath("/teacher/assignments");
}

// ========================================
// 3. RESTAURER UN DEVOIR
// ========================================

export async function restoreHomeworkAction(
  formData: FormData
): Promise<void> {
  const user = await getAuthorizedUser();
  const id = getHomeworkId(formData);

  const result = await prisma.homework.updateMany({
    where: {
      id,

      ...getAuthorizedScope(user),

      status: "ARCHIVED",
    },

    data: {
      status: "DRAFT",
      publishedAt: null,
    },
  });

  if (result.count !== 1) {
    throw new Error(
      "Restauration impossible. Ce devoir est " +
      "introuvable, non archivé ou non autorisé."
    );
  }

  // Après restauration, le devoir
  // redevient un brouillon.
  revalidatePath("/teacher/assignments");
}
