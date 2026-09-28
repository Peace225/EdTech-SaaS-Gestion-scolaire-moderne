// frontend/src/components/DashboardHeader.tsx
import { auth } from "@/auth";
import { LogoutButton } from "./LogoutButton";
import { ShieldCheck, UserCheck, GraduationCap, Users } from "lucide-react";
import Link from "next/link";

export async function DashboardHeader() {
  const session = await auth();
  const user = session?.user;
  const role = (user as any)?.role;

  // Configuration des badges selon le rôle
  const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
    ADMIN: { label: "Administrateur", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: ShieldCheck },
    TEACHER: { label: "Enseignant", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: UserCheck },
    PARENT: { label: "Parent", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Users },
    STUDENT: { label: "Élève", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: GraduationCap },
  };

  const currentRole = role ? roleConfig[role] : null;
  const RoleIcon = currentRole ? currentRole.icon : UserCheck;

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Logo & Application Name cliquable */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            ES
          </div>
          <div>
            <span className="font-bold text-slate-100 tracking-tight block text-sm group-hover:text-blue-400 transition-colors">EdTech Scolaire</span>
            <span className="text-[10px] text-slate-400 block">Espace de gestion Abidjan</span>
          </div>
        </Link>

        {/* Profil utilisateur & Déconnexion */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-2xl">
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-200 block">{user.name || user.email}</span>
                {currentRole && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${currentRole.color}`}>
                    <RoleIcon size={10} /> {currentRole.label}
                  </span>
                )}
              </div>
            </div>
          )}
          <LogoutButton />
        </div>

      </div>
    </header>
  );
}