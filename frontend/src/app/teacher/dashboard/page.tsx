
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Award,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  FileText,
  GraduationCap,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ========================================
// COMPOSANTS UTILITAIRES
// ========================================

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
    <div className="group rounded-3xl border border-slate-800 bg-[#111e30] p-6 transition-all duration-300 hover:border-teal-500/30 hover:shadow-xl hover:shadow-teal-500/5">
      <div className="mb-6 flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-400">
          {icon}
        </div>
      </div>

      <p className="text-4xl font-extrabold tracking-tight text-white">
        {value.toLocaleString("fr-FR")}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
        {icon}
      </span>

      <div>
        <h2 className="text-base font-bold text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function getGreetingName(name: string | null) {
  const cleanName = name?.trim();

  if (!cleanName) {
    return "Enseignant";
  }

  // Évite "Prof. Prof Math".
  if (/^prof(?:esseur)?\.?\s/i.test(cleanName)) {
    return cleanName;
  }

  return `Prof. ${cleanName}`;
}

function formatDay(day: string) {
  const days: Record<string, string> = {
    monday: "Lundi",
    tuesday: "Mardi",
    wednesday: "Mercredi",
    thursday: "Jeudi",
    friday: "Vendredi",
    saturday: "Samedi",
    sunday: "Dimanche",
    lundi: "Lundi",
    mardi: "Mardi",
    mercredi: "Mercredi",
    jeudi: "Jeudi",
    vendredi: "Vendredi",
    samedi: "Samedi",
    dimanche: "Dimanche",
  };

  return days[day.trim().toLowerCase()] ?? day;
}

// ========================================
// DASHBOARD ENSEIGNANT
// ========================================

