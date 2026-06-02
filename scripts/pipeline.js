#!/usr/bin/env node

/**
 * Parenting Newsletter Pipeline Runner (레거시 stub — 단계 독립 실행만, 데이터 전달 없음).
 * 실제 오케스트레이션(데이터 전달 + 실패 등급 분기)은 agents-core의 runPipeline 사용.
 * 5단계: Research → Curation → Writer(건당) → Editor → Hooking. SPEC §7-E
 */

const { execSync } = require('child_process');
const path = require('path');

const AGENTS = ['research', 'curation', 'writer', 'editor', 'hooking'];

async function runPipeline() {
  console.log('🚀 Starting Parenting Newsletter Pipeline...');

  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  for (const agent of AGENTS) {
    console.log(`\n📋 Running ${agent} agent...`);

    try {
      // Run agent test script
      execSync(`pnpm agent:test ${agent}`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, AGENT_DATE: date }
      });

      console.log(`✅ ${agent} agent completed successfully`);
    } catch (error) {
      console.error(`❌ ${agent} agent failed:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 Pipeline completed successfully!');
}

if (require.main === module) {
  runPipeline().catch(console.error);
}

module.exports = { runPipeline };