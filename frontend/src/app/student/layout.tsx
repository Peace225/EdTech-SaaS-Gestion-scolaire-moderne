// src/app/student/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  PenTool,
  School,
  ShieldCheck,
  Sparkles,
  BookMarked,
} from "lucide-react";
import "./student-scroll.css";

export const dynamic = "force-dynamic";

type StudentLayoutProps = { children: ReactNode };

// Server Action : n'accepte aucun identifiant fourni par le navigateur.
async function logoutAction(): Promise<void> {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function StudentLayout({ children }: StudentLayoutProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Utilise le rôle et les informations scolaires réels en base.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      studentProfile: {
        select: {
          id: true,
          class: {
            select: {
              id: true,
              name: true,
              level: true,
              educationType: true, // Champ ajouté au modèle Class
            },
          },
        },
      },
    },
  });

  if (!user) redirect("/login");
  if (user.role !== "STUDENT" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const isAdmin = user.role === "ADMIN";
  const student = user.studentProfile;
  const schoolClass = student?.class;
  const isProfessional = schoolClass?.educationType === "PROFESSIONAL";
  const displayName = user.name?.trim() || (isProfessional ? "Apprenant" : "Élève");
  const displayEmail = user.email?.trim() || "Adresse e-mail non renseignée";
  const title = isProfessional ? "ESPACE APPRENANT" : "PORTAIL ÉLÈVE";
  const trackLabel = isProfessional ? "Formation suivie" : "Classe actuelle";
  const secondaryLabel = isProfessional ? "Promotion / Cohorte" : "Niveau";
  const isMissingProfile = user.role === "STUDENT" && !student;
  const isAdminPreview = isAdmin && !student;

  // Seuls les intitulés changent : les routes existantes sont conservées.
  const navigation = [
    { href: "/student/dashboard", label: "Tableau de bord", icon: LayoutDashboard, color: "text-blue-400" },
    { href: "/student/subjects", label: isProfessional ? "Mes modules" : "Mes matières", icon: Layers, color: "text-indigo-400" },
    { href: "/student/courses", label: "Cours & supports", icon: BookMarked, color: "text-cyan-400" },
    { href: "/student/exercises", label: "Exercices", icon: PenTool, color: "text-amber-400" },
    { href: "/student/assignments", label: isProfessional ? "Travaux & évaluations" : "Devoirs & compositions", icon: ClipboardList, color: "text-rose-400" },
    { href: "/student/grades", label: "Mes notes", icon: BookOpen, color: "text-emerald-400" },
    { href: "/student/bulletin", label: isProfessional ? "Mes résultats" : "Mon bulletin", icon: FileText, color: "text-purple-400" },
    { href: "/student/schedule", label: isProfessional ? "Planning de formation" : "Emploi du temps", icon: CalendarDays, color: "text-orange-400" },
  ] as const;

  const classDetails = schoolClass ? (
    <div className="mt-3 flex items-start gap-2 border-t border-slate-800 pt-3">
      <School size={16} className="mt-0.5 shrink-0 text-teal-400" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {trackLabel}
        </p>
        <p className="mt-1 break-words text-xs font-semibold text-white">
          {schoolClass.name}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {secondaryLabel} : {schoolClass.level}
        </p>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex min-h-dvh min-w-0 bg-[#08111f] text-slate-100 lg:h-dvh lg:overflow-hidden">
      {/* Menu fixe desktop, avec défilement indépendant des liens */}
      <aside className="hidden h-dvh w-72 shrink-0 flex-col border-r border-slate-800 bg-[#0b1626] lg:flex">
        <div className="shrink-0 border-b border-slate-800 px-5 py-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-[11px] font-semibold text-teal-300">
            <Sparkles size={13} aria-hidden="true" />
            {isProfessional ? "Formation professionnelle" : "Espace scolaire"}
          </div>
          <Link href="/student/dashboard" className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-teal-400">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <GraduationCap size={24} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold tracking-tight text-white">{title}</p>
              <p className="text-[11px] text-slate-500">Gestion pédagogique numérique</p>
            </div>
          </Link>
        </div>

        <section aria-label="Votre dossier" className="shrink-0 px-4 pt-4">
          <div className="rounded-2xl border border-slate-800 bg-[#111e30] p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-700 text-sm font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                <p className="truncate text-[11px] text-slate-400">{displayEmail}</p>
              </div>
            </div>
            {classDetails}
            {isAdminPreview && (
              <p className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3 text-xs text-amber-300">
                <ShieldCheck size={14} aria-hidden="true" /> Aperçu administrateur
              </p>
            )}
            {isMissingProfile && (
              <p className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3 text-xs text-amber-300">
                <AlertCircle size={14} aria-hidden="true" /> Dossier scolaire à compléter
              </p>
            )}
          </div>
        </section>

        <nav aria-label="Navigation du portail" className="student-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Navigation
          </p>
          <div className="space-y-1.5">
            {navigation.map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
              >
                <Icon size={18} className={`${color} shrink-0 transition-transform group-hover:scale-110`} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-slate-800 px-4 py-4">
          <form action={logoutAction}>
            <button type="submit" className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10">
              <LogOut size={16} aria-hidden="true" /> Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:h-dvh lg:overflow-hidden">
        {/* En mobile, la page défile naturellement et le menu est horizontal */}
        <header className="sticky top-0 z-40 shrink-0 border-b border-slate-800 bg-[#0b1626]/95 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <Link href="/student/dashboard" className="flex min-w-0 items-center gap-2">
              <GraduationCap size={23} className="shrink-0 text-blue-400" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-white">{title}</p>
                <p className="truncate text-[11px] text-slate-400">
                  {displayName}{schoolClass ? ` · ${schoolClass.name}` : ""}
                </p>
              </div>
            </Link>
            <form action={logoutAction}>
              <button type="submit" aria-label="Déconnexion" className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10">
                <LogOut size={17} aria-hidden="true" />
              </button>
            </form>
          </div>
          <nav aria-label="Navigation mobile" className="student-scroll-mobile gap-2 border-t border-slate-800/70 px-4 py-3">
            {navigation.map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-700/70 bg-[#111e30] px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-teal-500/30 hover:text-white">
                <Icon size={15} className={color} aria-hidden="true" /> {label}
              </Link>
            ))}
          </nav>
        </header>

        <main id="student-main-content" className="student-scroll min-w-0 flex-1 overflow-x-hidden bg-[#08111f] px-4 py-6 sm:px-6 lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {isMissingProfile && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <AlertCircle size={19} className="mt-0.5 shrink-0 text-amber-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-amber-300">Dossier de l'apprenant incomplet</p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-100/80">Votre compte est actif, mais aucun dossier pédagogique n'y est associé. Contactez l'administration pour être inscrit dans une classe ou une promotion de formation.</p>
                </div>
              </div>
            )}
            {isAdminPreview && (
              <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                <ShieldCheck size={19} className="mt-0.5 shrink-0 text-blue-400" aria-hidden="true" />
                <p className="text-xs text-blue-100/80">Mode aperçu administrateur : les informations personnelles ne sont pas simulées. Chaque page doit appliquer ses propres contrôles d'accès aux données.</p>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
