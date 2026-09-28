// src/app/teacher/assignments/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ClipboardList, Sparkles, Plus, Clock, Trash2, Send } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TeacherAssignmentsPage() {
  const session = await auth()
  if (!session) redirect("/login")
  
  const role = (session.user as any).role
  if (role !== "TEACHER" && role !== "ADMIN") redirect("/login")

  // Liste de démonstration des devoirs créés par le professeur
  const assignments = [
    {
      id: "asg-online-1",
      title: "Interrogation en ligne : Suites & Limites",
      subject: "Mathématiques",
      class: "Terminale A",
      type: "ONLINE",
      duration: "30 minutes",
      dueDate: "2026-10-02",
      status: "PUBLISHED"
    },
    {
      id: "asg-1",
      title: "Devoir Maison n°1 : Étude de fonctions",
      subject: "Mathématiques",
      class: "Terminale D",
      type: "UPLOAD",
      dueDate: "2026-10-05",
      status: "PUBLISHED"
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Espace Enseignant • Abidjan
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Gestion des Devoirs & Compositions
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Créez et publiez des devoirs maison (dépôt de fichiers) ou des compositions en ligne chronométrées (20 à 30 min) pour vos classes.
          </p>
        </div>

        <Link 
          href="/teacher/assignments/new"
          className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer w-fit"
        >
          <Plus size={16} /> Créer un nouveau devoir
        </Link>
      </div>

      {/* Liste des devoirs publiés */}
      <div className="space-y-6 relative z-10">
        {assignments.map((asg) => {
          const isOnline = asg.type === "ONLINE"

          return (
            <div 
              key={asg.id} 
              className={`bg-slate-900/40 border rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                isOnline ? "border-amber-500/40 bg-gradient-to-r from-slate-900/60 to-amber-950/20" : "border-slate-800/80"
              }`}
            >
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase">
                    {asg.subject}
                  </span>
                  
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-0.5 rounded-full text-xs font-semibold">
                    Classe : {asg.class}
                  </span>

                  {isOnline ? (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-0.5 rounded-full text-xs font-extrabold uppercase flex items-center gap-1">
                      <Clock size={12} /> En Ligne • Chrono {asg.duration}
                    </span>
                  ) : (
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-0.5 rounded-full text-xs font-semibold">
                      Devoir Maison (Dépôt)
                    </span>
                  )}

                  <span className="text-xs text-slate-300 bg-slate-950 px-3 py-0.5 rounded-full border border-slate-800">
                    Limite : {new Date(asg.dueDate).toLocaleDateString()}
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-white">{asg.title}</h2>
                <p className="text-xs text-slate-400">
                  Statut : <strong className="text-emerald-400">Publié</strong> • Accessible aux élèves de la classe
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
          )
        })}
      </div>

    </div>
  )
}