// src/app/student/dashboard/page.tsx
import type { ReactNode } from "react";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GraduationCap,
  Layers3,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

const TERMS = ["T1", "T2", "T3"] as const;
type Term = (typeof TERMS)[number];

type DashboardProps = {
  searchParams: Promise<{ term?: string | string[] }>;
};

const numberFormat = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function isTerm(value: string | undefined): value is Term {
  return value === "T1" || value === "T2" || value === "T3";
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "É"
  );
}

function getScoreColor(score: number): string {
  if (score >= 12) return "text-emerald-300 border-emerald-500/20 bg-emerald-500/10";
  if (score >= 10) return "text-amber-300 border-amber-500/20 bg-amber-500/10";
  return "text-rose-300 border-rose-500/20 bg-rose-500/10";
}

function MetricCard({
  label,
  value,
  subtitle,
  icon,
  iconStyle,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  iconStyle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#111e30]/90 p-4 shadow-lg shadow-black/10 sm:p-5">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${iconStyle}`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

export default async function StudentDashboard({ searchParams }: DashboardProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Contrôle du rôle directement en base et accès au SEUL profil de la session.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      role: true,
      studentProfile: {
        select: {
          id: true,
          classId: true,
          class: {
            select: {
              name: true,
              level: true,
              educationType: true,
            },
          },
          grades: {
            where: { status: "APPROVED" },
            select: {
              id: true,
              subject: true,
              score: true,
              coef: true,
              term: true,
              evaluationDate: true,
            },
            orderBy: { evaluationDate: "desc" },
          },
        },
      },
    },
  });

  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin/dashboard");
  if (user.role !== "STUDENT") redirect("/login");

  const student = user.studentProfile;
  if (!student) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-amber-500/20 bg-[#111e30] p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
          <AlertCircle size={26} />
        </div>
        <h1 className="text-xl font-bold text-white">Profil apprenant non trouvé</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Votre compte existe, mais aucun dossier scolaire ou de formation ne lui est associé.
          Contactez l'administration pour finaliser votre inscription.
        </p>
      </div>
    );
  }

  const isProfessional = student.class.educationType === "PROFESSIONAL";
  const studentName = user.name?.trim() || "Apprenant";
  const params = await searchParams;
  const rawTerm = Array.isArray(params.term) ? params.term[0] : params.term;
  const latestTerm = student.grades.map((grade) => grade.term).find(isTerm);
  const selectedTerm: Term = isTerm(rawTerm) ? rawTerm : (latestTerm ?? "T1");
  const termGrades = student.grades.filter((grade) => grade.term === selectedTerm);

  // Moyenne pondérée : somme(note × coefficient) / somme(coefficients).
  const weightedTotal = termGrades.reduce((sum, grade) => sum + grade.score * grade.coef, 0);
  const totalCoef = termGrades.reduce((sum, grade) => sum + grade.coef, 0);
  const average = totalCoef > 0 ? weightedTotal / totalCoef : null;

  const pendingWhere: Prisma.HomeworkWhereInput = {
    status: "PUBLISHED",
    assignment: { classId: student.classId },
    submissions: { none: { studentId: student.id } },
  };

  const [assignments, pendingCount, pendingHomeworks] = await Promise.all([
    prisma.teachingAssignment.findMany({
      where: { classId: student.classId },
      select: { subject: true },
    }),
    prisma.homework.count({ where: pendingWhere }),
    prisma.homework.findMany({
      where: pendingWhere,
      select: {
        id: true,
        title: true,
        dueDate: true,
        assignment: { select: { subject: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 4,
    }),
  ]);

  const subjects = [...new Set(assignments.map((assignment) => assignment.subject))];
  const bySubject = new Map<string, { sum: number; coef: number; count: number }>();
  for (const grade of termGrades) {
    const current = bySubject.get(grade.subject) ?? { sum: 0, coef: 0, count: 0 };
    current.sum += grade.score * grade.coef;
    current.coef += grade.coef;
    current.count += 1;
    bySubject.set(grade.subject, current);
  }
  const subjectAverages = [...bySubject.entries()]
    .map(([subject, entry]) => ({
      subject,
      average: entry.coef > 0 ? entry.sum / entry.coef : 0,
      count: entry.count,
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject, "fr"));

  const now = new Date();
  const heading = isProfessional ? "Espace Apprenant" : "Espace Élève";
  const subjectLabel = isProfessional ? "Modules" : "Matières";
  const trackLabel = isProfessional ? "Formation suivie" : "Classe actuelle";
  const cohortLabel = isProfessional ? "Promotion / Cohorte" : "Niveau";

  return (
    <div className="relative mx-auto max-w-7xl space-y-6 pb-12 text-slate-100 sm:space-y-8">
      {/* EN-TÊTE */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-gradient-to-br from-[#111e30] via-[#0d1b2e] to-[#10303a] p-5 shadow-2xl shadow-black/20 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-600 text-lg font-extrabold text-white shadow-lg shadow-blue-900/20 sm:h-16 sm:w-16">
              {getInitials(studentName)}
            </div>
            <div className="min-w-0 space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold text-teal-300">
                <Sparkles size={12} /> {heading}
              </span>
              <h1 className="break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Bonjour, {studentName} !
              </h1>
              <p className="text-sm text-slate-300">
                {trackLabel} : <strong className="text-white">{student.class.name}</strong>
              </p>
              <p className="text-xs text-slate-400">
                {cohortLabel} : {student.class.level}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-[#08111f]/60 px-5 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-300">
              <Award size={23} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Moyenne · {selectedTerm}</p>
              <p className={`mt-1 text-2xl font-extrabold ${average === null ? "text-slate-300" : average >= 12 ? "text-emerald-300" : average >= 10 ? "text-amber-300" : "text-rose-300"}`}>
                {average === null ? "—" : numberFormat.format(average)}
                <span className="ml-1 text-xs font-normal text-slate-400">/20</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CHOIX DE LA PÉRIODE */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Vue d'ensemble</h2>
          <p className="text-xs text-slate-400">Résultats validés par l'administration uniquement</p>
        </div>
        <nav aria-label="Choisir la période" className="flex gap-2 rounded-2xl border border-slate-800 bg-[#111e30] p-1.5">
          {TERMS.map((term) => (
            <Link
              key={term}
              href={`/student/dashboard?term=${term}`}
              aria-current={term === selectedTerm ? "page" : undefined}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${term === selectedTerm ? "bg-teal-500 text-slate-950 shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            >
              {term}
            </Link>
          ))}
        </nav>
      </div>

      {/* STATISTIQUES */}
      <section aria-label="Indicateurs scolaires" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          label="Moyenne de la période"
          value={average === null ? "— /20" : `${numberFormat.format(average)} /20`}
          subtitle={`Calcul pondéré · ${selectedTerm}`}
          icon={<Award size={21} />}
          iconStyle="border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
        />
        <MetricCard
          label={`${subjectLabel} suivis`}
          value={String(subjects.length)}
          subtitle="Selon votre affectation"
          icon={<Layers3 size={21} />}
          iconStyle="border-blue-500/20 bg-blue-500/10 text-blue-300"
        />
        <MetricCard
          label="Notes publiées"
          value={String(termGrades.length)}
          subtitle={`Notes approuvées · ${selectedTerm}`}
          icon={<CheckCircle2 size={21} />}
          iconStyle="border-violet-500/20 bg-violet-500/10 text-violet-300"
        />
        <MetricCard
          label="Travaux à rendre"
          value={String(pendingCount)}
          subtitle="Devoirs publiés non remis"
          icon={<ClipboardList size={21} />}
          iconStyle="border-amber-500/20 bg-amber-500/10 text-amber-300"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* HISTORIQUE DE NOTES */}
        <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30]/90">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-5 sm:px-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <BookOpen size={19} className="text-teal-300" /> Mes évaluations · {selectedTerm}
            </h2>
            <Link href="/student/grades" className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-teal-200">
              Toutes mes notes <ArrowRight size={15} />
            </Link>
          </div>
          {termGrades.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <GraduationCap size={30} className="mx-auto mb-3 text-slate-500" />
              <p className="text-sm font-semibold text-slate-200">Aucune note publiée pour {selectedTerm}</p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
                Les notes en attente de validation ne sont pas visibles dans votre espace.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="bg-[#0a1422] text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-semibold">{isProfessional ? "Module" : "Matière"}</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Note</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Coef.</th>
                    <th scope="col" className="px-5 py-4 text-right font-semibold">Évaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {termGrades.slice(0, 8).map((grade) => (
                    <tr key={grade.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-5 py-4 font-semibold text-slate-100">{grade.subject}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-extrabold ${getScoreColor(grade.score)}`}>
                          {numberFormat.format(grade.score)} / 20
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300">× {grade.coef}</td>
                      <td className="px-5 py-4 text-right text-xs text-slate-400">{formatDate(grade.evaluationDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* DEVOIRS À RENDRE */}
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30]/90">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-5 sm:px-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <CalendarClock size={19} className="text-amber-300" /> Travaux à rendre
            </h2>
            <Link href="/student/assignments" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300 hover:text-teal-200">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          {pendingHomeworks.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <CheckCircle2 size={29} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-sm font-semibold text-slate-200">Aucun devoir en attente</p>
              <p className="mt-2 text-xs text-slate-400">Vos devoirs publiés non remis apparaîtront ici.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {pendingHomeworks.map((homework) => {
                const overdue = homework.dueDate !== null && homework.dueDate < now;
                return (
                  <li key={homework.id} className="px-5 py-4 sm:px-6">
                    <p className="truncate text-sm font-semibold text-white" title={homework.title}>{homework.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{homework.assignment.subject}</p>
                    <p className={`mt-2 flex items-center gap-1.5 text-xs ${overdue ? "text-rose-300" : "text-slate-400"}`}>
                      {overdue ? <AlertCircle size={13} /> : <Clock3 size={13} />}
                      {homework.dueDate ? `${overdue ? "En retard depuis le" : "À rendre le"} ${formatDate(homework.dueDate)}` : "Sans date limite"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* MOYENNES PAR MATIÈRE OU MODULE */}
      <section className="rounded-3xl border border-slate-800 bg-[#111e30]/90 p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Layers3 size={19} className="text-blue-300" />
          <h2 className="text-base font-bold text-white">Résultats par {isProfessional ? "module" : "matière"} · {selectedTerm}</h2>
        </div>
        {subjectAverages.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune moyenne par {isProfessional ? "module" : "matière"} disponible pour cette période.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {subjectAverages.map((item) => (
              <div key={item.subject}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-slate-200">{item.subject}</span>
                  <span className="shrink-0 font-bold text-white">{numberFormat.format(item.average)} /20</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`Moyenne en ${item.subject}`}
                  aria-valuenow={item.average}
                  aria-valuemin={0}
                  aria-valuemax={20}
                  className="h-2 overflow-hidden rounded-full bg-slate-800"
                >
                  <div
                    className={`h-full rounded-full ${item.average >= 12 ? "bg-teal-400" : item.average >= 10 ? "bg-amber-400" : "bg-rose-400"}`}
                    style={{ width: `${Math.max(0, Math.min(100, (item.average / 20) * 100))}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">{item.count} évaluation(s) validée(s)</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
