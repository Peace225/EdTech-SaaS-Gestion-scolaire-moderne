import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { 
  GraduationCap, Users, BookOpen, AlertCircle, 
  Sparkles, ArrowRight, Shield, Wallet, Activity
} from "lucide-react"

export default async function AdminDashboard() {
  // Récupération de la session pour l'accueil personnalisé
  const session = await auth()

  // Requêtes optimisées en parallèle
  const [nbStudents, nbParents, nbTeachers, nbInvoices, impayes] = await Promise.all([
    prisma.student.count(),
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.invoice.count(),
    prisma.invoice.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } })
  ])

  const totalImpayes = impayes._sum.amount || 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* En-tête de bienvenue Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800 p-8 rounded-3xl text-white relative overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Sparkles size={14} /> Centre de Contrôle • Abidjan
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Bonjour, {session?.user?.name || "Administrateur"} 👋
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Voici la vue d'ensemble de l'établissement aujourd'hui. Tout est sous contrôle, les indicateurs sont à jour.
          </p>
        </div>
        
        <div className="relative z-10 hidden md:flex items-center gap-3">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner">
            <Shield size={24} />
          </div>
        </div>
      </div>

      {/* Cartes de Statistiques (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI Élèves */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl hover:border-blue-500/30 transition-all group backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-blue-500">
            <GraduationCap size={100} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Élèves</span>
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-extrabold text-white">{nbStudents}</h3>
            <p className="text-xs text-slate-400 mt-1">Inscrits cette année</p>
          </div>
        </div>

        {/* KPI Parents */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/30 transition-all group backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-emerald-500">
            <Users size={100} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Comptes Parents</span>
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <Users size={18} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-extrabold text-white">{nbParents}</h3>
            <p className="text-xs text-slate-400 mt-1">Liés aux dossiers</p>
          </div>
        </div>

        {/* KPI Professeurs */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl hover:border-purple-500/30 transition-all group backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-purple-500">
            <BookOpen size={100} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Corps professoral</span>
            <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center border border-purple-500/20">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-extrabold text-white">{nbTeachers}</h3>
            <p className="text-xs text-slate-400 mt-1">Enseignants actifs</p>
          </div>
        </div>

        {/* KPI Impayés (Mise en évidence) */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 p-6 rounded-3xl hover:border-amber-500/40 transition-all group backdrop-blur-xl relative overflow-hidden shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 text-amber-500">
            <AlertCircle size={100} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500/80">Scolarité Impayée</span>
            <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/30 shadow-inner">
              <Wallet size={18} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {totalImpayes.toLocaleString()} <span className="text-lg font-bold text-amber-500/70">FCFA</span>
            </h3>
            <p className="text-xs text-amber-500/60 mt-1">{nbInvoices} factures générées au total</p>
          </div>
        </div>

      </div>

      {/* Raccourcis Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/students" className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl hover:bg-slate-900/60 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
              <GraduationCap size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white">Gérer les dossiers élèves</h4>
              <p className="text-xs text-slate-500">Inscriptions, classes et liaisons parents</p>
            </div>
          </div>
          <ArrowRight className="text-slate-600 group-hover:text-white transition-colors group-hover:translate-x-1" size={20} />
        </Link>

        <Link href="/admin/invoices" className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl hover:bg-slate-900/60 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
              <Activity size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white">Suivi de facturation</h4>
              <p className="text-xs text-slate-500">Paiements Wave/OM, impayés et reçus</p>
            </div>
          </div>
          <ArrowRight className="text-slate-600 group-hover:text-white transition-colors group-hover:translate-x-1" size={20} />
        </Link>
      </div>

    </div>
  )
}