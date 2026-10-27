// src/app/parent/reports/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CalendarDays,
  FileText,
  GraduationCap,
  Info,
  ShieldCheck,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ year?: string | string[] }>;
};

type ApprovedGrade = {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  coef: number;
  term: string;
  evaluationDate: Date;
};

const TERMS = [
  { code: "T1", label: "Trimestre 1" },
  { code: "T2", label: "Trimestre 2" },
  { code: "T3", label: "Trimestre 3" },
] as const;

const numberFormat = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});

// Convention provisoire : septembre -> août. Le schéma Grade ne stocke
// pas encore l'année académique officielle de l'établissement.
function getAcademicYearStart(date: Date): number {
  const year = date.getUTCFullYear();
  return date.getUTCMonth() >= 8 ? year : year - 1;
}

function getWeightedAverage(grades: ApprovedGrade[]): number | null {
  let weightedTotal = 0;
  let coefficientsTotal = 0;

  for (const grade of grades) {
    if (
      !Number.isFinite(grade.score) ||
      grade.score < 0 ||
      grade.score > 20 ||
      !Number.isFinite(grade.coef) ||
      grade.coef <= 0
    ) {
      continue;
    }

    weightedTotal += grade.score * grade.coef;
    coefficientsTotal += grade.coef;
  }

  return coefficientsTotal > 0
    ? weightedTotal / coefficientsTotal
    : null;
}

function scoreLabel(score: number | null): string {
  return score === null ? "—" : numberFormat.format(score);
}

function displayName(name: string | null, email: string | null): string {
  return name?.trim() || email?.split("@")[0] || "Apprenant";
}

