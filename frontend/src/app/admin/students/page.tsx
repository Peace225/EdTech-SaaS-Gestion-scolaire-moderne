
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import {
  GraduationCap,
  AlertCircle,
  ShieldCheck,
  Users,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  ChevronRight,
  LayoutDashboard,
  Sparkles,
  UserPlus,
  Link2,
  Layers,
} from "lucide-react";

import ParentLinkForm from "./ParentLinkForm";

import type { LinkParentState } from "./ParentLinkForm";

export const dynamic = "force-dynamic";

const formatter = new Intl.NumberFormat("fr-FR");

// ======================================
// TYPES
// ======================================

type Person = {
  name: string | null;
  email: string | null;
};

type ParentContact = Person & {
  parentProfile: {
    phone: string | null;
    address: string | null;
  } | null;
};

// ======================================
// FORMATAGE NOM
// ======================================

function formatPersonName(
  person: Person | null,
  fallback = "Utilisateur"
): string {
  if (!person) return fallback;

  const name = person.name?.trim();

  if (name) return name;

  const email = person.email?.trim();

  if (!email) return fallback;

  return email
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

// ======================================
// AVATAR
// ======================================

function StudentAvatar({ user }: { user: Person }) {
  const displayName = formatPersonName(user, "Élève");

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-extrabold text-cyan-300">
      {initials || "E"}
    </div>
  );
}

// ======================================
// IDENTITÉ ÉLÈVE
// ======================================

function StudentIdentity({ user }: { user: Person }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <StudentAvatar user={user} />

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">
          {formatPersonName(user, "Élève non nommé")}
        </p>

        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-400">
          <Mail size={12} className="shrink-0 text-slate-500" />
          <span className="truncate">
            {user.email || "Aucun e-mail"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ======================================
// COORDONNÉES DU PARENT
// ======================================

function ParentDetails({
  parent,
}: {
  parent: ParentContact | null;
}) {
  if (!parent) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300">
        <AlertCircle size={15} />
        Aucun parent associé
      </span>
    );
  }

  const phone = parent.parentProfile?.phone?.trim();
  const address = parent.parentProfile?.address?.trim();

  const whatsappNumber = phone?.replace(/\D/g, "") ?? "";

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
        <ShieldCheck size={16} className="shrink-0" />

        <span className="break-words">
          {formatPersonName(parent, "Parent")}
        </span>
      </div>

      <div className="space-y-2 pl-0.5">
        {/* E-mail */}
        {parent.email ? (
          <a
            href={`mailto:${parent.email}`}
            className="flex w-fit max-w-full items-center gap-2 text-xs text-slate-400 transition-colors hover:text-teal-300"
          >
            <Mail size={14} className="shrink-0" />

            <span className="break-all">
              {parent.email}
            </span>
          </a>
        ) : (
          <p className="text-xs text-slate-500">
            Aucun e-mail renseigné
          </p>
        )}

        {/* Téléphone WhatsApp */}
        {phone ? (
          whatsappNumber.length >= 7 ? (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit max-w-full items-center gap-2 text-xs text-slate-400 transition-colors hover:text-emerald-300"
            >
              <MessageCircle
                size={14}
                className="shrink-0 text-emerald-400"
              />

              <span className="break-words">{phone}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Phone size={14} className="shrink-0" />
              {phone}
            </div>
          )
        ) : (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Phone size={14} />
            Téléphone non renseigné
          </p>
        )}

        {/* Adresse */}
        {address ? (
          <p className="flex items-start gap-2 text-xs leading-5 text-slate-400">
            <MapPin
              size={14}
              className="mt-0.5 shrink-0 text-cyan-400"
            />

            <span className="break-words">{address}</span>
          </p>
        ) : (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={14} />
            Adresse non renseignée
          </p>
        )}
      </div>
    </div>
  );
}

// ======================================
// PAGE ADMINISTRATEUR
// ======================================

