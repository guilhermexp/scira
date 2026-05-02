export function shouldForkSharedChatContinuation(params: {
  initialChatId?: string;
  isOwner: boolean;
  allowContinuation: boolean;
}): boolean {
  return Boolean(params.initialChatId && !params.isOwner && params.allowContinuation);
}
