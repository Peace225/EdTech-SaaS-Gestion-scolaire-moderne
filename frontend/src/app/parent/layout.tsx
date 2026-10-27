
import type { ReactNode } from "react";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ParentNavigation from "./ParentNavigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Espace parent | EdTech SaaS",
  description:
    "Suivi des enfants, des bulletins et des factures scolaires.",
};

type Props = Readonly<{
  children: ReactNode;
}>;

export default async function ParentLayout({
  children,
}: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Vérification du compte en base de données
  const parent = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      _count: {
        select: {
          parentStudents: true,
        },
      },
    },
  });

  if (!parent) {
    redirect("/login");
  }

  // Aucun accès automatique pour ADMIN ou TEACHER
  if (parent.role !== "PARENT") {
    notFound();
  }

  // Calcul réel des factures en retard
  const overdueInvoicesCount =
    await prisma.invoice.count({
      where: {
        parentId: parent.id,
        OR: [
          {
            status: "OVERDUE",
          },
          {
            status: "PENDING",
            dueDate: {
              lt: new Date(),
            },
          },
        ],
      },
    });

  async function logoutAction() {
    "use server";

    await signOut({
      redirectTo: "/login",
    });
  }

  return (
    <div className="min-h-dvh bg-[#070b15] text-slate-100 selection:bg-sky-500/30">
      <a
        href="#parent-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-slate-950"
      >
        Aller au contenu principal
      </a>

      <ParentNavigation
        parentName={parent.name ?? "Parent / tuteur"}
        parentEmail={parent.email ?? ""}
        childrenCount={parent._count.parentStudents}
        overdueInvoicesCount={overdueInvoicesCount}
        logoutAction={logoutAction}
      />

      <div className="min-w-0 lg:pl-72">
        <main
          id="parent-main-content"
          tabIndex={-1}
          className="mx-auto min-h-[calc(100dvh-4.5rem)] w-full max-w-[1600px] min-w-0 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:min-h-dvh lg:px-9 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
