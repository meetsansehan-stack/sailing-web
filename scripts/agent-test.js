#!/usr/bin/env node

/**
 * Agent Test Runner
 * Tests individual agents using Claude API
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const { z } = require('zod');

const agentName = process.argv[2];
if (!agentName) {
  console.error('Usage: pnpm agent:test <agent-name>');
  process.exit(1);
}

const AGENT_DIR = path.join(__dirname, '..', 'agents', agentName);
const PROMPT_FILE = path.join(AGENT_DIR, 'prompt.md');
const SCHEMA_FILE = path.join(AGENT_DIR, 'schema.ts');

async function runAgent() {
  // Load prompt
  const prompt = fs.readFileSync(PROMPT_FILE, 'utf-8');

  // Load schema (simplified - in real implementation, use ts-node or compile)
  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  // For simplicity, assume schemas are defined

  // Initialize Claude
  const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
  });

  // Prepare input (mock for now)
  const input = {
    date: process.env.AGENT_DATE || new Date().toISOString(),
    categories: ['공교육', '사교육', '놀이', '문화', '산업']
  };

  const systemPrompt = `You are a ${agentName} agent for the parenting newsletter.

${prompt}

Respond with valid JSON matching the output schema.`;

  const userPrompt = `Input: ${JSON.stringify(input)}

Please process this input and return the result as JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    const result = JSON.parse(response.content[0].text);
    console.log(`✅ ${agentName} agent result:`, result);

    // In real implementation, save to DB
    // For now, just log

  } catch (error) {
    console.error(`❌ ${agentName} agent failed:`, error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAgent().catch(console.error);
}