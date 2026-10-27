
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ReviewState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function reviewGrade(
  _previousState: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  // Vérification des droits en base
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      status: "error",
      message: "Votre session a expiré.",
    };
  }

  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (admin?.role !== "ADMIN") {
    return {
      status: "error",
      message: "Action réservée à l'administration.",
    };
  }

  const gradeId = formData.get("gradeId");
  const decision = formData.get("decision");
  const rawComment = formData.get("reviewComment");

  if (
    typeof gradeId !== "string" ||
    !gradeId.trim() ||
    (decision !== "APPROVED" &&
      decision !== "REJECTED")
  ) {
    return {
      status: "error",
      message: "Demande de validation invalide.",
    };
  }

  const comment =
    typeof rawComment === "string"
      ? rawComment.trim()
      : "";

  if (comment.length > 1000) {
    return {
      status: "error",
      message: "Le commentaire est trop long.",
    };
  }

  if (decision === "REJECTED" && !comment) {
    return {
      status: "error",
      message: "Précisez le motif du rejet.",
    };
  }

  try {
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
      select: {
        id: true,
        status: true,
        score: true,
        coef: true,
        subject: true,
        submittedById: true,
        student: {
          select: { classId: true },
        },
      },
    });

    if (!grade || grade.status !== "PENDING") {
      return {
        status: "error",
        message: "Cette note n'est plus en attente.",
      };
    }

    // Vérifications complémentaires avant approbation
    if (decision === "APPROVED") {
      const score = Number(grade.score);

      if (
        !Number.isFinite(score) ||
        score < 0 ||
        score > 20 ||
        !Number.isInteger(grade.coef) ||
        grade.coef < 1 ||
        grade.coef > 10
      ) {
        return {
          status: "error",
          message: "La note ou son coefficient est invalide.",
        };
      }

      if (
        !grade.submittedById ||
        !grade.student.classId
      ) {
        return {
          status: "error",
          message:
            "L'auteur ou la classe doit être renseigné avant approbation.",
        };
      }

      // Confirmer l'affectation actuelle de l'enseignant
      const assignment =
        await prisma.teachingAssignment.findFirst({
          where: {
            teacherId: grade.submittedById,
            classId: grade.student.classId,
            subject: grade.subject,
            teacher: {
              role: "TEACHER",
            },
          },
          select: { id: true },
        });

      if (!assignment) {
        return {
          status: "error",
          message:
            "L'affectation de l'enseignant à cette matière et cette classe n'a pas été confirmée.",
        };
      }
    }

    // Transition atomique : uniquement PENDING
    const result = await prisma.grade.updateMany({
      where: {
        id: gradeId,
        status: "PENDING",
      },
      data: {
        status: decision,
        reviewedById: userId,
        reviewedAt: new Date(),
        reviewComment: comment || null,
      },
    });

    if (result.count !== 1) {
      return {
        status: "error",
        message: "Cette note a déjà été traitée.",
      };
    }

    revalidatePath("/admin/grades");
    revalidatePath("/teacher/dashboard");
    revalidatePath("/student/dashboard");
    revalidatePath("/parent/dashboard");

    return {
      status: "success",
      message:
        decision === "APPROVED"
          ? "Note approuvée et publiée."
          : "Note rejetée et renvoyée pour correction.",
    };
  } catch (error) {
    console.error("Erreur validation note :", error);

    return {
      status: "error",
      message: "Impossible de traiter cette note.",
    };
  }
}
