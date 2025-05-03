import { Part } from './a2a';
import { AgentCard } from './a2a';

export interface Agent {
  id: string;
  avatarUrl?: string;
  card?: AgentCard;
  createdAt?: Date;
}


export interface DbMessage {
  id?: number;
  chatId?: string;
  role: "user" | "agent";
  type: "message" | "artifact";
  name?: string;         // artifact 时可能有值
  description?: string;  // artifact 时可能有值
  parts: Part[];
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
}

export interface MessageParam {
  role: "user" | "agent";
  parts: Part[];
  metadata?: Record<string, any>;
}

export interface ArtifactParam {
  role: "user" | "agent";
  name?: string;
  description?: string;
  parts: Part[];
  metadata?: Record<string, any>;
}

export interface Chat {
  id: string;
  agentId: string;
  title: string;
  state: TaskState;
  lastMessagePreview?: string;
  lastMessageTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type TaskState =
  | "submitted"
  | "working"
  | "input-required"
  | "completed"
  | "canceled"
  | "failed"
  | "unknown";