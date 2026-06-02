#!/usr/bin/env node

/**
 * Pipeline Dry Run
 * Simulates the pipeline without actual execution or sending
 */

const { runPipeline } = require('./pipeline');

async function dryRun() {
  console.log('🧪 Running pipeline in dry-run mode (no actual execution)...');

  // Set dry run environment
  process.env.DRY_RUN = 'true';

  // Run pipeline
  await runPipeline();

  console.log('✅ Dry run completed successfully!');
}

if (require.main === module) {
  dryRun().catch(console.error);
}