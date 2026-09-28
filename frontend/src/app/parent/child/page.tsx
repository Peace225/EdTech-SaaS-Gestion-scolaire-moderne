// src/app/parent/child/page.tsx
import { getParentStudents } from "@/lib/parent-security"
import { getBulletin } from "@/lib/bulletin"
import Link from "next/link"
import { Users, GraduationCap, ArrowRight, Sparkles, Award, Wallet } from "lucide-react"

// Composant interne pour gérer l'asynchronisme par enfant proprement
async function ChildCard({ child }: { child: any }) {
  const bulletinT1 = await getBulletin(child.id, "T1")
  const studentName = child.user?.name || child.user?.email || "Élève"
  const initials = studentName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
  
  const impayes = child.invoices 
    ? child.invoices.filter((i: any) => i.status === "PENDING").reduce((a: number, b: any) => a + b.amount, 0) 
    : 0

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6 transition-all flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-600/20">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{studentName}</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-1">
                {child.class?.name || "Classe non assignée"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl space-y-1">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1">
              <Award size={12} className="text-emerald-400" /> Moyenne T1
            </p>
            <p className="text-xl font-extrabold text-white">
              {bulletinT1?.moyenneGenerale ?? "--"} <span className="text-xs text-slate-500">/20</span>
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl space-y-1">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1">
              <Wallet size={12} className={impayes > 0 ? "text-amber-400" : "text-blue-400"} /> Factures
            </p>
            <p className={`text-sm font-extrabold truncate ${impayes > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {impayes > 0 ? `${impayes.toLocaleString()} FCFA` : "À jour"}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-xs text-slate-500">Profil vérifié et sécurisé</span>
        <Link 
          href={`/parent/child/${child.id}`} 
          className="bg-white hover:bg-slate-200 text-black px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-white/5"
        >
          <span>Voir le dossier</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

export default async function ParentChildListingPage() {
  const children = await getParentStudents()

  if (!children || children.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-slate-900/50 border border-slate-800 rounded-3xl text-center space-y-4 backdrop-blur-xl shadow-2xl">
        <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
          <Users size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">Aucun enfant rattaché</h2>
        <p className="text-slate-400 text-sm">
          Aucun profil d'élève n'est actuellement lié à votre compte parent. Veuillez contacter l'administration de l'établissement.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Gestion de la Famille
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Mes Enfants Inscrits
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Retrouvez la liste complète de vos enfants scolarisés, leurs classes respectives et l'accès direct à leurs dossiers.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <GraduationCap size={20} className="text-blue-400" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Effectif</p>
            <p className="text-sm font-extrabold text-white">{children.length} Enfant(s)</p>
          </div>
        </div>
      </div>

      {/* Grille des enfants */}
      <div className="grid md:grid-cols-2 gap-6 relative z-10">
        {children.map((child: any) => (
          <ChildCard key={child.id} child={child} />
        ))}
      </div>

    </div>
  )
}