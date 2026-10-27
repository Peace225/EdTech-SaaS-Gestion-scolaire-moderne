
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ExerciseDifficulty,
  ExerciseStatus,
} from "@prisma/client";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ExerciseFormState = {
  error: string | null;
};

function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function createExerciseAction(
  _previousState: ExerciseFormState,
  formData: FormData
): Promise<ExerciseFormState> {
  // ========================================
  // 1. AUTHENTIFICATION
  // ========================================

  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Votre session a expiré. Reconnectez-vous.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
    return {
      error: "Vous n'êtes pas autorisé à créer cet exercice.",
    };
  }

  // ========================================
  // 2. VALIDATION DES DONNÉES
  // ========================================

  const title = readField(formData, "title");
  const description = readField(
    formData,
    "description"
  );
  const assignmentId = readField(
    formData,
    "assignmentId"
  );
  const difficultyInput = readField(
    formData,
    "difficulty"
  );
  const intent = readField(formData, "intent");

  if (title.length < 5 || title.length > 160) {
    return {
      error:
        "Le titre doit comporter entre 5 et 160 caractères.",
    };
  }

  if (
    description.length < 20 ||
    description.length > 10000
  ) {
    return {
      error:
        "Les consignes doivent comporter entre 20 et 10 000 caractères.",
    };
  }

  if (!assignmentId) {
    return {
      error:
        "Sélectionnez une classe et une matière.",
    };
  }

  if (
    !Object.values(ExerciseDifficulty).includes(
      difficultyInput as ExerciseDifficulty
    )
  ) {
    return {
      error: "Niveau de difficulté invalide.",
    };
  }

  if (
    intent !== "draft" &&
    intent !== "publish"
  ) {
    return {
      error: "Action de publication invalide.",
    };
  }

  // ========================================
  // 3. VÉRIFICATION DE L'AFFECTATION
  // ========================================

  // L'administrateur peut sélectionner une
  // affectation existante dans l'établissement.
  // L'enseignant ne peut utiliser que les siennes.

  const assignment =
    await prisma.teachingAssignment.findFirst({
      where: {
        id: assignmentId,
        ...(user.role === "TEACHER"
          ? { teacherId: user.id }
          : {}),
      },
      select: {
        id: true,
      },
    });

  if (!assignment) {
    return {
      error:
        "Cette classe ou matière ne fait pas partie de vos affectations autorisées.",
    };
  }

  const publish = intent === "publish";

  // ========================================
  // 4. ENREGISTREMENT POSTGRESQL
  // ========================================

  try {
    await prisma.exercise.create({
      data: {
        title,
        description,
        difficulty:
          difficultyInput as ExerciseDifficulty,
        status: publish
          ? ExerciseStatus.PUBLISHED
          : ExerciseStatus.DRAFT,
        assignmentId: assignment.id,
        createdById: user.id,
        publishedAt: publish ? new Date() : null,
      },
    });
  } catch (error) {
    console.error(
      "Erreur de création d'exercice :",
      error
    );

    return {
      error:
        "L'exercice n'a pas pu être enregistré. Veuillez réessayer.",
    };
  }

  // ========================================
  // 5. ACTUALISATION ET REDIRECTION
  // ========================================

  revalidatePath("/teacher/exercises");

  redirect(
    publish
      ? "/teacher/exercises?created=published"
      : "/teacher/exercises?created=draft"
  );
}
