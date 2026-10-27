
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Users,
  GraduationCap,
  FileText,
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// Actualisation des données à chaque chargement
export const dynamic = "force-dynamic";

const numberFormatter = new Intl.NumberFormat("fr-FR");

// Types
type CardTone = "cyan" | "emerald" | "violet" | "amber";

type StatItem = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  href: string;
  tone: CardTone;
};

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: CardTone;
};

// Palette EdTech
const tones = {
  cyan: {
    icon: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
    hover: "hover:border-cyan-400/40",
    glow: "bg-cyan-400/10",
    line: "from-cyan-400 to-blue-500",
    text: "text-cyan-300",
  },
  emerald: {
    icon: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    hover: "hover:border-emerald-400/40",
    glow: "bg-emerald-400/10",
    line: "from-emerald-400 to-teal-500",
    text: "text-emerald-300",
  },
  violet: {
    icon: "bg-violet-400/10 text-violet-300 border-violet-400/20",
    hover: "hover:border-violet-400/40",
    glow: "bg-violet-400/10",
    line: "from-violet-400 to-fuchsia-500",
    text: "text-violet-300",
  },
  amber: {
    icon: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    hover: "hover:border-amber-400/40",
    glow: "bg-amber-400/10",
    line: "from-amber-400 to-orange-500",
    text: "text-amber-300",
  },
};

// ===============================
// COMPOSANT STATISTIQUE
// ===============================
function StatCard({ item }: { item: StatItem }) {
  const Icon = item.icon;
  const theme = tones[item.tone];

  return (
    <Link
      href={item.href}
      className={`
        group relative block min-w-0 overflow-hidden
        rounded-[26px] border border-white/[0.08]
        bg-[#111e30] p-6
        shadow-[0_15px_45px_-25px_rgba(0,0,0,0.5)]
        transition-all duration-500
        hover:-translate-y-1.5
        hover:bg-[#16263a]
        hover:shadow-2xl
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-teal-400
        ${theme.hover}
      `}
    >
      {/* Halo lumineux */}
      <div
        className={`
          pointer-events-none absolute -right-12 -top-12
          h-40 w-40 rounded-full blur-[65px]
          opacity-40 transition-opacity duration-500
          group-hover:opacity-100
          ${theme.glow}
        `}
      />

      {/* Icône décorative */}
      <Icon
        size={110}
        strokeWidth={1}
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-6 -right-5 text-white/[0.025] transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110"
      />

      <div className="relative z-10">
        <div className="mb-7 flex items-start justify-between">
          <div
            className={`
              flex h-12 w-12 items-center justify-center
              rounded-2xl border
              transition-transform duration-300
              group-hover:scale-110
              ${theme.icon}
            `}
          >
            <Icon size={23} strokeWidth={1.8} />
          </div>

          <ArrowUpRight
            size={19}
            className="text-slate-600 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white"
          />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-400">
          {item.title}
        </p>

        <h3 className="mt-3 break-words text-4xl font-extrabold tracking-tight text-white">
          {item.value}
        </h3>

        <p className="mt-3 text-xs leading-5 text-slate-400">
          {item.description}
        </p>
      </div>

      {/* Barre inférieure animée */}
      <div
        className={`
          absolute bottom-0 left-0 h-[3px] w-full
          origin-left scale-x-0 bg-gradient-to-r
          transition-transform duration-500
          group-hover:scale-x-100
          ${theme.line}
        `}
      />
    </Link>
  );
}

