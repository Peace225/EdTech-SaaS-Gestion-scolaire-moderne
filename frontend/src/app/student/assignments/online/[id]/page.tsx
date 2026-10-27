// src/app/student/assignments/online/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { finalizeOnlineAttempt } from "@/lib/online-homework";
import { startOnlineHomeworkAction } from "../actions";
import OnlineExamClient from "./OnlineExamClient";
import { ArrowLeft, AlertCircle, CheckCircle2, ClipboardCheck, Clock3, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
};

export default async function OnlineAssignmentPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { notice } = await searchParams;
  if (!id || id.length > 150) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      studentProfile: { select: { id: true, classId: true, class: { select: { name: true, educationType: true } } } },
    },
  });
  if (account?.role !== "STUDENT" || !account.studentProfile) redirect("/student/assignments");
  const student = account.studentProfile;

  const homework = await prisma.homework.findFirst({
    where: {
      id,
      type: "ONLINE",
      status: "PUBLISHED",
      assignment: { is: { classId: student.classId } },
    },
    select: {
      id: true,
      title: true,
      instructions: true,
      dueDate: true,
      durationMinutes: true,
      assignment: { select: { subject: true, teacher: { select: { name: true } } } },
      onlineQuestions: {
        select: { id: true, position: true, prompt: true, optionA: true, optionB: true, optionC: true, optionD: true, points: true },
        orderBy: { position: "asc" },
      },
      onlineAttempts: {
        where: { studentId: student.id },
        take: 1,
        select: {
          id: true,
          startedAt: true,
          expiresAt: true,
          submittedAt: true,
          answers: { select: { questionId: true, choice: true } },
        },
      },
    },
  });
  if (!homework) notFound();

  let attempt = homework.onlineAttempts[0];
  const serverNow = Date.now();

  // Lorsqu'il revient après expiration, la copie est clôturée une seule fois.
  // La note reste interne : publication des notes officielles via l'administration.
  if (attempt && !attempt.submittedAt && attempt.expiresAt.getTime() <= serverNow) {
    await finalizeOnlineAttempt(attempt.id, student.id);
    attempt = {
      ...attempt,
      submittedAt: (await prisma.onlineHomeworkAttempt.findUnique({
        where: { id: attempt.id },
        select: { submittedAt: true },
      }))?.submittedAt ?? new Date(),
    };
  }

  const isProfessional = student.class.educationType === "PROFESSIONAL";
  const isClosed = Boolean(homework.dueDate && homework.dueDate.getTime() <= serverNow);
  const canStart = !isClosed && homework.durationMinutes !== null && homework.durationMinutes >= 1 && homework.durationMinutes <= 240 && homework.onlineQuestions.length > 0;

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-12 text-slate-100">
      <Link href="/student/assignments" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"><ArrowLeft size={16} /> Retour aux devoirs</Link>

      <header className="rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl sm:p-8">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300"><Sparkles size={14} /> {isProfessional ? "Évaluation de formation" : "Composition en ligne"}</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{homework.title}</h1>
        <p className="mt-2 text-sm text-slate-400">{homework.assignment.subject} · {isProfessional ? "Formateur" : "Enseignant"} : {homework.assignment.teacher.name || "Non renseigné"}</p>
        <div className="mt-5 whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-300">{homework.instructions}</div>
      </header>

      {attempt?.submittedAt ? (
        <div role="status" className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center sm:p-12">
          <CheckCircle2 className="mx-auto text-emerald-400" size={48} />
          <h2 className="mt-5 text-xl font-extrabold text-white">Composition enregistrée</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-300">Votre copie est clôturée et enregistrée. Les résultats de cette évaluation restent internes jusqu'à leur publication par l'établissement.</p>
          <Link href="/student/assignments" className="mt-6 inline-flex rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-[#06211f] hover:bg-teal-400">Retour à mes devoirs</Link>
        </div>
      ) : attempt ? (
        <OnlineExamClient
          key={attempt.id}
          attemptId={attempt.id}
          homeworkTitle={homework.title}
          questions={homework.onlineQuestions}
          initialAnswers={Object.fromEntries(attempt.answers.filter((a) => ["A", "B", "C", "D"].includes(a.choice)).map((a) => [a.questionId, a.choice as "A" | "B" | "C" | "D"]))}
          expiresAt={attempt.expiresAt.toISOString()}
          serverNow={serverNow}
          initialSeconds={Math.max(0, Math.ceil((attempt.expiresAt.getTime() - serverNow) / 1000))}
        />
      ) : (
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-[#111e30] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white">Avant de commencer</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><Clock3 className="mb-3 text-amber-400" size={23} /><p className="text-xs text-slate-400">Durée</p><p className="mt-1 font-bold text-white">{homework.durationMinutes ? `${homework.durationMinutes} minutes` : "À définir"}</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><ClipboardCheck className="mb-3 text-teal-400" size={23} /><p className="text-xs text-slate-400">Questions</p><p className="mt-1 font-bold text-white">{homework.onlineQuestions.length} question(s)</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><ShieldCheck className="mb-3 text-blue-400" size={23} /><p className="text-xs text-slate-400">Tentatives</p><p className="mt-1 font-bold text-white">1 seule tentative</p></div>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">L'horloge démarre sur le serveur lorsque vous cliquez sur « Commencer ». Recharger la page ne remet pas le temps à zéro. Les réponses sont sauvegardées individuellement. Une fois votre copie remise, elle ne peut plus être modifiée.</p>
          {(notice === "unavailable" || !canStart) && <p role="alert" className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200"><AlertCircle className="mt-0.5 shrink-0" size={17} /> {isClosed ? "La date limite est dépassée." : "Cette composition n'est pas encore prête : les questions ou la durée sont à compléter par le formateur."}</p>}
          {canStart && (
            <form action={startOnlineHomeworkAction}>
              <input type="hidden" name="homeworkId" value={homework.id} />
              <button type="submit" className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-extrabold text-[#06211f] transition hover:bg-teal-400"><Clock3 size={17} /> Commencer la composition</button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
