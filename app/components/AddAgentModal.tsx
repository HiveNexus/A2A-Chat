'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, App } from 'antd';
import { useRouter } from 'next/navigation';
import { Agent } from '@/types/chat';
import { AgentCard } from '@/types/a2a';

interface AddAgentModalProps {
  open: boolean;
  onCancel: () => void;
  onAddAgent: (agent: Agent) => Promise<boolean>;
}

const AddAgentModal: React.FC<AddAgentModalProps> = ({ open, onCancel, onAddAgent }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { message: antMessage } = App.useApp();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Validate ID format (only letters and numbers)
      if (!/^[a-zA-Z0-9]+$/.test(values.id)) {
        antMessage.error('ID can only contain letters and numbers');
        setLoading(false);
        return;
      }

      // Fetch agent card using the server-side API route
      try {
        console.log('Fetching agent card from server for domain:', values.domain);

        // Make sure we're using the absolute path to the API endpoint
        const apiUrl = new URL('/api/fetch-agent-card', window.location.origin).toString();
        console.log('API URL:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Make sure the domain is properly formatted (has protocol, doesn't include path)
          body: JSON.stringify({
            domain: values.domain.startsWith('http')
              ? values.domain
              : `https://${values.domain}`
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Failed to fetch agent card: ${response.statusText}`);
        }

        const { agentCard } = data;

        // Create new agent with the fetched card data
        const newAgent: Agent = {
          id: values.id,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${values.id}`,
          card: agentCard,
          createdAt: new Date() // Set creation timestamp
        };

        // Add the agent to the database
        const success = await onAddAgent(newAgent);

        if (success) {
          antMessage.success('Agent added successfully');
          form.resetFields();
          // Navigate to the newly added agent's route
          router.push(`/chat/${values.id}`);
          onCancel();
        } else {
          antMessage.error('Failed to add agent');
        }
      } catch (error) {
        console.error('Error fetching agent card:', error);
        if (error instanceof Error) {
          antMessage.error(`Failed to fetch agent card: ${error.message}. Please check the domain and ensure it's accessible.`);
        } else {
          antMessage.error('Failed to fetch agent card. Please check the domain and try again.');
        }
      }

      setLoading(false);
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="Add New Agent"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Add Agent
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="addAgentForm"
      >
        <Form.Item
          name="id"
          label="Agent ID"
          rules={[
            { required: true, message: 'Please enter an agent ID' },
            { pattern: /^[a-zA-Z0-9]+$/, message: 'ID can only contain letters and numbers' }
          ]}
        >
          <Input placeholder="Enter a unique ID for the agent (letters and numbers only)" />
        </Form.Item>

        <Form.Item
          name="domain"
          label="Agent Domain"
          rules={[
            { required: true, message: 'Please enter the agent domain' },
            { type: 'url', message: 'Please enter the agent domain' }
          ]}
        >
          <Input placeholder="Enter the domain (e.g. example.com or https://example.com)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddAgentModal;
