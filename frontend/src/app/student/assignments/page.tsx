// src/app/student/assignments/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  Search,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Filters = {
  q?: string;
  subject?: string;
  type?: string;
  status?: string;
  notice?: string;
};

type HomeworkState = "todo" | "late" | "in_progress" | "submitted" | "graded";

function getState(
  type: "UPLOAD" | "ONLINE",
  submission: { status: "PENDING" | "GRADED" } | undefined,
  onlineAttempt: { submittedAt: Date | null } | undefined,
  dueDate: Date | null,
  now: Date
): HomeworkState {
  if (type === "ONLINE") {
    if (onlineAttempt?.submittedAt) return "submitted";
    if (onlineAttempt) return "in_progress";
  } else {
    if (submission?.status === "GRADED") return "graded";
    if (submission) return "submitted";
  }
  if (dueDate && dueDate.getTime() < now.getTime()) return "late";
  return "todo";
}

function prettyDate(value: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(value) + " UTC";
}

const statuses = {
  in_progress: { label: "En cours", color: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300" },
  todo: { label: "À rendre", color: "border-amber-400/20 bg-amber-400/10 text-amber-300" },
  late: { label: "Date dépassée", color: "border-red-400/20 bg-red-400/10 text-red-300" },
  submitted: { label: "Remis · En attente", color: "border-blue-400/20 bg-blue-400/10 text-blue-300" },
  graded: { label: "Corrigé", color: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" },
} as const;

export default async function StudentAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      name: true,
      studentProfile: {
        select: {
          id: true,
          classId: true,
          class: {
            select: { name: true, level: true, educationType: true },
          },
        },
      },
    },
  });

  if (!account || !["STUDENT", "ADMIN"].includes(account.role)) {
    redirect("/login");
  }

  const student = account.studentProfile;
  const isProfessional = student?.class.educationType === "PROFESSIONAL";
  const filters = await searchParams;
  const q = (filters.q ?? "").trim().slice(0, 100);
  const selectedType = filters.type === "UPLOAD" || filters.type === "ONLINE" ? filters.type : "all";
  const selectedStatus = ["todo", "late", "in_progress", "submitted", "graded"].includes(filters.status ?? "")
    ? filters.status!
    : "all";
  const subject = (filters.subject ?? "").trim().slice(0, 150);
  const now = new Date();

  // Un ADMIN sans dossier élève ne voit jamais les données d'un autre apprenant.
  const homeworks = student
    ? await prisma.homework.findMany({
        where: {
          status: "PUBLISHED",
          assignment: { is: { classId: student.classId } },
        },
        select: {
          id: true,
          title: true,
          instructions: true,
          type: true,
          durationMinutes: true,
          dueDate: true,
          publishedAt: true,
          createdAt: true,
          assignment: {
            select: {
              subject: true,
              teacher: { select: { name: true } },
            },
          },
          _count: { select: { onlineQuestions: true } },
          onlineAttempts: {
            where: { studentId: student.id },
            take: 1,
            select: { id: true, startedAt: true, expiresAt: true, submittedAt: true },
          },
          submissions: {
            where: { studentId: student.id },
            take: 1,
            select: {
              id: true,
              status: true,
              score: true,
              feedback: true,
              submittedAt: true,
              fileName: true,
            },
          },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      })
    : [];

  const items = homeworks.map((work) => ({
    ...work,
    submission: work.submissions[0],
    onlineAttempt: work.onlineAttempts[0],
    state: getState(work.type, work.submissions[0], work.onlineAttempts[0], work.dueDate, now),
  }));

  const subjects = [...new Set(items.map((item) => item.assignment.subject))].sort(
    (a, b) => a.localeCompare(b, "fr")
  );

  const visible = items.filter((work) => {
    if (subject && work.assignment.subject !== subject) return false;
    if (selectedType !== "all" && work.type !== selectedType) return false;
    if (selectedStatus !== "all" && work.state !== selectedStatus) return false;
    if (!q) return true;
    const content = `${work.title} ${work.instructions} ${work.assignment.subject} ${work.assignment.teacher.name ?? ""}`;
    return content.toLocaleLowerCase("fr").includes(q.toLocaleLowerCase("fr"));
  });

  const stats = {
    total: items.length,
    todo: items.filter((item) => item.state === "todo").length,
    inProgress: items.filter((item) => item.state === "in_progress").length,
    late: items.filter((item) => item.state === "late").length,
    submitted: items.filter((item) => item.state === "submitted").length,
    graded: items.filter((item) => item.state === "graded").length,
  };

  return (
    <section className="relative mx-auto max-w-7xl space-y-7 pb-12 text-slate-100">
      <div className="pointer-events-none absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-rose-500/10 blur-[110px]" />

      <header className="rounded-3xl border border-slate-800 bg-[#101d30]/90 p-5 shadow-xl shadow-black/10 sm:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-300">
              <Sparkles size={14} /> Espace pédagogique
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {isProfessional ? "Travaux & évaluations" : "Mes devoirs & compositions"}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
              {student
                ? `${isProfessional ? "Formation" : "Classe"} : ${student.class.name}${student.class.level ? ` · ${student.class.level}` : ""}. Retrouvez vos consignes, échéances et retours de correction.`
                : "Aucun dossier apprenant n'est associé à ce compte. Contactez l'administration."}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-5 py-4">
            <ClipboardList className="text-rose-300" size={25} />
            <div>
              <p className="text-xs text-slate-400">Travaux publiés</p>
              <p className="text-2xl font-extrabold tabular-nums text-white">{stats.total}</p>
            </div>
          </div>
        </div>
      </header>

      {filters.notice === "uploaded" && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 size={19} /> Votre travail a été déposé avec succès et attend sa correction.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {([
          { label: "À rendre", value: stats.todo, icon: Clock3, color: "text-amber-300" },
          { label: "En cours", value: stats.inProgress, icon: Clock3, color: "text-cyan-300" },
          { label: "En retard", value: stats.late, icon: AlertCircle, color: "text-red-300" },
          { label: "Remis, en attente", value: stats.submitted, icon: UploadCloud, color: "text-blue-300" },
          { label: "Corrigés", value: stats.graded, icon: CheckCircle2, color: "text-emerald-300" },
        ] as const).map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-[#111e30] p-5">
              <span className="rounded-xl bg-slate-950 p-3"><Icon size={21} className={stat.color} /></span>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold tabular-nums text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form method="GET" action="/student/assignments" className="grid gap-3 rounded-2xl border border-slate-800 bg-[#111e30] p-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Rechercher un devoir</span>
          <Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-500" />
          <input name="q" defaultValue={q} maxLength={100} placeholder="Rechercher un devoir…" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-10 py-2.5 text-sm text-white outline-none focus:border-teal-500" />
        </label>
        <label>
          <span className="sr-only">Matière ou module</span>
          <select name="subject" defaultValue={subjects.includes(subject) ? subject : ""} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-teal-500">
            <option value="">Toutes les matières</option>
            {subjects.map((name) => <option value={name} key={name}>{name}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Type de devoir</span>
          <select name="type" defaultValue={selectedType} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-teal-500">
            <option value="all">Tous les types</option>
            <option value="UPLOAD">Dépôt de document</option>
            <option value="ONLINE">En ligne</option>
          </select>
        </label>
        <label>
          <span className="sr-only">État du devoir</span>
          <select name="status" defaultValue={selectedStatus} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-teal-500">
            <option value="all">Tous les états</option>
            <option value="todo">À rendre</option>
            <option value="in_progress">En cours</option>
            <option value="late">Date dépassée</option>
            <option value="submitted">Remis</option>
            <option value="graded">Corrigé</option>
          </select>
        </label>
        <button type="submit" className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-[#06211f] transition hover:bg-teal-400">Filtrer</button>
      </form>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-[#111e30] p-10 text-center">
          <BookOpen className="mx-auto mb-4 text-slate-500" size={34} />
          <h2 className="font-bold text-white">Aucun devoir à afficher</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
            {items.length === 0
              ? "Les travaux publiés par vos formateurs apparaîtront ici lorsqu'ils seront affectés à votre classe ou promotion."
              : "Aucun résultat ne correspond aux filtres sélectionnés."}
          </p>
          {items.length > 0 && <Link href="/student/assignments" className="mt-4 inline-block text-sm font-semibold text-teal-300 hover:text-teal-200">Effacer les filtres</Link>}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">{visible.length} devoir{visible.length > 1 ? "s" : ""} affiché{visible.length > 1 ? "s" : ""}</p>
          {visible.map((work) => {
            const badge = statuses[work.state];
            const canUpload = work.type === "UPLOAD" && work.state === "todo";
            return (
              <article key={work.id} className="rounded-3xl border border-slate-800 bg-[#111e30] p-5 shadow-lg shadow-black/10 transition hover:border-slate-700 sm:p-7">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 font-semibold text-indigo-300">{work.assignment.subject}</span>
                      <span className={`rounded-full border px-3 py-1 font-semibold ${badge.color}`}>{badge.label}</span>
                      <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-slate-300">{work.type === "UPLOAD" ? "Dépôt de fichier" : "Évaluation en ligne"}</span>
                    </div>
                    <h2 className="text-lg font-bold leading-snug text-white sm:text-xl">{work.title}</h2>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5"><GraduationCap size={15} /> {isProfessional ? "Formateur" : "Enseignant"} : {work.assignment.teacher.name || "Non renseigné"}</span>
                      <span className="inline-flex items-center gap-1.5"><CalendarClock size={15} /> {work.dueDate ? `Échéance : ${prettyDate(work.dueDate)}` : "Sans date limite"}</span>
                      {work.type === "ONLINE" && work.durationMinutes && <span className="inline-flex items-center gap-1.5"><Clock3 size={15} /> Durée : {work.durationMinutes} min</span>}
                    </div>
                    <details className="group rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-200">Lire les consignes</summary>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-400">{work.instructions}</p>
                    </details>
                    {work.submission && (
                      <div className="space-y-2 rounded-xl border border-slate-700/80 bg-slate-950/60 p-4 text-sm">
                        <p className="flex items-center gap-2 font-semibold text-slate-200"><CheckCircle2 size={16} className="text-emerald-300" /> Déposé le {prettyDate(work.submission.submittedAt)}</p>
                        <p className="break-all text-xs text-slate-400">Fichier : {work.submission.fileName}</p>
                        {work.submission.status === "GRADED" && <p className="font-bold text-emerald-300">{work.submission.score === null ? "Corrigé sans note" : `Note : ${work.submission.score}/20`}</p>}
                        {work.submission.feedback && <p className="whitespace-pre-wrap break-words text-sm text-slate-300">Retour : {work.submission.feedback}</p>}
                      </div>
                    )}
                    {work.type === "ONLINE" && work.onlineAttempt && (
                      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs leading-relaxed text-cyan-200">
                        {work.onlineAttempt.submittedAt
                          ? `Copie clôturée le ${prettyDate(work.onlineAttempt.submittedAt)}.`
                          : work.onlineAttempt.expiresAt <= now
                            ? "Le temps est écoulé. Ouvrez l'évaluation pour finaliser la copie."
                            : `Session démarrée. Fin au plus tard le ${prettyDate(work.onlineAttempt.expiresAt)}.`}
                      </div>
                    )}
                    {work.type === "ONLINE" && !work.onlineAttempt && work.state === "todo" && (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-200">
                        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                        Le chronomètre démarre au premier lancement et continue après rechargement.
                      </div>
                    )}
                  </div>
                  <div className="flex w-full shrink-0 flex-col gap-2 lg:w-48">
                    {work.type === "ONLINE" ? (
                      work.onlineAttempt || (
                        work.state === "todo" && work._count.onlineQuestions > 0 &&
                        work.durationMinutes !== null && work.durationMinutes >= 1 && work.durationMinutes <= 240
                      ) ? (
                        <Link href={`/student/assignments/online/${work.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-bold text-[#06211f] transition hover:bg-teal-400">
                          <Clock3 size={17} /> {work.onlineAttempt?.submittedAt ? "Voir confirmation" : work.onlineAttempt ? "Reprendre / clôturer" : "Accéder au test"}
                        </Link>
                      ) : work.state === "late" ? (
                        <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-center text-xs font-semibold text-red-300">Évaluation clôturée</p>
                      ) : (
                        <p className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-center text-xs font-semibold text-slate-400">Questions ou durée non configurées</p>
                      )
                    ) : canUpload ? (
                      <Link href={`/student/assignments/upload/${work.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-bold text-[#06211f] transition hover:bg-teal-400">
                        <UploadCloud size={17} /> Déposer le travail <ArrowRight size={14} />
                      </Link>
                    ) : work.submission ? (
                      <Link href={`/student/assignments/submission/${work.submission.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700">
                        <Download size={16} /> Ma copie déposée
                      </Link>
                    ) : (
                      <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-center text-xs font-semibold text-red-300">Dépôt fermé après l'échéance</p>
                    )}
                    <Link href="/student/courses" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white">
                      <FileText size={15} /> Réviser mes cours
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