export default async function ParentReportsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Le rôle est vérifié en base : aucun accès implicite pour un ADMIN.
  const parent = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (parent?.role !== "PARENT") notFound();

  // Le rattachement parent-enfant est imposé côté serveur.
  const children = await prisma.student.findMany({
    where: { parentId: parent.id },
    select: {
      id: true,
      user: { select: { name: true, email: true } },
      class: {
        select: { name: true, level: true, educationType: true },
      },
    },
    orderBy: { id: "asc" },
  });

  const studentIds = children.map((child) => child.id);

  // Les notes non approuvées ne quittent jamais la base de données.
  const approvedGrades: ApprovedGrade[] = studentIds.length
    ? await prisma.grade.findMany({
        where: {
          studentId: { in: studentIds },
          status: "APPROVED",
          term: { in: TERMS.map((term) => term.code) },
        },
        select: {
          id: true,
          studentId: true,
          subject: true,
          score: true,
          coef: true,
          term: true,
          evaluationDate: true,
        },
        orderBy: [
          { evaluationDate: "desc" },
          { id: "desc" },
        ],
      })
    : [];

  const availableYears = Array.from(
    new Set(approvedGrades.map((grade) => getAcademicYearStart(grade.evaluationDate)))
  ).sort((a, b) => b - a);

  const query = await searchParams;
  const requested = Array.isArray(query.year) ? query.year[0] : query.year;
  const requestedYear =
    requested && /^\d{4}$/.test(requested) ? Number(requested) : null;

  const selectedYear =
    requestedYear !== null && availableYears.includes(requestedYear)
      ? requestedYear
      : (availableYears[0] ?? null);

  const currentGrades = selectedYear === null
    ? []
    : approvedGrades.filter(
        (grade) => getAcademicYearStart(grade.evaluationDate) === selectedYear
      );

  const gradesByStudent = new Map<string, ApprovedGrade[]>();
  for (const grade of currentGrades) {
    const studentGrades = gradesByStudent.get(grade.studentId) ?? [];
    studentGrades.push(grade);
    gradesByStudent.set(grade.studentId, studentGrades);
  }

  const studentsWithResults = children.filter(
    (child) => (gradesByStudent.get(child.id)?.length ?? 0) > 0
  ).length;

  return (
    <div className="relative mx-auto max-w-7xl space-y-7 pb-16 text-slate-100 print:max-w-none print:space-y-4 print:bg-white print:text-black">
      <div className="pointer-events-none absolute right-12 top-4 -z-10 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl print:hidden" />
      <div className="pointer-events-none absolute left-10 top-64 -z-10 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl print:hidden" />

      <header className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl md:p-8 print:hidden">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300">
              <ShieldCheck size={14} /> Notes validées par l'administration
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              Bulletins et relevés de notes
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
              Consultez les résultats approuvés de vos enfants ou apprenants.
              Les moyennes présentées ici sont indicatives et ne constituent
              pas un bulletin officiel certifié.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
              <Users size={18} className="text-violet-400" />
              <span>{children.length} profil(s)</span>
            </div>
            <PrintButton />
          </div>
        </div>
      </header>

      <h2 className="hidden text-xl font-bold print:block">
        Relevés de notes — consultation familiale
      </h2>

      {availableYears.length > 0 && (
        <section className="space-y-3 print:hidden" aria-label="Année académique">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <CalendarDays size={16} className="text-sky-400" />
            Période de consultation
          </div>
          <div className="flex flex-wrap gap-2">
            {availableYears.map((year) => {
              const active = year === selectedYear;
              return (
                <Link
                  key={year}
                  href={`/parent/reports?year=${year}`}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "border-sky-400 bg-sky-500/15 text-sky-200"
                      : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {year}–{year + 1}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {children.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center print:border-gray-300 print:bg-white">
          <Users size={36} className="mx-auto mb-4 text-sky-400" />
          <h2 className="text-xl font-bold text-white print:text-black">
            Aucun enfant rattaché
          </h2>
          <p className="mt-2 text-sm text-slate-400 print:text-gray-600">
            Contactez l'administration pour rattacher les profils à votre compte.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 print:hidden">
            {[
              { label: "Profils rattachés", value: children.length, icon: Users },
              { label: "Avec résultats sur la période", value: studentsWithResults, icon: GraduationCap },
              { label: "Notes approuvées sur la période", value: currentGrades.length, icon: Award },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                <Icon size={20} className="mb-3 text-violet-300" />
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          {selectedYear !== null && (
            <p className="flex items-start gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs leading-relaxed text-sky-100 print:border-gray-300 print:bg-white print:text-gray-700">
              <Info size={17} className="mt-0.5 shrink-0" />
              Année {selectedYear}–{selectedYear + 1} déduite des dates des évaluations
              (septembre à août). Cette convention est provisoire jusqu'à l'ajout
              d'une année académique officielle dans les données de l'établissement.
            </p>
          )}

          <div className="space-y-6">
            {children.map((child) => {
              const studentGrades = gradesByStudent.get(child.id) ?? [];
              const name = displayName(child.user.name, child.user.email);
              const professional = child.class.educationType === "PROFESSIONAL";

              return (
                <article
                  key={child.id}
                  className="break-inside-avoid overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-xl print:border-gray-300 print:bg-white print:shadow-none"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-800 p-6 md:flex-row md:items-center md:justify-between print:border-gray-300">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300 print:text-black">
                        <GraduationCap size={24} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-bold text-white print:text-black">
                          {name}
                        </h2>
                        <p className="text-xs text-slate-400 print:text-gray-600">
                          {professional ? "Formation / promotion" : "Classe"} : {child.class.name}
                          {child.class.level ? ` · ${child.class.level}` : ""}
                          {selectedYear !== null ? ` · ${selectedYear}–${selectedYear + 1}` : ""}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/parent/child/${encodeURIComponent(child.id)}`}
                      className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-slate-200 print:hidden"
                    >
                      Voir le dossier <ArrowRight size={15} />
                    </Link>
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-3 md:p-6 print:grid-cols-3">
                    {TERMS.map((term) => {
                      const grades = studentGrades.filter((grade) => grade.term === term.code);
                      const average = getWeightedAverage(grades);
                      const subjectsCount = new Set(grades.map((grade) => grade.subject)).size;

                      return (
                        <div
                          key={term.code}
                          className="min-w-0 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 print:border-gray-300 print:bg-white"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wide text-violet-300 print:text-black">
                              {term.label}
                            </span>
                            <FileText size={16} className="text-slate-500 print:text-gray-500" />
                          </div>

                          {average === null ? (
                            <div className="space-y-1">
                              <p className="text-lg font-bold text-slate-400 print:text-gray-600">
                                Pas de résultat
                              </p>
                              <p className="text-xs text-slate-500 print:text-gray-600">
                                Aucune note approuvée pour cette période.
                              </p>
                            </div>
                          ) : (
                            <>
                              <div>
                                <p className="text-2xl font-extrabold text-white print:text-black">
                                  {scoreLabel(average)}
                                  <span className="ml-1 text-xs font-normal text-slate-400 print:text-gray-600">/20</span>
                                </p>
                                <p className="mt-1 text-[11px] text-slate-400 print:text-gray-600">
                                  Moyenne pondérée indicative · {grades.length} note(s) · {subjectsCount} matière(s)
                                </p>
                              </div>
                              <div className="space-y-2 border-t border-slate-800 pt-3 print:border-gray-300">
                                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 print:text-gray-600">
                                  <BookOpenCheck size={13} /> Dernières évaluations
                                </p>
                                {grades.slice(0, 3).map((grade) => (
                                  <div key={grade.id} className="flex items-start justify-between gap-2 text-xs">
                                    <span className="min-w-0 break-words text-slate-300 print:text-black">
                                      {grade.subject}
                                    </span>
                                    <span className="shrink-0 font-bold tabular-nums text-emerald-300 print:text-black">
                                      {scoreLabel(grade.score)}/20
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <p className="text-xs leading-relaxed text-slate-500 print:text-gray-700">
        Ce relevé est destiné à la consultation familiale. Il affiche uniquement
        les notes approuvées par l'administration. Les moyennes sont calculées
        à partir des coefficients des évaluations enregistrées. Un bulletin officiel
        signé ou un PDF certifié nécessite un mécanisme distinct de publication
        par l'établissement.
      </p>
    </div>
  );
}
