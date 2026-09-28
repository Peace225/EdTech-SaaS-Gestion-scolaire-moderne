// src/app/student/exercises/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PenTool, Sparkles, CheckCircle2, PlayCircle, BookOpen, Layers } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StudentExercisesPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== "STUDENT") redirect("/login")
  
  const userId = (session.user as any).id

  const student = await prisma.student.findFirst({
    where: { userId },
    include: { class: true, user: true }
  })

  if (!student) redirect("/login")

  // Liste de démonstration des exercices d'entraînement par matière
  const exercisesList = [
    {
      id: "ex-1",
      title: "Série d'exercices n°1 : Calculs de limites et suites",
      subject: "Mathématiques",
      teacher: "M. Kouassi",
      difficulty: "Intermédiaire",
      questionsCount: 8,
      status: "COMPLETED", // COMPLETED, IN_PROGRESS, NOT_STARTED
      score: "16/20"
    },
    {
      id: "ex-2",
      title: "Quiz interactif : Cinématique et lois horaires",
      subject: "Physique-Chimie",
      teacher: "Mme Diallo",
      difficulty: "Avancé",
      questionsCount: 10,
      status: "IN_PROGRESS",
      score: "En cours"
    },
    {
      id: "ex-3",
      title: "Entraînement : Analyse de texte et argumentation",
      subject: "Français",
      teacher: "Mme Touré",
      difficulty: "Standard",
      questionsCount: 5,
      status: "NOT_STARTED",
      score: "-"
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Entraînement & Auto-évaluation • Abidjan
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Séries d'Exercices Pratiques
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            exercez-vous régulièrement avec nos séries d'exercices corrigés et suivez vos progrès pour la classe de <strong className="text-slate-200">{student.class?.name || "Terminale"}</strong>.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-6 py-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <PenTool size={24} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Séries Disponibles</p>
            <p className="text-sm font-extrabold text-white">{exercisesList.length} Modules</p>
          </div>
        </div>
      </div>

      {/* Liste des exercices */}
      <div className="space-y-6 relative z-10">
        {exercisesList.map((ex) => {
          const isCompleted = ex.status === "COMPLETED"
          const isInProgress = ex.status === "IN_PROGRESS"

          return (
            <div 
              key={ex.id} 
              className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase">
                    {ex.subject}
                  </span>
                  <span className="text-xs text-slate-400">Enseignant : <strong className="text-slate-200">{ex.teacher}</strong></span>
                  <span className="text-xs text-slate-300 bg-slate-950 px-3 py-0.5 rounded-full border border-slate-800">
                    Difficulté : <strong className="text-indigo-400">{ex.difficulty}</strong>
                  </span>
                  <span className="text-xs text-slate-400">
                    {ex.questionsCount} questions
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-white">{ex.title}</h2>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 shrink-0">
                {isCompleted ? (
                  <div className="flex items-center gap-3 w-full justify-between sm:justify-end">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                      Note : {ex.score}
                    </span>
                    <button className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                      <BookOpen size={14} /> Voir le corrigé
                    </button>
                  </div>
                ) : isInProgress ? (
                  <button className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer w-full justify-center">
                    <PlayCircle size={16} /> Reprendre l'exercice
                  </button>
                ) : (
                  <button className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer w-full justify-center">
                    <PlayCircle size={16} /> Commencer la série
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}