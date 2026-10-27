// src/app/parent/dashboard/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF", // À rendre configurable si l'établissement utilise une autre devise.
  maximumFractionDigits: 0,
});

const scoreFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

// Un seul accès aux données des élèves, toujours limité au parent connecté.
async function loadParentChildren(parentId: string) {
  return prisma.student.findMany({
    where: { parentId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      classId: true,
      user: { select: { name: true, email: true } },
      class: {
        select: { name: true, level: true, educationType: true },
      },
      // Les notes en attente et rejetées ne sont JAMAIS visibles côté parent.
      grades: {
        where: { status: "APPROVED" },
        orderBy: [{ evaluationDate: "desc" }, { id: "desc" }],
        take: 3,
        select: {
          id: true,
          subject: true,
          score: true,
          term: true,
        },
      },
      _count: {
        select: {
          absences: { where: { justified: false } },
          grades: { where: { status: "APPROVED" } },
        },
      },
      // Ne récupérer que les factures de CE parent et de CET enfant.
      invoices: {
        where: {
          parentId,
          status: { in: ["PENDING", "OVERDUE"] },
        },
        select: {
          id: true,
          status: true,
          amount: true,
          dueDate: true,
        },
      },
    },
  });
}

type ParentChild = Awaited<ReturnType<typeof loadParentChildren>>[number];

type UpcomingHomework = {
  id: string;
  title: string;
  type: "UPLOAD" | "ONLINE";
  dueDate: Date | null;
  assignment: { subject: string };
};

function studentName(child: ParentChild): string {
  const name = child.user.name?.trim();
  if (name) return name;
  const localEmail = child.user.email?.split("@")[0];
  return localEmail || "Apprenant";
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toLocaleUpperCase("fr-FR") || "A"
  );
}

