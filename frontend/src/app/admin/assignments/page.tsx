
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import {
  BookOpen,
  Users,
  GraduationCap,
  Briefcase,
  Phone,
  MapPin,
  Mail,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  ChevronRight,
  Layers,
  Award,
  UserPlus,
} from "lucide-react";

import {
  CreateAssignmentForm,
  DeleteAssignmentButton,
  type AssignmentState,
} from "./AssignmentForms";

export const dynamic = "force-dynamic";

// Matières disponibles
const SUBJECTS = [
  "Mathématiques",
  "Français",
  "Anglais",
  "Physique-Chimie",
  "SVT",
  "Histoire-Géographie",
  "Philosophie",
  "Espagnol",
  "Allemand",
  "EPS",
  "Informatique",
  "EDHC",
  "Arts Plastiques",
  "Musique",
] as const;

const formatter = new Intl.NumberFormat("fr-FR");

// =======================================
// NOM DE L'ENSEIGNANT
// =======================================

function formatTeacherName(user: {
  name: string | null;
  email: string | null;
}) {
  if (user.name?.trim()) {
    return user.name.trim();
  }

  if (user.email) {
    return user.email
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map(
        (part) =>
          part.charAt(0).toUpperCase() +
          part.slice(1).toLowerCase()
      )
      .join(" ");
  }

  return "Enseignant";
}

// =======================================
// CONTRÔLE DES AUTORISATIONS
// =======================================

async function requireAdmin() {
  const session = await auth();

  const userId = (
    session?.user as { id?: string } | undefined
  )?.id;

  if (!userId) {
    redirect("/login");
  }

  // Vérification du rôle actuel en base,
  // même si la session JWT est encore valide.
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (account?.role !== "ADMIN") {
    redirect("/");
  }
}

// =======================================
// PAGE ADMINISTRATEUR
// =======================================

