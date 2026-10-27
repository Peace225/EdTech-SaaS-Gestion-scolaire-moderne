// src/app/student/bulletin/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  Award,
  BookOpenCheck,
  CalendarDays,
  FileText,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Term = "T1" | "T2" | "T3";
type PageProps = {
  searchParams: Promise<{ annee?: string | string[] }>;
};

type GradeRow = {
  id: string;
  subject: string;
  score: number;
  coef: number;
  term: string;
  evaluationDate: Date;
};

type SubjectSummary = {
  subject: string;
  notes: number[];
  coef: number | null;
  average: number;
};

type TermSummary = {
  key: Term;
  label: string;
  subjects: SubjectSummary[];
  average: number | null;
  inconsistentCoef: boolean;
  gradesCount: number;
};

const TERMS: readonly { key: Term; label: string }[] = [
  { key: "T1", label: "Trimestre 1" },
  { key: "T2", label: "Trimestre 2" },
  { key: "T3", label: "Trimestre 3" },
];

const numberFormat = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatScore(value: number | null): string {
  return value === null || !Number.isFinite(value)
    ? "—"
    : numberFormat.format(value);
}

// Convention d'affichage à adapter si l'établissement utilise un autre calendrier.
function academicStartYear(date: Date): number {
  const year = date.getUTCFullYear();
  return date.getUTCMonth() >= 8 ? year : year - 1;
}

function buildTermSummary(key: Term, label: string, grades: GradeRow[]): TermSummary {
  const grouped = new Map<string, GradeRow[]>();

  for (const grade of grades) {
    if (grade.term !== key) continue;
    const subject = grade.subject.trim() || "Matière non renseignée";
    const group = grouped.get(subject) ?? [];
    group.push(grade);
    grouped.set(subject, group);
  }

  let inconsistentCoef = false;
  const subjects = [...grouped.entries()]
    .map(([subject, entries]): SubjectSummary => {
      const firstCoef = entries[0].coef;
      const consistent = entries.every((entry) => entry.coef === firstCoef);
      if (!consistent) inconsistentCoef = true;

      return {
        subject,
        notes: entries.map((entry) => entry.score),
        coef: consistent ? firstCoef : null,
        average: entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length,
      };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject, "fr"));

  // Le champ Grade.coef est utilisé ici comme coefficient de matière :
  // si les notes d'une même matière ont des coefficients incohérents,
  // on n'invente pas une moyenne générale.
  const totalCoef = subjects.reduce((sum, subject) => sum + (subject.coef ?? 0), 0);
  const average =
    subjects.length > 0 && !inconsistentCoef && totalCoef > 0
      ? subjects.reduce((sum, subject) => sum + subject.average * (subject.coef ?? 0), 0) /
        totalCoef
      : null;

  return {
    key,
    label,
    subjects,
    average,
    inconsistentCoef,
    gradesCount: subjects.reduce((sum, subject) => sum + subject.notes.length, 0),
  };
}

