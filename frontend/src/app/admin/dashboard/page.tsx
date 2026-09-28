import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Users, GraduationCap, FileText, ArrowUpRight, BookOpen, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  
  const [totalStudents, totalClasses, pendingInvoices, totalTeachers] = await Promise.all([
    prisma.student.count(),
    prisma.class.count(),
    prisma.invoice.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* En-tête de bienvenue - Style Glassmorphism Dark */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/50 border border-slate-800 p-8 rounded-3xl text-white relative overflow-hidden backdrop-blur-xl">
        {/* Effets de lueur en arrière-plan */}
        <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Sparkles size={14} className="text-blue-400" /> Session Administrateur Active
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Tableau de bord</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Ravi de vous revoir, <span className="text-slate-200 font-semibold">{session?.user?.name || "Administrateur"}</span>. Voici la vue d'ensemble de l'établissement.
          </p>
        </div>
        <div className="relative z-10">
          <Link 
            href="/admin/students" 
            className="bg-white text-black hover:bg-slate-200 px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 group"
          >
            Gérer les élèves 
            <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Cartes de Statistiques Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Élèves */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-blue-500/30 hover:bg-slate-900 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Élèves</span>
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
              <GraduationCap size={22} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-white">{totalStudents}</h3>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Actifs</span>
          </div>
        </div>

        {/* Classes */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Classes</span>
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
              <Users size={22} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-white">{totalClasses}</h3>
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">Niveaux</span>
          </div>
        </div>

        {/* Enseignants */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-900 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Enseignants</span>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <BookOpen size={22} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-white">{totalTeachers}</h3>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Staff</span>
          </div>
        </div>

        {/* Impayés */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-amber-500/30 hover:bg-slate-900 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Factures PENDING</span>
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
              <FileText size={22} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-white">{pendingInvoices}</h3>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">En attente</span>
          </div>
        </div>

      </div>

      {/* Section Accès Rapides */}
      <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white">Accès Rapides</h3>
          <p className="text-sm text-slate-500">Navigation instantanée vers les modules clés</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/admin/students" 
            className="p-5 rounded-2xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-blue-500/30 transition-all text-center group flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:border-blue-500/30 transition-all">
              <GraduationCap size={20} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block">Élèves</span>
              <span className="text-xs text-slate-500">Dossiers & inscriptions</span>
            </div>
          </Link>

          <Link 
            href="/admin/assignments" 
            className="p-5 rounded-2xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-indigo-500/30 transition-all text-center group flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-500/30 transition-all">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block">Affectations</span>
              <span className="text-xs text-slate-500">Profs & Matières</span>
            </div>
          </Link>

          <Link 
            href="/admin/classes" 
            className="p-5 rounded-2xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-purple-500/30 transition-all text-center group flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:border-purple-500/30 transition-all">
              <Users size={20} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block">Classes</span>
              <span className="text-xs text-slate-500">Gestion des niveaux</span>
            </div>
          </Link>

          <Link 
            href="/admin/invoices" 
            className="p-5 rounded-2xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-emerald-500/30 transition-all text-center group flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:border-emerald-500/30 transition-all">
              <FileText size={20} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block">Facturation</span>
              <span className="text-xs text-slate-500">Scolarité & paiements</span>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}