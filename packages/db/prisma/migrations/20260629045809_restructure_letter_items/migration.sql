/*
  Warnings:

  - You are about to drop the column `body` on the `Letter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Letter" DROP COLUMN "body",
ADD COLUMN     "editorNote" TEXT;

-- CreateTable
CREATE TABLE "LetterItem" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "articleId" TEXT,

    CONSTRAINT "LetterItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LetterItem_letterId_order_idx" ON "LetterItem"("letterId", "order");

-- AddForeignKey
ALTER TABLE "LetterItem" ADD CONSTRAINT "LetterItem_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "Letter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
