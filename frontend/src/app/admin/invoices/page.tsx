import type { ReactNode } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  FileText,
  Wallet,
  AlertCircle,
  Plus,
  Users,
  UserRound,
  CalendarDays,
  Banknote,
  ReceiptText,
  ShieldCheck,
  GraduationCap,
  ArrowUpRight,
} from "lucide-react";

import { InvoiceActionButton } from "./InvoiceActionButton";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-xl border border-slate-700/70 bg-[#08111f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10";

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function formatMoney(amount: number) {
  return `${moneyFormatter.format(amount)} FCFA`;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Le champ ${key} est obligatoire.`);
  }

  return value.trim();
}

function getAmount(formData: FormData) {
  const raw = getString(formData, "amount");

  if (!/^\d+$/.test(raw)) {
    throw new Error("Le montant doit être un entier positif en FCFA.");
  }

  const amount = Number(raw);

  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    amount > 1_000_000_000
  ) {
    throw new Error("Montant de facture invalide.");
  }

  return amount;
}

function getDueDate(formData: FormData) {
  const raw = getString(formData, "dueDate");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error("Format de date invalide.");
  }

  // Midi UTC permet d'éviter les décalages de date
  // lors de l'affichage selon certains fuseaux horaires.
  const date = new Date(`${raw}T12:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== raw
  ) {
    throw new Error("Date d'échéance invalide.");
  }

  return date;
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Authentification requise.");
  }

  // Vérification du rôle dans la base, et pas seulement
  // dans le JWT ou les données envoyées par le navigateur.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Accès réservé à l'administration.");
  }

  return user;
}

// ========================================
// SERVER ACTIONS
// ========================================

async function createSingleInvoice(formData: FormData) {
  "use server";

  await requireAdmin();

  const studentId = getString(formData, "studentId");
  const amount = getAmount(formData);
  const dueDate = getDueDate(formData);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      parentId: true,
    },
  });

  if (!student) {
    throw new Error("Élève introuvable.");
  }

  if (!student.parentId) {
    throw new Error(
      "Cet élève n'a pas de parent associé. Complétez d'abord son dossier."
    );
  }

  await prisma.invoice.create({
    data: {
      studentId: student.id,
      parentId: student.parentId,
      amount,
      dueDate,
      status: "PENDING",
    },
  });

  revalidatePath("/admin/invoices");
  revalidatePath("/parent/invoices");
}

async function createBulkInvoices(formData: FormData) {
  "use server";

  await requireAdmin();

  const classId = getString(formData, "classId");
  const amount = getAmount(formData);
  const dueDate = getDueDate(formData);

  const schoolClass = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true },
  });

  if (!schoolClass) {
    throw new Error("Classe introuvable.");
  }

  const students = await prisma.student.findMany({
    where: {
      classId: schoolClass.id,
      parentId: { not: null },
    },
    select: {
      id: true,
      parentId: true,
    },
  });

  if (students.length === 0) {
    throw new Error(
      "Aucun élève avec un parent associé dans cette classe."
    );
  }

  // Ne pas recréer les mêmes factures lors d'un nouvel envoi
  // du même lot (même élève, échéance et montant).
  // Une contrainte UNIQUE métier reste nécessaire pour une
  // garantie absolue en cas de requêtes simultanées.
  const existingInvoices = await prisma.invoice.findMany({
    where: {
      studentId: { in: students.map((student) => student.id) },
      dueDate,
      amount,
    },
    select: { studentId: true },
  });

  const alreadyInvoiced = new Set(
    existingInvoices.map((invoice) => invoice.studentId)
  );

  const invoicesToCreate = students
    .filter(
      (student): student is typeof student & { parentId: string } =>
        student.parentId !== null && !alreadyInvoiced.has(student.id)
    )
    .map((student) => ({
      studentId: student.id,
      parentId: student.parentId,
      amount,
      dueDate,
      status: "PENDING" as const,
    }));

  if (invoicesToCreate.length === 0) {
    throw new Error(
      "Tous les élèves concernés disposent déjà d'une facture pour ce montant et cette échéance."
    );
  }

  await prisma.invoice.createMany({
    data: invoicesToCreate,
  });

  revalidatePath("/admin/invoices");
  revalidatePath("/parent/invoices");
}

