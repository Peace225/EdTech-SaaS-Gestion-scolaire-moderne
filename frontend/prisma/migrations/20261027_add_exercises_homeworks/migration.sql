-- CreateEnum
CREATE TYPE "ExerciseDifficulty" AS ENUM ('STANDARD', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ExerciseStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "HomeworkType" AS ENUM ('UPLOAD', 'ONLINE');

-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "ExerciseDifficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "status" "ExerciseStatus" NOT NULL DEFAULT 'DRAFT',
    "assignmentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homework" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "instructions" TEXT NOT NULL,
    "type" "HomeworkType" NOT NULL,
    "status" "HomeworkStatus" NOT NULL DEFAULT 'DRAFT',
    "durationMinutes" INTEGER,
    "dueDate" TIMESTAMP(3),
    "assignmentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exercise_assignmentId_status_createdAt_idx" ON "Exercise"("assignmentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Exercise_createdById_createdAt_idx" ON "Exercise"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "Homework_assignmentId_status_dueDate_idx" ON "Homework"("assignmentId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Homework_createdById_status_createdAt_idx" ON "Homework"("createdById", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeachingAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TeachingAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