export default async function StudentBulletinPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Toujours vérifier le rôle enregistré en base, jamais un rôle transmis par le client.
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      name: true,
      studentProfile: {
        select: {
          id: true,
          class: {
            select: { name: true, level: true, educationType: true },
          },
        },
      },
    },
  });

  if (account?.role === "PARENT") redirect("/parent/dashboard");
  if (account?.role !== "STUDENT") redirect("/login");
  if (!account.studentProfile) notFound();

  const student = account.studentProfile;
  const isProfessional = student.class.educationType === "PROFESSIONAL";
  const learnerLabel = account.name?.trim() || "Apprenant";

  // Seules les notes approuvées sont consultables.
  // Ne pas appeler un agrégateur qui pourrait inclure PENDING ou REJECTED.
  const approvedGrades = await prisma.grade.findMany({
    where: {
      studentId: student.id,
      status: "APPROVED",
      term: { in: TERMS.map((term) => term.key) },
    },
    select: {
      id: true,
      subject: true,
      score: true,
      coef: true,
      term: true,
      evaluationDate: true,
    },
    orderBy: [{ evaluationDate: "asc" }, { id: "asc" }],
  });

  const now = new Date();
  const currentYear = academicStartYear(now);
  const validYears = Array.from(
    new Set(approvedGrades.map((grade) => academicStartYear(grade.evaluationDate)))
  ).sort((a, b) => b - a);

  const { annee } = await searchParams;
  const yearParam = typeof annee === "string" && /^\d{4}$/.test(annee) ? Number(annee) : null;
  const allowedYears = Array.from(new Set([currentYear, ...validYears]));
  const selectedYear =
    yearParam !== null && allowedYears.includes(yearParam)
      ? yearParam
      : validYears.includes(currentYear)
        ? currentYear
        : (validYears[0] ?? currentYear);

  const selectedGrades = approvedGrades.filter(
    (grade) => academicStartYear(grade.evaluationDate) === selectedYear
  );

  // Sécurité de calcul : exclure les notes/coefficients corrompus et le signaler.
  const cleanGrades = selectedGrades.filter(
    (grade) =>
      Number.isFinite(grade.score) &&
      grade.score >= 0 &&
      grade.score <= 20 &&
      Number.isInteger(grade.coef) &&
      grade.coef > 0
  );
  const invalidCount = selectedGrades.length - cleanGrades.length;

  const periods = TERMS.map(({ key, label }) => buildTermSummary(key, label, cleanGrades));
  const hasInconsistentCoef = periods.some((period) => period.inconsistentCoef);
  const annualAverage =
    periods.every((period) => period.average !== null) && invalidCount === 0
      ? periods.reduce((sum, period) => sum + (period.average ?? 0), 0) / periods.length
      : null;

  const approvedCount = cleanGrades.length;
  const isComplete = annualAverage !== null;
  const academicLabel = `${selectedYear}–${selectedYear + 1}`;
  const yearOptions = Array.from(new Set([selectedYear, ...allowedYears])).sort((a, b) => b - a);

  return (
    <main className="relative mx-auto max-w-7xl space-y-6 pb-16 text-slate-100 print:max-w-none print:space-y-4 print:bg-white print:p-0 print:text-black">
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 right-0 h-72 w-72 rounded-full bg-violet-600/10 blur-[100px] print:hidden" />
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-72 h-64 w-64 rounded-full bg-sky-600/10 blur-[90px] print:hidden" />

      <header className="relative rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl md:p-8 print:hidden">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300">
              <ShieldCheck size={14} aria-hidden="true" /> Notes validées par l'administration
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              {isProfessional ? "Mon relevé de résultats" : "Mon bulletin scolaire"}
            </h1>
            <p className="text-sm text-slate-400">
              {learnerLabel} · {student.class.name} ({student.class.level}) · {academicLabel}
            </p>
          </div>
          <PrintButton />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
            <CalendarDays size={14} aria-hidden="true" /> Année de référence :
          </span>
          {yearOptions.map((year) => (
            <Link
              key={year}
              href={`/student/bulletin?annee=${year}`}
              aria-current={year === selectedYear ? "page" : undefined}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                year === selectedYear
                  ? "border-violet-400/50 bg-violet-500/20 text-white"
                  : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500 hover:text-white"
              }`}
            >
              {year}–{year + 1}
            </Link>
          ))}
        </div>
      </header>

      {(invalidCount > 0 || hasInconsistentCoef) && (
        <div role="alert" className="relative flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 print:border-black print:bg-white print:text-black">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <p>
            Certaines données doivent être vérifiées par l'administration.
            {invalidCount > 0 ? ` ${invalidCount} note(s) avec une valeur ou un coefficient invalide ont été écartées.` : ""}
            {hasInconsistentCoef ? " Des coefficients différents existent pour une même matière et un même trimestre : la moyenne générale concernée n'est pas calculée." : ""}
          </p>
        </div>
      )}

      <article className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl print:overflow-visible print:rounded-none print:border-0 print:bg-white print:shadow-none">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-6 sm:flex-row sm:items-center md:p-8 print:border-slate-300 print:p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="text-violet-400 print:text-black" size={22} aria-hidden="true" />
              <h2 className="text-xl font-extrabold text-white print:text-black">
                {isProfessional ? "Relevé de formation" : "Relevé de notes"}
              </h2>
            </div>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Notes approuvées · Année de référence {academicLabel}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm print:border-slate-300 print:bg-white">
            <p className="font-bold text-white print:text-black">{learnerLabel}</p>
            <p className="text-xs text-slate-400 print:text-slate-600">
              {student.class.name} · {student.class.level}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-slate-800 bg-slate-950/40 p-4 md:grid-cols-4 md:p-6 print:grid-cols-4 print:gap-2 print:border-slate-300 print:bg-white print:p-3">
          {periods.map((period) => (
            <div key={period.key} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center print:rounded-md print:border-slate-300 print:bg-white print:p-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 print:text-slate-700">{period.label}</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-white print:text-black">
                {formatScore(period.average)} <span className="text-xs font-normal text-slate-500 print:text-slate-600">/20</span>
              </p>
              <p className="mt-1 text-xs text-slate-400 print:text-slate-700">
                {period.gradesCount === 0 ? "Aucune note publiée" : period.average === null ? "Calcul à vérifier" : `${period.subjects.length} matière(s)`}
              </p>
            </div>
          ))}
          <div className="rounded-2xl border border-violet-500/40 bg-violet-500/15 p-4 text-center print:rounded-md print:border-slate-300 print:bg-white print:p-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-violet-200 print:text-slate-700">Moyenne annuelle</p>
            <p className="mt-2 text-2xl font-extrabold tabular-nums text-white print:text-black">
              {formatScore(annualAverage)} <span className="text-xs font-normal text-violet-200 print:text-slate-600">/20</span>
            </p>
            <p className="mt-1 text-xs text-violet-200 print:text-slate-700">{isComplete ? "3 trimestres renseignés" : "En attente des 3 trimestres"}</p>
          </div>
        </div>

        {approvedCount === 0 && (
          <div className="flex flex-col items-center gap-3 p-10 text-center print:p-5">
            <BookOpenCheck size={34} className="text-slate-500" aria-hidden="true" />
            <h3 className="font-bold text-white print:text-black">Aucune note approuvée pour cette année</h3>
            <p className="max-w-md text-sm text-slate-400 print:text-slate-700">
              Les résultats apparaîtront ici après validation administrative. Les notes en attente ou rejetées ne sont pas publiées.
            </p>
          </div>
        )}

        {periods.map((period) => (
          <section key={period.key} className="space-y-4 border-b border-slate-800 p-5 last:border-b-0 md:p-8 print:break-inside-avoid print:border-slate-300 print:p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-white print:text-black">
                <Award className="text-violet-400 print:text-black" size={18} aria-hidden="true" /> {period.label}
              </h3>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300 print:border-slate-300 print:bg-white print:text-black">
                {period.subjects.length} matière(s) · {period.gradesCount} note(s)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 print:overflow-visible print:rounded-none print:border-slate-300">
              <table className="w-full min-w-[550px] border-collapse text-left text-sm print:min-w-0 print:text-xs">
                <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-400 print:bg-slate-100 print:text-black">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Matière / module</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Notes validées</th>
                    <th scope="col" className="px-4 py-3 text-center font-semibold">Coef.</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Moyenne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 print:divide-slate-300 print:text-black">
                  {period.subjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm italic text-slate-500 print:text-slate-700">
                        Aucune note approuvée pour cette période.
                      </td>
                    </tr>
                  ) : (
                    period.subjects.map((subject) => (
                      <tr key={subject.subject} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                        <th scope="row" className="px-4 py-3 font-semibold text-white print:text-black">{subject.subject}</th>
                        <td className="px-4 py-3 tabular-nums text-slate-300 print:text-black">
                          {subject.notes.map((note) => formatScore(note)).join(" · ")}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums">{subject.coef ?? "À vérifier"}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-400 print:text-black">{formatScore(subject.average)} /20</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <footer className="flex flex-col gap-2 border-t border-slate-800 bg-slate-950/50 p-5 text-xs text-slate-400 md:p-6 print:border-slate-300 print:bg-white print:p-3 print:text-slate-700">
          <p className="flex items-center gap-2 font-semibold text-slate-300 print:text-black">
            <FileText size={15} aria-hidden="true" /> Relevé consultatif — non certifié
          </p>
          <p>Seules les notes approuvées sont affichées. La moyenne d'une matière est la moyenne arithmétique de ses évaluations ; la moyenne du trimestre est pondérée par les coefficients de matières. La moyenne annuelle est affichée uniquement lorsque les trois trimestres sont renseignés.</p>
          <p>La période de référence est calculée du 1er septembre au 31 août. L'établissement doit confirmer ce calendrier et ses règles de calcul avant toute émission d'un bulletin officiel.</p>
        </footer>
      </article>
    </main>
  );
}
