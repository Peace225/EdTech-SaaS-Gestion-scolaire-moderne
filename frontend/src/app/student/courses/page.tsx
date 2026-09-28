// src/app/student/courses/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { BookmarkCheck, Sparkles, FileText, Download, BookOpen, CheckCircle2, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StudentCoursesPage() {
  const session = await auth()
  if (!session || (session.user as any).role !== "STUDENT") redirect("/login")
  
  const userId = (session.user as any).id

  const student = await prisma.student.findFirst({
    where: { userId },
    include: { class: true, user: true }
  })

  if (!student) redirect("/login")

  // Vrais cours complets et rédigés en détail
  const detailedCourses = [
    {
      id: "math",
      subject: "Mathématiques",
      teacher: "M. Kouassi",
      module: "Module d'Analyse : Les Suites Numériques",
      chapters: [
        {
          num: "Chapitre 1",
          title: "Généralités et Modes de Génération",
          intro: "Une suite numérique est une fonction de l'ensemble des entiers naturels N (ou une partie de N) vers l'ensemble des nombres réels R. Elle permet de modéliser l'évolution d'une grandeur discrète au fil du temps.",
          sections: [
            {
              letter: "a",
              title: "Définition explicite d'une suite",
              content: "Une suite (u_n) est dite définie de manière explicite lorsque son terme général u_n s'exprime directement en fonction de son indice n. Exemple : u_n = 3n^2 - 5n + 2. Ce mode permet de calculer immédiatement n'importe quel terme sans calculer les précédents (ex: u_10 = 3(100) - 50 + 2 = 252)."
            },
            {
              letter: "b",
              title: "Définition par récurrence",
              content: "Une suite est définie par récurrence lorsqu'on donne son premier terme u_0 (ou u_1) et une relation de récurrence liant un terme de rang n+1 au terme précédent u_n : u_{n+1} = f(u_n). Exemple : u_0 = 1 et u_{n+1} = 2u_n + 3. Ce procédé est fondamental en algorithmique et en finance."
            },
            {
              letter: "c",
              title: "Représentation graphique et sens de variation",
              content: "Graphiquement, une suite s'illustre par un nuage de points de coordonnées (n, u_n). Pour étudier le sens de variation, on étudie le signe de la différence u_{n+1} - u_n. Si u_{n+1} - u_n > 0, la suite est strictement croissante."
            }
          ],
          conclusion: "Bilan du chapitre : La distinction entre suite explicite et récurrente est la clé de voûte pour aborder les limites et l'analyse asymptotique."
        },
        {
          num: "Chapitre 2",
          title: "Suites Arithmétiques et Géométriques",
          intro: "Les suites arithmétiques et géométriques constituent les deux modèles de référence les plus importants en mathématiques appliquées.",
          sections: [
            {
              letter: "a",
              title: "Les suites arithmétiques (croissance linéaire)",
              content: "Une suite (u_n) est arithmétique de raison r si pour tout entier n, u_{n+1} = u_n + r. Formule du terme général : u_n = u_p + (n - p)r. La somme des n premiers termes s'obtient par S = [n * (premier + dernier)] / 2."
            },
            {
              letter: "b",
              title: "Les suites géométriques (croissance exponentielle)",
              content: "Une suite (v_n) est géométrique de raison q si pour tout entier n, v_{n+1} = q * v_n. Formule du terme général : v_n = v_p * q^(n-p). Elle modélise la croissance démographique ou les intérêts composés en économie."
            },
            {
              letter: "c",
              title: "Applications pratiques et résolutions de problèmes",
              content: "Méthode type : Pour un placement bancaire à intérêts composés de 5% par an, le capital suit une suite géométrique de raison q = 1.05. On applique la formule générale pour déterminer l'année où un objectif financier est atteint."
            }
          ],
          conclusion: "Conclusion : Ces suites permettent de résoudre des problèmes complexes d'optimisation et de projection temporelle."
        }
      ]
    },
    {
      id: "phys",
      subject: "Physique-Chimie",
      teacher: "Mme Diallo",
      module: "Module de Mécanique : Cinématique et Lois de Newton",
      chapters: [
        {
          num: "Chapitre 1",
          title: "Cinématique du point matériel",
          intro: "La cinématique est l'étude du mouvement des corps indépendamment des causes qui les produisent (les forces).",
          sections: [
            {
              letter: "a",
              title: "Notion de référentiel et vecteur position",
              content: "Pour décrire un mouvement, il faut choisir un repère d'espace associé à une horloge (référentiel). Le vecteur position OM(t) repère à chaque instant t la position du mobile dans un système cartésien (x(t), y(t), z(t))."
            },
            {
              letter: "b",
              title: "Vecteur vitesse et vecteur accélération",
              content: "Le vecteur vitesse v(t) est la dérivée temporelle du vecteur position : v = d(OM)/dt. Le vecteur accélération a(t) est la dérivée temporelle du vecteur vitesse : a = dv/dt."
            },
            {
              letter: "c",
              title: "Étude des mouvements simples",
              content: "Dans le cas d'un mouvement rectiligne uniformément accéléré (ex: chute libre sans frottement), l'accélération est constante (a = g), ce qui conduit aux équations horaires intégrées : v(t) = gt + v_0 et z(t) = 0.5*gt^2 + v_0*t + z_0."
            }
          ],
          conclusion: "Synthèse : La maîtrise des dérivées est indispensable pour passer de la position à l'accélération en physique."
        }
      ]
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 relative">
      
      {/* Effets lumineux d'arrière-plan */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* En-tête Premium */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles size={14} /> Contenu Pédagogique Intégral • Abidjan
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Cours Magistraux & Chapitres Détaillés
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Retrouvez l'intégralité des cours rédigés avec leurs introductions, sous-parties détaillées (a, b, c) et conclusions pour la classe de <strong className="text-slate-200">{student.class?.name || "Terminale"}</strong>.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 px-6 py-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <BookmarkCheck size={24} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Modules Rédigés</p>
            <p className="text-sm font-extrabold text-white">{detailedCourses.length} Disciplines</p>
          </div>
        </div>
      </div>

      {/* Liste des cours détaillés */}
      <div className="space-y-10 relative z-10">
        {detailedCourses.map((course) => (
          <div 
            key={course.id} 
            className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl space-y-8"
          >
            {/* En-tête de la discipline */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase">
                    {course.subject}
                  </span>
                  <span className="text-xs text-slate-400">Professeur : <strong className="text-slate-200">{course.teacher}</strong></span>
                </div>
                <h2 className="text-2xl font-extrabold text-white pt-1">{course.module}</h2>
              </div>

              <button 
                className="bg-white hover:bg-slate-200 text-black px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer w-fit"
              >
                <Download size={14} /> Télécharger le polycopié PDF
              </button>
            </div>

            {/* Chapitres détaillés */}
            <div className="space-y-8">
              {course.chapters.map((chap, cIdx) => (
                <div key={cIdx} className="bg-slate-950/80 border border-slate-800/80 p-6 md:p-8 rounded-2xl space-y-6">
                  
                  {/* Titre du Chapitre */}
                  <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
                    <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-extrabold">
                      {chap.num}
                    </span>
                    <h3 className="text-lg font-bold text-white">{chap.title}</h3>
                  </div>

                  {/* Introduction */}
                  <p className="text-sm text-slate-300 italic bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <strong className="text-cyan-400 not-italic">Introduction :</strong> {chap.intro}
                  </p>

                  {/* Sections a, b, c */}
                  <div className="space-y-6 pl-2 md:pl-4 border-l border-slate-800">
                    {chap.sections.map((sec, sIdx) => (
                      <div key={sIdx} className="space-y-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs">
                            {sec.letter}
                          </span>
                          {sec.title}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed pl-7">
                          {sec.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Conclusion / Bilan */}
                  <div className="mt-6 pt-4 border-t border-slate-900 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800/50 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-cyan-400">Conclusion du chapitre :</strong> {chap.conclusion}
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}