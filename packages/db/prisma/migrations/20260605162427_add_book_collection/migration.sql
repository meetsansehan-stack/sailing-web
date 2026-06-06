-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "publisher" TEXT,
    "pubYear" INTEGER,
    "ageRange" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "whyRecommended" TEXT NOT NULL,
    "themes" TEXT[],
    "collection" TEXT NOT NULL,
    "collectionDate" TEXT NOT NULL,
    "links" JSONB,
    "sourceArticleIds" TEXT[],
    "credibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Book_collection_idx" ON "Book"("collection");

-- CreateIndex
CREATE INDEX "Book_collectionDate_idx" ON "Book"("collectionDate");

-- CreateIndex
CREATE INDEX "Book_isbn_idx" ON "Book"("isbn");

