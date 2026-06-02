-- AlterTable: 발행 게이트 — DailyIssue.status (draft | published). 신규 이슈 기본 draft.
ALTER TABLE "DailyIssue" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

-- CreateIndex
CREATE INDEX "DailyIssue_status_idx" ON "DailyIssue"("status");

-- 백필: 기존 이슈(시드·기존 발행분)는 이미 라이브였으므로 published로. 사이트가 비지 않게.
-- 이 마이그레이션 이후 생성되는 이슈는 default 'draft' → 운영자 검수 후 flip.
UPDATE "DailyIssue" SET "status" = 'published';
