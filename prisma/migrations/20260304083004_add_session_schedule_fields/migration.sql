-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "adminSummary" TEXT,
ADD COLUMN     "registrationEnd" TIMESTAMP(3),
ADD COLUMN     "registrationStart" TIMESTAMP(3),
ADD COLUMN     "resultUnlockedAt" TIMESTAMP(3);