export default async function AdminAssignmentsPage() {
  await requireAdmin();

  // =======================================
  // CRÉATION D'UNE AFFECTATION
  // =======================================

  async function createAssignment(
    _previousState: AssignmentState,
    formData: FormData
  ): Promise<AssignmentState> {
    "use server";

    await requireAdmin();

    const rawTeacherId = formData.get("teacherId");
    const rawClassId = formData.get("classId");
    const rawSubject = formData.get("subject");

    if (
      typeof rawTeacherId !== "string" ||
      typeof rawClassId !== "string" ||
      typeof rawSubject !== "string"
    ) {
      return {
        status: "error",
        message: "Les informations transmises sont invalides.",
      };
    }

    const teacherId = rawTeacherId.trim();
    const classId = rawClassId.trim();
    const subject = rawSubject.trim();

    if (!teacherId || !classId || !subject) {
      return {
        status: "error",
        message: "Veuillez renseigner tous les champs.",
      };
    }

    // Empêcher les matières non autorisées
    if (!SUBJECTS.some((item) => item === subject)) {
      return {
        status: "error",
        message: "La matière sélectionnée est invalide.",
      };
    }

    try {
      // Vérifier le rôle enseignant et la classe
      const [teacher, schoolClass] = await Promise.all([
        prisma.user.findFirst({
          where: {
            id: teacherId,
            role: "TEACHER",
          },
          select: { id: true },
        }),

        prisma.class.findUnique({
          where: { id: classId },
          select: { id: true },
        }),
      ]);

      if (!teacher) {
        return {
          status: "error",
          message: "Le compte enseignant est introuvable.",
        };
      }

      if (!schoolClass) {
        return {
          status: "error",
          message: "La classe sélectionnée est introuvable.",
        };
      }

      // Prévenir les affectations en double
      const existing = await prisma.teachingAssignment.findFirst({
        where: {
          teacherId,
          classId,
          subject,
        },
        select: { id: true },
      });

      if (existing) {
        return {
          status: "error",
          message:
            "Cet enseignant est déjà affecté à cette matière dans cette classe.",
        };
      }

      await prisma.teachingAssignment.create({
        data: {
          teacherId,
          classId,
          subject,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          status: "error",
          message: "Cette affectation existe déjà.",
        };
      }

      console.error("Création affectation :", error);

      return {
        status: "error",
        message: "Impossible de créer cette affectation.",
      };
    }

    revalidatePath("/admin/assignments");

    return {
      status: "success",
      message: "Affectation enregistrée avec succès.",
    };
  }

  // =======================================
  // SUPPRESSION D'UNE AFFECTATION
  // =======================================

  async function deleteAssignment(
    _previousState: AssignmentState,
    formData: FormData
  ): Promise<AssignmentState> {
    "use server";

    await requireAdmin();

    const rawId = formData.get("id");

    if (typeof rawId !== "string" || !rawId.trim()) {
      return {
        status: "error",
        message: "Identifiant de l'affectation invalide.",
      };
    }

    const id = rawId.trim();

    try {
      const assignment = await prisma.teachingAssignment.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!assignment) {
        return {
          status: "error",
          message: "Cette affectation n'existe plus.",
        };
      }

      await prisma.teachingAssignment.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Suppression affectation :", error);

      return {
        status: "error",
        message:
          "Suppression impossible. Vérifiez les données associées.",
      };
    }

    revalidatePath("/admin/assignments");

    return {
      status: "success",
      message: "Affectation supprimée.",
    };
  }

  // =======================================
  // DONNÉES PRISMA
  // =======================================

  const [teachers, classes, assignments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TEACHER" },
      select: {
        id: true,
        name: true,
        email: true,
        teacherProfile: {
          select: {
            specialty: true,
            phone: true,
          },
        },
      },
      orderBy: { email: "asc" },
    }),

    prisma.class.findMany({
      select: {
        id: true,
        name: true,
        level: true,
      },
      orderBy: [
        { level: "asc" },
        { name: "asc" },
      ],
    }),

    prisma.teachingAssignment.findMany({
      select: {
        id: true,
        subject: true,
        teacher: {
          select: {
            name: true,
            email: true,
            teacherProfile: {
              select: {
                phone: true,
                address: true,
                specialty: true,
                degree: true,
              },
            },
          },
        },
        class: {
          select: {
            name: true,
            level: true,
          },
        },
      },
      orderBy: { id: "desc" },
    }),
  ]);

  // =======================================
  // STATISTIQUES
  // =======================================

  const stats = [
    {
      title: "Enseignants",
      value: teachers.length,
      icon: Users,
      color: "text-cyan-300 bg-cyan-400/10",
    },
    {
      title: "Classes disponibles",
      value: classes.length,
      icon: GraduationCap,
      color: "text-violet-300 bg-violet-400/10",
    },
    {
      title: "Affectations",
      value: assignments.length,
      icon: Briefcase,
      color: "text-emerald-300 bg-emerald-400/10",
    },
    {
      title: "Matières proposées",
      value: SUBJECTS.length,
      icon: BookOpen,
      color: "text-amber-300 bg-amber-400/10",
    },
  ];

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#08111f] text-white">
      {/* Ambiance lumineuse */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(20,184,166,0.08),transparent_40%),radial-gradient(ellipse_at_95%_60%,rgba(59,130,246,0.06),transparent_40%)]" />

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 pb-16 sm:px-6 lg:px-8">

        {/* Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <LayoutDashboard
            size={16}
            className="text-teal-400"
          />

          <Link
            href="/admin/dashboard"
            className="transition-colors hover:text-teal-300"
          >
            Administration
          </Link>

          <ChevronRight size={14} />

          <span className="font-semibold text-white">
            Affectations
          </span>
        </div>

        {/* =============================
            HERO
        ============================= */}
        <section className="relative overflow-hidden rounded-[30px] border border-teal-400/15 bg-gradient-to-br from-[#123d49] via-[#102a3a] to-[#0d1b2c] p-7 shadow-2xl sm:p-9">

          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-teal-400/10 blur-[85px]" />

          <div className="relative z-10 flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-teal-300">
                <Sparkles size={15} />
                Organisation pédagogique
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Affectations des{" "}
                <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  enseignants
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                Associez les enseignants aux classes et aux
                matières, et centralisez leur suivi pédagogique.
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-teal-400/20 bg-teal-400/10 text-teal-300">
              <Briefcase size={30} strokeWidth={1.6} />
            </div>
          </div>
        </section>

        {/* =============================
            STATISTIQUES
        ============================= */}
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group rounded-[24px] border border-white/[0.08] bg-[#111e30] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/25 sm:p-6"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}
                >
                  <Icon size={23} />
                </div>

                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {item.title}
                </p>

                <p className="mt-3 text-3xl font-extrabold text-white">
                  {formatter.format(item.value)}
                </p>
              </div>
            );
          })}
        </section>

        {/* =============================
            FORMULAIRE
        ============================= */}
        <CreateAssignmentForm
          teachers={teachers}
          classes={classes}
          subjects={SUBJECTS}
          action={createAssignment}
        />

        {/* =============================
            LISTE DES AFFECTATIONS
        ============================= */}
        <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111e30]/90">

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] p-6 sm:px-7">

            <div>
              <h2 className="text-lg font-bold text-white">
                Affectations enregistrées
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Enseignants, contacts, profils pédagogiques et matières.
              </p>
            </div>

            <span className="rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-xs font-bold text-teal-300">
              {formatter.format(assignments.length)} affectation(s)
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[25px] bg-teal-400/10 text-teal-300">
                <Briefcase size={35} />
              </div>

              <h3 className="text-lg font-bold">
                Aucune affectation enregistrée
              </h3>

              <p className="max-w-md text-sm leading-7 text-slate-400">
                Sélectionnez un enseignant, une classe et une matière
                dans le formulaire ci-dessus pour commencer.
              </p>
            </div>
          ) : (
            <>
              {/* Tableau desktop */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="border-b border-white/[0.07] bg-[#0c192a]">
                    <tr>
                      {[
                        "Enseignant & contact",
                        "Profil pédagogique",
                        "Classe & matière",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 last:text-right"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.06]">
                    {assignments.map((item) => {
                      const name = formatTeacherName(item.teacher);
                      const profile = item.teacher.teacherProfile;

                      return (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-white/[0.035]"
                        >
                          <td className="px-5 py-6 align-top">
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/10 font-bold text-teal-300">
                                {name.charAt(0).toUpperCase()}
                              </div>

                              <div className="min-w-0 space-y-2">
                                <p className="font-bold text-white">
                                  {name}
                                </p>

                                {item.teacher.email && (
                                  <a
                                    href={`mailto:${item.teacher.email}`}
                                    className="flex items-center gap-2 break-all text-xs text-slate-400 hover:text-teal-300"
                                  >
                                    <Mail size={13} className="shrink-0" />
                                    {item.teacher.email}
                                  </a>
                                )}

                                {profile?.phone && (
                                  <p className="flex items-center gap-2 text-xs text-slate-400">
                                    <Phone size={13} />
                                    {profile.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-6 align-top">
                            <div className="space-y-2">
                              {profile?.specialty ? (
                                <span className="inline-flex rounded-lg border border-cyan-400/15 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-300">
                                  {profile.specialty}
                                </span>
                              ) : (
                                <p className="text-xs text-slate-500">
                                  Spécialité non renseignée
                                </p>
                              )}

                              {profile?.degree && (
                                <p className="flex items-center gap-2 text-xs text-slate-400">
                                  <Award size={14} />
                                  {profile.degree}
                                </p>
                              )}

                              {profile?.address && (
                                <p className="flex items-center gap-2 text-xs text-slate-400">
                                  <MapPin size={14} />
                                  {profile.address}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-6 align-top">
                            <div className="flex flex-col items-start gap-2">
                              <span className="inline-flex items-center gap-2 rounded-lg border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-300">
                                <GraduationCap size={14} />
                                {item.class.name}
                              </span>

                              <span className="text-xs text-slate-500">
                                Niveau : {item.class.level}
                              </span>

                              <span className="inline-flex items-center gap-2 rounded-lg border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
                                <BookOpen size={14} />
                                {item.subject}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-6 text-right align-top">
                            <DeleteAssignmentButton
                              id={item.id}
                              label={`${name} — ${item.subject} (${item.class.name})`}
                              action={deleteAssignment}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cartes mobile */}
              <div className="divide-y divide-white/[0.07] lg:hidden">
                {assignments.map((item) => {
                  const name = formatTeacherName(item.teacher);
                  const profile = item.teacher.teacherProfile;

                  return (
                    <article key={item.id} className="space-y-5 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-400/10 font-bold text-teal-300">
                            {name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-bold text-white">
                              {name}
                            </h3>

                            <p className="break-all text-xs text-slate-400">
                              {item.teacher.email || "E-mail non renseigné"}
                            </p>
                          </div>
                        </div>

                        <DeleteAssignmentButton
                          id={item.id}
                          label={`${name} — ${item.subject}`}
                          action={deleteAssignment}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg bg-violet-400/10 px-3 py-2 text-xs text-violet-300">
                          {item.class.name} — {item.class.level}
                        </span>

                        <span className="rounded-lg bg-teal-400/10 px-3 py-2 text-xs text-teal-300">
                          {item.subject}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-400">
                        {profile?.specialty && (
                          <p className="flex items-center gap-2">
                            <BookOpen size={14} />
                            {profile.specialty}
                          </p>
                        )}

                        {profile?.degree && (
                          <p className="flex items-center gap-2">
                            <Award size={14} />
                            {profile.degree}
                          </p>
                        )}

                        {profile?.phone && (
                          <p className="flex items-center gap-2">
                            <Phone size={14} />
                            {profile.phone}
                          </p>
                        )}

                        {profile?.address && (
                          <p className="flex items-center gap-2">
                            <MapPin size={14} />
                            {profile.address}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Liens utiles */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#111e30] px-4 py-3 text-xs font-semibold text-slate-300 transition-colors hover:border-teal-400/30 hover:text-teal-300"
          >
            <UserPlus size={16} />
            Ajouter un enseignant
          </Link>

          <Link
            href="/admin/classes"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#111e30] px-4 py-3 text-xs font-semibold text-slate-300 transition-colors hover:border-teal-400/30 hover:text-teal-300"
          >
            <Layers size={16} />
            Gérer les classes
          </Link>
        </div>

        <footer className="flex items-center gap-2 border-t border-white/[0.07] pt-6 text-xs text-slate-500">
          <ShieldCheck size={15} className="text-emerald-400" />
          EdTech SaaS • Light Energy Digital
        </footer>
      </div>
    </main>
  );
}
