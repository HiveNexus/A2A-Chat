'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Button } from 'antd';
import AgentList from '@/app/components/AgentList';
import ChatList from '@/app/components/ChatList';
import { useAgents } from '@/app/hooks/useAgents';
import { useChats } from '@/app/hooks/useChats';

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const params = useParams();

  // Get the agent_id from the URL if available
  const urlAgentId = params.agent_id as string | undefined;
  const urlChatId = params.chat_id as string | undefined;

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(urlAgentId || null);
  const { agents, addAgent, deleteAgent } = useAgents();
  const { chats, addChat, updateChat, deleteChat, initializeChats } = useChats(selectedAgentId || undefined);

  // Select the first agent by default when the component mounts if no agent is selected
  useEffect(() => {
    if (agents && agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
      router.push(`/chat/${agents[0].id}`);
    }
  }, [agents, selectedAgentId, router]);

  // Update selectedAgentId when URL agent_id changes
  useEffect(() => {
    if (urlAgentId && urlAgentId !== selectedAgentId) {
      setSelectedAgentId(urlAgentId);
    }
  }, [urlAgentId, selectedAgentId]);

  // Initialize chats for the selected agent
  useEffect(() => {
    if (selectedAgentId) {
      initializeChats(selectedAgentId);
    }
  }, [selectedAgentId, initializeChats]);

  const handleSelectAgent = (agentId: string) => {
    if (agentId !== selectedAgentId) {
      setSelectedAgentId(agentId);
      router.push(`/chat/${agentId}`);
    }
  };

  const handleNewChat = async () => {
    if (!selectedAgentId) return;

    const chatId = await addChat({
      id: uuidv4(),
      agentId: selectedAgentId,
      title: 'New Conversation',
      state: 'submitted',
    });

    if (chatId) {
      router.push(`/chat/${selectedAgentId}/${chatId}`);
    }
  };

  const handleEditChat = async (chatId: string, newTitle: string) => {
    return await updateChat(chatId, { title: newTitle });
  };

  const handleDeleteChat = async (chatId: string) => {
    return await deleteChat(chatId);
  };

  const handleDeleteAgent = async (agentId: string) => {
    const success = await deleteAgent(agentId);

    // If the deleted agent was the selected one, navigate to the first available agent
    // or to the main chat page if no agents are left
    if (success && agentId === selectedAgentId) {
      const remainingAgents = agents?.filter(agent => agent.id !== agentId) || [];
      if (remainingAgents.length > 0) {
        router.push(`/chat/${remainingAgents[0].id}`);
      } else {
        router.push('/chat');
      }
    }

    return success;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left column - Agent List */}
      <div className="w-xs bg-white border-r border-gray-200">
        <AgentList
          agents={agents || []}
          selectedAgentId={selectedAgentId}
          onSelectAgent={handleSelectAgent}
          onAddAgent={addAgent}
          onDeleteAgent={handleDeleteAgent}
        />
      </div>

      {/* Middle column - Chat List */}
      {selectedAgentId && chats && chats.length > 0 && (
        <div className="w-sm bg-white border-r border-gray-200">
          <ChatList
            chats={chats}
            selectedAgentId={selectedAgentId}
            selectedChatId={urlChatId}
            onNewChat={handleNewChat}
            onEditChat={handleEditChat}
            onDeleteChat={handleDeleteChat}
          />
        </div>
      )}

      {/* Right column - Chat Content */}
      <div className="bg-white w-0 grow">
        {children}
      </div>
    </div>
  );
}
