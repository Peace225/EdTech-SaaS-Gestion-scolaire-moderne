// src/app/parent/layout.tsx
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  LogOut, GraduationCap, LayoutDashboard, 
  Users, Wallet, FileText, Sparkles, MessageSquare
} from "lucide-react"

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  
  const role = (session.user as any).role
  if (role !== "PARENT" && role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar Parent Premium */}
      <aside className="w-64 border-r border-slate-800/80 p-5 flex flex-col justify-between bg-slate-950/80 backdrop-blur-2xl">
        
        {/* Navigation principale */}
        <div className="space-y-6">
          {/* Logo / En-tête */}
          <div className="px-2 py-3 space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full text-[10px] font-semibold">
              <Sparkles size={12} /> Espace Famille
            </div>
            <p className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2 pt-1">
              <GraduationCap size={22} className="text-blue-400" /> PORTAIL <span className="text-blue-400">PARENT</span>
            </p>
            <p className="text-xs text-slate-500">Abidjan, Côte d'Ivoire</p>
          </div>
          
          {/* Liens de navigation */}
          <div className="space-y-1.5">
            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/parent/dashboard"
            >
              <LayoutDashboard size={18} className="text-blue-400 group-hover:scale-110 transition-transform" /> Tableau de bord
            </Link>

            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/parent/child"
            >
              <Users size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" /> Mes Enfants
            </Link>

            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/parent/invoices"
            >
              <Wallet size={18} className="text-amber-400 group-hover:scale-110 transition-transform" /> Factures & Frais
            </Link>

            {/* Lien Messagerie AVEC NOTIFICATION INSTANTANÉE */}
            <Link 
              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-pink-500/5 hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-pink-500/10 hover:border-slate-800" 
              href="/parent/messages"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MessageSquare size={18} className="text-pink-400 group-hover:scale-110 transition-transform" />
                  {/* Point animé (Ping) en haut à droite de l'icône */}
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                  </span>
                </div>
                <span className="text-white font-semibold">Messagerie</span>
              </div>
              {/* Badge du nombre de notifications */}
              <span className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                2
              </span>
            </Link>

            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/parent/reports"
            >
              <FileText size={18} className="text-purple-400 group-hover:scale-110 transition-transform" /> Bulletins & Avis
            </Link>
          </div>
        </div>

        {/* Section utilisateur & Déconnexion en bas */}
        <div className="pt-4 border-t border-slate-800/80 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {session.user?.name ? session.user.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{session.user?.name || "Parent tuteur"}</p>
              <p className="text-[10px] text-slate-400 truncate">{session.user?.email}</p>
            </div>
          </div>

          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}>
            <button 
              type="submit" 
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer group"
            >
              <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Déconnexion
            </button>
          </form>
        </div>

      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-8 bg-black overflow-y-auto">{children}</main>
    </div>
  )
}