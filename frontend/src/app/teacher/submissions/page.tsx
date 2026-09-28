// src/app/teacher/submissions/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CheckSquare, Sparkles, FileText, Download, CheckCircle2, Clock } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TeacherSubmissionsPage() {
  const session = await auth()
  if (!session) redirect("/login")
  
  const role = (session.user as any).role
  if (role !== "TEACHER" && role !== "ADMIN") redirect("/login")

  // Liste de démonstration des devoirs rendus par les élèves
  const submissions = [
    {
      id: "sub-1",
      studentName: "Kouadio Jean",
      className: "Terminale A",
      assignmentTitle: "Devoir Maison n°1 : Étude de fonctions",
      subject: "Mathématiques",
      submittedAt: "2026-09-27 14:30",
      status: "PENDING", // PENDING, GRADED
      grade: null,
      fileName: "devoir_math_kouadio.pdf"
    },
    {
      id: "sub-2",
      studentName: "Aka Marie",
      className: "Terminale D",
      assignmentTitle: "Compte-rendu de TP : Chute libre",
      subject: "Physique-Chimie",
      submittedAt: "2026-09-26 18:15",
      status: "GRADED",
      grade: "15/20",
      fileName: "tp_physique_aka.pdf"
    },
    {
      id: "sub-3",
      studentName: "Traoré Ibrahim",
      className: "Terminale A",
      assignmentTitle: "Dissertation : Le roman réaliste",
      subject: "Français",
      submittedAt: "2026-09-25 21:00",
      status: "PENDING",
      grade: null,
      fileName: "dissertation_traore.docx"
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
            <Sparkles size={14} /> Espace Enseignant • Abidjan
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Devoirs Rendus & Copies des Élèves
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Consultez les travaux déposés par vos élèves, téléchargez leurs copies et attribuez leurs notes.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-6 py-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <CheckSquare size={24} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Copies Reçues</p>
            <p className="text-sm font-extrabold text-white">{submissions.length} Travaux</p>
          </div>
        </div>
      </div>

      {/* Liste des devoirs rendus */}
      <div className="space-y-6 relative z-10">
        {submissions.map((sub) => {
          const isGraded = sub.status === "GRADED"

          return (
            <div 
              key={sub.id} 
              className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase">
                    {sub.subject}
                  </span>
                  
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-0.5 rounded-full text-xs font-semibold">
                    {sub.className}
                  </span>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> Soumis le {sub.submittedAt}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-white">{sub.assignmentTitle}</h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Élève : <strong className="text-white">{sub.studentName}</strong> • Fichier : <span className="text-cyan-400 underline">{sub.fileName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                  <Download size={14} /> Télécharger
                </button>

                {isGraded ? (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Noté : {sub.grade}
                  </span>
                ) : (
                  <button className="bg-white hover:bg-slate-200 text-black px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-lg cursor-pointer">
                    Noter la copie
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