export default async function AdminStudentsPage() {
  // Vérification de la session
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  // ======================================
  // SERVER ACTION : ASSOCIATION PARENT
  // ======================================

  async function linkParent(
    _previousState: LinkParentState,
    formData: FormData
  ): Promise<LinkParentState> {
    "use server";

    // Revérifier les autorisations à chaque action
    const currentSession = await auth();

    if (!currentSession?.user) {
      redirect("/login");
    }

    if (currentSession.user.role !== "ADMIN") {
      return {
        status: "error",
        message: "Accès non autorisé.",
      };
    }

    const rawStudentId = formData.get("studentId");
    const rawParentId = formData.get("parentId");

    if (
      typeof rawStudentId !== "string" ||
      typeof rawParentId !== "string"
    ) {
      return {
        status: "error",
        message: "Identifiants invalides.",
      };
    }

    const studentId = rawStudentId.trim();
    const parentId = rawParentId.trim();

    if (!studentId || !parentId) {
      return {
        status: "error",
        message: "Veuillez sélectionner un parent.",
      };
    }

    try {
      // Vérifier l'existence de l'élève et
      // l'appartenance du compte au rôle PARENT
      const [student, parent] = await Promise.all([
        prisma.student.findUnique({
          where: { id: studentId },
          select: {
            id: true,
            parentId: true,
          },
        }),

        prisma.user.findFirst({
          where: {
            id: parentId,
            role: "PARENT",
          },
          select: {
            id: true,
          },
        }),
      ]);

      if (!student) {
        return {
          status: "error",
          message: "Le dossier de cet élève est introuvable.",
        };
      }

      if (!parent) {
        return {
          status: "error",
          message: "Le parent sélectionné est invalide.",
        };
      }

      // Éviter une mise à jour inutile
      if (student.parentId === parentId) {
        return {
          status: "success",
          message: "Ce parent est déjà associé à l'élève.",
        };
      }

      // Association ou réaffectation
      await prisma.student.update({
        where: {
          id: studentId,
        },
        data: {
          parentId,
        },
      });

    } catch (error) {
      console.error("Erreur liaison parent-élève :", error);

      return {
        status: "error",
        message: "Impossible d'enregistrer la liaison.",
      };
    }

    // Actualiser la liste après succès
    revalidatePath("/admin/students");

    return {
      status: "success",
      message: "Parent associé avec succès.",
    };
  }

  // ======================================
  // RÉCUPÉRATION DES DONNÉES
  // ======================================

  const [students, parents] = await Promise.all([
    prisma.student.findMany({
      select: {
        id: true,
        parentId: true,

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
            email: true,

            parentProfile: {
              select: {
                phone: true,
                address: true,
              },
            },
          },
        },
      },

      orderBy: {
        class: {
          name: "asc",
        },
      },
    }),

    prisma.user.findMany({
      where: {
        role: "PARENT",
      },

      select: {
        id: true,
        name: true,
        email: true,
      },

      orderBy: {
        email: "asc",
      },
    }),
  ]);

  // ======================================
  // STATISTIQUES
  // ======================================

  const totalStudents = students.length;
  const totalParents = parents.length;

  const unlinkedCount = students.filter(
    (student) => !student.parentId
  ).length;

  const linkedCount = totalStudents - unlinkedCount;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#08111f] text-white">

      {/* Ambiance lumineuse */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(20,184,166,0.08),transparent_40%),radial-gradient(ellipse_at_95%_60%,rgba(59,130,246,0.06),transparent_40%)]" />

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 pb-16 sm:px-6 lg:px-8">

        {/* FIL D'ARIANE */}
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
            Dossiers élèves
          </span>
        </div>

        {/* ============================
            EN-TÊTE PRINCIPAL
        ============================ */}
        <section className="relative overflow-hidden rounded-[30px] border border-teal-400/15 bg-gradient-to-br from-[#123d49] via-[#102a3a] to-[#0d1b2c] p-7 shadow-2xl sm:p-9">

          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-teal-400/10 blur-[85px]" />

          <div className="relative z-10 flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-teal-300">
                <Sparkles size={15} />
                Gestion académique
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Dossiers{" "}
                <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  élèves
                </span>
              </h1>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                Gérez les dossiers scolaires et les
                associations entre élèves et responsables
                parentaux depuis un espace centralisé.
              </p>
            </div>

            <Link
              href="/admin/users/new"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 py-3.5 text-sm font-bold text-[#092b35] transition-all duration-300 hover:-translate-y-1 hover:bg-teal-300"
            >
              <UserPlus size={18} />
              Nouvel utilisateur
            </Link>
          </div>
        </section>

        {/* ============================
            STATISTIQUES
        ============================ */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {[
            {
              title: "Dossiers élèves",
              value: totalStudents,
              icon: GraduationCap,
              color: "text-cyan-300 bg-cyan-400/10",
            },
            {
              title: "Parents disponibles",
              value: totalParents,
              icon: Users,
              color: "text-violet-300 bg-violet-400/10",
            },
            {
              title: "Élèves avec parent",
              value: linkedCount,
              icon: ShieldCheck,
              color: "text-emerald-300 bg-emerald-400/10",
            },
            {
              title: "Sans parent associé",
              value: unlinkedCount,
              icon: AlertCircle,
              color: "text-amber-300 bg-amber-400/10",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="group rounded-[24px] border border-white/[0.08] bg-[#111e30] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/25 sm:p-6"
              >
                <div
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.color}`}
                >
                  <Icon size={23} />
                </div>

                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {stat.title}
                </p>

                <p className="mt-3 text-3xl font-extrabold text-white">
                  {formatter.format(stat.value)}
                </p>
              </div>
            );
          })}

        </section>

        {/* ============================
            ANNUAIRE
        ============================ */}
        <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111e30]/90">

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] p-6 sm:px-7">

            <div>
              <h2 className="text-lg font-bold text-white">
                Annuaire des élèves
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Gestion des classes, contacts parentaux
                et liaisons administratives.
              </p>
            </div>

            <span className="rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-2 text-xs font-bold text-teal-300">
              {formatter.format(totalStudents)} dossiers
            </span>
          </div>

          {/* TABLEAU DESKTOP */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[920px] text-left text-sm">

              <thead className="border-b border-white/[0.07] bg-[#0c192a]">
                <tr>
                  <th className="px-5 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Élève
                  </th>

                  <th className="px-5 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Classe
                  </th>

                  <th className="px-5 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Contact parent
                  </th>

                  <th className="px-5 py-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Liaison parentale
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="transition-colors duration-300 hover:bg-white/[0.035]"
                  >
                    {/* Identité */}
                    <td className="px-5 py-6 align-top">
                      <StudentIdentity user={student.user} />
                    </td>

                    {/* Classe */}
                    <td className="px-5 py-6 align-top">
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-300">
                          <GraduationCap size={14} />
                          {student.class?.name ?? "Non attribuée"}
                        </span>

                        {student.class?.level && (
                          <p className="text-xs text-slate-500">
                            Niveau : {student.class.level}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Parent */}
                    <td className="px-5 py-6 align-top">
                      <ParentDetails parent={student.parent} />
                    </td>

                    {/* Liaison */}
                    <td className="px-5 py-6 align-top">
                      <ParentLinkForm
                        studentId={student.id}
                        currentParentId={student.parentId}
                        parents={parents}
                        action={linkParent}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARTES MOBILE / TABLETTE */}
          <div className="divide-y divide-white/[0.07] lg:hidden">
            {students.map((student) => (
              <article
                key={student.id}
                className="space-y-5 p-5 sm:p-6"
              >
                <StudentIdentity user={student.user} />

                <div className="flex items-center gap-2">
                  <Layers
                    size={15}
                    className="text-teal-400"
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    {student.class?.name ?? "Classe non attribuée"}
                  </span>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-[#0b1727] p-4">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Responsable parental
                  </p>

                  <ParentDetails parent={student.parent} />
                </div>

                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-xs font-bold text-teal-300">
                    <Link2 size={15} />
                    Association parent–élève
                  </p>

                  <ParentLinkForm
                    studentId={student.id}
                    currentParentId={student.parentId}
                    parents={parents}
                    action={linkParent}
                  />
                </div>
              </article>
            ))}
          </div>

          {/* ÉTAT VIDE */}
          {students.length === 0 && (
            <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[25px] bg-teal-400/10 text-teal-300">
                <GraduationCap size={37} />
              </div>

              <h3 className="text-lg font-bold text-white">
                Aucun dossier élève
              </h3>

              <p className="max-w-md text-sm leading-7 text-slate-400">
                Aucun dossier scolaire n'est enregistré.
                Un compte utilisateur avec le rôle ÉLÈVE
                ne suffit pas à créer automatiquement
                un dossier Student.
              </p>

              <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-[#092b35] hover:bg-teal-300"
              >
                <Users size={17} />
                Voir les utilisateurs
              </Link>
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] pt-6 text-xs text-slate-500 sm:flex-row">

          <span className="flex items-center gap-2">
            <ShieldCheck
              size={15}
              className="text-emerald-400"
            />
            Gestion des dossiers scolaires
          </span>

          <span>
            EdTech SaaS • Light Energy Digital
          </span>
        </footer>

      </div>
    </main>
  );
}
