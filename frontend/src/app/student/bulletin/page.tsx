// src/app/student/bulletin/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getBulletin, getBulletinAnnuel } from "@/lib/bulletin"
import { PrintButton } from "@/components/PrintButton"
import { notFound, redirect } from "next/navigation"
import { Sparkles, FileText, Award, GraduationCap } from "lucide-react"

export default async function StudentBulletinPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const userId = (session.user as any).id
  const role = (session.user as any).role

  // 1. SECURITE ELEVE : On récupère l'élève lié à ce compte User uniquement
  const student = await prisma.student.findFirst({
    where: {
      userId: role === "ADMIN" ? undefined : userId,
      ...(role === "STUDENT" ? { userId } : {}),
    },
    include: {
      user: true,
      class: true,
    }
  })

  if (role === "STUDENT" && !student) {
    notFound()
  }

  if (role === "PARENT") {
    redirect("/parent/dashboard")
  }

  if (!student) {
    notFound()
  }

  // 2. Calculs sécurisés
  const [t1, t2, t3, annuel] = await Promise.all([
    getBulletin(student.id, "T1"),
    getBulletin(student.id, "T2"),
    getBulletin(student.id, "T3"),
    getBulletinAnnuel(student.id),
  ])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative print:p-0 print:space-y-4 print:bg-white print:text-black">
      
      {/* Effets lumineux d'arrière-plan (masqués à l'impression) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none print:hidden" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none print:hidden" />

      {/* En-tête Premium (Masqué à l'impression) */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl print:hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Bilan Académique Officiel
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Mon Bulletin Scolaire
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            {student.user.name} • <strong className="text-slate-200">{student.class?.name}</strong> • Année 2025-2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PrintButton />
        </div>
      </div>

      {/* Version du Bulletin (Glassmorphism Dark UI & Prêt pour impression) */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative z-10 print:bg-white print:text-black print:border-none print:shadow-none print:rounded-none">
        
        {/* En-tête du document officiel */}
        <div className="p-8 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:border-slate-300 print:p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GraduationCap size={22} className="text-blue-400 print:hidden" />
              <p className="font-extrabold text-xl tracking-tight text-white print:text-black">EdTech Scolaire • Abidjan</p>
            </div>
            <p className="text-xs text-slate-400 print:text-slate-600">Bulletin Officiel de Notes • Document Sécurisé</p>
          </div>
          <div className="text-left sm:text-right space-y-0.5 bg-slate-950/80 print:bg-gray-50 border border-slate-800 print:border-slate-200 p-4 rounded-2xl print:p-2">
            <p className="font-bold text-white print:text-black text-base">{student.user.name}</p>
            <p className="text-xs text-indigo-400 font-semibold">{student.class.name} ({student.class.level})</p>
          </div>
        </div>

        {/* Grille des moyennes trimestrielles et annuelle */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-slate-800/80 bg-slate-950/50 print:bg-white print:border-slate-300 print:gap-2">
          
          <div className="bg-slate-900/80 print:bg-gray-50 border border-slate-800 print:border-slate-300 p-4 rounded-2xl text-center space-y-1">
            <p className="text-xs text-slate-400 print:text-slate-600 uppercase font-bold">Trimestre 1</p>
            <p className="text-2xl font-extrabold text-white print:text-black">{t1.moyenneGenerale} <span className="text-xs text-slate-500 font-normal">/20</span></p>
            <p className="text-[11px] text-indigo-400 font-medium">{t1.mention || "En cours"}</p>
          </div>

          <div className="bg-slate-900/80 print:bg-gray-50 border border-slate-800 print:border-slate-300 p-4 rounded-2xl text-center space-y-1">
            <p className="text-xs text-slate-400 print:text-slate-600 uppercase font-bold">Trimestre 2</p>
            <p className="text-2xl font-extrabold text-white print:text-black">{t2.moyenneGenerale} <span className="text-xs text-slate-500 font-normal">/20</span></p>
            <p className="text-[11px] text-indigo-400 font-medium">{t2.mention || "En attente"}</p>
          </div>

          <div className="bg-slate-900/80 print:bg-gray-50 border border-slate-800 print:border-slate-300 p-4 rounded-2xl text-center space-y-1">
            <p className="text-xs text-slate-400 print:text-slate-600 uppercase font-bold">Trimestre 3</p>
            <p className="text-2xl font-extrabold text-white print:text-black">{t3.moyenneGenerale} <span className="text-xs text-slate-500 font-normal">/20</span></p>
            <p className="text-[11px] text-indigo-400 font-medium">{t3.mention || "En attente"}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 print:bg-black print:text-white border border-blue-500/30 p-4 rounded-2xl text-center space-y-1 text-white shadow-lg">
            <p className="text-xs text-blue-200 uppercase font-bold">Annuelle</p>
            <p className="text-2xl font-extrabold">{annuel.annuelle} <span className="text-xs text-blue-200 font-normal">/20</span></p>
            <p className="text-[11px] text-blue-100 font-medium">Bilan global</p>
          </div>

        </div>

        {/* Blocs par Trimestre */}
        {[
          { label: "Trimestre 1", data: t1 },
          { label: "Trimestre 2", data: t2 },
          { label: "Trimestre 3", data: t3 },
        ].map(block => (
          <div key={block.label} className="p-6 md:p-8 space-y-4 border-b border-slate-800/80 last:border-none print:border-slate-300 print:p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-white print:text-black text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> {block.label}
              </h3>
              <span className="text-xs text-slate-400 print:text-slate-600 bg-slate-950 print:bg-gray-100 px-3 py-1 rounded-xl border border-slate-800 print:border-slate-300">
                {block.data.subjects.length} matière(s) évaluée(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-slate-800/80 print:border-slate-300 rounded-2xl overflow-hidden">
                <thead className="bg-slate-950/80 print:bg-gray-100 text-slate-400 print:text-black text-xs uppercase tracking-wider border-b border-slate-800/80 print:border-slate-300">
                  <tr>
                    <th className="p-4 font-semibold">Matière</th>
                    <th className="p-4 font-semibold">Notes obtenues</th>
                    <th className="p-4 font-semibold text-center">Coefficient</th>
                    <th className="p-4 font-semibold text-right">Moyenne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-300 text-slate-300 print:text-black">
                  {block.data.subjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                        Aucune note saisie pour cette période.
                      </td>
                    </tr>
                  ) : (
                    block.data.subjects.map(s => (
                      <tr key={s.subject} className="hover:bg-slate-800/40 print:hover:bg-transparent transition-colors">
                        <td className="p-4 font-bold text-white print:text-black">{s.subject}</td>
                        <td className="p-4 font-mono text-slate-400 print:text-slate-700">{s.notes.length > 0 ? s.notes.join(", ") : "Aucune note"}</td>
                        <td className="p-4 text-center font-medium">{s.coef}</td>
                        <td className="p-4 text-right font-extrabold text-emerald-400 print:text-black">
                          {s.moyenne} / 20
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}