
"use client";

import { useEffect } from "react";
import Link from "next/link";

import {
  AlertTriangle,
  RefreshCw,
  LayoutDashboard,
} from "lucide-react";

type TeacherErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function TeacherError({
  error,
  reset,
}: TeacherErrorProps) {
  useEffect(() => {
    console.error(
      "Erreur du portail enseignant :",
      error
    );
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#08111f] px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#111e30] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
          <AlertTriangle size={30} />
        </div>

        <h1 className="text-2xl font-bold text-white">
          Une erreur est survenue
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Impossible de charger cette partie du
          portail enseignant pour le moment.
          Vous pouvez réessayer ou revenir
          au tableau de bord.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-400"
          >
            <RefreshCw size={17} />
            Réessayer
          </button>

          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <LayoutDashboard size={17} />
            Tableau de bord
          </Link>
        </div>
      </div>
    </main>
  );
}
