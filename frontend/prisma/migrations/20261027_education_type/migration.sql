-- CreateEnum
CREATE TYPE "EducationType" AS ENUM ('SCHOOL', 'PROFESSIONAL');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "educationType" "EducationType" NOT NULL DEFAULT 'SCHOOL';
