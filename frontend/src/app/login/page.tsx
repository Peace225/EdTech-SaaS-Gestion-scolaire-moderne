// src/app/login/page.tsx
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LogIn, GraduationCap, Sparkles, Lock, Mail } from "lucide-react"

type Role = "ADMIN" | "TEACHER" | "PARENT" | "STUDENT"
const ROLE_REDIRECT: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  PARENT: "/parent/dashboard",
  STUDENT: "/student/dashboard",
}

export default function LoginPage() {
  const [email, setEmail] = useState("admin@ecole.ci")
  const [password, setPassword] = useState("admin123")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn("credentials", { email, password, redirect: false })
    if (res?.ok) {
      const session = await fetch("/api/auth/session").then(r => r.json())
      const role = session?.user?.role as Role
      router.push(ROLE_REDIRECT[role] || "/admin/dashboard")
    } else {
      alert("Email ou mot de passe incorrect")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Carte principale Glassmorphism */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/40 border border-slate-800/80 p-8 md:p-10 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-8 animate-in fade-in duration-500">
        
        {/* En-tête */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Portail Académique • Abidjan
          </div>
          <div className="flex justify-center pt-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <GraduationCap size={28} />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Connexion au Portail
          </h1>
          <p className="text-xs text-slate-400">
            Accédez à votre espace dédié (Admin, Professeur, Parent, Élève)
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail size={14} className="text-blue-400" /> Adresse Email
            </label>
            <input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              type="email"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors" 
              placeholder="votre.email@ecole.ci" 
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lock size={14} className="text-indigo-400" /> Mot de passe
            </label>
            <input 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              type="password" 
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors" 
              placeholder="••••••••" 
              required
            />
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-white hover:bg-slate-200 text-black p-4 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
          >
            <LogIn size={16}/> {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        {/* Aide / Comptes de démonstration */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-2 text-xs text-slate-400">
          <p className="font-bold text-slate-300 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-400" /> Comptes de test :
          </p>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
            <div>• Admin : <span className="text-slate-200">admin@ecole.ci</span></div>
            <div>• Prof : <span className="text-slate-200">teacher@ecole.ci</span></div>
            <div>• Parent : <span className="text-slate-200">parent@ecole.ci</span></div>
            <div>• Élève : <span className="text-slate-200">eleve@ecole.ci</span></div>
          </div>
          <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
            Mot de passe universel : <code className="text-slate-300 font-mono">admin123</code>
          </p>
        </div>

      </div>

    </div>
  )
}