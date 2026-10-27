
"use client";

import { useState, type FormEvent } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

type Role = "ADMIN" | "TEACHER" | "PARENT" | "STUDENT";

const ROLE_REDIRECT: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  PARENT: "/parent/dashboard",
  STUDENT: "/student/dashboard",
};

function isRole(role: unknown): role is Role {
  return (
    typeof role === "string" &&
    Object.prototype.hasOwnProperty.call(ROLE_REDIRECT, role)
  );
}

const modules = [
  { icon: GraduationCap, label: "Gestion académique" },
  { icon: Users, label: "Gestion des profils" },
  { icon: Wallet, label: "Gestion financière" },
  { icon: BookOpen, label: "Suivi pédagogique" },
];

export default function LoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!res?.ok || res.error) {
        setError("Adresse e-mail ou mot de passe incorrect.");
        return;
      }

      const session = await getSession();

      const role = (
        session?.user as { role?: unknown } | undefined
      )?.role;

      if (!isRole(role)) {
        setError(
          "Connexion établie, mais votre espace utilisateur est introuvable. Contactez l'administrateur."
        );
        return;
      }

      router.replace(ROLE_REDIRECT[role]);
      router.refresh();
    } catch {
      setError(
        "Impossible de vous connecter pour le moment. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#f8fbfc] font-sans text-[#102838] selection:bg-teal-200 selection:text-teal-950">

      {/* =========================
          PANNEAU GAUCHE
      ========================= */}
      <section className="relative hidden min-h-screen w-[52%] flex-col justify-between overflow-hidden bg-[#0c2838] px-10 py-10 text-white lg:flex xl:px-16">

        {/* Dégradés d'ambiance */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(20,184,166,0.20),transparent_40%),radial-gradient(circle_at_90%_80%,rgba(6,182,212,0.12),transparent_45%)]" />

        <div className="pointer-events-none absolute -right-32 top-1/4 h-[500px] w-[500px] rounded-full border border-white/5" />

        <div className="pointer-events-none absolute -right-16 top-1/3 h-[350px] w-[350px] rounded-full border border-white/5" />

        {/* LOGO */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 shadow-lg shadow-teal-950/30">
              <GraduationCap size={27} strokeWidth={1.8} />
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight">
                EdTech<span className="text-teal-300">.</span>
              </h2>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-teal-200/70">
                Smart Education
              </p>
            </div>
          </Link>
        </motion.div>

        {/* CONTENT */}
        <div className="relative z-10 my-12 max-w-xl">

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-200"
          >
            <Sparkles size={15} />
            Une nouvelle expérience éducative
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[clamp(40px,4vw,66px)] font-black leading-[1.12] tracking-[-0.055em]"
          >
            L'éducation
            <br />
            évolue.
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              Votre gestion
              <br />
              aussi.
            </span>
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-7 max-w-md text-base leading-8 text-slate-300"
          >
            Une plateforme intelligente pour connecter les
            établissements, les enseignants, les étudiants
            et les familles au sein d'un environnement unique.
          </motion.p>

          {/* Illustration animée */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.4 }}
            className="relative mt-12 max-w-[450px]"
          >
            <div className="absolute inset-0 rounded-[35px] bg-teal-400/10 blur-[70px]" />

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">

              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300">
                    <LayoutDashboard size={22} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      Votre espace numérique
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Une gestion centralisée
                    </p>
                  </div>
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-teal-400/20 bg-teal-400/10 text-teal-300">
                  <Check size={16} />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {modules.map((module, index) => {
                  const Icon = module.icon;

                  return (
                    <motion.div
                      key={module.label}
                      animate={
                        reduceMotion
                          ? undefined
                          : { y: [0, index % 2 === 0 ? -5 : 5, 0] }
                      }
                      transition={{
                        duration: 5 + index * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.06] p-4"
                    >
                      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                        <Icon size={20} />
                      </div>

                      <p className="text-xs font-semibold text-slate-200">
                        {module.label}
                      </p>

                      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ scaleX: reduceMotion ? 1 : 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{
                            delay: 0.6 + index * 0.1,
                            duration: 0.9,
                          }}
                          style={{
                            width: `${55 + index * 12}%`,
                            transformOrigin: "left",
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-300"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* FOOTER */}
        <div className="relative z-10 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={16} className="text-teal-300" />
            Espace de connexion sécurisé
          </div>

          <span className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} EdTech
          </span>
        </div>
      </section>

      {/* =========================
          PANNEAU DROIT
      ========================= */}
      <section className="relative flex min-h-screen w-full flex-col justify-center bg-[#f8fbfc] px-5 py-12 sm:px-10 lg:w-[48%] xl:px-20">

        <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-[320px] w-[320px] rounded-full bg-teal-100/40 blur-[80px]" />

        {/* Header mobile */}
        <div className="absolute left-5 top-7 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">
              <GraduationCap size={21} />
            </div>
            <span className="text-xl font-black text-[#102838]">
              EdTech<span className="text-teal-600">.</span>
            </span>
          </Link>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative z-10 mx-auto w-full max-w-[430px]"
        >
          {/* Back */}
          <Link
            href="/"
            className="mb-10 hidden w-fit items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-teal-700 lg:inline-flex"
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </Link>

          {/* Heading */}
          <div className="mb-9">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-2 text-[11px] font-bold text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              Portail académique
            </div>

            <h1 className="text-3xl font-black tracking-[-0.04em] text-[#102838] sm:text-[42px]">
              Bon retour 👋
            </h1>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              Connectez-vous à votre compte pour accéder
              à votre espace de travail personnalisé.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div className="space-y-2.5">
              <label
                htmlFor="email"
                className="block text-xs font-bold text-[#193649]"
              >
                Adresse e-mail
              </label>

              <div className="group relative">
                <Mail
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="nom@etablissement.ci"
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="h-[58px] w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-[#102838] shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-[#193649]"
              >
                Mot de passe
              </label>

              <div className="group relative">
                <LockKeyhole
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Saisissez votre mot de passe"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="h-[58px] w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-[#102838] shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  aria-pressed={showPassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: -8 }
                }
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-6 text-red-700"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={
                reduceMotion || loading ? undefined : { y: -2 }
              }
              whileTap={
                reduceMotion || loading ? undefined : { scale: 0.98 }
              }
              className="group flex h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0e827f] to-[#096d77] px-5 text-sm font-bold text-white shadow-[0_15px_35px_-15px_rgba(14,130,127,0.6)] transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(14,130,127,0.65)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter à mon espace
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </motion.button>
          </form>

          {/* Espace de confiance */}
          <div className="mt-9 flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="text-xs font-bold text-teal-900">
                Accès réservé aux utilisateurs autorisés
              </p>
              <p className="mt-1 text-[11px] leading-5 text-teal-800/70">
                Chaque profil dispose d'un espace de gestion
                adapté à ses responsabilités.
              </p>
            </div>
          </div>

          {/* Profiles */}
          <div className="mt-8">
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Espaces disponibles
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                "Administration",
                "Enseignant",
                "Parent",
                "Étudiant",
              ].map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-500"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-200 pt-6 text-center">
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} EdTech SaaS
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Une solution développée par{" "}
              <span className="font-bold text-teal-700">
                Light Energy Digital
              </span>
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
