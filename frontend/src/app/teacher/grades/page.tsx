// src/app/teacher/grades/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Award, BookOpen, GraduationCap, Calendar, Hash, Send, ShieldCheck, Trash2 } from "lucide-react"

export default async function TeacherGradesPage() {
  const session = await auth()
  if (!session) redirect("/login")
  
  const role = (session.user as any).role
  if (role !== "TEACHER" && role !== "ADMIN") redirect("/login")

  const teacherId = (session.user as any).id
  const userName = session.user?.name || "Enseignant"

  // 1. SECURITE : Quelles classes/matières ce prof enseigne?
  const assignments = await prisma.teachingAssignment.findMany({
    where: { teacherId: role === "ADMIN" ? undefined : teacherId },
    include: { class: true }
  })

  if (role === "TEACHER" && assignments.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-slate-900/50 border border-slate-800 rounded-3xl text-center space-y-4 backdrop-blur-xl shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
          <Award size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">Aucune affectation active</h2>
        <p className="text-slate-400 text-sm">
          Vous n'avez pas encore été affecté à une classe. Veuillez contacter l'administrateur de l'établissement.
        </p>
      </div>
    )
  }

  const allowedClassIds = assignments.map(a => a.classId)
  const allowedSubjects = [...new Set(assignments.map(a => a.subject))]

  // 2. Récupération des élèves des classes autorisées
  const students = await prisma.student.findMany({
    where: { classId: { in: allowedClassIds } },
    include: { class: true, user: true },
    orderBy: { user: { name: 'asc' } }
  })

  // 3. Récupération des notes récentes pour affichage de contrôle
  const recentGrades = await prisma.grade.findMany({
    where: { student: { classId: { in: allowedClassIds } } },
    include: { student: { include: { user: true, class: true } } },
    orderBy: { createdAt: "desc" },
    take: 20
  })

  // Server Action sécurisée
  async function submitGrade(formData: FormData) {
    "use server"
    const session = await auth()
    const teacherId = (session?.user as any).id
    const role = (session?.user as any).role

    const studentId = formData.get("studentId") as string
    const subject = formData.get("subject") as string
    const classId = formData.get("classId") as string
    const score = parseFloat(formData.get("score") as string)
    const coef = parseInt(formData.get("coef") as string) || 1
    const term = formData.get("term") as string

    if (!studentId || !subject || !classId || isNaN(score) || !term) return

    // Vérification de sécurité rigoureuse à la saisie
    if (role !== "ADMIN") {
      const allowed = await prisma.teachingAssignment.findFirst({
        where: { teacherId, classId, subject }
      })
      if (!allowed) throw new Error("Non autorisé : tu n'enseignes pas cette matière dans cette classe")

      const studentInClass = await prisma.student.findFirst({ where: { id: studentId, classId } })
      if (!studentInClass) throw new Error("Élève pas dans ta classe")
    }

    await prisma.grade.create({
      data: {
        studentId,
        subject,
        score,
        coef,
        term,
        evaluationDate: new Date()
      }
    })

    revalidatePath("/teacher/grades")
  }

  // Server Action : Suppression d'une note
  async function deleteGrade(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    if (!id) return
    await prisma.grade.delete({ where: { id } })
    revalidatePath("/teacher/grades")
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="text-emerald-400" /> Saisie des notes • Prof. {userName}
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-400" />
            Classes habilitées : {assignments.map(a => `${a.class.name} (${a.subject})`).join(", ")}
          </p>
        </div>
      </div>

      {/* Formulaire de Saisie Premium */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2 relative z-10">
          <Send size={16} className="text-emerald-400" /> Soumettre une évaluation
        </h2>

        <form action={submitGrade} className="grid md:grid-cols-6 gap-4 items-end relative z-10">
          
          {/* Classe */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <GraduationCap size={14} /> Classe
            </label>
            <select name="classId" defaultValue="" className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer" required>
              <option value="" disabled>Classe...</option>
              {assignments.map(a => <option key={a.id} value={a.classId}>{a.class.name}</option>)}
            </select>
          </div>

          {/* Élève */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <GraduationCap size={14} /> Élève
            </label>
            <select name="studentId" defaultValue="" className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer" required>
              <option value="" disabled>Élève...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.user.name || s.user.email}</option>)}
            </select>
          </div>

          {/* Matière */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <BookOpen size={14} /> Matière
            </label>
            <select name="subject" defaultValue="" className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer" required>
              <option value="" disabled>Matière...</option>
              {allowedSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Award size={14} /> Note (/20)
            </label>
            <input name="score" type="number" step="0.25" min="0" max="20" placeholder="Ex: 14.5" className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-emerald-500 outline-none" required />
          </div>

          {/* Trimestre */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Calendar size={14} /> Période
            </label>
            <select name="term" className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-emerald-500 outline-none appearance-none cursor-pointer">
              <option value="T1">Trimestre 1</option>
              <option value="T2">Trimestre 2</option>
              <option value="T3">Trimestre 3</option>
            </select>
          </div>

          {/* Bouton */}
          <div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-sm flex items-center justify-center gap-2">
              <Send size={16} /> Noter
            </button>
          </div>

          <input name="coef" type="hidden" defaultValue="1" />
        </form>
      </div>

      {/* Tableau récapitulatif */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <span className="font-bold text-white">Notes enregistrées pour vos classes</span>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
            {recentGrades.length} enregistrements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 font-semibold">Élève</th>
                <th className="p-4 font-semibold">Classe</th>
                <th className="p-4 font-semibold">Matière</th>
                <th className="p-4 font-semibold">Note</th>
                <th className="p-4 font-semibold">Trimestre</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentGrades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <Award className="mx-auto mb-3 opacity-20" size={32} />
                    Aucune note saisie pour le moment.
                  </td>
                </tr>
              ) : (
                recentGrades.map(g => {
                  const isGood = g.score >= 12;
                  const isAverage = g.score >= 10 && g.score < 12;

                  return (
                    <tr key={g.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="p-4 font-bold text-white">{g.student.user.name || g.student.user.email}</td>
                      <td className="p-4">
                        <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-md text-xs font-bold">
                          {g.student.class.name}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">{g.subject}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                          isGood 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : isAverage 
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {g.score} / 20
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs">{g.term}</td>
                      <td className="p-4 text-right">
                        <form action={deleteGrade}>
                          <input type="hidden" name="id" value={g.id} />
                          <button type="submit" className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors inline-flex" title="Supprimer">
                            <Trash2 size={16} />
                          </button>
                        </form>
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