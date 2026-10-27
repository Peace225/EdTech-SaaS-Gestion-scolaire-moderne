
"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  BookOpen,
  Users,
  GraduationCap,
  Plus,
  Trash2,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export type AssignmentState = {
  status: "idle" | "success" | "error";
  message: string;
};

type AssignmentAction = (
  previousState: AssignmentState,
  formData: FormData
) => Promise<AssignmentState>;

type TeacherOption = {
  id: string;
  name: string | null;
  email: string | null;
  teacherProfile: {
    specialty: string | null;
    phone: string | null;
  } | null;
};

type ClassOption = {
  id: string;
  name: string;
  level: string;
};

type CreateProps = {
  teachers: TeacherOption[];
  classes: ClassOption[];
  subjects: readonly string[];
  action: AssignmentAction;
};

const initialState: AssignmentState = {
  status: "idle",
  message: "",
};

const selectClass = `
  h-12 w-full appearance-none rounded-xl
  border border-white/[0.09]
  bg-[#0b1727] pl-4 pr-10
  text-sm text-white
  outline-none transition-all duration-300
  focus:border-teal-400/50
  focus:ring-4 focus:ring-teal-400/10
  disabled:cursor-not-allowed disabled:opacity-50
`;

// ======================================
// FORMULAIRE DE CRÉATION
// ======================================

export function CreateAssignmentForm({
  teachers,
  classes,
  subjects,
  action,
}: CreateProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    action,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  const unavailable =
    teachers.length === 0 || classes.length === 0;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111e30]/90 p-6 shadow-xl sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-400/5 blur-[80px]" />

      <div className="relative z-10">
        <div className="mb-7 flex items-center gap-4 border-b border-white/[0.07] pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/10 text-teal-300">
            <Plus size={23} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Nouvelle affectation
            </h2>

            <p className="mt-1 text-xs leading-6 text-slate-400">
              Associez un enseignant à une classe et à une matière.
            </p>
          </div>
        </div>

        {state.status !== "idle" && (
          <div
            role={state.status === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              state.status === "success"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-red-400/20 bg-red-400/10 text-red-300"
            }`}
          >
            {state.status === "success" ? (
              <CheckCircle2 size={19} className="shrink-0" />
            ) : (
              <AlertCircle size={19} className="shrink-0" />
            )}

            <span>{state.message}</span>
          </div>
        )}

        {unavailable && (
          <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs leading-6 text-amber-300">
            {teachers.length === 0 && (
              <p>Aucun compte enseignant n'est disponible.</p>
            )}
            {classes.length === 0 && (
              <p>Aucune classe n'a encore été enregistrée.</p>
            )}
          </div>
        )}

        <form
          ref={formRef}
          action={formAction}
          className="grid grid-cols-1 items-end gap-5 md:grid-cols-2 xl:grid-cols-4"
        >
          {/* Enseignant */}
          <div className="min-w-0 space-y-2">
            <label
              htmlFor="assignment-teacher"
              className="flex items-center gap-2 text-xs font-semibold text-slate-300"
            >
              <Users size={15} className="text-teal-400" />
              Enseignant *
            </label>

            <div className="relative">
              <select
                id="assignment-teacher"
                name="teacherId"
                defaultValue=""
                required
                disabled={pending || teachers.length === 0}
                className={selectClass}
              >
                <option value="" disabled>
                  Choisir un enseignant...
                </option>

                {teachers.map((teacher) => {
                  const displayName =
                    teacher.name?.trim() ||
                    teacher.email ||
                    "Enseignant";

                  const specialty =
                    teacher.teacherProfile?.specialty;

                  const phone =
                    teacher.teacherProfile?.phone;

                  return (
                    <option
                      key={teacher.id}
                      value={teacher.id}
                    >
                      {displayName}
                      {specialty ? ` — ${specialty}` : ""}
                      {phone ? ` — ${phone}` : ""}
                    </option>
                  );
                })}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>

          {/* Classe */}
          <div className="min-w-0 space-y-2">
            <label
              htmlFor="assignment-class"
              className="flex items-center gap-2 text-xs font-semibold text-slate-300"
            >
              <GraduationCap
                size={15}
                className="text-cyan-400"
              />
              Classe *
            </label>

            <div className="relative">
              <select
                id="assignment-class"
                name="classId"
                defaultValue=""
                required
                disabled={pending || classes.length === 0}
                className={selectClass}
              >
                <option value="" disabled>
                  Choisir une classe...
                </option>

                {classes.map((schoolClass) => (
                  <option
                    key={schoolClass.id}
                    value={schoolClass.id}
                  >
                    {schoolClass.name} ({schoolClass.level})
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>

          {/* Matière */}
          <div className="min-w-0 space-y-2">
            <label
              htmlFor="assignment-subject"
              className="flex items-center gap-2 text-xs font-semibold text-slate-300"
            >
              <BookOpen size={15} className="text-violet-400" />
              Matière *
            </label>

            <div className="relative">
              <select
                id="assignment-subject"
                name="subject"
                defaultValue=""
                required
                disabled={pending}
                className={selectClass}
              >
                <option value="" disabled>
                  Choisir une matière...
                </option>

                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>

          {/* Création */}
          <button
            type="submit"
            disabled={pending || unavailable}
            className="group flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 text-sm font-bold text-[#092b35] shadow-lg shadow-teal-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Plus size={19} />
                Affecter
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

// ======================================
// SUPPRESSION D'UNE AFFECTATION
// ======================================

export function DeleteAssignmentButton({
  id,
  label,
  action,
}: {
  id: string;
  label: string;
  action: AssignmentAction;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialState
  );

  function confirmDeletion(
    event: React.FormEvent<HTMLFormElement>
  ) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer l'affectation suivante ?\n\n${label}`
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={confirmDeletion}
      className="inline-flex flex-col items-end gap-2"
    >
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        disabled={pending}
        title="Supprimer l'affectation"
        aria-label={`Supprimer l'affectation ${label}`}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.05] text-red-300 transition-all duration-300 hover:border-red-400/30 hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <Trash2 size={17} />
        )}
      </button>

      {state.status === "error" && (
        <span
          role="alert"
          className="max-w-[220px] text-right text-[11px] leading-5 text-red-300"
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
