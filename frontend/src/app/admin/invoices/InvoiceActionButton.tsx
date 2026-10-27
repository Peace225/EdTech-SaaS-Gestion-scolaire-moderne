
"use client";

import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  Trash2,
  LoaderCircle,
} from "lucide-react";

type InvoiceActionButtonProps = {
  type: "paid" | "delete";
};

export function InvoiceActionButton({
  type,
}: InvoiceActionButtonProps) {
  const { pending } = useFormStatus();

  const isPaidAction = type === "paid";

  function handleClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    const message = isPaidAction
      ? "Confirmez-vous avoir effectivement reçu le règlement intégral de cette facture ? Un paiement manuel sera enregistré."
      : "Voulez-vous vraiment supprimer cette facture ? Cette action est irréversible.";

    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={handleClick}
      title={
        isPaidAction
          ? "Enregistrer le paiement manuel"
          : "Supprimer la facture"
      }
      aria-label={
        isPaidAction
          ? "Enregistrer le paiement manuel"
          : "Supprimer la facture"
      }
      className={
        isPaidAction
          ? "inline-flex items-center justify-center rounded-xl p-2.5 text-slate-400 transition hover:bg-teal-500/10 hover:text-teal-400 disabled:opacity-50"
          : "inline-flex items-center justify-center rounded-xl p-2.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
      }
    >
      {pending ? (
        <LoaderCircle
          size={18}
          className="animate-spin"
        />
      ) : isPaidAction ? (
        <CheckCircle2 size={18} />
      ) : (
        <Trash2 size={18} />
      )}
    </button>
  );
}
