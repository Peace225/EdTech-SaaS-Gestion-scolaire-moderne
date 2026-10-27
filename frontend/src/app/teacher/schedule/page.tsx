
import type { ReactNode } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  CalendarDays,
  Clock3,
  MapPin,
  BookOpen,
  GraduationCap,
  Sparkles,
  Timer,
  Users,
  Layers3,
  ArrowRight,
  ShieldCheck,
  CalendarCheck2,
  CalendarX2,
  School,
  UserRound,
  Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ========================================
// JOURS DE LA SEMAINE
// ========================================

const DAYS = [
  { key: "monday", label: "Lundi", short: "Lun." },
  { key: "tuesday", label: "Mardi", short: "Mar." },
  { key: "wednesday", label: "Mercredi", short: "Mer." },
  { key: "thursday", label: "Jeudi", short: "Jeu." },
  { key: "friday", label: "Vendredi", short: "Ven." },
  { key: "saturday", label: "Samedi", short: "Sam." },
  { key: "sunday", label: "Dimanche", short: "Dim." },
] as const;

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function normalizeDay(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const dayMap: Record<string, string> = {
    monday: "monday",
    mon: "monday",
    lundi: "monday",
    lun: "monday",
    "1": "monday",

    tuesday: "tuesday",
    tue: "tuesday",
    mardi: "tuesday",
    mar: "tuesday",
    "2": "tuesday",

    wednesday: "wednesday",
    wed: "wednesday",
    mercredi: "wednesday",
    mer: "wednesday",
    "3": "wednesday",

    thursday: "thursday",
    thu: "thursday",
    jeudi: "thursday",
    jeu: "thursday",
    "4": "thursday",

    friday: "friday",
    fri: "friday",
    vendredi: "friday",
    ven: "friday",
    "5": "friday",

    saturday: "saturday",
    sat: "saturday",
    samedi: "saturday",
    sam: "saturday",
    "6": "saturday",

    sunday: "sunday",
    sun: "sunday",
    dimanche: "sunday",
    dim: "sunday",
    "0": "sunday",
    "7": "sunday",
  };

  return dayMap[normalized] ?? normalized;
}

function getTimeMinutes(time: string): number {
  const match = time.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?$/
  );

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return hours * 60 + minutes;
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
    <div className="rounded-2xl border border-slate-800 bg-[#111e30] p-5 transition-all duration-300 hover:border-teal-500/25">
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
// PAGE EMPLOI DU TEMPS ENSEIGNANT
// ========================================

