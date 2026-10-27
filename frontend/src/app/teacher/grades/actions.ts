
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ========================================
// TYPES
// ========================================

type GradeFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

// ========================================
// AUTHENTIFICATION ET AUTORISATIONS
// ========================================

async function requireAuthorizedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
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
    (user.role !== "TEACHER" && user.role !== "ADMIN")
  ) {
    throw new Error(
      "Accès réservé aux enseignants et administrateurs."
    );
  }

  return user;
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function stringField(
  formData: FormData,
  name: string
): string {
  const value = formData.get(name);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function refreshGradePages() {
  revalidatePath("/teacher/grades");
  revalidatePath("/admin/grades");
  revalidatePath("/teacher/dashboard");
}

// ========================================
// SERVER ACTION — ENREGISTRER UNE NOTE
// ========================================

export async function submitGradeAction(
  _previousState: GradeFormState,
  formData: FormData
): Promise<GradeFormState> {
  const user = await requireAuthorizedUser();

  // 1. Récupérer les données du formulaire
  const assignmentId = stringField(
    formData,
    "assignmentId"
  );

  const studentId = stringField(
    formData,
    "studentId"
  );

  const term = stringField(formData, "term");

  const scoreText = stringField(
    formData,
    "score"
  ).replace(",", ".");

  const coefText =
    stringField(formData, "coef") || "1";

  const error = (
    message: string
  ): GradeFormState => ({
    status: "error",
    message,
  });

  // 2. Vérification des champs obligatoires
  if (!assignmentId || !studentId) {
    return error(
      "Sélectionnez une affectation et un élève."
    );
  }

  // 3. Vérification de la période scolaire
  if (!["T1", "T2", "T3"].includes(term)) {
    return error(
      "La période sélectionnée est invalide."
    );
  }

  // 4. Validation de la note sur 20
  const score = Number(scoreText);

  if (
    !/^\d+(?:\.\d+)?$/.test(scoreText) ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 20 ||
    !Number.isInteger(score * 4)
  ) {
    return error(
      "La note doit être comprise entre 0 et 20, par pas de 0,25."
    );
  }

  // 5. Validation du coefficient
  const coef = Number(coefText);

  if (
    !/^\d+$/.test(coefText) ||
    !Number.isInteger(coef) ||
    coef < 1 ||
    coef > 10
  ) {
    return error(
      "Le coefficient doit être un entier entre 1 et 10."
    );
  }

  // ========================================
  // 6. CONTRÔLE DE L'AFFECTATION
  // ========================================

  // L'enseignant doit être affecté à
  // la classe et à la matière concernées.

  const assignment =
    await prisma.teachingAssignment.findFirst({
      where: {
        id: assignmentId,

        ...(user.role === "TEACHER"
          ? { teacherId: user.id }
          : {}),
      },

      select: {
        classId: true,
        subject: true,
      },
    });

  if (!assignment) {
    return error(
      "Cette affectation n'est pas autorisée."
    );
  }

  // ========================================
  // 7. VÉRIFICATION DE L'ÉLÈVE
  // ========================================

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      classId: assignment.classId,
    },

    select: {
      id: true,
    },
  });

  if (!student) {
    return error(
      "Cet élève n'appartient pas à la classe sélectionnée."
    );
  }

  // ========================================
  // 8. ENREGISTREMENT DANS POSTGRESQL
  // ========================================

  await prisma.grade.create({
    data: {
      studentId: student.id,
      subject: assignment.subject,
      score,
      coef,
      term,

      // Validation administrative obligatoire
      status: "PENDING",

      // Enseignant ou administrateur auteur
      submittedById: user.id,

      evaluationDate: new Date(),
    },
  });

  // ========================================
  // 9. ACTUALISATION DES PAGES
  // ========================================

  refreshGradePages();

  return {
    status: "success",
    message:
      "Note enregistrée et transmise à l'administration pour validation.",
  };
}

// ========================================
// SERVER ACTION — SUPPRIMER UNE NOTE
// ========================================

export async function deleteGradeAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuthorizedUser();

  const id = stringField(formData, "id");

  if (!id) {
    throw new Error(
      "Identifiant de note manquant."
    );
  }

  // ========================================
  // 1. RECHERCHER LA NOTE
  // ========================================

  // Seules les notes en attente peuvent
  // être supprimées.

  const grade = await prisma.grade.findFirst({
    where: {
      id,
      status: "PENDING",

      ...(user.role === "TEACHER"
        ? { submittedById: user.id }
        : {}),
    },

    select: {
      subject: true,

      student: {
        select: {
          classId: true,
        },
      },
    },
  });

  if (!grade) {
    throw new Error(
      "Note introuvable, déjà examinée ou non autorisée."
    );
  }

  // ========================================
  // 2. VÉRIFIER L'AFFECTATION
  // ========================================

  if (user.role === "TEACHER") {
    const assignment =
      await prisma.teachingAssignment.findFirst({
        where: {
          teacherId: user.id,
          classId: grade.student.classId,
          subject: grade.subject,
        },

        select: {
          id: true,
        },
      });

    if (!assignment) {
      throw new Error(
        "Vous n'êtes plus affecté à cette matière."
      );
    }
  }

  // ========================================
  // 3. SUPPRESSION SÉCURISÉE
  // ========================================

  // update/delete par condition afin
  // de refuser une note déjà examinée
  // ou modifiée entre-temps.

  const deleted = await prisma.grade.deleteMany({
    where: {
      id,
      status: "PENDING",

      ...(user.role === "TEACHER"
        ? { submittedById: user.id }
        : {}),
    },
  });

  if (deleted.count !== 1) {
    throw new Error(
      "Cette note a été modifiée entre-temps."
    );
  }

  // ========================================
  // 4. ACTUALISATION DES DONNÉES
  // ========================================

  refreshGradePages();
}
