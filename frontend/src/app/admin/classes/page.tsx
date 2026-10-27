
"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";

import {
  Plus,
  BookOpen,
  Layers,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type Props = {
  action: (
    previousState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

const inputClass = `
  h-13 w-full
  rounded-xl border border-white/[0.09]
  bg-[#0b1727] px-4
  text-sm text-white
  placeholder:text-slate-600
  outline-none
  transition-all duration-300
  focus:border-teal-400/50
  focus:ring-4 focus:ring-teal-400/10
  disabled:opacity-60
`;

export default function CreateClassForm({ action }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    action,
    initialState
  );

  // Vider le formulaire après une création réussie
  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111e30]/90 p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] sm:p-8">

      {/* Lumière décorative */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-400/5 blur-[80px]" />

      <div className="relative z-10">

        {/* En-tête du formulaire */}
        <div className="mb-7 flex items-center gap-4 border-b border-white/[0.07] pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-400/20 bg-teal-400/10 text-teal-300">
            <Plus size={23} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Nouvelle classe
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Ajoutez une classe à la structure académique.
            </p>
          </div>
        </div>

        {/* Retour de la Server Action */}
        {state.status !== "idle" && (
          <div
            role={state.status === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-4 text-sm ${
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

        {/* Formulaire */}
        <form
          ref={formRef}
          action={formAction}
          className="grid grid-cols-1 items-end gap-5 md:grid-cols-12"
        >

          {/* Nom */}
          <div className="space-y-2 md:col-span-5">

            <label
              htmlFor="class-name"
              className="flex items-center gap-2 text-xs font-semibold text-slate-300"
            >
              <BookOpen size={15} className="text-teal-400" />
              Nom de la classe
              <span className="text-teal-400">*</span>
            </label>

            <input
              id="class-name"
              name="name"
              type="text"
              required
              maxLength={100}
              disabled={pending}
              placeholder="Ex : 6ème A, Terminale D"
              className={inputClass}
            />
          </div>

          {/* Niveau */}
          <div className="space-y-2 md:col-span-4">

            <label
              htmlFor="class-level"
              className="flex items-center gap-2 text-xs font-semibold text-slate-300"
            >
              <Layers size={15} className="text-cyan-400" />
              Niveau académique
              <span className="text-teal-400">*</span>
            </label>

            <input
              id="class-level"
              name="level"
              type="text"
              required
              maxLength={100}
              disabled={pending}
              placeholder="Ex : 6ème, Terminale"
              className={inputClass}
            />
          </div>

          {/* Bouton */}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={pending}
              className="group flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 text-sm font-bold text-[#092b35] shadow-lg shadow-teal-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus size={19} />
                  Créer la classe
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-5 text-xs leading-6 text-slate-500">
          Le nom et le niveau sont obligatoires.
          Vérifiez qu'une classe équivalente n'est pas
          déjà enregistrée.
        </p>

      </div>
    </section>
  );
}
