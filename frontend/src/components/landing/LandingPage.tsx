
"use client";

import Link from "next/link";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease },
  },
};

const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const features: {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  iconBg: string;
  number: string;
}[] = [
  {
    icon: GraduationCap,
    title: "Gestion académique",
    description:
      "Centralisez les inscriptions, dossiers étudiants et informations administratives dans une interface unifiée.",
    color: "text-teal-600",
    iconBg: "bg-teal-50",
    number: "01",
  },
  {
    icon: BookOpen,
    title: "Suivi pédagogique",
    description:
      "Facilitez le suivi des notes, des absences et des résultats académiques avec des outils adaptés aux enseignants.",
    color: "text-blue-600",
    iconBg: "bg-blue-50",
    number: "02",
  },
  {
    icon: Wallet,
    title: "Facturation & paiements",
    description:
      "Organisez les frais de scolarité, suivez les factures et simplifiez vos processus financiers en FCFA.",
    color: "text-emerald-600",
    iconBg: "bg-emerald-50",
    number: "03",
  },
  {
    icon: ShieldCheck,
    title: "Accès personnalisés",
    description:
      "Des espaces dédiés aux administrateurs, enseignants, parents et étudiants, selon leurs rôles.",
    color: "text-violet-600",
    iconBg: "bg-violet-50",
    number: "04",
  },
];

