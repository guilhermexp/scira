import assert from 'node:assert/strict';
import test from 'node:test';
import { extractCitationUrls, normalizeXqlRequest, resolveSciraModelAlias } from '../../lib/scira-cli-contract.ts';

test('resolve alias publico da CLI para modelo valido do backend', () => {
  assert.equal(resolveSciraModelAlias('xai:grok-4.1-fast'), 'scira-grok4.1-fast-thinking');
  assert.equal(resolveSciraModelAlias('scira-grok-4-fast'), 'scira-grok-4-fast');
});

test('normaliza payload direto de xql com datas padrao e handles sanitizados', () => {
  const normalized = normalizeXqlRequest(
    {
      query: 'OpenAI',
      includeXHandles: ['@sama', ' openai '],
      maxResults: 10,
    },
    new Date('2026-04-08T12:00:00Z'),
  );

  assert.deepEqual(normalized, {
    query: 'OpenAI',
    startDate: '2026-03-24',
    endDate: '2026-04-08',
    includeXHandles: ['sama', 'openai'],
    excludeXHandles: undefined,
    postFavoritesCount: undefined,
    postViewCount: undefined,
    maxResults: 15,
  });
});

test('extrai apenas urls de citacao unicas e ignora fontes nao-url', () => {
  const urls = extractCitationUrls([
    { sourceType: 'url', url: 'https://x.com/a/status/1' },
    { sourceType: 'url', url: 'https://x.com/a/status/1' },
    { sourceType: 'file', title: 'ignored' },
    { sourceType: 'url', url: 'https://x.com/b/status/2' },
  ]);

  assert.deepEqual(urls, ['https://x.com/a/status/1', 'https://x.com/b/status/2']);
});
