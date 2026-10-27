// src/app/teacher/grades/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import GradeEntryForm from "./GradeEntryForm";
import { deleteGradeAction } from "./actions";

export const dynamic = "force-dynamic";

const statusStyles = {
  PENDING: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  APPROVED: "border-teal-500/20 bg-teal-500/10 text-teal-300",
  REJECTED: "border-rose-500/20 bg-rose-500/10 text-rose-300",
} as const;

const statusLabels = {
  PENDING: "En attente",
  APPROVED: "Approuvée",
  REJECTED: "Rejetée",
} as const;

export default async function TeacherGradesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // La base est la source de vérité pour les autorisations.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true },
  });

  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const isAdmin = user.role === "ADMIN";
  const assignments = await prisma.teachingAssignment.findMany({
    where: isAdmin ? {} : { teacherId: user.id },
    select: {
      id: true,
      classId: true,
      subject: true,
      class: { select: { name: true, level: true } },
    },
  });

  const classIds = [...new Set(assignments.map((item) => item.classId))];

  const students = classIds.length
    ? await prisma.student.findMany({
        where: { classId: { in: classIds } },
        select: {
          id: true,
          classId: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { user: { name: "asc" } },
      })
    : [];

  // Pour l'enseignant, chaque paire classe/matière est contrôlée.
  // On n'affiche pas toutes les matières d'une classe sous prétexte
  // qu'il y enseigne une autre matière.
  const recentGrades = !isAdmin && assignments.length === 0
    ? []
    : await prisma.grade.findMany({
        where: isAdmin
          ? {}
          : {
              OR: assignments.map((assignment) => ({
                subject: assignment.subject,
                student: { is: { classId: assignment.classId } },
              })),
            },
        select: {
          id: true,
          score: true,
          coef: true,
          subject: true,
          term: true,
          status: true,
          createdAt: true,
          submittedById: true,
          reviewComment: true,
          student: {
            select: {
              user: { select: { name: true, email: true } },
              class: { select: { name: true, level: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

  const assignmentOptions = assignments
    .map((item) => ({
      id: item.id,
      classId: item.classId,
      className: item.class.name,
      classLevel: item.class.level,
      subject: item.subject,
    }))
    .sort((a, b) =>
      `${a.className} ${a.subject}`.localeCompare(`${b.className} ${b.subject}`, "fr"),
    );

  const studentOptions = students.map((item) => ({
    id: item.id,
    classId: item.classId,
    name: item.user.name?.trim() || item.user.email || "Élève sans nom",
  }));

  return (
    <main className="relative mx-auto max-w-7xl space-y-8 pb-16 text-slate-100">
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />

      <header className="relative rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl md:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
          <ShieldCheck size={14} /> Gestion pédagogique sécurisée
        </div>
        <h1 className="flex items-center gap-3 text-2xl font-extrabold text-white md:text-3xl">
          <Award className="text-teal-400" size={30} /> Saisie et suivi des notes
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          {isAdmin ? "Espace administrateur" : `Enseignant : ${user.name?.trim() || "Compte enseignant"}`}
          {" · "}{assignments.length} affectation(s) pédagogique(s)
        </p>
        {assignments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {assignmentOptions.slice(0, 8).map((item) => (
              <span key={item.id} className="rounded-lg border border-slate-700 bg-[#08111f] px-3 py-1.5 text-xs text-slate-300">
                {item.className} — {item.subject}
              </span>
            ))}
            {assignments.length > 8 && (
              <span className="px-3 py-1.5 text-xs text-slate-500">+{assignments.length - 8} autres</span>
            )}
          </div>
        )}
      </header>

      <section className="relative rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl md:p-8">
        <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-white">
          <BookOpen size={19} className="text-teal-400" /> Soumettre une évaluation
        </h2>

        {assignments.length === 0 ? (
          <div className="flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
            <AlertCircle size={20} className="shrink-0" />
            Aucune affectation disponible. Contactez l'administration pour associer une classe et une matière.
          </div>
        ) : students.length === 0 ? (
          <div className="flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
            <GraduationCap size={20} className="shrink-0" />
            Aucune fiche élève disponible dans les classes affectées.
          </div>
        ) : (
          <GradeEntryForm assignments={assignmentOptions} students={studentOptions} />
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-6">
          <div>
            <h2 className="text-base font-bold text-white">Notes récentes</h2>
            <p className="mt-1 text-xs text-slate-500">Les 30 dernières notes accessibles à votre compte</p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
            {recentGrades.length} affichée(s)
          </span>
        </div>

        {recentGrades.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <Award size={38} className="mx-auto mb-3 text-slate-600" />
            Aucune note à afficher pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="border-b border-slate-800 bg-[#0b1626] text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Élève</th>
                  <th className="p-4">Classe</th>
                  <th className="p-4">Matière</th>
                  <th className="p-4">Note</th>
                  <th className="p-4">Période</th>
                  <th className="p-4">Validation</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {recentGrades.map((grade) => {
                  const canDelete =
                    grade.status === "PENDING" &&
                    (isAdmin || grade.submittedById === user.id);

                  return (
                    <tr key={grade.id} className="transition hover:bg-slate-800/30">
                      <td className="p-4 font-semibold text-white">
                        {grade.student.user.name || grade.student.user.email || "Élève sans nom"}
                      </td>
                      <td className="p-4 text-slate-300">
                        {grade.student.class.name} — {grade.student.class.level}
                      </td>
                      <td className="p-4 text-slate-300">{grade.subject}</td>
                      <td className="p-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                          grade.score >= 12
                            ? "border-teal-500/20 bg-teal-500/10 text-teal-300"
                            : grade.score >= 10
                              ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                              : "border-rose-500/20 bg-rose-500/10 text-rose-300"
                        }`}>
                          {grade.score}/20 <span className="opacity-70">(coef. {grade.coef})</span>
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{grade.term}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusStyles[grade.status]}`}>
                          {grade.status === "APPROVED" ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                          {statusLabels[grade.status]}
                        </span>
                        {grade.status === "REJECTED" && grade.reviewComment && (
                          <p className="mt-1 max-w-xs text-xs text-rose-300">{grade.reviewComment}</p>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {canDelete ? (
                          <form action={deleteGradeAction}>
                            <input type="hidden" name="id" value={grade.id} />
                            <button
                              type="submit"
                              title="Supprimer la note en attente"
                              aria-label="Supprimer la note en attente"
                              className="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                            >
                              <Trash2 size={17} />
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