// ===============================
// COMPOSANT ACTION RAPIDE
// ===============================
function QuickActionCard({
  item,
}: {
  item: QuickAction;
}) {
  const Icon = item.icon;
  const theme = tones[item.tone];

  return (
    <Link
      href={item.href}
      className={`
        group flex min-w-0 items-center gap-4
        rounded-2xl border border-white/[0.07]
        bg-[#0b1727] p-5
        transition-all duration-300
        hover:-translate-y-1
        hover:bg-[#16263a]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-teal-400
        ${theme.hover}
      `}
    >
      <div
        className={`
          flex h-12 w-12 shrink-0 items-center justify-center
          rounded-xl border
          transition-transform duration-300
          group-hover:scale-110
          ${theme.icon}
        `}
      >
        <Icon size={22} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-white">
          {item.title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {item.description}
        </p>
      </div>

      <ArrowRight
        size={18}
        className={`
          shrink-0 text-slate-600
          transition-all duration-300
          group-hover:translate-x-1
          ${theme.text}
        `}
      />
    </Link>
  );
}

// ===============================
// DASHBOARD ADMINISTRATEUR
// ===============================
export default async function AdminDashboard() {
  // 1. Vérification Auth.js
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

  // 2. Récupération des statistiques
  const [
    totalStudents,
    totalClasses,
    pendingInvoices,
    totalTeachers,
  ] = await Promise.all([
    prisma.student.count(),

    prisma.class.count(),

    prisma.invoice.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.user.count({
      where: {
        role: "TEACHER",
      },
    }),
  ]);

  // 3. Données d'affichage
  const userName =
    session.user.name?.trim() || "Administrateur";

  const today = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Abidjan",
  }).format(new Date());

  // 4. Statistiques
  const stats: StatItem[] = [
    {
      title: "Total élèves",
      value: numberFormatter.format(totalStudents),
      description: "Dossiers élèves enregistrés",
      icon: GraduationCap,
      href: "/admin/students",
      tone: "cyan",
    },
    {
      title: "Classes",
      value: numberFormatter.format(totalClasses),
      description: "Classes enregistrées",
      icon: Users,
      href: "/admin/classes",
      tone: "violet",
    },
    {
      title: "Enseignants",
      value: numberFormatter.format(totalTeachers),
      description: "Comptes enseignants enregistrés",
      icon: BookOpen,
      href: "/admin/assignments",
      tone: "emerald",
    },
    {
      title: "Factures en attente",
      value: numberFormatter.format(pendingInvoices),
      description: "Factures à suivre ou à régler",
      icon: FileText,
      href: "/admin/invoices",
      tone: "amber",
    },
  ];

  // 5. Accès rapides
  const quickActions: QuickAction[] = [
    {
      title: "Élèves",
      description: "Dossiers et inscriptions",
      href: "/admin/students",
      icon: GraduationCap,
      tone: "cyan",
    },
    {
      title: "Affectations",
      description: "Enseignants et matières",
      href: "/admin/assignments",
      icon: BookOpen,
      tone: "violet",
    },
    {
      title: "Classes",
      description: "Gestion des classes",
      href: "/admin/classes",
      icon: Users,
      tone: "emerald",
    },
    {
      title: "Facturation",
      description: "Scolarité et paiements",
      href: "/admin/invoices",
      icon: Wallet,
      tone: "amber",
    },
  ];

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#08111f] text-white">

      {/* Fond lumineux */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(20,184,166,0.09),transparent_40%),radial-gradient(ellipse_at_95%_55%,rgba(59,130,246,0.07),transparent_40%)]" />

      <div className="mx-auto max-w-7xl space-y-9 px-4 py-8 sm:px-6 lg:px-8">

        {/* Fil d'Ariane */}
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <LayoutDashboard
              size={16}
              className="text-teal-400"
            />

            <span>Administration</span>

            <span className="text-slate-600">/</span>

            <span className="font-semibold text-white">
              Tableau de bord
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-400">
            <CalendarDays
              size={15}
              className="text-teal-400"
            />
            {today}
          </div>

        </div>

        {/* =========================
            EN-TÊTE PRINCIPAL
        ========================= */}
        <section className="group relative overflow-hidden rounded-[30px] border border-teal-400/15 bg-gradient-to-br from-[#123d49] via-[#102a3a] to-[#0d1b2c] p-7 shadow-2xl sm:p-9 lg:p-10">

          {/* Glows */}
          <div className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 rounded-full bg-teal-400/10 blur-[90px]" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">

            {/* Texte */}
            <div className="max-w-2xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-teal-300">
                <Sparkles size={15} />
                Espace administrateur
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[42px]">
                Tableau de{" "}
                <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  bord
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Ravi de vous revoir,{" "}
                <span className="font-bold text-white">
                  {userName}
                </span>
                . Retrouvez ici les informations essentielles
                et les outils de gestion de votre établissement.
              </p>

              {/* Actions */}
              <div className="mt-7 flex flex-wrap gap-3">

                <Link
                  href="/admin/students"
                  className="group/btn inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-[#092a35] shadow-lg shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1 hover:bg-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <GraduationCap size={18} />

                  Gérer les élèves

                  <ArrowUpRight
                    size={17}
                    className="transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5"
                  />
                </Link>

                <Link
                  href="/admin/invoices"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                >
                  <Wallet size={18} />
                  Voir les factures
                </Link>

              </div>
            </div>

            {/* Illustration décorative */}
            <div className="relative hidden h-44 w-44 shrink-0 items-center justify-center lg:flex">

              <div className="absolute inset-0 rounded-full border border-teal-300/15" />

              <div className="absolute inset-5 rounded-full border border-dashed border-teal-300/20" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-teal-300/20 bg-teal-400/10 text-teal-200 shadow-[0_0_60px_rgba(20,184,166,0.12)] transition-transform duration-500 group-hover:scale-110">
                <ShieldCheck size={45} strokeWidth={1.4} />
              </div>

              <div className="absolute -right-2 top-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#18394b] text-teal-300 shadow-lg">
                <GraduationCap size={19} />
              </div>

            </div>

          </div>
        </section>

        {/* =========================
            STATISTIQUES
        ========================= */}
        <section className="space-y-6">

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400">
              Indicateurs académiques
            </p>

            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Vue d'ensemble
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Les principales données de votre établissement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <StatCard key={item.title} item={item} />
            ))}
          </div>

        </section>

        {/* =========================
            ACCÈS RAPIDES
        ========================= */}
        <section className="rounded-[28px] border border-white/[0.08] bg-[#111e30]/80 p-6 sm:p-8">

          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400">
                Navigation
              </p>

              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Accès rapides
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Accédez directement aux principaux modules.
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-400/15 bg-teal-400/10 text-teal-300">
              <ClipboardList size={21} />
            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {quickActions.map((item) => (
              <QuickActionCard
                key={item.href}
                item={item}
              />
            ))}
          </div>

        </section>

        {/* =========================
            PIED DE PAGE
        ========================= */}
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-6 text-center text-xs text-slate-500 sm:flex-row sm:text-left">

          <div className="flex items-center gap-2">
            <ShieldCheck
              size={16}
              className="text-emerald-400"
            />

            <span>
              Espace d'administration
            </span>
          </div>

          <p>
            EdTech SaaS • Light Energy Digital
          </p>

        </footer>

      </div>
    </div>
  );
}
