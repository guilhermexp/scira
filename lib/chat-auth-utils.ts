export function resolveAuthenticatedChatUserId(params: {
  localUserId: string | null;
  clerkUserId: string | null;
}): string | null {
  return params.localUserId ?? params.clerkUserId ?? null;
}
