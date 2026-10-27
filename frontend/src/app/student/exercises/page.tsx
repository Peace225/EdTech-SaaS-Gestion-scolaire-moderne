// src/app/student/exercises/page.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Layers3,
  PenTool,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
  subject?: string | string[];
  difficulty?: string | string[];
  sort?: string | string[];
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

type Difficulty = "STANDARD" | "INTERMEDIATE" | "ADVANCED";

type Sort = "recent" | "oldest" | "level" | "subject";

const difficultyMeta: Record<
  Difficulty,
  { label: string; step: string; badgeClass: string; accentClass: string; order: number }
> = {
  STANDARD: {
    label: "Fondamentaux",
    step: "Étape 1",
    badgeClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    accentClass: "text-emerald-400",
    order: 0,
  },
  INTERMEDIATE: {
    label: "Intermédiaire",
    step: "Étape 2",
    badgeClass: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    accentClass: "text-amber-400",
    order: 1,
  },
  ADVANCED: {
    label: "Avancé",
    step: "Étape 3",
    badgeClass: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    accentClass: "text-violet-400",
    order: 2,
  },
};

function first(value: string | string[] | undefined): string {
  return typeof value === "string"
    ? value
    : Array.isArray(value)
      ? (value[0] ?? "")
      : "";
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
}

function InfoCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111e30]/90 p-5 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        <span className="text-teal-400">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export default async function StudentExercisesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Le rôle est toujours vérifié dans la base, pas dans un objet de session casté.
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser) redirect("/login");
  if (currentUser.role !== "STUDENT") {
    if (currentUser.role === "ADMIN") redirect("/admin/dashboard");
    if (currentUser.role === "TEACHER") redirect("/teacher/dashboard");
    if (currentUser.role === "PARENT") redirect("/parent/dashboard");
    redirect("/login");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      classId: true,
      class: { select: { name: true, level: true, educationType: true } },
    },
  });

  if (!student) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
        <AlertCircle className="mx-auto mb-4 text-amber-400" size={32} />
        <h1 className="text-xl font-bold text-white">Dossier apprenant non disponible</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Ton compte existe, mais il n'est pas encore associé à une classe ou une promotion.
          Contacte l'administration pour finaliser ton inscription.
        </p>
        <Link href="/student/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          Retour au tableau de bord <ArrowRight size={15} />
        </Link>
      </section>
    );
  }

  const isProfessional = student.class.educationType === "PROFESSIONAL";
  const params = await searchParams;
  const query = first(params.q).trim().slice(0, 120);
  const requestedSubject = first(params.subject);
  const requestedDifficulty = first(params.difficulty);
  const requestedSort = first(params.sort);

  const exercises = await prisma.exercise.findMany({
    where: {
      status: "PUBLISHED",
      assignment: { is: { classId: student.classId } },
    },
    select: {
      id: true,
      title: true,
      description: true,
      difficulty: true,
      createdAt: true,
      publishedAt: true,
      assignment: {
        select: {
          subject: true,
          teacher: { select: { name: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });

  const subjects = Array.from(
    new Set(exercises.map((exercise) => exercise.assignment.subject)),
  ).sort((a, b) => a.localeCompare(b, "fr"));

  const selectedSubject = subjects.includes(requestedSubject) ? requestedSubject : "";
  const selectedDifficulty: Difficulty | "" =
    requestedDifficulty === "STANDARD" ||
    requestedDifficulty === "INTERMEDIATE" ||
    requestedDifficulty === "ADVANCED"
      ? requestedDifficulty
      : "";
  const sort: Sort =
    requestedSort === "oldest" ||
    requestedSort === "level" ||
    requestedSort === "subject"
      ? requestedSort
      : "recent";

  const normalizedQuery = fold(query);
  const filtered = exercises
    .filter((exercise) => {
      if (selectedSubject && exercise.assignment.subject !== selectedSubject) return false;
      if (selectedDifficulty && exercise.difficulty !== selectedDifficulty) return false;
      if (!normalizedQuery) return true;
      const searchable = fold(
        [
          exercise.title,
          exercise.description,
          exercise.assignment.subject,
          exercise.assignment.teacher.name ?? "",
        ].join(" "),
      );
      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (sort === "level") {
        return (
          difficultyMeta[a.difficulty].order - difficultyMeta[b.difficulty].order ||
          a.title.localeCompare(b.title, "fr")
        );
      }
      if (sort === "subject") {
        return (
          a.assignment.subject.localeCompare(b.assignment.subject, "fr") ||
          a.title.localeCompare(b.title, "fr")
        );
      }
      const delta = a.createdAt.getTime() - b.createdAt.getTime();
      return sort === "oldest" ? delta : -delta;
    });

  const counts: Record<Difficulty, number> = {
    STANDARD: 0,
    INTERMEDIATE: 0,
    ADVANCED: 0,
  };
  for (const exercise of exercises) counts[exercise.difficulty]++;

  const hasFilters = Boolean(query || selectedSubject || selectedDifficulty || sort !== "recent");
  const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="relative mx-auto max-w-7xl space-y-7 pb-12 text-slate-100">
      <div className="pointer-events-none absolute -right-4 top-0 -z-0 h-60 w-60 rounded-full bg-teal-500/10 blur-[90px]" />

      {/* En-tête */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#12243b] via-[#0d1a2d] to-[#08111f] p-6 shadow-xl shadow-black/10 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-300">
              <Sparkles size={14} /> Entraînement progressif
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {isProfessional ? "Exercices pratiques & entraînements" : "Mes exercices & entraînements"}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Entraîne-toi à ton rythme avec les exercices publiés par tes {isProfessional ? "formateurs" : "enseignants"}.
              Commence par les fondamentaux, puis progresse vers les niveaux supérieurs.
            </p>
            <p className="inline-flex max-w-full items-center gap-2 text-xs text-slate-400">
              <GraduationCap size={15} className="shrink-0 text-teal-400" />
              <span className="truncate">
                {isProfessional ? "Formation" : "Classe"} : {student.class.name}
                {student.class.level ? ` · ${isProfessional ? "Promotion" : "Niveau"} : ${student.class.level}` : ""}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4">
            <div className="rounded-xl bg-teal-500/10 p-3 text-teal-400"><PenTool size={25} /></div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Exercices publiés</p>
              <p className="text-3xl font-extrabold text-white">{exercises.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Indicateurs réels */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard icon={<BookOpen size={19} />} label={isProfessional ? "Modules concernés" : "Matières concernées"} value={subjects.length} description="Enseignements avec exercices publiés" />
        <InfoCard icon={<Target size={19} />} label="Fondamentaux" value={counts.STANDARD} description="Pour acquérir les bases" />
        <InfoCard icon={<Layers3 size={19} />} label="Intermédiaires" value={counts.INTERMEDIATE} description="Pour consolider les acquis" />
        <InfoCard icon={<GraduationCap size={19} />} label="Avancés" value={counts.ADVANCED} description="Pour approfondir la pratique" />
      </div>

      {/* Parcours conseillé, non verrouillé et sans prétendre suivre les acquis */}
      <section className="rounded-3xl border border-slate-800 bg-[#111e30]/70 p-5 sm:p-6" aria-labelledby="path-title">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="path-title" className="flex items-center gap-2 text-base font-bold text-white"><Target size={18} className="text-teal-400" /> Parcours conseillé</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">Trois niveaux de difficulté pour organiser tes entraînements. Ce parcours n'est pas un suivi de progression enregistré.</p>
          </div>
          <Link href="/student/courses" className="inline-flex items-center gap-2 text-xs font-semibold text-teal-300 hover:text-teal-200">
            Accéder aux cours <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {(["STANDARD", "INTERMEDIATE", "ADVANCED"] as const).map((level) => (
            <Link key={level} href={`/student/exercises?difficulty=${level}&sort=level`} className="group flex items-center justify-between rounded-2xl border border-slate-700/60 bg-slate-950/45 p-4 transition hover:border-teal-500/40 hover:bg-slate-900/70">
              <span>
                <span className={`block text-xs font-bold ${difficultyMeta[level].accentClass}`}>{difficultyMeta[level].step}</span>
                <span className="mt-1 block text-sm font-bold text-white">{difficultyMeta[level].label}</span>
                <span className="mt-1 block text-xs text-slate-400">{counts[level]} exercice{counts[level] > 1 ? "s" : ""}</span>
              </span>
              <ArrowRight size={18} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-teal-400" />
            </Link>
          ))}
        </div>
      </section>

      {/* Filtres GET : aucun JavaScript client requis */}
      <section className="rounded-3xl border border-slate-800 bg-[#111e30]/70 p-5 sm:p-6" aria-label="Rechercher et filtrer les exercices">
        <form action="/student/exercises" method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
          <label className="block min-w-0 space-y-2">
            <span className="text-xs font-semibold text-slate-300">Rechercher</span>
            <span className="relative block">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input name="q" type="search" maxLength={120} defaultValue={query} placeholder="Titre, consigne, matière..." className="w-full min-w-0 rounded-xl border border-slate-700 bg-[#08111f] py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15" />
            </span>
          </label>
          <label className="block min-w-0 space-y-2">
            <span className="text-xs font-semibold text-slate-300">{isProfessional ? "Module" : "Matière"}</span>
            <select name="subject" defaultValue={selectedSubject} className="w-full min-w-0 rounded-xl border border-slate-700 bg-[#08111f] px-3 py-3 text-sm text-white outline-none focus:border-teal-500">
              <option value="">Tous les {isProfessional ? "modules" : "enseignements"}</option>
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </label>
          <label className="block min-w-0 space-y-2">
            <span className="text-xs font-semibold text-slate-300">Difficulté</span>
            <select name="difficulty" defaultValue={selectedDifficulty} className="w-full min-w-0 rounded-xl border border-slate-700 bg-[#08111f] px-3 py-3 text-sm text-white outline-none focus:border-teal-500">
              <option value="">Tous les niveaux</option>
              {(["STANDARD", "INTERMEDIATE", "ADVANCED"] as const).map((level) => <option key={level} value={level}>{difficultyMeta[level].label}</option>)}
            </select>
          </label>
          <label className="block min-w-0 space-y-2">
            <span className="text-xs font-semibold text-slate-300">Trier par</span>
            <select name="sort" defaultValue={sort} className="w-full min-w-0 rounded-xl border border-slate-700 bg-[#08111f] px-3 py-3 text-sm text-white outline-none focus:border-teal-500">
              <option value="recent">Plus récents</option>
              <option value="oldest">Plus anciens</option>
              <option value="level">Difficulté croissante</option>
              <option value="subject">{isProfessional ? "Module" : "Matière"} (A–Z)</option>
            </select>
          </label>
          <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-[#08111f] transition hover:bg-teal-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300">
            <Search size={16} /> Filtrer
          </button>
        </form>
        {hasFilters && (
          <Link href="/student/exercises" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white">
            <RotateCcw size={13} /> Réinitialiser les filtres
          </Link>
        )}
      </section>

      {/* Exercices réellement accessibles à l'apprenant */}
      <section className="space-y-4" aria-labelledby="exercises-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="exercises-title" className="text-lg font-extrabold text-white">Exercices disponibles</h2>
          <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1.5 text-xs font-medium text-slate-400">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-[#111e30]/60 px-6 py-14 text-center">
            <ClipboardList size={32} className="mx-auto mb-4 text-slate-500" />
            <h3 className="text-base font-bold text-white">
              {exercises.length === 0 ? "Aucun exercice publié pour le moment" : "Aucun exercice ne correspond aux filtres"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              {exercises.length === 0
                ? `Les ${isProfessional ? "formateurs" : "enseignants"} de ta ${isProfessional ? "promotion" : "classe"} n'ont pas encore publié d'exercices.`
                : "Essaie d'élargir ta recherche ou de retirer certains filtres."}
            </p>
            {hasFilters && (
              <Link href="/student/exercises" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-bold text-[#08111f] hover:bg-teal-400">
                <RotateCcw size={15} /> Tout afficher
              </Link>
            )}
          </div>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {filtered.map((exercise) => {
              const difficulty = difficultyMeta[exercise.difficulty];
              const date = exercise.publishedAt ?? exercise.createdAt;
              return (
                <article key={exercise.id} className="min-w-0 overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30]/85 shadow-lg shadow-black/10 transition-colors hover:border-teal-500/30">
                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">{exercise.assignment.subject}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${difficulty.badgeClass}`}>{difficulty.label}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                        <CheckCircle2 size={12} /> Publié
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold leading-snug text-white">{exercise.title}</h3>
                      <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-400">{exercise.description}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-2"><UserRound size={15} className="text-slate-500" /> {exercise.assignment.teacher.name?.trim() || (isProfessional ? "Formateur non renseigné" : "Enseignant non renseigné")}</span>
                      <span className="inline-flex items-center gap-2"><CalendarDays size={15} className="text-slate-500" /> {dateFormatter.format(date)}</span>
                    </div>
                  </div>

                  <details className="group border-t border-slate-800 bg-[#0b1727]/70">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-teal-300 transition hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-400 sm:px-6 [&::-webkit-details-marker]:hidden">
                      <span className="inline-flex items-center gap-2"><BookOpen size={17} /> Lire les consignes et commencer</span>
                      <ChevronDown size={17} className="shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-slate-800/80 px-5 pb-6 pt-5 sm:px-6">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Énoncé de l'exercice</p>
                      <div className="whitespace-pre-wrap break-words rounded-2xl border border-slate-700/60 bg-[#08111f] p-4 text-sm leading-7 text-slate-200">{exercise.description}</div>
                      <p className="mt-4 text-xs leading-5 text-slate-500">
                        Cet exercice est disponible en lecture et en entraînement personnel. Les réponses, la correction automatique et le suivi individuel ne sont pas encore enregistrés par ce module.
                      </p>
                      <Link href="/student/courses" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-teal-300 hover:text-teal-200">
                        Revoir les cours <ArrowRight size={14} />
                      </Link>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.05] p-4 text-xs leading-6 text-slate-400">
        <p className="font-semibold text-blue-200">À propos de tes résultats</p>
        <p className="mt-1">
          Les niveaux affichés correspondent à la difficulté choisie par le formateur, et non à une note personnelle.
          Pour une évaluation notée avec sauvegarde du résultat, utilise les évaluations publiées dans les cours progressifs.
        </p>
      </aside>
    </div>
  );
}
