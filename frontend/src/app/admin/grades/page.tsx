import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Award, BookOpen, Plus, Trash2, GraduationCap, Calendar, Hash, Layers } from "lucide-react"

// Liste standard des matières
const SUBJECTS = [
  "Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT",
  "Histoire-Géographie", "Philosophie", "Espagnol", "Allemand", "EPS",
  "Informatique", "EDHC", "Arts Plastiques", "Musique"
]

export default async function AdminGradesPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login")
  }

  // Server Action : Ajouter une note
  async function createGrade(formData: FormData) {
    "use server"
    const studentId = formData.get("studentId") as string
    const subject = formData.get("subject") as string
    const score = parseFloat(formData.get("score") as string)
    const coef = parseInt(formData.get("coef") as string) || 1
    const term = formData.get("term") as string

    if (!studentId || !subject || isNaN(score) || !term) return

    await prisma.grade.create({
      data: {
        studentId,
        subject,
        score,
        coef,
        term,
      }
    })

    revalidatePath("/admin/grades")
  }

  // Server Action : Supprimer une note
  async function deleteGrade(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    if (!id) return

    await prisma.grade.delete({ where: { id } })
    revalidatePath("/admin/grades")
  }

  // Récupération des élèves et des notes existantes
  const [students, grades] = await Promise.all([
    prisma.student.findMany({
      include: { user: true, class: true },
      orderBy: { class: { name: 'asc' } }
    }),
    prisma.grade.findMany({
      include: {
        student: {
          include: { user: true, class: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="text-blue-400" /> Gestion des Notes & Évaluations
          </h1>
          <p className="text-sm text-slate-400 mt-1">Enregistrez et suivez les performances académiques des élèves.</p>
        </div>
      </div>

      {/* Formulaire de Saisie d'une Note */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2 relative z-10">
          <Plus size={16} className="text-emerald-400" /> Saisir une nouvelle note
        </h2>
        
        <form action={createGrade} className="grid md:grid-cols-5 gap-4 items-end relative z-10">
          
          {/* Sélection de l'élève */}
          <div className="space-y-2 md:col-span-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <GraduationCap size={14} /> Élève
            </label>
            <select name="studentId" defaultValue="" className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-blue-500 outline-none appearance-none cursor-pointer" required>
              <option value="" disabled>Choisir un élève...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.user.name || s.user.email} ({s.class.name})
                </option>
              ))}
            </select>
          </div>

          {/* Sélection de la matière */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <BookOpen size={14} /> Matière
            </label>
            <select name="subject" defaultValue="" className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-blue-500 outline-none appearance-none cursor-pointer" required>
              <option value="" disabled>Matière...</option>
              {SUBJECTS.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          {/* Note sur 20 */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Award size={14} /> Note (/20)
            </label>
            <input 
              name="score" 
              type="number" 
              step="0.25" 
              min="0" 
              max="20" 
              placeholder="Ex: 14.5" 
              className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-blue-500 outline-none" 
              required 
            />
          </div>

          {/* Coefficient */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Hash size={14} /> Coef
            </label>
            <input 
              name="coef" 
              type="number" 
              min="1" 
              max="10" 
              defaultValue="1" 
              className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-blue-500 outline-none" 
              required 
            />
          </div>

          {/* Trimestre */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Calendar size={14} /> Trimestre
            </label>
            <select name="term" defaultValue="Trimestre 1" className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-blue-500 outline-none appearance-none cursor-pointer" required>
              <option value="Trimestre 1">Trimestre 1</option>
              <option value="Trimestre 2">Trimestre 2</option>
              <option value="Trimestre 3">Trimestre 3</option>
            </select>
          </div>

          <div className="md:col-span-5 pt-2">
            <button type="submit" className="w-full bg-white hover:bg-slate-200 text-black font-bold p-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
              <Plus size={18} /> Enregistrer la note
            </button>
          </div>

        </form>
      </div>

      {/* Tableau des notes récentes */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <span className="font-bold text-white">Dernières notes enregistrées</span>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold">
            {grades.length} affichées
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
                <th className="p-4 font-semibold">Coef</th>
                <th className="p-4 font-semibold">Trimestre</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {grades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Award className="mx-auto mb-3 opacity-20" size={32} />
                    Aucune note enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                grades.map(g => {
                  // Couleur dynamique selon la note
                  const isGood = g.score >= 12;
                  const isAverage = g.score >= 10 && g.score < 12;

                  return (
                    <tr key={g.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="p-4 font-bold text-white">
                        {g.student.user.name || g.student.user.email}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-md text-xs font-bold">
                          {g.student.class.name}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">
                        {g.subject}
                      </td>
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
                      <td className="p-4 text-slate-400 text-xs">
                        coef. {g.coef}
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {g.term}
                      </td>
                      <td className="p-4 text-right">
                        <form action={deleteGrade}>
                          <input type="hidden" name="id" value={g.id} />
                          <button type="submit" className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors inline-flex" title="Supprimer la note">
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