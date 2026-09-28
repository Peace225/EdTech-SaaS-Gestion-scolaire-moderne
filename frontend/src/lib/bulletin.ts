import { prisma } from "./prisma"

type BySubject = {
  total: number
  totalCoef: number
  notes: number[]
}

export async function getBulletin(studentId: string, term: string) {
  const grades = await prisma.grade.findMany({
    where: { studentId, term },
    orderBy: { subject: "asc" }
  })

  const bySubject: Record<string, BySubject> = {}

  for (const g of grades) {
    if (!bySubject[g.subject]) {
      bySubject[g.subject] = { total: 0, totalCoef: 0, notes: [] }
    }
    const coef = (g as any).coef ?? 1 // sécurité si ancienne data sans coef
    bySubject[g.subject].total += g.score * coef
    bySubject[g.subject].totalCoef += coef
    bySubject[g.subject].notes.push(g.score)
  }

  const subjects = Object.entries(bySubject).map(([subject, data]) => ({
    subject,
    moyenne: data.totalCoef > 0 ? data.total / data.totalCoef : 0,
    notes: data.notes,
    coef: data.totalCoef
  }))

  const generalRaw = subjects.length > 0
    ? subjects.reduce((acc, s) => acc + s.moyenne, 0) / subjects.length
    : 0

  const moyenneGenerale = Number(generalRaw.toFixed(2))

  return {
    subjects: subjects.map(s => ({
      ...s,
      moyenne: Number(s.moyenne.toFixed(2))
    })),
    moyenneGenerale,
    totalMatieres: subjects.length,
    rang: null,
    mention: moyenneGenerale >= 10 ? "Admis" : "Ajourné",
  }
}

// Bonus: bulletin annuel T1+T2+T3
export async function getBulletinAnnuel(studentId: string) {
  const [t1, t2, t3] = await Promise.all([
    getBulletin(studentId, "T1"),
    getBulletin(studentId, "T2"),
    getBulletin(studentId, "T3"),
  ])
  const annuelle = (t1.moyenneGenerale + t2.moyenneGenerale + t3.moyenneGenerale) / 3
  return { t1, t2, t3, annuelle: Number(annuelle.toFixed(2)) }
}
