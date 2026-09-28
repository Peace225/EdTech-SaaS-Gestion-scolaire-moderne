import { prisma } from "@/lib/prisma"
import { Shield, BookOpen, Users, GraduationCap, Mail, UserPlus, MoreHorizontal } from "lucide-react"
import Link from "next/link" // <-- Import indispensable ajouté ici

// Composant utilitaire pour styliser les rôles
const RoleBadge = ({ role }: { role: string }) => {
  switch (role) {
    case "ADMIN":
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20"><Shield size={12} /> Admin</span>
    case "TEACHER":
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20"><BookOpen size={12} /> Professeur</span>
    case "PARENT":
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Users size={12} /> Parent</span>
    case "STUDENT":
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20"><GraduationCap size={12} /> Élève</span>
    default:
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-gray-500/10 text-gray-400 border border-gray-500/20">{role}</span>
  }
}

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ 
    orderBy: { role: "asc" } 
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des Utilisateurs</h1>
          <p className="text-sm text-slate-400 mt-1">Annuaire de l'établissement ({users.length} comptes enregistrés).</p>
        </div>
        {/* Le bouton est maintenant un composant Link pointant vers /admin/users/new */}
        <Link href="/admin/users/new" className="bg-white hover:bg-slate-200 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-white/5">
          <UserPlus size={18} /> Nouvel utilisateur
        </Link>
      </div>

      {/* Conteneur du tableau */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-5 font-semibold">Utilisateur</th>
                <th className="p-5 font-semibold">Rôle & Accès</th>
                <th className="p-5 font-semibold">Statut</th>
                <th className="p-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      {/* Avatar généré */}
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shadow-inner">
                        {u.name ? u.name.charAt(0).toUpperCase() : u.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white">{u.name || "Utilisateur non nommé"}</div>
                        <div className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                          <Mail size={12} className="opacity-70" /> {u.email || "Aucun email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="p-5">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Actif
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <button className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center justify-center">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* État vide */}
        {users.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
              <Users size={32} />
            </div>
            <p className="text-slate-400 font-medium">Aucun utilisateur trouvé dans la base de données.</p>
          </div>
        )}
      </div>
    </div>
  )
}