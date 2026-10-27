
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  BookOpen,
  Plus,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  GraduationCap,
  Users,
  Layers3,
  ArrowRight,
  ClipboardList,
  Lightbulb,
  FileQuestion,
  CheckCircle2,
  ShieldCheck,
  School,
  BookMarked,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ========================================
// TYPES
// ========================================

type SearchParams = {
  q?: string | string[];
  classId?: string | string[];
  subject?: string | string[];
};

type TeacherExercisesPageProps = {
  searchParams: Promise<SearchParams>;
};

// ========================================
// STYLES
// ========================================

const inputClass =
  "w-full rounded-xl border border-slate-700/70 " +
  "bg-[#08111f] px-4 py-3 text-sm text-white " +
  "outline-none transition " +
  "placeholder:text-slate-500 " +
  "focus:border-teal-400 focus:ring-2 " +
  "focus:ring-teal-400/10";

// ========================================
// MODÈLES PÉDAGOGIQUES
// Suggestions uniquement, non publiées.
// ========================================

const exerciseIdeas = [
  {
    id: "application",
    title: "Exercices d'application",
    description:
      "Proposer une série progressive pour consolider les notions étudiées en classe.",
    icon: BookOpen,
    label: "Entraînement",
    color: "text-sky-400",
    background: "bg-sky-500/10",
  },
  {
    id: "quiz",
    title: "Quiz de connaissances",
    description:
      "Vérifier la compréhension des élèves à travers des questions courtes.",
    icon: FileQuestion,
    label: "Autoévaluation",
    color: "text-violet-400",
    background: "bg-violet-500/10",
  },
  {
    id: "revision",
    title: "Série de révision",
    description:
      "Préparer les élèves aux évaluations en reprenant les notions essentielles.",
    icon: BookMarked,
    label: "Révision",
    color: "text-amber-400",
    background: "bg-amber-500/10",
  },
  {
    id: "approfondissement",
    title: "Travaux d'approfondissement",
    description:
      "Encourager les élèves à résoudre des situations plus complexes.",
    icon: Lightbulb,
    label: "Approfondissement",
    color: "text-teal-400",
    background: "bg-teal-500/10",
  },
];

// ========================================
// UTILITAIRES
// ========================================

function getParam(
  value: string | string[] | undefined
): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return "";
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111e30] p-5 transition hover:border-teal-500/25">
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-400">
          {icon}
        </div>
      </div>

      <p className="text-3xl font-extrabold tracking-tight text-white">
        {value.toLocaleString("fr-FR")}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

// ========================================
// PAGE : EXERCICES
// ========================================

