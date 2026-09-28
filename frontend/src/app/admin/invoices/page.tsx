import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { 
  FileText, Wallet, AlertCircle, Plus, Users, User, 
  Calendar, CheckCircle, Trash2, Banknote 
} from "lucide-react"

export default async function AdminInvoicesPage() {

  // --- SERVER ACTIONS ---
  async function createSingleInvoice(formData: FormData) {
    "use server"
    const studentId = formData.get("studentId") as string
    const amount = parseFloat(formData.get("amount") as string)
    const dueDate = new Date(formData.get("dueDate") as string)

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student?.parentId) throw new Error("Cet élève n'a pas de parent lié. Va dans /admin/students d'abord.")

    await prisma.invoice.create({
      data: {
        studentId,
        parentId: student.parentId,
        amount,
        dueDate,
        status: "PENDING"
      }
    })
    revalidatePath("/admin/invoices")
  }

  async function createBulkInvoices(formData: FormData) {
    "use server"
    const classId = formData.get("classId") as string
    const amount = parseFloat(formData.get("amount") as string)
    const dueDate = new Date(formData.get("dueDate") as string)
    const label = formData.get("label") as string // ex: Scolarité T1

    const students = await prisma.student.findMany({ where: { classId, parentId: { not: null } } })
    if (students.length === 0) throw new Error("Aucun élève avec parent dans cette classe")

    await prisma.invoice.createMany({
      data: students.map(s => ({
        studentId: s.id,
        parentId: s.parentId!,
        amount,
        dueDate,
        status: "PENDING" as const
      }))
    })
    revalidatePath("/admin/invoices")
  }

  async function markPaid(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    await prisma.invoice.update({ where: { id }, data: { status: "PAID" } })
    revalidatePath("/admin/invoices")
  }

  async function deleteInvoice(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    await prisma.invoice.delete({ where: { id } })
    revalidatePath("/admin/invoices")
  }

  // --- FETCH DES DONNÉES ---
  const [invoices, students, classes, stats] = await Promise.all([
    prisma.invoice.findMany({ 
      include: { student: { include: { user: true, class: true } }, parent: true }, 
      orderBy: { createdAt: "desc" }, 
      take: 50 
    }),
    prisma.student.findMany({ 
      include: { user: true, parent: true }, 
      where: { parentId: { not: null } },
      orderBy: { user: { name: 'asc' } }
    }),
    prisma.class.findMany({ orderBy: [ { level: 'asc' }, { name: 'asc' } ] }),
    prisma.invoice.groupBy({ by: ["status"], _sum: { amount: true }, _count: true })
  ])

  const totalImpaye = stats.find(s => s.status === "PENDING")?._sum.amount || 0
  const totalPaye = stats.find(s => s.status === "PAID")?._sum.amount || 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* En-tête & KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/30 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-400" /> Gestion de la Facturation
          </h1>
          <p className="text-sm text-slate-400 mt-1">Émettez et suivez les paiements des frais de scolarité.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-900/80 border border-slate-800 px-5 py-3 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Wallet size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Encaissé</div>
              <div className="text-lg font-extrabold text-white">{totalPaye.toLocaleString()} FCFA</div>
            </div>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/20 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-lg shadow-amber-500/5">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="text-xs text-amber-500/80 font-bold uppercase tracking-wider">Impayés</div>
              <div className="text-lg font-extrabold text-amber-400">{totalImpaye.toLocaleString()} FCFA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaires de création */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* BULK PAR CLASSE */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <Users size={16} className="text-blue-400" /> Facturation en masse (Par Classe)
          </h2>
          <form action={createBulkInvoices} className="space-y-4 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <select name="classId" required className="bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-blue-500 focus:ring-1 outline-none appearance-none">
                <option value="">Sélectionner la classe...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
              </select>
              <input name="label" placeholder="Libellé (ex: Scolarité T1)" className="bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-blue-500 focus:ring-1 outline-none" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Banknote size={16} className="absolute left-3 top-3.5 text-slate-500" />
                <input name="amount" type="number" placeholder="Montant unitaire (FCFA)" required className="w-full bg-slate-950 border border-slate-800 text-white p-3 pl-10 rounded-xl text-sm focus:border-blue-500 focus:ring-1 outline-none" />
              </div>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3.5 text-slate-500" />
                <input name="dueDate" type="date" required className="w-full bg-slate-950 border border-slate-800 text-white p-3 pl-10 rounded-xl text-sm focus:border-blue-500 focus:ring-1 outline-none [color-scheme:dark]" />
              </div>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
              <Plus size={18} /> Générer pour toute la classe
            </button>
          </form>
        </div>

        {/* SINGLE */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <User size={16} className="text-purple-400" /> Facture unitaire
          </h2>
          <form action={createSingleInvoice} className="space-y-4 relative z-10">
            <select name="studentId" required className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm focus:border-purple-500 focus:ring-1 outline-none appearance-none">
              <option value="">Sélectionner l'élève...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.user.name} - Parent: {s.parent?.email}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Banknote size={16} className="absolute left-3 top-3.5 text-slate-500" />
                <input name="amount" type="number" placeholder="Montant (FCFA)" required className="w-full bg-slate-950 border border-slate-800 text-white p-3 pl-10 rounded-xl text-sm focus:border-purple-500 focus:ring-1 outline-none" />
              </div>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3.5 text-slate-500" />
                <input name="dueDate" type="date" required className="w-full bg-slate-950 border border-slate-800 text-white p-3 pl-10 rounded-xl text-sm focus:border-purple-500 focus:ring-1 outline-none [color-scheme:dark]" />
              </div>
            </div>
            <button className="w-full bg-white hover:bg-slate-200 text-black font-bold p-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-auto">
              <Plus size={18} /> Créer la facture
            </button>
          </form>
        </div>

      </div>

      {/* LISTE DES FACTURES */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <span className="font-bold text-white">Factures récentes</span>
          <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-semibold">
            {invoices.length} affichées
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 font-semibold">Élève & Classe</th>
                <th className="p-4 font-semibold">Parent Associé</th>
                <th className="p-4 font-semibold">Montant</th>
                <th className="p-4 font-semibold">Échéance</th>
                <th className="p-4 font-semibold">Statut</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <FileText className="mx-auto mb-3 opacity-20" size={32} />
                    Aucune facture émise pour le moment.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-white">{inv.student.user.name || "N/A"}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{inv.student.class.name}</div>
                    </td>
                    <td className="p-4 text-slate-300">{inv.parent.email}</td>
                    <td className="p-4 font-bold text-white">{inv.amount.toLocaleString()} <span className="text-slate-500 text-xs font-normal">FCFA</span></td>
                    <td className="p-4 text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      {inv.status === "PAID" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Payé</span>}
                      {inv.status === "PENDING" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">En attente</span>}
                      {inv.status === "OVERDUE" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide uppercase bg-red-500/10 text-red-400 border border-red-500/20">En retard</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== "PAID" && (
                          <form action={markPaid}>
                            <input type="hidden" name="id" value={inv.id} />
                            <button type="submit" title="Marquer comme payé" className="text-slate-500 hover:text-emerald-400 p-2 rounded-lg hover:bg-emerald-500/10 transition-colors inline-flex">
                              <CheckCircle size={18} />
                            </button>
                          </form>
                        )}
                        <form action={deleteInvoice}>
                          <input type="hidden" name="id" value={inv.id} />
                          <button type="submit" title="Supprimer la facture" className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors inline-flex">
                            <Trash2 size={18} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}