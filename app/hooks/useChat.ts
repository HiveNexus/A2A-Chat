import { useState, useCallback, useMemo, useRef } from 'react';
import { DbMessage } from '@/types/chat';
import { Task, Artifact, TaskStatus, Part } from '@/types/a2a';
import { ProxiedA2AClient } from '@/app/service/ProxiedA2AClient';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database';
import { v4 as uuidv4 } from 'uuid';

import { getUserFriendlyErrorMessage } from '@/app/utils/errorHandling';

export function useChat(chatId: string, agentId: string) {
  // Fetch agent from database if agentId is provided
  const agent = useLiveQuery(
    async () => {
      return await db.agents.where('id').equals(agentId).first();
    },
    [agentId]
  );

  // Create client only when agent with card is available
  const client = useMemo(() => {
    if (agent?.card?.url) {
      return new ProxiedA2AClient(agent.card.url);
    }
    return null;
  }, [agent?.card?.url]);

  // 状态变量，用于跟踪任务状态和响应
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  // 新增本地响应消息状态
  const [responseMessage, setResponseMessage] = useState<DbMessage | null>(null);

  // 使用ref来存储这些值，避免未使用变量的警告
  const taskStatusRef = useRef<TaskStatus | undefined>(undefined);

  // 创建setter函数
  const setTaskStatus = useCallback((status: TaskStatus) => {
    taskStatusRef.current = status;
  }, []);

  // Use live query to automatically subscribe to messages
  const messages = useLiveQuery(
    async () => {
      return await db.messages.where({ chatId }).toArray();
    },
    [chatId],
    [] // default value when loading
  );

  // Store message in database
  const storeMessage = useCallback(async (message: DbMessage) => {
    try {
      const messageWithMetadata = {
        ...message,
        chatId,
        createdAt: new Date(),
      };
      await db.messages.add(messageWithMetadata);
      return messageWithMetadata;
    } catch (err) {
      console.error('Failed to store message:', err);
      return message;
    }
  }, [chatId]);

  // 发送任务到 A2A
  const sendTask = useCallback(async (content: string): Promise<Task | null> => {
    if (!client) {
      setError('Agent client not available');
      return null;
    }
    try {
      setIsLoading(true);
      const result = await client.sendTask({
        message: {
          role: 'user',
          parts: [{
            type: 'text',
            text: content
          }],
          messageId: uuidv4()
        }
      });
      return result;
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const cancelTask = useCallback(async () => {
    if (!client || !currentTaskId) {
      return false;
    }

    try {
      await client.cancelTask({ id: currentTaskId });
      setIsLoading(false);
      setCurrentTaskId(null);
      return true;
    } catch (err) {
      console.error('Failed to cancel task:', err);
      // Show error message to user when cancellation fails
      setError(getUserFriendlyErrorMessage(err));
      return false;
    }
  }, [client, currentTaskId]);

  const sendTaskSubscribe = useCallback(async (content: string) => {
    if (!client) {
      setError('Agent client not available');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      setCurrentTaskId(chatId);
      const userMessage: DbMessage = {
        role: 'user',
        type: 'message',
        parts: [{
          type: 'text',
          text: content
        }]
      };
      await storeMessage(userMessage);
      const isFirstMessage = (await db.messages.where({ chatId }).count()) <= 1;
      let timeoutId: NodeJS.Timeout | null = null;
      if (isFirstMessage) {
        const titleText = content.trim();
        const truncatedTitle = titleText.length > 60
          ? titleText.substring(0, 60) + '...'
          : titleText;
        await db.chats.where({ id: chatId }).modify({
          title: truncatedTitle,
          updatedAt: new Date(),
        });
        timeoutId = setTimeout(() => {
          if (isLoading) {
            setError('服务器响应超时，请稍后再试');
            setIsLoading(false);
            setCurrentTaskId(null);
          }
        }, 20000);
      }
      const result = client.sendTaskSubscribe({
        message: {
          role: 'user',
          parts: [{
            type: 'text',
            text: content
          }],
          messageId: uuidv4()
        }
      });
      let artifactTextParts: Part[] = [];
      for await (const event of result) {
        // Clear timeout on first response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        // 新协议 artifact-update
        if (event && event.kind === 'artifact-update') {
          if (Array.isArray(event.artifact.parts)) {
            artifactTextParts = artifactTextParts.concat(event.artifact.parts);
          }
          // 实时更新 responseMessage
          setResponseMessage({
            role: 'agent',
            type: 'artifact',
            name: event.artifact.name,
            description: event.artifact.description,
            parts: [...artifactTextParts],
          });
          if (event.lastChunk) {
            // Add artifact message to chat
            const artifactMessage: DbMessage = {
              role: 'agent',
              type: 'artifact',
              name: event.artifact.name,
              description: event.artifact.description,
              parts: [...artifactTextParts],
            };
            await storeMessage(artifactMessage);
            artifactTextParts = [];
            setIsLoading(false);
            setCurrentTaskId(null);
            setResponseMessage(null);
          }
        }
        // 新协议 status-update
        if (event && event.kind === 'status-update') {
          setTaskStatus(event.status);
          if (event.status.state) {
            await db.chats.where({ id: chatId }).modify({
              state: event.status.state,
              updatedAt: new Date(),
            });
          }
          if (event.status.message) {
            const normalizedParts: Part[] = [];
            for (const part of event.status.message.parts) {
              if (typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string') {
                normalizedParts.push({
                  type: 'text',
                  text: part.text
                });
              } else {
                normalizedParts.push(part as Part);
              }
            }
            const statusMessage: DbMessage = {
              role: event.status.message.role,
              type: 'message',
              parts: normalizedParts
            };
            await storeMessage(statusMessage);
          }
          // 任务完成时关闭 loading
          if (event.final || event.status.state === 'completed' || event.status.state === 'failed' || event.status.state === 'canceled') {
            setIsLoading(false);
            setCurrentTaskId(null);
          }
        }
      }
    } catch (err) {
      // Get a user-friendly error message
      const errorMessage = getUserFriendlyErrorMessage(err);
      setError(errorMessage);
      console.error('Error in sendTaskSubscribe:', err);

      // Add a system message to the chat explaining the error
      const errorSystemMessage: DbMessage = {
        role: 'agent',
        type: 'message',
        parts: [{
          type: 'text',
          text: errorMessage
        }]
      };

      // Store the error message in the chat
      await storeMessage(errorSystemMessage);
    } finally {
      setIsLoading(false);
      setCurrentTaskId(null);
    }
  }, [client, chatId, storeMessage, isLoading, setTaskStatus]);

  return {
    messages,
    responseMessage,
    isLoading,
    error,
    sendTask,
    sendTaskSubscribe,
    cancelTask,
  };
}