const spaces: {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}[] = [
  {
    icon: LayoutDashboard,
    title: "Administration",
    description: "Pilotez votre établissement",
    color: "bg-teal-50 text-teal-700",
  },
  {
    icon: BookOpen,
    title: "Enseignants",
    description: "Gérez le suivi pédagogique",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: Users,
    title: "Parents",
    description: "Suivez la scolarité des enfants",
    color: "bg-violet-50 text-violet-700",
  },
  {
    icon: GraduationCap,
    title: "Étudiants",
    description: "Consultez votre parcours",
    color: "bg-amber-50 text-amber-700",
  },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0e827f] to-[#075b69] text-white shadow-lg shadow-teal-900/15">
        <GraduationCap size={24} strokeWidth={1.8} />
      </span>

      <span className="flex flex-col">
        <span
          className={`text-xl font-black tracking-tight ${
            light ? "text-white" : "text-[#102838]"
          }`}
        >
          EdTech<span className="text-[#12b8ae]">.</span>
        </span>
        <span
          className={`text-[9px] font-semibold uppercase tracking-[0.22em] ${
            light ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Smart Education
        </span>
      </span>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0e827f]">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
        {eyebrow}
      </div>

      <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#102838] sm:text-4xl lg:text-[44px]">
        {title}
      </h2>

      <p className="mt-5 text-base leading-8 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function DashboardPreview({
  reduceMotion,
}: {
  reduceMotion: boolean;
}) {
  const values = [42, 66, 53, 80, 60, 92, 73];

  return (
    <div className="relative mx-auto w-full max-w-[590px]">
      <div className="pointer-events-none absolute -inset-8 rounded-full bg-teal-400/15 blur-[85px]" />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.25, ease }}
        className="relative overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_35px_90px_-30px_rgba(12,57,69,0.3)]"
      >
        {/* Barre du navigateur */}
        <div className="flex h-12 items-center justify-between border-b border-slate-100 bg-[#f9fcfc] px-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          </div>

          <div className="rounded-md border border-slate-100 bg-white px-4 py-1 text-[10px] text-slate-400">
            Aperçu du tableau de bord
          </div>

          <LockKeyhole size={13} className="text-teal-600" />
        </div>

        <div className="flex min-h-[345px] bg-[#f8fbfc] sm:min-h-[390px]">
          {/* Sidebar illustrative */}
          <div className="hidden w-[125px] shrink-0 flex-col border-r border-slate-100 bg-[#102c3d] p-3 sm:flex">
            <div className="mb-8 flex items-center gap-2 text-white">
              <GraduationCap size={17} className="text-teal-300" />
              <span className="text-[11px] font-bold">EdTech</span>
            </div>

            {[
              { icon: LayoutDashboard, name: "Accueil", active: true },
              { icon: GraduationCap, name: "Étudiants" },
              { icon: BookOpen, name: "Cours" },
              { icon: CreditCard, name: "Finances" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className={`mb-2 flex items-center gap-2 rounded-lg px-2 py-2.5 text-[10px] ${
                    item.active
                      ? "bg-teal-400/20 font-semibold text-teal-200"
                      : "text-slate-400"
                  }`}
                >
                  <Icon size={13} />
                  {item.name}
                </div>
              );
            })}

            <div className="mt-auto rounded-xl border border-teal-300/10 bg-teal-300/10 p-3">
              <ShieldCheck size={17} className="mb-2 text-teal-300" />
              <p className="text-[9px] leading-relaxed text-teal-100">
                Espace sécurisé
              </p>
            </div>
          </div>

          {/* Contenu dashboard */}
          <div className="min-w-0 flex-1 p-3 sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-2">
              <div>
                <p className="text-[9px] font-medium text-slate-400">
                  Tableau de bord
                </p>
                <h3 className="mt-1 text-sm font-extrabold text-[#102838] sm:text-base">
                  Vue d'ensemble
                </h3>
              </div>

              <span className="rounded-full bg-teal-50 px-2.5 py-1.5 text-[9px] font-semibold text-teal-700">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-teal-500" />
                Démonstration
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Étudiants", value: "128", icon: GraduationCap },
                { label: "Enseignants", value: "16", icon: Users },
                { label: "Factures", value: "42", icon: Receipt },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm sm:p-3"
                  >
                    <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <Icon size={15} />
                    </div>

                    <p className="text-lg font-black text-[#102838] sm:text-2xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[9px] text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1.35fr_1fr]">
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-700">
                    Activité académique
                  </p>
                  <BarChart3 size={14} className="text-teal-600" />
                </div>

                <div
                  aria-label="Graphique décoratif avec données fictives"
                  className="flex h-[105px] items-end justify-between gap-2 border-b border-slate-100 px-1"
                >
                  {values.map((height, i) => (
                    <motion.div
                      key={i}
                      initial={reduceMotion ? false : { scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{
                        duration: 0.7,
                        delay: i * 0.07 + 0.5,
                        ease: "easeOut",
                      }}
                      style={{
                        height: `${height}%`,
                        transformOrigin: "bottom",
                      }}
                      className={`min-w-0 flex-1 rounded-t-md ${
                        i === 5
                          ? "bg-[#0e827f]"
                          : "bg-gradient-to-t from-teal-100 to-teal-300"
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-2 flex justify-between text-[8px] text-slate-400">
                  {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <p className="mb-4 text-[10px] font-bold text-slate-700">
                  Activités récentes
                </p>

                {[
                  { label: "Inscription", icon: GraduationCap },
                  { label: "Paiement", icon: CreditCard },
                  { label: "Document", icon: FileCheck2 },
                ].map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.label}
                      className="mb-3 flex items-center gap-2"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                        <Icon size={13} />
                      </div>
                      <span className="flex-1 text-[9px] text-slate-600">
                        {activity.label}
                      </span>
                      <CheckCircle2
                        size={12}
                        className="text-emerald-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-3 text-center text-[9px] text-slate-400">
              Données fictives à titre d'illustration
            </p>
          </div>
        </div>
      </motion.div>

      {/* Badge flottant */}
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : { y: [0, -9, 0] }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-6 -left-2 hidden items-center gap-3 rounded-2xl border border-teal-100 bg-white px-4 py-3 shadow-[0_15px_45px_-15px_rgba(0,0,0,0.2)] sm:flex"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={22} />
        </span>
        <div>
          <p className="text-xs font-bold text-[#102838]">
            Suivi simplifié
          </p>
          <p className="text-[10px] text-slate-500">
            Un seul espace de gestion
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fbfc] text-[#102838] selection:bg-teal-200 selection:text-teal-950">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[82px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Logo />

          <div className="hidden items-center gap-8 lg:flex">
            {[
              ["Fonctionnalités", "#fonctionnalites"],
              ["La plateforme", "#apercu"],
              ["Espaces utilisateurs", "#espaces"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0e827f]"
              >
                {label}
              </a>
            ))}
          </div>

          <Link
            href="/login"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0e827f] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-teal-800/10 transition-all hover:-translate-y-0.5 hover:bg-[#0a6c6a] sm:px-5 sm:text-sm"
          >
            Se connecter
            <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#f7fcfb] via-white to-[#e7f7f6]">
          <div className="pointer-events-none absolute right-[-160px] top-[-150px] -z-10 h-[550px] w-[550px] rounded-full bg-teal-200/30 blur-[90px]" />

          <div className="pointer-events-none absolute bottom-[-250px] left-[-160px] -z-10 h-[500px] w-[500px] rounded-full bg-sky-100 blur-[100px]" />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:pb-32 lg:pt-24">
            <motion.div
              variants={stagger}
              initial={reduceMotion ? false : "hidden"}
              animate="show"
              className="relative z-10"
            >
              <motion.div
                variants={fadeUp}
                className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/85 px-4 py-2 text-xs font-bold text-teal-700 shadow-sm"
              >
                <Sparkles size={15} />
                L'éducation rencontre l'innovation
                <ChevronRight size={14} />
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="max-w-[650px] text-[43px] font-black leading-[1.12] tracking-[-0.05em] text-[#102838] sm:text-6xl lg:text-[64px]"
              >
                Une nouvelle façon de{" "}
                <span className="bg-gradient-to-r from-[#0e827f] to-[#15b4ae] bg-clip-text text-transparent">
                  gérer l'éducation.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg"
              >
                Simplifiez la gestion de votre établissement,
                centralisez vos opérations académiques et
                financières et offrez une expérience numérique
                moderne à toute votre communauté éducative.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-9 flex flex-wrap items-center gap-4"
              >
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-3 rounded-2xl bg-[#0e827f] px-7 py-4 text-sm font-bold text-white shadow-[0_15px_35px_-12px_rgba(14,130,127,0.5)] transition-all hover:-translate-y-1 hover:bg-[#0a706d]"
                >
                  Accéder à la plateforme
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <a
                  href="#apercu"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-[#102838] transition-all hover:border-teal-300 hover:text-teal-700"
                >
                  Découvrir l'interface
                  <ArrowUpRight size={17} />
                </a>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-11 flex flex-wrap gap-x-6 gap-y-3"
              >
                {[
                  "Gestion centralisée",
                  "Accès par profil",
                  "Suivi en FCFA",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 text-xs font-medium text-slate-600"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {item}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            <DashboardPreview reduceMotion={reduceMotion} />
          </div>
        </section>

        {/* Bandeau de modules */}
        <section className="border-y border-slate-100 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-9 md:grid-cols-4">
            {[
              { icon: GraduationCap, label: "Scolarité" },
              { icon: BookOpen, label: "Pédagogie" },
              { icon: CreditCard, label: "Finances" },
              { icon: ShieldCheck, label: "Administration" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-center gap-3 text-slate-500"
                >
                  <Icon size={22} className="text-[#0e827f]" />
                  <span className="text-sm font-bold">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="fonctionnalites"
          className="scroll-mt-24 bg-[#f8fbfc] px-5 py-24 sm:px-8 lg:py-32"
        >
          <motion.div
            initial={reduceMotion ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
            className="mx-auto max-w-7xl"
          >
            <motion.div variants={fadeUp}>
              <SectionHeading
                eyebrow="Une solution complète"
                title="Tout ce dont votre établissement a besoin."
                description="Une plateforme conçue pour réunir les fonctions essentielles de la gestion éducative dans un environnement moderne et intuitif."
              />
            </motion.div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <motion.article
                    key={feature.title}
                    variants={fadeUp}
                    whileHover={
                      reduceMotion ? undefined : { y: -6 }
                    }
                    transition={{ duration: 0.25 }}
                    className="group relative overflow-hidden rounded-[28px] border border-slate-100 bg-white p-7 shadow-[0_12px_45px_-30px_rgba(15,23,42,0.25)] transition-all duration-300 hover:border-teal-200 hover:shadow-[0_24px_60px_-30px_rgba(14,130,127,0.25)] sm:p-9"
                  >
                    <div className="absolute -right-5 -top-5 text-[110px] font-black leading-none text-slate-50 transition-colors group-hover:text-teal-50">
                      {feature.number}
                    </div>

                    <div className="relative z-10">
                      <div
                        className={`mb-7 flex h-15 w-15 items-center justify-center rounded-2xl ${feature.iconBg} ${feature.color}`}
                      >
                        <Icon size={27} strokeWidth={1.8} />
                      </div>

                      <h3 className="text-xl font-extrabold text-[#102838] sm:text-2xl">
                        {feature.title}
                      </h3>

                      <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
                        {feature.description}
                      </p>

                      <div className="mt-7 flex items-center gap-2 text-sm font-bold text-[#0e827f]">
                        Découvrir le module
                        <ArrowUpRight
                          size={16}
                          className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* PRESENTATION */}
        <section
          id="apercu"
          className="scroll-mt-24 overflow-hidden bg-[#102838] px-5 py-24 text-white sm:px-8 lg:py-32"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
            <motion.div
              initial={reduceMotion ? false : "hidden"}
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              variants={stagger}
            >
              <motion.p
                variants={fadeUp}
                className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-teal-300"
              >
                Une expérience unifiée
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="max-w-lg text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl"
              >
                Votre établissement.
                <span className="block text-teal-300">
                  Une seule plateforme.
                </span>
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-lg text-base leading-8 text-slate-300"
              >
                Fini les informations dispersées. EdTech
                rassemble les équipes, les dossiers et les
                opérations administratives dans une expérience
                cohérente.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-9 space-y-5"
              >
                {[
                  "Centralisation des informations",
                  "Parcours adaptés à chaque utilisateur",
                  "Suivi administratif et financier",
                  "Interface responsive et intuitive",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-400/15 text-teal-300">
                      <Check size={17} />
                    </span>
                    <span className="text-sm text-slate-200">
                      {item}
                    </span>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} className="mt-10">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-3 rounded-2xl bg-teal-400 px-7 py-4 text-sm font-bold text-[#103440] transition-all hover:bg-teal-300"
                >
                  Explorer la plateforme
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
            </motion.div>

            {/* Illustration de l'écosystème */}
            <motion.div
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0, scale: 0.92, y: 35 }
              }
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-teal-400/10 blur-[100px]" />

              <div className="relative grid grid-cols-2 gap-4 rounded-[32px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7">
                {[
                  {
                    icon: GraduationCap,
                    label: "Étudiants",
                    sub: "Dossiers",
                  },
                  {
                    icon: BookOpen,
                    label: "Enseignants",
                    sub: "Pédagogie",
                  },
                  {
                    icon: Wallet,
                    label: "Finances",
                    sub: "Facturation",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Administration",
                    sub: "Pilotage",
                  },
                ].map((item, i) => {
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.label}
                      animate={
                        reduceMotion
                          ? undefined
                          : { y: [0, i % 2 ? -7 : 7, 0] }
                      }
                      transition={{
                        duration: 5 + i * 0.7,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="rounded-[23px] border border-white/10 bg-white/[0.08] p-5 sm:p-7"
                    >
                      <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300">
                        <Icon size={24} />
                      </div>

                      <h3 className="text-sm font-bold text-white sm:text-base">
                        {item.label}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.sub}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ESPACES */}
        <section
          id="espaces"
          className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={reduceMotion ? false : "hidden"}
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
            >
              <SectionHeading
                eyebrow="Pensé pour chacun"
                title="Un espace pour chaque acteur de l'éducation."
                description="Des interfaces distinctes selon les responsabilités et les besoins de chaque utilisateur."
                centered
              />
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : "hidden"}
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={stagger}
              className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {spaces.map((space) => {
                const Icon = space.icon;

                return (
                  <motion.div
                    key={space.title}
                    variants={fadeUp}
                    whileHover={
                      reduceMotion ? undefined : { y: -6 }
                    }
                    className="rounded-[25px] border border-slate-100 bg-white p-6 text-center shadow-[0_12px_40px_-25px_rgba(0,0,0,0.2)] transition-colors hover:border-teal-200"
                  >
                    <div
                      className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${space.color}`}
                    >
                      <Icon size={28} />
                    </div>

                    <h3 className="text-lg font-bold text-[#102838]">
                      {space.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {space.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 pb-24 sm:px-8">
          <motion.div
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 30 }
            }
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease }}
            className="relative mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-gradient-to-br from-[#0c817e] via-[#0a7478] to-[#0d4358] px-6 py-16 text-center text-white sm:px-10 lg:py-20"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full border-[60px] border-white/5" />
            <div className="pointer-events-none absolute -bottom-36 -left-20 h-80 w-80 rounded-full bg-teal-200/10 blur-[45px]" />

            <div className="relative z-10">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <Sparkles size={27} />
              </div>

              <h2 className="mx-auto max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                L'avenir de votre établissement commence ici.
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-teal-50/90 sm:text-base">
                Découvrez un environnement numérique pensé
                pour simplifier le quotidien administratif
                et académique.
              </p>

              <Link
                href="/login"
                className="group mt-9 inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-[#0e827f] shadow-xl transition-all hover:-translate-y-1 hover:bg-teal-50"
              >
                Accéder à mon espace
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 px-6 py-10 md:flex-row">
          <div className="text-center md:text-left">
            <Logo />
            <p className="mt-3 max-w-xs text-xs leading-6 text-slate-500">
              Une expérience numérique moderne au service
              des établissements éducatifs.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-slate-500">
            <a href="#fonctionnalites" className="hover:text-teal-700">
              Fonctionnalités
            </a>
            <a href="#espaces" className="hover:text-teal-700">
              Espaces
            </a>
            <Link href="/login" className="hover:text-teal-700">
              Connexion
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400 md:text-right">
            © {new Date().getFullYear()} EdTech
            <br />
            Développé par Light Energy Digital
          </p>
        </div>
      </footer>
    </div>
  );
}
