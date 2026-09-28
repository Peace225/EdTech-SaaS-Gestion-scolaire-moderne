import { auth } from "@/auth"
import { prisma } from "./prisma"
import { redirect } from "next/navigation"

export async function getParentStudents() {
  const session = await auth()
  if (!session) redirect("/login")
  if ((session.user as any).role!== "PARENT" && (session.user as any).role!== "ADMIN") {
    redirect("/login")
  }
  // LA SÉCURITÉ EST ICI : on ne fetch QUE ses enfants
  return prisma.student.findMany({
    where: { parentId: (session.user as any).id },
    include: {
      class: true,
      grades: { orderBy: { evaluationDate: "desc" }, take: 10 },
      invoices: true,
      absences: { where: { justified: false } }
    }
  })
}
