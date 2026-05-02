import assert from 'node:assert/strict';
import test from 'node:test';
import { EXTREME_INTERNAL_TOOL_NAMES, EXTREME_SUPPLEMENTAL_SOURCE_GUIDANCE } from '../../lib/extreme-search-tools.ts';

test('extreme search expoe reddit e youtube como ferramentas internas', () => {
  assert.equal(EXTREME_INTERNAL_TOOL_NAMES.includes('redditSearch'), true);
  assert.equal(EXTREME_INTERNAL_TOOL_NAMES.includes('youtubeSearch'), true);
});

test('guia do extreme orienta uso de Reddit e YouTube', () => {
  assert.match(EXTREME_SUPPLEMENTAL_SOURCE_GUIDANCE, /Reddit search/);
  assert.match(EXTREME_SUPPLEMENTAL_SOURCE_GUIDANCE, /YouTube search/);
});
