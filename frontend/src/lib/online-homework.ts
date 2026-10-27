
// src/lib/online-homework.ts

import "server-only";

import { prisma } from "@/lib/prisma";

// ==========================================
// CLÔTURE ET CORRECTION D'UNE COMPOSITION
// ==========================================

/**
 * Finalise une tentative de composition.
 *
 * Garanties :
 * - Clôture idempotente.
 * - Transaction PostgreSQL.
 * - Correction côté serveur.
 * - Prise en compte des points par question.
 * - Conservation des résultats.
 * - Aucune publication automatique
 *   dans les notes officielles.
 */

export async function finalizeOnlineAttempt(
  attemptId: string,
  studentId: string
): Promise<boolean> {
  if (!attemptId || !studentId) {
    return false;
  }

  return prisma.$transaction(async (tx) => {
    // ======================================
    // 1. VERROUILLER LA TENTATIVE
    // ======================================

    const claim =
      await tx.onlineHomeworkAttempt.updateMany({
        where: {
          id: attemptId,
          studentId,
          submittedAt: null,
        },
        data: {
          submittedAt: new Date(),
        },
      });

    // Si déjà soumise, ne pas recalculer.

    if (claim.count !== 1) {
      return false;
    }

    // ======================================
    // 2. RÉCUPÉRER LA COMPOSITION
    // ======================================

    const attempt =
      await tx.onlineHomeworkAttempt.findUniqueOrThrow({
        where: {
          id: attemptId,
        },
        select: {
          homeworkId: true,
        },
      });

    // ======================================
    // 3. QUESTIONS ET RÉPONSES
    // ======================================

    const [questions, answers] =
      await Promise.all([
        tx.onlineHomeworkQuestion.findMany({
          where: {
            homeworkId: attempt.homeworkId,
          },
          select: {
            id: true,
            correctOption: true,
            points: true,
          },
        }),

        tx.onlineHomeworkAnswer.findMany({
          where: {
            attemptId,
          },
          select: {
            questionId: true,
            choice: true,
          },
        }),
      ]);

    // Associer chaque question à la réponse
    // enregistrée par l'apprenant.

    const answerMap = new Map(
      answers.map((answer) => [
        answer.questionId,
        answer.choice,
      ])
    );

    // ======================================
    // 4. CALCUL DES RÉSULTATS
    // ======================================

    let correctAnswers = 0;
    let earnedPoints = 0;
    let totalPoints = 0;

    for (const question of questions) {
      const points = Math.max(
        1,
        question.points
      );

      totalPoints += points;

      if (
        answerMap.get(question.id) ===
        question.correctOption
      ) {
        correctAnswers += 1;
        earnedPoints += points;
      }
    }

    // ======================================
    // 5. SCORE EN POURCENTAGE
    // ======================================

    const scorePercent =
      totalPoints > 0
        ? Math.round(
            (100 * earnedPoints) / totalPoints
          )
        : 0;

    // ======================================
    // 6. ENREGISTRER LA CORRECTION
    // ======================================

    await tx.onlineHomeworkAttempt.update({
      where: {
        id: attemptId,
      },
      data: {
        scorePercent,
        correctAnswers,
        totalQuestions: questions.length,
      },
    });

    // Il ne faut pas créer ici de Grade
    // officiel déjà approuvé.

    return true;
  });
}
