// src/app/student/assignments/actions.ts
"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 Mo ; configurer bodySizeLimit à 5 Mo dans next.config.ts

const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

function goBack(id: string, reason: string): never {
  redirect(`/student/assignments/upload/${encodeURIComponent(id)}?error=${reason}`);
}

function hasValidSignature(extension: string, content: Uint8Array): boolean {
  if (extension === "pdf") {
    return content.length >= 5 && [37, 80, 68, 70, 45].every((byte, i) => content[i] === byte);
  }
  if (extension === "jpg" || extension === "jpeg") {
    return content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
  }
  if (extension === "png") {
    return content.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => content[i] === byte);
  }
  if (extension === "docx") {
    // DOCX est une archive ZIP. La signature seule ne garantit pas la validité du contenu Office.
    return content.length >= 4 && content[0] === 0x50 && content[1] === 0x4b &&
      ((content[2] === 3 && content[3] === 4) || (content[2] === 5 && content[3] === 6));
  }
  return false;
}

export async function submitHomeworkFileAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, studentProfile: { select: { id: true, classId: true } } },
  });
  if (user?.role !== "STUDENT" || !user.studentProfile) redirect("/student/assignments");
  const student = user.studentProfile;

  const homeworkId = formData.get("homeworkId");
  if (typeof homeworkId !== "string" || !homeworkId.trim()) redirect("/student/assignments");

  const homework = await prisma.homework.findFirst({
    where: {
      id: homeworkId,
      type: "UPLOAD",
      status: "PUBLISHED",
      assignment: { is: { classId: student.classId } },
    },
    select: { id: true, dueDate: true },
  });
  if (!homework) goBack(homeworkId, "unavailable");
  if (homework.dueDate && homework.dueDate.getTime() < Date.now()) goBack(homeworkId, "late");

  const existing = await prisma.homeworkSubmission.findUnique({
    where: { homeworkId_studentId: { homeworkId, studentId: student.id } },
    select: { id: true },
  });
  if (existing) goBack(homeworkId, "submitted");

  const uploaded = formData.get("file");
  if (!uploaded || typeof uploaded === "string") goBack(homeworkId, "missing");
  if (uploaded.size === 0 || uploaded.size > MAX_FILE_BYTES) goBack(homeworkId, "size");

  const cleanName = uploaded.name.split(/[/\\]/).pop()?.replace(/[\x00-\x1f\x7f"<>]/g, "_").trim() ?? "";
  if (!cleanName || cleanName.length > 180) goBack(homeworkId, "invalid");
  const extension = cleanName.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = TYPES[extension];
  if (!mimeType) goBack(homeworkId, "type");

  const bytes = new Uint8Array(await uploaded.arrayBuffer());
  if (bytes.byteLength > MAX_FILE_BYTES || !hasValidSignature(extension, bytes)) {
    goBack(homeworkId, "type");
  }

  try {
    await prisma.homeworkSubmission.create({
      data: {
        homeworkId,
        studentId: student.id,
        fileName: cleanName,
        mimeType,
        fileData: bytes,
        status: "PENDING",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      goBack(homeworkId, "submitted");
    }
    throw error;
  }

  revalidatePath("/student/assignments");
  revalidatePath(`/student/assignments/upload/${homeworkId}`);
  redirect("/student/assignments?notice=uploaded");
}
