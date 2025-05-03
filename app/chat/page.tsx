'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAgents } from '@/app/hooks/useAgents';

export default function ChatPage() {
  const router = useRouter();
  const { agents } = useAgents();

  // Redirect to the first agent if available
  useEffect(() => {
    if (agents && agents.length > 0) {
      router.push(`/chat/${agents[0].id}`);
    }
  }, [agents, router]);

  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <p>Select or Start a Conversation</p>
    </div>
  );
}
