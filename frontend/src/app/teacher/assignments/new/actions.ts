
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type HomeworkFormState = {
  error: string | null;
};

function getText(
  formData: FormData,
  field: string
): string {
  const value = formData.get(field);

  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function createHomeworkAction(
  _previousState: HomeworkFormState,
  formData: FormData
): Promise<HomeworkFormState> {
  // 1. Authentification
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Session expirée. Veuillez vous reconnecter.",
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
      error: "Vous n'êtes pas autorisé à créer ce devoir.",
    };
  }

  // 2. Lecture des champs
  const title = getText(formData, "title");
  const instructions = getText(
    formData,
    "instructions"
  );
  const assignmentId = getText(
    formData,
    "assignmentId"
  );
  const type = getText(formData, "type");
  const intent = getText(formData, "intent");
  const durationRaw = getText(
    formData,
    "durationMinutes"
  );
  const dueDateRaw = getText(
    formData,
    "dueDateIso"
  );

  // 3. Validation
  if (title.length < 5 || title.length > 180) {
    return {
      error: "Le titre doit contenir entre 5 et 180 caractères.",
    };
  }

  if (
    instructions.length < 20 ||
    instructions.length > 15000
  ) {
    return {
      error:
        "Les consignes doivent contenir entre 20 et 15 000 caractères.",
    };
  }

  if (!assignmentId) {
    return {
      error: "Sélectionnez une classe et une matière.",
    };
  }

  if (type !== "UPLOAD" && type !== "ONLINE") {
    return {
      error: "Type de devoir invalide.",
    };
  }

  if (intent !== "draft" && intent !== "publish") {
    return {
      error: "Action d'enregistrement invalide.",
    };
  }

  // 4. Durée des compositions en ligne
  let durationMinutes: number | null = null;

  if (type === "ONLINE") {
    const duration = Number(durationRaw);

    if (![20, 25, 30].includes(duration)) {
      return {
        error:
          "La durée doit être de 20, 25 ou 30 minutes.",
      };
    }

    durationMinutes = duration;
  }

  // 5. Date limite UTC
  // Le navigateur transmet une date ISO construite
  // à partir du fuseau horaire de l'utilisateur.
  let dueDate: Date | null = null;

  if (dueDateRaw) {
    const isoPattern =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    if (
      !isoPattern.test(dueDateRaw) ||
      Number.isNaN(Date.parse(dueDateRaw))
    ) {
      return {
        error: "Date limite invalide.",
      };
    }

    dueDate = new Date(dueDateRaw);
  }

  const publish = intent === "publish";

  // 6. Règles de publication
  if (publish && type === "ONLINE") {
    return {
      error:
        "Les compositions en ligne doivent rester en brouillon tant que le module de questions interactives n'est pas disponible.",
    };
  }

  if (publish && (!dueDate || dueDate <= new Date())) {
    return {
      error:
        "Pour publier un devoir, définissez une échéance future.",
    };
  }

  // 7. Vérification de l'affectation
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
        "Vous ne possédez pas les droits nécessaires sur cette classe et cette matière.",
    };
  }

  // 8. Enregistrement réel dans PostgreSQL
  try {
    await prisma.homework.create({
      data: {
        title,
        instructions,
        type,
        status: publish ? "PUBLISHED" : "DRAFT",
        durationMinutes,
        dueDate,
        assignmentId: assignment.id,
        createdById: user.id,
        publishedAt: publish ? new Date() : null,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la création du devoir :",
      error
    );

    return {
      error:
        "Impossible d'enregistrer le devoir dans PostgreSQL. Veuillez réessayer.",
    };
  }

  // 9. Actualisation
  revalidatePath("/teacher/assignments");

  // 10. Redirection après succès uniquement
  redirect(
    publish
      ? "/teacher/assignments?created=published"
      : "/teacher/assignments?created=draft"
  );
}
