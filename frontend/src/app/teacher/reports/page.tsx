// src/app/teacher/reports/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  Save,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Term = "T1" | "T2" | "T3";
type SearchParams = {
  term?: string | string[];
  classId?: string | string[];
  saved?: string | string[];
};

type GradeForAverage = {
  score: number;
  coef: number;
};

const terms: { value: Term; label: string }[] = [
  { value: "T1", label: "Trimestre 1" },
  { value: "T2", label: "Trimestre 2" },
  { value: "T3", label: "Trimestre 3" },
];

const selectClass =
  "w-full rounded-xl border border-slate-700 bg-[#08111f] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-400";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseTerm(value: unknown): Term {
  return value === "T2" || value === "T3" ? value : "T1";
}

function average(grades: GradeForAverage[]): number | null {
  const valid = grades.filter(
    (grade) =>
      Number.isFinite(grade.score) &&
      Number.isFinite(grade.coef) &&
      grade.coef > 0,
  );

  const coefTotal = valid.reduce((sum, grade) => sum + grade.coef, 0);
  if (coefTotal === 0) return null;

  return (
    valid.reduce((sum, grade) => sum + grade.score * grade.coef, 0) /
    coefTotal
  );
}

function displayAverage(value: number | null): string {
  return value === null
    ? "—"
    : new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
}

async function requireReportsUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, name: true },
  });

  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  return user;
}

// Server Action : chaque soumission vérifie de nouveau le compte,
// l'affectation exacte (classe + matière) et l'appartenance de l'élève.
async function saveAppreciationAction(formData: FormData): Promise<void> {
  "use server";

  const user = await requireReportsUser();
  const studentId = field(formData, "studentId");
  const assignmentId = field(formData, "assignmentId");
  const rawTerm = field(formData, "term");
  const comment = field(formData, "comment");
  const returnClassId = field(formData, "returnClassId");

  if (!studentId || !assignmentId) {
    throw new Error("Sélection de l'élève ou de la matière manquante.");
  }
  if (!terms.some((item) => item.value === rawTerm)) {
    throw new Error("Trimestre invalide.");
  }
  if (comment.length < 10 || comment.length > 2000) {
    throw new Error("L'appréciation doit contenir entre 10 et 2 000 caractères.");
  }

  const assignment = await prisma.teachingAssignment.findFirst({
    where: {
      id: assignmentId,
      ...(user.role === "TEACHER" ? { teacherId: user.id } : {}),
    },
    select: { classId: true, subject: true },
  });

  if (!assignment) {
    throw new Error("Vous n'êtes pas autorisé à commenter cette matière.");
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, classId: assignment.classId },
    select: { id: true },
  });
  if (!student) {
    throw new Error("Cet élève n'appartient pas à la classe concernée.");
  }

  // La contrainte unique [studentId, subject, term] évite les doublons.
  await prisma.teacherAppreciation.upsert({
    where: {
      studentId_subject_term: {
        studentId: student.id,
        subject: assignment.subject,
        term: rawTerm,
      },
    },
    create: {
      studentId: student.id,
      teacherId: user.id,
      subject: assignment.subject,
      term: rawTerm,
      comment,
    },
    update: {
      teacherId: user.id,
      comment,
    },
  });

  revalidatePath("/teacher/reports");

  const params = new URLSearchParams({
    term: rawTerm,
    classId: returnClassId || "all",
    saved: "1",
  });
  redirect(`/teacher/reports?${params.toString()}`);
}

