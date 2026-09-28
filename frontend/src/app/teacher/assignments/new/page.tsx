// src/app/teacher/assignments/new/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowLeft, Send, CheckCircle2, Clock, Upload, ShieldAlert } from "lucide-react"

export default function NewTeacherAssignmentPage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("Mathématiques")
  const [className, setClassName] = useState("Terminale A")
  const [type, setType] = useState("UPLOAD") // UPLOAD ou ONLINE
  const [duration, setDuration] = useState("30 minutes")
  const [dueDate, setDueDate] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulation de l'enregistrement du devoir
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-16 relative text-white">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Bouton Retour */}
      <button 
        onClick={() => router.push("/teacher/assignments")}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer relative z-10"
      >
        <ArrowLeft size={16} /> Retour à la gestion des devoirs
      </button>

      {/* En-tête Premium */}
      <div className="relative z-10 bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-2">
        <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <Sparkles size={14} /> Publication • Espace Enseignant
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Créer un nouveau devoir ou composition
        </h1>
        <p className="text-xs text-slate-400">
          Publiez un devoir maison (dépôt de fichiers) ou une évaluation en ligne chronométrée pour vos classes à Abidjan.
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-6 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold">Devoir publié avec succès !</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Le devoir a été enregistré et mis en ligne pour les élèves de la classe sélectionnée.
          </p>
          <button 
            onClick={() => router.push("/teacher/assignments")}
            className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg cursor-pointer"
          >
            Retourner à la liste des devoirs
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 relative z-10">
          
          {/* Titre du devoir */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Titre du Devoir / Composition
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Devoir Maison n°2 : Nombres complexes"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
              required 
            />
          </div>

          {/* Grille : Matière & Classe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Matière
              </label>
              <select 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
              >
                <option value="Mathématiques">Mathématiques</option>
                <option value="Physique-Chimie">Physique-Chimie</option>
                <option value="Français">Français</option>
                <option value="Anglais LV1">Anglais LV1</option>
                <option value="SVT">SVT</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Classe Cible
              </label>
              <select 
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
              >
                <option value="Terminale A">Terminale A</option>
                <option value="Terminale D">Terminale D</option>
                <option value="Première C">Première C</option>
                <option value="Seconde A">Seconde A</option>
              </select>
            </div>
          </div>

          {/* Type de devoir (Maison vs En Ligne) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Type de Devoir
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType("UPLOAD")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  type === "UPLOAD" ? "bg-blue-600/20 border-blue-500 text-white" : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Upload size={20} className="text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Devoir Maison (Dépôt)</p>
                  <p className="text-[10px] text-slate-400">L'élève dépose un fichier (PDF, Word, Image)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType("ONLINE")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  type === "ONLINE" ? "bg-amber-600/20 border-amber-500 text-white" : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Clock size={20} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Devoir en Ligne (Chrono)</p>
                  <p className="text-[10px] text-slate-400">Interrogation chronométrée sur la plateforme</p>
                </div>
              </button>
            </div>
          </div>

          {/* Durée (si en ligne) & Date limite */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {type === "ONLINE" && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Durée impartie
                </label>
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="20 minutes">20 minutes</option>
                  <option value="25 minutes">25 minutes</option>
                  <option value="30 minutes">30 minutes</option>
                </select>
              </div>
            )}

            <div className={`space-y-2 ${type !== "ONLINE" ? "md:col-span-2" : ""}`}>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Date limite de soumission
              </label>
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                required 
              />
            </div>
          </div>

          {/* Description et consignes */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Consignes et description du devoir
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Indiquez les consignes détaillées, les chapitres concernés ou les questions du devoir..."
              rows={5}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors resize-none"
              required
            />
          </div>

          {/* Bouton de soumission */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-white hover:bg-slate-200 disabled:opacity-50 text-black px-8 py-3.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              {isSubmitting ? (
                <>Publication en cours...</>
              ) : (
                <>
                  <Send size={15} /> Publier le devoir
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  )
}