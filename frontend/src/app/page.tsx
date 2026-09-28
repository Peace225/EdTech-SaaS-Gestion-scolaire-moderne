// src/app/page.tsx
import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { GraduationCap, Users, CreditCard, BarChart3, ArrowRight, Sparkles } from "lucide-react"

export default async function Home() {
  const session = await auth()
  
  // Si l'utilisateur est connecté, on le redirige vers son dashboard respectif
  if (session?.user) {
    const role = (session.user as any).role
    if (role === "ADMIN") redirect("/admin/dashboard")
    if (role === "TEACHER") redirect("/teacher/dashboard")
    if (role === "PARENT") redirect("/parent/dashboard")
    if (role === "STUDENT") redirect("/student/dashboard")
  }

  // S'il est déconnecté, il reste sur la page d'accueil
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white relative overflow-hidden">
      
      {/* Effets de lumière en arrière-plan (glows) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
            <Sparkles size={14} className="text-blue-400 animate-pulse" />  EdTech SaaS • Gestion scolaire moderne
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            La gestion scolaire <br />réinventée et fluide.
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Notes, absences, facturation en FCFA et portail dédié aux parents. Une plateforme SaaS hautement sécurisée pour les établissements modernes.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link 
              href="/login" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl shadow-blue-600/25 transition-all flex items-center gap-2"
            >
              Accéder au dashboard <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Features Grid Premium */}
        <div className="grid md:grid-cols-3 gap-6 mt-28">
          
          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-blue-500/50 p-8 rounded-3xl transition-all group backdrop-blur-sm">
            <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <GraduationCap size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Suivi Pédagogique</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Gestion complète des notes par trimestre, calcul automatisé des moyennes et génération instantanée des bulletins.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/50 p-8 rounded-3xl transition-all group backdrop-blur-sm">
            <div className="w-14 h-14 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Portail Parents Sécurisé</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Espace dédié où chaque parent accède uniquement aux informations, notes et factures de ses propres enfants.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/50 p-8 rounded-3xl transition-all group backdrop-blur-sm">
            <div className="w-14 h-14 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CreditCard size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Facturation & Scolarité</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Suivi clair des frais (ex: 150 000 FCFA), gestion des statuts PENDING / PAID et relances automatisées.
            </p>
          </div>

        </div>

        {/* Section Comptes de test (Seed) */}
        <div className="mt-28 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-blue-400 text-xs font-semibold tracking-wider uppercase">
                <BarChart3 size={16} /> Prêt à tester
              </div>
              <h3 className="text-2xl font-bold text-white">Comptes de test générés</h3>
              <p className="text-slate-400 text-sm">Utilisez le mot de passe unique pour tous les comptes : <code className="bg-slate-800 text-blue-400 px-2 py-1 rounded font-mono">admin123</code></p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl text-left">
                <span className="text-[10px] tracking-wider uppercase font-bold text-blue-400 block mb-1">ADMIN</span>
                <span className="text-xs text-slate-300 font-mono truncate block">admin@ecole.ci</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl text-left">
                <span className="text-[10px] tracking-wider uppercase font-bold text-indigo-400 block mb-1">TEACHER</span>
                <span className="text-xs text-slate-300 font-mono truncate block">teacher@ecole.ci</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl text-left">
                <span className="text-[10px] tracking-wider uppercase font-bold text-emerald-400 block mb-1">PARENT</span>
                <span className="text-xs text-slate-300 font-mono truncate block">parent@ecole.ci</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl text-left">
                <span className="text-[10px] tracking-wider uppercase font-bold text-amber-400 block mb-1">STUDENT</span>
                <span className="text-xs text-slate-300 font-mono truncate block">eleve@ecole.ci</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 mt-16 space-y-1">
          <p>Next.js 16.3.6 Turbopack • Prisma 6.12.0 • PostgreSQL • Auth.js v5</p>
          <p className="text-slate-600">Conçu et développé à Abidjan, Côte d'Ivoire 🇨🇮</p>
        </div>

      </main>
    </div>
  )
}