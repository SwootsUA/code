
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../../types';

interface MessageBubbleProps { message: Message; }
const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in-up`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
        }`}
      >
        <div className={`text-sm font-medium mb-1 opacity-75 ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
          {isUser ? 'Студент' : 'Асистент'}
        </div>
        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'}`}>
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>
        <div className={`text-[10px] mt-2 text-right opacity-60`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
