'use server';

import {
  deleteChatById,
  deleteMessagesByChatIdAfterTimestamp,
  getChatsByUserId,
  getChatWithUserById,
  getMessageById,
  getRecentChatsByUserId,
  updateChatPinnedById,
  updateChatTitleById,
  updateChatVisibilityById,
} from '@/lib/db/queries';

type ChatListResult = Awaited<ReturnType<typeof getChatsByUserId>>;

export async function getChatMeta(chatId: string, viewerUserId?: string) {
  if (!chatId) return null;

  try {
    const chat = await getChatWithUserById({ id: chatId });

    if (!chat) return null;

    const isOwner = viewerUserId ? chat.userId === viewerUserId : false;

    return {
      id: chat.id,
      title: chat.title,
      visibility: chat.visibility as 'public' | 'private',
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      user: {
        id: chat.userId,
        name: chat.userName,
        email: chat.userEmail,
        image: chat.userImage,
      },
      isOwner,
    } as const;
  } catch (error) {
    console.error('Error in getChatMeta:', error);
    return null;
  }
}

export async function deleteChat(chatId: string) {
  if (!chatId) return null;

  try {
    return await deleteChatById({ id: chatId });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return null;
  }
}

export async function getRecentChats(
  userId: string,
  limit: number = 8,
): Promise<{
  chats: Array<{
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    isPinned: boolean;
    visibility: 'public' | 'private';
  }>;
  hasMore: boolean;
}> {
  if (!userId) return { chats: [], hasMore: false };

  try {
    return await getRecentChatsByUserId({ userId, limit });
  } catch (error) {
    if (process.env.SELF_HOSTED_PERSONAL_USE === 'true') {
      return { chats: [], hasMore: false };
    }

    console.error('Error fetching recent chats:', error);
    return { chats: [], hasMore: false };
  }
}

export async function getUserChats(
  userId: string,
  limit: number = 20,
  startingAfter?: string,
  endingBefore?: string,
): Promise<ChatListResult> {
  if (!userId) return { chats: [], hasMore: false };

  try {
    return await getChatsByUserId({
      id: userId,
      limit,
      startingAfter: startingAfter || null,
      endingBefore: endingBefore || null,
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return { chats: [], hasMore: false };
  }
}

export async function loadMoreChats(
  userId: string,
  lastChatId: string,
  limit: number = 20,
  cursorDate?: string,
  cursorIsPinned?: boolean,
): Promise<ChatListResult> {
  if (!userId || !lastChatId) return { chats: [], hasMore: false };

  try {
    return await getChatsByUserId({
      id: userId,
      limit,
      startingAfter: null,
      endingBefore: lastChatId,
      cursorDate: cursorDate || null,
      cursorIsPinned: cursorIsPinned ?? null,
    });
  } catch (error) {
    console.error('Error loading more chats:', error);
    return { chats: [], hasMore: false };
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  try {
    const [message] = await getMessageById({ id });

    if (!message) {
      console.error(`No message found with id: ${id}`);
      return;
    }

    await deleteMessagesByChatIdAfterTimestamp({
      chatId: message.chatId,
      timestamp: message.createdAt,
    });
  } catch (error) {
    console.error(`Error deleting trailing messages: ${error}`);
    throw error;
  }
}

export async function updateChatTitle(chatId: string, title: string) {
  if (!chatId || !title.trim()) return null;

  try {
    return await updateChatTitleById({ chatId, title: title.trim() });
  } catch (error) {
    console.error('Error updating chat title:', error);
    return null;
  }
}

export async function updateChatPinned(chatId: string, isPinned: boolean) {
  if (!chatId) return null;

  try {
    return await updateChatPinnedById({ chatId, isPinned });
  } catch (error) {
    console.error('Error updating chat pinned state:', error);
    return null;
  }
}

export async function updateChatVisibility(chatId: string, visibility: 'private' | 'public') {
  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  try {
    const result = await updateChatVisibilityById({ chatId, visibility });

    return {
      success: true,
      chatId,
      visibility,
      rowCount: result?.rowCount || 0,
    };
  } catch (error) {
    console.error('Error updating chat visibility:', error);
    throw error;
  }
}
