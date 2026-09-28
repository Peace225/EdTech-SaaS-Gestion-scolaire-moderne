// src/app/teacher/exercises/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, Sparkles, Plus, Layers, CheckCircle2, Trash2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TeacherExercisesPage() {
  const session = await auth()
  if (!session) redirect("/login")
  
  const role = (session.user as any).role
  if (role !== "TEACHER" && role !== "ADMIN") redirect("/login")

  // Liste de démonstration des exercices publiés par le professeur
  const exercises = [
    {
      id: "ex-1",
      title: "Série d'exercices n°1 : Calculs de limites et suites",
      subject: "Mathématiques",
      class: "Terminale A",
      difficulty: "Intermédiaire",
      questionsCount: 8,
      createdAt: "2026-09-20"
    },
    {
      id: "ex-2",
      title: "Série d'exercices n°2 : Étude de fonctions exponentielles",
      subject: "Mathématiques",
      class: "Terminale D",
      difficulty: "Avancé",
      questionsCount: 10,
      createdAt: "2026-09-24"
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Espace Enseignant • Abidjan
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Gestion des Exercices
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Publiez et gérez les séries d'exercices d'entraînement et les quiz interactifs pour vos différentes classes.
          </p>
        </div>

        <Link 
          href="/teacher/exercises/new"
          className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer w-fit"
        >
          <Plus size={16} /> Publier un exercice
        </Link>
      </div>

      {/* Liste des exercices publiés */}
      <div className="space-y-6 relative z-10">
        {exercises.map((ex) => (
          <div 
            key={ex.id} 
            className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase">
                  {ex.subject}
                </span>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-0.5 rounded-full text-xs font-semibold">
                  Classe : {ex.class}
                </span>
                <span className="text-xs text-slate-300 bg-slate-950 px-3 py-0.5 rounded-full border border-slate-800">
                  Difficulté : <strong className="text-amber-400">{ex.difficulty}</strong>
                </span>
                <span className="text-xs text-slate-400">
                  {ex.questionsCount} questions
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-white">{ex.title}</h2>
              <p className="text-xs text-slate-400">
                Publié le {new Date(ex.createdAt).toLocaleDateString()} • Accessible aux élèves de la classe
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
                Modifier
              </button>
              <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-2.5 rounded-xl transition-all cursor-pointer">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}