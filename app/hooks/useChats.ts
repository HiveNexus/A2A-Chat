import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database';
import { Chat } from '@/types/chat';

export function useChats(agentId?: string) {
  // Use live query to automatically subscribe to chats for a specific agent
  const chats = useLiveQuery(
    async () => {
      if (!agentId) return [];
      // Get chats sorted by createdAt in descending order (newest first)
      return await db.chats
        .where('agentId')
        .equals(agentId)
        .sortBy('createdAt')
        .then(result => result.reverse());
    },
    [agentId],
    [] // default value when loading
  );

  const addChat = useCallback(async (chat: Omit<Chat, 'createdAt' | 'updatedAt'>) => {
    try {
      const newChat = {
        ...chat,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.chats.add(newChat as Chat);
      return newChat.id;
    } catch (err) {
      console.error('Failed to add chat:', err);
      return null;
    }
  }, []);

  const updateChat = useCallback(async (id: string, updates: Partial<Omit<Chat, 'id' | 'createdAt'>>) => {
    try {
      await db.chats.where({ id }).modify({
        ...updates,
        updatedAt: new Date(),
      });
      return true;
    } catch (err) {
      console.error('Failed to update chat:', err);
      return false;
    }
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    try {
      console.log(`Attempting to delete chat with ID: ${id}`);

      // First check if the chat exists
      const chatExists = await db.chats.where({ id }).count();
      if (chatExists === 0) {
        console.error(`Chat with ID ${id} not found`);
        return false;
      }

      // Delete all messages associated with this chat
      const messagesDeleted = await db.messages.where({ chatId: id }).delete();
      console.log(`Deleted ${messagesDeleted} messages for chat ${id}`);

      // Delete the chat itself
      const chatsDeleted = await db.chats.where({ id }).delete();
      console.log(`Deleted ${chatsDeleted} chats with ID ${id}`);

      if (chatsDeleted === 0) {
        console.error(`Failed to delete chat with ID ${id}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to delete chat:', err);
      return false;
    }
  }, []);

  // Initialize chats from database
  const initializeChats = useCallback(async (agentId: string) => {
    // Get the count of chats for this agent
    const count = await db.chats.where({ agentId }).count();
    // Just return the count - no longer adding default chats
    return count;
  }, []);

  return {
    chats,
    addChat,
    updateChat,
    deleteChat,
    initializeChats,
  };
}
