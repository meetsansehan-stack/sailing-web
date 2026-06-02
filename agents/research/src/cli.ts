import { runResearch } from './index';

runResearch()
  .then((result) => {
    console.log('✅ research 성공');
    console.log(`  logId: ${result.logId}`);
    console.log(`  처리 시간: ${result.processingTimeMs}ms`);
    console.log(`  후보 ${result.output.articles.length}개`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ research 실패:', err);
    process.exit(1);
  });