export default async function TeacherExercisesPage({
  searchParams,
}: TeacherExercisesPageProps) {
  // ========================================
  // 1. AUTHENTIFICATION
  // ========================================

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
      name: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const isTeacher = user.role === "TEACHER";
  const isAdmin = user.role === "ADMIN";

  if (!isTeacher && !isAdmin) {
    redirect("/dashboard");
  }

  // ========================================
  // 2. PARAMÈTRES DE RECHERCHE
  // ========================================

  const params = await searchParams;

  const query = getParam(params.q)
    .trim()
    .slice(0, 80);

  const requestedClassId = getParam(params.classId);

  const requestedSubject = getParam(params.subject);

  // ========================================
  // 3. AFFECTATIONS RÉELLES
  // ========================================

  // Les enseignants voient uniquement leurs
  // propres affectations pédagogiques.
  //
  // Les administrateurs peuvent consulter
  // l'ensemble des affectations.
  const assignments =
    await prisma.teachingAssignment.findMany({
      where: isTeacher
        ? {
            teacherId: user.id,
          }
        : {},

      select: {
        id: true,
        classId: true,
        subject: true,

        class: {
          select: {
            id: true,
            name: true,
            level: true,

            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    });

  // ========================================
  // 4. CLASSES ET MATIÈRES DISTINCTES
  // ========================================

  // Une classe peut être présente plusieurs
  // fois si l'enseignant y dispense
  // plusieurs matières.
  const classes = Array.from(
    new Map(
      assignments.map((assignment) => [
        assignment.classId,
        assignment.class,
      ])
    ).values()
  ).sort(
    (a, b) =>
      a.level.localeCompare(b.level, "fr") ||
      a.name.localeCompare(b.name, "fr")
  );

  const subjects = Array.from(
    new Set(
      assignments.map((assignment) =>
        assignment.subject.trim()
      )
    )
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "fr"));

  const allowedClassIds = classes.map(
    (schoolClass) => schoolClass.id
  );

  const selectedClassId = allowedClassIds.includes(
    requestedClassId
  )
    ? requestedClassId
    : "";

  const selectedSubject = subjects.includes(
    requestedSubject
  )
    ? requestedSubject
    : "";

  // ========================================
  // 5. RECHERCHE ET FILTRAGE
  // ========================================

  const normalizedQuery = normalizeText(query);

  const filteredAssignments = assignments
    .filter((assignment) => {
      if (
        selectedClassId &&
        assignment.classId !== selectedClassId
      ) {
        return false;
      }

      if (
        selectedSubject &&
        assignment.subject.trim() !== selectedSubject
      ) {
        return false;
      }

      if (normalizedQuery) {
        const searchableText = normalizeText(
          [
            assignment.subject,
            assignment.class.name,
            assignment.class.level,
          ].join(" ")
        );

        if (!searchableText.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const levelComparison =
        a.class.level.localeCompare(
          b.class.level,
          "fr"
        );

      if (levelComparison !== 0) {
        return levelComparison;
      }

      const classComparison =
        a.class.name.localeCompare(
          b.class.name,
          "fr"
        );

      if (classComparison !== 0) {
        return classComparison;
      }

      return a.subject.localeCompare(
        b.subject,
        "fr"
      );
    });

  // ========================================
  // 6. STATISTIQUES
  // ========================================

  const classesCount = classes.length;

  const subjectsCount = subjects.length;

  const assignmentsCount = assignments.length;

  // Ne pas compter plusieurs fois les élèves
  // d'une même classe.
  const studentsCount = classes.reduce(
    (total, schoolClass) =>
      total + schoolClass._count.students,
    0
  );

  const hasAssignments = assignmentsCount > 0;

  const hasFilters = Boolean(
    query || selectedClassId || selectedSubject
  );

  // ========================================
  // 7. INTERFACE
  // ========================================

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 pb-12">
      {/* ===================================
          HEADER
      =================================== */}

      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
              <Sparkles size={14} />
              Espace pédagogique
            </div>

            <div>
              <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                <BookOpen
                  size={30}
                  className="shrink-0 text-teal-400"
                />
                Gestion des exercices
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Retrouvez vos classes et vos matières,
                préparez des exercices d'entraînement
                et organisez vos activités pédagogiques.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {isTeacher ? (
                <Link
                  href="/teacher/exercises/new"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400"
                >
                  <Plus size={18} />
                  Nouvel exercice
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <Link
                  href="/admin/assignments"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400"
                >
                  <School size={18} />
                  Gérer les affectations
                  <ArrowRight size={16} />
                </Link>
              )}

              <Link
                href="/teacher/assignments"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <ClipboardList size={17} />
                Mes devoirs
              </Link>
            </div>
          </div>

          {/* CARTE D'INFORMATION */}
          <div className="w-full rounded-2xl border border-teal-500/15 bg-[#08111f]/80 p-5 lg:w-[280px]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <GraduationCap size={23} />
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  Espace de préparation
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Organisation pédagogique
                </p>
              </div>
            </div>

            <p className="text-xs leading-6 text-slate-400">
              {isAdmin
                ? "Consultez les classes et les matières attribuées aux enseignants."
                : "Préparez vos exercices à partir des classes et des matières qui vous sont attribuées."}
            </p>

            <div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-4 text-xs font-semibold text-teal-400">
              <ShieldCheck size={16} />
              Affectations vérifiées
            </div>
          </div>
        </div>
      </section>

      {/* ===================================
          STATISTIQUES
      =================================== */}

      <section
        aria-label="Statistiques pédagogiques"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={<GraduationCap size={21} />}
          label="Classes"
          value={classesCount}
          description="Classes distinctes accessibles"
        />

        <StatCard
          icon={<BookOpen size={21} />}
          label="Matières"
          value={subjectsCount}
          description="Disciplines attribuées"
        />

        <StatCard
          icon={<Users size={21} />}
          label="Élèves"
          value={studentsCount}
          description="Effectif des classes accessibles"
        />

        <StatCard
          icon={<Layers3 size={21} />}
          label="Affectations"
          value={assignmentsCount}
          description="Couples classe et matière"
        />
      </section>

      {/* ===================================
          RECHERCHE ET FILTRES
      =================================== */}

      <section className="rounded-3xl border border-slate-800 bg-[#111e30] p-5 shadow-lg md:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
            <Filter size={19} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">
              Recherche et filtres
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Retrouvez une classe ou une matière.
            </p>
          </div>
        </div>

        <form
          method="GET"
          action="/teacher/exercises"
          className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto]"
        >
          {/* RECHERCHE */}
          <div>
            <label
              htmlFor="exercise-search"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Recherche
            </label>

            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="exercise-search"
                name="q"
                type="search"
                maxLength={80}
                defaultValue={query}
                placeholder="Classe, matière, niveau..."
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          {/* CLASSE */}
          <div>
            <label
              htmlFor="exercise-class"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Classe
            </label>

            <select
              id="exercise-class"
              name="classId"
              defaultValue={selectedClassId}
              className={inputClass}
            >
              <option value="">Toutes les classes</option>

              {classes.map((schoolClass) => (
                <option
                  key={schoolClass.id}
                  value={schoolClass.id}
                >
                  {schoolClass.name} — {schoolClass.level}
                </option>
              ))}
            </select>
          </div>

          {/* MATIÈRE */}
          <div>
            <label
              htmlFor="exercise-subject"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Matière
            </label>

            <select
              id="exercise-subject"
              name="subject"
              defaultValue={selectedSubject}
              className={inputClass}
            >
              <option value="">Toutes les matières</option>

              {subjects.map((subject) => (
                <option
                  key={subject}
                  value={subject}
                >
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* BOUTONS */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400"
            >
              <Search size={17} />
              Filtrer
            </button>

            <Link
              href="/teacher/exercises"
              title="Réinitialiser les filtres"
              aria-label="Réinitialiser les filtres"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 px-3 text-slate-300 transition hover:bg-slate-700"
            >
              <RefreshCw size={17} />
            </Link>
          </div>
        </form>
      </section>

      {/* ===================================
          AFFECTATIONS PÉDAGOGIQUES
      =================================== */}

      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Layers3
                size={19}
                className="text-teal-400"
              />
              Classes et matières
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredAssignments.length} affectation(s)
              affichée(s)
            </p>
          </div>

          <span className="rounded-full border border-slate-700 bg-[#08111f] px-3 py-1.5 text-xs font-semibold text-slate-300">
            Données PostgreSQL
          </span>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
              <BookOpen size={30} />
            </div>

            <h3 className="text-base font-bold text-white">
              {!hasAssignments
                ? "Aucune affectation pédagogique"
                : "Aucun résultat trouvé"}
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
              {!hasAssignments
                ? isAdmin
                  ? "Aucune classe ou matière n'a encore été attribuée aux enseignants."
                  : "Votre administration doit vous attribuer une classe et une matière avant la préparation de vos activités."
                : "Aucune affectation ne correspond aux critères sélectionnés."}
            </p>

            {hasFilters && (
              <Link
                href="/teacher/exercises"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/10 px-4 py-2.5 text-xs font-bold text-teal-300"
              >
                <RefreshCw size={15} />
                Effacer les filtres
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredAssignments.map((assignment) => (
              <article
                key={assignment.id}
                className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-[#08111f] p-5 transition-all duration-300 hover:border-teal-500/30"
              >
                {/* EN-TÊTE CARTE */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/15 bg-teal-500/10 text-teal-400">
                    <BookOpen size={23} />
                  </div>

                  <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                    {assignment.class.level}
                  </span>
                </div>

                {/* INFORMATIONS */}
                <div className="mt-5 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                    Matière enseignée
                  </p>

                  <h3 className="mt-2 break-words text-lg font-bold text-white">
                    {assignment.subject}
                  </h3>

                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                    <GraduationCap
                      size={17}
                      className="shrink-0 text-sky-400"
                    />

                    <span>{assignment.class.name}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <Users size={16} />

                    <span>
                      {assignment.class._count.students} élève(s)
                      dans cette classe
                    </span>
                  </div>
                </div>

                {/* ACTION */}
                <div className="mt-5 border-t border-slate-800 pt-4">
                  <Link
                    href={`/teacher/students?classId=${encodeURIComponent(assignment.classId)}`}
                    className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 transition hover:text-teal-300"
                  >
                    Consulter les élèves
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ===================================
          SUGGESTIONS DE SÉRIES
      =================================== */}

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Lightbulb
                size={21}
                className="text-teal-400"
              />
              Idées d'exercices
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Des suggestions pour préparer vos
              prochaines activités pédagogiques.
            </p>
          </div>

          <span className="rounded-full border border-slate-700 bg-[#111e30] px-3 py-1.5 text-xs text-slate-400">
            Modèles non publiés
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {exerciseIdeas.map((idea) => {
            const Icon = idea.icon;

            return (
              <article
                key={idea.id}
                className="flex flex-col rounded-3xl border border-slate-800 bg-[#111e30] p-5 transition-all duration-300 hover:border-teal-500/25"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${idea.background} ${idea.color}`}
                >
                  <Icon size={23} />
                </div>

                <p
                  className={`mt-5 text-[11px] font-bold uppercase tracking-wider ${idea.color}`}
                >
                  {idea.label}
                </p>

                <h3 className="mt-2 text-base font-bold text-white">
                  {idea.title}
                </h3>

                <p className="mt-3 flex-1 text-xs leading-6 text-slate-400">
                  {idea.description}
                </p>

                {isTeacher && (
                  <Link
                    href="/teacher/exercises/new"
                    className="mt-5 inline-flex items-center gap-2 border-t border-slate-800 pt-4 text-xs font-bold text-teal-400 transition hover:text-teal-300"
                  >
                    Préparer un exercice
                    <ArrowRight size={15} />
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* ===================================
          PARCOURS DE PUBLICATION
      =================================== */}

      <section className="rounded-3xl border border-teal-500/15 bg-gradient-to-br from-[#102a35] to-[#111e30] p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
            <ClipboardList size={21} />
          </div>

          <div>
            <h2 className="text-base font-bold text-white">
              Préparer une activité pédagogique
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Les étapes recommandées pour
              organiser vos exercices.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              number: "01",
              title: "Choisir la classe",
              description:
                "Sélectionner une classe et une matière autorisées.",
            },
            {
              number: "02",
              title: "Préparer les questions",
              description:
                "Définir les consignes, les questions et les ressources.",
            },
            {
              number: "03",
              title: "Publier l'activité",
              description:
                "Vérifier le contenu avant sa diffusion aux élèves.",
            },
          ].map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-white/10 bg-[#08111f]/60 p-5"
            >
              <span className="text-sm font-extrabold text-teal-400">
                {step.number}
              </span>

              <h3 className="mt-3 text-sm font-bold text-white">
                {step.title}
              </h3>

              <p className="mt-2 text-xs leading-6 text-slate-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================
          RAPPEL DE SÉCURITÉ
      =================================== */}

      <section className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-[#111e30] p-5">
        <ShieldCheck
          size={20}
          className="mt-0.5 shrink-0 text-teal-400"
        />

        <div>
          <h3 className="text-sm font-bold text-white">
            Gestion sécurisée des exercices
          </h3>

          <p className="mt-2 text-xs leading-6 text-slate-400">
            Les affectations affichées sont vérifiées
            à partir de votre compte.
            La création, la modification et la
            publication d'exercices doivent également
            être contrôlées côté serveur afin de
            limiter les opérations aux classes
            et matières autorisées.
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs text-teal-400">
            <CheckCircle2 size={15} />
            Consultation des affectations sécurisée
          </div>
        </div>
      </section>
    </div>
  );
}
