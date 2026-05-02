import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

const repoRoot = '/Users/guilhermevarela/Documents/Projetos/Desenvolvendo/scira';
const scriptPath = join(repoRoot, 'scripts/scira');

function createCurlStub() {
  const dir = mkdtempSync(join(tmpdir(), 'scira-cli-test-'));
  const stubPath = join(dir, 'curl-stub.sh');
  writeFileSync(
    stubPath,
    [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      'for arg in "$@"; do',
      '  printf "%s\\n" "$arg"',
      'done',
    ].join('\n'),
  );
  chmodSync(stubPath, 0o755);
  return { dir, stubPath };
}

function createStreamingCurlStub(output) {
  const dir = mkdtempSync(join(tmpdir(), 'scira-cli-stream-test-'));
  const stubPath = join(dir, 'curl-stream-stub.sh');
  writeFileSync(
    stubPath,
    ['#!/usr/bin/env bash', 'set -euo pipefail', `cat <<'EOF'\n${output}\nEOF`].join('\n'),
  );
  chmodSync(stubPath, 0o755);
  return { dir, stubPath };
}

test('search --raw monta curl de /api/search com payload esperado', () => {
  const { dir, stubPath } = createCurlStub();

  try {
    const result = spawnSync(
      scriptPath,
      ['search', 'test', '--raw'],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          SCIRA_CURL_BIN: stubPath,
          SCIRA_NOW: '2026-04-08',
        },
        encoding: 'utf8',
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /http:\/\/localhost:3000\/api\/search/);
    assert.match(result.stdout, /-N/);
    assert.match(result.stdout, /"group":"web"/);
    assert.match(result.stdout, /"text":"test"/);
    assert.match(result.stdout, /"model":"scira-grok4\.1-fast-thinking"/);
    assert.match(result.stdout, /"id":"cli-/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('x --since relativo converte datas e envia payload direto para /api/xql', () => {
  const { dir, stubPath } = createCurlStub();

  try {
    const result = spawnSync(
      scriptPath,
      ['x', 'ai agents', '--since', '7d', '--until', '2026-04-07', '-h', 'sama', '--min-likes', '100', '--min-views', '500', '--max-results', '25', '--raw'],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          SCIRA_CURL_BIN: stubPath,
          SCIRA_NOW: '2026-04-08',
        },
        encoding: 'utf8',
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /http:\/\/localhost:3000\/api\/xql/);
    assert.match(result.stdout, /"query":"ai agents"/);
    assert.match(result.stdout, /"startDate":"2026-04-01"/);
    assert.match(result.stdout, /"endDate":"2026-04-07"/);
    assert.match(result.stdout, /"includeXHandles":\["sama"\]/);
    assert.match(result.stdout, /"postFavoritesCount":100/);
    assert.match(result.stdout, /"postViewCount":500/);
    assert.match(result.stdout, /"maxResults":25/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('parser da CLI entende SSE atual com text-delta', () => {
  const { dir, stubPath } = createStreamingCurlStub(`
data: {"type":"start","messageId":"msg-1"}

data: {"type":"text-start","id":"text-1"}

data: {"type":"text-delta","id":"text-1","delta":"Agent "}

data: {"type":"text-delta","id":"text-1","delta":"Hermes"}

data: {"type":"text-end","id":"text-1"}

data: [DONE]
  `.trim());

  try {
    const result = spawnSync(
      scriptPath,
      ['search', 'agent hermes'],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          SCIRA_CURL_BIN: stubPath,
          SCIRA_NOW: '2026-04-08',
        },
        encoding: 'utf8',
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Agent Hermes/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
