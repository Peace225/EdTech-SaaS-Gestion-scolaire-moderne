import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const password = await bcrypt.hash("admin123", 10);
  const classe = await prisma.class.upsert({ where: { id: "classe-6e" }, update: {}, create: { id: "classe-6e", name: "6ème A", level: "6ème" } });

  for (const u of [
    { email: "admin@ecole.ci", name: "Admin", role: Role.ADMIN },
    { email: "teacher@ecole.ci", name: "Prof Math", role: Role.TEACHER },
    { email: "parent@ecole.ci", name: "Parent Kouassi", role: Role.PARENT },
    { email: "eleve@ecole.ci", name: "Junior Kouassi", role: Role.STUDENT },
  ]) {
    await prisma.user.upsert({ where: { email: u.email }, update: { role: u.role }, create: {...u, password } });
  }
  console.log("✅ 4 rôles seedés");
}
main().finally(()=>prisma.$disconnect());
