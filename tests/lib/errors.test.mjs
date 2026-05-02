import assert from 'node:assert/strict';
import test from 'node:test';
import { ChatSDKError, getErrorActions, getErrorIcon, isProRequired } from '../../lib/errors.ts';

test('forbidden:chat nao deve ser tratado como erro de Pro', () => {
  const error = new ChatSDKError('forbidden:chat');

  assert.equal(isProRequired(error), false);
  assert.deepEqual(getErrorActions(error), {
    primary: { label: 'Try Again', action: 'retry' },
  });
  assert.equal(getErrorIcon(error), 'error');
});

test('forbidden:model continua sendo tratado como restricao de Pro', () => {
  const error = new ChatSDKError('forbidden:model');

  assert.equal(isProRequired(error), true);
  assert.deepEqual(getErrorActions(error), {
    primary: { label: 'Upgrade to Pro', action: 'upgrade' },
    secondary: { label: 'Check Again', action: 'refresh' },
  });
  assert.equal(getErrorIcon(error), 'upgrade');
});
