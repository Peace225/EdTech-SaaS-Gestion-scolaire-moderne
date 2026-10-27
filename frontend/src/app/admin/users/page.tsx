
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  ShieldCheck,
  BookOpen,
  Users,
  GraduationCap,
  Mail,
  UserPlus,
  ArrowUpRight,
  LayoutDashboard,
  ChevronRight,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ===============================
// TYPES ET CONFIGURATION
// ===============================

type RoleConfig = {
  label: string;
  icon: LucideIcon;
  badge: string;
  avatar: string;
  statIcon: string;
  glow: string;
};

const ROLE_CONFIG: Record<string, RoleConfig> = {
  ADMIN: {
    label: "Administrateur",
    icon: ShieldCheck,
    badge:
      "bg-violet-400/10 text-violet-300 border-violet-400/20",
    avatar:
      "bg-violet-400/10 text-violet-300 border-violet-400/20",
    statIcon:
      "bg-violet-400/10 text-violet-300",
    glow: "bg-violet-400/10",
  },
  TEACHER: {
    label: "Enseignant",
    icon: BookOpen,
    badge:
      "bg-blue-400/10 text-blue-300 border-blue-400/20",
    avatar:
      "bg-blue-400/10 text-blue-300 border-blue-400/20",
    statIcon:
      "bg-blue-400/10 text-blue-300",
    glow: "bg-blue-400/10",
  },
  PARENT: {
    label: "Parent",
    icon: Users,
    badge:
      "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    avatar:
      "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    statIcon:
      "bg-emerald-400/10 text-emerald-300",
    glow: "bg-emerald-400/10",
  },
  STUDENT: {
    label: "Élève",
    icon: GraduationCap,
    badge:
      "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
    avatar:
      "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
    statIcon:
      "bg-cyan-400/10 text-cyan-300",
    glow: "bg-cyan-400/10",
  },
};

const DEFAULT_CONFIG: RoleConfig = {
  label: "Autre rôle",
  icon: UserRound,
  badge: "bg-slate-400/10 text-slate-300 border-slate-400/20",
  avatar: "bg-slate-400/10 text-slate-300 border-slate-400/20",
  statIcon: "bg-slate-400/10 text-slate-300",
  glow: "bg-slate-400/10",
};

const numberFormatter = new Intl.NumberFormat("fr-FR");

function getRoleConfig(role: string) {
  return ROLE_CONFIG[role] ?? DEFAULT_CONFIG;
}

// ===============================
// BADGE DES RÔLES
// ===============================

