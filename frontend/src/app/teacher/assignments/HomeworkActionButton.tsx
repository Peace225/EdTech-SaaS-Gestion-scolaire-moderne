
"use client";

import { useFormStatus } from "react-dom";
import {
  Archive,
  RotateCcw,
  Send,
  LoaderCircle,
} from "lucide-react";

type ActionKind = "publish" | "archive" | "restore";

type Props = {
  kind: ActionKind;
};

const config = {
  publish: {
    label: "Publier",
    confirmation:
      "Confirmer la publication de ce devoir ?",
    icon: Send,
    style:
      "bg-teal-500 text-slate-950 hover:bg-teal-400",
  },
  archive: {
    label: "Archiver",
    confirmation:
      "Archiver ce devoir ? Il ne sera pas supprimé de la base.",
    icon: Archive,
    style:
      "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700",
  },
  restore: {
    label: "Restaurer",
    confirmation:
      "Restaurer ce devoir comme brouillon ?",
    icon: RotateCcw,
    style:
      "border border-teal-500/20 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20",
  },
};

export function HomeworkActionButton({
  kind,
}: Props) {
  const { pending } = useFormStatus();

  const item = config[kind];
  const Icon = item.icon;

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(item.confirmation)) {
          event.preventDefault();
        }
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${item.style}`}
    >
      {pending ? (
        <LoaderCircle
          size={15}
          className="animate-spin"
        />
      ) : (
        <Icon size={15} />
      )}

      {pending ? "Traitement..." : item.label}
    </button>
  );
}
