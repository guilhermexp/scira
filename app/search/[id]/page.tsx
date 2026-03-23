import { notFound, redirect } from 'next/navigation';
import { ChatInterface } from '@/components/chat-interface';
import { getUser } from '@/lib/auth-utils';
import { getChatWithUserAndInitialMessages } from '@/lib/db/chat-queries';
import { maindb } from '@/lib/db';
import { getChatById } from '@/lib/db/queries';
import { chat as chatTable, message as messageTable, Message, type Chat, type User } from '@/lib/db/schema';
import { Metadata } from 'next';
import { convertToUIMessages } from '@/lib/chat-messages';
import { eq } from 'drizzle-orm';
import { all } from 'better-all';
import { getBetterAllOptions } from '@/lib/better-all';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Get the base URL for the application (works in both dev and prod)
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://scira-repo.vercel.app';
  }
  return 'http://localhost:8931';
}

async function sleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

async function getFreshUserFromSession(): Promise<User | null> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  return (session?.user as User | null) ?? null;
}

async function getChatWithMessagesFromPrimary({
  id,
}: {
  id: string;
}): Promise<{ chat: Chat | null; messages: Message[] }> {
  const chat = (await maindb.query.chat.findFirst({ where: eq(chatTable.id, id) })) ?? null;

  if (!chat) {
    return { chat: null, messages: [] };
  }

  const messages = await maindb.query.message.findMany({
    where: eq(messageTable.chatId, id),
    orderBy: (fields, { asc }) => [asc(fields.createdAt), asc(fields.id)],
  });

  return { chat: chat as unknown as Chat, messages: messages as unknown as Message[] };
}