async function markPaid(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = getString(formData, "id");

  // L'opération est atomique :
  // statut de facture et paiement manuel sont liés.
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
        status: true,
      },
    });

    if (!invoice) {
      throw new Error("Facture introuvable.");
    }

    if (invoice.status === "PAID") {
      throw new Error("Cette facture est déjà payée.");
    }

    const updated = await tx.invoice.updateMany({
      where: {
        id,
        status: {
          in: ["PENDING", "OVERDUE"],
        },
      },
      data: {
        status: "PAID",
      },
    });

    if (updated.count !== 1) {
      throw new Error(
        "Cette facture a déjà été modifiée. Rechargez la page."
      );
    }

    // Comptabiliser les paiements déjà enregistrés.
    const previousPayments = await tx.payment.aggregate({
      where: {
        invoiceId: id,
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      },
    });

    const alreadyPaid = previousPayments._sum.amount ?? 0;
    const remaining = invoice.amount - alreadyPaid;

    // Éviter de déclarer payée une facture dont les paiements
    // enregistrés dépassent déjà le montant facturé.
    if (remaining < 0) {
      throw new Error(
        "Les règlements existants dépassent le montant de cette facture. Vérifiez les écritures."
      );
    }

    // Inscription d'un paiement manuel correspondant
    // uniquement au solde restant.
    if (remaining > 0) {
      await tx.payment.create({
        data: {
          invoiceId: id,
          provider: "MANUAL_ADMIN",
          providerTxId: `MANUAL-${id}`,
          amount: remaining,
          status: "SUCCESS",
        },
      });
    }
  });

  revalidatePath("/admin/invoices");
  revalidatePath("/parent/invoices");
  revalidatePath("/parent/dashboard");
}

async function deleteInvoice(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = getString(formData, "id");

  // Suppression uniquement des factures non réglées
  // et sans aucun paiement associé.
  const result = await prisma.invoice.deleteMany({
    where: {
      id,
      status: {
        in: ["PENDING", "OVERDUE"],
      },
      payments: {
        none: {},
      },
    },
  });

  if (result.count !== 1) {
    throw new Error(
      "Suppression impossible : facture introuvable, réglée ou liée à des paiements."
    );
  }

  revalidatePath("/admin/invoices");
  revalidatePath("/parent/invoices");
}

// ========================================
// PAGE ADMIN FACTURATION
// ========================================