function isInvoiceLate(
  invoice: ParentChild["invoices"][number],
  now: Date,
): boolean {
  return (
    invoice.status === "OVERDUE" ||
    (invoice.status === "PENDING" && invoice.dueDate < now)
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  accent = "text-sky-400",
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  detail: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/55 p-4 shadow-lg sm:p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Icon size={16} className={accent} aria-hidden="true" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function ChildDashboardCard({
  child,
  nextHomework,
  now,
}: {
  child: ParentChild;
  nextHomework: UpcomingHomework[];
  now: Date;
}) {
  const name = studentName(child);
  const professional = child.class.educationType === "PROFESSIONAL";
  const pendingInvoices = child.invoices.length;
  const overdueCount = child.invoices.filter((invoice) =>
    isInvoiceLate(invoice, now),
  ).length;
  const billedAmount = child.invoices.reduce(
    (sum, invoice) => sum + invoice.amount,
    0,
  );
  const unjustifiedAbsences = child._count.absences;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-xl backdrop-blur-xl sm:p-7">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-lg font-bold text-white"
          >
            {initials(name)}
          </div>
          <div className="min-w-0 space-y-2">
            <h2 className="break-words text-lg font-extrabold text-white sm:text-xl">
              {name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 font-semibold text-indigo-300">
                {professional ? "Formation" : "Classe"} : {child.class.name}
              </span>
              <span className="text-slate-400">{child.class.level}</span>
            </div>
          </div>
        </div>
        <Link
          href={`/parent/child/${encodeURIComponent(child.id)}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          Voir le dossier <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* NOTES APPROUVÉES UNIQUEMENT */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/65 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-300">
              <Award size={15} className="text-emerald-400" aria-hidden="true" />
              Dernières notes validées
            </h3>
            <span className="text-xs text-slate-500">
              {child._count.grades} au total
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Toutes périodes confondues</p>
          {child.grades.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Aucune note approuvée publiée pour le moment.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {child.grades.map((grade) => (
                <li
                  key={grade.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/70 bg-slate-900/70 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-200">
                      {grade.subject}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {grade.term || "Période non précisée"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300">
                    {scoreFormatter.format(grade.score)} / 20
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/parent/reports"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300"
          >
            Bulletins et résultats <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </section>

        {/* ABSENCES SANS DECLARATION TROMPEUSE */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/65 p-4">
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-300">
              <Clock3 size={15} className="text-amber-400" aria-hidden="true" />
              Assiduité
            </h3>
            <p
              className={`mt-5 text-4xl font-extrabold ${
                unjustifiedAbsences > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {unjustifiedAbsences}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Absence{unjustifiedAbsences > 1 ? "s" : ""} non justifiée
              {unjustifiedAbsences > 1 ? "s" : ""} enregistrée
              {unjustifiedAbsences > 1 ? "s" : ""}
            </p>
          </div>
          <p
            className={`mt-5 flex items-center gap-2 border-t border-slate-800 pt-3 text-xs ${
              unjustifiedAbsences > 0 ? "text-amber-300" : "text-slate-400"
            }`}
          >
            {unjustifiedAbsences > 0 ? (
              <AlertTriangle size={14} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={14} aria-hidden="true" />
            )}
            {unjustifiedAbsences > 0
              ? "Absence(s) à vérifier avec l'établissement"
              : "Aucune absence non justifiée enregistrée"}
          </p>
        </section>

        {/* FACTURES : montant de facture, pas dette nette présumée */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/65 p-4">
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-300">
              <Wallet size={15} className="text-sky-400" aria-hidden="true" />
              Facturation
            </h3>
            <p className="mt-5 text-2xl font-extrabold text-white">
              {pendingInvoices > 0 ? moneyFormatter.format(billedAmount) : "—"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {pendingInvoices > 0
                ? `${pendingInvoices} facture(s) non marquée(s) payée(s)`
                : "Aucune facture en attente enregistrée"}
            </p>
            {overdueCount > 0 && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <AlertTriangle size={13} aria-hidden="true" />
                {overdueCount} échéance(s) dépassée(s)
              </p>
            )}
            {pendingInvoices > 0 && (
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Montant des factures, hors déduction d'éventuels paiements partiels.
              </p>
            )}
          </div>
          <Link
            href="/parent/invoices"
            className="mt-5 inline-flex items-center gap-1.5 border-t border-slate-800 pt-3 text-xs font-semibold text-sky-400 hover:text-sky-300"
          >
            Consulter les factures <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </section>
      </div>

      {/* ECHEANCES PUBLIÉES POUR LA CLASSE : ne pas supposer non-soumission */}
      <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-300">
            <CalendarDays size={15} className="text-indigo-400" aria-hidden="true" />
            Prochaines échéances de {professional ? "la promotion" : "la classe"}
          </h3>
          <span className="text-[11px] text-slate-500">Devoirs publiés</span>
        </div>
        {nextHomework.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">
            Aucune échéance de devoir publiée à venir.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {nextHomework.map((homework) => (
              <li
                key={homework.id}
                className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3"
              >
                <BookOpen size={16} className="mt-0.5 shrink-0 text-indigo-400" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="break-words text-xs font-semibold text-slate-100">
                    {homework.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {homework.assignment.subject} · {homework.type === "ONLINE" ? "En ligne" : "À déposer"}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-indigo-300">
                    {homework.dueDate ? dateFormatter.format(homework.dueDate) : "Date non précisée"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-slate-500">
          Ces dates ne préjugent pas du statut de remise de l'apprenant.
        </p>
      </section>
    </article>
  );
}

export default async function ParentDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Le rôle de la session peut être obsolète : vérifier dans PostgreSQL.
  const parent = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true },
  });
  if (!parent || parent.role !== "PARENT") notFound();

  const now = new Date();
  const children = await loadParentChildren(parent.id);

  // Récupérer deux prochaines échéances par classe sans les attribuer à tort
  // à un devoir encore non remis.
  const classIds = Array.from(new Set(children.map((child) => child.classId)));
  const schedules = await Promise.all(
    classIds.map(async (classId) => {
      const homework = await prisma.homework.findMany({
        where: {
          status: "PUBLISHED",
          dueDate: { gte: now },
          assignment: { is: { classId } },
        },
        select: {
          id: true,
          title: true,
          type: true,
          dueDate: true,
          assignment: { select: { subject: true } },
        },
        orderBy: [{ dueDate: "asc" }, { id: "asc" }],
        take: 2,
      });
      return [classId, homework] as const;
    }),
  );
  const upcomingByClass = new Map(schedules);

  const unexcusedTotal = children.reduce(
    (sum, child) => sum + child._count.absences,
    0,
  );
  const validatedTotal = children.reduce(
    (sum, child) => sum + child._count.grades,
    0,
  );
  const unpaidInvoicesTotal = children.reduce(
    (sum, child) => sum + child.invoices.length,
    0,
  );

  return (
    <div className="relative mx-auto max-w-7xl space-y-7 pb-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-0 h-72 w-72 rounded-full bg-sky-600/10 blur-[100px]"
      />
      <div className="relative rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300">
              <Sparkles size={14} aria-hidden="true" /> Espace famille
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Tableau de bord parental
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
              {parent.name ? `Bienvenue, ${parent.name}. ` : ""}
              Suivez les résultats validés, l'assiduité, les échéances et la facturation des apprenants rattachés à votre compte.
            </p>
          </div>
          <Link
            href="/parent/child"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:border-slate-500"
          >
            <GraduationCap size={16} className="text-sky-400" aria-hidden="true" />
            Mes enfants
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-4 inline-flex items-start gap-2 text-xs text-slate-500">
          <ShieldCheck size={15} className="shrink-0 text-emerald-400" aria-hidden="true" />
          Seules les notes approuvées par l'administration sont accessibles ici.
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <SummaryCard
          icon={Users}
          label="Apprenants rattachés"
          value={children.length}
          detail="Enfants / personnes suivies"
        />
        <SummaryCard
          icon={Award}
          label="Notes validées"
          value={validatedTotal}
          detail="Toutes périodes confondues"
          accent="text-emerald-400"
        />
        <SummaryCard
          icon={Clock3}
          label="Absences non justifiées"
          value={unexcusedTotal}
          detail="Enregistrements cumulés"
          accent="text-amber-400"
        />
        <SummaryCard
          icon={Wallet}
          label="Factures en attente"
          value={unpaidInvoicesTotal}
          detail="Statuts PENDING / OVERDUE"
          accent="text-indigo-400"
        />
      </div>

      {children.length === 0 ? (
        <section className="relative mx-auto max-w-2xl space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
            <Users size={28} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-white">Aucun apprenant rattaché</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            Aucun profil élève n'est actuellement associé à votre compte parent. Contactez l'administration de l'établissement pour faire vérifier ce rattachement.
          </p>
        </section>
      ) : (
        <section aria-label="Suivi des apprenants" className="relative space-y-5">
          {children.map((child) => (
            <ChildDashboardCard
              key={child.id}
              child={child}
              now={now}
              nextHomework={upcomingByClass.get(child.classId) ?? []}
            />
          ))}
        </section>
      )}

      <p className="relative flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <FileText size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        Ce tableau de bord est informatif. Les bulletins certifiés, les reçus de paiement et les décisions pédagogiques officielles doivent être consultés dans leurs modules dédiés.
      </p>
    </div>
  );
}
