
"use client";

import { useActionState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  reviewGrade,
  type ReviewState,
} from "./actions";

const initialState: ReviewState = {
  status: "idle",
  message: "",
};

export default function GradeReviewForm({
  gradeId,
}: {
  gradeId: string;
}) {
  const [state, formAction, pending] = useActionState(
    reviewGrade,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="gradeId" value={gradeId} />

      <div className="space-y-2">
        <label
          htmlFor={`comment-${gradeId}`}
          className="text-xs font-semibold text-slate-300"
        >
          Observations / Motif du rejet
        </label>

        <textarea
          id={`comment-${gradeId}`}
          name="reviewComment"
          rows={2}
          maxLength={1000}
          disabled={pending}
          placeholder="Précisez les corrections nécessaires si vous rejetez..."
          className="w-full resize-y rounded-xl border border-white/10 bg-[#0b1727] p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400/50 focus:ring-4 focus:ring-teal-400/10"
        />
      </div>

      {state.status !== "idle" && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={`flex items-center gap-2 rounded-xl border p-3 text-xs ${
            state.status === "error"
              ? "border-red-400/20 bg-red-400/10 text-red-300"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          }`}
        >
          <AlertCircle size={16} />
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="submit"
          name="decision"
          value="APPROVED"
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 py-3 text-xs font-bold text-emerald-950 transition-colors hover:bg-emerald-300 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <CheckCircle2 size={17} />
          )}
          Approuver
        </button>

        <button
          type="submit"
          name="decision"
          value="REJECTED"
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-3 text-xs font-bold text-red-300 transition-colors hover:bg-red-400/20 disabled:opacity-50"
        >
          <XCircle size={17} />
          Rejeter
        </button>
      </div>
    </form>
  );
}
