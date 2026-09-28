// src/app/teacher/schedule/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Calendar, Clock, MapPin, BookOpen, GraduationCap, Sparkles, Timer } from "lucide-react"

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]

export default async function TeacherSchedulePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = (session.user as any).role
  if (role !== "TEACHER" && role !== "ADMIN") redirect("/login")

  const teacherId = (session.user as any).id

  // Récupérer les créneaux de l'emploi du temps de ce professeur
  const schedules = await prisma.schedule.findMany({
    where: { teacherId: role === "ADMIN" ? undefined : teacherId },
    include: { class: true },
    orderBy: [{ startTime: 'asc' }]
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effet lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Planning Hebdomadaire
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Emploi du Temps
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Organisation de vos cours, gestion des salles et suivi des affectations par classe pour la semaine.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Timer size={20} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Total Semaine</p>
            <p className="text-sm font-extrabold text-white">{schedules.length} créneau(x) actif(s)</p>
          </div>
        </div>
      </div>

      {/* Grille par jour de la semaine */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {DAYS.map(day => {
          const daySchedules = schedules.filter(s => s.dayOfWeek === day);
          const hasCourses = daySchedules.length > 0;

          return (
            <div 
              key={day} 
              className={`bg-slate-900/40 border rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-300 ${
                hasCourses ? 'border-slate-800/80 hover:border-slate-700' : 'border-slate-800/40 opacity-75'
              }`}
            >
              <div>
                {/* En-tête du jour */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${hasCourses ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 'bg-slate-700'}`} />
                    <h3 className="font-bold text-white text-base tracking-wide">{day}</h3>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                    hasCourses 
                      ? 'bg-slate-950 text-slate-300 border-slate-800' 
                      : 'bg-slate-950/40 text-slate-600 border-slate-900'
                  }`}>
                    {daySchedules.length} {daySchedules.length > 1 ? 'cours' : 'cours'}
                  </span>
                </div>

                {/* Liste des créneaux horaires */}
                <div className="space-y-3.5">
                  {!hasCourses ? (
                    <div className="py-12 text-center space-y-2">
                      <p className="text-xs text-slate-600 italic">Journée libre / Aucun cours planifié</p>
                    </div>
                  ) : (
                    daySchedules.map(slot => (
                      <div 
                        key={slot.id} 
                        className="group bg-slate-950/80 border border-slate-800/80 hover:border-blue-500/30 p-4 rounded-2xl space-y-3 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
                      >
                        {/* Horaires et Salle */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-inner">
                            <Clock size={12} /> {slot.startTime} - {slot.endTime}
                          </span>
                          {slot.room ? (
                            <span className="text-[11px] font-medium text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                              <MapPin size={11} className="text-blue-400" /> {slot.room}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">Salle non assignée</span>
                          )}
                        </div>

                        {/* Matière et Classe */}
                        <div className="space-y-1 pt-1 border-t border-slate-900">
                          <div className="text-sm font-extrabold text-white flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                            <BookOpen size={15} className="text-blue-400 shrink-0" /> 
                            <span className="truncate">{slot.subject}</span>
                          </div>
                          
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                            <GraduationCap size={14} className="text-indigo-400 shrink-0" /> 
                            <span>Classe :</span> 
                            <strong className="text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60 font-bold">
                              {slot.class.name}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Petit indicateur visuel en bas de carte */}
              {hasCourses && (
                <div className="mt-6 pt-4 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Statut : Planifié</span>
                  <span className="text-emerald-400 font-medium">Actif</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  )
}