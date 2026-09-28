import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Users, GraduationCap, FileText, ArrowUpRight, BookOpen, Clock, ShieldAlert, Sparkles } from "lucide-react";
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
      
      {/* En-tête de bienvenue */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-2">
            <Sparkles size={13} /> Session Administrateur Active
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Tableau de bord</h1>
          <p className="text-slate-300 text-sm">
            Ravi de vous revoir, <span className="text-white font-semibold">{session?.user?.name || "Administrateur"}</span>. Voici la vue d'ensemble de l'établissement.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Link 
            href="/admin/students" 
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 group"
          >
            Gérer les élèves <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Cartes de Statistiques Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Élèves */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Élèves</span>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap size={24} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-slate-900">{totalStudents}</h3>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Actifs</span>
          </div>
        </div>

        {/* Classes */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classes Actives</span>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-slate-900">{totalClasses}</h3>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Niveaux</span>
          </div>
        </div>

        {/* Enseignants */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-100 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enseignants</span>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-slate-900">{totalTeachers}</h3>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Corps professoral</span>
          </div>
        </div>

        {/* Impayés */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-amber-100 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Factures en attente</span>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-amber-600">{pendingInvoices}</h3>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Impayés</span>
          </div>
        </div>

      </div>

      {/* Section Accès Rapides */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Accès Rapides</h3>
            <p className="text-xs text-slate-500">Navigation instantanée vers les modules clés de gestion</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/admin/students" 
            className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-200 transition-all text-center group flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap size={20} />
            </div>
            <span className="font-semibold text-slate-800 text-sm">Élèves</span>
            <span className="text-[11px] text-slate-400">Dossiers & inscriptions</span>
          </Link>

          <Link 
            href="/admin/grades" 
            className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all text-center group flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen size={20} />
            </div>
            <span className="font-semibold text-slate-800 text-sm">Notes & Bulletins</span>
            <span className="text-[11px] text-slate-400">Suivi des trimestres</span>
          </Link>

          <Link 
            href="/admin/absences" 
            className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-purple-50/40 hover:border-purple-200 transition-all text-center group flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={20} />
            </div>
            <span className="font-semibold text-slate-800 text-sm">Absences</span>
            <span className="text-[11px] text-slate-400">Assiduité & retards</span>
          </Link>

          <Link 
            href="/admin/billing" 
            className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all text-center group flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
            <span className="font-semibold text-slate-800 text-sm">Facturation</span>
            <span className="text-[11px] text-slate-400">Scolarité & paiements</span>
          </Link>
        </div>
      </div>

    </div>
  );
}