
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import NewHomeworkForm from "./NewHomeworkForm";

export const dynamic = "force-dynamic";

export default async function NewTeacherAssignmentPage() {
  // Vérification de l'utilisateur
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

  const isAdmin = user.role === "ADMIN";

  // Affectations réelles depuis PostgreSQL
  const assignments =
    await prisma.teachingAssignment.findMany({
      where: isAdmin
        ? {}
        : { teacherId: user.id },

      select: {
        id: true,
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

  const options = assignments.map((item) => ({
    id: item.id,
    subject: item.subject,
    className: item.class.name,
    classLevel: item.class.level,
    studentsCount: item.class._count.students,
    teacherName:
      item.teacher.name ?? "Enseignant",
  }));

  const classCount = new Set(
    assignments.map((item) => item.class.id)
  ).size;

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-12">
      {/* RETOUR */}
      <Link
        href="/teacher/assignments"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-teal-400"
      >
        <ArrowLeft size={17} />
        Retour aux devoirs
      </Link>

      {/* HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-teal-500/10 blur-[100px]" />

        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
            <Sparkles size={14} />
            Espace pédagogique
          </div>

          <h1 className="flex items-center gap-3 text-2xl font-extrabold text-white md:text-3xl">
            <ClipboardList
              size={29}
              className="shrink-0 text-teal-400"
            />
            Nouveau devoir ou composition
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-400">
            Préparez un devoir maison avec une
            date limite, ou enregistrez une
            composition chronométrée en brouillon.
            Toutes les informations sont associées
            à vos affectations pédagogiques.
          </p>
        </div>
      </section>

      {/* INDICATEURS */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-[#111e30] p-5">
          <div className="rounded-xl bg-teal-500/10 p-3 text-teal-400">
            <GraduationCap size={23} />
          </div>

          <div>
            <p className="text-xl font-bold text-white">
              {classCount}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Classes accessibles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-[#111e30] p-5">
          <div className="rounded-xl bg-sky-500/10 p-3 text-sky-400">
            <ShieldCheck size={23} />
          </div>

          <div>
            <p className="font-bold text-white">
              Création sécurisée
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Affectations vérifiées sur le serveur
            </p>
          </div>
        </div>
      </section>

      {/* FORMULAIRE OU ETAT VIDE */}
      {options.length === 0 ? (
        <section className="rounded-3xl border border-slate-800 bg-[#111e30] px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
            <Users size={30} />
          </div>

          <h2 className="text-lg font-bold text-white">
            Aucune affectation disponible
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
            {isAdmin
              ? "Aucune affectation pédagogique n'est encore enregistrée."
              : "L'administration doit vous attribuer une classe et une matière avant la création d'un devoir."}
          </p>

          <Link
            href="/teacher/assignments"
            className="mt-6 inline-flex rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-teal-400"
          >
            Retour aux devoirs
          </Link>
        </section>
      ) : (
        <NewHomeworkForm
          assignments={options}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
