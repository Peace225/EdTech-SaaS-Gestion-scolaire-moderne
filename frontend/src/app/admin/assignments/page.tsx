// src/app/admin/assignments/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { BookOpen, Users, Plus, Trash2, GraduationCap, Briefcase, ChevronDown, Phone, MapPin } from "lucide-react"

// Liste standard des matières
const SUBJECTS = [
  "Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT",
  "Histoire-Géographie", "Philosophie", "Espagnol", "Allemand", "EPS",
  "Informatique", "EDHC", "Arts Plastiques", "Musique"
]

// Fonction intelligente pour générer un beau nom
function formatTeacherName(user: { name?: string | null, email?: string | null }) {
  if (user.name && user.name.trim() !== "") return user.name;
  if (user.email) {
    const namePart = user.email.split('@')[0];
    return namePart
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  return "Professeur";
}

export default async function AdminAssignmentsPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login")
  }

  async function createAssignment(formData: FormData) {
    "use server"
    const teacherId = formData.get("teacherId") as string
    const classId = formData.get("classId") as string
    const subject = formData.get("subject") as string

    if (!teacherId || !classId || !subject) return

    try {
      await prisma.teachingAssignment.create({
        data: { teacherId, classId, subject: subject.trim() }
      })
    } catch (error) {
      console.error("Erreur ou doublon lors de l'affectation")
    }
    
    revalidatePath("/admin/assignments")
  }

  async function deleteAssignment(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    if (!id) return
    
    await prisma.teachingAssignment.delete({ where: { id } })
    revalidatePath("/admin/assignments")
  }

  // RÉCUPÉRATION DES DONNÉES AVEC INCLUSION DU PROFIL PROF (teacherProfile)
  const [teachers, classes, assignments] = await Promise.all([
    prisma.user.findMany({ 
      where: { role: "TEACHER" }, 
      include: { teacherProfile: true }, // <-- Inclusion du profil prof
      orderBy: { email: "asc" } 
    }),
    prisma.class.findMany({ orderBy: [ { level: "asc" }, { name: "asc" } ] }),
    prisma.teachingAssignment.findMany({
      include: { 
        teacher: { include: { teacherProfile: true } }, // <-- Inclusion ici aussi
        class: true 
      },
      orderBy: { id: "desc" } 
    })
  ])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="text-blue-400" /> Affectations des Professeurs
          </h1>
          <p className="text-sm text-slate-400 mt-1">Liez vos enseignants à leurs classes et matières respectives.</p>
        </div>
      </div>

      {/* Formulaire d'affectation Premium */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
          <Plus size={16} className="text-emerald-400" /> Nouvelle Affectation
        </h2>
        
        <form action={createAssignment} className="grid md:grid-cols-4 gap-4 items-end">
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Users size={14} /> Enseignant
            </label>
            <div className="relative">
              <select name="teacherId" defaultValue="" className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-blue-500 focus:ring-1 outline-none transition-all appearance-none cursor-pointer" required>
                <option value="" disabled>Choisir un profil...</option>
                {teachers.map(t => {
                  const teacherName = formatTeacherName(t);
                  // On récupère la spécialité et le téléphone s'ils existent dans le profil
                  const specialty = t.teacherProfile?.specialty ? `[${t.teacherProfile.specialty}]` : "";
                  const phone = t.teacherProfile?.phone ? `- Tel: ${t.teacherProfile.phone}` : "";
                  
                  return (
                    <option key={t.id} value={t.id}>
                      {teacherName} {specialty} {phone}
                    </option>
                  )
                })}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <GraduationCap size={14} /> Classe
            </label>
            <div className="relative">
              <select name="classId" defaultValue="" className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-blue-500 focus:ring-1 outline-none transition-all appearance-none cursor-pointer" required>
                <option value="" disabled>Choisir une classe...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <BookOpen size={14} /> Matière
            </label>
            <div className="relative">
              <select name="subject" defaultValue="" className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-blue-500 focus:ring-1 outline-none transition-all appearance-none cursor-pointer" required>
                <option value="" disabled>Choisir la matière...</option>
                {SUBJECTS.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <button type="submit" className="w-full bg-white hover:bg-slate-200 text-black font-bold p-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
            <Plus size={18} /> Affecter
          </button>
        </form>
      </div>

      {/* Liste des affectations existantes */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <span className="font-bold text-white">Affectations actives</span>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold">
            {assignments.length} totale(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 font-semibold">Professeur & Contact</th>
                <th className="p-4 font-semibold">Profil Pédagogique</th>
                <th className="p-4 font-semibold">Classe & Matière Affectées</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    <Briefcase className="mx-auto mb-3 opacity-20" size={32} />
                    Aucune affectation enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                assignments.map(a => {
                  const teacherName = formatTeacherName(a.teacher);
                  const profile = a.teacher.teacherProfile;

                  return (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors group">
                      
                      {/* Colonne 1 : Nom et Contact (Email + Tel) */}
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm mt-0.5">
                            {teacherName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white">{teacherName}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{a.teacher.email}</div>
                            {profile?.phone && (
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <Phone size={10} /> {profile.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Colonne 2 : Infos Pédagogiques du prof (Spécialité, Diplôme, Adresse) */}
                      <td className="p-4">
                        <div className="space-y-1.5">
                          {profile?.specialty ? (
                            <span className="inline-block bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700">
                              Spécialité: {profile.specialty}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Profil non complété</span>
                          )}
                          
                          {profile?.degree && (
                            <div className="text-xs text-slate-400">
                              🎓 {profile.degree}
                            </div>
                          )}
                          
                          {profile?.address && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin size={10} /> {profile.address}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Colonne 3 : Classe et Matière (L'affectation en elle-même) */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5">
                            <GraduationCap size={12} /> {a.class.name}
                          </span>
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                            <BookOpen size={12} /> {a.subject}
                          </span>
                        </div>
                      </td>

                      {/* Colonne 4 : Action */}
                      <td className="p-4 text-right align-middle">
                        <form action={deleteAssignment}>
                          <input type="hidden" name="id" value={a.id} />
                          <button type="submit" className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors inline-flex" title="Supprimer l'affectation">
                            <Trash2 size={16} />
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}