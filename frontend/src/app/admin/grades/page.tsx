
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Award,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Clock3,
  CheckCircle2,
  XCircle,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

import GradeReviewForm from "./GradeReviewForm";

export const dynamic = "force-dynamic";

const numberFormatter = new Intl.NumberFormat("fr-FR");

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Abidjan",
});

export default async function AdminGradesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (admin?.role !== "ADMIN") {
    redirect("/");
  }

  const [
    pendingGrades,
    pendingCount,
    approvedCount,
    rejectedCount,
  ] = await Promise.all([
    prisma.grade.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        subject: true,
        score: true,
        coef: true,
        term: true,
        createdAt: true,
        submittedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        student: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
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
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),

    prisma.grade.count({
      where: { status: "PENDING" },
    }),

    prisma.grade.count({
      where: { status: "APPROVED" },
    }),

    prisma.grade.count({
      where: { status: "REJECTED" },
    }),
  ]);

  const stats = [
    {
      label: "En attente",
      value: pendingCount,
      icon: Clock3,
      color: "text-amber-300 bg-amber-400/10",
    },
    {
      label: "Approuvées",
      value: approvedCount,
      icon: CheckCircle2,
      color: "text-emerald-300 bg-emerald-400/10",
    },
    {
      label: "Rejetées",
      value: rejectedCount,
      icon: XCircle,
      color: "text-red-300 bg-red-400/10",
    },
    {
      label: "Total des notes",
      value: pendingCount + approvedCount + rejectedCount,
      icon: Award,
      color: "text-cyan-300 bg-cyan-400/10",
    },
  ];

  return (
    <main className="min-h-screen bg-[#08111f] text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <LayoutDashboard size={16} className="text-teal-400" />
          <Link
            href="/admin/dashboard"
            className="hover:text-teal-300"
          >
            Administration
          </Link>
          <ChevronRight size={14} />
          <span className="font-semibold text-white">
            Validation des notes
          </span>
        </div>

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[30px] border border-teal-400/15 bg-gradient-to-br from-[#123d49] via-[#102a3a] to-[#0d1b2c] p-7 sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-teal-400/10 blur-[85px]" />

          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-teal-300">
              <Sparkles size={15} />
              Contrôle pédagogique
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Validation des{" "}
              <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                notes
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Vérifiez les évaluations soumises par les
              enseignants, approuvez les notes conformes
              ou demandez une correction avant publication.
            </p>
          </div>
        </section>

        {/* INDICATEURS */}
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-[24px] border border-white/[0.08] bg-[#111e30] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/25 sm:p-6"
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.color}`}
                >
                  <Icon size={23} />
                </div>

                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>

                <p className="mt-3 text-3xl font-extrabold">
                  {numberFormatter.format(stat.value)}
                </p>
              </div>
            );
          })}
        </section>

        {/* LISTE À VALIDER */}
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Notes en attente de vérification
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {numberFormatter.format(pendingCount)} note(s) à examiner.
              Les 50 plus anciennes sont affichées en priorité.
            </p>
          </div>

          {pendingGrades.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/[0.08] bg-[#111e30] px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-bold">
                Aucune validation en attente
              </h3>
              <p className="max-w-md text-sm leading-7 text-slate-400">
                Les prochaines notes soumises par les
                enseignants apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {pendingGrades.map((grade) => {
                const studentName =
                  grade.student.user.name ||
                  grade.student.user.email ||
                  "Élève sans nom";

                const teacherName =
                  grade.submittedBy?.name ||
                  grade.submittedBy?.email ||
                  "Auteur non renseigné";

                return (
                  <article
                    key={grade.id}
                    className="rounded-[26px] border border-white/[0.08] bg-[#111e30] p-5 transition-colors hover:border-teal-400/25 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold">
                          {studentName}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {grade.student.class?.name ?? "Sans classe"}
                          {grade.student.class?.level
                            ? ` · ${grade.student.class.level}`
                            : ""}
                        </p>
                      </div>

                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                        En attente
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#0b1727] p-4">
                        <p className="text-xs text-slate-400">
                          Note attribuée
                        </p>
                        <p className="mt-2 text-2xl font-extrabold text-teal-300">
                          {Number(grade.score).toLocaleString("fr-FR")}
                          <span className="text-sm text-slate-400">
                            {" "}/20
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#0b1727] p-4">
                        <p className="text-xs text-slate-400">
                          Coefficient
                        </p>
                        <p className="mt-2 text-2xl font-extrabold">
                          {grade.coef}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-sm">
                      <p className="flex items-center gap-2 text-slate-300">
                        <BookOpen size={16} className="text-teal-400" />
                        {grade.subject} · {grade.term}
                      </p>

                      <p className="flex items-center gap-2 text-slate-400">
                        <GraduationCap
                          size={16}
                          className="text-cyan-400"
                        />
                        Enseignant : {teacherName}
                      </p>

                      <p className="text-xs text-slate-500">
                        Soumise le{" "}
                        {dateFormatter.format(grade.createdAt)}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-white/[0.08] pt-5">
                      <GradeReviewForm gradeId={grade.id} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="flex items-center gap-2 border-t border-white/[0.07] pt-6 text-xs text-slate-500">
          <ShieldCheck size={16} className="text-teal-400" />
          EdTech SaaS · Validation administrative
        </footer>
      </div>
    </main>
  );
}
