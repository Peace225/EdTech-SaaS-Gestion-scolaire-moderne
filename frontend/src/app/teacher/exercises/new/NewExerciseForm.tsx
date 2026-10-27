
"use client";

import { useActionState, useState } from "react";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LoaderCircle,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import {
  createExerciseAction,
  type ExerciseFormState,
} from "./actions";

// ========================================
// TYPES
// ========================================

type AssignmentOption = {
  id: string;
  subject: string;
  className: string;
  classLevel: string;
  teacherName: string;
};

type NewExerciseFormProps = {
  assignments: AssignmentOption[];
  isAdmin: boolean;
};

const initialState: ExerciseFormState = {
  error: null,
};

const inputClass =
  "w-full rounded-xl border border-slate-700 " +
  "bg-[#08111f] px-4 py-3 text-sm text-white " +
  "outline-none transition " +
  "placeholder:text-slate-500 " +
  "focus:border-teal-400 focus:ring-2 " +
  "focus:ring-teal-400/10";

// ========================================
// FORMULAIRE
// ========================================

export default function NewExerciseForm({
  assignments,
  isAdmin,
}: NewExerciseFormProps) {
  const [state, formAction, pending] =
    useActionState(
      createExerciseAction,
      initialState
    );

  const [selectedAssignmentId, setSelectedAssignmentId] =
    useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const selectedAssignment = assignments.find(
    (assignment) =>
      assignment.id === selectedAssignmentId
  );

  return (
    <form
      action={formAction}
      className="space-y-7"
    >
      {/* ERREUR DU SERVEUR */}
      {state.error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
        >
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-red-400"
          />

          <div>
            <p className="text-sm font-bold text-red-300">
              Enregistrement impossible
            </p>

            <p className="mt-1 text-xs leading-6 text-red-200/80">
              {state.error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================
          INFORMATIONS PRINCIPALES
      ===================================== */}
      <section className="rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-lg md:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
            <BookOpen size={22} />
          </div>

          <div>
            <h2 className="text-base font-bold text-white">
              Informations générales
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Identité et destination de l'exercice
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* TITRE */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="exercise-title"
                className="text-xs font-bold text-slate-300"
              >
                Titre de l'exercice *
              </label>

              <span className="text-[11px] text-slate-500">
                {title.length}/160
              </span>
            </div>

            <input
              id="exercise-title"
              type="text"
              name="title"
              required
              minLength={5}
              maxLength={160}
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Ex. : Série n°3 — Nombres complexes"
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-500">
              Choisissez un titre clair permettant
              aux élèves d'identifier l'activité.
            </p>
          </div>

          {/* AFFECTATION */}
          <div>
            <label
              htmlFor="exercise-assignment"
              className="mb-2 block text-xs font-bold text-slate-300"
            >
              Classe et matière *
            </label>

            <select
              id="exercise-assignment"
              name="assignmentId"
              required
              value={selectedAssignmentId}
              onChange={(event) =>
                setSelectedAssignmentId(
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
              Seules les affectations pédagogiques
              autorisées sont proposées.
            </p>
          </div>

          {/* APERÇU DE L'AFFECTATION */}
          {selectedAssignment && (
            <div className="grid gap-3 rounded-2xl border border-teal-500/20 bg-teal-500/[0.05] p-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <GraduationCap
                  size={19}
                  className="mt-0.5 shrink-0 text-teal-400"
                />

                <div>
                  <p className="text-[11px] text-slate-500">
                    Classe destinataire
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    {selectedAssignment.className}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {selectedAssignment.classLevel}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen
                  size={19}
                  className="mt-0.5 shrink-0 text-teal-400"
                />

                <div>
                  <p className="text-[11px] text-slate-500">
                    Matière
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    {selectedAssignment.subject}
                  </p>

                  {isAdmin && (
                    <p className="mt-1 text-xs text-slate-400">
                      {selectedAssignment.teacherName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DIFFICULTÉ */}
          <div>
            <label
              htmlFor="exercise-difficulty"
              className="mb-2 block text-xs font-bold text-slate-300"
            >
              Niveau de difficulté *
            </label>

            <select
              id="exercise-difficulty"
              name="difficulty"
              defaultValue="INTERMEDIATE"
              required
              className={inputClass}
            >
              <option value="STANDARD">
                Standard — Exercices fondamentaux
              </option>

              <option value="INTERMEDIATE">
                Intermédiaire — Mise en application
              </option>

              <option value="ADVANCED">
                Avancé — Approfondissement
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* =====================================
          CONSIGNES
      ===================================== */}
      <section className="rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-lg md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
            <ClipboardList size={22} />
          </div>

          <div>
            <h2 className="text-base font-bold text-white">
              Consignes et contenu
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Décrivez le travail demandé aux élèves
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="exercise-description"
              className="text-xs font-bold text-slate-300"
            >
              Description de l'exercice *
            </label>

            <span className="text-[11px] text-slate-500">
              {description.length}/10 000
            </span>
          </div>

          <textarea
            id="exercise-description"
            name="description"
            required
            minLength={20}
            maxLength={10000}
            rows={12}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder={`Objectif pédagogique :

Consignes générales :

Exercice 1 :
...

Exercice 2 :
...

Travail attendu :`}
            className={`${inputClass} min-h-72 resize-y leading-7`}
          />

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-800 bg-[#08111f] p-4">
            <Sparkles
              size={17}
              className="mt-0.5 shrink-0 text-teal-400"
            />

            <p className="text-xs leading-6 text-slate-400">
              Vous pouvez présenter plusieurs
              questions numérotées dans ce champ.
              Leur contenu sera enregistré sous
              forme de texte. Les quiz interactifs
              avec correction automatique feront
              l'objet d'un module spécifique.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================
          ENREGISTREMENT ET PUBLICATION
      ===================================== */}
      <section className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-[#102b35] to-[#111e30] p-6 md:p-8">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={22}
            className="mt-0.5 shrink-0 text-teal-400"
          />

          <div>
            <h2 className="text-base font-bold text-white">
              Enregistrement sécurisé
            </h2>

            <p className="mt-2 text-xs leading-6 text-slate-400">
              Le brouillon est conservé sans
              publication. Une publication
              enregistre l'exercice avec le statut
              PUBLISHED et sa date de publication.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="submit"
            name="intent"
            value="draft"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              : "Publier l'exercice"}
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-teal-500/10 pt-5 text-xs text-teal-300">
          <CheckCircle2 size={16} />
          Enregistrement dans PostgreSQL
        </div>
      </section>
    </form>
  );
}
