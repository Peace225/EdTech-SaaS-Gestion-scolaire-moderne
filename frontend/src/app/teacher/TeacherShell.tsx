
"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  ClipboardCheck,
  Award,
  Users,
  CalendarDays,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Search,
  Plus,
  Bell,
  ShieldCheck,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

// ========================================
// TYPES
// ========================================

type TeacherUser = {
  name: string;
  email: string;
  role: "TEACHER" | "ADMIN";
};

type TeacherShellProps = {
  children: ReactNode;
  user: TeacherUser;
  rejectedGradesCount: number;
  logoutAction: () => Promise<void>;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

// ========================================
// NAVIGATION
// ========================================

const navigation: NavSection[] = [
  {
    title: "ESPACE DE TRAVAIL",
    items: [
      {
        label: "Tableau de bord",
        href: "/teacher/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "MES CLASSES",
    items: [
      {
        label: "Mes élèves & classes",
        href: "/teacher/students",
        icon: Users,
      },
      {
        label: "Emploi du temps",
        href: "/teacher/schedule",
        icon: CalendarDays,
      },
    ],
  },
  {
    title: "PÉDAGOGIE",
    items: [
      {
        label: "Exercices",
        href: "/teacher/exercises",
        icon: BookOpen,
      },
      {
        label: "Devoirs",
        href: "/teacher/assignments",
        icon: ClipboardList,
      },
      {
        label: "Copies & corrections",
        href: "/teacher/submissions",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    title: "ÉVALUATIONS & SUIVI",
    items: [
      {
        label: "Notes & validations",
        href: "/teacher/grades",
        icon: Award,
      },
      {
        label: "Bulletins & appréciations",
        href: "/teacher/reports",
        icon: FileText,
      },
    ],
  },
];

const navItems = navigation.flatMap(
  (section) => section.items
);

function isActive(pathname: string, href: string) {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "EN"
  );
}

// ========================================
// TEACHER SHELL
// ========================================

export default function TeacherShell({
  children,
  user,
  rejectedGradesCount,
  logoutAction,
}: TeacherShellProps) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef =
    useRef<HTMLButtonElement>(null);
  const openButtonRef =
    useRef<HTMLButtonElement>(null);

  const currentPage = navItems.find((item) =>
    isActive(pathname, item.href)
  );

  const filteredNavigation = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        normalizeSearch(item.label).includes(
          normalizeSearch(search)
        )
      ),
    }))
    .filter((section) => section.items.length > 0);

  const hasRejectedGrades =
    rejectedGradesCount > 0;

  // ========================================
  // ACCESSIBILITÉ MENU MOBILE
  // ========================================

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleEscape
      );

      openButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  function handleSidebarKeyboard(
    event: KeyboardEvent<HTMLElement>
  ) {
    if (!mobileOpen || event.key !== "Tab") {
      return;
    }

    const elements =
      sidebarRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled])'
      );

    if (!elements?.length) return;

    const first = elements[0];
    const last = elements[elements.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className="teacher-layout min-h-dvh bg-[#08111f] text-slate-100 lg:flex">
      {/* ===================================
          OVERLAY MOBILE
      =================================== */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer la navigation"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ===================================
          SIDEBAR
      =================================== */}
      <aside
        ref={sidebarRef}
        onKeyDown={handleSidebarKeyboard}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label="Navigation enseignant"
        className={[
          "fixed inset-y-0 left-0 z-50",
          "flex h-dvh w-[280px] flex-col",
          "border-r border-slate-800",
          "bg-[#0d1929] shadow-2xl",
          "transition-transform duration-300",
          "lg:sticky lg:top-0 lg:h-screen",
          "lg:w-[275px] lg:shrink-0",
          "lg:translate-x-0 lg:shadow-none",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        {/* LOGO */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-800 px-5">
          <Link
            href="/teacher/dashboard"
            onClick={closeMobile}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-400">
              <GraduationCap
                size={25}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <p className="text-base font-extrabold tracking-tight text-white">
                EDTECH{" "}
                <span className="text-teal-400">
                  SCHOOL
                </span>
              </p>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Portail enseignant
              </p>
            </div>
          </Link>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeMobile}
            aria-label="Fermer le menu"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* INFORMATIONS PORTAIL */}
        <div className="shrink-0 px-4 pt-5">
          <div className="flex items-center gap-3 rounded-2xl border border-teal-500/15 bg-teal-500/[0.06] p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
              <ShieldCheck size={20} />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-bold text-teal-300">
                Espace pédagogique
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                Accès sécurisé
              </p>
            </div>
          </div>
        </div>

        {/* RECHERCHE DANS LE MENU */}
        <div className="shrink-0 px-4 pt-5">
          <label
            htmlFor="teacher-menu-search"
            className="sr-only"
          >
            Rechercher une rubrique
          </label>

          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              id="teacher-menu-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher une rubrique..."
              className="w-full rounded-xl border border-slate-700/70 bg-[#08111f] py-3 pl-10 pr-3 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400"
            />
          </div>
        </div>

        {/* NAVIGATION */}
        <nav
            aria-label="Menu principal"
            className="teacher-scroll min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-6 pr-2"
            >
          {filteredNavigation.length === 0 && (
            <div className="rounded-xl border border-slate-800 p-4 text-center">
              <Search
                size={20}
                className="mx-auto mb-2 text-slate-600"
              />

              <p className="text-xs text-slate-400">
                Aucune rubrique trouvée.
              </p>
            </div>
          )}

          {filteredNavigation.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-500">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const active = isActive(
                    pathname,
                    item.href
                  );

                  const showRejectedBadge =
                    item.href === "/teacher/grades" &&
                    hasRejectedGrades;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      aria-current={
                        active ? "page" : undefined
                      }
                      className={[
                        "group flex min-h-11 items-center gap-3",
                        "rounded-xl border px-3 py-3",
                        "text-sm font-medium transition-all",
                        "focus-visible:outline-none",
                        "focus-visible:ring-2",
                        "focus-visible:ring-teal-400",
                        active
                          ? "border-teal-500/20 bg-teal-500/10 text-teal-300"
                          : "border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-white",
                      ].join(" ")}
                    >
                      <Icon
                        size={18}
                        className={
                          active
                            ? "shrink-0 text-teal-400"
                            : "shrink-0 text-slate-500 group-hover:text-teal-400"
                        }
                      />

                      <span className="min-w-0 flex-1">
                        {item.label}
                      </span>

                      {showRejectedBadge && (
                        <span
                          title="Notes rejetées à corriger"
                          className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400"
                        >
                          {rejectedGradesCount > 99
                            ? "99+"
                            : rejectedGradesCount}
                        </span>
                      )}

                      {active && !showRejectedBadge && (
                        <ChevronRight
                          size={15}
                          className="shrink-0 text-teal-400"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* PROFIL UTILISATEUR */}
        <div className="shrink-0 border-t border-slate-800 bg-[#0b1625] p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 text-sm font-bold text-slate-950">
              {getInitials(user.name)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user.name}
              </p>

              <p className="mt-1 truncate text-xs text-slate-500">
                {user.email || "Compte enseignant"}
              </p>

              <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                {user.role === "ADMIN"
                  ? "Administrateur"
                  : "Enseignant"}
              </span>
            </div>
          </div>

          {user.role === "ADMIN" && (
            <Link
              href="/admin/dashboard"
              onClick={closeMobile}
              className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              <LayoutDashboard size={16} />
              Retour à l'administration
            </Link>
          )}

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
            >
              <LogOut size={17} />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* ===================================
          CONTENU PRINCIPAL
      =================================== */}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex min-h-18 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-[#08111f]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={openButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={mobileOpen}
              className="rounded-xl border border-slate-700 bg-slate-800/70 p-2.5 text-white hover:bg-slate-700 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <p className="hidden text-[11px] text-slate-500 sm:block">
                Portail enseignant /{" "}
                <span className="text-teal-400">
                  {currentPage?.label ??
                    "Espace pédagogique"}
                </span>
              </p>

              <h1 className="truncate text-base font-bold text-white sm:mt-1 sm:text-lg">
                {currentPage?.label ??
                  "Espace pédagogique"}
              </h1>
            </div>
          </div>

          {/* RACCOURCIS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {hasRejectedGrades && (
              <Link
                href="/teacher/grades"
                title={`${rejectedGradesCount} note(s) à corriger`}
                aria-label={`${rejectedGradesCount} note(s) rejetée(s) à corriger`}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
              >
                <Bell size={19} />

                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {rejectedGradesCount > 99
                    ? "99+"
                    : rejectedGradesCount}
                </span>
              </Link>
            )}

            {/* MENU ACTIONS RAPIDES */}
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl bg-teal-500 px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-teal-400 sm:px-4 sm:text-sm [&::-webkit-details-marker]:hidden">
                <Plus size={17} />
                <span className="hidden sm:inline">
                  Créer
                </span>
                <span className="sm:hidden">
                  Nouveau
                </span>
              </summary>

              <div className="absolute right-0 top-full z-40 mt-3 w-60 overflow-hidden rounded-2xl border border-slate-700 bg-[#111e30] p-2 shadow-2xl">
                <Link
                  href="/teacher/assignments/new"
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <ClipboardList
                    size={17}
                    className="text-teal-400"
                  />
                  Nouveau devoir
                </Link>

                <Link
                  href="/teacher/exercises/new"
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <BookOpen
                    size={17}
                    className="text-sky-400"
                  />
                  Nouvel exercice
                </Link>

                <Link
                  href="/teacher/grades"
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <Award
                    size={17}
                    className="text-amber-400"
                  />
                  Saisir une note
                </Link>
              </div>
            </details>

            <div className="hidden items-center gap-3 border-l border-slate-800 pl-4 md:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-xs font-bold text-teal-300">
                {getInitials(user.name)}
              </div>

              <div className="hidden max-w-40 lg:block">
                <p className="truncate text-xs font-semibold text-white">
                  {user.name}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {user.role === "ADMIN"
                    ? "Administrateur"
                    : "Enseignant"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ALERTE PÉDAGOGIQUE */}
        {hasRejectedGrades && (
          <div className="border-b border-amber-500/15 bg-amber-500/[0.04] px-4 py-3 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3">
              <AlertCircle
                size={18}
                className="shrink-0 text-amber-400"
              />

              <p className="flex-1 text-xs leading-relaxed text-amber-200">
                Vous avez{" "}
                <strong>
                  {rejectedGradesCount} note(s) rejetée(s)
                </strong>{" "}
                nécessitant une correction.
              </p>

              <Link
                href="/teacher/grades"
                className="text-xs font-bold text-teal-400 underline underline-offset-4 hover:text-teal-300"
              >
                Voir les notes
              </Link>
            </div>
          </div>
        )}

        {/* MAIN */}
        <main
          id="teacher-main-content"
          className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-slate-800/80 px-4 py-5 text-center text-[11px] text-slate-600">
          © EdTech SaaS · Portail enseignant
        </footer>
      </div>
    </div>
  );
}
