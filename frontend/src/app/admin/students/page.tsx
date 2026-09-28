// src/app/admin/students/page.tsx
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { GraduationCap, Link2, AlertCircle, ShieldCheck, Users, Mail, Phone, MapPin, MessageCircle } from "lucide-react"

// Fonction utilitaire pour formater le nom du parent si le champ 'name' est vide
function formatParentName(user: { name?: string | null, email?: string | null }) {
  if (user.name && user.name.trim() !== "") return user.name;
  if (user.email) {
    const namePart = user.email.split('@')[0];
    return namePart
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  return "Parent";
}

export default async function AdminStudentsPage() {
  
  async function linkParent(formData: FormData) {
    "use server"
    const studentId = formData.get("studentId") as string
    const parentId = formData.get("parentId") as string
    
    if (!studentId || !parentId) return

    await prisma.student.update({ 
      where: { id: studentId }, 
      data: { parentId } 
    })
    
    revalidatePath("/admin/students")
  }

  // Récupération avec inclusion de parentProfile
  const [students, parents] = await Promise.all([
    prisma.student.findMany({ 
      include: { 
        user: true, 
        class: true,
        parent: {
          include: { parentProfile: true } 
        }
      },
      orderBy: { class: { name: 'asc' } }
    }),
    prisma.user.findMany({ 
      where: { role: "PARENT" },
      include: { parentProfile: true },
      orderBy: { email: 'asc' }
    })
  ])

  const unlinkedCount = students.filter(s => !s.parentId).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-blue-400" /> Dossiers Élèves
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            Gérez les {students.length} élèves inscrits et leurs liaisons parentales.
            {unlinkedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full text-xs font-semibold">
                <AlertCircle size={12} /> {unlinkedCount} sans parent
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Conteneur du tableau */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-5 font-semibold w-1/4">Élève</th>
                <th className="p-5 font-semibold w-1/6">Classe</th>
                <th className="p-5 font-semibold w-1/3">Contact Parent (Email, Tél, Adresse)</th>
                <th className="p-5 font-semibold text-right w-1/4">Liaison Sécurisée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {students.map(s => {
                const parentUser = s.parent;
                const parentProfile = parentUser?.parentProfile;
                const parentDisplayName = parentUser ? formatParentName(parentUser) : "";

                return (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors group">
                    
                    {/* Info Élève */}
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shadow-inner text-xs mt-0.5">
                          {s.user.name ? s.user.name.charAt(0).toUpperCase() : s.user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white">{s.user.name || "Élève non nommé"}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{s.user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Info Classe */}
                    <td className="p-5 align-top pt-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {s.class.name}
                      </span>
                    </td>

                    {/* Info Parent Ultra Complète */}
                    <td className="p-5">
                      {parentUser ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                            <ShieldCheck size={16} />
                            <span>{parentDisplayName}</span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5">
                            {/* Lien Email Rapide */}
                            <a href={`mailto:${parentUser.email}`} className="text-slate-400 hover:text-blue-400 text-xs flex items-center gap-2 transition-colors w-fit">
                              <Mail size={12} /> {parentUser.email}
                            </a>
                            
                            {/* Affichage du Téléphone avec lien WhatsApp */}
                            {parentProfile?.phone ? (
                              <a 
                                href={`https://wa.me/${parentProfile.phone.replace(/[^0-9]/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-green-400 text-xs flex items-center gap-2 transition-colors w-fit"
                                title="Contacter sur WhatsApp"
                              >
                                <MessageCircle size={12} /> {parentProfile.phone}
                              </a>
                            ) : (
                              <span className="text-slate-600 text-xs flex items-center gap-2 italic">
                                <Phone size={12} /> Pas de numéro renseigné
                              </span>
                            )}

                            {/* Affichage de l'adresse */}
                            {parentProfile?.address ? (
                              <span className="text-slate-400 text-xs flex items-center gap-2">
                                <MapPin size={12} /> {parentProfile.address}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-xs flex items-center gap-2 italic">
                                <MapPin size={12} /> Pas d'adresse renseignée
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-500/80 text-xs font-medium bg-amber-500/10 w-fit px-3 py-1.5 rounded-lg border border-amber-500/20">
                          <AlertCircle size={14} />
                          <span>Aucun parent lié</span>
                        </div>
                      )}
                    </td>

                    {/* Formulaire de liaison */}
                    <td className="p-5 align-top pt-6">
                      <form action={linkParent} className="flex items-center justify-end gap-2">
                        <input type="hidden" name="studentId" value={s.id} />
                        <select 
                          name="parentId" 
                          required 
                          defaultValue=""
                          className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-48 transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Sélectionner un parent...</option>
                          {parents.map(p => (
                            <option key={p.id} value={p.id}>{p.name || p.email}</option>
                          ))}
                        </select>
                        <button 
                          type="submit"
                          className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 p-2.5 rounded-lg transition-colors flex items-center gap-1"
                          title="Lier ce parent"
                        >
                          <Link2 size={16} />
                          <span className="sr-only">Lier</span>
                        </button>
                      </form>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* État vide */}
        {students.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
              <Users size={32} />
            </div>
            <p className="text-slate-400 font-medium">Aucun élève trouvé. Allez dans "Utilisateurs" pour créer des comptes élèves.</p>
          </div>
        )}
      </div>

    </div>
  )
}