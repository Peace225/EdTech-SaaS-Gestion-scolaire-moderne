
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  GraduationCap,
  Users,
  BookOpen,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Wallet,
  Activity,
  CalendarDays,
  LayoutDashboard,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

// Données toujours actualisées lors du chargement
export const dynamic = "force-dynamic";

// Formatage des nombres en français
const formatter = new Intl.NumberFormat("fr-FR");

// Types des cartes
type CardColor = "cyan" | "emerald" | "violet" | "amber";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  color: CardColor;
};

// Styles des différents indicateurs
const colors = {
  cyan: {
    icon: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
    hover: "hover:border-cyan-400/40",
    glow: "bg-cyan-400/10",
    line: "from-cyan-400 to-blue-500",
  },
  emerald: {
    icon: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    hover: "hover:border-emerald-400/40",
    glow: "bg-emerald-400/10",
    line: "from-emerald-400 to-teal-500",
  },
  violet: {
    icon: "bg-violet-400/10 text-violet-300 border-violet-400/20",
    hover: "hover:border-violet-400/40",
    glow: "bg-violet-400/10",
    line: "from-violet-400 to-fuchsia-500",
  },
  amber: {
    icon: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    hover: "hover:border-amber-400/40",
    glow: "bg-amber-400/10",
    line: "from-amber-400 to-orange-500",
  },
};

// Composant réutilisable des statistiques
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: StatCardProps) {
  const style = colors[color];

  return (
    <div
      className={`
        group relative overflow-hidden
        rounded-[26px] border border-white/[0.08]
        bg-[#111e30]/90 p-6
        shadow-[0_15px_45px_-25px_rgba(0,0,0,0.5)]
        backdrop-blur-xl
        transition-all duration-500 ease-out
        hover:-translate-y-2 hover:bg-[#16263a]
        hover:shadow-2xl
        ${style.hover}
      `}
    >
      {/* Halo lumineux */}
      <div
        className={`
          pointer-events-none absolute -right-16 -top-16
          h-48 w-48 rounded-full blur-[70px]
          opacity-30 transition-opacity duration-500
          group-hover:opacity-80
          ${style.glow}
        `}
      />

      {/* Icône géante en arrière-plan */}
      <div className="pointer-events-none absolute -bottom-7 -right-5 text-white/[0.025] transition-transform duration-700 group-hover:-rotate-12 group-hover:scale-110">
        <Icon size={135} strokeWidth={1} />
      </div>

      <div className="relative z-10">
        <div className="mb-7 flex items-start justify-between">
          <div
            className={`
              flex h-12 w-12 items-center justify-center
              rounded-2xl border
              transition-transform duration-500
              group-hover:scale-110 group-hover:-rotate-3
              ${style.icon}
            `}
          >
            <Icon size={23} strokeWidth={1.8} />
          </div>

          <ArrowUpRight
            size={19}
            className="text-slate-600 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white"
          />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {title}
        </p>

        <h3 className="mt-3 break-words text-3xl font-extrabold tracking-tight text-white sm:text-[34px]">
          {value}
        </h3>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      {/* Ligne colorée animée */}
      <div
        className={`
          absolute bottom-0 left-0 h-[3px] w-full
          origin-left scale-x-0 bg-gradient-to-r
          transition-transform duration-500
          group-hover:scale-x-100
          ${style.line}
        `}
      />
    </div>
  );
}

