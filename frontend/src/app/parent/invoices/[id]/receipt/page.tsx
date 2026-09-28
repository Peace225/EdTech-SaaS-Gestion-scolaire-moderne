// src/app/parent/invoices/receipt/[id]/page.tsx (ou selon ton arborescence exacte)
import Link from "next/link"
import { ArrowLeft, Download, FileText, Sparkles } from "lucide-react"

type Props = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function ReceiptPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <Link 
            href="/parent/invoices" 
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors font-medium mb-1"
          >
            <ArrowLeft size={14} /> Retour aux factures
          </Link>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold ml-3">
            <Sparkles size={14} /> Document Officiel
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Reçu de Paiement
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Visualisez et téléchargez votre reçu de paiement certifié au format PDF.
          </p>
        </div>

        <div>
          <a
            href={`/api/receipt/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            download={`recu-${id.slice(0, 8)}.pdf`}
            className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-white/5"
          >
            <Download size={16} /> Télécharger le PDF
          </a>
        </div>
      </div>

      {/* Visionneuse PDF (iframe) */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 backdrop-blur-xl shadow-2xl relative z-10">
        <iframe
          src={`/api/receipt/${id}`}
          className="w-full h-[650px] bg-white border border-slate-800 rounded-2xl shadow-inner"
          title={`Reçu ${id}`}
        />
      </div>

    </div>
  )
}