// src/app/teacher/students/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Users, GraduationCap, ShieldCheck, BookOpen } from "lucide-react"

// Fonction utilitaire pour formater le nom du parent si besoin (affichage uniquement)
function formatParentName(user: { name?: string | null, email?: string | null }) {
  if (user.name && user.name.trim() !== "") return user.name;
  if (user.email) {
    const namePart = user.email.split('@')[0];
    return namePart
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  return "Parent référent";
}

export default async function TeacherStudentsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = (session.user as any).role
  if (role !== "TEACHER" && role !== "ADMIN") redirect("/login")

  const teacherId = (session.user as any).id

  // 1. Récupérer les classes affectées au professeur
  const assignments = await prisma.teachingAssignment.findMany({
    where: { teacherId: role === "ADMIN" ? undefined : teacherId },
    include: { class: true }
  })

  const allowedClassIds = assignments.map(a => a.classId)

  // 2. Récupérer uniquement les élèves de ces classes
  const students = await prisma.student.findMany({
    where: { classId: { in: allowedClassIds } },
    include: {
      user: true,
      class: true,
      parent: true
    },
    orderBy: [{ class: { name: 'asc' } }, { user: { name: 'asc' } }]
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-indigo-400" /> Mes Élèves & Classes
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Liste de vos élèves inscrits dans vos classes affectées pour le suivi académique.
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs font-semibold text-indigo-400">
          {students.length} élève(s) au total
        </div>
      </div>

      {/* Tableau des élèves */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-5 font-semibold w-2/5">Élève</th>
                <th className="p-5 font-semibold w-1/4">Classe</th>
                <th className="p-5 font-semibold w-1/3">Statut Parental (Géré par l'Administration)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-500">
                    <GraduationCap className="mx-auto mb-3 opacity-20" size={36} />
                    Aucun élève trouvé dans vos classes assignées.
                  </td>
                </tr>
              ) : (
                students.map(s => {
                  const parentUser = s.parent;
                  const parentDisplayName = parentUser ? formatParentName(parentUser) : "";

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors group">
                      
                      {/* Info Élève */}
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shadow-inner text-xs">
                            {s.user.name ? s.user.name.charAt(0).toUpperCase() : s.user.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white">{s.user.name || "Élève non nommé"}</div>
                            <div className="text-slate-400 text-xs mt-0.5">{s.user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Info Classe */}
                      <td className="p-5 align-middle">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {s.class.name} ({s.class.level})
                        </span>
                      </td>

                      {/* Statut Parental (Informatif uniquement pour le prof) */}
                      <td className="p-5 align-middle">
                        {parentUser ? (
                          <div className="flex items-center gap-2 text-slate-300 text-xs bg-slate-950 border border-slate-800/80 p-3 rounded-xl w-fit">
                            <ShieldCheck size={16} className="text-emerald-400" />
                            <span>Rattaché au compte de : <strong className="text-white">{parentDisplayName}</strong></span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic bg-slate-950 p-2.5 rounded-xl block border border-slate-800/40 w-fit">
                            Aucun parent lié administrativement
                          </span>
                        )}
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