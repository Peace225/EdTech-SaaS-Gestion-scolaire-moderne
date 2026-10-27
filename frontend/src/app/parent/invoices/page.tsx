// src/app/parent/invoices/page.tsx
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Landmark,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Factures et paiements | Espace parent",
  description: "Consultation des factures et des paiements enregistrés pour vos enfants.",
};

type Filter = "all" | "due" | "overdue" | "partial" | "paid";
type SearchParams = {
  filter?: string | string[];
  q?: string | string[];
};
type PageProps = {
  searchParams?: Promise<SearchParams>;
};

const FILTERS: ReadonlyArray<{ key: Filter; label: string }> = [
  { key: "all", label: "Toutes" },
  { key: "due", label: "À régler" },
  { key: "overdue", label: "En retard" },
  { key: "partial", label: "Paiement partiel" },
  { key: "paid", label: "Payées" },
];

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF", // À adapter si l'établissement facture dans une autre devise.
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatMoney(amount: number): string {
  return moneyFormatter.format(Math.max(0, amount));
}

function readParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
}

function createFilterHref(filter: Filter, query: string): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (query) params.set("q", query);
  const suffix = params.toString();
  return `/parent/invoices${suffix ? `?${suffix}` : ""}`;
}

export default async function ParentInvoicesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Ne pas se fier au rôle présent dans le cookie de session.
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (account?.role !== "PARENT") notFound();

  const resolvedParams = (await searchParams) ?? {};
  const rawFilter = readParam(resolvedParams.filter);
  const filter: Filter = FILTERS.some((item) => item.key === rawFilter)
    ? (rawFilter as Filter)
    : "all";
  const query = readParam(resolvedParams.q).trim().slice(0, 80);
  const search = query.toLocaleLowerCase("fr");

  // Double contrôle : la facture doit appartenir au parent ET à un enfant
  // actuellement rattaché à ce parent.
  const invoices = await prisma.invoice.findMany({
    where: {
      parentId: account.id,
      student: { is: { parentId: account.id } },
    },
    select: {
      id: true,
      amount: true,
      status: true,
      dueDate: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
          class: { select: { name: true, level: true, educationType: true } },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          status: true,
          provider: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ dueDate: "desc" }, { id: "desc" }],
  });

  const now = new Date();

  const records = invoices.map((invoice) => {
    const amount = Math.max(0, invoice.amount);

    // Seuls les paiements réellement confirmés dans la base sont déduits.
    // Adapter "PAID" si les webhooks de paiement utilisent une autre valeur.
    const confirmedPayments = invoice.payments.filter((payment) => payment.status === "PAID");
    const confirmedAmount = confirmedPayments.reduce(
      (sum, payment) => sum + Math.max(0, payment.amount),
      0,
    );
    const isPaid = invoice.status === "PAID";
    const remaining = isPaid ? 0 : Math.max(0, amount - confirmedAmount);
    const isOverdue =
      remaining > 0 && (invoice.status === "OVERDUE" || invoice.dueDate.getTime() < now.getTime());
    const isPartial = !isPaid && remaining > 0 && confirmedAmount > 0;
    const needsReconciliation = !isPaid && remaining === 0;

    const state = isPaid
      ? ("paid" as const)
      : needsReconciliation
        ? ("reconcile" as const)
        : isOverdue
          ? ("overdue" as const)
          : isPartial
            ? ("partial" as const)
            : ("pending" as const);

    const studentName =
      invoice.student.user.name?.trim() ||
      invoice.student.user.email?.split("@")[0] ||
      "Apprenant";

    return {
      ...invoice,
      amount,
      confirmedAmount,
      remaining,
      isPaid,
      isOverdue,
      isPartial,
      state,
      studentName,
    };
  });

  const totalBilled = records.reduce((sum, item) => sum + item.amount, 0);
  const totalConfirmed = records.reduce((sum, item) => sum + item.confirmedAmount, 0);
  const totalRemaining = records.reduce((sum, item) => sum + item.remaining, 0);
  const totalOverdue = records.reduce(
    (sum, item) => sum + (item.isOverdue ? item.remaining : 0),
    0,
  );
  const childrenCount = new Set(records.map((item) => item.student.id)).size;

  const visibleRecords = records.filter((invoice) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "due" && invoice.remaining > 0) ||
      (filter === "overdue" && invoice.isOverdue) ||
      (filter === "partial" && invoice.isPartial) ||
      (filter === "paid" && invoice.isPaid);

    if (!matchesFilter) return false;
    if (!search) return true;

    return [
      invoice.id,
      invoice.studentName,
      invoice.student.class.name,
      invoice.student.class.level,
    ].some((text) => text.toLocaleLowerCase("fr").includes(search));
  });

  return (
    <div className="relative mx-auto max-w-7xl space-y-7 pb-16 text-slate-100 animate-in fade-in duration-500 print:text-black">
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-amber-500/10 blur-[100px] print:hidden" />
      <div className="pointer-events-none absolute left-0 top-80 h-64 w-64 rounded-full bg-sky-600/10 blur-[100px] print:hidden" />

      <header className="relative rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl sm:p-8 print:border-slate-300 print:bg-white print:shadow-none">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 print:text-black">
              <Sparkles size={14} aria-hidden="true" /> Suivi financier familial
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl print:text-black">
              Factures &amp; paiements
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-400 print:text-slate-700">
              Consultez les échéances, les paiements enregistrés et le solde estimé
              des frais de scolarité ou de formation de vos enfants.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-slate-950/70 p-4 print:bg-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Wallet size={24} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Reste à régler
              </p>
              <p className="text-xl font-extrabold text-amber-300 print:text-black">
                {formatMoney(totalRemaining)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section aria-label="Résumé financier" className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Montant facturé", value: totalBilled, icon: ReceiptText, accent: "text-sky-400" },
          { label: "Paiements confirmés", value: totalConfirmed, icon: CheckCircle2, accent: "text-emerald-400" },
          { label: "Reste à régler", value: totalRemaining, icon: Wallet, accent: "text-amber-400" },
          { label: "Montant en retard", value: totalOverdue, icon: Clock3, accent: "text-rose-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg print:border-slate-300 print:bg-white">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400 print:text-slate-700">
                <Icon size={16} className={stat.accent} aria-hidden="true" /> {stat.label}
              </div>
              <p className="break-words text-xl font-extrabold text-white print:text-black">
                {formatMoney(stat.value)}
              </p>
            </div>
          );
        })}
      </section>

      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl sm:p-6 print:border-slate-300 print:bg-white">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-white print:text-black">
                  <FileText size={19} className="text-sky-400" aria-hidden="true" /> Historique des factures
                </h2>
                <p className="mt-1 text-xs text-slate-400 print:text-slate-700">
                  {records.length} facture(s) · {childrenCount} apprenant(s) concerné(s)
                </p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300 print:bg-white print:text-black">
                {visibleRecords.length} résultat(s)
              </span>
            </div>

            <form method="get" action="/parent/invoices" className="mb-4 flex flex-col gap-2 sm:flex-row print:hidden" role="search">
              {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
              <label className="relative flex-1">
                <span className="sr-only">Rechercher une facture ou un apprenant</span>
                <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  maxLength={80}
                  placeholder="Nom, formation, référence de facture…"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pl-11 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500"
                />
              </label>
              <button type="submit" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200">
                Rechercher
              </button>
            </form>

            <nav aria-label="Filtrer les factures" className="mb-5 flex flex-wrap gap-2 print:hidden">
              {FILTERS.map((item) => (
                <Link
                  key={item.key}
                  href={createFilterHref(item.key, query)}
                  aria-current={filter === item.key ? "page" : undefined}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    filter === item.key
                      ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                      : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {visibleRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-5 py-14 text-center">
                <FileText size={30} className="mx-auto mb-3 text-slate-500" aria-hidden="true" />
                <h3 className="font-semibold text-white print:text-black">
                  {records.length === 0 ? "Aucune facture enregistrée" : "Aucune facture ne correspond aux critères"}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {records.length === 0
                    ? "Les factures de vos enfants apparaîtront ici dès leur enregistrement."
                    : "Modifiez la recherche ou les filtres pour afficher d’autres résultats."}
                </p>
                {records.length > 0 && (
                  <Link href="/parent/invoices" className="mt-4 inline-flex rounded-xl border border-slate-700 px-4 py-2 text-sm text-sky-300 print:hidden">
                    Effacer les filtres
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {visibleRecords.map((invoice) => {
                  const stateStyle = {
                    paid: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
                    reconcile: "border-sky-500/25 bg-sky-500/10 text-sky-300",
                    overdue: "border-rose-500/25 bg-rose-500/10 text-rose-300",
                    partial: "border-amber-500/25 bg-amber-500/10 text-amber-300",
                    pending: "border-slate-600 bg-slate-800 text-slate-300",
                  }[invoice.state];
                  const stateLabel = {
                    paid: "Marquée payée",
                    reconcile: "À rapprocher",
                    overdue: "En retard",
                    partial: "Partiellement réglée",
                    pending: "En attente",
                  }[invoice.state];

                  return (
                    <article key={invoice.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700 sm:p-5 print:break-inside-avoid print:border-slate-300 print:bg-white">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${stateStyle}`}>
                              {stateLabel}
                            </span>
                            <span className="text-[11px] text-slate-500">Réf. {invoice.id}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white sm:text-base print:text-black">
                            {invoice.studentName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 print:text-slate-700">
                            <span className="inline-flex items-center gap-1"><GraduationCap size={13} aria-hidden="true" /> {invoice.student.class.name}{invoice.student.class.educationType === "PROFESSIONAL" ? " · Formation" : ""}</span>
                            <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden="true" /> Échéance : <time dateTime={invoice.dueDate.toISOString()}>{dateFormatter.format(invoice.dueDate)}</time></span>
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xs text-slate-400">Montant facturé</p>
                          <p className="text-lg font-extrabold text-white print:text-black">{formatMoney(invoice.amount)}</p>
                          <p className={`mt-1 text-xs font-semibold ${invoice.remaining > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                            Reste : {formatMoney(invoice.remaining)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center print:border-slate-300">
                        <p className="text-xs text-slate-400 print:text-slate-700">
                          Paiements confirmés : <strong className="text-slate-200 print:text-black">{formatMoney(invoice.confirmedAmount)}</strong>
                        </p>
                        <Link href={`/parent/child/${encodeURIComponent(invoice.student.id)}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-sky-200 print:hidden">
                          Dossier de l'apprenant <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      </div>

                      {invoice.payments.length > 0 && (
                        <details className="group mt-3 rounded-xl border border-slate-800 bg-slate-900/50 print:hidden">
                          <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-slate-300 marker:text-slate-500">
                            Voir les {invoice.payments.length} opération(s) enregistrée(s)
                          </summary>
                          <ul className="space-y-2 border-t border-slate-800 px-4 py-3">
                            {invoice.payments.map((payment) => (
                              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                                <span>{payment.provider} · {dateFormatter.format(payment.createdAt)} · {payment.status}</span>
                                <span className="font-semibold text-slate-200">{formatMoney(payment.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {invoice.state === "reconcile" && (
                        <p className="mt-3 text-xs text-sky-300">
                          Le total des paiements confirmés couvre la facture, mais son statut n'est pas encore « Payée ». Contactez la comptabilité si nécessaire.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit space-y-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl print:break-inside-avoid print:border-slate-300 print:bg-white">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 print:border-slate-300">
            <ShieldCheck size={20} className="text-sky-400" aria-hidden="true" />
            <h2 className="text-base font-bold text-white print:text-black">Informations financières</h2>
          </div>
          <div className="space-y-5 text-sm leading-6 text-slate-400 print:text-slate-700">
            <div className="flex gap-3">
              <Clock3 size={18} className="mt-1 shrink-0 text-amber-400" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-slate-100 print:text-black">Échéances</h3>
                <p>Les dates limites affichées proviennent de chaque facture enregistrée.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Landmark size={18} className="mt-1 shrink-0 text-emerald-400" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-slate-100 print:text-black">Moyens de paiement</h3>
                <p>Contactez la comptabilité pour connaître les moyens de règlement effectivement proposés par votre établissement.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ReceiptText size={18} className="mt-1 shrink-0 text-sky-400" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-slate-100 print:text-black">Reçus officiels</h3>
                <p>Les opérations enregistrées sont consultables ici. Aucun reçu certifié n'est généré depuis cette page.</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-xs print:bg-white">
              <div className="mb-2 flex items-center gap-2 font-bold text-slate-200 print:text-black">
                <AlertCircle size={15} className="text-amber-400" aria-hidden="true" /> À savoir
              </div>
              <p>Le solde est calculé à partir du montant des factures et des paiements marqués « PAID ». Une facture déjà marquée « PAID » est considérée soldée même si le détail de ses opérations n'est pas disponible.</p>
            </div>
          </div>
          <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300 hover:text-sky-200 print:hidden">
            Retour au tableau de bord <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
