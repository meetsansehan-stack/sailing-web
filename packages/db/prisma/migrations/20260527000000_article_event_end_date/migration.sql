-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "eventEndDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Article_eventEndDate_idx" ON "Article"("eventEndDate");
