// src/app/parent/dashboard/page.tsx
import { getParentStudents } from "@/lib/parent-security"
import { getBulletin } from "@/lib/bulletin"
import { PrintButton } from "@/components/PrintButton"
import Link from "next/link"
import {
  Users, Award, ArrowRight,
  Sparkles, GraduationCap, Clock, CheckCircle2, AlertTriangle, Wallet
} from "lucide-react"

export const dynamic = "force-dynamic"

function getStudentName(child: any): string {
  if (child.user?.name) return child.user.name
  if (child.user?.email) return child.user.email.split('@')[0]
  if (child.firstName && child.lastName) return `${child.firstName} ${child.lastName}`
  if (child.firstName) return child.firstName
  return "Élève"
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount)
}

// Carte SYNCHRONE - plus d'async ici
function ChildDashboardCard({ child, bulletinT1 }: { child: any, bulletinT1: any }) {
  const impayes: number = child.invoices
    ? child.invoices.filter((i: any) => i.status === "PENDING").reduce((a: number, b: any) => a + Number(b.amount), 0)
    : 0

  const fullName = getStudentName(child)
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  const moyenneNum = parseFloat(bulletinT1?.moyenneGenerale ?? "0") || 0
  const isGoodAverage = moyenneNum >= 12
  const isAverage = moyenneNum >= 10 && moyenneNum < 12

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 transition-all hover:border-slate-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-600/20">
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-white">{fullName}</h2>
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">
                {child.class?.name || "Classe non assignée"}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Moyenne T1 : <strong className="text-white">{bulletinT1?.moyenneGenerale ?? "--"}/20</strong></span>
              <span>•</span>
              <span className={isGoodAverage ? "text-emerald-400 font-semibold" : isAverage ? "text-amber-400 font-semibold" : "text-red-400 font-semibold"}>
                {bulletinT1?.mention || "En cours"}
              </span>
            </p>
          </div>
        </div>

        <Link
          href={`/parent/child/${child.id}`}
          className="bg-white hover:bg-slate-200 text-black px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5 w-fit"
        >
          <span>Dossier complet</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Award size={14} className="text-emerald-400" /> Dernières notes</span>
            <span className="text-[10px] text-slate-500 font-normal">Évaluations T1</span>
          </div>
          <div className="space-y-2 pt-1">
            {!child.grades || child.grades.length === 0 ? (
              <p className="text-xs text-slate-600 italic py-2">Aucune note enregistrée.</p>
            ) : (
              child.grades.slice(0, 3).map((g: any) => {
                const noteValue = g.value ?? g.score ?? 0
                return (
                  <div key={g.id} className="flex justify-between items-center text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-slate-300 font-medium truncate max-w-[140px]">{g.subject}</span>
                    <span className={`font-extrabold px-2 py-0.5 rounded-md border ${
                      noteValue >= 12 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      noteValue >= 10 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {String(noteValue)} / 20
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-400" /> Assiduité</span>
          </div>
          <div className="py-3">
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-extrabold ${(child.absences?.length || 0) > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {child.absences?.length || 0}
              </p>
              <span className="text-xs text-slate-400">absence(s)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Non justifiée(s) à ce jour</p>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-900 flex items-center gap-1.5">
            {(child.absences?.length || 0) > 0 ? (
              <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={12}/> Attention requise</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12}/> Dossier assiduité parfait</span>
            )}
          </div>
        </div>

        <div className={`border p-5 rounded-2xl flex flex-col justify-between backdrop-blur-xl ${impayes > 0 ? "bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5" : "bg-slate-950/80 border-slate-800/80"}`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className={`flex items-center gap-1.5 ${impayes > 0 ? "text-amber-300" : "text-slate-400"}`}>
              <Wallet size={14} className={impayes > 0 ? "text-amber-400" : "text-blue-400"} /> Scolarité
            </span>
          </div>
          <div className="py-3">
            <p className={`text-3xl font-extrabold truncate ${impayes > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {impayes > 0 ? `${formatFCFA(impayes)} FCFA` : "Soldé"}
            </p>
            <p className="text-xs text-slate-400 mt-1">{impayes > 0 ? "Montant en attente" : "Aucun impayé"}</p>
          </div>
          <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Statut</span>
            <span className={impayes > 0 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>{impayes > 0 ? "En attente" : "À jour"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function ParentDashboard() {
  const children = await getParentStudents()

  if (!children || children.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-slate-900/50 border border-slate-800 rounded-3xl text-center space-y-4 backdrop-blur-xl shadow-2xl">
        <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
          <Users size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">Aucun enfant rattaché</h2>
        <p className="text-slate-400 text-sm">Contactez l'administration.</p>
      </div>
    )
  }

  // FIX: On fetch tous les bulletins AVANT le rendu, plus de async dans le map
  const childrenWithBulletins = await Promise.all(
    children.map(async (child: any) => {
      const bulletinT1 = await getBulletin(String(child.id), "T1").catch(() => null)
      return { child, bulletinT1 }
    })
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 relative">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Portail Parent • Abidjan
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Suivi Scolaire de vos Enfants</h1>
          <p className="text-sm text-slate-400 max-w-xl">Bulletins, notes, absences et situation financière.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-300 flex items-center gap-2">
            <GraduationCap size={16} className="text-blue-400" />
            <span>{children.length} Enfant(s)</span>
          </div>
          <PrintButton />
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {childrenWithBulletins.map(({ child, bulletinT1 }) => (
          <ChildDashboardCard key={child.id} child={child} bulletinT1={bulletinT1} />
        ))}
      </div>
    </div>
  )
}