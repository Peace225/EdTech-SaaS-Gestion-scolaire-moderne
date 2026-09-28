import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Users, BookOpen, Plus, Layers, GraduationCap } from "lucide-react"

export default async function AdminClassesPage() {
  
  // CORRECTION : La Server Action doit être à l'intérieur du composant 
  // (ou être exportée si elle est à l'extérieur).
  async function createClass(formData: FormData) {
    "use server"
    const name = formData.get("name") as string
    const level = formData.get("level") as string
    
    if (!name || !level) return

    await prisma.class.create({ 
      data: { name: name.trim(), level: level.trim() } 
    })
    
    revalidatePath("/admin/classes")
  }

  // On récupère les classes en les triant par niveau puis par nom pour plus de clarté
  const classes = await prisma.class.findMany({
    orderBy: [
      { level: 'asc' },
      { name: 'asc' }
    ]
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-400" /> Gestion des Classes
          </h1>
          <p className="text-sm text-slate-400 mt-1">Structure académique de l'établissement ({classes.length} classes actives).</p>
        </div>
      </div>

      {/* Formulaire de création Premium */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
          <Plus size={16} className="text-emerald-400" /> Nouvelle Classe
        </h2>
        
        <form action={createClass} className="grid md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <BookOpen size={14} /> Nom de la classe
            </label>
            <input 
              name="name" 
              placeholder="Ex: 6ème A, Tle D..." 
              className="w-full bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
              required
            />
          </div>
          
          <div className="md:col-span-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Layers size={14} /> Niveau
            </label>
            <input 
              name="level" 
              placeholder="Ex: 6ème, Terminale..." 
              className="w-full bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
              required
            />
          </div>
          
          <div className="md:col-span-3">
            <button 
              type="submit" 
              className="w-full bg-white hover:bg-slate-200 text-black p-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5"
            >
              <Plus size={18} /> Créer
            </button>
          </div>
        </form>
      </div>

      {/* Grille des classes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {classes.length === 0 ? (
          <div className="col-span-full p-12 text-center flex flex-col items-center justify-center space-y-3 bg-slate-900/30 border border-slate-800 rounded-3xl">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
              <Layers size={32} />
            </div>
            <p className="text-slate-400 font-medium">Aucune classe n'a été créée pour le moment.</p>
          </div>
        ) : (
          classes.map(c => (
            <div 
              key={c.id} 
              className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-blue-500/30 hover:bg-slate-900 transition-all group flex flex-col justify-between min-h-[120px]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all border border-blue-500/20">
                  <GraduationCap size={20} />
                </div>
                <span className="text-[10px] font-extrabold tracking-wider uppercase bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                  {c.level}
                </span>
              </div>
              
              <div>
                <h3 className="text-lg font-extrabold text-white group-hover:text-blue-400 transition-colors">
                  {c.name}
                </h3>
                {/* Espace prévu pour afficher le nombre d'élèves plus tard */}
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Gérer cette classe &rarr;
                </p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}