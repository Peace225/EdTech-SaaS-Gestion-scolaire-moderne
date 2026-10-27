
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import NewExerciseForm from "./NewExerciseForm";

export const dynamic = "force-dynamic";

export default async function NewTeacherExercisePage() {
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

  // Récupérer les véritables affectations.
  const assignments =
    await prisma.teachingAssignment.findMany({
      where:
        user.role === "TEACHER"
          ? { teacherId: user.id }
          : {},
      select: {
        id: true,
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
      orderBy: [
        { class: { name: "asc" } },
        { subject: "asc" },
      ],
    });

  const assignmentOptions = assignments.map(
    (assignment) => ({
      id: assignment.id,
      subject: assignment.subject,
      className: assignment.class.name,
      classLevel: assignment.class.level,
      teacherName:
        assignment.teacher.name ?? "Enseignant",
    })
  );

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-12">
      {/* RETOUR */}
      <Link
        href="/teacher/exercises"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-teal-400"
      >
        <ArrowLeft size={17} />
        Retour aux exercices
      </Link>

      {/* EN-TÊTE */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-500/10 blur-[100px]" />

        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
            <Sparkles size={14} />
            Création pédagogique
          </div>

          <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            <BookOpen
              size={29}
              className="shrink-0 text-teal-400"
            />
            Nouvel exercice
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-400">
            Préparez une série d'exercices,
            définissez son niveau de difficulté,
            puis enregistrez-la comme brouillon
            ou publiez-la pour la classe sélectionnée.
          </p>
        </div>
      </section>

      {/* RÉSUMÉ */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-[#111e30] p-5">
          <div className="rounded-xl bg-teal-500/10 p-3 text-teal-400">
            <GraduationCap size={23} />
          </div>

          <div>
            <p className="text-xl font-bold text-white">
              {assignmentOptions.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Affectations disponibles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-[#111e30] p-5">
          <div className="rounded-xl bg-sky-500/10 p-3 text-sky-400">
            <ShieldCheck size={23} />
          </div>

          <div>
            <p className="font-bold text-white">
              Publication sécurisée
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Classe et matière vérifiées en base
            </p>
          </div>
        </div>
      </section>

      {assignmentOptions.length === 0 ? (
        <section className="rounded-3xl border border-slate-800 bg-[#111e30] px-6 py-14 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
            <Users size={30} />
          </div>

          <h2 className="text-lg font-bold text-white">
            Aucune affectation pédagogique
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
            Une classe et une matière doivent
            vous être attribuées avant de pouvoir
            créer un exercice.
          </p>

          <Link
            href="/teacher/exercises"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400"
          >
            Retour aux exercices
          </Link>
        </section>
      ) : (
        <NewExerciseForm
          assignments={assignmentOptions}
          isAdmin={user.role === "ADMIN"}
        />
      )}
    </div>
  );
}