// Dashboard administrateur : Server Component
export default async function AdminDashboard() {
  // 1. Vérification de la session
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Vérification du rôle
  const role = (
    session.user as typeof session.user & {
      role?: string;
    }
  ).role;

  if (role !== "ADMIN") {
    redirect("/");
  }

  // 2. Récupération des données en parallèle
  const [
    nbStudents,
    nbParents,
    nbTeachers,
    nbInvoices,
    impayes,
  ] = await Promise.all([
    prisma.student.count(),

    prisma.user.count({
      where: {
        role: "PARENT",
      },
    }),

    prisma.user.count({
      where: {
        role: "TEACHER",
      },
    }),

    prisma.invoice.count(),

    prisma.invoice.aggregate({
      where: {
        status: "PENDING",
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  // 3. Conversion fiable des montants Prisma Decimal
  const totalImpayes = Number(
    impayes._sum.amount ?? 0
  );

  // 4. Formatage des statistiques
  const formattedStudents = formatter.format(nbStudents);
  const formattedParents = formatter.format(nbParents);
  const formattedTeachers = formatter.format(nbTeachers);
  const formattedInvoices = formatter.format(nbInvoices);
  const formattedImpayes = formatter.format(totalImpayes);

  // 5. Nom personnalisé
  const userName = session.user.name?.trim() || "Administrateur";

  // Date locale en Côte d'Ivoire
  const today = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Abidjan",
  }).format(new Date());

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#08111f] text-white">

      {/* Arrière-plan décoratif */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(20,184,166,0.10),transparent_40%),radial-gradient(ellipse_at_95%_55%,rgba(59,130,246,0.07),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl space-y-9 px-4 py-8 sm:px-6 lg:px-8">

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

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-400">
            <CalendarDays
              size={14}
              className="text-teal-400"
            />
            {today}
          </div>
        </div>

        {/* ===============================
            HERO / BIENVENUE
        =============================== */}
        <section className="group relative overflow-hidden rounded-[30px] border border-teal-400/15 bg-gradient-to-br from-[#123d49] via-[#102a3a] to-[#0d1b2c] p-7 shadow-2xl sm:p-9 lg:p-10">

          {/* Lumière flottante */}
          <div className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 rounded-full bg-teal-400/10 blur-[90px]" />

          <div className="pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">

            <div className="max-w-2xl space-y-5">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-teal-300">
                <Sparkles size={15} />
                Centre de pilotage EdTech
              </div>

              {/* Titre */}
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[42px]">
                Bonjour,{" "}
                <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  {userName}
                </span>{" "}
                👋
              </h1>

              <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Bienvenue dans votre espace d'administration.
                Retrouvez les indicateurs académiques,
                la gestion des utilisateurs et le suivi
                financier de votre établissement.
              </p>

              {/* Actions principales */}
              <div className="flex flex-wrap gap-3 pt-2">

                <Link
                  href="/admin/students"
                  className="group/btn inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-[#0a2c36] shadow-lg shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1 hover:bg-teal-300"
                >
                  <GraduationCap size={18} />
                  Gérer les élèves
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover/btn:translate-x-1"
                  />
                </Link>

                <Link
                  href="/admin/invoices"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10"
                >
                  <CreditCard size={18} />
                  Voir les factures
                </Link>

              </div>
            </div>

            {/* Illustration */}
            <div className="relative hidden h-44 w-44 shrink-0 items-center justify-center lg:flex">

              <div className="absolute inset-0 animate-pulse rounded-full border border-teal-300/15" />

              <div className="absolute inset-5 rounded-full border border-dashed border-teal-300/20" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-teal-300/20 bg-teal-400/10 text-teal-200 shadow-[0_0_60px_rgba(20,184,166,0.12)] backdrop-blur-lg transition-transform duration-500 group-hover:scale-110">
                <ShieldCheck
                  size={46}
                  strokeWidth={1.4}
                />
              </div>

              <span className="absolute -right-2 top-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#18394b] text-teal-300 shadow-lg">
                <Activity size={19} />
              </span>

            </div>
          </div>
        </section>

        {/* ===============================
            INDICATEURS
        =============================== */}
        <section className="space-y-5">

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400">
              Indicateurs clés
            </p>

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Vue d'ensemble
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Les données essentielles de votre établissement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              title="Total élèves"
              value={formattedStudents}
              description="Dossiers élèves enregistrés"
              icon={GraduationCap}
              color="cyan"
            />

            <StatCard
              title="Comptes parents"
              value={formattedParents}
              description="Profils parents enregistrés"
              icon={Users}
              color="emerald"
            />

            <StatCard
              title="Corps professoral"
              value={formattedTeachers}
              description="Comptes enseignants enregistrés"
              icon={BookOpen}
              color="violet"
            />

            <StatCard
              title="Scolarité en attente"
              value={`${formattedImpayes} FCFA`}
              description="Montant des factures en attente"
              icon={Wallet}
              color="amber"
            />

          </div>
        </section>

        {/* ===============================
            GESTION ET FACTURATION
        =============================== */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Dossiers étudiants */}
          <div className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111e30]/90 p-7 transition-all duration-300 hover:border-teal-400/30">

            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/10 text-teal-300">
                <GraduationCap size={24} />
              </div>

              <ArrowUpRight
                size={20}
                className="text-slate-600 transition-colors group-hover:text-teal-300"
              />
            </div>

            <h3 className="mt-6 text-xl font-bold text-white">
              Gestion des élèves
            </h3>

            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
              Consultez et gérez les dossiers scolaires,
              les inscriptions, les classes et les
              informations administratives des élèves.
            </p>

            <div className="mt-7 border-t border-white/[0.07] pt-5">
              <Link
                href="/admin/students"
                className="inline-flex items-center gap-2 text-sm font-bold text-teal-300 transition-colors hover:text-teal-200"
              >
                Accéder aux dossiers
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>

          {/* Finances */}
          <div className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111e30]/90 p-7 transition-all duration-300 hover:border-amber-400/30">

            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                <Wallet size={24} />
              </div>

              <ArrowUpRight
                size={20}
                className="text-slate-600 transition-colors group-hover:text-amber-300"
              />
            </div>

            <h3 className="mt-6 text-xl font-bold text-white">
              Suivi de facturation
            </h3>

            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
              Retrouvez les factures de scolarité,
              consultez les paiements et suivez
              les montants restant à régler.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-5">

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <AlertCircle
                  size={15}
                  className="text-amber-400"
                />

                <span>
                  {formattedInvoices} factures au total
                </span>
              </div>

              <Link
                href="/admin/invoices"
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-300 transition-colors hover:text-amber-200"
              >
                Voir les factures
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

            </div>
          </div>

        </section>

        {/* ===============================
            FOOTER
        =============================== */}
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-6 text-center text-xs text-slate-500 sm:flex-row sm:text-left">

          <div className="flex items-center gap-2">
            <ShieldCheck
              size={16}
              className="text-emerald-400"
            />
            Espace d'administration
          </div>

          <p>
            EdTech SaaS • Light Energy Digital
          </p>

        </footer>

      </div>
    </main>
  );
}
