import { useState, useCallback, useMemo, useRef } from 'react';
import { DbMessage } from '@/types/chat';
import { Task, Artifact, TaskStatus, Part } from '@/types/a2a';
import { ProxiedA2AClient } from '@/app/service/ProxiedA2AClient';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database';

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

  // 使用ref来存储这些值，避免未使用变量的警告
  const taskStatusRef = useRef<TaskStatus | undefined>(undefined);
  const responseArtifactRef = useRef<Artifact | undefined>(undefined);

  // 创建setter函数
  const setTaskStatus = useCallback((status: TaskStatus) => {
    taskStatusRef.current = status;
  }, []);

  const setResponseArtifact = useCallback((artifactOrUpdater: Artifact | ((prev?: Artifact) => Artifact)) => {
    if (typeof artifactOrUpdater === 'function') {
      responseArtifactRef.current = artifactOrUpdater(responseArtifactRef.current);
    } else {
      responseArtifactRef.current = artifactOrUpdater;
    }
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
        id: chatId,
        sessionId:chatId,
        message: {
          role: 'user',
          parts: [{
            type: 'text' as const,
            text: content
          }]
        }
      });
      return result;
    } catch (err) {
      // Use the helper function to format the error message
      setError(getUserFriendlyErrorMessage(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client, chatId]);

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

      // Set the current task ID to the chat ID (used for cancellation)
      setCurrentTaskId(chatId);

      // Add user message immediately
      const userMessage: DbMessage = {
        role: 'user',
        type: 'message',
        parts: [{
          type: 'text',
          text: content
        }]
      };

      // Store and update user message
      await storeMessage(userMessage);

      // Check if this is the first message in the conversation
      const isFirstMessage = (await db.messages.where({ chatId }).count()) <= 1;

      // Set up timeout for first message
      let timeoutId: NodeJS.Timeout | null = null;

      if (isFirstMessage) {
        // Update conversation title with the first message content (max 60 chars)
        const titleText = content.trim();
        const truncatedTitle = titleText.length > 60
          ? titleText.substring(0, 60) + '...'
          : titleText;

        // Update the chat title in the database
        await db.chats.where({ id: chatId }).modify({
          title: truncatedTitle,
          updatedAt: new Date(),
        });

        timeoutId = setTimeout(() => {
          if (isLoading) {
            // If still loading after timeout, show error
            setError('服务器响应超时，请稍后再试');
            setIsLoading(false);
            setCurrentTaskId(null);
          }
        }, 20000); // 20 seconds timeout
      }

      const result = client.sendTaskSubscribe({
        id: chatId,
        sessionId:chatId,
        message: {
          role: userMessage.role,
          parts: userMessage.parts
        }
      });

      for await (const event of result) {
        // Clear timeout on first response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if ('artifact' in event) {
          // Check if all text parts in the artifact have empty text values
          const textParts = event.artifact.parts.filter((part: Part) => part.type === 'text');
          const allTextPartsEmpty = textParts.length > 0 &&
            textParts.every((part: Part) => part.type === 'text' && 'text' in part && (!part.text || part.text.trim() === ''));

          // Skip this event if all text parts have empty text values
          if (allTextPartsEmpty) {
            console.log('Skipping artifact event with empty text parts');
            continue;
          }

          setResponseArtifact(prevArtifact => ({
            ...prevArtifact,
            ...event.artifact
          }));

          // Add artifact message to chat
          const artifactMessage: DbMessage = {
            role: 'agent',
            type: 'artifact',
            name: event.artifact.name || undefined,
            description: event.artifact.description || undefined,
            parts: event.artifact.parts
          };

          // Store and update artifact message
          await storeMessage(artifactMessage);

        }
        if ('status' in event) {
          setTaskStatus(event.status);

          // 更新 chat 表中的 state 字段
          if (event.status.state) {
            await db.chats.where({ id: chatId }).modify({
              state: event.status.state,
              updatedAt: new Date(),
            });
          }

          // 即使任务状态为failed，也不做特殊处理，让消息正常显示
          // If there's a message in the status, add it to chat
          if (event.status.message) {
            // Check if the message has non-empty text parts
            const hasNonEmptyTextParts = event.status.message.parts.some((part: unknown) => {
              // 检查是否是只有text属性的对象
              if (typeof part === 'object' && part !== null && 'text' in part) {
                const textValue = (part as { text: unknown }).text;
                return typeof textValue === 'string' && textValue.trim() !== '';
              }
              return false;
            });

            if (hasNonEmptyTextParts || event.status.message.parts.some((part: unknown) =>
              typeof part === 'object' && part !== null && 'type' in part && (part as { type: string }).type !== 'text'
            )) {
              // 确保每个part都有type字段
              const normalizedParts: Part[] = [];

              for (const part of event.status.message.parts) {
                // 检查是否是只有text属性的对象
                if (typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string') {
                  // 创建一个符合TextPart接口的对象
                  const textPart: Part = {
                    type: 'text',
                    text: part.text
                  };
                  normalizedParts.push(textPart);
                } else {
                  // 如果已经是合法的Part对象，直接添加
                  normalizedParts.push(part as Part);
                }
              }

              const statusMessage: DbMessage = {
                role: event.status.message.role,
                type: 'message',
                parts: normalizedParts
              };

              // 打印原始消息和规范化后的消息，用于调试
              console.log('Original message parts:', JSON.stringify(event.status.message.parts));
              console.log('Normalized message parts:', JSON.stringify(normalizedParts));

              // Store and update status message
              await storeMessage(statusMessage);
            } else {
              console.log('Skipping status message with empty text parts');
            }
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
  }, [client, chatId, storeMessage, isLoading, setResponseArtifact, setTaskStatus]);

  return {
    messages,
    isLoading,
    error,
    sendTask,
    sendTaskSubscribe,
    cancelTask,
  };
}
