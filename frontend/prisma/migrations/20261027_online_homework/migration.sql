-- CreateTable
CREATE TABLE "OnlineHomeworkQuestion" (
    "id" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" VARCHAR(1) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OnlineHomeworkQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnlineHomeworkAttempt" (
    "id" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "scorePercent" INTEGER,
    "correctAnswers" INTEGER,
    "totalQuestions" INTEGER,

    CONSTRAINT "OnlineHomeworkAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnlineHomeworkAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "choice" VARCHAR(1) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlineHomeworkAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnlineHomeworkQuestion_homeworkId_idx" ON "OnlineHomeworkQuestion"("homeworkId");

-- CreateIndex
CREATE UNIQUE INDEX "OnlineHomeworkQuestion_homeworkId_position_key" ON "OnlineHomeworkQuestion"("homeworkId", "position");

-- CreateIndex
CREATE INDEX "OnlineHomeworkAttempt_studentId_submittedAt_idx" ON "OnlineHomeworkAttempt"("studentId", "submittedAt");

-- CreateIndex
CREATE INDEX "OnlineHomeworkAttempt_expiresAt_submittedAt_idx" ON "OnlineHomeworkAttempt"("expiresAt", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnlineHomeworkAttempt_homeworkId_studentId_key" ON "OnlineHomeworkAttempt"("homeworkId", "studentId");

-- CreateIndex
CREATE INDEX "OnlineHomeworkAnswer_questionId_idx" ON "OnlineHomeworkAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "OnlineHomeworkAnswer_attemptId_questionId_key" ON "OnlineHomeworkAnswer"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "OnlineHomeworkQuestion" ADD CONSTRAINT "OnlineHomeworkQuestion_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineHomeworkAttempt" ADD CONSTRAINT "OnlineHomeworkAttempt_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineHomeworkAttempt" ADD CONSTRAINT "OnlineHomeworkAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineHomeworkAnswer" ADD CONSTRAINT "OnlineHomeworkAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "OnlineHomeworkAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineHomeworkAnswer" ADD CONSTRAINT "OnlineHomeworkAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "OnlineHomeworkQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
