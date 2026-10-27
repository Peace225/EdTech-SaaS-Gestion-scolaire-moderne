// src/app/parent/child/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});
const scoreFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});

// Un enfant n'est accessible que s'il est rattaché au parent authentifié.
async function loadChildren(parentId: string) {
  return prisma.student.findMany({
    where: { parentId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      user: { select: { name: true, email: true } },
      class: {
        select: { name: true, level: true, educationType: true },
      },
      // Jamais de notes PENDING ou REJECTED dans le portail parent.
      grades: {
        where: { status: "APPROVED" },
        orderBy: [{ evaluationDate: "desc" }, { id: "desc" }],
        take: 3,
        select: { id: true, subject: true, score: true, term: true },
      },
      _count: {
        select: {
          grades: { where: { status: "APPROVED" } },
          absences: { where: { justified: false } },
        },
      },
      // Double filtre : la facture doit appartenir à l'enfant ET au parent.
      invoices: {
        where: {
          parentId,
          status: { in: ["PENDING", "OVERDUE"] },
        },
        select: {
          id: true,
          amount: true,
          dueDate: true,
          status: true,
          payments: {
            select: { amount: true, status: true },
          },
        },
      },
    },
  });
}

type Child = Awaited<ReturnType<typeof loadChildren>>[number];

function getName(child: Child) {
  const name = child.user.name?.trim();
  if (name) return name;
  return child.user.email?.split("@")[0] || "Apprenant";
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toLocaleUpperCase("fr-FR") || "A"
  );
}

function remainingAmount(invoice: Child["invoices"][number]) {
  // Dans ce projet, seul un Payment.status = "PAID" est traité comme acquis.
  // Adapter cette valeur si les webhooks du prestataire utilisent un autre statut.
  const paid = invoice.payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + Math.max(0, payment.amount), 0);

  return Math.max(0, invoice.amount - paid);
}

