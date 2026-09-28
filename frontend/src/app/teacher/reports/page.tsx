// src/app/teacher/reports/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { FileText, Award, GraduationCap, BookOpen, Send, Calendar } from "lucide-react"

export default async function TeacherReportsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = (session.user as any).role
  if (role !== "TEACHER" && role !== "ADMIN") redirect("/login")

  const teacherId = (session.user as any).id

  // 1. Récupérer les affectations du prof (classes + matières autorisées)
  const assignments = await prisma.teachingAssignment.findMany({
    where: { teacherId: role === "ADMIN" ? undefined : teacherId },
    include: { class: true }
  })

  const allowedClassIds = assignments.map(a => a.classId)
  const allowedSubjects = [...new Set(assignments.map(a => a.subject))]

  // 2. Récupérer tous les élèves de ces classes
  const students = await prisma.student.findMany({
    where: { classId: { in: allowedClassIds } },
    include: { user: true, class: true, grades: true },
    orderBy: [{ class: { name: 'asc' } }, { user: { name: 'asc' } }]
  })

  // Server Action pour enregistrer une appréciation ou remarque trimestrielle
  async function saveAppreciation(formData: FormData) {
    "use server"
    const studentId = formData.get("studentId") as string
    const subject = formData.get("subject") as string
    const term = formData.get("term") as string
    const comment = formData.get("comment") as string

    if (!studentId || !subject || !term) return

    // On peut stocker dans une table dédiée ou mettre à jour un champ. 
    // Pour l'exemple, affichons la synthèse des moyennes calculées automatiquement.
    revalidatePath("/teacher/reports")
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-emerald-400" /> Bulletins & Appréciations Trimestrielles
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Visualisez les moyennes de vos élèves et rédigez les appréciations pédagogiques pour les bulletins.
          </p>
        </div>
      </div>

      {/* Liste de synthèse par élève */}
      <div className="space-y-6">
        {students.map(student => {
          // Calcul de la moyenne générale ou par matière de l'élève
          const studentGrades = student.grades;
          const totalPoints = studentGrades.reduce((acc, g) => acc + (g.score * g.coef), 0);
          const totalCoef = studentGrades.reduce((acc, g) => acc + g.coef, 0);
          const generalAverage = totalCoef > 0 ? (totalPoints / totalCoef).toFixed(2) : "N/A";

          return (
            <div key={student.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
                    {student.user.name ? student.user.name.charAt(0).toUpperCase() : "E"}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{student.user.name || student.user.email}</h3>
                    <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">{student.class.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl text-xs flex items-center gap-2">
                    <Award size={14} className="text-amber-400" />
                    <span>Moyenne globale : <strong className="text-white text-sm">{generalAverage} / 20</strong></span>
                  </div>
                </div>
              </div>

              {/* Tableau des notes de l'élève */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-blue-400" /> Notes enregistrées
                  </h4>
                  
                  <div className="space-y-2">
                    {studentGrades.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">Aucune note pour le moment.</p>
                    ) : (
                      studentGrades.map(g => (
                        <div key={g.id} className="flex items-center justify-between text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-300 font-medium">{g.subject} <span className="text-slate-500">({g.term})</span></span>
                          <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{g.score} / 20 (coef {g.coef})</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Formulaire d'appréciation du professeur */}
                <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText size={14} className="text-emerald-400" /> Appréciation trimestrielle
                    </h4>
                    
                    <textarea 
                      placeholder="Ex: Élève sérieux, bon investissement en classe ce trimestre. Encouragements !"
                      className="w-full bg-slate-900 border border-slate-800 text-white p-3 rounded-xl text-xs focus:border-emerald-500 outline-none resize-none h-24"
                    />
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/20">
                      <Send size={14} /> Enregistrer l'avis
                    </button>
                  </div>
                </div>
              </div>

            </div>
          );
        })}

        {students.length === 0 && (
          <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-3xl text-slate-500 space-y-2">
            <GraduationCap size={40} className="mx-auto opacity-20" />
            <p>Aucun élève trouvé dans vos classes assignées.</p>
          </div>
        )}
      </div>

    </div>
  )
}