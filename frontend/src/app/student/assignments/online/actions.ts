
"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { finalizeOnlineAttempt } from "@/lib/online-homework";

const LIST_PATH = "/student/assignments";

const examPath = (id: string) =>
  `/student/assignments/online/${encodeURIComponent(id)}`;

type ActionResponse =
  | { ok: true }
  | { ok: false; message: string };

// ==========================================
// AUTHENTIFICATION
// ==========================================

async function requireStudent() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const account = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
      studentProfile: {
        select: {
          id: true,
          classId: true,
        },
      },
    },
  });

  if (
    account?.role !== "STUDENT" ||
    !account.studentProfile
  ) {
    redirect(LIST_PATH);
  }

  return account.studentProfile;
}

// ==========================================
// DÉMARRER UNE COMPOSITION
// ==========================================

export async function startOnlineHomeworkAction(
  formData: FormData
): Promise<void> {
  const student = await requireStudent();

  const homeworkId = formData.get("homeworkId");

  if (
    typeof homeworkId !== "string" ||
    !homeworkId ||
    homeworkId.length > 150
  ) {
    redirect(LIST_PATH);
  }

  // Vérifier que la composition est publiée
  // et appartient à la classe de l'apprenant.

  const homework = await prisma.homework.findFirst({
    where: {
      id: homeworkId,
      type: "ONLINE",
      status: "PUBLISHED",
      assignment: {
        is: {
          classId: student.classId,
        },
      },
    },
    select: {
      id: true,
      dueDate: true,
      durationMinutes: true,
      _count: {
        select: {
          onlineQuestions: true,
        },
      },
    },
  });

  if (!homework) {
    redirect(LIST_PATH);
  }

  // Une tentative existante ne doit pas
  // être réinitialisée après un rechargement.

  const existing =
    await prisma.onlineHomeworkAttempt.findUnique({
      where: {
        homeworkId_studentId: {
          homeworkId,
          studentId: student.id,
        },
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    redirect(examPath(homeworkId));
  }

  const now = new Date();

  // Vérifications des prérequis.

  if (
    !homework.durationMinutes ||
    homework.durationMinutes < 1 ||
    homework.durationMinutes > 240 ||
    homework._count.onlineQuestions < 1 ||
    (homework.dueDate !== null &&
      homework.dueDate <= now)
  ) {
    redirect(
      `${examPath(homeworkId)}?notice=unavailable`
    );
  }

  // Calcul de l'échéance réelle côté serveur.

  const durationEnd =
    now.getTime() +
    homework.durationMinutes * 60_000;

  const expiresAt = new Date(
    Math.min(
      durationEnd,
      homework.dueDate?.getTime() ?? durationEnd
    )
  );

  try {
    await prisma.onlineHomeworkAttempt.create({
      data: {
        studentId: student.id,
        homeworkId: homework.id,
        startedAt: now,
        expiresAt,
      },
    });
  } catch (error) {
    if (
      !(
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
    ) {
      throw error;
    }

    // Double clic ou requêtes concurrentes :
    // la contrainte UNIQUE conserve
    // la première tentative.
  }

  revalidatePath(LIST_PATH);

  redirect(examPath(homeworkId));
}

// ==========================================
// SAUVEGARDER UNE RÉPONSE
// ==========================================

export async function saveOnlineAnswerAction(
  attemptId: string,
  questionId: string,
  choice: string
): Promise<ActionResponse> {
  const student = await requireStudent();

  if (
    !attemptId ||
    attemptId.length > 150 ||
    !questionId ||
    questionId.length > 150 ||
    !["A", "B", "C", "D"].includes(choice)
  ) {
    return {
      ok: false,
      message: "Réponse invalide.",
    };
  }

  // Vérification de la tentative
  // et des autorisations.

  const attempt =
    await prisma.onlineHomeworkAttempt.findFirst({
      where: {
        id: attemptId,
        studentId: student.id,
        homework: {
          is: {
            type: "ONLINE",
            status: "PUBLISHED",
            assignment: {
              is: {
                classId: student.classId,
              },
            },
          },
        },
      },
      select: {
        homeworkId: true,
        submittedAt: true,
        expiresAt: true,
      },
    });

  if (!attempt) {
    return {
      ok: false,
      message: "Session non autorisée.",
    };
  }

  if (
    attempt.submittedAt ||
    attempt.expiresAt <= new Date()
  ) {
    return {
      ok: false,
      message: "Cette composition est terminée.",
    };
  }

  // Vérifier l'appartenance de la question
  // à la composition concernée.

  const question =
    await prisma.onlineHomeworkQuestion.findFirst({
      where: {
        id: questionId,
        homeworkId: attempt.homeworkId,
      },
      select: {
        id: true,
      },
    });

  if (!question) {
    return {
      ok: false,
      message: "Question introuvable.",
    };
  }

  // Sauvegarde atomique de la réponse.

  try {
    const saved = await prisma.$transaction(
      async (tx) => {
        // Cette mise à jour verrouille la tentative
        // jusqu'au commit et protège la
        // sauvegarde contre une clôture concurrente.

        const lock =
          await tx.onlineHomeworkAttempt.updateMany({
            where: {
              id: attemptId,
              studentId: student.id,
              submittedAt: null,
              expiresAt: {
                gt: new Date(),
              },
            },
            data: {
              lastActivityAt: new Date(),
            },
          });

        if (lock.count !== 1) {
          return false;
        }

        await tx.onlineHomeworkAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId,
              questionId,
            },
          },
          create: {
            attemptId,
            questionId,
            choice,
          },
          update: {
            choice,
          },
        });

        return true;
      }
    );

    return saved
      ? { ok: true }
      : {
          ok: false,
          message:
            "Temps écoulé ou copie déjà soumise.",
        };
  } catch {
    return {
      ok: false,
      message:
        "Sauvegarde impossible. Vérifiez votre connexion.",
    };
  }
}

// ==========================================
// SOUMETTRE DÉFINITIVEMENT
// ==========================================

export async function submitOnlineHomeworkAction(
  attemptId: string
): Promise<ActionResponse> {
  const student = await requireStudent();

  if (!attemptId || attemptId.length > 150) {
    return {
      ok: false,
      message: "Session invalide.",
    };
  }

  const attempt =
    await prisma.onlineHomeworkAttempt.findFirst({
      where: {
        id: attemptId,
        studentId: student.id,
        homework: {
          is: {
            type: "ONLINE",
            assignment: {
              is: {
                classId: student.classId,
              },
            },
          },
        },
      },
      select: {
        id: true,
        homeworkId: true,
        submittedAt: true,
      },
    });

  if (!attempt) {
    return {
      ok: false,
      message: "Accès interdit.",
    };
  }

  if (!attempt.submittedAt) {
    try {
      await finalizeOnlineAttempt(
        attempt.id,
        student.id
      );
    } catch {
      return {
        ok: false,
        message:
          "Soumission non confirmée. Réessayez.",
      };
    }
  }

  // Actualiser les pages concernées.

  revalidatePath(LIST_PATH);

  revalidatePath(
    examPath(attempt.homeworkId)
  );

  return {
    ok: true,
  };
}
