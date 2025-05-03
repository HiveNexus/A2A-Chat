import Dexie, { type EntityTable } from 'dexie';
import { DbMessage } from '@/types/chat';
import { Agent, Chat } from '@/types/chat';

export const db = new Dexie('a2aChat') as Dexie & {
  messages: EntityTable<DbMessage>;
  agents: EntityTable<Agent>;
  chats: EntityTable<Chat>;
};

// Schema declaration:
db.version(3).stores({
  messages: '++id, chatId, createdAt, role, type',
  agents: 'id, name, createdAt',
  chats: 'id, agentId, title, createdAt, updatedAt'
});