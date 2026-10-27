
"use client";

import {
  useActionState,
  useEffect,
  useId,
  useState,
} from "react";

import {
  Link2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export type LinkParentState = {
  status: "idle" | "success" | "error";
  message: string;
};

type ParentOption = {
  id: string;
  name: string | null;
  email: string | null;
};

type ParentLinkFormProps = {
  studentId: string;
  currentParentId: string | null;
  parents: ParentOption[];
  action: (
    previousState: LinkParentState,
    formData: FormData
  ) => Promise<LinkParentState>;
};

const initialState: LinkParentState = {
  status: "idle",
  message: "",
};

export default function ParentLinkForm({
  studentId,
  currentParentId,
  parents,
  action,
}: ParentLinkFormProps) {
  const selectId = useId();

  const [selectedParentId, setSelectedParentId] = useState(
    currentParentId ?? ""
  );

  const [state, formAction, pending] = useActionState(
    action,
    initialState
  );

  // Synchroniser le choix après une mise à jour
  useEffect(() => {
    setSelectedParentId(currentParentId ?? "");
  }, [currentParentId]);

  const noParents = parents.length === 0;

  const unchanged =
    selectedParentId === (currentParentId ?? "");

  const disabled =
    pending ||
    noParents ||
    !selectedParentId ||
    unchanged;

  return (
    <form
      action={formAction}
      className="w-full min-w-0 space-y-3"
    >
      {/* Identifiant du dossier */}
      <input
        type="hidden"
        name="studentId"
        value={studentId}
      />

      <label htmlFor={selectId} className="sr-only">
        Choisir un parent pour cet élève
      </label>

      <div className="flex flex-col gap-2 xl:flex-row">
        <select
          id={selectId}
          name="parentId"
          value={selectedParentId}
          onChange={(event) =>
            setSelectedParentId(event.target.value)
          }
          disabled={pending || noParents}
          required
          className="
            h-11 min-w-0 w-full
            rounded-xl border border-white/10
            bg-[#0b1727] px-3
            text-xs text-slate-200
            outline-none transition-all duration-300
            focus:border-teal-400/50
            focus:ring-4 focus:ring-teal-400/10
            disabled:cursor-not-allowed
            disabled:opacity-50
            xl:flex-1
          "
        >
          <option value="" disabled>
            {noParents
              ? "Aucun parent disponible"
              : "Sélectionner un parent..."}
          </option>

          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name?.trim() ||
                parent.email ||
                "Parent sans nom"}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={disabled}
          className="
            group inline-flex h-11
            shrink-0 cursor-pointer
            items-center justify-center gap-2
            rounded-xl bg-teal-400 px-4
            text-xs font-bold text-[#092b35]
            transition-all duration-300
            hover:bg-teal-300
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-white
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {pending ? (
            <>
              <Loader2
                size={16}
                className="animate-spin"
              />
              En cours...
            </>
          ) : (
            <>
              <Link2 size={16} />
              {currentParentId ? "Modifier" : "Associer"}
            </>
          )}
        </button>
      </div>

      {/* Message de confirmation ou d'erreur */}
      {state.status !== "idle" && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5 ${
            state.status === "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-red-400/20 bg-red-400/10 text-red-300"
          }`}
        >
          {state.status === "success" ? (
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0"
            />
          ) : (
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0"
            />
          )}

          <span>{state.message}</span>
        </div>
      )}
    </form>
  );
}
