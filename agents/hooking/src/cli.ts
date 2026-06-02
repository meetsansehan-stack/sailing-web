import { runHooking } from './index';

runHooking()
  .then((result) => {
    console.log('✅ hooking 성공');
    console.log(`  logId: ${result.logId}`);
    console.log(`  처리 시간: ${result.processingTimeMs}ms`);
    console.log(`  title: ${result.output.cardHook}`);
    console.log(`  summary: ${result.output.homeCopy}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ hooking 실패:', err);
    process.exit(1);
  });
