import { runCuration } from './index';

runCuration()
  .then((result) => {
    console.log('✅ curation 성공');
    console.log(`  logId: ${result.logId}`);
    console.log(`  처리 시간: ${result.processingTimeMs}ms`);
    console.log(`  선별 ${result.output.totalSelected}개 → Article draft 적재`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ curation 실패:', err);
    process.exit(1);
  });
