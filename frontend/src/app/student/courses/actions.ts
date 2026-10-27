"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const PATH = "/student/courses";

type Notice = "lesson" | "placement" | "final" | "locked" | "invalid" | "passed";

function back(courseId: string, notice: Notice): never {
  redirect(`${PATH}?courseId=${encodeURIComponent(courseId)}&notice=${notice}`);
}

async function requireStudent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      studentProfile: { select: { id: true, classId: true } },
    },
  });

  if (!user || user.role !== "STUDENT") redirect("/login");
  if (!user.studentProfile) redirect(PATH);
  return user.studentProfile;
}

/** Un chapitre est validé uniquement dans le bon ordre et dans la classe de l'apprenant. */
export async function completeLessonAction(formData: FormData): Promise<void> {
  const student = await requireStudent();
  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");

  if (!courseId || !lessonId) redirect(PATH);

  const lesson = await prisma.learningLesson.findFirst({
    where: {
      id: lessonId,
      courseId,
      course: {
        is: {
          status: "PUBLISHED",
          assignment: { is: { classId: student.classId } },
        },
      },
    },
    select: { id: true, position: true },
  });
  if (!lesson) back(courseId, "invalid");

  const placement = await prisma.learningAssessment.findUnique({
    where: { courseId_kind: { courseId, kind: "PLACEMENT" } },
    select: { id: true, published: true, _count: { select: { questions: true } } },
  });

  if (placement?.published && placement._count.questions > 0) {
    const attempted = await prisma.learningAttempt.findFirst({
      where: { studentId: student.id, assessmentId: placement.id },
      select: { id: true },
    });
    if (!attempted) back(courseId, "locked");
  }

  const previous = await prisma.learningLesson.findFirst({
    where: { courseId, position: { lt: lesson.position } },
    orderBy: { position: "desc" },
    select: { id: true },
  });

  if (previous) {
    const previousDone = await prisma.studentLessonProgress.findUnique({
      where: {
        studentId_lessonId: { studentId: student.id, lessonId: previous.id },
      },
      select: { id: true },
    });
    if (!previousDone) back(courseId, "locked");
  }

  await prisma.studentLessonProgress.upsert({
    where: {
      studentId_lessonId: { studentId: student.id, lessonId: lesson.id },
    },
    create: { studentId: student.id, lessonId: lesson.id },
    update: {},
  });

  revalidatePath(PATH);
  back(courseId, "lesson");
}

/** Correction côté serveur : les bonnes réponses ne sont jamais envoyées au navigateur. */
export async function submitAssessmentAction(formData: FormData): Promise<void> {
  const student = await requireStudent();
  const courseId = String(formData.get("courseId") ?? "");
  const assessmentId = String(formData.get("assessmentId") ?? "");

  if (!courseId || !assessmentId) redirect(PATH);

  const assessment = await prisma.learningAssessment.findFirst({
    where: {
      id: assessmentId,
      courseId,
      published: true,
      course: {
        is: {
          status: "PUBLISHED",
          assignment: { is: { classId: student.classId } },
        },
      },
    },
    select: {
      id: true,
      kind: true,
      passingScore: true,
      questions: {
        select: { id: true, correctOption: true },
      },
    },
  });

  if (!assessment || assessment.questions.length === 0) back(courseId, "invalid");

  if (assessment.kind === "FINAL") {
    const lessons = await prisma.learningLesson.findMany({
      where: { courseId },
      select: { id: true },
    });
    if (lessons.length === 0) back(courseId, "locked");

    const completed = await prisma.studentLessonProgress.count({
      where: { studentId: student.id, lessonId: { in: lessons.map((l) => l.id) } },
    });
    if (completed !== lessons.length) back(courseId, "locked");

    const previousPass = await prisma.learningAttempt.findFirst({
      where: {
        studentId: student.id,
        assessmentId,
        percentScore: { gte: assessment.passingScore },
      },
      select: { id: true },
    });
    if (previousPass) back(courseId, "passed");
  }

  const validChoices = new Set(["A", "B", "C", "D"]);
  let correct = 0;

  for (const question of assessment.questions) {
    const answer = formData.get(`answer_${question.id}`);
    if (typeof answer !== "string" || !validChoices.has(answer)) {
      back(courseId, "invalid");
    }
    if (answer === question.correctOption) correct++;
  }

  const percentScore = Math.round((correct / assessment.questions.length) * 100);
  const level =
    assessment.kind === "PLACEMENT"
      ? percentScore < 50
        ? ("BEGINNER" as const)
        : percentScore < 80
          ? ("INTERMEDIATE" as const)
          : ("ADVANCED" as const)
      : null;

  await prisma.learningAttempt.create({
    data: { studentId: student.id, assessmentId, percentScore, level },
  });

  revalidatePath(PATH);
  back(courseId, assessment.kind === "PLACEMENT" ? "placement" : "final");
}
