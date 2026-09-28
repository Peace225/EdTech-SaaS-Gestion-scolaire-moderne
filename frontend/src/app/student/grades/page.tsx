// src/app/student/grades/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { BookOpen, Award, Sparkles, Filter, CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StudentGradesPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== "STUDENT") redirect("/login")
  
  const userId = (session.user as any).id

  const student = await prisma.student.findFirst({
    where: { userId },
    include: { 
      class: true, 
      grades: { orderBy: { createdAt: "desc" } }, 
      user: true 
    }
  })

  if (!student) redirect("/login")

  const gradesList = student.grades || []
  const moyenne = gradesList.length > 0 
    ? (gradesList.reduce((acc, g: any) => acc + (g.score ?? g.value ?? 0), 0) / gradesList.length).toFixed(2) 
    : "N/A"

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Suivi Pédagogique
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Toutes mes Notes & Évaluations
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Retrouvez le détail de l'ensemble de vos notes par matière pour l'année en cours.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-6 py-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Award size={24} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Moyenne Générale</p>
            <p className="text-xl font-extrabold text-white">{moyenne} <span className="text-xs text-slate-500 font-normal">/20</span></p>
          </div>
        </div>
      </div>

      {/* Liste complète des notes */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative z-10">
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <BookOpen size={18} className="text-blue-400" /> Relevé détaillé
          </h3>
          <span className="text-xs text-slate-500 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
            {gradesList.length} évaluation(s) enregistrée(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="p-5 font-semibold">Matière</th>
                <th className="p-5 font-semibold">Note / 20</th>
                <th className="p-5 font-semibold">Type d'évaluation</th>
                <th className="p-5 font-semibold text-right">Date d'enregistrement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {gradesList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                    Aucune note disponible pour le moment.
                  </td>
                </tr>
              ) : (
                gradesList.map((g: any) => {
                  const noteVal = g.score ?? g.value ?? 0
                  return (
                    <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-5 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {g.subject}
                      </td>
                      <td className="p-5">
                        <span className={`font-extrabold px-3 py-1 rounded-xl border text-xs ${
                          noteVal >= 12 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          noteVal >= 10 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {noteVal} / 20
                        </span>
                      </td>
                      <td className="p-5 text-slate-400 font-medium">{g.type || "Évaluation"}</td>
                      <td className="p-5 text-right text-xs text-slate-500 font-mono">
                        {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "Récemment"}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}