
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function gradeSubmissionAction(
  formData: FormData
): Promise<void> {
  // 1. Authentification
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 2. Vérification du rôle réel en base
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
      "Vous n'êtes pas autorisé à corriger cette copie."
    );
  }

  // 3. Récupération du formulaire
  const rawId = formData.get("submissionId");
  const rawScore = formData.get("score");
  const rawFeedback = formData.get("feedback");

  const submissionId =
    typeof rawId === "string" ? rawId.trim() : "";

  const scoreText =
    typeof rawScore === "string"
      ? rawScore.trim().replace(",", ".")
      : "";

  const feedback =
    typeof rawFeedback === "string"
      ? rawFeedback.trim()
      : "";

  const score = Number(scoreText);

  // 4. Validation des données
  if (!submissionId) {
    throw new Error("Identifiant de copie manquant.");
  }

  if (
    !/^\d+(?:\.\d+)?$/.test(scoreText) ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 20
  ) {
    throw new Error(
      "La note doit être comprise entre 0 et 20."
    );
  }

  if (Math.round(score * 4) !== score * 4) {
    throw new Error("Utilisez un pas de 0,25 point.");
  }

  if (feedback.length > 2000) {
    throw new Error(
      "L'appréciation ne doit pas dépasser 2 000 caractères."
    );
  }

  // 5. Limiter la correction aux copies autorisées
  const where =
    user.role === "ADMIN"
      ? {
          id: submissionId,
          status: "PENDING" as const,
        }
      : {
          id: submissionId,
          status: "PENDING" as const,
          homework: {
            is: {
              assignment: {
                is: {
                  teacherId: user.id,
                },
              },
            },
          },
        };

  // 6. Enregistrement de la note
  const result =
    await prisma.homeworkSubmission.updateMany({
      where,
      data: {
        status: "GRADED",
        score,
        feedback: feedback || null,
        gradedAt: new Date(),
        gradedById: user.id,
      },
    });

  if (result.count !== 1) {
    throw new Error(
      "Copie introuvable, déjà notée ou hors de vos affectations."
    );
  }

  // 7. Actualisation de la page
  revalidatePath("/teacher/submissions");
}
