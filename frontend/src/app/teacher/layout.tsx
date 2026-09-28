// src/app/teacher/layout.tsx
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LogOut, GraduationCap, LayoutDashboard, Award, Users, Calendar, FileText, BookOpen, ClipboardList, CheckSquare } from "lucide-react"

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  
  const role = (session.user as any).role
  if (role !== "TEACHER" && role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar Professeur */}
      <aside className="w-64 border-r border-slate-800 p-4 flex flex-col justify-between bg-slate-950">
        
        {/* Navigation principale */}
        <div className="space-y-2">
          <div className="px-2 py-3 mb-2">
            <p className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              <GraduationCap size={20} className="text-emerald-400" /> ESPACE <span className="text-emerald-400">PROF</span>
            </p>
            <p className="text-xs text-slate-500">Abidjan, Côte d'Ivoire</p>
          </div>
          
          <Link 
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium text-slate-300 hover:text-white" 
            href="/teacher/dashboard"
          >
            <LayoutDashboard size={18} className="text-blue-400" /> Tableau de bord
          </Link>

          <Link 
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium text-slate-300 hover:text-white" 
            href="/teacher/exercises"
          >
            <BookOpen size={18} className="text-cyan-400" /> Exercices
          </Link>

          <Link 
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium text-slate-300 hover:text-white" 
            href="/teacher/assignments"
          >
            <ClipboardList size={18} className="text-rose-400" /> Devoirs
          </Link>

          <Link 
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium text-slate-300 hover:text-white" 
            href="/teacher/submissions"
          >
            <CheckSquare size={18} className="text-amber-400" /> Devoirs rendus
          </Link>

          <Link 
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium text-slate-300 hover:text-white" 
            href="/teacher/grades"
          >
            <Award size={18} className="text-emerald-400" /> Saisie des notes
          </Link>

          <Link 
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium text-slate-300 hover:text-white" 
            href="/teacher/students"
          >
            <Users size={18} className="text-indigo-400" /> Mes Élèves & Classes
          </Link>

          <Link 
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium text-slate-300 hover:text-white" 
            href="/teacher/schedule"
          >
            <Calendar size={18} className="text-amber-400" /> Emploi du temps
          </Link>

          <Link 
            className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium text-slate-300 hover:text-white" 
            href="/teacher/reports"
          >
            <FileText size={18} className="text-purple-400" /> Bulletins & Avis
          </Link>
        </div>

        {/* Section utilisateur & Déconnexion en bas */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="px-2">
            <p className="text-xs font-bold text-white truncate">{session.user?.name || "Enseignant"}</p>
            <p className="text-[11px] text-slate-500 truncate">{session.user?.email}</p>
          </div>

          <form action={async () => {
            "use server"
            // Changement de "/login" vers "/" pour rediriger sur l'accueil
            await signOut({ redirectTo: "/" })
          }}>
            <button 
              type="submit" 
              className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut size={16} /> Déconnexion
            </button>
          </form>
        </div>

      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-8 bg-slate-950 overflow-y-auto">{children}</main>
    </div>
  )
}