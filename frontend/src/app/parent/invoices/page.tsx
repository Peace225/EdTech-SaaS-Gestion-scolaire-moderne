// src/app/parent/invoices/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Wallet, CheckCircle2, Sparkles, FileText, ShieldAlert, ArrowUpRight } from "lucide-react"

export default async function ParentInvoicesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const parentId = (session.user as any).id

  // Récupérer les enfants et leurs factures associées
  const students = await prisma.student.findMany({
    where: { parentId },
    include: {
      user: true,
      class: true,
      invoices: {
        include: { payments: true },
        orderBy: { dueDate: "desc" }
      }
    }
  })

  // Aplatir toutes les factures de tous les enfants
  const allInvoices = students.flatMap(student => 
    student.invoices.map(invoice => ({
      ...invoice,
      studentName: student.user?.name || "Élève",
      className: student.class?.name || ""
    }))
  ).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())

  const totalImpayes = allInvoices
    .filter(i => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Gestion Financière
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Factures & Frais de Scolarité
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Suivez l'état des paiements, les échéances, accédez à vos reçus officiels et consultez le règlement financier.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <Wallet size={20} className="text-amber-400" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Total Restant Dû</p>
            <p className="text-sm font-extrabold text-amber-400">{totalImpayes.toLocaleString()} FCFA</p>
          </div>
        </div>
      </div>

      {/* Grille principale : Historique des factures + Règlement de l'école */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Liste des factures (Prend 2 colonnes) */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Wallet size={18} className="text-amber-400" /> Historique des Factures
            </h2>
            <span className="text-xs text-slate-500 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
              {allInvoices.length} facture(s) enregistrée(s)
            </span>
          </div>

          {allInvoices.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <p>Aucune facture disponible pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allInvoices.map((inv) => {
                const isPaid = inv.status === "PAID"
                return (
                  <div 
                    key={inv.id} 
                    className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-white">{inv.amount.toLocaleString()} FCFA</span>
                        <span className={`text-xs px-3 py-0.5 rounded-full font-extrabold uppercase border ${
                          isPaid 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {isPaid ? "Payé" : "En attente"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Élève : <strong className="text-slate-200">{inv.studentName}</strong> ({inv.className}) • Échéance : {new Date(inv.dueDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isPaid ? (
                        <Link 
                          href={`/parent/invoices/receipt/${inv.id}`}
                          className="bg-white hover:bg-slate-200 text-black px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                        >
                          <FileText size={14} /> Voir le Reçu <ArrowUpRight size={14} />
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
                          Règlement en attente
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Règlement intérieur & Modalités de l'école (Prend 1 colonne) */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4">
              <ShieldAlert size={20} className="text-blue-400" />
              <h2 className="font-bold text-white text-base">Règlement & Modalités</h2>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Échéances de Paiement
                </p>
                <p className="text-slate-400">Les frais de scolarité doivent être réglés au plus tard le 5 de chaque mois ou selon le calendrier trimestriel établi.</p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Moyens de Règlement
                </p>
                <p className="text-slate-400">Paiements acceptés en ligne via Wave, Orange Money ou directement par virement sur le compte agréé de l'établissement.</p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Justificatifs & Reçus
                </p>
                <p className="text-slate-400">Chaque paiement validé génère instantanément un reçu officiel certifié téléchargeable depuis votre espace parent.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">Service Comptabilité • Abidjan</p>
          </div>
        </div>

      </div>

    </div>
  )
}