
import type { ReactNode } from "react";
import type { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Users,
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  UserRound,
  School,
  RefreshCw,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// ========================================
// TYPES
// ========================================

type SearchParams = {
  q?: string | string[];
  classId?: string | string[];
  page?: string | string[];
};

type TeacherStudentsPageProps = {
  searchParams: Promise<SearchParams>;
};

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

function getInitials(name: string | null) {
  if (!name?.trim()) {
    return "EL";
  }

  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "EL"
  );
}

function formatParentName(
  parent: { name: string | null } | null
): string {
  if (!parent) {
    return "Aucun parent associé";
  }

  return parent.name?.trim() || "Parent référent";
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111e30] p-5 transition hover:border-teal-500/20">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-400">
          {icon}
        </div>
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

// ========================================
// PAGE ENSEIGNANT — ÉLÈVES & CLASSES
// ========================================

export default async function TeacherStudentsPage({
  searchParams,
}: TeacherStudentsPageProps) {
  // ----------------------------------------
  // 1. AUTHENTIFICATION
  // ----------------------------------------

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Ne jamais faire confiance uniquement au rôle JWT.
  const currentUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!currentUser) {
    redirect("/login");
  }

  const isTeacher = currentUser.role === "TEACHER";
  const isAdmin = currentUser.role === "ADMIN";

  if (!isTeacher && !isAdmin) {
    redirect("/dashboard");
  }

  // ----------------------------------------
  // 2. PARAMÈTRES DE RECHERCHE
  // ----------------------------------------

  const params = await searchParams;

  const query = getParam(params.q)
    .trim()
    .slice(0, 80);

  const requestedClassId = getParam(params.classId);

  const rawPage = Number.parseInt(
    getParam(params.page) || "1",
    10
  );

  const requestedPage =
    Number.isFinite(rawPage) && rawPage > 0
      ? rawPage
      : 1;

  // ----------------------------------------
  // 3. CLASSES AUTORISÉES
  // ----------------------------------------

  // ADMIN : accès à toutes les classes.
  // TEACHER : uniquement celles attribuées
  // dans TeachingAssignment.
  const assignedClasses = isAdmin
    ? await prisma.class.findMany({
        select: {
          id: true,
          name: true,
          level: true,
        },
        orderBy: [
          { level: "asc" },
          { name: "asc" },
        ],
      })
    : (
        await prisma.teachingAssignment.findMany({
          where: {
            teacherId: currentUser.id,
          },
          select: {
            class: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        })
      ).map((assignment) => assignment.class);

  // Un professeur peut enseigner plusieurs
  // matières dans la même classe.
  // Ne compter chaque classe qu'une seule fois.
  const classes = Array.from(
    new Map(
      assignedClasses.map((schoolClass) => [
        schoolClass.id,
        schoolClass,
      ])
    ).values()
  ).sort(
    (a, b) =>
      a.level.localeCompare(b.level, "fr") ||
      a.name.localeCompare(b.name, "fr")
  );

  const allowedClassIds = classes.map(
    (schoolClass) => schoolClass.id
  );

  // Valider le filtre de classe contre la liste
  // autorisée. Aucun identifiant étranger ne sera
  // utilisé pour récupérer des élèves.
  const selectedClassId = allowedClassIds.includes(
    requestedClassId
  )
    ? requestedClassId
    : "";

  // ----------------------------------------
  // 4. FILTRES PRISMA SÉCURISÉS
  // ----------------------------------------

  const baseWhere: Prisma.StudentWhereInput = {
    classId: {
      in: allowedClassIds,
    },
  };

  const where: Prisma.StudentWhereInput = {
    classId: {
      in: selectedClassId
        ? [selectedClassId]
        : allowedClassIds,
    },

    ...(query
      ? {
          user: {
            is: {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
                {
                  email: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          },
        }
      : {}),
  };

  // ----------------------------------------
  // 5. STATISTIQUES
  // ----------------------------------------

  const [
    totalStudents,
    studentsWithParent,
    filteredCount,
  ] = await Promise.all([
    prisma.student.count({
      where: baseWhere,
    }),

    prisma.student.count({
      where: {
        ...baseWhere,
        parentId: {
          not: null,
        },
      },
    }),

    prisma.student.count({
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

  const skip = (currentPage - 1) * PAGE_SIZE;

  // ----------------------------------------
  // 6. RÉCUPÉRATION DES ÉLÈVES
  // ----------------------------------------

  const students = await prisma.student.findMany({
    where,

    select: {
      id: true,

      user: {
        select: {
          name: true,
          email: true,
        },
      },

      class: {
        select: {
          name: true,
          level: true,
        },
      },

      parent: {
        select: {
          name: true,
        },
      },
    },

    orderBy: [
      {
        class: {
          name: "asc",
        },
      },
      {
        user: {
          name: "asc",
        },
      },
      {
        id: "asc",
      },
    ],

    skip,
    take: PAGE_SIZE,
  });

  // ----------------------------------------
  // 7. LIENS DE PAGINATION
  // ----------------------------------------

  function buildPageUrl(page: number) {
    const urlParams = new URLSearchParams();

    if (query) {
      urlParams.set("q", query);
    }

    if (selectedClassId) {
      urlParams.set("classId", selectedClassId);
    }

    urlParams.set("page", String(page));

    return `/teacher/students?${urlParams.toString()}`;
  }

  const firstResult =
    filteredCount === 0 ? 0 : skip + 1;

  const lastResult = Math.min(
    skip + PAGE_SIZE,
    filteredCount
  );

  const hasFilters =
    Boolean(query) || Boolean(selectedClassId);

  // ----------------------------------------
  // 8. INTERFACE
  // ----------------------------------------

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 pb-10">
      {/* =====================================
          EN-TÊTE
      ===================================== */}

      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
              <ShieldCheck size={14} />
              Gestion pédagogique sécurisée
            </div>

            <div>
              <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                <GraduationCap
                  size={30}
                  className="shrink-0 text-teal-400"
                />
                Mes élèves & classes
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                {isAdmin
                  ? "Consultez les élèves inscrits dans l'établissement et leur rattachement parental."
                  : "Retrouvez les élèves de vos classes attribuées, leurs informations scolaires et leur rattachement parental."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-teal-500/20 bg-teal-500/10 px-5 py-4">
            <Users
              size={26}
              className="text-teal-400"
            />

            <div>
              <p className="text-2xl font-bold text-white">
                {totalStudents.toLocaleString("fr-FR")}
              </p>

              <p className="text-xs text-teal-200/80">
                Élèves accessibles
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          STATISTIQUES
      ===================================== */}

      <section
        aria-label="Statistiques de vos classes"
        className="grid gap-4 sm:grid-cols-3"
      >
        <StatCard
          title="Classes"
          value={classes.length}
          description={
            isAdmin
              ? "Classes de l'établissement"
              : "Classes qui vous sont attribuées"
          }
          icon={<School size={21} />}
        />

        <StatCard
          title="Élèves"
          value={totalStudents}
          description="Effectif total de vos classes"
          icon={<Users size={21} />}
        />

        <StatCard
          title="Parents associés"
          value={studentsWithParent}
          description="Élèves ayant un parent référent"
          icon={<ShieldCheck size={21} />}
        />
      </section>

      {/* =====================================
          FILTRES ET RECHERCHE
      ===================================== */}

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
              Recherchez rapidement un élève
              ou sélectionnez une classe.
            </p>
          </div>
        </div>

        <form
          method="GET"
          action="/teacher/students"
          className="grid gap-4 lg:grid-cols-[1fr_260px_auto]"
        >
          {/* RECHERCHE */}
          <div>
            <label
              htmlFor="student-search"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Rechercher un élève
            </label>

            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="student-search"
                name="q"
                type="search"
                maxLength={80}
                defaultValue={query}
                placeholder="Nom ou adresse e-mail..."
                className="w-full rounded-xl border border-slate-700/70 bg-[#08111f] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10"
              />
            </div>
          </div>

          {/* FILTRE CLASSE */}
          <div>
            <label
              htmlFor="student-class"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Filtrer par classe
            </label>

            <select
              id="student-class"
              name="classId"
              defaultValue={selectedClassId}
              className="w-full rounded-xl border border-slate-700/70 bg-[#08111f] px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10"
            >
              <option value="">
                Toutes mes classes
              </option>

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

          {/* ACTIONS */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400 lg:flex-none"
            >
              <Search size={17} />
              Rechercher
            </button>

            <Link
              href="/teacher/students"
              title="Réinitialiser les filtres"
              aria-label="Réinitialiser les filtres"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 px-3 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw size={18} />
            </Link>
          </div>
        </form>
      </section>

      {/* =====================================
          TABLEAU DES ÉLÈVES
      ===================================== */}

      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] shadow-xl">
        {/* EN-TÊTE DU TABLEAU */}
        <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <BookOpen
                size={19}
                className="text-teal-400"
              />
              Répertoire des élèves
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredCount.toLocaleString("fr-FR")}{" "}
              résultat(s) trouvé(s)
            </p>
          </div>

          <span className="w-fit rounded-full border border-slate-700 bg-[#08111f] px-3 py-1.5 text-xs font-semibold text-slate-300">
            {firstResult} – {lastResult} sur{" "}
            {filteredCount.toLocaleString("fr-FR")}
          </span>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-[#0b1626] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 font-semibold"
                >
                  Élève
                </th>

                <th
                  scope="col"
                  className="px-6 py-4 font-semibold"
                >
                  Classe
                </th>

                <th
                  scope="col"
                  className="px-6 py-4 font-semibold"
                >
                  Rattachement parental
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/70">
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-16 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
                        <GraduationCap size={30} />
                      </div>

                      <h3 className="text-base font-bold text-white">
                        {classes.length === 0
                          ? "Aucune classe attribuée"
                          : hasFilters
                            ? "Aucun élève trouvé"
                            : "Aucun élève inscrit"}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {classes.length === 0
                          ? isAdmin
                            ? "Aucune classe n'est encore enregistrée."
                            : "Contactez votre administration afin de recevoir vos affectations pédagogiques."
                          : hasFilters
                            ? "Aucun élève ne correspond à votre recherche. Essayez de modifier les filtres."
                            : "Les élèves apparaîtront ici dès leur inscription dans vos classes."}
                      </p>

                      {hasFilters && (
                        <Link
                          href="/teacher/students"
                          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/10 px-4 py-2.5 text-xs font-bold text-teal-300 transition hover:bg-teal-500/20"
                        >
                          <RefreshCw size={15} />
                          Effacer les filtres
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const parent = student.parent;

                  return (
                    <tr
                      key={student.id}
                      className="group transition hover:bg-white/[0.025]"
                    >
                      {/* ÉLÈVE */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-500/15 bg-teal-500/10 text-xs font-bold text-teal-300">
                            {getInitials(
                              student.user.name
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-white">
                              {student.user.name?.trim() ||
                                "Élève sans nom"}
                            </p>

                            <p className="mt-1 break-all text-xs text-slate-500">
                              {student.user.email ||
                                "Adresse e-mail non renseignée"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CLASSE */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-300">
                          <GraduationCap size={15} />
                          {student.class.name} —{" "}
                          {student.class.level}
                        </span>
                      </td>

                      {/* PARENT */}
                      <td className="px-6 py-4">
                        {parent ? (
                          <div className="inline-flex max-w-full items-center gap-3 rounded-xl border border-teal-500/15 bg-teal-500/[0.05] px-3 py-2.5">
                            <ShieldCheck
                              size={18}
                              className="shrink-0 text-teal-400"
                            />

                            <div className="min-w-0">
                              <p className="text-[11px] text-slate-500">
                                Parent associé
                              </p>

                              <p className="truncate text-xs font-semibold text-slate-200">
                                {formatParentName(parent)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] px-3 py-2.5 text-xs text-amber-300">
                            <ShieldAlert
                              size={17}
                              className="shrink-0"
                            />
                            Aucun parent associé
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================
            PAGINATION
        ===================================== */}

        {filteredCount > PAGE_SIZE && (
          <div className="flex flex-col gap-4 border-t border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Page{" "}
              <strong className="text-white">
                {currentPage}
              </strong>{" "}
              sur{" "}
              <strong className="text-white">
                {totalPages}
              </strong>
            </p>

            <nav
              aria-label="Pagination des élèves"
              className="flex items-center gap-2"
            >
              {currentPage > 1 ? (
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#08111f] px-4 py-2.5 text-xs font-semibold text-white transition hover:border-teal-500/30"
                >
                  <ChevronLeft size={16} />
                  Précédent
                </Link>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-800 px-4 py-2.5 text-xs text-slate-600">
                  <ChevronLeft size={16} />
                  Précédent
                </span>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={buildPageUrl(currentPage + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-teal-400"
                >
                  Suivant
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs text-slate-500">
                  Suivant
                  <ChevronRight size={16} />
                </span>
              )}
            </nav>
          </div>
        )}
      </section>

      {/* =====================================
          INFORMATION DE SÉCURITÉ
      ===================================== */}

      <section className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-[#111e30] p-5">
        <ShieldCheck
          size={20}
          className="mt-0.5 shrink-0 text-teal-400"
        />

        <div>
          <h3 className="text-sm font-bold text-white">
            Consultation sécurisée des élèves
          </h3>

          <p className="mt-2 text-xs leading-6 text-slate-400">
            {isAdmin
              ? "En tant qu'administrateur, vous pouvez consulter l'ensemble des classes et des élèves."
              : "Seuls les élèves appartenant à vos classes attribuées sont accessibles depuis ce répertoire."}
            {" "}Les rattachements parentaux sont
            gérés exclusivement par l'administration.
          </p>
        </div>
      </section>
    </div>
  );
}