function RoleBadge({ role }: { role: string }) {
  const config = getRoleConfig(role);
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-2
        rounded-full border px-3 py-1.5
        text-[10px] font-bold uppercase
        tracking-[0.08em]
        ${config.badge}
      `}
    >
      <Icon size={13} strokeWidth={1.8} />
      {ROLE_CONFIG[role] ? config.label : role}
    </span>
  );
}

// ===============================
// AVATAR UTILISATEUR
// ===============================

function UserAvatar({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string | null;
  role: string;
}) {
  const config = getRoleConfig(role);

  const displayName =
    name?.trim() || email?.trim() || "Utilisateur";

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div
      aria-hidden="true"
      className={`
        flex h-11 w-11 shrink-0
        items-center justify-center
        rounded-2xl border
        text-sm font-extrabold
        transition-all duration-300
        group-hover:scale-105
        ${config.avatar}
      `}
    >
      {initials || "U"}
    </div>
  );
}

// ===============================
// CARTE STATISTIQUE
// ===============================

function StatCard({
  title,
  value,
  icon: Icon,
  role,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  role: string;
}) {
  const config = getRoleConfig(role);

  return (
    <div
      className="
        group relative overflow-hidden
        rounded-[24px] border border-white/[0.08]
        bg-[#111e30] p-5
        transition-all duration-300
        hover:-translate-y-1
        hover:border-teal-400/25
        hover:bg-[#16263a]
        sm:p-6
      "
    >
      {/* Halo décoratif */}
      <div
        className={`
          pointer-events-none absolute
          -right-12 -top-12
          h-32 w-32 rounded-full
          opacity-50 blur-[55px]
          transition-opacity duration-300
          group-hover:opacity-100
          ${config.glow}
        `}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-400">
            {title}
          </p>

          <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {numberFormatter.format(value)}
          </h3>

          <p className="mt-2 text-xs text-slate-500">
            Comptes enregistrés
          </p>
        </div>

        <div
          className={`
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-xl
            transition-transform duration-300
            group-hover:scale-110
            ${config.statIcon}
          `}
        >
          <Icon size={21} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

// ===============================
// PAGE GESTION UTILISATEURS
// ===============================

export default async function AdminUsersPage() {
  // Vérification de la session
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (
    session.user as typeof session.user & {
      role?: string;
    }
  ).role;

  if (role !== "ADMIN") {
    redirect("/");
  }

  // Récupération des utilisateurs
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
  });

  // Statistiques par rôle
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    teachers: users.filter((u) => u.role === "TEACHER").length,
    parents: users.filter((u) => u.role === "PARENT").length,
    students: users.filter((u) => u.role === "STUDENT").length,
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#08111f] text-white">

      {/* Ambiance lumineuse */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(20,184,166,0.08),transparent_40%),radial-gradient(ellipse_at_95%_60%,rgba(59,130,246,0.06),transparent_40%)]" />

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

        {/* =========================
            FIL D'ARIANE
        ========================= */}
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
            Utilisateurs
          </span>
        </div>

        {/* =========================
            EN-TÊTE PRINCIPAL
        ========================= */}
        <section className="relative overflow-hidden rounded-[30px] border border-teal-400/15 bg-gradient-to-br from-[#123d49] via-[#102a3a] to-[#0d1b2c] p-7 shadow-2xl sm:p-9">

          {/* Effets lumineux */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-400/10 blur-[80px]" />

          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-blue-500/10 blur-[70px]" />

          <div className="relative z-10 flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

            <div className="max-w-2xl">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-teal-300">
                <Sparkles size={15} />
                Gestion administrative
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Gestion des{" "}
                <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  utilisateurs
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                Centralisez et consultez les comptes des
                administrateurs, enseignants, parents et
                élèves de votre établissement.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-xs text-teal-200">
                <Users size={15} />

                <span>
                  <strong className="font-bold text-white">
                    {numberFormatter.format(stats.total)}
                  </strong>{" "}
                  comptes enregistrés
                </span>
              </div>

            </div>

            {/* Bouton création */}
            <Link
              href="/admin/users/new"
              className="
                group inline-flex shrink-0
                items-center justify-center gap-2.5
                rounded-2xl bg-teal-400
                px-6 py-3.5
                text-sm font-bold text-[#092b35]
                shadow-lg shadow-teal-950/20
                transition-all duration-300
                hover:-translate-y-1
                hover:bg-teal-300
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-white
              "
            >
              <UserPlus size={19} />

              Nouvel utilisateur

              <ArrowUpRight
                size={17}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>

          </div>
        </section>

        {/* =========================
            STATISTIQUES PAR RÔLE
        ========================= */}
        <section className="space-y-5">

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400">
              Répartition des comptes
            </p>

            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Vue d'ensemble
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Répartition des utilisateurs selon leurs rôles.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

            <StatCard
              title="Administrateurs"
              value={stats.admins}
              icon={ShieldCheck}
              role="ADMIN"
            />

            <StatCard
              title="Enseignants"
              value={stats.teachers}
              icon={BookOpen}
              role="TEACHER"
            />

            <StatCard
              title="Parents"
              value={stats.parents}
              icon={Users}
              role="PARENT"
            />

            <StatCard
              title="Élèves"
              value={stats.students}
              icon={GraduationCap}
              role="STUDENT"
            />

          </div>
        </section>

        {/* =========================
            ANNUAIRE DES UTILISATEURS
        ========================= */}
        <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111e30]/90 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)]">

          {/* En-tête tableau */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-6 py-6 sm:px-7">

            <div>
              <h2 className="text-lg font-bold text-white">
                Annuaire des utilisateurs
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Liste des comptes enregistrés dans la plateforme
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-2 text-xs font-semibold text-teal-300">
              <Users size={14} />
              {numberFormatter.format(stats.total)} comptes
            </span>

          </div>

          {/* Tableau desktop */}
          <div className="hidden overflow-x-auto md:block">

            <table className="w-full min-w-[650px] text-left text-sm">

              <thead className="border-b border-white/[0.07] bg-[#0c192a]">
                <tr>
                  <th className="px-7 py-5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Utilisateur
                  </th>

                  <th className="px-7 py-5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Rôle & Accès
                  </th>

                  <th className="px-7 py-5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Compte
                  </th>

                  <th className="px-7 py-5 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Contact
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">

                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="group transition-colors duration-300 hover:bg-white/[0.035]"
                  >

                    {/* Utilisateur */}
                    <td className="px-7 py-5">

                      <div className="flex min-w-0 items-center gap-3.5">

                        <UserAvatar
                          name={user.name}
                          email={user.email}
                          role={user.role}
                        />

                        <div className="min-w-0">

                          <p className="truncate text-sm font-bold text-white">
                            {user.name || "Utilisateur non nommé"}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-400">
                            <Mail
                              size={13}
                              className="shrink-0 text-slate-500"
                            />

                            <span className="truncate">
                              {user.email || "Aucun e-mail"}
                            </span>
                          </p>

                        </div>
                      </div>

                    </td>

                    {/* Rôle */}
                    <td className="px-7 py-5">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Compte */}
                    <td className="px-7 py-5">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-slate-600/20 bg-slate-500/10 px-3 py-1.5 text-[11px] font-semibold text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Enregistré
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-7 py-5 text-right">
                      {user.email ? (
                        <a
                          href={`mailto:${user.email}`}
                          aria-label={`Contacter ${user.name || user.email}`}
                          title="Envoyer un e-mail"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all duration-300 hover:border-teal-400/30 hover:bg-teal-400/10 hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                        >
                          <Mail size={17} />
                        </a>
                      ) : (
                        <span className="text-slate-600">
                          —
                        </span>
                      )}
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {/* Vue mobile */}
          <div className="divide-y divide-white/[0.07] md:hidden">

            {users.map((user) => (
              <article
                key={user.id}
                className="space-y-4 p-5 transition-colors hover:bg-white/[0.035]"
              >

                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={user.name}
                    email={user.email}
                    role={user.role}
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-white">
                      {user.name || "Utilisateur non nommé"}
                    </h3>

                    <p className="mt-1 truncate text-xs text-slate-400">
                      {user.email || "Aucun e-mail"}
                    </p>
                  </div>

                  {user.email && (
                    <a
                      href={`mailto:${user.email}`}
                      aria-label={`Contacter ${user.name || user.email}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-teal-300 transition-colors hover:bg-teal-400/10"
                    >
                      <Mail size={17} />
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <RoleBadge role={user.role} />

                  <span className="text-[11px] text-slate-400">
                    Compte enregistré
                  </span>
                </div>

              </article>
            ))}

          </div>

          {/* État vide */}
          {users.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">

              <div className="flex h-20 w-20 items-center justify-center rounded-[25px] border border-teal-400/15 bg-teal-400/10 text-teal-300">
                <Users size={36} strokeWidth={1.5} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  Aucun utilisateur enregistré
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                  Aucun compte n'est actuellement présent
                  dans votre base de données.
                </p>
              </div>

              <Link
                href="/admin/users/new"
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-[#092b35] transition-colors hover:bg-teal-300"
              >
                <UserPlus size={17} />
                Créer un utilisateur
              </Link>

            </div>
          )}

          {/* Pied de tableau */}
          {users.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] bg-[#0c192a]/70 px-6 py-4 text-xs text-slate-400 sm:px-7">

              <span>
                {numberFormatter.format(users.length)} utilisateur(s) affiché(s)
              </span>

              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  size={14}
                  className="text-teal-400"
                />
                Annuaire administrateur
              </span>

            </div>
          )}

        </section>

        {/* =========================
            FOOTER
        ========================= */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] pt-6 text-center text-xs text-slate-500 sm:flex-row sm:text-left">

          <div className="flex items-center gap-2">
            <ShieldCheck
              size={16}
              className="text-emerald-400"
            />
            Espace d'administration
          </div>

          <span>
            EdTech SaaS • Light Energy Digital
          </span>

        </footer>

      </div>
    </div>
  );
}