export default async function TeacherDashboard() {
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
      email: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const teacherId = user.id;
  const teacherName = getGreetingName(user.name);

  // ========================================
  // 2. DONNÉES RÉELLES PRISMA
  // ========================================

  const [
    assignments,
    teacherProfile,
    submittedGradesCount,
    pendingGradesCount,
    rejectedGradesCount,
    schedules,
  ] = await Promise.all([
    // Affectations pédagogiques
    prisma.teachingAssignment.findMany({
      where: {
        teacherId,
      },
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
      orderBy: [
        {
          class: {
            name: "asc",
          },
        },
        {
          subject: "asc",
        },
      ],
    }),

    // Profil pédagogique
    prisma.teacherProfile.findUnique({
      where: {
        userId: teacherId,
      },
      select: {
        specialty: true,
        degree: true,
        phone: true,
      },
    }),

    // Notes réellement soumises par le professeur
    prisma.grade.count({
      where: {
        submittedById: teacherId,
      },
    }),

    // Notes en attente de validation
    prisma.grade.count({
      where: {
        submittedById: teacherId,
        status: "PENDING",
      },
    }),

    // Notes rejetées par l'administration
    prisma.grade.count({
      where: {
        submittedById: teacherId,
        status: "REJECTED",
      },
    }),

    // Séances inscrites à l'emploi du temps
    prisma.schedule.findMany({
      where: {
        teacherId,
      },
      select: {
        id: true,
        subject: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        room: true,
        class: {
          select: {
            name: true,
            level: true,
          },
        },
      },
      orderBy: [
        {
          dayOfWeek: "asc",
        },
        {
          startTime: "asc",
        },
      ],
      take: 5,
    }),
  ]);

  // ========================================
  // 3. STATISTIQUES CALCULÉES
  // ========================================

  // Une même classe peut avoir plusieurs matières.
  // On déduplique pour ne compter chaque classe
  // et ses élèves qu'une seule fois.
  const uniqueClasses = Array.from(
    new Map(
      assignments.map((assignment) => [
        assignment.classId,
        assignment.class,
      ])
    ).values()
  );

  const classesCount = uniqueClasses.length;

  const studentsCount = uniqueClasses.reduce(
    (total, schoolClass) =>
      total + schoolClass._count.students,
    0
  );

  const approvedGradesCount = Math.max(
    0,
    submittedGradesCount -
      pendingGradesCount -
      rejectedGradesCount
  );

  const hasAssignments = assignments.length > 0;
  const hasRejectedGrades = rejectedGradesCount > 0;

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 pb-10">
      {/* =====================================
          HERO : BIENVENUE
      ===================================== */}

      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl md:p-8">
        {/* Éclairage décoratif */}
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-teal-500/10 blur-[100px]" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
              <Sparkles size={14} />
              Espace pédagogique enseignant
            </div>

            <div>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl xl:text-4xl">
                Bonjour,{" "}
                <span className="text-teal-400">
                  {teacherName}
                </span>{" "}
                👨‍🏫
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                Retrouvez vos classes, organisez vos
                enseignements et suivez les évaluations
                de vos élèves depuis votre espace
                pédagogique.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/teacher/grades"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400"
              >
                <Award size={17} />
                Gérer les notes
                <ArrowRight size={15} />
              </Link>

              <Link
                href="/teacher/students"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-teal-500/30 hover:bg-slate-800"
              >
                <Users size={17} />
                Mes classes
              </Link>
            </div>
          </div>

          {/* FICHE ENSEIGNANT */}
          <div className="w-full rounded-2xl border border-slate-700/70 bg-[#08111f]/90 p-5 lg:w-[280px]">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Fiche pédagogique
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  Informations du professeur
                </p>
              </div>
            </div>

            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-slate-500">
                  Spécialité
                </dt>

                <dd className="mt-1 break-words text-sm font-semibold text-white">
                  {teacherProfile?.specialty?.trim() ||
                    "Non renseignée"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">
                  Diplôme
                </dt>

                <dd className="mt-1 break-words text-sm font-semibold text-white">
                  {teacherProfile?.degree?.trim() ||
                    "Non renseigné"}
                </dd>
              </div>

              {teacherProfile?.phone && (
                <div className="border-t border-slate-800 pt-3">
                  <dt className="mb-2 text-xs text-slate-500">
                    Contact
                  </dt>

                  <dd className="flex items-center gap-2 text-sm text-slate-300">
                    <Phone
                      size={15}
                      className="shrink-0 text-teal-400"
                    />
                    <span className="break-all">
                      {teacherProfile.phone}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>

      {/* =====================================
          STATISTIQUES
      ===================================== */}

      <section
        aria-label="Statistiques pédagogiques"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Mes classes"
          value={classesCount}
          description="Classes distinctes attribuées"
          icon={<GraduationCap size={21} />}
        />

        <StatCard
          title="Mes élèves"
          value={studentsCount}
          description="Élèves dans mes classes"
          icon={<Users size={21} />}
        />

        <StatCard
          title="Notes soumises"
          value={submittedGradesCount}
          description="Notes enregistrées à mon nom"
          icon={<Award size={21} />}
        />

        <StatCard
          title="Notes à corriger"
          value={rejectedGradesCount}
          description="Notes rejetées par l'administration"
          icon={<AlertCircle size={21} />}
        />
      </section>

      {/* =====================================
          ALERTE NOTES REJETÉES
      ===================================== */}

      {hasRejectedGrades && (
        <section className="flex flex-col gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
              <AlertCircle size={20} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-amber-300">
                Corrections demandées
              </h2>

              <p className="mt-1 text-xs leading-6 text-amber-100/70">
                {rejectedGradesCount} note(s) ont été
                rejetée(s). Consultez les commentaires
                de l'administration avant de les
                soumettre à nouveau.
              </p>
            </div>
          </div>

          <Link
            href="/teacher/grades"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-500/30 px-4 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/10"
          >
            Voir les corrections
            <ArrowRight size={15} />
          </Link>
        </section>
      )}

      {/* =====================================
          ACTIONS + SUIVI DES NOTES
      ===================================== */}

      <section className="grid gap-6 lg:grid-cols-2">
        {/* ACTIONS RAPIDES */}
        <div className="rounded-3xl border border-slate-800 bg-[#111e30] p-6">
          <SectionTitle
            icon={<Sparkles size={19} />}
            title="Actions rapides"
            description="Accédez à vos outils pédagogiques"
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/teacher/assignments/new"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#08111f] p-4 transition hover:border-teal-500/30"
            >
              <div className="flex items-center gap-3">
                <ClipboardList
                  size={20}
                  className="text-sky-400"
                />
                <span className="text-sm font-semibold text-white">
                  Nouveau devoir
                </span>
              </div>

              <ArrowRight
                size={16}
                className="shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-teal-400"
              />
            </Link>

            <Link
              href="/teacher/exercises/new"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#08111f] p-4 transition hover:border-teal-500/30"
            >
              <div className="flex items-center gap-3">
                <BookOpen
                  size={20}
                  className="text-violet-400"
                />
                <span className="text-sm font-semibold text-white">
                  Nouvel exercice
                </span>
              </div>

              <ArrowRight
                size={16}
                className="shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-teal-400"
              />
            </Link>

            <Link
              href="/teacher/grades"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#08111f] p-4 transition hover:border-teal-500/30"
            >
              <div className="flex items-center gap-3">
                <Award
                  size={20}
                  className="text-teal-400"
                />
                <span className="text-sm font-semibold text-white">
                  Saisir une note
                </span>
              </div>

              <ArrowRight
                size={16}
                className="shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-teal-400"
              />
            </Link>

            <Link
              href="/teacher/reports"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#08111f] p-4 transition hover:border-teal-500/30"
            >
              <div className="flex items-center gap-3">
                <FileText
                  size={20}
                  className="text-amber-400"
                />
                <span className="text-sm font-semibold text-white">
                  Bulletins et avis
                </span>
              </div>

              <ArrowRight
                size={16}
                className="shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-teal-400"
              />
            </Link>
          </div>
        </div>

        {/* ÉTAT DES VALIDATIONS */}
        <div className="rounded-3xl border border-slate-800 bg-[#111e30] p-6">
          <SectionTitle
            icon={<ShieldCheck size={20} />}
            title="Suivi des validations"
            description="État de vos notes transmises"
          />

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-[#08111f] px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <Clock3
                  size={17}
                  className="text-amber-400"
                />
                En attente de validation
              </span>

              <span className="font-bold text-amber-400">
                {pendingGradesCount}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#08111f] px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2
                  size={17}
                  className="text-teal-400"
                />
                Notes approuvées
              </span>

              <span className="font-bold text-teal-400">
                {approvedGradesCount}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#08111f] px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <AlertCircle
                  size={17}
                  className="text-red-400"
                />
                Notes rejetées
              </span>

              <span className="font-bold text-red-400">
                {rejectedGradesCount}
              </span>
            </div>
          </div>

          <Link
            href="/teacher/grades"
            className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-teal-400 transition hover:text-teal-300"
          >
            Consulter toutes mes notes
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* =====================================
          EMPLOI DU TEMPS
      ===================================== */}

      <section className="rounded-3xl border border-slate-800 bg-[#111e30] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle
            icon={<CalendarDays size={20} />}
            title="Mon emploi du temps"
            description="Séances inscrites à votre planning"
          />

          <Link
            href="/teacher/schedule"
            className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 transition hover:text-teal-300"
          >
            Voir le planning
            <ArrowRight size={15} />
          </Link>
        </div>

        {schedules.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700/70 bg-[#08111f]/70 px-5 py-10 text-center">
            <CalendarDays
              size={30}
              className="mx-auto mb-3 text-slate-600"
            />

            <p className="text-sm font-semibold text-slate-300">
              Aucun cours programmé
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Votre emploi du temps apparaîtra ici
              dès son enregistrement.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="rounded-2xl border border-slate-800 bg-[#08111f] p-4 transition hover:border-teal-500/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-lg bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-300">
                    {formatDay(schedule.dayOfWeek)}
                  </span>

                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Clock3 size={14} />
                    {schedule.startTime} –{" "}
                    {schedule.endTime}
                  </span>
                </div>

                <p className="mt-4 font-bold text-white">
                  {schedule.subject}
                </p>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap
                      size={15}
                      className="text-teal-400"
                    />
                    {schedule.class.name} —{" "}
                    {schedule.class.level}
                  </span>

                  {schedule.room && (
                    <span className="flex items-center gap-1.5">
                      <MapPin
                        size={14}
                        className="text-sky-400"
                      />
                      {schedule.room}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================
          AFFECTATIONS PÉDAGOGIQUES
      ===================================== */}

      <section className="rounded-3xl border border-slate-800 bg-[#111e30] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <SectionTitle
            icon={<BriefcaseBusiness size={20} />}
            title="Mes affectations pédagogiques"
            description="Classes et matières attribuées"
          />

          <span className="rounded-full border border-slate-700 bg-[#08111f] px-3 py-1.5 text-xs font-semibold text-slate-400">
            {assignments.length} affectation(s)
          </span>
        </div>

        {hasAssignments ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-[#08111f] p-5 transition-all hover:border-teal-500/30 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white">
                      {assignment.class.name}
                    </h3>

                    <span className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-bold text-sky-300">
                      {assignment.class.level}
                    </span>
                  </div>

                  <p className="mt-3 flex items-center gap-2 text-xs font-medium text-teal-400">
                    <BookOpen size={14} />
                    {assignment.subject}
                  </p>
                </div>

                <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-center">
                  <p className="text-lg font-bold text-white">
                    {assignment.class._count.students}
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Élèves
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
              <GraduationCap size={30} />
            </div>

            <h3 className="text-base font-bold text-white">
              Aucune classe attribuée
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
              Vous n'avez pas encore d'affectation
              pédagogique. Contactez votre
              administration pour qu'elle vous
              attribue une classe et une matière.
            </p>

            <p className="mt-3 text-xs text-slate-500">
              Les affectations sont gérées depuis
              l'espace administrateur.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
