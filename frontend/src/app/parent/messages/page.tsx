"use client"

import { useState } from "react"
import { 
  Search, Mail, AlertTriangle, Info, Calendar, 
  ChevronRight, Clock, UserCircle, CheckCircle2 
} from "lucide-react"

// Types pour nos données de test
type MessageCategory = "CONVOCATION" | "INFO" | "ALERTE"
type Message = {
  id: string
  sender: string
  role: string
  subject: string
  preview: string
  content: string
  date: string
  category: MessageCategory
  isRead: boolean
}

// Données de test (Mock data)
const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "Direction des Études",
    role: "Administration",
    subject: "Convocation : Point sur l'évolution de Junior",
    preview: "Nous vous prions de bien vouloir vous présenter à la direction...",
    content: "Bonjour chers parents,\n\nNous vous prions de bien vouloir vous présenter à la direction des études ce Vendredi à 10h00. Cette rencontre aura pour but de discuter des résultats de la mi-trimestre de Junior KOUASSI et de mettre en place une stratégie d'accompagnement personnalisé.\n\nMerci de confirmer votre présence.\n\nCordialement,\nLa Direction.",
    date: "Aujourd'hui, 09:00",
    category: "CONVOCATION",
    isRead: false
  },
  {
    id: "2",
    sender: "Service Comptabilité",
    role: "Administration",
    subject: "Rappel : Échéance du 2ème trimestre",
    preview: "Ceci est un rappel concernant le paiement de la scolarité...",
    content: "Cher parent,\n\nSauf erreur ou omission de notre part, le versement de la scolarité pour le 2ème trimestre (échéance au 05 Octobre) n'a pas encore été enregistré.\n\nVous pouvez régulariser la situation directement via le portail parent dans l'onglet 'Factures & Frais'.\n\nL'équipe comptable.",
    date: "Hier, 14:30",
    category: "ALERTE",
    isRead: false
  },
  {
    id: "3",
    sender: "M. Konan",
    role: "Professeur Principal (6ème A)",
    subject: "Sortie pédagogique au Musée des Civilisations",
    preview: "Une sortie est organisée pour les classes de 6ème ce mois-ci...",
    content: "Bonjour,\n\nDans le cadre du programme d'Histoire-Géographie, une sortie pédagogique est prévue le Mercredi 15 Octobre au Musée des Civilisations de Côte d'Ivoire (Plateau).\n\nLe transport est pris en charge par l'établissement. Une autorisation parentale vous sera envoyée via ce portail d'ici la semaine prochaine.\n\nCordialement.",
    date: "25 Sept, 11:15",
    category: "INFO",
    isRead: true
  }
]

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(MOCK_MESSAGES[0])
  const [filter, setFilter] = useState<"TOUS" | MessageCategory>("TOUS")

  // Filtrer les messages
  const filteredMessages = messages.filter(m => filter === "TOUS" || m.category === filter)

  // Marquer comme lu
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message)
    if (!message.isRead) {
      setMessages(msgs => msgs.map(m => m.id === message.id ? { ...m, isRead: true } : m))
    }
  }

  // Obtenir la couleur du badge selon la catégorie
  const getCategoryColor = (category: MessageCategory) => {
    switch (category) {
      case "CONVOCATION": return "bg-red-500/10 text-red-400 border-red-500/20"
      case "ALERTE": return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "INFO": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }
  }

  const getCategoryIcon = (category: MessageCategory) => {
    switch (category) {
      case "CONVOCATION": return <AlertTriangle size={14} />
      case "ALERTE": return <Clock size={14} />
      case "INFO": return <Info size={14} />
      default: return <Mail size={14} />
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-6">
      
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Mail className="text-pink-400" /> Messagerie
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Consultez les convocations et informations de l'administration.
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher un message..." 
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all"
          />
        </div>
      </div>

      {/* Interface Boîte de réception */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        
        {/* Liste des messages (Gauche) */}
        <div className="col-span-1 flex flex-col bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden">
          {/* Filtres */}
          <div className="p-3 border-b border-slate-800/60 flex gap-2 overflow-x-auto no-scrollbar">
            {["TOUS", "CONVOCATION", "ALERTE", "INFO"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  filter === f 
                    ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" 
                    : "bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800"
                }`}
              >
                {f === "TOUS" ? "Tous" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Aucun message dans cette catégorie.
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`w-full text-left p-4 border-b border-slate-800/40 transition-all hover:bg-slate-800/40 flex flex-col gap-2 ${
                    selectedMessage?.id === msg.id ? "bg-slate-800/60 border-l-2 border-l-pink-500" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-semibold text-slate-200 truncate pr-2">
                      {msg.sender}
                    </span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap pt-0.5">
                      {msg.date}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-white line-clamp-1 flex items-center gap-2">
                    {!msg.isRead && <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0"></span>}
                    {msg.subject}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {msg.preview}
                  </p>
                  <div className="mt-1 flex items-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border ${getCategoryColor(msg.category)}`}>
                      {getCategoryIcon(msg.category)}
                      {msg.category}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Contenu du message (Droite) */}
        <div className="col-span-2 bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden flex flex-col">
          {selectedMessage ? (
            <>
              {/* En-tête du message */}
              <div className="p-6 border-b border-slate-800/60 bg-slate-900/50">
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${getCategoryColor(selectedMessage.category)}`}>
                    {getCategoryIcon(selectedMessage.category)}
                    {selectedMessage.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={14} /> {selectedMessage.date}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-white mb-4">
                  {selectedMessage.subject}
                </h2>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{selectedMessage.sender}</p>
                    <p className="text-xs text-slate-500">{selectedMessage.role}</p>
                  </div>
                </div>
              </div>

              {/* Corps du message */}
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.content}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-800/60 bg-slate-900/50 flex justify-end gap-3">
                <button className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-slate-700">
                  Marquer comme non lu
                </button>
                <button className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-600 hover:bg-pink-500 text-white transition-all shadow-lg shadow-pink-500/20 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Accuser réception
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Mail size={48} className="mb-4 opacity-20" />
              <p>Sélectionnez un message pour le lire</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}