import type { ReactNode } from "react";
import type {
  Prisma,
  HomeworkStatus,
  HomeworkType,
} from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  ClipboardList,
  Plus,
  Sparkles,
  Clock3,
  FileUp,
  MonitorPlay,
  BookOpen,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  CalendarDays,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";

import {
  publishHomeworkAction,
  archiveHomeworkAction,
  restoreHomeworkAction,
} from "./actions";

import { HomeworkActionButton } from "./HomeworkActionButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type SearchParams = {
  q?: string | string[];
  classId?: string | string[];
  type?: string | string[];
  status?: string | string[];
  page?: string | string[];
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const inputClass =
  "w-full rounded-xl border border-slate-700/70 " +
  "bg-[#08111f] px-4 py-3 text-sm text-white " +
  "outline-none transition placeholder:text-slate-500 " +
  "focus:border-teal-400 focus:ring-2 " +
  "focus:ring-teal-400/10";

function getParam(
  value: string | string[] | undefined
) {
  return typeof value === "string"
    ? value
    : Array.isArray(value)
      ? value[0] ?? ""
      : "";
}

function formatDate(date: Date | null) {
  if (!date) return "Non définie";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function StatCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111e30] p-5 transition hover:border-teal-500/30">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </span>

        <span className="rounded-xl bg-teal-500/10 p-2.5 text-teal-400">
          {icon}
        </span>
      </div>

      <p className="text-3xl font-extrabold text-white">
        {value.toLocaleString("fr-FR")}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: HomeworkStatus;
}) {
  const styles = {
    DRAFT:
      "border-amber-500/20 bg-amber-500/10 text-amber-300",
    PUBLISHED:
      "border-teal-500/20 bg-teal-500/10 text-teal-300",
    ARCHIVED:
      "border-slate-700 bg-slate-800 text-slate-400",
  };

  const labels = {
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    ARCHIVED: "Archivé",
  };

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default async function TeacherAssignmentsPage({
  searchParams,
}: PageProps) {
  // ========================================
  // 1. AUTHENTIFICATION ET ROLE
  // ========================================

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (
    user.role !== "TEACHER" &&
    user.role !== "ADMIN"
  ) {
    redirect("/dashboard");
  }

  const isTeacher = user.role === "TEACHER";

  // ========================================
  // 2. FILTRES
  // ========================================

  const params = await searchParams;

  const query = getParam(params.q)
    .trim()
    .slice(0, 80);

  const requestedClassId = getParam(params.classId);
  const requestedStatus = getParam(params.status);
  const requestedType = getParam(params.type);

  const validStatuses = [
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED",
  ];

  const validTypes = ["UPLOAD", "ONLINE"];

  const selectedStatus = validStatuses.includes(
    requestedStatus
  )
    ? (requestedStatus as HomeworkStatus)
    : undefined;

  const selectedType = validTypes.includes(
    requestedType
  )
    ? (requestedType as HomeworkType)
    : undefined;

  const rawPage = Number.parseInt(
    getParam(params.page) || "1",
    10
  );

  const requestedPage =
    Number.isFinite(rawPage) && rawPage > 0
      ? Math.min(rawPage, 100000)
      : 1;

  // ========================================
  // 3. CLASSES ACCESSIBLES
  // ========================================

  const assignments =
    await prisma.teachingAssignment.findMany({
      where: isTeacher
        ? { teacherId: user.id }
        : {},
      select: {
        classId: true,
        class: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

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

  const selectedClassId = classes.some(
    (schoolClass) =>
      schoolClass.id === requestedClassId
  )
    ? requestedClassId
    : "";

  // ========================================
  // 4. PERIMETRE DE SECURITE PRISMA
  // ========================================

  const assignmentScope:
    Prisma.TeachingAssignmentWhereInput = {
    ...(isTeacher
      ? { teacherId: user.id }
      : {}),
  };

  const scopedWhere: Prisma.HomeworkWhereInput = {
    assignment: {
      is: assignmentScope,
    },
  };

  const where: Prisma.HomeworkWhereInput = {
    assignment: {
      is: {
        ...assignmentScope,
        ...(selectedClassId
          ? { classId: selectedClassId }
          : {}),
      },
    },

    ...(selectedStatus
      ? { status: selectedStatus }
      : {}),

    ...(selectedType
      ? { type: selectedType }
      : {}),

    ...(query
      ? {
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
            {
              instructions: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  // ========================================
  // 5. STATISTIQUES REELLES
  // ========================================

  const now = new Date();

  const [
    totalCount,
    draftCount,
    publishedCount,
    archivedCount,
    overdueCount,
    filteredCount,
  ] = await Promise.all([
    prisma.homework.count({
      where: scopedWhere,
    }),

    prisma.homework.count({
      where: {
        ...scopedWhere,
        status: "DRAFT",
      },
    }),

    prisma.homework.count({
      where: {
        ...scopedWhere,
        status: "PUBLISHED",
      },
    }),

    prisma.homework.count({
      where: {
        ...scopedWhere,
        status: "ARCHIVED",
      },
    }),

    prisma.homework.count({
      where: {
        ...scopedWhere,
        status: "PUBLISHED",
        dueDate: { lt: now },
      },
    }),

    prisma.homework.count({
      where,
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCount / PAGE_SIZE)
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages
  );

  // ========================================
  // 6. DEVOIRS DEPUIS POSTGRESQL
  // ========================================

  const homeworks = await prisma.homework.findMany({
    where,

    select: {
      id: true,
      title: true,
      instructions: true,
      type: true,
      status: true,
      dueDate: true,
      durationMinutes: true,
      createdAt: true,
      publishedAt: true,

      assignment: {
        select: {
          subject: true,
          class: {
            select: {
              name: true,
              level: true,
            },
          },
          teacher: {
            select: {
              name: true,
            },
          },
        },
      },
    },

    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],

    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  // ========================================
  // 7. PAGINATION
  // ========================================

  function buildUrl(page: number) {
    const urlParams = new URLSearchParams();

    if (query) urlParams.set("q", query);
    if (selectedClassId) {
      urlParams.set("classId", selectedClassId);
    }
    if (selectedType) {
      urlParams.set("type", selectedType);
    }
    if (selectedStatus) {
      urlParams.set("status", selectedStatus);
    }

    urlParams.set("page", String(page));

    return `/teacher/assignments?${urlParams.toString()}`;
  }

  const hasFilters = Boolean(
    query ||
      selectedClassId ||
      selectedType ||
      selectedStatus
  );

  // ========================================
  // 8. RENDU
  // ========================================

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 pb-12">
      {/* HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-teal-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
              <Sparkles size={14} />
              Organisation pédagogique
            </span>

            <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              <ClipboardList
                size={30}
                className="shrink-0 text-teal-400"
              />
              Devoirs & compositions
            </h1>

            <p className="max-w-2xl text-sm leading-7 text-slate-400">
              Organisez les travaux de vos élèves,
              préparez des devoirs à déposer et
              suivez les compositions en ligne.
              Gérez vos publications et leurs échéances.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/teacher/assignments/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-teal-400"
            >
              <Plus size={18} />
              Nouveau devoir
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/teacher/submissions"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#08111f] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <FileText size={17} />
              Copies et corrections
            </Link>
          </div>
        </div>
      </section>

      {/* STATISTIQUES */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<ClipboardList size={21} />}
          label="Total des devoirs"
          value={totalCount}
          description="Devoirs enregistrés"
        />

        <StatCard
          icon={<BookOpen size={21} />}
          label="Brouillons"
          value={draftCount}
          description="À préparer avant publication"
        />

        <StatCard
          icon={<CheckCircle2 size={21} />}
          label="Publiés"
          value={publishedCount}
          description="Statut publié en base"
        />

        <StatCard
          icon={<AlertCircle size={21} />}
          label="Échéances passées"
          value={overdueCount}
          description="Devoirs publiés arrivés à échéance"
        />
      </section>

      {/* FILTRES */}
      <section className="rounded-3xl border border-slate-800 bg-[#111e30] p-5 md:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-xl bg-teal-500/10 p-2.5 text-teal-400">
            <Filter size={19} />
          </span>

          <div>
            <h2 className="font-bold text-white">
              Rechercher des devoirs
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Filtrez par classe, type ou statut.
            </p>
          </div>
        </div>

        <form
          method="GET"
          action="/teacher/assignments"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_160px_160px_auto]"
        >
          <div>
            <label
              htmlFor="homework-q"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Recherche
            </label>

            <input
              id="homework-q"
              name="q"
              type="search"
              maxLength={80}
              defaultValue={query}
              placeholder="Titre ou consigne..."
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="homework-class"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Classe
            </label>

            <select
              id="homework-class"
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

          <div>
            <label
              htmlFor="homework-type"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Type
            </label>

            <select
              id="homework-type"
              name="type"
              defaultValue={selectedType ?? ""}
              className={inputClass}
            >
              <option value="">Tous les types</option>
              <option value="UPLOAD">Dépôt de fichier</option>
              <option value="ONLINE">Composition en ligne</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="homework-status"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Statut
            </label>

            <select
              id="homework-status"
              name="status"
              defaultValue={selectedStatus ?? ""}
              className={inputClass}
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="ARCHIVED">Archivé</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 text-sm font-bold text-slate-950 hover:bg-teal-400"
            >
              <Search size={16} />
              Filtrer
            </button>

            <Link
              href="/teacher/assignments"
              aria-label="Réinitialiser les filtres"
              title="Réinitialiser les filtres"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 bg-[#08111f] px-3 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw size={17} />
            </Link>
          </div>
        </form>
      </section>

      {/* LISTE DES DEVOIRS */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              Mes devoirs enregistrés
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredCount} résultat(s)
              {hasFilters ? " après filtrage" : ""}
            </p>
          </div>

          <span className="rounded-full border border-slate-700 bg-[#111e30] px-3 py-1.5 text-xs text-slate-300">
            {archivedCount} archivé(s)
          </span>
        </div>

        {homeworks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-[#111e30] px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
              <ClipboardList size={30} />
            </div>

            <h3 className="text-lg font-bold text-white">
              {hasFilters
                ? "Aucun devoir correspondant"
                : "Aucun devoir enregistré"}
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
              {hasFilters
                ? "Modifiez vos filtres pour retrouver vos devoirs."
                : "Votre bibliothèque de devoirs apparaîtra ici dès que des devoirs seront enregistrés dans PostgreSQL."}
            </p>

            {hasFilters && (
              <Link
                href="/teacher/assignments"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/10 px-4 py-3 text-sm font-bold text-teal-300"
              >
                <RefreshCw size={16} />
                Réinitialiser
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {homeworks.map((homework) => {
              const isOnline =
                homework.type === "ONLINE";

              const isDraft =
                homework.status === "DRAFT";

              const isArchived =
                homework.status === "ARCHIVED";

              const expired =
                homework.status === "PUBLISHED" &&
                homework.dueDate !== null &&
                homework.dueDate < now;

              const canPublish =
                isDraft &&
                !isOnline &&
                homework.dueDate !== null &&
                homework.dueDate > now;

              return (
                <article
                  key={homework.id}
                  className="flex h-full flex-col rounded-3xl border border-slate-800 bg-[#111e30] p-6 transition hover:border-teal-500/25"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusBadge
                      status={homework.status}
                    />

                    <span className="text-xs text-slate-500">
                      Créé le{" "}
                      {formatDate(homework.createdAt)}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${
                        isOnline
                          ? "border-violet-500/20 bg-violet-500/10 text-violet-300"
                          : "border-sky-500/20 bg-sky-500/10 text-sky-300"
                      }`}
                    >
                      {isOnline ? (
                        <MonitorPlay size={14} />
                      ) : (
                        <FileUp size={14} />
                      )}

                      {isOnline
                        ? "Composition en ligne"
                        : "Devoir à déposer"}
                    </span>

                    {expired && (
                      <span className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
                        Échéance dépassée
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-extrabold leading-7 text-white">
                    {homework.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-slate-400">
                    {homework.instructions}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-lg border border-teal-500/15 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
                      {homework.assignment.subject}
                    </span>

                    <span className="rounded-lg border border-slate-700 bg-[#08111f] px-3 py-1.5 text-xs text-slate-300">
                      {homework.assignment.class.name} —{" "}
                      {homework.assignment.class.level}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-xl border border-slate-800 bg-[#08111f] p-4 text-xs text-slate-400 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays
                        size={15}
                        className="text-teal-400"
                      />
                      Échéance : {formatDate(homework.dueDate)}
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3
                        size={15}
                        className="text-sky-400"
                      />
                      {isOnline
                        ? homework.durationMinutes
                          ? `${homework.durationMinutes} minutes`
                          : "Durée non renseignée"
                        : "Dépôt de fichier"}
                    </div>

                    {user.role === "ADMIN" && (
                      <div className="sm:col-span-2">
                        Enseignant :{" "}
                        {homework.assignment.teacher.name ??
                          "Non renseigné"}
                      </div>
                    )}
                  </div>

                  {/* ACTIONS REELLES */}
                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-5">
                    {canPublish && (
                      <form action={publishHomeworkAction}>
                        <input
                          type="hidden"
                          name="id"
                          value={homework.id}
                        />
                        <HomeworkActionButton kind="publish" />
                      </form>
                    )}

                    {!isArchived && (
                      <form action={archiveHomeworkAction}>
                        <input
                          type="hidden"
                          name="id"
                          value={homework.id}
                        />
                        <HomeworkActionButton kind="archive" />
                      </form>
                    )}

                    {isArchived && (
                      <form action={restoreHomeworkAction}>
                        <input
                          type="hidden"
                          name="id"
                          value={homework.id}
                        />
                        <HomeworkActionButton kind="restore" />
                      </form>
                    )}

                    {isDraft && isOnline && (
                      <span className="text-xs text-amber-400">
                        Questions interactives à intégrer
                      </span>
                    )}

                    {isDraft &&
                      !isOnline &&
                      !canPublish && (
                        <span className="text-xs text-amber-400">
                          Échéance future requise
                        </span>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {filteredCount > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#111e30] p-4">
            <p className="text-xs text-slate-400">
              Page {currentPage} sur {totalPages}
            </p>

            <nav
              aria-label="Pagination des devoirs"
              className="flex items-center gap-2"
            >
              {currentPage > 1 && (
                <Link
                  href={buildUrl(currentPage - 1)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <ChevronLeft size={16} />
                  Précédent
                </Link>
              )}

              {currentPage < totalPages && (
                <Link
                  href={buildUrl(currentPage + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-teal-400"
                >
                  Suivant
                  <ChevronRight size={16} />
                </Link>
              )}
            </nav>
          </div>
        )}
      </section>

      {/* INFORMATION PEDAGOGIQUE */}
      <section className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-[#111e30] p-5">
        <ShieldCheck
          size={20}
          className="mt-0.5 shrink-0 text-teal-400"
        />

        <div>
          <h2 className="text-sm font-bold text-white">
            Publications et protection des données
          </h2>

          <p className="mt-2 text-xs leading-6 text-slate-400">
            Les enseignants consultent uniquement les
            devoirs de leurs affectations autorisées.
            L'archivage conserve les données en base.
            La consultation par les élèves et la remise
            des copies seront à connecter séparément
            dans les espaces concernés.
          </p>
        </div>
      </section>
    </div>
  );
}
