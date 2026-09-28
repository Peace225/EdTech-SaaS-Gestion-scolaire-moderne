// src/app/teacher/exercises/new/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowLeft, Send, CheckCircle2, BookOpen } from "lucide-react"

export default function NewTeacherExercisePage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("Mathématiques")
  const [className, setClassName] = useState("Terminale A")
  const [difficulty, setDifficulty] = useState("Intermédiaire")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulation de l'enregistrement de l'exercice
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-16 relative text-white">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Bouton Retour */}
      <button 
        onClick={() => router.push("/teacher/exercises")}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer relative z-10"
      >
        <ArrowLeft size={16} /> Retour à la gestion des exercices
      </button>

      {/* En-tête Premium */}
      <div className="relative z-10 bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-2">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <Sparkles size={14} /> Publication • Espace Enseignant
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Créer une nouvelle série d'exercices
        </h1>
        <p className="text-xs text-slate-400">
          Renseignez les détails ci-dessous pour publier instantanément l'exercice auprès de vos élèves à Abidjan.
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-6 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold">Exercice publié avec succès !</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            La série d'exercices a été enregistrée et transmise aux élèves de la classe sélectionnée.
          </p>
          <button 
            onClick={() => router.push("/teacher/exercises")}
            className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg cursor-pointer"
          >
            Retourner à la liste des exercices
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 relative z-10">
          
          {/* Titre de l'exercice */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Titre de l'exercice
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Série d'exercices n°3 : Nombres complexes"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
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
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
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
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="Terminale A">Terminale A</option>
                <option value="Terminale D">Terminale D</option>
                <option value="Première C">Première C</option>
                <option value="Seconde A">Seconde A</option>
              </select>
            </div>
          </div>

          {/* Niveau de difficulté */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Niveau de difficulté
            </label>
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="Standard">Standard</option>
              <option value="Intermédiaire">Intermédiaire</option>
              <option value="Avancé">Avancé</option>
            </select>
          </div>

          {/* Description et consignes */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Consignes et description de l'exercice
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les exercices ou ajoutez les instructions détaillées pour vos élèves..."
              rows={5}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
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
                  <Send size={15} /> Publier l'exercice
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  )
}