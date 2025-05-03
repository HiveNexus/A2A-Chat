'use client';
import Image from "next/image";
import React, { useState, useCallback } from 'react';
import { List, Avatar, Button, Tooltip, Dropdown, App } from 'antd';
import { PlusOutlined, MoreOutlined, InfoCircleOutlined, DeleteOutlined, GithubOutlined } from '@ant-design/icons';
import { Agent } from '@/types/chat';
import AddAgentModal from './AddAgentModal';
import AgentDetailsModal from './AgentDetailsModal';

interface AgentListProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onAddAgent: (agent: Agent) => Promise<boolean>;
  onDeleteAgent?: (agentId: string) => Promise<boolean>;
}

const AgentList: React.FC<AgentListProps> = ({ agents, selectedAgentId, onSelectAgent, onAddAgent, onDeleteAgent }) => {
  const { modal, message: antMessage } = App.useApp();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const showAddModal = () => {
    setAddModalVisible(true);
  };

  const handleAddCancel = () => {
    setAddModalVisible(false);
  };

  const handleViewDetails = useCallback((agent: Agent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAgent(agent);
    setDetailsModalVisible(true);
  }, []);

  const handleDeleteClick = useCallback(async (agent: Agent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onDeleteAgent) return;

    modal.confirm({
      title: 'Delete Agent',
      content: 'Are you sure you want to delete this agent? This will also delete all conversations associated with this agent. This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const success = await onDeleteAgent(agent.id);
          if (success) {
            antMessage.success('Agent deleted successfully');
          } else {
            antMessage.error('Failed to delete agent');
          }
        } catch (error) {
          console.error('Failed to delete agent:', error);
          antMessage.error('An error occurred while deleting the agent');
        }
      }
    });
  }, [onDeleteAgent, modal, antMessage]);

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      <div className="flex p-4 items-center border-b border-gray-200 h-16">
        <Image src='/logo.png' alt="logo" width={32} height={32} />
        <div className="ml-3 mt-1">
          <h2 className="text-lg font-semibold p-0 leading-none">A2A Chat</h2>
          <span className="text-sm text-gray-500 mt-0 leading-none">Let Agents work via A2A</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <List
          dataSource={agents}
          renderItem={(agent) => (
            <div
              className="relative"
              onMouseEnter={() => setHoveredAgentId(agent.id)}
              onMouseLeave={() => setHoveredAgentId(null)}
            >
              <div className="flex w-full">
                <div className="flex-grow" onClick={() => onSelectAgent(agent.id)}>
                  <List.Item
                    className={`cursor-pointer ${selectedAgentId === agent.id ? 'bg-blue-50 hover:bg-blue-50' : 'hover:bg-gray-100'}`}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.id}`}
                          size="large"
                        />
                      }
                      title={<span className="font-medium">{agent.card?.name}</span>}
                      description={agent.card?.description}
                    />
                  </List.Item>
                </div>
                {hoveredAgentId === agent.id && (
                  <div
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'details',
                            icon: <InfoCircleOutlined />,
                            label: 'View Details',
                            onClick: (e) => handleViewDetails(agent, e.domEvent as React.MouseEvent)
                          },
                          {
                            key: 'delete',
                            icon: <DeleteOutlined />,
                            label: 'Delete',
                            danger: true,
                            onClick: (e) => handleDeleteClick(agent, e.domEvent as React.MouseEvent)
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
          footer={
            <div className="p-4 flex justify-center">
              <Button
                icon={<PlusOutlined />}
                onClick={showAddModal}
              >
                Add Agent
              </Button>
            </div>
          }
        />
      </div>

      <div className="p-3 border-t border-gray-200 flex justify-center items-center">
        <a
          href="https://github.com/HiveNexus/A2AChat"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit' }}
          className="hover:opacity-80"
        >
          <GithubOutlined style={{ fontSize: '24px' }} />
        </a>
      </div>

      <AddAgentModal
        open={addModalVisible}
        onCancel={handleAddCancel}
        onAddAgent={onAddAgent}
      />

      <AgentDetailsModal
        open={detailsModalVisible}
        agent={selectedAgent}
        onCancel={() => setDetailsModalVisible(false)}
      />
    </div>
  );
};

const AppWrappedAgentList: React.FC<AgentListProps> = (props) => (
  <App>
    <AgentList {...props} />
  </App>
);

export default AppWrappedAgentList;
