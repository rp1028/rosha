-- CreateEnum
CREATE TYPE "AnnotationTag" AS ENUM ('INTONATION', 'RHYTHM', 'TEMPO', 'DYNAMICS', 'EXPRESSION', 'OTHER');

-- CreateTable
CREATE TABLE "ScoreAnnotation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "measureNumber" INTEGER,
    "timePosition" TEXT,
    "tag" "AnnotationTag",
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScoreAnnotation_applicationId_idx" ON "ScoreAnnotation"("applicationId");

-- CreateIndex
CREATE INDEX "ScoreAnnotation_evaluatorId_idx" ON "ScoreAnnotation"("evaluatorId");

-- AddForeignKey
ALTER TABLE "ScoreAnnotation" ADD CONSTRAINT "ScoreAnnotation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreAnnotation" ADD CONSTRAINT "ScoreAnnotation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Evaluator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
