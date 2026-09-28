// src/app/student/assignments/online/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Clock, ShieldAlert, Sparkles, Send, CheckCircle2 } from "lucide-react"

export default function OnlineAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id

  // 30 minutes de temps imparti (en secondes)
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})

  // Gestion du chronomètre en direct
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
    // Ici, tu pourras ajouter un appel fetch vers ton API pour enregistrer les réponses
  }

  // Questions de démonstration pour le test en ligne
  const questions = [
    {
      id: 1,
      question: "Soit (u_n) une suite arithmétique de premier terme u_0 = 2 et de raison r = 3. Quelle est la valeur de u_4 ?",
      options: ["11", "14", "12", "15"]
    },
    {
      id: 2,
      question: "Quelle est la limite de la suite q^n lorsque n tend vers + lointain si -1 < q < 1 ?",
      options: ["0", "1", "+ l'infini", "- l'infini"]
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-16 relative text-white">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Chrono & Titre */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Composition en Ligne • Session Sécurisée
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Interrogation : Suites & Limites
          </h1>
          <p className="text-xs text-slate-400">
            Restez connecté et actif sur cette page jusqu'à la fin de la composition.
          </p>
        </div>

        {/* Chronomètre Visuel */}
        <div className={`px-6 py-4 rounded-2xl flex items-center gap-3 backdrop-blur-md border ${
          timeLeft < 300 ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" : "bg-slate-950/80 border-slate-800 text-amber-400"
        }`}>
          <Clock size={24} />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Temps Restant</p>
            <p className="text-xl font-mono font-extrabold">{formatTime(timeLeft)}</p>
          </div>
        </div>
      </div>

      {isSubmitted ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-6 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold">Devoir soumis avec succès !</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Vos réponses ont été enregistrées et transmises à votre enseignant. Vous pouvez fermer cette page ou retourner à l'accueil.
          </p>
          <button 
            onClick={() => router.push("/student/assignments")}
            className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg cursor-pointer"
          >
            Retour aux devoirs
          </button>
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          
          {/* Avertissement de sécurité */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
            <ShieldAlert size={20} className="shrink-0" />
            <span>Ne changez pas d'onglet et ne fermez pas la page. Toute inactivité prolongée entraînera une soumission automatique.</span>
          </div>

          {/* Questions du Devoir */}
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-4">
                <p className="font-bold text-white text-base">
                  Question {idx + 1} : {q.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[q.id] === opt
                    return (
                      <button
                        key={oIdx}
                        onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                        className={`p-4 rounded-2xl text-left text-xs font-medium transition-all border cursor-pointer ${
                          isSelected 
                            ? "bg-blue-600/20 border-blue-500 text-white shadow-lg" 
                            : "bg-slate-950/80 border-slate-800/80 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bouton de soumission finale */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-4 rounded-2xl text-sm font-extrabold transition-all flex items-center gap-2 shadow-xl shadow-emerald-600/20 cursor-pointer"
            >
              <Send size={18} /> Soumettre définitivement mes réponses
            </button>
          </div>

        </div>
      )}

    </div>
  )
}