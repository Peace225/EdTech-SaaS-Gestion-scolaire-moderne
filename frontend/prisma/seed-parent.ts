// prisma/seed-parent.ts
import { prisma } from "../src/lib/prisma"

async function main() {
  // 1. Récupérer le compte parent
  const parent = await prisma.user.findUnique({ 
    where: { email: "parent@ecole.ci" } 
  })

  if (!parent) {
    console.error("Compte parent introuvable. Veuillez exécuter le seed principal d'abord.")
    return
  }

  // 2. Mettre à jour les élèves rattachés au parent (par exemple via leurs emails ou une condition valide)
  await prisma.student.updateMany({
    where: { 
      user: { 
        email: { in: ["eleve@ecole.ci", "aminata@ecole.ci"] } 
      } 
    },
    data: { parentId: parent.id }
  })

  console.log("Rattachement des enfants au parent effectué avec succès !")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })