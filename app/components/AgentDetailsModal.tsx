'use client';

import React from 'react';
import { Modal, Descriptions, Tag, Typography, Divider, Button } from 'antd';
import { Agent } from '@/types/chat';

const { Title, Text, Link } = Typography;

interface AgentDetailsModalProps {
  open: boolean;
  agent: Agent | null;
  onCancel: () => void;
}

const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({ open, agent, onCancel }) => {
  if (!agent) return null;

  const { card } = agent;

  return (
    <Modal
      title={<Title level={4}>Agent Details</Title>}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>
      ]}
      width={700}
    >
      <Descriptions
        bordered
        column={1}
      >
        <Descriptions.Item label="ID">{agent.id}</Descriptions.Item>
        <Descriptions.Item label="Name">{agent.card?.name}</Descriptions.Item>
        <Descriptions.Item label="Description">{agent.card?.description || 'No description'}</Descriptions.Item>
        <Descriptions.Item label="Created At">{agent.createdAt ? new Date(agent.createdAt).toLocaleString() : 'Unknown'}</Descriptions.Item>
      </Descriptions>

      {card && (
        <>
          <Divider>Agent Card</Divider>
          <Descriptions
            bordered
            column={1}
          >
            <Descriptions.Item label="URL">
              <Link href={card.url} target="_blank">{card.url}</Link>
            </Descriptions.Item>
            <Descriptions.Item label="Version">{card.version}</Descriptions.Item>
            {card.documentationUrl && (
              <Descriptions.Item label="Documentation">
                <Link href={card.documentationUrl} target="_blank">{card.documentationUrl}</Link>
              </Descriptions.Item>
            )}
            {card.provider && (
              <Descriptions.Item label="Provider">
                {card.provider.organization}
                {card.provider.url && (
                  <> (<Link href={card.provider.url} target="_blank">Website</Link>)</>
                )}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Capabilities">
              <div className="flex flex-wrap gap-2">
                {Object.entries(card.capabilities).map(([key, value]) => (
                  value ? <Tag key={key} color="blue">{key}</Tag> : null
                ))}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Input Modes">
              <div className="flex flex-wrap gap-2">
                {card.defaultInputModes?.map(mode => (
                  <Tag key={mode}>{mode}</Tag>
                ))}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Output Modes">
              <div className="flex flex-wrap gap-2">
                {card.defaultOutputModes?.map(mode => (
                  <Tag key={mode}>{mode}</Tag>
                ))}
              </div>
            </Descriptions.Item>
          </Descriptions>

          {card.skills && card.skills.length > 0 && (
            <>
              <Divider>Skills</Divider>
              {card.skills.map((skill, index) => (
                <div key={skill.id} className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <Title level={5}>{skill.name}</Title>
                  {skill.description && <Text>{skill.description}</Text>}
                  {skill.tags && skill.tags.length > 0 && (
                    <div className="mt-2">
                      {skill.tags.map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  )}
                  {skill.examples && skill.examples.length > 0 && (
                    <div className="mt-2">
                      <Text strong>Examples:</Text>
                      <ul className="pl-5 mt-1">
                        {skill.examples.map((example, i) => (
                          <li key={i}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default AgentDetailsModal;
