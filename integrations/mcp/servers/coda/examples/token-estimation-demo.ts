/**
 * Token Estimation Demo
 *
 * Shows how token estimation works in Coda MCP
 * Demonstrates context budgeting principles
 */

import { estimateTokens, estimateObjectTokens, calculateTokenRatio } from '../src/utils/token-counter.js';

// Example 1: Estimate tokens for plain text
console.log('=== Example 1: Plain Text Estimation ===\n');

const shortText = 'Hello world';
const longText = 'The quick brown fox jumps over the lazy dog. ' +
                 'This is a longer piece of text that demonstrates how token estimation works. ' +
                 'Each character uses approximately 1/4 of a token in most tokenizers.';

console.log(`Short text: "${shortText}"`);
console.log(`  Length: ${shortText.length} characters`);
console.log(`  Estimated tokens: ${estimateTokens(shortText)}`);
console.log();

console.log(`Long text: "${longText.substring(0, 60)}..."`);
console.log(`  Length: ${longText.length} characters`);
console.log(`  Estimated tokens: ${estimateTokens(longText)}`);
console.log();

// Example 2: Estimate tokens for JSON objects
console.log('=== Example 2: JSON Object Estimation ===\n');

const codaDocument = {
  id: 'doc_abc123',
  name: 'My Project Plan',
  title: 'Q4 2025 Planning',
  description: 'Comprehensive project planning document for Q4 2025 initiatives',
  pages: [
    {
      id: 'page_1',
      name: 'Overview',
      title: 'Project Overview',
      content: 'This is the overview page with project details and timeline'
    },
    {
      id: 'page_2',
      name: 'Timeline',
      title: 'Project Timeline',
      content: 'Key dates and milestones for the project'
    }
  ]
};

const tokens = estimateObjectTokens(codaDocument);
console.log('Coda document object:');
console.log(`  JSON size: ${JSON.stringify(codaDocument).length} characters`);
console.log(`  Estimated tokens: ${tokens}`);
console.log();

// Example 3: Track token usage per session
console.log('=== Example 3: Session Token Budgeting ===\n');

const contextBudget = 100000; // 100K tokens available
const usedTokens = 35000;    // Already used

console.log(`Context budget: ${contextBudget} tokens`);
console.log(`Tokens used: ${usedTokens} tokens`);
console.log(`Remaining: ${contextBudget - usedTokens} tokens (${Math.round((usedTokens / contextBudget) * 100)}%)`);
console.log();

const ratio = calculateTokenRatio(usedTokens, contextBudget);
console.log(`Usage ratio: ${ratio}`);

if (ratio >= 0.8) {
  console.log('⚠️  WARNING: Context usage is high, only 20% remaining');
} else if (ratio >= 0.5) {
  console.log('ℹ️  INFO: Context is at 50%, be mindful of token usage');
} else {
  console.log('✓ Plenty of context available');
}
console.log();

// Example 4: Simulate multiple tool calls
console.log('=== Example 4: Multi-Tool Session Simulation ===\n');

interface ToolCall {
  name: string;
  params: Record<string, any>;
}

const toolCalls: ToolCall[] = [
  {
    name: 'resources/list',
    params: { limit: 10 }
  },
  {
    name: 'docs/get',
    params: { docId: 'doc_abc123' }
  },
  {
    name: 'pages/list',
    params: { docId: 'doc_abc123', limit: 50 }
  },
  {
    name: 'rows/list',
    params: { docId: 'doc_abc123', tableId: 'table_1', limit: 100 }
  }
];

let totalTokens = 0;

console.log('Simulating tool call sequence:\n');

for (const tool of toolCalls) {
  const params = JSON.stringify(tool.params);
  const tokens = estimateObjectTokens({ method: tool.name, params: tool.params });
  totalTokens += tokens;

  console.log(`• ${tool.name}`);
  console.log(`  Params: ${params}`);
  console.log(`  Tokens: ${tokens}`);
  console.log(`  Running total: ${totalTokens} tokens`);
  console.log();
}

console.log(`Session total: ${totalTokens} tokens`);
console.log(`Usage: ${Math.round((totalTokens / contextBudget) * 100)}% of ${contextBudget} token budget`);
console.log();

// Example 5: How to prevent token overflow
console.log('=== Example 5: Token Overflow Prevention ===\n');

const maxTokensPerRequest = 5000;
const requests = [
  { name: 'resources/list', response: 1200 },
  { name: 'docs/get', response: 8000 }, // Too large!
  { name: 'pages/list', response: 2500 },
];

console.log(`Max tokens per request: ${maxTokensPerRequest}\n`);

for (const req of requests) {
  if (req.response > maxTokensPerRequest) {
    console.log(`⚠️  ${req.name}: ${req.response} tokens (EXCEEDS LIMIT)`);
    console.log(`   Solution: Use pagination or response filtering`);
  } else {
    console.log(`✓ ${req.name}: ${req.response} tokens (OK)`);
  }
}

console.log();
console.log('=== Token Estimation Demo Complete ===\n');
console.log('Key takeaways:');
console.log('• Always estimate tokens before sending large responses');
console.log('• Track cumulative usage per session');
console.log('• Reserve 20% of context for safety margin');
console.log('• Use progressive disclosure for large results');
console.log('• Implement pagination when response tokens exceed budget');
