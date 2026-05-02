import assert from 'node:assert/strict';
import test from 'node:test';
import { getMessageTextContent, isInternalDataPart } from '../../lib/chat-message.ts';

test('usa o ultimo part de texto disponivel mesmo quando o ultimo part nao e texto', () => {
  const message = {
    content: 'fallback',
    parts: [
      { type: 'text', text: 'primeiro texto' },
      { type: 'data-extreme_search', data: { kind: 'plan' } },
    ],
  };

  assert.equal(getMessageTextContent(message), 'primeiro texto');
});

test('faz fallback para content quando nao ha part de texto', () => {
  const message = {
    content: 'fallback',
    parts: [{ type: 'data-extreme_search', data: { kind: 'plan' } }],
  };

  assert.equal(getMessageTextContent(message), 'fallback');
});

test('reconhece parts internos de dados', () => {
  assert.equal(isInternalDataPart({ type: 'data-extreme_search' }), true);
  assert.equal(isInternalDataPart({ type: 'data-query_completion' }), true);
  assert.equal(isInternalDataPart({ type: 'text' }), false);
});
