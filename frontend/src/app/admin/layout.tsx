// src/app/admin/layout.tsx
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LogOut, Shield } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  if ((session.user as any).role !== "ADMIN") redirect("/login")

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar avec disposition flex-col pour pousser la déconnexion en bas */}
      <aside className="w-64 border-r border-slate-800 p-4 flex flex-col justify-between">
        
        {/* Navigation principale */}
        <div className="space-y-2">
          <div className="px-2 py-3 mb-2 flex items-center justify-between">
            <div>
              <p className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                <Shield size={18} className="text-blue-400" /> ADMIN <span className="text-blue-400">EdTech</span>
              </p>
              <p className="text-xs text-slate-500">Abidjan, Côte d'Ivoire</p>
            </div>
          </div>
          
          <Link className="block p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium" href="/admin">Dashboard</Link>
          <Link className="block p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium" href="/admin/users">Utilisateurs</Link>
          <Link className="block p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium" href="/admin/classes">Classes</Link>
          <Link className="block p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium" href="/admin/students">Élèves + Parents</Link>
          <Link className="block p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium" href="/admin/assignments">Affectations Profs</Link>
          <Link className="block p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 font-semibold" href="/admin/grades">Notes & Évaluations</Link>
          <Link className="block p-2.5 rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium" href="/admin/invoices">Factures</Link>
        </div>

        {/* Section utilisateur & Déconnexion en bas de la sidebar */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="px-2">
            <p className="text-xs font-bold text-white truncate">{session.user?.name || "Administrateur"}</p>
            <p className="text-[11px] text-slate-500 truncate">{session.user?.email}</p>
          </div>

          <form action={async () => {
            "use server"
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