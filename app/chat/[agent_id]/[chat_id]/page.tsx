'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatContent from '@/app/components/ChatContent';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database';
import { useAgents } from '@/app/hooks/useAgents';
import { useChats } from '@/app/hooks/useChats';

export default function Chat() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agent_id as string;
  const chatId = params.chat_id as string;

  // Get the chat details to verify it belongs to the agent
  const chat = useLiveQuery(
    async () => {
      return await db.chats.where({ id: chatId }).first();
    },
    [chatId]
  );

  // Get agents and chats
  const { agents } = useAgents();
  const { chats, addChat, initializeChats } = useChats(agentId);

  // Initialize chats for the agent if needed
  useEffect(() => {
    if (agentId) {
      initializeChats(agentId);
    }
  }, [agentId, initializeChats]);

  // Verify that the chat belongs to the agent
  useEffect(() => {
    if (chat && chat.agentId !== agentId) {
      // Redirect to the correct agent if the chat doesn't belong to the current agent
      router.push(`/chat/${chat.agentId}/${chatId}`);
    }
  }, [chat, agentId, chatId, router]);

  return (
    <div className="flex-1 bg-white h-dvh">
      <ChatContent chatId={chatId} agentId={agentId} />
    </div>
  );
}
