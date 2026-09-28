// src/app/student/dashboard/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { 
  GraduationCap, Award, BookOpen, Clock, 
  Sparkles, CheckCircle2, AlertCircle 
} from "lucide-react"

export default async function StudentDashboard() {
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

  if (!student) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-slate-900/50 border border-slate-800 rounded-3xl text-center space-y-4 backdrop-blur-xl shadow-2xl text-white">
        <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold">Profil élève non trouvé</h2>
        <p className="text-slate-400 text-sm">
          Votre compte n'est pas encore lié à un profil élève. Veuillez contacter l'administrateur de l'établissement.
        </p>
      </div>
    )
  }

  // Calcul sécurisé de la moyenne générale
  const gradesList = student.grades || []
  const moyenne = gradesList.length > 0 
    ? (gradesList.reduce((acc, g: any) => acc + (g.score ?? g.value ?? 0), 0) / gradesList.length).toFixed(2) 
    : "N/A"

  const moyenneNum = parseFloat(moyenne) || 0
  const isGoodAverage = moyenneNum >= 12
  const isAverage = moyenneNum >= 10 && moyenneNum < 12

  const studentName = student.user?.name || session.user?.name || "Élève"
  const initials = studentName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-600/20 shrink-0">
            {initials}
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
              <Sparkles size={14} /> Espace Élève • Abidjan
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Bonjour, {studentName} 🎓
            </h1>
            <p className="text-sm text-slate-400">
              Classe : <strong className="text-slate-200">{student.class?.name || "Non assignée"}</strong> {student.class?.level ? `(${student.class.level})` : ""}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-6 py-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award size={24} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Moyenne Générale</p>
            <p className={`text-xl font-extrabold ${isGoodAverage ? "text-emerald-400" : isAverage ? "text-amber-400" : "text-white"}`}>
              {moyenne} <span className="text-xs text-slate-500 font-normal">/20</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tableau des notes récentes */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative z-10">
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-400" /> Historique de mes Évaluations
          </h3>
          <span className="text-xs text-slate-500 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
            {gradesList.length} note(s) enregistrée(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="p-5 font-semibold">Matière</th>
                <th className="p-5 font-semibold">Note obtenue</th>
                <th className="p-5 font-semibold">Type d'évaluation</th>
                <th className="p-5 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {gradesList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                    Aucune note enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                gradesList.map((g: any) => {
                  const noteVal = g.score ?? g.value ?? 0
                  return (
                    <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-5 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> {g.subject}
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