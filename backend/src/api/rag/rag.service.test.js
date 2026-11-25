import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.GEMINI_API_KEY ||= 'rag-test-key';

const { chunkDocumentText } = await import('./rag.service.js');

test('chunkDocumentText normalizes whitespace and preserves overlapping excerpts', () => {
  const source = Array.from({ length: 30 }, (_, index) => `token-${index}`).join('  ');
  const chunks = chunkDocumentText(source, 40, 10);

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every(chunk => chunk.length <= 40));
  assert.ok(chunks[0].includes(chunks[1].split(' ')[0]));
});

test('chunkDocumentText returns no chunks for empty input', () => {
  assert.deepEqual(chunkDocumentText(' \n\t  '), []);
});

test('chunkDocumentText rejects invalid overlap settings', () => {
  assert.throws(() => chunkDocumentText('text', 20, 20), RangeError);
});
