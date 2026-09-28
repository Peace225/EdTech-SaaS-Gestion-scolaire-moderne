// src/app/student/assignments/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ClipboardList, Sparkles, Clock, CheckCircle2, Upload, PlayCircle, ShieldAlert } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StudentAssignmentsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const userId = (session.user as any).id
  const role = (session.user as any).role

  const student = await prisma.student.findFirst({
    where: {
      userId: role === "ADMIN" ? undefined : userId,
      ...(role === "STUDENT" ? { userId } : {}),
    },
    include: { class: true, user: true }
  })

  if (role === "STUDENT" && !student) {
    redirect("/login")
  }

  if (role === "PARENT") {
    redirect("/parent/dashboard")
  }

  if (!student) {
    redirect("/login")
  }

  // Liste des devoirs (Maison vs En Ligne chronométrés)
  const assignments = [
    {
      id: "asg-online-1",
      title: "Interrogation en ligne : Suites & Limites",
      subject: "Mathématiques",
      teacher: "M. Kouassi",
      type: "ONLINE",
      duration: "30 minutes",
      dueDate: "2026-10-02",
      status: "PENDING",
      description: "Quiz chronométré de 10 questions à choix multiples. Attention : le chronomètre démarre dès le lancement et la soumission est automatique."
    },
    {
      id: "asg-1",
      title: "Devoir Maison n°1 : Étude de fonctions",
      subject: "Mathématiques",
      teacher: "M. Kouassi",
      type: "UPLOAD",
      dueDate: "2026-10-05",
      status: "PENDING",
      description: "Résoudre les exercices 3, 4 et 7 de la page 45 du polycopié d'analyse. Rédaction soignée exigée."
    },
    {
      id: "asg-2",
      title: "Compte-rendu de TP : Chute libre et lois de Newton",
      subject: "Physique-Chimie",
      teacher: "Mme Diallo",
      type: "UPLOAD",
      dueDate: "2026-10-08",
      status: "PENDING",
      description: "Analyser les courbes d'accélération obtenues lors de l'expérience en laboratoire et conclure sur la valeur de g."
    },
    {
      id: "asg-3",
      title: "Dissertation : Le roman réaliste au XIXe siècle",
      subject: "Français",
      teacher: "Mme Touré",
      type: "UPLOAD",
      dueDate: "2026-09-28",
      status: "SUBMITTED",
      description: "« Le romancier est-il un observateur ou un moraliste ? » Traiter le sujet en vous appuyant sur vos lectures."
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
            <Sparkles size={14} /> Suivi des Devoirs • Abidjan
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Devoirs à Rendre & Compositions en Ligne
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Retrouvez vos devoirs à déposer ainsi que vos compositions en ligne chronométrées (20 à 30 min) pour la classe de <strong className="text-slate-200">{student.class?.name || "Terminale"}</strong>.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-6 py-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Devoirs Actifs</p>
            <p className="text-sm font-extrabold text-white">{assignments.length} Devoir(s)</p>
          </div>
        </div>
      </div>

      {/* Liste des devoirs */}
      <div className="space-y-6 relative z-10">
        {assignments.map((asg) => {
          const isSubmitted = asg.status === "SUBMITTED"
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
                  
                  {isOnline ? (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-0.5 rounded-full text-xs font-extrabold uppercase flex items-center gap-1">
                      <Clock size={12} /> En Ligne • Chrono {asg.duration}
                    </span>
                  ) : (
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-0.5 rounded-full text-xs font-semibold">
                      Devoir Maison (Dépôt)
                    </span>
                  )}

                  <span className="text-xs text-slate-400">Enseignant : <strong className="text-slate-200">{asg.teacher}</strong></span>
                  <span className="text-xs text-slate-300 bg-slate-950 px-3 py-0.5 rounded-full border border-slate-800">
                    Limite : {new Date(asg.dueDate).toLocaleDateString()}
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-white">{asg.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
                  {asg.description}
                </p>

                {isOnline && (
                  <div className="flex items-center gap-2 text-[11px] text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <ShieldAlert size={15} className="shrink-0" />
                    <span>Attention : Une fois lancé, vous devez rester connecté et actif sur la page jusqu'à la fin du temps imparti.</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 shrink-0">
                {isSubmitted ? (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 w-full justify-center">
                    <CheckCircle2 size={15} /> Devoir Soumis
                  </span>
                ) : isOnline ? (
                  <Link 
                    href={`/student/assignments/online/${asg.id}`}
                    className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer w-full justify-center"
                  >
                    <PlayCircle size={16} /> Lancer le Devoir ({asg.duration})
                  </Link>
                ) : (
                  <Link 
                    href={`/student/assignments/upload/${asg.id}`}
                    className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer w-full justify-center"
                  >
                    <Upload size={15} /> Déposer mon travail
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}