export default async function TeacherReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireReportsUser();
  const query = await searchParams;
  const term = parseTerm(query.term);
  const requestedClassId =
    typeof query.classId === "string" ? query.classId : "all";

  const assignments = await prisma.teachingAssignment.findMany({
    where: user.role === "TEACHER" ? { teacherId: user.id } : {},
    select: {
      id: true,
      classId: true,
      subject: true,
      class: { select: { id: true, name: true, level: true } },
    },
    orderBy: [{ class: { level: "asc" } }, { class: { name: "asc" } }, { subject: "asc" }],
  });

  const classMap = new Map<
    string,
    { id: string; name: string; level: string }
  >();
  const assignmentsByClass = new Map<string, typeof assignments>();

  for (const assignment of assignments) {
    classMap.set(assignment.classId, assignment.class);
    const current = assignmentsByClass.get(assignment.classId) ?? [];
    // Évite deux formulaires pour la même matière si plusieurs professeurs
    // sont affectés à une classe (notamment dans la vue administrateur).
    if (!current.some((item) => item.subject === assignment.subject)) {
      current.push(assignment);
    }
    assignmentsByClass.set(assignment.classId, current);
  }

  const classes = [...classMap.values()];
  const classId = classMap.has(requestedClassId) ? requestedClassId : "all";
  const allowedClassIds =
    classId === "all" ? classes.map((item) => item.id) : [classId];
  const subjectNames = [...new Set(assignments.map((item) => item.subject))];

  const [students, appreciations] = await Promise.all([
    prisma.student.findMany({
      where: { classId: { in: allowedClassIds } },
      select: {
        id: true,
        classId: true,
        user: { select: { name: true, email: true } },
        class: { select: { name: true, level: true } },
        grades: {
          where: {
            term,
            status: "APPROVED",
            subject: { in: subjectNames },
          },
          select: { id: true, subject: true, score: true, coef: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [
        { class: { name: "asc" } },
        { user: { name: "asc" } },
      ],
    }),
    prisma.teacherAppreciation.findMany({
      where: {
        term,
        student: { classId: { in: allowedClassIds } },
        ...(user.role === "TEACHER"
          ? {
              OR: assignments
                .filter((item) => allowedClassIds.includes(item.classId))
                .map((item) => ({
                  subject: item.subject,
                  student: { classId: item.classId },
                })),
            }
          : {}),
      },
      select: { studentId: true, subject: true, comment: true },
    }),
  ]);

  const appreciationMap = new Map<string, string>();
  for (const item of appreciations) {
    appreciationMap.set(`${item.studentId}:${item.subject}`, item.comment);
  }

  return (
    <main className="relative mx-auto max-w-7xl space-y-7 pb-14 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
              <ShieldCheck size={14} /> Espace pédagogique sécurisé
            </span>
            <h1 className="flex items-center gap-3 text-2xl font-extrabold text-white md:text-3xl">
              <FileText className="text-teal-400" /> Bulletins & appréciations
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
              Consultez les notes approuvées et rédigez les appréciations
              trimestrielles, uniquement pour les classes et matières autorisées.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-[#08111f] px-5 py-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Élèves affichés</p>
            <p className="mt-1 text-2xl font-extrabold text-white">{students.length}</p>
          </div>
        </div>
      </section>

      {query.saved === "1" && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-teal-500/25 bg-teal-500/10 px-4 py-3 text-sm text-teal-300">
          <CheckCircle2 size={17} /> Appréciation enregistrée avec succès.
        </div>
      )}

      {assignments.length > 0 && (
        <form method="get" className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#111e30] p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="report-term" className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <CalendarDays size={14} /> Période
            </label>
            <select id="report-term" name="term" defaultValue={term} className={selectClass}>
              {terms.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-2">
            <label htmlFor="report-class" className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <GraduationCap size={14} /> Classe
            </label>
            <select id="report-class" name="classId" defaultValue={classId} className={selectClass}>
              <option value="all">Toutes mes classes</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.level}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-teal-400">
            Afficher
          </button>
        </form>
      )}

      {assignments.length === 0 ? (
        <section className="rounded-3xl border border-slate-800 bg-[#111e30] px-6 py-16 text-center">
          <GraduationCap className="mx-auto mb-4 text-slate-600" size={42} />
          <h2 className="font-bold text-white">Aucune affectation pédagogique</h2>
          <p className="mt-2 text-sm text-slate-400">
            Contactez l'administration pour associer une classe et une matière à votre compte.
          </p>
        </section>
      ) : students.length === 0 ? (
        <section className="rounded-3xl border border-slate-800 bg-[#111e30] px-6 py-16 text-center">
          <GraduationCap className="mx-auto mb-4 text-slate-600" size={42} />
          <p className="text-sm text-slate-400">Aucun élève trouvé pour cette sélection.</p>
        </section>
      ) : (
        <div className="space-y-6">
          {students.map((student) => {
            const studentAssignments = assignmentsByClass.get(student.classId) ?? [];
            const classSubjects = new Set(studentAssignments.map((item) => item.subject));
            const grades = student.grades.filter((grade) => classSubjects.has(grade.subject));
            const generalAverage = average(grades);

            return (
              <section key={student.id} className="rounded-3xl border border-slate-800 bg-[#111e30] p-5 shadow-xl md:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-[#08111f] font-bold text-teal-300">
                      {(student.user.name || student.user.email || "E").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-bold text-white">{student.user.name || student.user.email || "Élève"}</h2>
                      <p className="text-xs font-medium text-slate-400">
                        {student.class.name} — {student.class.level}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
                    <Award size={17} /> Moyenne des matières autorisées :
                    <strong className="text-white">{displayAverage(generalAverage)} / 20</strong>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-[#08111f] p-4">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                      <BookOpen size={16} className="text-sky-400" /> Notes approuvées — {term}
                    </h3>
                    {grades.length === 0 ? (
                      <p className="text-xs text-slate-500">Aucune note approuvée pour ce trimestre.</p>
                    ) : (
                      <div className="space-y-2">
                        {grades.map((grade) => (
                          <div key={grade.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#111e30] px-3 py-2.5 text-xs">
                            <span className="font-medium text-slate-300">{grade.subject}</span>
                            <span className="whitespace-nowrap font-bold text-teal-300">
                              {grade.score} / 20 · coef. {grade.coef}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#08111f] p-4">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                      <FileText size={16} className="text-teal-400" /> Appréciations — {term}
                    </h3>
                    <div className="space-y-3">
                      {studentAssignments.map((assignment) => {
                        const previousComment = appreciationMap.get(
                          `${student.id}:${assignment.subject}`,
                        );
                        const subjectGrades = grades.filter(
                          (grade) => grade.subject === assignment.subject,
                        );
                        return (
                          <details key={assignment.id} className="group rounded-xl border border-slate-700 bg-[#111e30] p-3">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold text-slate-200">
                              <span>{assignment.subject}</span>
                              <span className="text-teal-300">
                                {displayAverage(average(subjectGrades))} / 20
                                {previousComment ? " · Avis enregistré" : ""}
                              </span>
                            </summary>
                            <form action={saveAppreciationAction} className="mt-3 space-y-3">
                              <input type="hidden" name="studentId" value={student.id} />
                              <input type="hidden" name="assignmentId" value={assignment.id} />
                              <input type="hidden" name="term" value={term} />
                              <input type="hidden" name="returnClassId" value={classId} />
                              <label className="block space-y-2">
                                <span className="text-xs text-slate-400">Appréciation pour {assignment.subject}</span>
                                <textarea
                                  key={`${student.id}-${assignment.id}-${term}`}
                                  name="comment"
                                  defaultValue={previousComment ?? ""}
                                  required
                                  minLength={10}
                                  maxLength={2000}
                                  rows={4}
                                  placeholder="Ex. : Participation régulière et bonne progression ce trimestre."
                                  className="w-full resize-y rounded-xl border border-slate-700 bg-[#08111f] p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-teal-400"
                                />
                              </label>
                              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-teal-400">
                                <Save size={14} /> {previousComment ? "Modifier l'avis" : "Enregistrer l'avis"}
                              </button>
                            </form>
                          </details>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
      <p className="text-xs leading-relaxed text-slate-500">
        Les moyennes présentées sont calculées avec les coefficients des notes approuvées,
        pour le trimestre choisi et les matières autorisées. Il ne s'agit pas
        nécessairement de la moyenne générale officielle du bulletin.
      </p>
    </main>
  );
}
