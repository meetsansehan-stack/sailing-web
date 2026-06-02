-- AlterTable
ALTER TABLE "DailyIssue" DROP COLUMN "hookingCopy",
DROP COLUMN "previewText",
DROP COLUMN "subjectLine",
ADD COLUMN     "summary" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Article_issueDate_url_key" ON "Article"("issueDate", "url");

