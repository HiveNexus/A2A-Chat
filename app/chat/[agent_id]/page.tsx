'use client';

import React, { useEffect } from 'react';
import { Button } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useChats } from '@/app/hooks/useChats';
import { useAgents } from '@/app/hooks/useAgents';

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agent_id as string;

  // Get agents and chats
  const { addChat, initializeChats } = useChats(agentId);
  const { agents } = useAgents();

  // Initialize chats for the agent if needed
  useEffect(() => {
    if (agentId) {
      initializeChats(agentId);
    }
  }, [agentId, initializeChats]);

  const handleNewChat = async () => {
    if (!agentId) return;

    const newChatId = await addChat({
      id: `${agentId}-${Date.now()}`,
      agentId: agentId,
      title: 'New Conversation',
      state: 'submitted',
    });

    if (newChatId) {
      router.push(`/chat/${agentId}/${newChatId}`);
    }
  };

  return (
    <div className="flex-1 h-dvh bg-gray-50">
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
        {agentId && (
          <div className="max-w-2xl w-full bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-center mb-4">Start a conversation with this agent</h2>

            <div className="mb-4">
              <div className="text-lg font-medium mb-1">{agents?.find(a => a.id === agentId)?.card?.name}</div>
              <p className="text-gray-600">{agents?.find(a => a.id === agentId)?.card?.description || 'No description'}</p>
            </div>

            {(() => {
              const currentAgent = agents?.find(a => a.id === agentId);
              return currentAgent?.card?.skills && currentAgent.card.skills.length > 0 && (
                <div className="mt-4">
                  <div className="text-lg font-medium mb-2">Skills</div>
                  <div className="space-y-3">
                    {currentAgent.card.skills.map((skill) => (
                      <div key={skill.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="font-medium">{skill.name}</div>
                        {skill.description && <p className="text-sm text-gray-600 mt-1">{skill.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="mt-6 text-center">
              <Button
                type="primary"
                onClick={handleNewChat}
                size="large"
              >
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
