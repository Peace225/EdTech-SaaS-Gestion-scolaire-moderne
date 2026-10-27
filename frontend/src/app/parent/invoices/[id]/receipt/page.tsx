// src/app/parent/invoices/receipt/[id]/page.tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { getParentReceiptData } from "@/lib/parent-receipts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Justificatif de paiement | Espace parent",
  description: "Consultation sécurisée des paiements confirmés d'une facture.",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});
const date = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function ParentReceiptPage({ params }: Props) {
  const { id } = await params;
  const receipt = await getParentReceiptData(id);

  if (receipt.kind === "unauthenticated") redirect("/login");
  if (receipt.kind !== "ok") notFound();

  const {
    invoice,
    parent,
    confirmedPayments,
    invoicedAmount,
    paidAmount,
    remainingAmount,
    hasReceipt,
  } = receipt;

  const studentName =
    invoice.student.user.name ??
    invoice.student.user.email ??
    "Apprenant";
  const isProfessional = invoice.student.class.educationType === "PROFESSIONAL";
  const pdfUrl = `/api/receipt/${encodeURIComponent(invoice.id)}`;
  const isFullyPaid = remainingAmount <= 0 && hasReceipt;

  return (
    <div className="relative mx-auto max-w-6xl space-y-7 pb-16 text-slate-100">
      <div className="pointer-events-none absolute right-12 top-0 -z-10 h-64 w-64 rounded-full bg-sky-500/10 blur-[100px]" />

      <header className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl sm:p-8">
        <Link
          href="/parent/invoices"
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Retour aux factures
        </Link>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300">
              <ShieldCheck size={14} aria-hidden="true" /> Espace parent sécurisé
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Justificatif de paiement
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-400">
              Paiements confirmés associés à cette facture. Ce document est un relevé
              généré à partir des transactions enregistrées, non un reçu certifié.
            </p>
          </div>
          {hasReceipt ? (
            <a
              href={`${pdfUrl}?download=1`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
            >
              <Download size={17} aria-hidden="true" /> Télécharger le PDF
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-300">
              <Clock3 size={16} aria-hidden="true" /> PDF non disponible
            </span>
          )}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Résumé financier">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <FileText size={15} aria-hidden="true" /> Montant facturé
          </p>
          <p className="text-xl font-extrabold text-white">{money.format(invoicedAmount)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="mb-2 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 size={15} aria-hidden="true" /> Paiements confirmés
          </p>
          <p className="text-xl font-extrabold text-emerald-300">{money.format(paidAmount)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <Wallet size={15} aria-hidden="true" /> Solde restant
          </p>
          <p className={`text-xl font-extrabold ${remainingAmount > 0 ? "text-amber-300" : "text-emerald-300"}`}>
            {money.format(remainingAmount)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <ReceiptText size={19} className="text-sky-400" aria-hidden="true" /> Détails de la facture
          </h2>
          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
            isFullyPaid
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/25 bg-amber-500/10 text-amber-300"
          }`}>
            {isFullyPaid ? "Montant intégralement couvert" : "Paiement partiel ou en attente"}
          </span>
        </div>

        <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-400">Référence de facture</dt>
            <dd className="mt-1 break-all font-mono text-slate-100">{invoice.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Échéance</dt>
            <dd className="mt-1 font-medium text-white">{date.format(invoice.dueDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">{isProfessional ? "Apprenant" : "Élève"}</dt>
            <dd className="mt-1 flex items-center gap-2 font-medium text-white">
              <GraduationCap size={15} className="text-sky-400" aria-hidden="true" /> {studentName}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">{isProfessional ? "Formation" : "Classe"}</dt>
            <dd className="mt-1 font-medium text-white">
              {invoice.student.class.name} · {invoice.student.class.level}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Parent / tuteur</dt>
            <dd className="mt-1 font-medium text-white">{parent.name ?? parent.email ?? "Compte parent"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Date d'émission de la facture</dt>
            <dd className="mt-1 font-medium text-white">{date.format(invoice.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 shadow-xl">
        <div className="border-b border-slate-800 p-6 sm:p-8">
          <h2 className="text-base font-bold text-white">Transactions confirmées</h2>
          <p className="mt-1 text-xs text-slate-400">
            Seules les opérations dont le statut est PAID figurent sur le justificatif.
          </p>
        </div>
        {confirmedPayments.length === 0 ? (
          <div className="flex items-start gap-3 p-6 text-sm text-amber-200 sm:p-8" role="status">
            <Clock3 size={19} className="shrink-0" aria-hidden="true" />
            Aucun paiement confirmé n'est enregistré pour cette facture.
            Le PDF sera disponible lorsqu'une transaction sera confirmée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[610px] text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Moyen</th>
                  <th className="px-6 py-4 font-semibold">Référence transaction</th>
                  <th className="px-6 py-4 text-right font-semibold">Montant confirmé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {confirmedPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-300">{date.format(payment.createdAt)}</td>
                    <td className="px-6 py-4 text-slate-300">{payment.provider}</td>
                    <td className="max-w-[230px] break-all px-6 py-4 font-mono text-xs text-slate-400">
                      {payment.providerTxId ?? payment.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-emerald-300">
                      {money.format(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {hasReceipt && (
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-3 shadow-xl sm:p-5">
          <div className="mb-4 flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold text-white">Aperçu du PDF</h2>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-sky-400 hover:text-sky-300"
            >
              Ouvrir dans un nouvel onglet
            </a>
          </div>
          <iframe
            src={pdfUrl}
            title={`Justificatif des paiements de la facture ${invoice.id}`}
            loading="lazy"
            className="h-[520px] w-full rounded-xl border border-slate-700 bg-white sm:h-[700px]"
          />
        </section>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Ce document ne comporte ni signature électronique, ni cachet institutionnel,
        ni preuve de certification. En cas de divergence comptable, contactez l'établissement.
        Les montants sont affichés en FCFA (XOF), conformément à la convention utilisée
        par le portail actuel.
      </p>
    </div>
  );
}
