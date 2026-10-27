// src/app/student/assignments/online/[id]/OnlineExamClient.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, Send, ShieldCheck, WifiOff } from "lucide-react";
import { saveOnlineAnswerAction, submitOnlineHomeworkAction } from "../actions";

type Option = "A" | "B" | "C" | "D";
type Question = {
  id: string;
  position: number;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  points: number;
};

type Props = {
  attemptId: string;
  homeworkTitle: string;
  questions: Question[];
  initialAnswers: Record<string, Option>;
  expiresAt: string;
  serverNow: number;
  initialSeconds: number;
};

const OPTION_KEYS: Option[] = ["A", "B", "C", "D"];

function formatTimer(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export default function OnlineExamClient({
  attemptId,
  homeworkTitle,
  questions,
  initialAnswers,
  expiresAt,
  serverNow,
  initialSeconds,
}: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, Option>>(initialAnswers);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const saveError = useRef<string | null>(null);
  const pendingSaves = useRef(0);

  const answeredCount = questions.filter((q) => Boolean(answers[q.id])).length;
  const answeredPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  // IMPORTANT : la référence absolue vient de PostgreSQL.
  // Le décalage d'horloge côté client n'est utilisé que pour l'affichage.
  useEffect(() => {
    const skew = serverNow - Date.now();
    const deadline = Date.parse(expiresAt);
    const update = () => {
      const remaining = Math.max(0, Math.ceil((deadline - (Date.now() + skew)) / 1000));
      setTimeLeft(remaining);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt, serverNow]);

  const submit = useCallback(async (automatic = false) => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setError(null);

    try {
      // Attendre la sauvegarde des clics déjà envoyés avant la clôture.
      await saveQueue.current;
      if (saveError.current && !automatic) {
        setError("Certaines réponses ne sont pas enregistrées. Sélectionnez-les de nouveau ou réessayez avant de remettre.");
        submitLock.current = false;
        setSubmitting(false);
        return;
      }
      const result = await submitOnlineHomeworkAction(attemptId);
      if (!result.ok) throw new Error(result.message);
      router.refresh();
      // L'écran de confirmation est rendu par le serveur après rafraîchissement.
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connexion impossible. Réessayez.");
      submitLock.current = false;
      setSubmitting(false);
    }
  }, [attemptId, router]);

  useEffect(() => {
    if (timeLeft === 0) void submit(true);
  }, [timeLeft, submit]);

  const selectAnswer = (questionId: string, option: Option) => {
    if (submitting || timeLeft <= 0) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    setSaving("saving");
    setError(null);
    saveError.current = null;
    pendingSaves.current += 1;

    // Les mutations sont séquentielles : le dernier choix d'une question gagne.
    saveQueue.current = saveQueue.current.then(async () => {
      try {
        const result = await saveOnlineAnswerAction(attemptId, questionId, option);
        if (!result.ok) {
          saveError.current = result.message;
          setSaving("error");
          setError(result.message);
        }
      } catch {
        saveError.current = "La réponse n'a pas été sauvegardée. Vérifiez votre connexion.";
        setError(saveError.current);
      } finally {
        pendingSaves.current -= 1;
        if (saveError.current) setSaving("error");
        else if (pendingSaves.current === 0) setSaving("saved");
      }
    });
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="sticky top-2 z-30 rounded-2xl border border-slate-700 bg-[#0c192a]/95 p-4 shadow-2xl backdrop-blur-xl sm:top-4 sm:p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">Composition en cours</p>
            <h2 className="truncate text-base font-bold text-white sm:text-lg">{homeworkTitle}</h2>
            <div aria-live="polite" className="flex items-center gap-2 text-xs text-slate-400">
              {saving === "saving" ? <><Loader2 className="animate-spin" size={14} /> Sauvegarde des réponses…</>
                : saving === "saved" ? <><CheckCircle2 className="text-teal-400" size={14} /> Réponses sauvegardées</>
                : saving === "error" ? <><WifiOff className="text-red-400" size={14} /> Problème de sauvegarde</>
                : <><ShieldCheck className="text-blue-400" size={14} /> Sauvegarde à chaque réponse</>}
            </div>
          </div>
          <div role="timer" aria-label="Temps restant" className={`flex shrink-0 items-center gap-3 rounded-xl border px-4 py-2 ${timeLeft <= 300 ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>
            <Clock3 size={19} />
            <div>
              <p className="text-[10px] uppercase tracking-widest">Temps restant</p>
              <p className="font-mono text-2xl font-bold tabular-nums">{formatTimer(timeLeft)}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-between text-xs text-slate-400">
          <span>{answeredCount} / {questions.length} question(s) répondue(s)</span>
          <span>{answeredPercent} %</span>
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={answeredPercent} aria-label="Progression des réponses" className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-400 transition-all" style={{ width: `${answeredPercent}%` }} />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100/90">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
        <p>Le temps continue même si vous rechargez ou quittez la page. Les réponses sont enregistrées sur le serveur après chaque choix. Si la connexion est interrompue, les réponses non sauvegardées peuvent être perdues.</p>
      </div>

      {questions.map((question, index) => {
        const options: { key: Option; value: string }[] = [
          { key: "A", value: question.optionA },
          { key: "B", value: question.optionB },
          { key: "C", value: question.optionC },
          { key: "D", value: question.optionD },
        ];
        return (
          <fieldset key={question.id} disabled={submitting || timeLeft <= 0} className="min-w-0 space-y-5 rounded-3xl border border-slate-800 bg-[#111e30] p-5 shadow-lg sm:p-7">
            <legend className="sr-only">Question {index + 1}</legend>
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">Question {index + 1} / {questions.length}</span>
              <span className="text-xs text-slate-500">{question.points} point{question.points > 1 ? "s" : ""}</span>
            </div>
            <h3 className="whitespace-pre-wrap break-words text-base font-bold leading-relaxed text-white">{question.prompt}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((option) => {
                const checked = answers[question.id] === option.key;
                return (
                  <label key={option.key} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition ${checked ? "border-teal-400/60 bg-teal-500/10 text-white" : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500"}`}>
                    <input type="radio" name={`q-${question.id}`} checked={checked} onChange={() => selectAnswer(question.id, option.key)} className="mt-1 accent-teal-400" />
                    <span className="shrink-0 rounded-md border border-slate-700 px-2 py-0.5 text-xs font-bold text-teal-300">{option.key}</span>
                    <span className="min-w-0 whitespace-pre-wrap break-words leading-relaxed">{option.value}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {error && (
        <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}
      {timeLeft === 0 && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">Temps écoulé. La clôture est demandée au serveur ; si votre connexion a échoué, réessayez.</p>
      )}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-[#111e30] p-5 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-400">{answeredCount < questions.length ? `${questions.length - answeredCount} question(s) sans réponse. Vous pouvez remettre une copie incomplète.` : "Toutes les questions ont une réponse."}</p>
        <button type="button" disabled={submitting} onClick={() => {
          if (timeLeft === 0 || window.confirm("Remettre définitivement cette composition ? Vous ne pourrez plus modifier vos réponses.")) {
            void submit(false);
          }
        }} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-extrabold text-[#06211f] transition hover:bg-teal-400 disabled:cursor-wait disabled:opacity-60">
          {submitting ? <><Loader2 size={17} className="animate-spin" /> Envoi au serveur…</> : <><Send size={17} /> {timeLeft === 0 ? "Finaliser la copie" : "Remettre définitivement"}</>}
        </button>
      </div>
    </div>
  );
}
