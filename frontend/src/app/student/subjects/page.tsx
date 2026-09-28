// src/app/student/subjects/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Layers, Sparkles, BookOpen, User } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StudentSubjectsPage() {
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

  if (role === "STUDENT" && !student) redirect("/login")
  if (role === "PARENT") redirect("/parent/dashboard")
  if (!student) redirect("/login")

  const subjects = [
    { id: "math", name: "Mathématiques", coef: 5, teacher: "M. Kouassi", hours: "6h / semaine", description: "Analyse, suites numériques, probabilités et algèbre linéaire." },
    { id: "phys", name: "Physique-Chimie", coef: 4, teacher: "Mme Diallo", hours: "5h / semaine", description: "Mécanique du point, lois de Newton et chimie en solution." },
    { id: "fra", name: "Français", coef: 4, teacher: "Mme Touré", hours: "4h / semaine", description: "Littérature du XIXe au XXIe siècle, dissertation et commentaire." },
    { id: "ang", name: "Anglais LV1", coef: 3, teacher: "Mr Smith", hours: "3h / semaine", description: "Compréhension écrite, expression orale et grammaire avancée." },
    { id: "svt", name: "SVT", coef: 3, teacher: "M. Yao", hours: "3h / semaine", description: "Génétique, biologie cellulaire et géologie." },
    { id: "hg", name: "Histoire-Géographie", coef: 2, teacher: "M. Koné", hours: "3h / semaine", description: "Géopolitique mondiale et mondialisation contemporaine." },
    { id: "eps", name: "Éducation Physique & Sportive", coef: 2, teacher: "M. Bamba", hours: "2h / semaine", description: "Sports collectifs, endurance et épreuves physiques." }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Programme Officiel • Abidjan
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Matières & Disciplines Enseignées
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Découvrez l'ensemble des matières, les coefficients associés et les enseignants référents pour la classe de <strong className="text-slate-200">{student.class?.name || "Terminale"}</strong>.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-6 py-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Total Matières</p>
            <p className="text-sm font-extrabold text-white">{subjects.length} Disciplines</p>
          </div>
        </div>
      </div>

      {/* Grille des Matières */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {subjects.map((subj) => (
          <div 
            key={subj.id}
            className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-extrabold uppercase">
                  Coef. {subj.coef}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                  <BookOpen size={12} className="text-blue-400" /> {subj.hours}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white">{subj.name}</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {subj.description}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User size={14} className="text-slate-500" /> {subj.teacher}
              </span>
              <span className="text-indigo-400 font-semibold">Actif</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}