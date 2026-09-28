import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, User, Mail, Shield, Lock, Save, 
  Phone, MapPin, BookOpen, Award, FileText, Briefcase 
} from "lucide-react"

export default async function NewUserPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login")
  }

  // Server Action pour créer l'utilisateur et son profil spécifique
  async function createUser(formData: FormData) {
    "use server"
    
    // Infos de connexion de base
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as "ADMIN" | "TEACHER" | "PARENT" | "STUDENT"

    // Champs partagés
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string
    
    // Champs spécifiques
    const specialty = formData.get("specialty") as string
    const degree = formData.get("degree") as string
    const pedagogicalInfo = formData.get("pedagogicalInfo") as string
    const job = formData.get("job") as string

    if (!email || !password || !role) return

    // Préparation des données communes
    const userData: any = {
      name: name || null,
      email,
      password, // En production : utiliser bcrypt pour hasher
      role,
    }

    // Routage intelligent selon le rôle
    if (role === "TEACHER") {
      userData.teacherProfile = {
        create: {
          phone: phone || null,
          address: address || null,
          specialty: specialty || null,
          degree: degree || null,
          pedagogicalInfo: pedagogicalInfo || null,
        }
      }
    } else if (role === "PARENT") {
      userData.parentProfile = {
        create: {
          phone: phone || null,
          address: address || null,
          job: job || null,
        }
      }
    }

    // Enregistrement en base de données
    await prisma.user.create({
      data: userData
    })

    redirect("/admin/users")
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      
      {/* En-tête avec bouton retour */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/users" 
          className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nouvel Utilisateur</h1>
          <p className="text-sm text-slate-400 mt-1">Créer un profil Administrateur, Professeur, Parent ou Élève.</p>
        </div>
      </div>

      <form action={createUser} className="space-y-6">
        
        {/* SECTION 1 : Informations de base */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 border-b border-slate-800 pb-4">
            1. Informations de connexion
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <User size={14} /> Nom complet
              </label>
              <input 
                name="name" 
                type="text" 
                placeholder="Ex: Jean Dupont"
                className="w-full bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Mail size={14} /> Adresse Email *
              </label>
              <input 
                name="email" 
                type="email" 
                required
                placeholder="jean.dupont@ecole.ci"
                className="w-full bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Shield size={14} /> Rôle assigné *
              </label>
              <select 
                name="role" 
                required
                defaultValue="PARENT"
                className="w-full bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="ADMIN">Administrateur</option>
                <option value="TEACHER">Professeur</option>
                <option value="PARENT">Parent</option>
                <option value="STUDENT">Élève</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Lock size={14} /> Mot de passe provisoire *
              </label>
              <input 
                name="password" 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 : Informations Spécifiques */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
            2. Informations Administratives (Parents / Professeurs)
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 relative z-10">
            
            {/* Champs Partagés */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Phone size={14} /> Téléphone (WhatsApp)
              </label>
              <input 
                name="phone" 
                type="text" 
                placeholder="Ex: +225 07..."
                className="w-full bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <MapPin size={14} /> Lieu de résidence
              </label>
              <input 
                name="address" 
                type="text" 
                placeholder="Ex: Cocody Angré"
                className="w-full bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Spécifique Parent */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Briefcase size={14} /> Profession (Pour les Parents)
              </label>
              <input 
                name="job" 
                type="text" 
                placeholder="Ex: Ingénieur, Commerçant..."
                className="w-full bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Spécifique Professeur */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Award size={14} /> Diplôme (Pour les Profs)
              </label>
              <input 
                name="degree" 
                type="text" 
                placeholder="Ex: Master Sciences de l'Éducation"
                className="w-full bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <BookOpen size={14} /> Spécialité & Notes (Pour les Profs)
              </label>
              <div className="flex gap-4">
                <input 
                  name="specialty" 
                  type="text" 
                  placeholder="Matière principale (ex: Mathématiques)"
                  className="w-1/3 bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
                <input 
                  name="pedagogicalInfo" 
                  type="text" 
                  placeholder="Notes pédagogiques, disponibilités..."
                  className="w-2/3 bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link 
            href="/admin/users"
            className="px-6 py-3 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Annuler
          </Link>
          <button 
            type="submit" 
            className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-white/5"
          >
            <Save size={18} />
            Créer le compte
          </button>
        </div>

      </form>

    </div>
  )
}