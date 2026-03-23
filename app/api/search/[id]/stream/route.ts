import { auth as clerkAuth } from '@clerk/nextjs/server';
import { getChatById, getMessagesByChatId, getStreamIdsByChatId } from '@/lib/db/queries';
import type { Chat } from '@/lib/db/schema';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import { createUIMessageStream, JsonToSseTransformStream } from 'ai';
import { createResumableUIMessageStream } from 'ai-resumable-stream';
import { getResumableStreamClients } from '@/lib/redis';
import { differenceInSeconds } from 'date-fns';
import { all } from 'better-all';
import { getBetterAllOptions } from '@/lib/better-all';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: chatId } = await params;

  const clients = getResumableStreamClients();
  const resumeRequestedAt = new Date();

  if (!clients) {
    return new Response(null, { status: 204 });
  }

  if (!chatId) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const { userId } = await clerkAuth();

  if (!userId) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (chat.visibility === 'private' && chat.userId !== userId) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  if (!streamIds.length) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new ChatSDKError('not_found:stream').toResponse();
  }

  const emptyDataStream = createUIMessageStream<ChatMessage>({
    execute: () => {},
  });

  const stream = await context.resumeStream();

  const emptyDataStream = createUIMessageStream<ChatMessage>({
    execute: () => {},
  });

  /*
   * For when the generation is streaming during SSR
   * but the resumable stream has concluded at this point.
   */
  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId });
    console.log('Messages: ', messages);
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      console.log('No most recent message found');
      return new Response(emptyDataStream.pipeThrough(new JsonToSseTransformStream()), { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      console.log('Most recent message is not an assistant message');
      return new Response(emptyDataStream.pipeThrough(new JsonToSseTransformStream()), { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      console.log('Most recent message is too old');
      return new Response(emptyDataStream.pipeThrough(new JsonToSseTransformStream()), { status: 200 });
    }

    const restoredStream = createUIMessageStream<ChatMessage>({
      execute: ({ writer }) => {
        console.log('Restoring stream...');
        console.log('Most recent message: ', mostRecentMessage);
        writer.write({
          type: 'data-appendMessage',
          data: JSON.stringify(mostRecentMessage),
          transient: true,
        });
      },
    });

    return new Response(restoredStream.pipeThrough(new JsonToSseTransformStream()), { status: 200 });
  }

  return new Response((stream as ReadableStream<any>).pipeThrough(new JsonToSseTransformStream()), { status: 200 });
}
