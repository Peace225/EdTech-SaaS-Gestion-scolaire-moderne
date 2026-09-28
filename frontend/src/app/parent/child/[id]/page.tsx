// src/app/parent/child/[id]/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getBulletin, getBulletinAnnuel } from "@/lib/bulletin"
import { PrintButton } from "@/components/PrintButton"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, GraduationCap, Award, Wallet, 
  Sparkles, Calendar, BookOpen, AlertCircle, CheckCircle2 
} from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export default async function ParentChildDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect("/login")

  const parentId = (session.user as any).id
  const role = (session.user as any).role

  // 1. SÉCURITÉ : Recherche de l'enfant avec vérification stricte du lien parent
  const child = await prisma.student.findFirst({
    where: {
      id: id,
      parentId: role === "ADMIN" ? undefined : parentId,
    },
    include: {
      user: true,
      class: true,
      grades: { orderBy: { evaluationDate: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  })

  // 2. Si non autorisé ou inexistant -> 404
  if (!child) {
    notFound()
  }

  const [t1, t2, t3] = await Promise.all([
    getBulletin(child.id, "T1"),
    getBulletin(child.id, "T2"),
    getBulletin(child.id, "T3"),
  ])
  const annuel = await getBulletinAnnuel(child.id)

  const impayes = child.invoices.filter(i => i.status === "PENDING" || i.status === "OVERDUE")
  const studentName = child.user?.name || child.user?.email || "Élève"

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <Link 
            href="/parent/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors font-medium mb-1"
          >
            <ArrowLeft size={14} /> Retour à mes enfants
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{studentName}</h1>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">
              {child.class.name}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Dossier académique sécurisé • Tuteur : <strong className="text-slate-300">{session.user?.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PrintButton />
        </div>
      </div>

      {/* Grille des Moyennes Trimestrielles & Annuelle */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 relative z-10">
        
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl space-y-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Trimestre 1</p>
          <p className="text-3xl font-extrabold text-white">{t1.moyenneGenerale}<span className="text-xs text-slate-500 font-normal"> /20</span></p>
          <p className="text-[11px] text-indigo-400 font-medium pt-1">{t1.mention || "En cours"}</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl space-y-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Trimestre 2</p>
          <p className="text-3xl font-extrabold text-white">{t2.moyenneGenerale}<span className="text-xs text-slate-500 font-normal"> /20</span></p>
          <p className="text-[11px] text-indigo-400 font-medium pt-1">{t2.mention || "En attente"}</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl space-y-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Trimestre 3</p>
          <p className="text-3xl font-extrabold text-white">{t3.moyenneGenerale}<span className="text-xs text-slate-500 font-normal"> /20</span></p>
          <p className="text-[11px] text-indigo-400 font-medium pt-1">{t3.mention || "En attente"}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-500/30 p-6 rounded-3xl shadow-xl shadow-blue-600/10 space-y-1 text-white">
          <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Moyenne Annuelle</p>
          <p className="text-3xl font-extrabold">{annuel.annuelle}<span className="text-xs text-blue-200 font-normal"> /20</span></p>
          <p className="text-[11px] text-blue-100 font-medium pt-1">Bilan général</p>
        </div>

      </div>

      {/* Tableau des notes du Trimestre 1 */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative z-10">
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-400" /> Notes & Évaluations (Trimestre 1)
          </h3>
          <span className="text-xs text-slate-500 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">Détail par matière</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800/80">
              <tr>
                <th className="p-5 font-semibold">Matière</th>
                <th className="p-5 font-semibold">Notes obtenues</th>
                <th className="p-5 font-semibold text-right">Moyenne matière</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {t1.subjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-500 italic">
                    Aucune note enregistrée pour ce trimestre.
                  </td>
                </tr>
              ) : (
                t1.subjects.map(s => (
                  <tr key={s.subject} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-5 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> {s.subject}
                    </td>
                    <td className="p-5 text-slate-300 font-mono">
                      {s.notes && s.notes.length > 0 ? s.notes.join(", ") : "Aucune évaluation"}
                    </td>
                    <td className="p-5 text-right font-extrabold text-emerald-400">
                      {s.moyenne} / 20
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Facturation */}
      <div className={`border rounded-3xl p-6 backdrop-blur-xl shadow-xl relative z-10 ${
        impayes.length > 0 
          ? "bg-amber-500/5 border-amber-500/20" 
          : "bg-slate-900/40 border-slate-800/80"
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Wallet size={18} className={impayes.length > 0 ? "text-amber-400" : "text-blue-400"} /> Situation Financière & Facturation
          </h3>
          <span className={`text-xs px-3 py-1 rounded-xl font-bold border ${
            impayes.length > 0 
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}>
            {impayes.length > 0 ? `${impayes.length} facture(s) en attente` : "Compte à jour"}
          </span>
        </div>

        {impayes.length === 0 ? (
          <div className="flex items-center gap-3 py-4 text-slate-300 text-sm">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <span>Aucune facture impayée pour le moment. Tous les frais de scolarité sont réglés.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {impayes.map(f => (
              <div key={f.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-400">Date limite / Échéance : <strong className="text-slate-200">{new Date(f.dueDate).toLocaleDateString()}</strong></p>
                  <p className="text-base font-extrabold text-amber-400">{f.amount.toLocaleString()} FCFA</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1 rounded-lg font-bold uppercase">
                    {f.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}