export default async function AdminInvoicesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (admin?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [invoices, students, classes, stats] =
    await Promise.all([
      prisma.invoice.findMany({
        select: {
          id: true,
          amount: true,
          dueDate: true,
          status: true,
          createdAt: true,
          student: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
              class: {
                select: {
                  name: true,
                  level: true,
                },
              },
            },
          },
          parent: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      }),

      prisma.student.findMany({
        where: {
          parentId: { not: null },
        },
        select: {
          id: true,
          user: {
            select: {
              name: true,
            },
          },
          parent: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          user: {
            name: "asc",
          },
        },
      }),

      prisma.class.findMany({
        select: {
          id: true,
          name: true,
          level: true,
        },
        orderBy: [
          { level: "asc" },
          { name: "asc" },
        ],
      }),

      prisma.invoice.groupBy({
        by: ["status"],
        _sum: {
          amount: true,
        },
        _count: true,
      }),
    ]);

  const getTotal = (status: "PENDING" | "PAID" | "OVERDUE") =>
    stats.find((item) => item.status === status)?._sum
      .amount ?? 0;

  const totalPaid = getTotal("PAID");
  const totalUnpaid =
    getTotal("PENDING") + getTotal("OVERDUE");

  const paidCount =
    stats.find((item) => item.status === "PAID")
      ?._count ?? 0;

  // Avec `_count: true`, Prisma retourne directement un number.
  // Ne pas écrire `item._count._all` ici : erreur TS2339.
  const totalCount = stats.reduce(
    (sum, item) => sum + item._count,
    0
  );

  return (
    <main className="mx-auto max-w-7xl space-y-8 pb-12 text-slate-100">
      {/* HEADER */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
              <ShieldCheck size={14} />
              Administration financière
            </div>

            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
              <ReceiptText className="h-8 w-8 text-teal-400" />
              Gestion de la facturation
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
              Créez les factures scolaires, consultez les
              échéances et suivez les règlements des familles.
              Les règlements manuels sont enregistrés dans
              l'historique des paiements.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-teal-500/20 bg-teal-500/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-teal-300">
                <Wallet size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Factures réglées
                </span>
              </div>

              <p className="text-xl font-bold text-white">
                {formatMoney(totalPaid)}
              </p>

              <p className="mt-1 text-xs text-teal-200/70">
                {paidCount} facture(s) marquée(s) payée(s)
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-amber-300">
                <AlertCircle size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Factures à régler
                </span>
              </div>

              <p className="text-xl font-bold text-white">
                {formatMoney(totalUnpaid)}
              </p>

              <p className="mt-1 text-xs text-amber-200/70">
                En attente ou en retard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTIQUES */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<FileText size={19} />}
          label="Factures émises"
          value={String(totalCount)}
          description="Nombre total de factures"
        />

        <StatCard
          icon={<GraduationCap size={19} />}
          label="Élèves facturables"
          value={String(students.length)}
          description="Avec un parent associé"
        />

        <StatCard
          icon={<Users size={19} />}
          label="Classes"
          value={String(classes.length)}
          description="Classes disponibles"
        />
      </section>

      {/* FORMULAIRES */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* FACTURATION PAR CLASSE */}
        <div className="rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-teal-500/10 p-3 text-teal-400">
              <Users size={21} />
            </div>

            <div>
              <h2 className="font-bold text-white">
                Facturation par classe
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Une facture pour chaque élève avec parent
              </p>
            </div>
          </div>

          <form
            action={createBulkInvoices}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="bulk-class"
                className="mb-2 block text-xs font-semibold text-slate-300"
              >
                Classe concernée
              </label>

              <select
                id="bulk-class"
                name="classId"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="" disabled>
                  Sélectionner une classe
                </option>

                {classes.map((schoolClass) => (
                  <option
                    key={schoolClass.id}
                    value={schoolClass.id}
                  >
                    {schoolClass.name} — {schoolClass.level}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="bulk-amount"
                  className="mb-2 block text-xs font-semibold text-slate-300"
                >
                  Montant unitaire
                </label>

                <div className="relative">
                  <Banknote
                    size={17}
                    className="absolute left-3 top-3.5 text-slate-500"
                  />

                  <input
                    id="bulk-amount"
                    name="amount"
                    type="number"
                    min="1"
                    max="1000000000"
                    step="1"
                    required
                    placeholder="Montant FCFA"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="bulk-due"
                  className="mb-2 block text-xs font-semibold text-slate-300"
                >
                  Date d'échéance
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="absolute left-3 top-3.5 text-slate-500"
                  />

                  <input
                    id="bulk-due"
                    name="dueDate"
                    type="date"
                    required
                    className={`${inputClass} pl-10 [color-scheme:dark]`}
                  />
                </div>
              </div>
            </div>

            <p className="rounded-xl border border-slate-800 bg-[#08111f] p-3 text-xs leading-relaxed text-slate-400">
              Chaque élève ayant un parent associé recevra
              une facture distincte. Les factures identiques
              déjà enregistrées (élève, montant et échéance)
              seront ignorées. Vérifiez les informations
              avant de générer le lot.
            </p>

            <button
              type="submit"
              disabled={classes.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Générer les factures
            </button>
          </form>
        </div>

        {/* FACTURATION INDIVIDUELLE */}
        <div className="rounded-3xl border border-slate-800 bg-[#111e30] p-6 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-sky-500/10 p-3 text-sky-400">
              <UserRound size={21} />
            </div>

            <div>
              <h2 className="font-bold text-white">
                Facture individuelle
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Facturer un élève particulier
              </p>
            </div>
          </div>

          <form
            action={createSingleInvoice}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="single-student"
                className="mb-2 block text-xs font-semibold text-slate-300"
              >
                Élève
              </label>

              <select
                id="single-student"
                name="studentId"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="" disabled>
                  Sélectionner un élève
                </option>

                {students.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.user.name ?? "Élève sans nom"} —{" "}
                    {student.parent?.name ??
                      student.parent?.email ??
                      "Parent"}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="single-amount"
                  className="mb-2 block text-xs font-semibold text-slate-300"
                >
                  Montant
                </label>

                <div className="relative">
                  <Banknote
                    size={17}
                    className="absolute left-3 top-3.5 text-slate-500"
                  />

                  <input
                    id="single-amount"
                    name="amount"
                    type="number"
                    min="1"
                    max="1000000000"
                    step="1"
                    required
                    placeholder="Montant FCFA"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="single-due"
                  className="mb-2 block text-xs font-semibold text-slate-300"
                >
                  Date d'échéance
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="absolute left-3 top-3.5 text-slate-500"
                  />

                  <input
                    id="single-due"
                    name="dueDate"
                    type="date"
                    required
                    className={`${inputClass} pl-10 [color-scheme:dark]`}
                  />
                </div>
              </div>
            </div>

            <p className="rounded-xl border border-slate-800 bg-[#08111f] p-3 text-xs leading-relaxed text-slate-400">
              La facture sera liée automatiquement au parent
              actuellement associé à cet élève.
            </p>

            <button
              type="submit"
              disabled={students.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-white px-5 py-3.5 text-sm font-bold text-[#08111f] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Créer la facture
            </button>
          </form>
        </div>
      </section>

      {/* TABLEAU */}
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#111e30] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <FileText size={19} className="text-teal-400" />
              Factures récentes
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Les 50 dernières factures émises
            </p>
          </div>

          <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-300">
            {invoices.length} affichée(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-[#0b1626] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Élève / Classe
                </th>
                <th className="px-5 py-4 font-semibold">
                  Parent
                </th>
                <th className="px-5 py-4 font-semibold">
                  Montant
                </th>
                <th className="px-5 py-4 font-semibold">
                  Échéance
                </th>
                <th className="px-5 py-4 font-semibold">
                  Statut
                </th>
                <th className="px-5 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/70">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <ReceiptText
                      size={40}
                      className="mx-auto mb-4 text-slate-700"
                    />

                    <p className="font-semibold text-slate-300">
                      Aucune facture pour le moment
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Utilisez les formulaires ci-dessus
                      pour créer votre première facture.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const isPaid = invoice.status === "PAID";

                  const isOverdue =
                    invoice.status === "OVERDUE" ||
                    (!isPaid &&
                      invoice.dueDate
                        .toISOString()
                        .slice(0, 10) <
                        new Date()
                          .toISOString()
                          .slice(0, 10));

                  return (
                    <tr
                      key={invoice.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">
                          {invoice.student.user.name ??
                            "Élève sans nom"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {invoice.student.class.name} —{" "}
                          {invoice.student.class.level}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-300">
                          {invoice.parent.name ?? "Parent"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {invoice.parent.email ??
                            "Aucun email"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-bold text-white">
                          {formatMoney(invoice.amount)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {invoice.dueDate.toLocaleDateString(
                          "fr-FR",
                          { timeZone: "UTC" }
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {isPaid ? (
                          <StatusBadge status="PAID" />
                        ) : isOverdue ? (
                          <StatusBadge status="OVERDUE" />
                        ) : (
                          <StatusBadge status="PENDING" />
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <form action={markPaid}>
                              <input
                                type="hidden"
                                name="id"
                                value={invoice.id}
                              />

                              <InvoiceActionButton type="paid" />
                            </form>
                          )}

                          {!isPaid && (
                            <form action={deleteInvoice}>
                              <input
                                type="hidden"
                                name="id"
                                value={invoice.id}
                              />

                              <InvoiceActionButton type="delete" />
                            </form>
                          )}

                          {isPaid && (
                            <span className="inline-flex items-center gap-1 text-xs text-teal-400">
                              <ArrowUpRight size={14} />
                              Réglée
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

// ========================================
// UI COMPONENTS
// ========================================

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111e30] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>

        <span className="rounded-lg bg-teal-500/10 p-2 text-teal-400">
          {icon}
        </span>
      </div>

      <p className="text-2xl font-bold text-white">{value}</p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "PAID" | "PENDING" | "OVERDUE";
}) {
  const config = {
    PAID: {
      label: "Payée",
      style:
        "border-teal-500/20 bg-teal-500/10 text-teal-300",
    },
    PENDING: {
      label: "En attente",
      style:
        "border-amber-500/20 bg-amber-500/10 text-amber-300",
    },
    OVERDUE: {
      label: "En retard",
      style:
        "border-red-500/20 bg-red-500/10 text-red-400",
    },
  }[status];

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-bold ${config.style}`}
    >
      {config.label}
    </span>
  );
}
