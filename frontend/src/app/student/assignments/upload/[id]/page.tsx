// src/app/student/assignments/upload/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  FileCheck2,
  LockKeyhole,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react";
import { submitHomeworkFileAction } from "../../actions";
import { HomeworkUploadForm } from "../HomeworkUploadForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
};

const errorMessages: Record<string, string> = {
  unavailable: "Ce devoir n'est plus disponible pour votre classe ou promotion.",
  late: "Le délai de remise est dépassé. Le dépôt a été fermé.",
  submitted: "Une copie a déjà été envoyée pour ce devoir. Un second dépôt n'est pas autorisé.",
  missing: "Sélectionnez un document avant de l'envoyer.",
  size: "Le fichier doit être non vide et ne pas dépasser 4 Mo.",
  type: "Fichier non accepté. Utilisez un PDF, DOCX, JPG ou PNG valide.",
  invalid: "Le nom du document est invalide ou trop long.",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "UTC",
});

export default async function UploadAssignmentPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Le rôle de la session ne suffit pas : contrôler le rôle et l'affectation en base.
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      studentProfile: {
        select: { id: true, classId: true },
      },
    },
  });

  if (account?.role !== "STUDENT") redirect("/student/assignments");
  if (!account.studentProfile) redirect("/student/dashboard");

  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!id) notFound();
  const student = account.studentProfile;

  // Un apprenant ne peut accéder qu'aux devoirs publiés de sa propre classe.
  const homework = await prisma.homework.findFirst({
    where: {
      id,
      type: "UPLOAD",
      status: "PUBLISHED",
      assignment: { is: { classId: student.classId } },
    },
    select: {
      id: true,
      title: true,
      instructions: true,
      dueDate: true,
      createdAt: true,
      assignment: {
        select: {
          subject: true,
          class: { select: { name: true, level: true, educationType: true } },
          teacher: { select: { name: true } },
        },
      },
      submissions: {
        where: { studentId: student.id },
        take: 1,
        select: {
          id: true,
          fileName: true,
          status: true,
          score: true,
          feedback: true,
          submittedAt: true,
          gradedAt: true,
        },
      },
    },
  });

  if (!homework) notFound();

  const submission = homework.submissions[0] ?? null;
  const isOverdue = homework.dueDate !== null && homework.dueDate.getTime() < Date.now();
  const isProfessional = homework.assignment.class.educationType === "PROFESSIONAL";
  const roleTitle = isProfessional ? "Formateur" : "Enseignant";
  const classLabel = isProfessional ? "Formation / promotion" : "Classe";
  const rawError = Array.isArray(query.error) ? query.error[0] : query.error;
  const errorText = rawError ? errorMessages[rawError] : undefined;
  const dueLabel = homework.dueDate ? dateFormatter.format(homework.dueDate) : "Sans échéance fixée";
  const pendingLabel = isOverdue ? "Dépôt clôturé" : "Dépôt ouvert";

  return (
    <div className="relative mx-auto max-w-4xl space-y-6 pb-14 text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-0 -z-10 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

      <Link href="/student/assignments" className="inline-flex items-center gap-2 text-sm font-medium text-teal-300 transition hover:text-teal-200">
        <ArrowLeft size={17} /> Retour aux devoirs
      </Link>

      <header className="rounded-3xl border border-slate-800 bg-[#111e30]/95 p-6 shadow-xl sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-bold text-teal-300">
          <Sparkles size={14} /> {isProfessional ? "Remise de travail — Espace Apprenant" : "Dépôt de devoir — Espace Élève"}
        </div>
        <h1 className="mt-4 break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{homework.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {homework.assignment.subject} · {classLabel} : <span className="font-semibold text-slate-200">{homework.assignment.class.name}</span>
          {homework.assignment.class.level ? ` — ${homework.assignment.class.level}` : ""}
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-300">
            <UserRound size={14} className="text-blue-400" /> {roleTitle} : {homework.assignment.teacher.name ?? "Non renseigné"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-300">
            <CalendarClock size={14} className="text-amber-400" /> Échéance : {dueLabel}{homework.dueDate ? " UTC" : ""}
          </span>
          <span className={`inline-flex items-center rounded-xl border px-3 py-2 font-semibold ${submission ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : isOverdue ? "border-rose-500/20 bg-rose-500/10 text-rose-300" : "border-teal-500/20 bg-teal-500/10 text-teal-300"}`}>
            {submission ? "Copie remise" : pendingLabel}
          </span>
        </div>
      </header>

      <section aria-labelledby="assignment-instructions" className="rounded-3xl border border-slate-800 bg-[#111e30]/90 p-6 sm:p-8">
        <h2 id="assignment-instructions" className="flex items-center gap-2 text-base font-bold text-white">
          <ClipboardList size={19} className="text-cyan-400" /> Consignes du devoir
        </h2>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{homework.instructions}</p>
      </section>

      {errorText && !submission && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          <ShieldAlert size={19} className="mt-0.5 shrink-0" /> {errorText}
        </div>
      )}

      {submission ? (
        <section aria-labelledby="submission-title" className="space-y-5 rounded-3xl border border-emerald-500/20 bg-[#111e30] p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={24} className="mt-0.5 shrink-0 text-emerald-400" />
            <div>
              <h2 id="submission-title" className="text-lg font-bold text-white">Travail déjà transmis</h2>
              <p className="mt-1 text-sm text-slate-400">Votre copie a été enregistrée le {dateFormatter.format(submission.submittedAt)} UTC.</p>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950/60 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <FileCheck2 size={20} className="shrink-0 text-teal-300" />
              <span className="min-w-0 break-all text-sm text-slate-200">{submission.fileName}</span>
            </div>
            <Link href={`/student/assignments/submission/${encodeURIComponent(submission.id)}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-bold text-[#06211f] transition hover:bg-teal-400">
              <Download size={16} /> Télécharger ma copie
            </Link>
          </div>
          {submission.status === "GRADED" ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="font-semibold text-emerald-300">Travail corrigé{submission.score !== null ? ` · ${submission.score}/20` : ""}</p>
              {submission.feedback && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{submission.feedback}</p>}
              {submission.gradedAt && <p className="mt-2 text-xs text-slate-400">Corrigé le {dateFormatter.format(submission.gradedAt)} UTC.</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Votre copie est en attente de correction par {isProfessional ? "le formateur" : "l'enseignant"}.</p>
          )}
        </section>
      ) : isOverdue ? (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm leading-6 text-rose-200">
          <ShieldAlert size={20} className="mt-0.5 shrink-0" />
          <p>La date limite est dépassée. Le dépôt est fermé. Contactez {isProfessional ? "votre formateur" : "votre enseignant"} si vous avez besoin d'une dérogation.</p>
        </div>
      ) : (
        <section aria-labelledby="upload-title" className="rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl sm:p-8">
          <h2 id="upload-title" className="text-lg font-bold text-white">Déposer mon travail</h2>
          <p className="mt-2 text-sm text-slate-400">Vous pouvez déposer une seule copie pour ce devoir. Vérifiez votre document avant l'envoi.</p>
          <div className="mt-6">
            <HomeworkUploadForm homeworkId={homework.id} action={submitHomeworkFileAction} />
          </div>
        </section>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-xs leading-6 text-slate-400">
        <LockKeyhole size={18} className="mt-1 shrink-0 text-teal-400" />
        <p>Votre copie n'est pas publique. Les fichiers sont accessibles depuis un lien privé dont l'autorisation est vérifiée côté serveur. Ne déposez pas de données médicales ou personnelles sensibles inutiles.</p>
      </div>
    </div>
  );
}
