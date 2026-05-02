import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldForkSharedChatContinuation } from '../../lib/chat-session.ts';

test('cria um novo chat ao continuar um chat publico de outro usuario', () => {
  assert.equal(
    shouldForkSharedChatContinuation({
      initialChatId: 'shared-chat-id',
      isOwner: false,
      allowContinuation: true,
    }),
    true,
  );
});

test('nao cria novo chat quando o dono continua o proprio chat', () => {
  assert.equal(
    shouldForkSharedChatContinuation({
      initialChatId: 'own-chat-id',
      isOwner: true,
      allowContinuation: true,
    }),
    false,
  );
});

test('nao cria novo chat quando continuacao esta desativada', () => {
  assert.equal(
    shouldForkSharedChatContinuation({
      initialChatId: 'shared-chat-id',
      isOwner: false,
      allowContinuation: false,
    }),
    false,
  );
});
