// src/app/parent/child/[id]/page.tsx
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  MapPin,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ year?: string | string[] }>;
};

type GradeRecord = {
  id: string;
  subject: string;
  score: number;
  coef: number;
  term: string;
};

type SubjectSummary = {
  name: string;
  scores: number[];
  average: number;
  evaluationCount: number;
};

type TermSummary = {
  term: "T1" | "T2" | "T3";
  label: string;
  average: number | null;
  subjects: SubjectSummary[];
};

const TERM_LABELS = [
  { term: "T1", label: "Trimestre 1" },
  { term: "T2", label: "Trimestre 2" },
  { term: "T3", label: "Trimestre 3" },
] as const;

const amountFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});
const gradeFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatGrade(value: number | null): string {
  return value === null ? "—" : gradeFormatter.format(value);
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "É"
  );
}

function summarizeTerm(grades: GradeRecord[], term: TermSummary["term"], label: string): TermSummary {
  const bySubject = new Map<
    string,
    { weightedSum: number; weight: number; scores: number[] }
  >();
  let weightedSum = 0;
  let totalWeight = 0;

  for (const grade of grades) {
    if (grade.term !== term) continue;
    // Les valeurs non conformes ne doivent pas fausser les moyennes.
    if (
      !Number.isFinite(grade.score) ||
      grade.score < 0 ||
      grade.score > 20 ||
      !Number.isFinite(grade.coef) ||
      grade.coef <= 0
    ) {
      continue;
    }

    const current = bySubject.get(grade.subject) ?? {
      weightedSum: 0,
      weight: 0,
      scores: [],
    };
    current.weightedSum += grade.score * grade.coef;
    current.weight += grade.coef;
    current.scores.push(grade.score);
    bySubject.set(grade.subject, current);
    weightedSum += grade.score * grade.coef;
    totalWeight += grade.coef;
  }

  const subjects = Array.from(bySubject.entries())
    .map(([name, data]) => ({
      name,
      scores: data.scores,
      average: data.weightedSum / data.weight,
      evaluationCount: data.scores.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return {
    term,
    label,
    subjects,
    average: totalWeight > 0 ? weightedSum / totalWeight : null,
  };
}

function SummaryCard({
  label,
  value,
  note,
  icon,
  color = "text-sky-400",
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
  color?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 print:break-inside-avoid print:border-slate-300 print:bg-white">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 print:text-slate-600">
        <span className={color}>{icon}</span>
        {label}
      </div>
      <p className="mt-3 break-words text-2xl font-extrabold tracking-tight text-white print:text-black">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400 print:text-slate-600">{note}</p>
    </div>
  );
}

export default async function ParentChildDetailPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parent = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  // Ni l'administrateur ni l'enseignant ne peuvent contourner le lien familial.
  if (parent?.role !== "PARENT") notFound();

  const { id } = await params;
  if (!id || id.length > 150) notFound();

  const now = new Date();
  // Convention provisoire : année académique du 1er septembre au 31 août.
  const currentAcademicYear =
    now.getUTCMonth() >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const query = (await searchParams)?.year;
  const queryYear = typeof query === "string" && /^\d{4}$/.test(query)
    ? Number(query)
    : null;
  const year =
    queryYear !== null &&
    queryYear >= currentAcademicYear - 5 &&
    queryYear <= currentAcademicYear
      ? queryYear
      : currentAcademicYear;
  const periodStart = new Date(Date.UTC(year, 8, 1));
  const periodEnd = new Date(Date.UTC(year + 1, 8, 1));

  // Requête limitée à un enfant appartenant au parent authentifié.
  const child = await prisma.student.findFirst({
    where: { id, parentId: parent.id },
    select: {
      id: true,
      classId: true,
      user: { select: { name: true, email: true } },
      class: {
        select: { name: true, level: true, educationType: true },
      },
      grades: {
        where: {
          status: "APPROVED",
          evaluationDate: { gte: periodStart, lt: periodEnd },
        },
        select: { id: true, subject: true, score: true, coef: true, term: true },
        orderBy: [{ subject: "asc" }, { evaluationDate: "asc" }],
      },
      absences: {
        where: { date: { gte: periodStart, lt: periodEnd } },
        select: { id: true, date: true, justified: true, reason: true },
        orderBy: { date: "desc" },
      },
      invoices: {
        where: { parentId: parent.id },
        select: {
          id: true,
          amount: true,
          status: true,
          dueDate: true,
          payments: { select: { amount: true, status: true } },
        },
        orderBy: { dueDate: "asc" },
      },
    },
  });
  if (!child) notFound();

  const [upcomingHomeworks, weeklySchedule] = await Promise.all([
    prisma.homework.findMany({
      where: {
        status: "PUBLISHED",
        assignment: { is: { classId: child.classId } },
        dueDate: { gt: now },
      },
      select: {
        id: true,
        title: true,
        type: true,
        dueDate: true,
        assignment: { select: { subject: true } },
        submissions: {
          where: { studentId: child.id },
          select: { id: true },
        },
        onlineAttempts: {
          where: { studentId: child.id },
          select: { id: true, submittedAt: true, expiresAt: true },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.schedule.findMany({
      where: { classId: child.classId },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        subject: true,
        room: true,
        teacher: { select: { name: true } },
      },
      take: 100,
    }),
  ]);

  const terms = TERM_LABELS.map(({ term, label }) =>
    summarizeTerm(child.grades, term, label)
  );
  const termAverages = terms.map((term) => term.average);
  const annualAverage = termAverages.every((v): v is number => v !== null)
    ? termAverages.reduce((sum, v) => sum + v, 0) / 3
    : null;

  const unexcused = child.absences.filter((a) => !a.justified);
  const name = child.user.name?.trim() || child.user.email?.split("@")[0] || "Apprenant";
  const isProfessional = child.class.educationType === "PROFESSIONAL";
  const familyRole = isProfessional ? "Apprenant" : "Élève";

  const balances = child.invoices.map((invoice) => {
    const confirmedPayments = invoice.payments
      .filter((payment) => payment.status === "PAID")
      .reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = invoice.status === "PAID"
      ? 0
      : Math.max(0, invoice.amount - confirmedPayments);
    return { ...invoice, remaining, overdue: remaining > 0 && invoice.dueDate < now };
  });
  const unpaidInvoices = balances.filter((invoice) => invoice.remaining > 0);
  const totalDue = unpaidInvoices.reduce((sum, invoice) => sum + invoice.remaining, 0);
  const totalOverdue = unpaidInvoices
    .filter((invoice) => invoice.overdue)
    .reduce((sum, invoice) => sum + invoice.remaining, 0);

  const daysOrder = new Map([
    ["lundi", 0], ["monday", 0], ["1", 0],
    ["mardi", 1], ["tuesday", 1], ["2", 1],
    ["mercredi", 2], ["wednesday", 2], ["3", 2],
    ["jeudi", 3], ["thursday", 3], ["4", 3],
    ["vendredi", 4], ["friday", 4], ["5", 4],
    ["samedi", 5], ["saturday", 5], ["6", 5],
    ["dimanche", 6], ["sunday", 6], ["0", 6], ["7", 6],
  ]);
  const schedules = [...weeklySchedule].sort((a, b) => {
    const ai = daysOrder.get(a.dayOfWeek.trim().toLowerCase()) ?? 7;
    const bi = daysOrder.get(b.dayOfWeek.trim().toLowerCase()) ?? 7;
    return ai - bi || a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="relative mx-auto max-w-7xl space-y-7 pb-16 text-slate-100 print:space-y-4 print:bg-white print:text-black">
      <div className="pointer-events-none absolute right-10 top-0 h-64 w-64 rounded-full bg-sky-600/10 blur-3xl print:hidden" />

      <header className="relative rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl sm:p-8 print:border-slate-300 print:bg-white print:shadow-none">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/parent/child" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white">
            <ArrowLeft size={16} /> Retour à mes enfants
          </Link>
          <PrintButton />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-xl font-bold text-white print:border print:border-slate-300 print:bg-white print:text-black">
            {getInitials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 print:text-slate-600">
              <ShieldCheck size={14} /> Dossier familial privé
            </p>
            <h1 className="break-words text-2xl font-extrabold text-white sm:text-3xl print:text-black">{name}</h1>
            <p className="mt-1 text-sm text-slate-400 print:text-slate-600">
              {child.class.name} · {child.class.level} · {isProfessional ? "Formation professionnelle" : "Parcours scolaire"}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4 text-sm text-slate-400 print:border-slate-300 print:text-slate-600">
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> Période : septembre {year} – août {year + 1}</span>
          <span className="inline-flex items-center gap-2"><Users size={15} /> {familyRole} rattaché à votre compte</span>
        </div>
        <nav aria-label="Choisir la période académique" className="mt-5 flex flex-wrap gap-2 print:hidden">
          {Array.from({ length: 4 }, (_, index) => currentAcademicYear - index).map((item) => (
            <Link
              key={item}
              href={`/parent/child/${encodeURIComponent(child.id)}?year=${item}`}
              aria-current={year === item ? "page" : undefined}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${year === item ? "border-sky-500/40 bg-sky-500/15 text-sky-300" : "border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white"}`}
            >
              {item}–{item + 1}
            </Link>
          ))}
        </nav>
      </header>

      <section aria-label="Indicateurs du dossier" className="relative grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard icon={<Award size={16} />} label="Moyenne annuelle" value={annualAverage === null ? "—" : `${formatGrade(annualAverage)} /20`} note={annualAverage === null ? "En attente des 3 trimestres" : "Estimation sur notes approuvées"} color="text-emerald-400" />
        <SummaryCard icon={<BookOpen size={16} />} label="Notes validées" value={String(child.grades.length)} note="Sur la période sélectionnée" color="text-indigo-400" />
        <SummaryCard icon={<Clock3 size={16} />} label="Absences injustifiées" value={String(unexcused.length)} note={`${child.absences.length} absence(s) enregistrée(s)`} color="text-amber-400" />
        <SummaryCard icon={<Wallet size={16} />} label="Solde indicatif" value={`${amountFormatter.format(totalDue)} FCFA`} note={totalOverdue > 0 ? `${amountFormatter.format(totalOverdue)} FCFA en retard` : unpaidInvoices.length ? "Factures non soldées" : "Aucune facture non soldée enregistrée"} color="text-sky-400" />
      </section>

      <section className="relative space-y-4 rounded-3xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl sm:p-7 print:break-inside-avoid print:border-slate-300 print:bg-white print:shadow-none" aria-labelledby="grades-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="grades-title" className="flex items-center gap-2 text-lg font-bold text-white print:text-black"><GraduationCap className="text-emerald-400" size={20} /> Résultats approuvés</h2>
          <Link href="/parent/reports" className="text-xs font-semibold text-sky-400 hover:text-sky-300 print:hidden">Bulletins et avis</Link>
        </div>
        <p className="text-xs leading-relaxed text-slate-400 print:text-slate-600">
          Moyennes indicatives calculées sur les évaluations approuvées et pondérées par leur coefficient.
          Sans coefficient officiel par matière ni validation du bulletin, elles ne constituent pas un bulletin certifié.
        </p>
        <div className="grid gap-4 xl:grid-cols-3">
          {terms.map((term) => (
            <div key={term.term} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 print:break-inside-avoid print:border-slate-300 print:bg-white">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-4 print:border-slate-300">
                <h3 className="font-bold text-white print:text-black">{term.label}</h3>
                <span className="text-lg font-extrabold text-emerald-400 print:text-black">
                  {formatGrade(term.average)}{term.average === null ? "" : " /20"}
                </span>
              </div>
              {term.subjects.length === 0 ? (
                <p className="p-5 text-sm text-slate-400 print:text-slate-600">Aucune note approuvée pour ce trimestre.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/70 text-slate-400 print:bg-white print:text-slate-600">
                      <tr><th scope="col" className="px-4 py-3">Matière</th><th scope="col" className="px-2 py-3">Notes</th><th scope="col" className="px-4 py-3 text-right">Moy.</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200 print:divide-slate-300 print:text-black">
                      {term.subjects.map((subject) => (
                        <tr key={subject.name}>
                          <th scope="row" className="max-w-[130px] break-words px-4 py-3 font-semibold">{subject.name}</th>
                          <td className="px-2 py-3 text-slate-400 print:text-slate-600">{subject.scores.map(formatGrade).join(" · ")}</td>
                          <td className="px-4 py-3 text-right font-bold">{formatGrade(subject.average)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="relative grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-5 sm:p-7 print:break-inside-avoid print:border-slate-300 print:bg-white" aria-labelledby="absences-title">
          <h2 id="absences-title" className="mb-4 flex items-center gap-2 text-lg font-bold text-white print:text-black"><Clock3 size={20} className="text-amber-400" /> Assiduité</h2>
          {child.absences.length === 0 ? (
            <p className="text-sm text-slate-400 print:text-slate-600">Aucune absence enregistrée sur cette période.</p>
          ) : (
            <ul className="space-y-2">
              {child.absences.slice(0, 6).map((absence) => (
                <li key={absence.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm print:border-slate-300 print:bg-white">
                  <div>
                    <p className="font-semibold text-slate-100 print:text-black">{dateFormatter.format(absence.date)}</p>
                    {absence.reason && <p className="mt-1 break-words text-xs text-slate-400 print:text-slate-600">{absence.reason}</p>}
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${absence.justified ? "text-emerald-400" : "text-amber-400"}`}>
                    {absence.justified ? "Justifiée" : "Non justifiée"}
                  </span>
                </li>
              ))}
              {child.absences.length > 6 && <li className="text-xs text-slate-400">{child.absences.length - 6} autre(s) absence(s) enregistrée(s).</li>}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-5 sm:p-7 print:break-inside-avoid print:border-slate-300 print:bg-white" aria-labelledby="homework-title">
          <h2 id="homework-title" className="mb-4 flex items-center gap-2 text-lg font-bold text-white print:text-black"><BookOpen size={20} className="text-indigo-400" /> Devoirs à venir</h2>
          {upcomingHomeworks.length === 0 ? (
            <p className="text-sm text-slate-400 print:text-slate-600">Aucun devoir publié avec une échéance future.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingHomeworks.map((homework) => (
                <li key={homework.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 print:border-slate-300 print:bg-white">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 break-words text-sm font-semibold text-white print:text-black">{homework.title}</p>
                    <span className="text-xs font-semibold text-sky-300 print:text-black">
                      {homework.type === "UPLOAD"
                        ? homework.submissions.length > 0 ? "Déposé" : "À déposer"
                        : homework.onlineAttempts.some((attempt) => attempt.submittedAt !== null)
                          ? "Soumis"
                          : homework.onlineAttempts.some((attempt) => attempt.expiresAt <= now)
                            ? "Temps écoulé"
                            : homework.onlineAttempts.length > 0 ? "En cours" : "À commencer"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 print:text-slate-600">{homework.assignment.subject} · {homework.type === "ONLINE" ? "Composition en ligne" : "Travail à déposer"}</p>
                  {homework.dueDate && <p className="mt-1 text-xs text-indigo-300 print:text-black">Échéance : {dateFormatter.format(homework.dueDate)}</p>}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-slate-500 print:text-slate-600">Le statut reflète les copies et tentatives enregistrées, sans dévoiler le contenu des réponses.</p>
        </section>
      </div>

      <div className="relative grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-5 sm:p-7 print:break-inside-avoid print:border-slate-300 print:bg-white" aria-labelledby="schedule-title">
          <h2 id="schedule-title" className="mb-4 flex items-center gap-2 text-lg font-bold text-white print:text-black"><CalendarDays size={20} className="text-sky-400" /> Planning hebdomadaire</h2>
          {schedules.length === 0 ? (
            <p className="text-sm text-slate-400 print:text-slate-600">Aucune séance programmée pour cette classe ou promotion.</p>
          ) : (
            <ul className="space-y-2">
              {schedules.map((schedule) => (
                <li key={schedule.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 print:border-slate-300 print:bg-white">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white print:text-black">{schedule.subject}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400 print:text-slate-600"><UserRound size={12} /> {schedule.teacher.name || "Formateur non renseigné"}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400 print:text-slate-600"><MapPin size={12} /> {schedule.room || "Salle non précisée"}</p>
                  </div>
                  <p className="text-right text-xs font-semibold text-sky-300 print:text-black">{schedule.dayOfWeek}<br />{schedule.startTime} – {schedule.endTime}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-slate-500 print:text-slate-600">Planning récurrent : les annulations ou changements ponctuels ne sont pas encore modélisés.</p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-5 sm:p-7 print:break-inside-avoid print:border-slate-300 print:bg-white" aria-labelledby="invoices-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="invoices-title" className="flex items-center gap-2 text-lg font-bold text-white print:text-black"><Wallet size={20} className="text-amber-400" /> Factures et frais</h2>
            <Link href="/parent/invoices" className="text-xs font-semibold text-sky-400 hover:text-sky-300 print:hidden">Toutes les factures</Link>
          </div>
          {child.invoices.length === 0 ? (
            <p className="text-sm text-slate-400 print:text-slate-600">Aucune facture enregistrée pour cet apprenant et ce parent.</p>
          ) : unpaidInvoices.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 size={18} /> Aucun solde restant sur les factures enregistrées.</p>
          ) : (
            <ul className="space-y-2">
              {unpaidInvoices.map((invoice) => (
                <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 print:border-slate-300 print:bg-white">
                  <div>
                    <p className="text-sm font-bold text-white print:text-black">{amountFormatter.format(invoice.remaining)} FCFA</p>
                    <p className="mt-1 text-xs text-slate-400 print:text-slate-600">Échéance : {dateFormatter.format(invoice.dueDate)}</p>
                  </div>
                  <span className={`text-xs font-semibold ${invoice.overdue ? "text-rose-400" : "text-amber-400"}`}>{invoice.overdue ? "En retard" : "À régler"}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-slate-500 print:text-slate-600">Solde indicatif : seuls les paiements portant le statut PAID sont déduits. Les paiements en cours de traitement ne le sont pas.</p>
        </section>
      </div>

      <footer className="relative flex items-start gap-2 rounded-2xl border border-sky-500/15 bg-sky-500/5 p-4 text-xs text-slate-400 print:border-slate-300 print:bg-white print:text-slate-600">
        <FileText size={16} className="mt-0.5 shrink-0 text-sky-400" />
        <p>Ce récapitulatif est un document de consultation privée. Il ne constitue ni un bulletin signé par l'établissement ni un reçu de paiement. Pour les résultats officiels, référez-vous aux documents validés par l'administration.</p>
      </footer>
    </div>
  );
}
