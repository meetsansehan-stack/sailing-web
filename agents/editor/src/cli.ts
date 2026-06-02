import { runEditor } from './index';

runEditor()
  .then((result) => {
    console.log('✅ editor 성공');
    console.log(`  logId: ${result.logId}`);
    console.log(`  처리 시간: ${result.processingTimeMs}ms`);
    console.log(`  테마: ${result.output.theme ?? '(없음)'} / 기사 ${result.output.articles.length}개 편집`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ editor 실패:', err);
    process.exit(1);
  });
