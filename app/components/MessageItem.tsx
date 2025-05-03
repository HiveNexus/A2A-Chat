import React from 'react';
import { DbMessage } from '@/types/chat';
import ArtifactViewer from './ArtifactViewer';

interface MessageItemProps {
  message: DbMessage;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  return (
    <div
      className={`max-w-[70%] rounded-lg p-3 ${
        message.role === 'user'
          ? 'bg-blue-500 text-white user-message'
          : 'bg-white text-gray-800'
      }`}
    >
      {message.parts.map((part, partIndex) => (
        <div key={partIndex} className="mb-2 last:mb-0">
          <ArtifactViewer part={part} name={message.name} />
        </div>
      ))}
    </div>
  );
};

export default MessageItem;