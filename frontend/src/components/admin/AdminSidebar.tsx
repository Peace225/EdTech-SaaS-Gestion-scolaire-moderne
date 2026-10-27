
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  UserCheck,
  ClipboardList,
  Wallet,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type AdminSidebarProps = {
  userName: string;
  userEmail: string;
  logoutAction: () => Promise<void>;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigation: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Utilisateurs",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Classes",
    href: "/admin/classes",
    icon: BookOpen,
  },
  {
    label: "Élèves & Parents",
    href: "/admin/students",
    icon: GraduationCap,
  },
  {
    label: "Affectations profs",
    href: "/admin/assignments",
    icon: UserCheck,
  },
  {
    label: "Notes & Évaluations",
    href: "/admin/grades",
    icon: ClipboardList,
  },
  {
    label: "Factures & Paiements",
    href: "/admin/invoices",
    icon: Wallet,
  },
];

function AdminLogo() {
  return (
    <Link
      href="/admin/dashboard"
      className="group flex items-center gap-3"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-300/20 bg-gradient-to-br from-teal-400 to-[#087177] text-white shadow-lg shadow-teal-950/20 transition-transform duration-300 group-hover:scale-105">
        <ShieldCheck size={25} strokeWidth={1.8} />
      </div>

      <div>
        <p className="text-xl font-black tracking-tight text-white">
          EdTech<span className="text-teal-300">.</span>
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Administration
        </p>
      </div>
    </Link>
  );
}

function NavigationLinks({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation administrateur"
      className="space-y-1.5"
    >
      {navigation.map((item) => {
        const Icon = item.icon;

        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`
              group relative flex items-center gap-3
              rounded-xl px-4 py-3.5 text-[13px]
              font-semibold transition-all duration-300
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-teal-400
              ${
                isActive
                  ? "border border-teal-400/20 bg-teal-400/10 text-teal-300 shadow-[0_5px_20px_-10px_rgba(20,184,166,0.3)]"
                  : "border border-transparent text-slate-400 hover:translate-x-1 hover:bg-white/[0.06] hover:text-white"
              }
            `}
          >
            {isActive && (
              <span className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-teal-400" />
            )}

            <Icon
              size={19}
              strokeWidth={1.8}
              className={
                isActive
                  ? "text-teal-300"
                  : "text-slate-500 transition-colors group-hover:text-teal-300"
              }
            />

            <span className="min-w-0 flex-1 truncate">
              {item.label}
            </span>

            <ChevronRight
              size={15}
              className={`
                transition-all duration-300
                ${
                  isActive
                    ? "text-teal-400"
                    : "text-slate-600 opacity-0 group-hover:translate-x-1 group-hover:opacity-100"
                }
              `}
            />
          </Link>
        );
      })}
    </nav>
  );
}

function UserSection({
  userName,
  userEmail,
  logoutAction,
}: AdminSidebarProps) {
  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="space-y-4 border-t border-white/[0.08] p-4">

      {/* Profil administrateur */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/25 to-cyan-500/10 text-sm font-extrabold text-teal-300">
          {initials || "AD"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-white">
            {userName}
          </p>

          <p className="mt-1 truncate text-[10px] text-slate-500">
            {userEmail}
          </p>

          <div className="mt-1.5 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="text-[9px] font-medium text-emerald-300">
              Administrateur
            </span>
          </div>
        </div>
      </div>

      {/* Déconnexion côté serveur */}
      <form action={logoutAction}>
        <button
          type="submit"
          className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-red-400/15 bg-red-400/[0.04] px-4 py-3 text-xs font-semibold text-red-300 transition-all duration-300 hover:border-red-400/30 hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <span className="flex items-center gap-3">
            <LogOut
              size={17}
              className="transition-transform group-hover:-translate-x-1"
            />
            Se déconnecter
          </span>

          <ChevronRight size={15} />
        </button>
      </form>
    </div>
  );
}

export default function AdminSidebar({
  userName,
  userEmail,
  logoutAction,
}: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const userProps = {
    userName,
    userEmail,
    logoutAction,
  };

  return (
    <>
      {/* =================================
          SIDEBAR DESKTOP
      ================================= */}

<aside
  className="
    sticky top-0 hidden h-dvh w-[280px]
    shrink-0 flex-col
    border-r border-teal-400/10
    bg-[#0d1929]
    shadow-[8px_0_35px_-20px_rgba(0,0,0,0.5)]
    lg:flex
  "
>
  {/* Logo fixe */}
  <div className="shrink-0 border-b border-white/[0.06] px-6 py-7">
    <AdminLogo />
  </div>

  {/* Navigation défilante */}
  <div className="admin-sidebar-scroll relative min-h-0 flex-1 px-4 py-6">
    <div className="mb-5 px-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        Navigation principale
      </p>
    </div>

    <NavigationLinks />

    {/* Encadré d'information */}
    <div className="relative mt-10 overflow-hidden rounded-2xl border border-teal-400/15 bg-gradient-to-br from-teal-400/10 to-cyan-400/[0.03] p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-teal-400/10 blur-3xl" />

      <div className="relative z-10">
        <Sparkles size={22} className="mb-4 text-teal-300" />

        <p className="text-sm font-bold text-white">
          Votre espace de pilotage
        </p>

        <p className="mt-2 text-xs leading-6 text-slate-400">
          Centralisez et pilotez les activités
          de votre établissement.
        </p>
      </div>
    </div>
  </div>

  {/* Profil et déconnexion fixes en bas */}
  <div className="shrink-0">
    <UserSection {...userProps} />
  </div>
</aside>


      {/* =================================
          HEADER MOBILE
      ================================= */}
      <div className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0d1929]/95 backdrop-blur-xl lg:hidden">

        <div className="flex h-[72px] items-center justify-between px-4 sm:px-6">
          <AdminLogo />

          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label={
              mobileOpen
                ? "Fermer le menu"
                : "Ouvrir le menu"
            }
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-menu"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition-colors hover:border-teal-400/30 hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {mobileOpen && (
          <div
            id="admin-mobile-menu"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setMobileOpen(false);
              }
            }}
            className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-white/[0.08] bg-[#0d1929] shadow-2xl"
          >
            <div className="px-4 py-5">
              <p className="mb-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Menu administrateur
              </p>

              <NavigationLinks
                onNavigate={() => setMobileOpen(false)}
              />
            </div>

            <UserSection {...userProps} />
          </div>
        )}

      </div>
    </>
  );
}