export default async function TeacherSchedulePage() {
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
  // 2. RÉCUPÉRER LES CRÉNEAUX
  // ========================================

  // Enseignant : ses propres cours uniquement.
  // Administrateur : planning global.
  const schedules = await prisma.schedule.findMany({
    where: isTeacher
      ? {
          teacherId: user.id,
        }
      : {},

    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      subject: true,
      room: true,
      classId: true,

      class: {
        select: {
          id: true,
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
  });

  // ========================================
  // 3. ORGANISATION DES DONNÉES
  // ========================================

  const totalSlots = schedules.length;

  const uniqueClassIds = new Set(
    schedules.map((slot) => slot.classId)
  );

  const uniqueSubjects = new Set(
    schedules.map((slot) =>
      slot.subject.trim().toLowerCase()
    )
  );

  const programmedDays = new Set(
    schedules.map((slot) =>
      normalizeDay(slot.dayOfWeek)
    )
  );

  const classesCount = uniqueClassIds.size;
  const subjectsCount = uniqueSubjects.size;
  const daysCount = programmedDays.size;

  // Inclure le dimanche seulement si des cours
  // y sont programmés.
  const visibleDays = DAYS.filter(
    (day) =>
      day.key !== "sunday" ||
      programmedDays.has("sunday")
  );

  const knownDayKeys = new Set<string>(
    DAYS.map((day) => day.key)
  );

  // Ne pas masquer silencieusement les séances
  // dont le jour possède un libellé inhabituel.
  const unknownDays = Array.from(
    new Set(
      schedules
        .map((slot) => normalizeDay(slot.dayOfWeek))
        .filter((day) => !knownDayKeys.has(day))
    )
  );

  const displayDays = [
    ...visibleDays.map((day) => ({
      key: day.key as string,
      label: day.label as string,
    })),

    ...unknownDays.map((key) => ({
      key,
      label:
        schedules.find(
          (slot) =>
            normalizeDay(slot.dayOfWeek) === key
        )?.dayOfWeek ?? "Autre jour",
    })),
  ];

  const scheduleGroups = displayDays.map((day) => {
    const slots = schedules
      .filter(
        (slot) =>
          normalizeDay(slot.dayOfWeek) === day.key
      )
      .sort(
        (a, b) =>
          getTimeMinutes(a.startTime) -
            getTimeMinutes(b.startTime) ||
          a.startTime.localeCompare(b.startTime) ||
          a.subject.localeCompare(b.subject, "fr")
      );

    return {
      ...day,
      slots,
      count: slots.length,
    };
  });

  // ========================================
  // 4. INTERFACE UTILISATEUR
  // ========================================

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 pb-12">
      {/* =====================================
          HEADER
      ===================================== */}

      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-teal-500/10 blur-[100px]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
              <Sparkles size={14} />
              Organisation pédagogique
            </div>

            <div>
              <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                <CalendarDays
                  size={30}
                  className="shrink-0 text-teal-400"
                />
                Emploi du temps
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                {isAdmin
                  ? "Consultez les séances programmées, les salles et les enseignants de l'établissement."
                  : "Consultez vos séances hebdomadaires, les matières enseignées, les horaires et les salles attribuées."}
              </p>
            </div>
          </div>

          {/* TOTAL SEMAINE */}
          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-teal-500/20 bg-teal-500/10 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-400">
              <Timer size={25} />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                Total hebdomadaire
              </p>

              <p className="mt-1 text-2xl font-extrabold text-white">
                {totalSlots}
              </p>

              <p className="text-xs text-teal-100/70">
                Séance(s) programmée(s)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          STATISTIQUES
      ===================================== */}

      <section
        aria-label="Statistiques de l'emploi du temps"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={<CalendarCheck2 size={21} />}
          label="Séances"
          value={totalSlots}
          description="Créneaux hebdomadaires"
        />

        <StatCard
          icon={<GraduationCap size={21} />}
          label="Classes"
          value={classesCount}
          description="Classes distinctes"
        />

        <StatCard
          icon={<BookOpen size={21} />}
          label="Matières"
          value={subjectsCount}
          description="Disciplines programmées"
        />

        <StatCard
          icon={<CalendarDays size={21} />}
          label="Jours occupés"
          value={daysCount}
          description="Journées avec cours"
        />
      </section>

      {/* =====================================
          ACCÈS RAPIDE AUX JOURS
      ===================================== */}

      {totalSlots > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-[#111e30] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Layers3
              size={17}
              className="text-teal-400"
            />
            <h2 className="text-sm font-bold text-white">
              Navigation hebdomadaire
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {scheduleGroups.map((day, index) => (
              <a
                key={`${day.key}-${index}`}
                href={`#schedule-day-${index}`}
                className={[
                  "inline-flex items-center gap-2 rounded-xl",
                  "border px-3.5 py-2.5 text-xs font-semibold",
                  "transition-all",
                  day.count > 0
                    ? "border-teal-500/20 bg-teal-500/10 text-teal-300 hover:bg-teal-500/15"
                    : "border-slate-800 bg-[#08111f] text-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                {day.label}

                <span
                  className={
                    day.count > 0
                      ? "rounded-md bg-teal-500/15 px-1.5 py-0.5 text-[10px] text-teal-300"
                      : "rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500"
                  }
                >
                  {day.count}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* =====================================
          PLANNING HEBDOMADAIRE
      ===================================== */}

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <CalendarDays
                size={20}
                className="text-teal-400"
              />
              Planning de la semaine
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Répartition des cours par journée
            </p>
          </div>

          <span className="rounded-full border border-slate-700 bg-[#111e30] px-3 py-1.5 text-xs font-medium text-slate-400">
            {isAdmin
              ? "Vue administrateur"
              : "Vue enseignant"}
          </span>
        </div>

        {totalSlots === 0 ? (
          // =================================
          // ÉTAT VIDE GLOBAL
          // =================================
          <div className="rounded-3xl border border-dashed border-slate-700 bg-[#111e30] px-6 py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-teal-500/20 bg-teal-500/10 text-teal-400">
              <CalendarX2 size={36} />
            </div>

            <h3 className="text-lg font-bold text-white">
              Aucun cours programmé
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
              {isAdmin
                ? "Aucune séance n'est enregistrée dans l'emploi du temps de l'établissement."
                : "Votre emploi du temps n'a pas encore été renseigné. Contactez votre administration pour connaître vos prochaines affectations."}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#08111f] px-4 py-3 text-xs text-slate-400">
              <Info
                size={16}
                className="text-teal-400"
              />
              Les horaires apparaîtront ici après
              leur enregistrement.
            </div>
          </div>
        ) : (
          // =================================
          // GRILLE HEBDOMADAIRE
          // =================================
          <div className="grid items-start gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {scheduleGroups.map((day, dayIndex) => {
              const hasCourses = day.count > 0;

              return (
                <article
                  id={`schedule-day-${dayIndex}`}
                  key={`${day.key}-${dayIndex}`}
                  className={[
                    "scroll-mt-28 overflow-hidden rounded-3xl",
                    "border bg-[#111e30] shadow-lg",
                    "transition-all duration-300",
                    hasCourses
                      ? "border-slate-800 hover:border-teal-500/25"
                      : "border-slate-800/60",
                  ].join(" ")}
                >
                  {/* EN-TÊTE DU JOUR */}
                  <div className="border-b border-slate-800 bg-[#0c1727] px-5 py-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={[
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            hasCourses
                              ? "bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.35)]"
                              : "bg-slate-700",
                          ].join(" ")}
                        />

                        <h3 className="truncate text-base font-bold text-white">
                          {day.label}
                        </h3>
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full border px-3 py-1",
                          "text-[11px] font-bold",
                          hasCourses
                            ? "border-teal-500/20 bg-teal-500/10 text-teal-300"
                            : "border-slate-800 bg-[#08111f] text-slate-500",
                        ].join(" ")}
                      >
                        {day.count} cours
                      </span>
                    </div>
                  </div>

                  {/* CONTENU DU JOUR */}
                  <div className="space-y-3 p-4 sm:p-5">
                    {!hasCourses ? (
                      <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-[#08111f]/50 px-4 py-8 text-center">
                        <CalendarX2
                          size={25}
                          className="mb-3 text-slate-700"
                        />

                        <p className="text-xs font-medium text-slate-500">
                          Aucun cours programmé
                        </p>
                      </div>
                    ) : (
                      day.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="group rounded-2xl border border-slate-800 bg-[#08111f] p-4 transition-all duration-300 hover:border-teal-500/30 hover:bg-[#0b1c2b]"
                        >
                          {/* HORAIRE */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-2 rounded-lg border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-300">
                              <Clock3 size={15} />

                              <span>
                                {slot.startTime} –{" "}
                                {slot.endTime}
                              </span>
                            </div>

                            {slot.room ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                <MapPin
                                  size={13}
                                  className="text-sky-400"
                                />

                                {slot.room}
                              </span>
                            ) : (
                              <span className="text-[11px] italic text-slate-600">
                                Salle non renseignée
                              </span>
                            )}
                          </div>

                          {/* MATIÈRE */}
                          <div className="mt-4 border-t border-slate-800/70 pt-4">
                            <div className="flex items-start gap-2">
                              <BookOpen
                                size={18}
                                className="mt-0.5 shrink-0 text-teal-400"
                              />

                              <h4 className="break-words text-sm font-bold leading-6 text-white transition-colors group-hover:text-teal-300">
                                {slot.subject}
                              </h4>
                            </div>
                          </div>

                          {/* CLASSE */}
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                            <GraduationCap
                              size={16}
                              className="shrink-0 text-sky-400"
                            />

                            <span>Classe :</span>

                            <span className="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 font-semibold text-white">
                              {slot.class.name} —{" "}
                              {slot.class.level}
                            </span>
                          </div>

                          {/* ENSEIGNANT EN VUE ADMIN */}
                          {isAdmin && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                              <UserRound
                                size={16}
                                className="shrink-0 text-violet-400"
                              />

                              <span>Enseignant :</span>

                              <span className="font-semibold text-slate-200">
                                {slot.teacher.name ??
                                  "Non renseigné"}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* FOOTER DE JOUR */}
                  {hasCourses && (
                    <div className="flex items-center justify-between border-t border-slate-800 bg-[#0c1727] px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <CalendarCheck2 size={14} />
                        Séances inscrites
                      </span>

                      <span className="text-[11px] font-bold text-teal-400">
                        {day.count} créneau(x)
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================
          RAPPEL D'ORGANISATION
      ===================================== */}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#111e30] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
            <ShieldCheck size={19} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">
              Planning pédagogique
            </h3>

            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400">
              {isAdmin
                ? "Cette vue présente les séances actuellement enregistrées pour les enseignants de l'établissement."
                : "Votre emploi du temps est renseigné par l'administration. Toute modification d'horaire, de classe ou de salle doit être communiquée à votre établissement."}
            </p>
          </div>
        </div>

        {isAdmin && (
          <Link
            href="/admin/assignments"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/10 px-4 py-3 text-xs font-bold text-teal-300 transition hover:bg-teal-500/15"
          >
            <School size={16} />
            Affectations pédagogiques
            <ArrowRight size={14} />
          </Link>
        )}
      </section>
    </div>
  );
}
