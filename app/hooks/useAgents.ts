import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database';
import { Agent } from '@/types/chat';

export function useAgents() {
  // Use live query to automatically subscribe to agents
  const agents = useLiveQuery(
    async () => {
      try {
        // Get agents sorted by createdAt in descending order (newest first)
        return await db.agents
          .orderBy('createdAt')
          .reverse()
          .toArray();
      } catch (error) {
        console.error('Error sorting agents by createdAt:', error);
        // Fallback: return all agents without sorting if there's an error
        return await db.agents.toArray();
      }
    },
    [],
    [] // default value when loading
  );

  const addAgent = useCallback(async (agent: Agent) => {
    try {
      // Add createdAt timestamp if not already set
      const agentWithTimestamp = {
        ...agent,
        createdAt: agent.createdAt || new Date(),
      };
      await db.agents.add(agentWithTimestamp);
      return true;
    } catch (err) {
      console.error('Failed to add agent:', err);
      return false;
    }
  }, []);

  const deleteAgent = useCallback(async (agentId: string) => {
    try {
      console.log(`Attempting to delete agent with ID: ${agentId}`);

      // First check if the agent exists
      const agentExists = await db.agents.where({ id: agentId }).count();
      if (agentExists === 0) {
        console.error(`Agent with ID ${agentId} not found`);
        return false;
      }

      // Get all chats for this agent
      const agentChats = await db.chats.where({ agentId }).toArray();

      // Delete all messages for each chat
      for (const chat of agentChats) {
        const messagesDeleted = await db.messages.where({ chatId: chat.id }).delete();
        console.log(`Deleted ${messagesDeleted} messages for chat ${chat.id}`);
      }

      // Delete all chats for this agent
      const chatsDeleted = await db.chats.where({ agentId }).delete();
      console.log(`Deleted ${chatsDeleted} chats for agent ${agentId}`);

      // Delete the agent itself
      const agentsDeleted = await db.agents.where({ id: agentId }).delete();
      console.log(`Deleted ${agentsDeleted} agents with ID ${agentId}`);

      if (agentsDeleted === 0) {
        console.error(`Failed to delete agent with ID ${agentId}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to delete agent:', err);
      return false;
    }
  }, []);

  return {
    agents,
    addAgent,
    deleteAgent,
  };
}
