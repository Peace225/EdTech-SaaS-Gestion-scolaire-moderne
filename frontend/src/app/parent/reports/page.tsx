// src/app/parent/reports/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getBulletin } from "@/lib/bulletin"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FileText, Sparkles, Award, ArrowRight, Download } from "lucide-react"

export default async function ParentReportsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const parentId = (session.user as any).id

  // Récupérer les enfants liés au parent
  const children = await prisma.student.findMany({
    where: { parentId },
    include: {
      user: true,
      class: true,
    }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Espace Académique
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Bulletins & Avis Scolaires
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Consultez et téléchargez les bulletins officiels par trimestre et les communiqués de l'établissement.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <FileText size={20} className="text-purple-400" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Documents</p>
            <p className="text-sm font-extrabold text-white">{children.length} Dossier(s)</p>
          </div>
        </div>
      </div>

      {/* Liste des bulletins par enfant */}
      <div className="space-y-6 relative z-10">
        {await Promise.all(children.map(async (child) => {
          const bulletinT1 = await getBulletin(child.id, "T1")
          const studentName = child.user?.name || "Élève"

          return (
            <div 
              key={child.id} 
              className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-white">{studentName}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Classe : <strong className="text-indigo-400">{child.class?.name || "Non assignée"}</strong> • Moyenne Trimestre 1 : <strong className="text-white">{bulletinT1.moyenneGenerale}/20</strong>
                  </p>
                </div>

                <Link 
                  href={`/parent/child/${child.id}`}
                  className="bg-white hover:bg-slate-200 text-black px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg w-fit"
                >
                  <span>Voir le dossier complet</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                
                {/* Trimestre 1 */}
                <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Trimestre 1</span>
                    <p className="text-lg font-bold text-white">{bulletinT1.moyenneGenerale} / 20</p>
                    <p className="text-xs text-slate-400">Mention : <strong className="text-slate-200">{bulletinT1.mention || "En cours"}</strong></p>
                  </div>
                  <Link 
                    href={`/parent/child/${child.id}`}
                    className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1 pt-2 border-t border-slate-900"
                  >
                    <Download size={13} /> Consulter le bulletin T1
                  </Link>
                </div>

                {/* Trimestre 2 */}
                <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-3 flex flex-col justify-between opacity-75">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trimestre 2</span>
                    <p className="text-lg font-bold text-slate-400">En attente</p>
                    <p className="text-xs text-slate-600">Non disponible</p>
                  </div>
                  <span className="text-xs text-slate-600 pt-2 border-t border-slate-900">Ouverture prochaine</span>
                </div>

                {/* Trimestre 3 */}
                <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-3 flex flex-col justify-between opacity-75">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trimestre 3</span>
                    <p className="text-lg font-bold text-slate-400">En attente</p>
                    <p className="text-xs text-slate-600">Non disponible</p>
                  </div>
                  <span className="text-xs text-slate-600 pt-2 border-t border-slate-900">Ouverture prochaine</span>
                </div>

              </div>
            </div>
          )
        }))}
      </div>

    </div>
  )
}