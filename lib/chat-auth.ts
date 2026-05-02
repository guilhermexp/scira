import { auth as clerkAuth } from '@clerk/nextjs/server';
import { getUser } from './auth-utils';
import { resolveAuthenticatedChatUserId } from './chat-auth-utils';

export async function getAuthenticatedChatUserId(): Promise<string | null> {
  const localUser = await getUser();

  if (localUser?.id) {
    return localUser.id;
  }

  const { userId } = await clerkAuth();

  return resolveAuthenticatedChatUserId({
    localUserId: localUser?.id ?? null,
    clerkUserId: userId ?? null,
  });
}
