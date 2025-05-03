'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { List, Button, Dropdown, Modal, Input, App } from 'antd';
import { PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Chat } from '@/types/chat';
import { useRouter } from 'next/navigation';

interface ChatListProps {
  chats: Chat[];
  selectedAgentId: string;
  selectedChatId?: string;
  onNewChat: () => void;
  onEditChat?: (chatId: string, newTitle: string) => Promise<boolean>;
  onDeleteChat?: (chatId: string) => Promise<boolean>;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedAgentId,
  selectedChatId,
  onNewChat,
  onEditChat,
  onDeleteChat
}) => {
  const router = useRouter();
  const { modal, message: antMessage } = App.useApp();
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEditClick = useCallback((chat: Chat, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingChatTitle(chat.title);
    setIsEditModalVisible(true);
  }, [setEditingChatId, setEditingChatTitle, setIsEditModalVisible]);

  const handleDeleteClick = useCallback(async (chat: Chat, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onDeleteChat) return;

    modal.confirm({
      title: 'Delete Conversation',
      content: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const success = await onDeleteChat(chat.id);
          if (success) {
            console.log('successfully');
            antMessage.success('Conversation deleted successfully');
            // If the deleted chat was the selected one, navigate to the agent page
            if (selectedChatId === chat.id) {
              router.push(`/chat/${selectedAgentId}`);
            }
          } else {
            console.log('Failed to delete chat');
            antMessage.error('Failed to delete conversation');
          }
        } catch (error) {
          console.log('Failed to delete chat');
          console.log(error);
          antMessage.error('An error occurred while deleting the conversation');
        }
      }
    });
  }, [onDeleteChat, selectedChatId, selectedAgentId, router, modal, antMessage]);

  const handleEditModalOk = useCallback(async () => {
    if (!editingChatId || !onEditChat) {
      setIsEditModalVisible(false);
      return;
    }

    try {
      const success = await onEditChat(editingChatId, editingChatTitle);
      if (success) {
        antMessage.success('Conversation renamed successfully');
        setIsEditModalVisible(false);
      } else {
        antMessage.error('Failed to rename conversation');
      }
    } catch (error) {
      antMessage.error('An error occurred while renaming the conversation');
    }
  }, [editingChatId, editingChatTitle, onEditChat, antMessage]);

  const handleEditModalCancel = useCallback(() => {
    setIsEditModalVisible(false);
    setEditingChatId(null);
    setEditingChatTitle('');
  }, [setIsEditModalVisible, setEditingChatId, setEditingChatTitle]);

  // Handle keyboard delete key press
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check if Delete key is pressed (key name "Delete" on Windows or "Backspace" on Mac)
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedChatId) {
      // Check if the active element is an input, textarea, or contentEditable element
      const activeElement = document.activeElement;
      const isEditableElement =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      // Only proceed if we're not in an editable field
      if (!isEditableElement) {
        // Find the selected chat
        const selectedChat = chats.find(chat => chat.id === selectedChatId);
        if (selectedChat) {
          // Prevent default behavior
          e.preventDefault();
          // Create a mock event object to pass to handleDeleteClick
          const mockEvent = {
            preventDefault: () => { },
            stopPropagation: () => { }
          } as React.MouseEvent;
          // Call the existing delete handler
          handleDeleteClick(selectedChat, mockEvent);
        }
      }
    }
  }, [selectedChatId, chats, handleDeleteClick]);

  // Add and remove keyboard event listener
  useEffect(() => {
    // Add event listener when component mounts
    document.addEventListener('keydown', handleKeyDown);

    // Remove event listener when component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-dvh">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center h-16">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onNewChat}
        >
          New Conversation
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto h-dvh">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 -mt-12">
            {/* <div> */}
              <p>No conversations yet</p>
              <Button type="link" onClick={onNewChat}>Start a new conversation</Button>
            {/* </div> */}
          </div>
        ) : (
          <List
            dataSource={chats}
            renderItem={(chat) => (
              <div
                className="relative"
                onMouseEnter={() => setHoveredChatId(chat.id)}
                onMouseLeave={() => setHoveredChatId(null)}
              >
                <div className="flex w-full">
                  <div className="flex-grow" onClick={() => router.push(`/chat/${selectedAgentId}/${chat.id}`)}>
                    <List.Item
                      className={`cursor-pointer ${selectedChatId === chat.id ? 'bg-blue-50 hover:bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <List.Item.Meta
                        title={<span className="font-medium">{chat.title}</span>}
                        description={
                          <div className="text-sm text-gray-500">
                            <div className="mt-1">{formatDate(chat.updatedAt)}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  </div>
                  {hoveredChatId === chat.id && (
                    <div
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'edit',
                              icon: <EditOutlined />,
                              label: 'Edit',
                              onClick: (e) => handleEditClick(chat, e.domEvent as React.MouseEvent)
                            },
                            {
                              key: 'delete',
                              icon: <DeleteOutlined />,
                              label: 'Delete',
                              danger: true,
                              onClick: (e) => handleDeleteClick(chat, e.domEvent as React.MouseEvent)
                            }
                          ]
                        }}
                        trigger={['click']}
                      >
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          className="hover:bg-gray-200"
                          onClick={(e) => e.preventDefault()}
                        />
                      </Dropdown>
                    </div>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        title="Rename Conversation"
        open={isEditModalVisible}
        onOk={handleEditModalOk}
        onCancel={handleEditModalCancel}
        okText="Save"
        cancelText="Cancel"
      >
        <Input
          placeholder="Enter conversation name"
          value={editingChatTitle}
          onChange={(e) => setEditingChatTitle(e.target.value)}
          onPressEnter={handleEditModalOk}
          autoFocus
        />
      </Modal>
    </div>
  );
};

const AppWrappedChatList: React.FC<ChatListProps> = (props) => (
  <App>
    <ChatList {...props} />
  </App>
);

export default AppWrappedChatList;
