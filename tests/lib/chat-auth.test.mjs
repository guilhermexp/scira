import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAuthenticatedChatUserId } from '../../lib/chat-auth-utils.ts';

test('usa o userId local do banco para ownership de chat quando disponivel', () => {
  assert.equal(
    resolveAuthenticatedChatUserId({
      localUserId: 'local-user-id',
      clerkUserId: 'clerk-user-id',
    }),
    'local-user-id',
  );
});

test('faz fallback para o userId do Clerk quando nao existe usuario local', () => {
  assert.equal(
    resolveAuthenticatedChatUserId({
      localUserId: null,
      clerkUserId: 'clerk-user-id',
    }),
    'clerk-user-id',
  );
});
