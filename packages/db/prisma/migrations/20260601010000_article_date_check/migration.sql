-- AlterTable: qa v0 날짜 검증 결과 저장 (원문 재호출로 deadline/event 날짜 실재 확인). nullable = 미검증.
ALTER TABLE "Article" ADD COLUMN     "dateCheck" JSONB;