async function getChatWithMessagesFromPrimaryWithBackoff(id: string): Promise<{ chat: Chat | null; messages: Message[] }> {
  const deadline = Date.now() + CHAT_PRIMARY_BACKOFF_MAX_WAIT_MS;
  let delayMs = CHAT_PRIMARY_BACKOFF_INITIAL_DELAY_MS;
  let result: { chat: Chat | null; messages: Message[] } = { chat: null, messages: [] };

  while (Date.now() < deadline) {
    result = await getChatWithMessagesFromPrimary({ id });
    if (result.chat) {
      return result;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await sleep(Math.min(delayMs, remaining));
    delayMs = Math.min(delayMs * 2, CHAT_PRIMARY_BACKOFF_MAX_DELAY_MS);
  }

  return result;
}

// metadata
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = (await params).id;
  const chat = await getChatById({ id });

  if (!chat) {
    return { title: 'Scira Chat' };
  }
  let title;
  // if chat is public, return title
  if (chat.visibility === 'public') {
    title = chat.title;
  }
  // if chat is private, return title
  if (chat.visibility === 'private') {
    if (!user) {
      title = 'Scira Chat';
    }
    if (user!.id !== chat.userId) {
      title = 'Scira Chat';
    }
    title = chat.title;
  }
  const baseUrl = getBaseUrl();
  const siteName = new URL(baseUrl).hostname;

  return {
    title: title,
    description: 'A search in scira.ai',
    openGraph: {
      title: title,
      url: `${baseUrl}/search/${id}`,
      description: 'A search in scira.ai',
      siteName: siteName,
      images: [
        {
          url: `${baseUrl}/api/og/chat/${id}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      url: `${baseUrl}/search/${id}`,
      description: 'A search in scira.ai',
      siteName: siteName,
      creator: '@sciraai',
      images: [
        {
          url: `${baseUrl}/api/og/chat/${id}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    alternates: {
      canonical: `${baseUrl}/search/${id}`,
    },
  } as Metadata;
}

function convertToUIMessages(messages: Message[]): ChatMessage[] {
  console.log('Messages: ', messages);

  return messages.map((message) => {
    // Handle the parts array which comes from JSON in the database
    const partsArray = Array.isArray(message.parts) ? message.parts : [];
    const convertedParts = partsArray
      // First convert legacy tool invocations
      .map((part: unknown) => convertLegacyToolInvocation(part))
      // Then convert legacy reasoning parts
      .map((part: unknown) => convertLegacyReasoningPart(part));

    return {
      id: message.id,
      role: message.role as 'user' | 'assistant' | 'system',
      parts: convertedParts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
      metadata: {
        createdAt: formatISO(message.createdAt),
        model: message.model ?? '',
        completionTime: message.completionTime,
        inputTokens: message.inputTokens,
        outputTokens: message.outputTokens,
        totalTokens: message.totalTokens,
      },
    };
  });
}

function convertLegacyToolInvocation(part: unknown): unknown {
  // Check if this is a legacy tool-invocation part
  if (
    typeof part === 'object' &&
    part !== null &&
    'type' in part &&
    part.type === 'tool-invocation' &&
    'toolInvocation' in part &&
    typeof part.toolInvocation === 'object' &&
    part.toolInvocation !== null &&
    'toolName' in part.toolInvocation
  ) {
    const toolInvocation = part.toolInvocation as {
      toolName: string;
      toolCallId: string;
      state: string;
      args: unknown;
      result: unknown;
    };

    // Map old state to new state
    const mapState = (oldState: string): string => {
      switch (oldState) {
        case 'result':
          return 'output-available';
        case 'partial-result':
          return 'input-available';
        case 'call':
          return 'input-streaming';
        default:
          return oldState; // Keep unknown states as-is
      }
    };

    // Return the new format
    return {
      type: `tool-${toolInvocation.toolName}`,
      toolCallId: toolInvocation.toolCallId,
      state: mapState(toolInvocation.state),
      input: toolInvocation.args,
      output: toolInvocation.result,
    };
  }

  // Return the part unchanged if it's not a legacy tool-invocation
  return part;
}

// Convert legacy reasoning structures to the standard ReasoningUIPart shape
function convertLegacyReasoningPart(part: unknown): unknown {
  if (typeof part !== 'object' || part === null || !('type' in part)) {
    return part;
  }

  // Narrow the type
  const maybePart = part as {
    type?: unknown;
    text?: unknown;
    reasoning?: unknown;
    details?: unknown;
  };

  // Only handle legacy reasoning-like entries
  if (maybePart.type === 'reasoning') {
    // If already in the desired shape (has string text), keep as-is
    if (typeof maybePart.text === 'string' && maybePart.text.length > 0) {
      return part;
    }

    // Collect text from possible legacy fields
    const mainText = typeof maybePart.reasoning === 'string' ? maybePart.reasoning : '';

    let detailsText = '';
    if (Array.isArray(maybePart.details)) {
      const collected: string[] = [];
      for (const entry of maybePart.details as Array<unknown>) {
        if (
          typeof entry === 'object' &&
          entry !== null &&
          'type' in entry &&
          (entry as { type?: unknown }).type === 'text' &&
          'text' in entry &&
          typeof (entry as { text?: unknown }).text === 'string'
        ) {
          collected.push((entry as { text: string }).text);
        }
      }
      if (collected.length > 0) {
        detailsText = collected.join('\n\n');
      }
    }

    const combinedText = [mainText, detailsText].filter((v) => v && v.trim().length > 0).join('\n\n');

    return {
      type: 'reasoning',
      text: combinedText,
    };
  }

  // Some logs store step markers; ignore or pass-through for non-reasoning types
  return part;
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  console.log('🔍 [PAGE] Starting optimized chat page load for:', id);
  const pageStartTime = Date.now();

  const { user, chatBundle, primaryFallback } = await all(
    {
      user: async function () {
        return getUser();
      },
      chatBundle: async function () {
        return getChatWithUserAndInitialMessages({
          id,
        });
      },
      primaryFallback: async function () {
        const { chat, messages } = await this.$.chatBundle;
        if (chat && messages.length > 0) return null;
        return getChatWithMessagesFromPrimaryWithBackoff(id);
      },
    },
    getBetterAllOptions(),
  );

  // Use optimized combined query to get chat, user, and messages in fewer DB calls
  const { chat, messages: messagesFromDb } = await getChatWithUserAndInitialMessages({
    id,
    messageLimit: 20,
    messageOffset: 0,
  });

  // Lookout/scheduled runs create chats server-side; replica reads can lag.
  // If the replica returns no chat or no messages, fall back to the primary DB for fresh reads.
  if (primaryFallback) {
    chat = primaryFallback.chat ?? chat;
    if (primaryFallback.messages.length > 0) {
      messagesFromDb = primaryFallback.messages;
    }
  }

  if (!chat) notFound();

  console.log('Chat: ', chat);
  console.log('Messages from DB: ', messagesFromDb);

  // Check visibility and ownership
  let effectiveUser = user;
  if (chat.visibility === 'private') {
    // Guard against stale in-process session cache returning null while
    // the request cookie is actually valid (prevents /search -> /sign-in -> / loop).
    if (!effectiveUser) {
      effectiveUser = await getFreshUserFromSession();
    }

    if (!effectiveUser) {
      redirect(`/sign-in?redirectTo=/search/${id}`);
    }

    if (effectiveUser.id !== chat.userId) {
      return notFound();
    }
  }

  const initialMessages = convertToUIMessages(messagesFromDb);

  // Determine if the current user owns this chat
  const isOwner = effectiveUser ? effectiveUser.id === chat.userId : false;

  const pageLoadTime = (Date.now() - pageStartTime) / 1000;
  console.log(`⏱️  [PAGE] Total page load time: ${pageLoadTime.toFixed(2)}s`);

  return (
    <ChatInterface
      key={`chat-interface-${id}`}
      initialChatId={id}
      initialMessages={initialMessages}
      initialVisibility={chat.visibility as 'public' | 'private'}
      isOwner={isOwner}
      initialAllowContinuation={chat.allowContinuation}
    />
  );
}
