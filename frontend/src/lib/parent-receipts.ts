// src/lib/parent-receipts.ts
import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Recherche sécurisée, partagée par la page parent et sa route PDF.
 * N'émet jamais de justificatif sur la seule base de Invoice.status = PAID.
 * Seuls les paiements Payment.status = PAID font foi dans ce module.
 */
export async function getParentReceiptData(invoiceId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { kind: "unauthenticated" as const };
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, name: true, email: true },
  });

  // Même réponse pour un compte non parent et pour une facture inexistante :
  // aucune information n'est divulguée sur les factures des autres familles.
  if (account?.role !== "PARENT") {
    return { kind: "not-found" as const };
  }

  if (!/^[A-Za-z0-9_-]{1,128}$/.test(invoiceId)) {
    return { kind: "not-found" as const };
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      parentId: account.id,
      student: { is: { parentId: account.id } },
    },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      dueDate: true,
      student: {
        select: {
          user: { select: { name: true, email: true } },
          class: { select: { name: true, level: true, educationType: true } },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          provider: true,
          providerTxId: true,
          status: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!invoice) {
    return { kind: "not-found" as const };
  }

  const confirmedPayments = invoice.payments.filter(
    (payment) =>
      payment.status === "PAID" &&
      Number.isFinite(payment.amount) &&
      payment.amount > 0,
  );

  const paidAmount = confirmedPayments.reduce(
    (total, payment) => total + payment.amount,
    0,
  );
  const invoicedAmount = Math.max(0, invoice.amount);
  const remainingAmount = Math.max(0, invoicedAmount - paidAmount);

  return {
    kind: "ok" as const,
    invoice,
    parent: { name: account.name, email: account.email },
    confirmedPayments,
    invoicedAmount,
    paidAmount,
    remainingAmount,
    hasReceipt: confirmedPayments.length > 0,
  };
}

export type ParentReceiptReady = Extract<
  Awaited<ReturnType<typeof getParentReceiptData>>,
  { kind: "ok" }
>;
