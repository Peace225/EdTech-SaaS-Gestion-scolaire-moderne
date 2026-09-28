// src/app/student/assignments/upload/[id]/page.tsx
"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Upload, Sparkles, FileText, ArrowLeft, Send, CheckCircle2 } from "lucide-react"

export default function UploadAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setIsSubmitting(true)
    
    // Simulation d'un envoi de fichier (remplacer par une Server Action ou fetch vers ton API)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-16 relative text-white">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Bouton Retour */}
      <button 
        onClick={() => router.push("/student/assignments")}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer relative z-10"
      >
        <ArrowLeft size={16} /> Retour aux devoirs
      </button>

      {/* En-tête Premium */}
      <div className="relative z-10 bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-2">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <Sparkles size={14} /> Dépôt de Devoir • Espace Sécurisé
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Soumettre votre travail
        </h1>
        <p className="text-xs text-slate-400">
          Référence du devoir : <strong className="text-slate-200">{id}</strong>. Veuillez téléverser votre fichier au format PDF, Word ou image.
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-6 backdrop-blur-xl shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold">Travail déposé avec succès !</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Votre fichier a été transmis à votre enseignant. Il sera évalué prochainement.
          </p>
          <button 
            onClick={() => router.push("/student/assignments")}
            className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg cursor-pointer"
          >
            Retourner à la liste des devoirs
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 relative z-10">
          
          {/* Zone de sélection de fichier */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Fichier du devoir (PDF, DOCX, JPG, PNG)
            </label>
            
            <label className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/80 p-8 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white">
                  {selectedFile ? selectedFile.name : "Cliquez ici pour choisir un fichier"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} Mo` : "Glissez-déposez ou parcourez vos fichiers (Max 15 Mo)"}
                </p>
              </div>
              <input 
                type="file" 
                onChange={handleFileChange} 
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                className="hidden" 
                required 
              />
            </label>
          </div>

          {/* Commentaire optionnel */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Commentaire pour l'enseignant (Optionnel)
            </label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajoutez une remarque ou une précision concernant votre travail..."
              rows={4}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Bouton de validation */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="bg-white hover:bg-slate-200 disabled:opacity-50 text-black px-8 py-3.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              {isSubmitting ? (
                <>Envoi en cours...</>
              ) : (
                <>
                  <Send size={15} /> Valider et envoyer le devoir
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  )
}