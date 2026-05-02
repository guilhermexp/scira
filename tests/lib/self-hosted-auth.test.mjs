import assert from 'node:assert/strict';
import test from 'node:test';
import { isAuthenticationBypassed } from '../../lib/self-hosted-auth.ts';

test('self-hosted faz bypass de auth por padrao', () => {
  assert.equal(isAuthenticationBypassed(), true);
});

test('env pode reativar auth explicitamente', () => {
  assert.equal(isAuthenticationBypassed({ SELF_HOSTED_BYPASS_AUTH: 'false' }), false);
  assert.equal(isAuthenticationBypassed({ SELF_HOSTED_BYPASS_AUTH: '0' }), false);
});
