// src/app/teacher/submissions/page.tsx
import type { ReactNode } from "react";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  CheckSquare,
  Sparkles,
  FileText,
  Download,
  CheckCircle2,
  Clock3,
  AlertCircle,
  GraduationCap,
  Send,
} from "lucide-react";
import { gradeSubmissionAction } from "./actions";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Abidjan",
});

export default async function TeacherSubmissionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Ne jamais utiliser un rôle fourni par le navigateur comme autorisation.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  // Un enseignant ne voit que les copies des devoirs qui lui sont affectés.
  // Un administrateur peut consulter l'ensemble des dépôts.
  const scope: Prisma.HomeworkSubmissionWhereInput =
    user.role === "ADMIN"
      ? {}
      : {
          homework: {
            is: { assignment: { is: { teacherId: user.id } } },
          },
        };

  const [submissions, totalCount, pendingCount, gradedCount] =
    await Promise.all([
      prisma.homeworkSubmission.findMany({
        where: scope,
        select: {
          id: true,
          submittedAt: true,
          status: true,
          fileName: true,
          score: true,
          feedback: true,
          student: {
            select: { user: { select: { name: true } } },
          },
          homework: {
            select: {
              title: true,
              assignment: {
                select: {
                  subject: true,
                  class: { select: { name: true, level: true } },
                },
              },
            },
          },
        },
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        take: 50,
      }),
      prisma.homeworkSubmission.count({ where: scope }),
      prisma.homeworkSubmission.count({
        where: { AND: [scope, { status: "PENDING" }] },
      }),
      prisma.homeworkSubmission.count({
        where: { AND: [scope, { status: "GRADED" }] },
      }),
    ]);

  return (
    <main className="relative mx-auto max-w-7xl space-y-8 pb-16 text-slate-100">
      <div className="pointer-events-none absolute right-1/4 top-0 h-96 w-96 rounded-full bg-amber-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute left-10 top-1/3 h-80 w-80 rounded-full bg-blue-600/10 blur-[100px]" />

      <header className="relative z-10 flex flex-col justify-between gap-6 rounded-3xl border border-slate-800/80 bg-[#111e30]/90 p-6 shadow-2xl md:flex-row md:items-center md:p-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-400">
            <Sparkles size={14} /> Espace enseignant · Suivi pédagogique
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Devoirs rendus & copies des élèves
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-400">
            Consultez les copies déposées, téléchargez les fichiers et notez les travaux
            de vos élèves sur 20. Toutes les données sont issues de PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-[#08111f] px-6 py-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <CheckSquare size={24} />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Copies reçues
            </p>
            <p className="text-xl font-extrabold text-white">{totalCount}</p>
          </div>
        </div>
      </header>

      <section aria-label="Statistiques des copies" className="relative z-10 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<FileText size={20} />} label="Copies reçues" value={totalCount} style="teal" />
        <StatCard icon={<Clock3 size={20} />} label="À corriger" value={pendingCount} style="amber" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Déjà notées" value={gradedCount} style="green" />
      </section>

      <section className="relative z-10 space-y-4" aria-labelledby="submissions-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="submissions-heading" className="text-lg font-bold text-white">
              Dernières copies
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {submissions.length} affichée(s) sur {totalCount} · les 50 plus récentes
            </p>
          </div>
          <Link
            href="/teacher/assignments"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            <GraduationCap size={16} /> Gérer les devoirs
          </Link>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-[#111e30] px-6 py-16 text-center shadow-xl">
            <FileText className="mx-auto mb-4 text-slate-600" size={42} />
            <h3 className="text-lg font-bold text-white">Aucune copie reçue</h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
              Les dépôts apparaîtront ici lorsqu'un élève de vos classes aura
              rendu un devoir publié. Aucune copie fictive n'est affichée.
            </p>
            <Link
              href="/teacher/assignments"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-[#08111f] hover:bg-teal-400"
            >
              Consulter les devoirs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => {
              const graded = sub.status === "GRADED";
              const schoolClass = sub.homework.assignment.class;

              return (
                <article
                  key={sub.id}
                  className="rounded-3xl border border-slate-800/80 bg-[#111e30]/90 p-6 shadow-xl md:p-7"
                >
                  <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                          {sub.homework.assignment.subject}
                        </span>
                        <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                          {schoolClass.name} — {schoolClass.level}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock3 size={13} /> {dateFormatter.format(sub.submittedAt)}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold leading-snug text-white">
                        {sub.homework.title}
                      </h3>
                      <p className="break-words text-sm text-slate-300">
                        Élève : <strong className="font-bold text-white">{sub.student.user.name ?? "Élève sans nom"}</strong>
                        <span className="mx-2 text-slate-600">•</span>
                        Fichier : <span className="text-cyan-300">{sub.fileName}</span>
                      </p>
                      {graded && sub.feedback ? (
                        <p className="rounded-xl border border-slate-700 bg-[#08111f] p-3 text-xs leading-relaxed text-slate-300">
                          <strong className="text-white">Appréciation :</strong> {sub.feedback}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <a
                        href={`/teacher/submissions/${encodeURIComponent(sub.id)}/download`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700"
                      >
                        <Download size={15} /> Télécharger
                      </a>
                      {graded ? (
                        <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400">
                          <CheckCircle2 size={16} /> Noté : {sub.score ?? "—"}/20
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-300">
                          <AlertCircle size={15} /> À corriger
                        </span>
                      )}
                    </div>
                  </div>

                  {!graded ? (
                    <details className="group mt-5 border-t border-slate-800 pt-4">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-bold text-[#08111f] transition hover:bg-teal-400">
                        <CheckSquare size={16} /> Noter la copie
                      </summary>
                      <form action={gradeSubmissionAction} className="mt-4 grid gap-4 rounded-2xl border border-slate-700 bg-[#08111f] p-4 sm:grid-cols-[160px_1fr_auto] sm:items-end">
                        <input type="hidden" name="submissionId" value={sub.id} />
                        <div>
                          <label htmlFor={`score-${sub.id}`} className="mb-2 block text-xs font-semibold text-slate-300">
                            Note sur 20
                          </label>
                          <input
                            id={`score-${sub.id}`}
                            name="score"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="20"
                            step="0.25"
                            required
                            placeholder="Ex. 15.5"
                            className="w-full rounded-xl border border-slate-700 bg-[#111e30] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-400"
                          />
                        </div>
                        <div>
                          <label htmlFor={`feedback-${sub.id}`} className="mb-2 block text-xs font-semibold text-slate-300">
                            Appréciation (facultative)
                          </label>
                          <textarea
                            id={`feedback-${sub.id}`}
                            name="feedback"
                            rows={1}
                            maxLength={2000}
                            placeholder="Commentaire pour l'élève"
                            className="w-full resize-y rounded-xl border border-slate-700 bg-[#111e30] px-3 py-2.5 text-sm text-white outline-none focus:border-teal-400"
                          />
                        </div>
                        <button
                          type="submit"
                          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-extrabold text-slate-950 hover:bg-slate-200"
                        >
                          <Send size={15} /> Enregistrer
                        </button>
                      </form>
                    </details>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  style,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  style: "teal" | "amber" | "green";
}) {
  const palette = {
    teal: "border-teal-500/20 bg-teal-500/10 text-teal-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  }[style];

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-[#111e30] p-5 shadow-xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-extrabold text-white">{value}</p>
      </div>
      <span className={`rounded-xl border p-3 ${palette}`}>{icon}</span>
    </div>
  );
}
