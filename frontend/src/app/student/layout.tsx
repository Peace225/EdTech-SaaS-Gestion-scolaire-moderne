// src/app/student/layout.tsx
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  LogOut, GraduationCap, LayoutDashboard, 
  BookOpen, FileText, Calendar, Sparkles, Layers, BookmarkCheck, ClipboardList, PenTool 
} from "lucide-react"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  
  const role = (session.user as any).role
  if (role !== "STUDENT" && role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar Élève Premium */}
      <aside className="w-64 border-r border-slate-800/80 p-5 flex flex-col justify-between bg-slate-950/80 backdrop-blur-2xl">
        
        {/* Navigation principale */}
        <div className="space-y-6">
          {/* Logo / En-tête */}
          <div className="px-2 py-3 space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full text-[10px] font-semibold">
              <Sparkles size={12} /> Espace Élève
            </div>
            <p className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2 pt-1">
              <GraduationCap size={22} className="text-blue-400" /> PORTAIL <span className="text-blue-400">ÉLÈVE</span>
            </p>
            <p className="text-xs text-slate-500">Abidjan, Côte d'Ivoire</p>
          </div>
          
          {/* Liens de navigation */}
          <div className="space-y-1.5">
            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/student/dashboard"
            >
              <LayoutDashboard size={18} className="text-blue-400 group-hover:scale-110 transition-transform" /> Tableau de bord
            </Link>

            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/student/subjects"
            >
              <Layers size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" /> Matières
            </Link>

            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/student/courses"
            >
              <BookmarkCheck size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" /> Cours & Supports
            </Link>

            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/student/exercises"
            >
              <PenTool size={18} className="text-amber-400 group-hover:scale-110 transition-transform" /> Exercices
            </Link>

            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/student/assignments"
            >
              <ClipboardList size={18} className="text-rose-400 group-hover:scale-110 transition-transform" /> Devoirs
            </Link>

            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/student/grades"
            >
              <BookOpen size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" /> Mes Notes
            </Link>

            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/student/bulletin"
            >
              <FileText size={18} className="text-purple-400 group-hover:scale-110 transition-transform" /> Mon Bulletin
            </Link>

            <Link 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/80 transition-all text-sm font-medium text-slate-300 hover:text-white group border border-transparent hover:border-slate-800" 
              href="/student/schedule"
            >
              <Calendar size={18} className="text-amber-400 group-hover:scale-110 transition-transform" /> Emploi du temps
            </Link>
          </div>
        </div>

        {/* Section utilisateur & Bouton de déconnexion */}
        <div className="pt-4 border-t border-slate-800/80 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {session.user?.name ? session.user.name.charAt(0).toUpperCase() : "É"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{session.user?.name || "Élève"}</p>
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