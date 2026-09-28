// src/app/teacher/dashboard/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  BookOpen, Award, Users, ArrowRight, 
  Sparkles, Briefcase, Calendar, Clock, MapPin, GraduationCap, ShieldCheck, Phone 
} from "lucide-react"

export default async function TeacherDashboard() {
  const session = await auth()
  if (!session || (session.user as any).role !== "TEACHER") redirect("/login")
  
  const teacherId = (session.user as any).id
  const teacherName = session.user?.name || "Enseignant"

  // 1. Récupération des affectations du professeur + son profil détaillé
  const [assignments, teacherProfile] = await Promise.all([
    prisma.teachingAssignment.findMany({
      where: { teacherId },
      include: { 
        class: { 
          include: { _count: { select: { students: true } } } 
        } 
      }
    }),
    prisma.teacherProfile.findUnique({
      where: { userId: teacherId }
    })
  ])

  // 2. Récupération des classes autorisées pour compter les notes associées
  const allowedClassIds = assignments.map(a => a.classId)
  const nbNotes = await prisma.grade.count({ 
    where: { 
      student: { classId: { in: allowedClassIds } } 
    } 
  })

  // 3. Récupérer le prochain cours dans l'emploi du temps
  const nextSchedule = await prisma.schedule.findFirst({
    where: { teacherId },
    include: { class: true },
    orderBy: [{ startTime: 'asc' }]
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête de bienvenue ultra personnalisé */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Espace Professeur • Abidjan, Côte d'Ivoire
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Bonjour, Prof. {teacherName} 👨‍🏫
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Pilotez vos classes, suivez les évaluations de vos élèves et consultez vos plannings en toute fluidité.
          </p>
        </div>

        {/* Badge profil / Spécialité */}
        <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-2 backdrop-blur-md min-w-[260px]">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck size={16} /> Fiche Pédagogique
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            <p><span className="text-slate-500">Spécialité :</span> <strong className="text-white">{teacherProfile?.specialty || "Non renseignée"}</strong></p>
            <p><span className="text-slate-500">Diplôme :</span> <strong className="text-white">{teacherProfile?.degree || "Non renseigné"}</strong></p>
            {teacherProfile?.phone && (
              <p className="flex items-center gap-1.5 text-slate-400 pt-1">
                <Phone size={12} className="text-emerald-400" /> {teacherProfile.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* KPIs & Raccourci de saisie */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
        
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mes classes</span>
            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
              <Users size={18} />
            </div>
          </div>
          <h3 className="text-4xl font-extrabold text-white">{assignments.length}</h3>
          <p className="text-xs text-slate-400 mt-1">Affectations actives</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes transmises</span>
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <Award size={18} />
            </div>
          </div>
          <h3 className="text-4xl font-extrabold text-white">{nbNotes}</h3>
          <p className="text-xs text-slate-400 mt-1">Évaluations enregistrées</p>
        </div>

        <Link href="/teacher/grades" className="bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 p-6 rounded-3xl transition-all shadow-xl shadow-emerald-600/20 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Action rapide</span>
            <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center backdrop-blur-md">
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Saisir les notes</h3>
            <p className="text-xs text-emerald-100/80 mt-0.5">Accéder au module d'évaluation</p>
          </div>
        </Link>

      </div>

      {/* Prochain cours / Planning rapide */}
      {nextSchedule && (
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/40 to-slate-900/40 border border-blue-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-xl relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Prochain cours planifié</span>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                {nextSchedule.subject} <span className="text-xs text-slate-400 font-normal">({nextSchedule.dayOfWeek})</span>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="bg-slate-950 text-emerald-400 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold">
              <Clock size={14} /> {nextSchedule.startTime} - {nextSchedule.endTime}
            </span>
            <span className="bg-slate-950 text-indigo-300 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold">
              <GraduationCap size={14} /> {nextSchedule.class.name}
            </span>
            {nextSchedule.room && (
              <span className="bg-slate-950 text-slate-300 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-medium">
                <MapPin size={14} className="text-blue-400" /> {nextSchedule.room}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Liste des affectations pédagogiques */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4 relative z-10">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Briefcase size={18} className="text-emerald-400" /> Mes affectations pédagogiques
          </h2>
          <span className="text-xs text-slate-500 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">Attribuées par l'administration</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {assignments.map(a => (
            <div key={a.id} className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  {a.class.name} <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-semibold">{a.class.level}</span>
                </div>
                <div className="text-xs text-blue-400 font-medium flex items-center gap-1">
                  <BookOpen size={12} /> Matière : {a.subject}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  {a.class._count.students} élève(s)
                </span>
              </div>
            </div>
          ))}
        </div>

        {assignments.length === 0 && (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <p>Aucune affectation active pour le moment.</p>
            <p className="text-xs">Veuillez demander à l'administrateur de vous lier à une classe dans <code className="text-slate-400">/admin/assignments</code>.</p>
          </div>
        )}
      </div>

    </div>
  )
}