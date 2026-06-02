import { runWriter } from './index';

// 사용법: pnpm --filter @parenting-newsletter/agent-writer dev <articleId>
const articleId = process.argv[2];

if (!articleId) {
  console.error('❌ articleId 인자가 필요합니다. 예: pnpm ... dev <articleId>');
  process.exit(1);
}

runWriter({ articleId })
  .then((result) => {
    console.log('✅ writer 성공');
    console.log(`  logId: ${result.logId}`);
    console.log(`  처리 시간: ${result.processingTimeMs}ms`);
    console.log(`  body 길이: ${result.output.body.length}자`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ writer 실패:', err);
    process.exit(1);
  });
