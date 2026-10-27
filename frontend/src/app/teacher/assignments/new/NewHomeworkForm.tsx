
"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileUp,
  GraduationCap,
  LoaderCircle,
  MonitorPlay,
  Save,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  createHomeworkAction,
  type HomeworkFormState,
} from "./actions";

// ========================================
// TYPES
// ========================================

type AssignmentOption = {
  id: string;
  subject: string;
  className: string;
  classLevel: string;
  studentsCount: number;
  teacherName: string;
};

type Props = {
  assignments: AssignmentOption[];
  isAdmin: boolean;
};

type HomeworkType = "UPLOAD" | "ONLINE";

const initialState: HomeworkFormState = {
  error: null,
};

const inputClass =
  "w-full rounded-xl border border-slate-700 " +
  "bg-[#08111f] px-4 py-3 text-sm text-white " +
  "outline-none transition placeholder:text-slate-500 " +
  "focus:border-teal-400 focus:ring-2 " +
  "focus:ring-teal-400/10";

// ========================================
// DATE LOCALE VERS UTC
// ========================================

function toUtcISOString(
  localValue: string
): string {
  if (!localValue) return "";

  const date = new Date(localValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
}

// ========================================
// FORMULAIRE
// ========================================

export default function NewHomeworkForm({
  assignments,
  isAdmin,
}: Props) {
  const [state, formAction, pending] =
    useActionState(
      createHomeworkAction,
      initialState
    );

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] =
    useState("");

  const [assignmentId, setAssignmentId] =
    useState("");

  const [type, setType] =
    useState<HomeworkType>("UPLOAD");

  const [duration, setDuration] =
    useState("30");

  const [dueDateLocal, setDueDateLocal] =
    useState("");

  const selectedAssignment = assignments.find(
    (item) => item.id === assignmentId
  );

  const isOnline = type === "ONLINE";

  const dueDateIso =
    toUtcISOString(dueDateLocal);

  return (
    <form
      action={formAction}
      className="space-y-7"
    >
      {/* DATE UTC POUR POSTGRESQL */}
      <input
        type="hidden"
        name="dueDateIso"
        value={dueDateIso}
      />

      {/* =====================================
          MESSAGE D'ERREUR
      ===================================== */}

      {state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5"
        >
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-red-400"
          />

          <div>
            <h2 className="text-sm font-bold text-red-300">
              Enregistrement impossible
            </h2>

            <p className="mt-2 text-xs leading-6 text-red-200/80">
              {state.error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================
          1. INFORMATIONS PRINCIPALES
      ===================================== */}

      <section className="rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-lg md:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-xl bg-teal-500/10 p-3 text-teal-400">
            <ClipboardList size={21} />
          </div>

          <div>
            <h2 className="text-base font-bold text-white">
              Informations générales
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Identité du devoir et classe destinataire
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* TITRE */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="homework-title"
                className="text-xs font-bold text-slate-300"
              >
                Titre du devoir *
              </label>

              <span className="text-[11px] text-slate-500">
                {title.length}/180
              </span>
            </div>

            <input
              id="homework-title"
              name="title"
              type="text"
              required
              minLength={5}
              maxLength={180}
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Ex. : Devoir n°2 — Nombres complexes"
              className={inputClass}
            />
          </div>

          {/* CLASSE + MATIÈRE */}
          <div>
            <label
              htmlFor="homework-assignment"
              className="mb-2 block text-xs font-bold text-slate-300"
            >
              Classe et matière *
            </label>

            <select
              id="homework-assignment"
              name="assignmentId"
              required
              value={assignmentId}
              onChange={(event) =>
                setAssignmentId(
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="" disabled>
                Sélectionner une affectation...
              </option>

              {assignments.map((assignment) => (
                <option
                  key={assignment.id}
                  value={assignment.id}
                >
                  {assignment.className} (
                  {assignment.classLevel}) —{" "}
                  {assignment.subject}
                  {isAdmin
                    ? ` — ${assignment.teacherName}`
                    : ""}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-slate-500">
              Les classes et matières proviennent
              des affectations enregistrées dans
              PostgreSQL.
            </p>
          </div>

          {/* APERÇU */}
          {selectedAssignment && (
            <div className="grid gap-4 rounded-2xl border border-teal-500/20 bg-teal-500/[0.05] p-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <GraduationCap
                  size={20}
                  className="mt-0.5 shrink-0 text-teal-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Classe sélectionnée
                  </p>

                  <p className="mt-1 font-bold text-white">
                    {selectedAssignment.className}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {selectedAssignment.classLevel}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users
                  size={20}
                  className="mt-0.5 shrink-0 text-teal-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Effectif
                  </p>

                  <p className="mt-1 font-bold text-white">
                    {selectedAssignment.studentsCount} élèves
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {selectedAssignment.subject}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <div className="text-xs text-slate-400 sm:col-span-2">
                  Enseignant :{" "}
                  <strong className="text-white">
                    {selectedAssignment.teacherName}
                  </strong>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =====================================
          2. TYPE DE DEVOIR
      ===================================== */}

      <section className="rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-lg md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-sky-500/10 p-3 text-sky-400">
            <BookOpen size={21} />
          </div>

          <div>
            <h2 className="text-base font-bold text-white">
              Type de devoir
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Choisissez le mode de réalisation
            </p>
          </div>
        </div>

        <input
          type="hidden"
          name="type"
          value={type}
        />

        <div
          role="group"
          aria-label="Type de devoir"
          className="grid gap-4 md:grid-cols-2"
        >
          {/* DÉPÔT */}
          <button
            type="button"
            aria-pressed={type === "UPLOAD"}
            onClick={() => setType("UPLOAD")}
            className={[
              "flex items-start gap-4 rounded-2xl border p-5 text-left transition",
              type === "UPLOAD"
                ? "border-teal-500/50 bg-teal-500/10"
                : "border-slate-700 bg-[#08111f] hover:border-slate-600",
            ].join(" ")}
          >
            <FileUp
              size={24}
              className="shrink-0 text-teal-400"
            />

            <div>
              <p className="text-sm font-bold text-white">
                Devoir maison
              </p>

              <p className="mt-2 text-xs leading-6 text-slate-400">
                Travail avec consignes et
                échéance. Le dépôt des fichiers
                par les élèves sera connecté
                au module des copies.
              </p>
            </div>
          </button>

          {/* EN LIGNE */}
          <button
            type="button"
            aria-pressed={type === "ONLINE"}
            onClick={() => setType("ONLINE")}
            className={[
              "flex items-start gap-4 rounded-2xl border p-5 text-left transition",
              type === "ONLINE"
                ? "border-violet-500/50 bg-violet-500/10"
                : "border-slate-700 bg-[#08111f] hover:border-slate-600",
            ].join(" ")}
          >
            <MonitorPlay
              size={24}
              className="shrink-0 text-violet-400"
            />

            <div>
              <p className="text-sm font-bold text-white">
                Composition en ligne
              </p>

              <p className="mt-2 text-xs leading-6 text-slate-400">
                Préparation d'une interrogation
                chronométrée. Publication
                disponible après intégration
                des questions interactives.
              </p>
            </div>
          </button>
        </div>

        {/* HORAIRES */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {isOnline && (
            <div>
              <label
                htmlFor="homework-duration"
                className="mb-2 block text-xs font-bold text-slate-300"
              >
                Durée de la composition
              </label>

              <div className="relative">
                <Clock3
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <select
                  id="homework-duration"
                  name="durationMinutes"
                  value={duration}
                  onChange={(event) =>
                    setDuration(event.target.value)
                  }
                  className={`${inputClass} pl-10`}
                >
                  <option value="20">20 minutes</option>
                  <option value="25">25 minutes</option>
                  <option value="30">30 minutes</option>
                </select>
              </div>
            </div>
          )}

          <div
            className={
              isOnline ? "" : "md:col-span-2"
            }
          >
            <label
              htmlFor="homework-due-date"
              className="mb-2 block text-xs font-bold text-slate-300"
            >
              Date et heure limites{" "}
              {!isOnline && (
                <span className="text-slate-500">
                  (requises pour publier)
                </span>
              )}
            </label>

            <div className="relative">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="homework-due-date"
                type="datetime-local"
                value={dueDateLocal}
                onChange={(event) =>
                  setDueDateLocal(
                    event.target.value
                  )
                }
                className={`${inputClass} pl-10`}
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Heure interprétée dans le fuseau
              horaire de votre navigateur.
              La date sera sauvegardée en UTC.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================
          3. CONSIGNES
      ===================================== */}

      <section className="rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-lg md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-teal-500/10 p-3 text-teal-400">
            <ClipboardList size={21} />
          </div>

          <div>
            <h2 className="text-base font-bold text-white">
              Consignes pédagogiques
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Décrivez les objectifs et le travail attendu
            </p>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="homework-instructions"
            className="text-xs font-bold text-slate-300"
          >
            Description et consignes *
          </label>

          <span className="text-[11px] text-slate-500">
            {instructions.length}/15 000
          </span>
        </div>

        <textarea
          id="homework-instructions"
          name="instructions"
          required
          minLength={20}
          maxLength={15000}
          rows={11}
          value={instructions}
          onChange={(event) =>
            setInstructions(event.target.value)
          }
          placeholder={`Objectif pédagogique :

Chapitre concerné :

Consignes générales :

Exercice 1 :
...

Exercice 2 :
...

Travail à remettre :`}
          className={`${inputClass} min-h-64 resize-y leading-7`}
        />

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-800 bg-[#08111f] p-4">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-teal-400"
          />

          <p className="text-xs leading-6 text-slate-400">
            Les consignes sont enregistrées
            en texte dans PostgreSQL.
            L'envoi de pièces jointes et
            le dépôt des copies seront ajoutés
            dans un module dédié.
          </p>
        </div>
      </section>

      {/* =====================================
          4. ENREGISTREMENT
      ===================================== */}

      <section className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-[#102b35] to-[#111e30] p-6 md:p-8">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={22}
            className="mt-0.5 shrink-0 text-teal-400"
          />

          <div>
            <h2 className="text-base font-bold text-white">
              Enregistrement et publication
            </h2>

            <p className="mt-2 text-xs leading-6 text-slate-400">
              Un brouillon est enregistré
              sans être publié. Un devoir
              à déposer peut être publié
              uniquement avec une échéance future.
            </p>
          </div>
        </div>

        {isOnline && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-amber-400"
            />

            <p className="text-xs leading-6 text-amber-200">
              La composition en ligne peut
              être enregistrée comme brouillon.
              Sa publication sera disponible
              après création du moteur de
              questions et du chronomètre.
            </p>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/teacher/assignments"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Annuler
          </Link>

          <button
            type="submit"
            name="intent"
            value="draft"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            Enregistrer le brouillon
          </button>

          {!isOnline && (
            <button
              type="submit"
              name="intent"
              value="publish"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Send size={17} />
              )}

              {pending
                ? "Enregistrement..."
                : "Publier le devoir"}
            </button>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-teal-500/10 pt-5 text-xs text-teal-300">
          <CheckCircle2 size={16} />
          Validation des droits et enregistrement PostgreSQL
        </div>
      </section>
    </form>
  );
}
