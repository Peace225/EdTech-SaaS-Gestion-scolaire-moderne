// src/app/student/subjects/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Layers,
  PenTool,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

type SubjectCard = {
  name: string;
  teachers: { id: string; name: string }[];
  exerciseCount: number;
  homeworkCount: number;
  sessionCount: number;
};

export default async function StudentSubjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Le rôle est vérifié dans la base, et non dans les données de session.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      studentProfile: {
        select: {
          id: true,
          classId: true,
          class: {
            select: {
              id: true,
              name: true,
              level: true,
              educationType: true,
            },
          },
        },
      },
    },
  });

  if (!user) redirect("/login");
  if (user.role === "PARENT") redirect("/parent/dashboard");
  if (user.role === "TEACHER") redirect("/teacher/dashboard");
  if (user.role !== "STUDENT" && user.role !== "ADMIN") redirect("/login");

  const student = user.studentProfile;

  // Aucun étudiant tiers n'est sélectionné arbitrairement pour un ADMIN.
  if (!student) {
    const isAdmin = user.role === "ADMIN";
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-[#111e30] p-7 text-center shadow-xl sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
          {isAdmin ? <ShieldCheck size={26} /> : <AlertCircle size={26} />}
        </div>
        <h1 className="text-xl font-extrabold text-white">
          {isAdmin ? "Aucun profil apprenant à afficher" : "Dossier apprenant introuvable"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          {isAdmin
            ? "Votre compte administrateur n'est lié à aucun apprenant. Cette page ne sélectionne pas les données d'un autre élève automatiquement."
            : "Votre compte n'est pas encore associé à une classe ou à une promotion. Contactez l'administration pour finaliser votre inscription."}
        </p>
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400"
          >
            Retour à l'administration <ArrowUpRight size={16} />
          </Link>
        )}
      </section>
    );
  }

  const classroom = student.class;
  const isProfessional = classroom.educationType === "PROFESSIONAL";
  const subjectLabel = isProfessional ? "modules" : "matières";
  const teacherLabel = isProfessional ? "formateurs" : "enseignants";

  // Les données sont strictement limitées à la classe/promotion de l'utilisateur.
  const [assignments, schedules] = await Promise.all([
    prisma.teachingAssignment.findMany({
      where: { classId: student.classId },
      select: {
        id: true,
        subject: true,
        teacher: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            exercises: { where: { status: "PUBLISHED" } },
            homeworks: { where: { status: "PUBLISHED" } },
          },
        },
      },
      orderBy: { subject: "asc" },
    }),
    prisma.schedule.findMany({
      where: { classId: student.classId },
      select: { subject: true },
    }),
  ]);

  const scheduledBySubject = new Map<string, number>();
  for (const schedule of schedules) {
    const key = schedule.subject.trim();
    scheduledBySubject.set(key, (scheduledBySubject.get(key) ?? 0) + 1);
  }

  // Plusieurs enseignants peuvent intervenir dans une même matière.
  const bySubject = new Map<string, SubjectCard>();
  for (const assignment of assignments) {
    const name = assignment.subject.trim();
    const subject = bySubject.get(name) ?? {
      name,
      teachers: [],
      exerciseCount: 0,
      homeworkCount: 0,
      sessionCount: scheduledBySubject.get(name) ?? 0,
    };

    if (!subject.teachers.some((teacher) => teacher.id === assignment.teacher.id)) {
      subject.teachers.push({
        id: assignment.teacher.id,
        name: assignment.teacher.name?.trim() || "Nom non renseigné",
      });
    }

    subject.exerciseCount += assignment._count.exercises;
    subject.homeworkCount += assignment._count.homeworks;
    bySubject.set(name, subject);
  }

  const subjects = Array.from(bySubject.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "fr")
  );
  const totalTeachers = new Set(
    subjects.flatMap((subject) => subject.teachers.map((teacher) => teacher.id))
  ).size;
  const totalExercises = subjects.reduce((sum, subject) => sum + subject.exerciseCount, 0);
  const totalHomeworks = subjects.reduce((sum, subject) => sum + subject.homeworkCount, 0);

  const stats = [
    {
      label: isProfessional ? "Modules attribués" : "Matières enseignées",
      value: subjects.length,
      icon: Layers,
      color: "text-indigo-400",
      surface: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: isProfessional ? "Formateurs référents" : "Enseignants référents",
      value: totalTeachers,
      icon: UsersRound,
      color: "text-cyan-400",
      surface: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      label: "Exercices publiés",
      value: totalExercises,
      icon: PenTool,
      color: "text-amber-400",
      surface: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Devoirs publiés",
      value: totalHomeworks,
      icon: ClipboardList,
      color: "text-teal-400",
      surface: "bg-teal-500/10 border-teal-500/20",
    },
  ];

  return (
    <div className="relative mx-auto max-w-7xl space-y-7 pb-14 text-slate-100">
      <div className="pointer-events-none absolute -top-10 right-0 h-60 w-60 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="pointer-events-none absolute top-80 left-0 h-56 w-56 rounded-full bg-teal-600/10 blur-3xl" />

      <header className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30]/90 p-6 shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="min-w-0 space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-300">
              <Sparkles size={14} />
              {isProfessional ? "Programme de formation" : "Programme pédagogique"}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {isProfessional ? "Mes modules de formation" : "Mes matières enseignées"}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-400">
              Consultez les {subjectLabel} réellement attribués à votre {isProfessional ? "promotion" : "classe"},
              les {teacherLabel} référents et les activités publiées.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#08111f] px-3 py-2 text-slate-200">
                <GraduationCap size={14} className="text-indigo-400" />
                {isProfessional ? "Formation" : "Classe"} : {classroom.name}
              </span>
              {classroom.level && (
                <span className="rounded-lg border border-slate-700 bg-[#08111f] px-3 py-2 text-slate-300">
                  {isProfessional ? "Promotion" : "Niveau"} : {classroom.level}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-5 py-4">
            <Layers className="text-indigo-300" size={28} />
            <div>
              <p className="text-xs text-indigo-200/70">Total de {subjectLabel}</p>
              <p className="text-2xl font-extrabold text-white">{subjects.length}</p>
            </div>
          </div>
        </div>
      </header>

      <section aria-label="Statistiques pédagogiques" className="relative grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-[#111e30]/85 p-4 shadow-lg sm:p-5">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${stat.surface}`}>
                <Icon className={stat.color} size={19} />
              </div>
              <p className="text-2xl font-extrabold text-white">{stat.value}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </section>

      <section className="relative space-y-4" aria-labelledby="student-subjects-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="student-subjects-heading" className="flex items-center gap-2 text-lg font-bold text-white">
            <BookOpen size={19} className="text-teal-400" />
            {isProfessional ? "Modules de ma promotion" : "Matières de ma classe"}
          </h2>
          <Link href="/student/schedule" className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 transition hover:text-teal-200">
            <CalendarDays size={15} /> Voir mon planning <ArrowUpRight size={13} />
          </Link>
        </div>

        {subjects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-[#111e30]/80 p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
              <Layers size={27} />
            </div>
            <h3 className="text-base font-bold text-white">
              {isProfessional ? "Aucun module attribué" : "Aucune matière attribuée"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Aucune affectation pédagogique n'est encore enregistrée pour {isProfessional ? "votre promotion" : "votre classe"}.
              L'administration devra affecter des {teacherLabel} avant que les {subjectLabel} apparaissent ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => (
              <article
                key={subject.name}
                className="group flex min-w-0 flex-col justify-between gap-6 rounded-3xl border border-slate-800 bg-[#111e30]/90 p-6 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:border-teal-500/30 hover:shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-bold text-indigo-300">
                      <BookOpen size={13} />
                      {isProfessional ? "Module" : "Matière"}
                    </span>
                    <span className="rounded-lg border border-slate-700 bg-[#08111f] px-2.5 py-1.5 text-[11px] text-slate-400">
                      {subject.sessionCount} séance{subject.sessionCount > 1 ? "s" : ""} planifiée{subject.sessionCount > 1 ? "s" : ""}
                    </span>
                  </div>

                  <h3 className="break-words text-xl font-extrabold leading-snug text-white">
                    {subject.name}
                  </h3>

                  <div className="space-y-2 rounded-2xl border border-slate-800 bg-[#08111f]/60 p-3">
                    <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <UserRound size={14} className="text-cyan-400" />
                      {isProfessional ? "Formateur(s)" : "Enseignant(s)"}
                    </p>
                    <div className="space-y-1">
                      {subject.teachers.map((teacher) => (
                        <p key={teacher.id} className="break-words text-sm font-medium text-slate-200">
                          {teacher.name}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-800 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/15 bg-amber-500/5 px-2.5 py-1.5 text-[11px] font-medium text-amber-300">
                      <PenTool size={13} /> {subject.exerciseCount} exercice{subject.exerciseCount > 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/15 bg-teal-500/5 px-2.5 py-1.5 text-[11px] font-medium text-teal-300">
                      <ClipboardList size={13} /> {subject.homeworkCount} devoir{subject.homeworkCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href="/student/exercises" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200">
                      Exercices <ArrowUpRight size={13} />
                    </Link>
                    <Link href="/student/assignments" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300 hover:text-teal-200">
                      Devoirs <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="relative text-xs leading-6 text-slate-500">
        Les {subjectLabel} et les {teacherLabel} proviennent des affectations pédagogiques enregistrées.
        Les nombres d'exercices et de devoirs concernent uniquement les contenus publiés.
        Les coefficients des évaluations ne sont pas affichés comme des coefficients de matière.
      </p>
    </div>
  );
}
