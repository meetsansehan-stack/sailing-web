-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "mediaType" TEXT,
    "durationMin" INTEGER,
    "source" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "credibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "eventStartDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "tags" TEXT[],
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservableVenue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ageRange" TEXT NOT NULL,
    "entryMinAge" INTEGER,
    "region" TEXT NOT NULL,
    "reservationUrl" TEXT NOT NULL,
    "reservationChannel" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "pricing" TEXT NOT NULL,
    "schedule" TEXT,
    "description" TEXT NOT NULL,
    "credibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservableVenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyIssue" (
    "id" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "theme" TEXT,
    "hookingCopy" TEXT,
    "subjectLine" TEXT,
    "previewText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueArticle" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "customTitle" TEXT,
    "customDescription" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentLog" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "articleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input" JSONB,
    "output" JSONB,
    "errorMessage" TEXT,
    "processingTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "prompt" TEXT NOT NULL,
    "schema" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Article_category_idx" ON "Article"("category");

-- CreateIndex
CREATE INDEX "Article_contentType_idx" ON "Article"("contentType");

-- CreateIndex
CREATE INDEX "Article_issueDate_idx" ON "Article"("issueDate");

-- CreateIndex
CREATE INDEX "Article_eventStartDate_idx" ON "Article"("eventStartDate");

-- CreateIndex
CREATE INDEX "Article_deadline_idx" ON "Article"("deadline");

-- CreateIndex
CREATE INDEX "Article_createdAt_idx" ON "Article"("createdAt");

-- CreateIndex
CREATE INDEX "Article_url_idx" ON "Article"("url");

-- CreateIndex
CREATE INDEX "ReservableVenue_type_idx" ON "ReservableVenue"("type");

-- CreateIndex
CREATE INDEX "ReservableVenue_region_idx" ON "ReservableVenue"("region");

-- CreateIndex
CREATE INDEX "ReservableVenue_operator_idx" ON "ReservableVenue"("operator");

-- CreateIndex
CREATE INDEX "ReservableVenue_pricing_idx" ON "ReservableVenue"("pricing");

-- CreateIndex
CREATE UNIQUE INDEX "DailyIssue_issueDate_key" ON "DailyIssue"("issueDate");

-- CreateIndex
CREATE INDEX "DailyIssue_issueDate_idx" ON "DailyIssue"("issueDate");

-- CreateIndex
CREATE INDEX "IssueArticle_issueId_idx" ON "IssueArticle"("issueId");

-- CreateIndex
CREATE INDEX "IssueArticle_articleId_idx" ON "IssueArticle"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueArticle_issueId_articleId_key" ON "IssueArticle"("issueId", "articleId");

-- CreateIndex
CREATE INDEX "AgentLog_issueId_idx" ON "AgentLog"("issueId");

-- CreateIndex
CREATE INDEX "AgentLog_agentName_idx" ON "AgentLog"("agentName");

-- CreateIndex
CREATE INDEX "AgentLog_status_idx" ON "AgentLog"("status");

-- CreateIndex
CREATE INDEX "AgentLog_createdAt_idx" ON "AgentLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentConfig_name_key" ON "AgentConfig"("name");

-- AddForeignKey
ALTER TABLE "IssueArticle" ADD CONSTRAINT "IssueArticle_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "DailyIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueArticle" ADD CONSTRAINT "IssueArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentLog" ADD CONSTRAINT "AgentLog_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "DailyIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentLog" ADD CONSTRAINT "AgentLog_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
