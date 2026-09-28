// src/app/student/schedule/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Calendar, Sparkles, Clock, MapPin, User } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StudentSchedulePage() {
  const session = await auth()
  if (!session || (session.user as any).role !== "STUDENT") redirect("/login")
  
  const userId = (session.user as any).id

  const student = await prisma.student.findFirst({
    where: { userId },
    include: { class: true, user: true }
  })

  if (!student) redirect("/login")

  // Jours de la semaine pour l'emploi du temps
  const days = [
    { name: "Lundi", cours: [
      { heure: "08:00 - 10:00", matiere: "Mathématiques", prof: "M. Kouassi", salle: "Salle 101" },
      { heure: "10:15 - 12:15", matiere: "Physique-Chimie", prof: "Mme Diallo", salle: "Labo 2" },
      { heure: "13:30 - 15:30", matiere: "Histoire-Géographie", prof: "M. Koné", salle: "Salle 101" }
    ]},
    { name: "Mardi", cours: [
      { heure: "08:00 - 10:00", matiere: "Français", prof: "Mme Touré", salle: "Salle 102" },
      { heure: "10:15 - 12:15", matiere: "Anglais", prof: "Mr Smith", salle: "Salle 102" },
      { heure: "14:00 - 16:00", matiere: "SVT", prof: "M. Yao", salle: "Labo 1" }
    ]},
    { name: "Mercredi", cours: [
      { heure: "08:00 - 12:00", matiere: "Éducation Physique & Sportive", prof: "M. Bamba", salle: "Terrain de Sport" }
    ]},
    { name: "Jeudi", cours: [
      { heure: "08:00 - 10:00", matiere: "Mathématiques", prof: "M. Kouassi", salle: "Salle 101" },
      { heure: "10:15 - 12:15", matiere: "Philosophie", prof: "Mme Traoré", salle: "Salle 103" },
      { heure: "13:30 - 15:30", matiere: "Physique-Chimie", prof: "Mme Diallo", salle: "Labo 2" }
    ]},
    { name: "Vendredi", cours: [
      { heure: "08:00 - 10:00", matiere: "Informatique / TICE", prof: "M. Falcone", salle: "Salle Info" },
      { heure: "10:15 - 12:15", matiere: "Français", prof: "Mme Touré", salle: "Salle 102" },
      { heure: "13:30 - 15:30", matiere: "Arts Plastiques / EPS", prof: "M. Kouadio", salle: "Salle Polyvalente" }
    ]}
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Emploi du Temps Hebdomadaire
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Mon Planning de Cours
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Consultez vos horaires de cours, les salles attribuées et les enseignants pour la classe de <strong className="text-slate-200">{student.class?.name || "votre classe"}</strong>.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-6 py-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Semaine en cours</p>
            <p className="text-sm font-extrabold text-white">Année 2025-2026</p>
          </div>
        </div>
      </div>

      {/* Grille des Jours de la semaine */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {days.map((jour) => (
          <div 
            key={jour.name} 
            className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h2 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> {jour.name}
                </h2>
                <span className="text-xs text-slate-500 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                  {jour.cours.length} cours
                </span>
              </div>

              <div className="space-y-3">
                {jour.cours.map((c, idx) => (
                  <div key={idx} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-2 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                      <span className="flex items-center gap-1"><Clock size={13} /> {c.heure}</span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded-md text-slate-300 border border-slate-800 flex items-center gap-1">
                        <MapPin size={12} className="text-blue-400" /> {c.salle}
                      </span>
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-sm">{c.matiere}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <User size={12} className="text-slate-500" /> {c.prof}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
              Abidjan • Emploi du temps officiel
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}