function getFinance(child: Child, now: Date) {
  let due = 0;
  let late = 0;

  for (const invoice of child.invoices) {
    const remaining = remainingAmount(invoice);
    due += remaining;
    if (
      invoice.status === "OVERDUE" ||
      (invoice.status === "PENDING" && invoice.dueDate < now)
    ) {
      late += remaining;
    }
  }

  return { due, late };
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Icon size={17} className={color} aria-hidden="true" />
        {label}
      </div>
      <p className="mt-3 break-words text-xl font-extrabold tracking-tight text-white sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function ChildCard({ child, now }: { child: Child; now: Date }) {
  const name = getName(child);
  const professional = child.class.educationType === "PROFESSIONAL";
  const finance = getFinance(child, now);
  const unexcused = child._count.absences;
  const approved = child._count.grades;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-900/55 shadow-xl backdrop-blur-xl transition-colors hover:border-slate-700">
      <div className="flex-1 space-y-5 p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-lg font-extrabold text-white"
            aria-hidden="true"
          >
            {getInitials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-lg font-extrabold text-white">{name}</h2>
            <p className="mt-1 text-xs text-slate-400">
              {professional ? "Formation professionnelle" : "Parcours scolaire"}
            </p>
            <p className="mt-2 inline-flex max-w-full flex-wrap items-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300">
              {child.class.name} · {child.class.level}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <Award size={14} className="text-emerald-400" aria-hidden="true" />
              Notes validées
            </p>
            <p className="mt-2 text-2xl font-extrabold text-white">{approved}</p>
            <p className="mt-1 text-[11px] text-slate-500">Visibles par la famille</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <Clock3 size={14} className="text-amber-400" aria-hidden="true" />
              Absences non justifiées
            </p>
            <p className={`mt-2 text-2xl font-extrabold ${unexcused ? "text-amber-400" : "text-white"}`}>
              {unexcused}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Total enregistré</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/65 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <BookOpen size={15} className="text-sky-400" aria-hidden="true" />
              Dernières notes approuvées
            </h3>
            <span className="text-[11px] text-slate-500">{child.grades.length}/3</span>
          </div>
          {child.grades.length ? (
            <ul className="space-y-2">
              {child.grades.map((grade) => (
                <li
                  key={grade.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2 text-xs"
                >
                  <span className="min-w-0 truncate text-slate-300" title={grade.subject}>
                    {grade.subject} <span className="text-slate-500">· {grade.term}</span>
                  </span>
                  <strong className="shrink-0 text-emerald-300">
                    {scoreFormatter.format(grade.score)}/20
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs leading-relaxed text-slate-500">
              Aucune note approuvée n'est encore disponible.
            </p>
          )}
        </div>

        <div className={`rounded-2xl border p-4 ${finance.late > 0 ? "border-amber-500/30 bg-amber-500/5" : "border-slate-800 bg-slate-950/65"}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Wallet size={15} className="text-amber-400" aria-hidden="true" />
              Situation financière
            </h3>
            {finance.late > 0 ? (
              <AlertTriangle size={16} className="text-amber-400" aria-label="Échéance dépassée" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-400" aria-label="Aucune échéance dépassée impayée" />
            )}
          </div>
          <p className="mt-2 break-words text-lg font-extrabold text-white">
            {finance.due > 0 ? currencyFormatter.format(finance.due) : "Aucun solde en attente"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {finance.late > 0
              ? `${currencyFormatter.format(finance.late)} sur des échéances dépassées`
              : "Aucun montant en retard identifié"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/35 px-5 py-4 sm:px-6">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck size={14} className="text-emerald-400" aria-hidden="true" />
          Dossier familial
        </span>
        <Link
          href={`/parent/child/${encodeURIComponent(child.id)}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          Voir le dossier <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export default async function ParentChildListingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Le rôle de session seul n'est pas une autorisation suffisante.
  const parent = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!parent) redirect("/login");
  if (parent.role !== "PARENT") notFound();

  const children = await loadChildren(parent.id);
  const now = new Date();
  const finances = children.map((child) => getFinance(child, now));
  const totalDue = finances.reduce((sum, item) => sum + item.due, 0);
  const totalLate = finances.reduce((sum, item) => sum + item.late, 0);
  const totalApproved = children.reduce((sum, child) => sum + child._count.grades, 0);
  const totalUnexcused = children.reduce((sum, child) => sum + child._count.absences, 0);

  return (
    <div className="relative mx-auto max-w-7xl space-y-7 pb-16 text-slate-100">
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-600/10 blur-[95px]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-0 top-80 h-64 w-64 rounded-full bg-emerald-600/10 blur-[95px]" aria-hidden="true" />

      <header className="relative rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <Sparkles size={14} aria-hidden="true" /> Espace famille
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Mes enfants inscrits
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-400">
              Retrouvez les profils rattachés à votre compte, leurs résultats validés,
              leur assiduité et les factures associées.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/75 px-5 py-3">
            <GraduationCap size={22} className="text-sky-400" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Effectif familial</p>
              <p className="text-base font-extrabold text-white">{children.length} enfant{children.length > 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>
      </header>

      {children.length === 0 ? (
        <section className="relative mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-xl sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
            <Users size={28} aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">Aucun enfant rattaché</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Aucun profil d'apprenant n'est actuellement associé à votre compte.
            Contactez l'administration pour faire vérifier le rattachement familial.
          </p>
          <Link
            href="/parent/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-slate-950 hover:bg-slate-200"
          >
            Retour au tableau de bord <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <>
          <section aria-label="Résumé familial" className="relative grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Metric icon={Users} label="Enfants" value={children.length} detail="Profils liés à votre compte" color="text-sky-400" />
            <Metric icon={Award} label="Notes approuvées" value={totalApproved} detail="Résultats visibles" color="text-emerald-400" />
            <Metric icon={Clock3} label="Absences non justifiées" value={totalUnexcused} detail="Toutes périodes enregistrées" color="text-amber-400" />
            <Metric
              icon={Wallet}
              label="Montant restant"
              value={currencyFormatter.format(totalDue)}
              detail={totalLate > 0 ? `${currencyFormatter.format(totalLate)} en retard` : "Aucun solde en retard identifié"}
              color="text-indigo-400"
            />
          </section>

          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">Dossiers des apprenants</h2>
            <div className="flex flex-wrap gap-2">
              <Link href="/parent/reports" className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800">
                Voir les bulletins
              </Link>
              <Link href="/parent/invoices" className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800">
                Consulter les factures
              </Link>
            </div>
          </div>

          <section aria-label="Liste de mes enfants" className="relative grid grid-cols-1 gap-5 lg:grid-cols-2">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} now={now} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
