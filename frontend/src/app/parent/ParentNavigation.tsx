// src/app/parent/ParentNavigation.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

type ParentNavigationProps = {
  parentName: string;
  parentEmail: string;
  childrenCount: number;
  overdueInvoicesCount: number;
  logoutAction: () => Promise<void>;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  iconClass: string;
  count?: number;
  attention?: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
}

function SidebarContents({
  parentName,
  parentEmail,
  childrenCount,
  overdueInvoicesCount,
  logoutAction,
  onNavigate,
}: ParentNavigationProps & { onNavigate?: () => void }) {
  const pathname = usePathname();

  const schoolLinks: NavigationItem[] = [
    {
      label: "Tableau de bord",
      href: "/parent/dashboard",
      icon: LayoutDashboard,
      iconClass: "text-sky-400",
    },
    {
      label: "Mes enfants",
      href: "/parent/child",
      icon: Users,
      iconClass: "text-emerald-400",
      count: childrenCount,
    },
    {
      label: "Bulletins et avis",
      href: "/parent/reports",
      icon: FileText,
      iconClass: "text-violet-400",
    },
  ];

  const practicalLinks: NavigationItem[] = [
    {
      label: "Factures et frais",
      href: "/parent/invoices",
      icon: Wallet,
      iconClass: "text-amber-400",
      count: overdueInvoicesCount,
      attention: overdueInvoicesCount > 0,
    },
    {
      label: "Messagerie",
      href: "/parent/messages",
      icon: MessageSquare,
      iconClass: "text-pink-400",
    },
  ];

  function renderLink(item: NavigationItem) {
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={[
          "group flex min-h-11 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
          active
            ? "border-sky-400/25 bg-sky-400/10 text-white shadow-[inset_3px_0_0_rgba(56,189,248,0.8)]"
            : "border-transparent text-slate-400 hover:border-slate-700/70 hover:bg-slate-900 hover:text-white",
        ].join(" ")}
      >
        <Icon
          size={18}
          aria-hidden="true"
          className={`shrink-0 ${item.iconClass} transition-transform group-hover:scale-110`}
        />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {typeof item.count === "number" && item.count > 0 ? (
          <span
            className={[
              "min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums",
              item.attention
                ? "border border-rose-400/30 bg-rose-400/15 text-rose-300"
                : "border border-slate-700 bg-slate-800 text-slate-200",
            ].join(" ")}
            aria-label={
              item.attention
                ? `${item.count} factures en retard`
                : `${item.count} enfants rattachés`
            }
          >
            {item.count > 99 ? "99+" : item.count}
          </span>
        ) : active ? (
          <ChevronRight size={15} aria-hidden="true" className="text-sky-400" />
        ) : null}
      </Link>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-800/80 px-5 pb-5 pt-6">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold text-sky-300">
          <Sparkles size={12} aria-hidden="true" /> Espace famille
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-600/30 to-indigo-600/20 text-sky-300">
            <GraduationCap size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[17px] font-black tracking-tight text-white">
              Portail <span className="text-sky-400">Parent</span>
            </p>
            <p className="text-[11px] text-slate-500">Suivi de votre famille</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5">
        <nav aria-label="Suivi scolaire" className="space-y-1.5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Scolarité
          </p>
          {schoolLinks.map(renderLink)}
        </nav>

        <nav aria-label="Services parent" className="space-y-1.5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Services et échanges
          </p>
          {practicalLinks.map(renderLink)}
        </nav>

        {overdueInvoicesCount > 0 && (
          <Link
            href="/parent/invoices"
            onClick={onNavigate}
            className="flex items-start gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200 transition-colors hover:bg-amber-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              {overdueInvoicesCount} facture{overdueInvoicesCount > 1 ? "s" : ""} en retard.
              <span className="mt-1 block font-semibold underline underline-offset-2">
                Consulter les factures
              </span>
            </span>
          </Link>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-slate-800/80 p-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck size={14} aria-hidden="true" className="text-emerald-400" />
          Accès personnel sécurisé
        </div>
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/65 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white">
            {initials(parentName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{parentName}</p>
            <p className="truncate text-[11px] text-slate-400">
              {parentEmail || "Compte parent"}
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 px-4 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LogOut size={16} aria-hidden="true" /> Déconnexion
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ParentNavigation(props: ParentNavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between border-b border-slate-800/80 bg-[#0b1020]/95 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/parent/dashboard" className="flex items-center gap-2 font-bold text-white">
          <GraduationCap size={22} aria-hidden="true" className="text-sky-400" />
          Portail <span className="text-sky-400">Parent</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu de navigation"
          aria-expanded={mobileOpen}
          aria-controls="parent-mobile-navigation"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <Menu size={21} aria-hidden="true" />
        </button>
      </header>

      <aside
        aria-label="Menu de l'espace parent"
        className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-800/80 bg-[#0b1020] shadow-2xl lg:flex"
      >
        <SidebarContents {...props} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <aside
            id="parent-mobile-navigation"
            aria-label="Navigation parent sur mobile"
            className="relative flex h-full w-[min(88vw,320px)] flex-col border-r border-slate-800 bg-[#0b1020] shadow-2xl"
          >
            <button
              type="button"
              autoFocus
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer la navigation"
              className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <SidebarContents {...props} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
