'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/app/hooks/useChat';
import { useAgents } from '@/app/hooks/useAgents';
import { FileTextOutlined, SendOutlined, BorderOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { Part } from '@/types/a2a';
import ArtifactViewer from '@/app/components/ArtifactViewer';
import MessageItem from '@/app/components/MessageItem';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database';

interface ChatContentProps {
  chatId: string;
  agentId: string;
}

const ChatContent: React.FC<ChatContentProps> = ({ chatId, agentId }) => {
  const [input, setInput] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState<{ id: string, name?: string, parts: Part[] } | null>(null);
  const { messages, sendTaskSubscribe, isLoading, cancelTask, error } = useChat(chatId, agentId);
  const { agents } = useAgents();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [showInputRequiredBanner, setShowInputRequiredBanner] = useState(false);

  // Get the chat state from the database
  const chat = useLiveQuery(
    async () => {
      return await db.chats.where({ id: chatId }).first();
    },
    [chatId]
  );
  // Check if this is the last message and the chat state is input-required

  // Add custom bounce animation style
  const bounceStyle = `
    @keyframes customBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
  `;

  const handleArtifactClick = (artifact: { id: string, name?: string, parts: Part[] }) => {
    if (selectedArtifact && selectedArtifact.id === artifact.id) {
      setSelectedArtifact(null);
    } else {
      setSelectedArtifact(artifact);
    }
  };

  const [isInputEmpty, setIsInputEmpty] = useState(true);

  useEffect(() => {
    setIsInputEmpty(input.trim() === '');
  }, [input]);

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Update the input-required banner visibility based on chat state and loading state
  useEffect(() => {
    // Hide banner when loading (user just submitted input)
    if (isLoading) {
      setShowInputRequiredBanner(false);
    }
    // Show banner when not loading and chat state is input-required
    else if (chat?.state === 'input-required') {
      setShowInputRequiredBanner(true);
    }
    // Hide banner for all other states
    else {
      setShowInputRequiredBanner(false);
    }
  }, [chat?.state, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Explicitly hide the input-required banner when submitting
    setShowInputRequiredBanner(false);
    sendTaskSubscribe(input);
    setInput('');
  };

  const handleCancel = async () => {
    await cancelTask();
  };

  const renderArtifactPart = (part: Part, name?: string): React.ReactNode => {
    return <ArtifactViewer part={part} name={name} />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            {agentId && (
              <div className="max-w-2xl w-full bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-center mb-4">Start a conversation with this agent</h2>

                {messages.length === 0 && (
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'artifact' ? (
                  <div
                    onClick={() => {
                      // Create a unique ID using the message index and name
                      handleArtifactClick({
                        id: `${index}-${message.name || ''}`,
                        name: message.name,
                        parts: message.parts
                      })
                    }}
                    className={`hover:bg-gray-50 cursor-pointer bg-white rounded-lg p-4 shadow-sm border border-gray-200 min-w-xl ${
                      selectedArtifact?.id === `${index}-${message.name || ''}` ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <FileTextOutlined />
                      <span className="font-medium text-gray-700">{message.name || 'Artifact'}</span>
                    </div>
                    {message.description && <div className="mt-2 text-sm text-gray-600"><p>{message.description}</p></div>}
                  </div>
                ) : (
                  <MessageItem
                    message={message}
                  />
                )}
              </div>
            ))}

            {/* Loading animation */}
            {isLoading && (
              <div className="flex justify-start mt-4">
                <div className="bg-white text-gray-800 h-11 rounded-lg p-3 max-w-[70%]">
                  <style>{bounceStyle}</style>
                  <div className="flex h-full items-center mt-1 space-x-2 px-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" style={{ animation: 'customBounce 1s infinite', animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full" style={{ animation: 'customBounce 1s infinite', animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full" style={{ animation: 'customBounce 1s infinite', animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Error message - Enhanced with better visibility and formatting */}
            {error && (
              <div className="flex justify-center mt-4">
                <div className="bg-red-50 text-red-600 rounded-lg p-4 max-w-[80%] shadow-sm border border-red-200">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="font-medium mb-1">Error</h4>
                      <p className="text-sm whitespace-pre-wrap">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Blue banner for input-required state */}
            {showInputRequiredBanner && (
              <div className="flex mt-4">
                <div className="bg-blue-100 border border-blue-300 text-blue-800 rounded-lg p-3 min-w-xl shadow-sm">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>需要您的输入以继续对话</span>
                  </div>
                </div>
              </div>
            )}

            {/* Invisible element for scrolling to bottom */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Artifact Details Sliding Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-1/2 z-10 bg-white shadow-xl transform transition-all duration-300 ease-in-out ${selectedArtifact ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {selectedArtifact && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedArtifact.name || 'Artifact Details'}</h2>
              <button
                onClick={() => setSelectedArtifact(null)}
                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {selectedArtifact.parts.map((part, index) => (
                <div key={index} className="mb-4">
                  {renderArtifactPart(part, selectedArtifact.name)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="sticky bottom-0 p-4 bg-white border-t border-gray-200 shadow-md">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isInputEmpty && !isLoading) {
                  handleSubmit(e);
                }
              }
            }}
            placeholder="发送消息..."
            className="w-full pr-14 py-3 px-4 border border-gray-200 rounded-2xl resize-none focus:outline-none  focus:gray-300 min-h-[50px] max-h-[120px]"
            disabled={isLoading}
            rows={3}
            style={{ overflow: 'auto' }}
          />
          {isLoading ? (
            <Button
              type="primary"
              onClick={handleCancel}
              className="right-2 bottom-2"
              style={{ position: 'absolute' }}
              shape="circle"
              icon={<BorderOutlined />}
            />
          ) : (
            <Button
              type="primary"
              htmlType="submit"
              disabled={isInputEmpty}
              className="right-2 bottom-2"
              style={{ position: 'absolute' }}
              shape="circle"
              icon={<SendOutlined />}
            />
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatContent;
