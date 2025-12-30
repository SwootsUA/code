
import React, { useState, useEffect, useRef } from 'react';
import { Role, Message, ChatState } from './types';
import MessageBubble from './components/chat/MessageBubble';
import InputArea from './components/chat/InputArea';
import Suggestions from './components/chat/Suggestions';
import Header from './components/layout/Header';

const App: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [
      {
        id: 'init-1',
        role: Role.MODEL,
        text: 'Привіт! Я ваш персональний помічник у Запорізькій політехніці. Готовий відповісти на запитання про навчання, вступ та студентське життя.',
        timestamp: new Date()
      }
    ],
    isLoading: false,
    error: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, chatState.isLoading]);

  const handleSendMessage = async (text: string) => {
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
      timestamp: new Date(),
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, newUserMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Call the backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      const data = await response.json();
      const responseText = data.reply;

      const newBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: new Date(),
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, newBotMessage],
        isLoading: false,
      }));
    } catch (error) {
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Помилка сервера: Не вдалося обробити запит. Спробуйте пізніше.",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow flex flex-col max-w-3xl w-full mx-auto p-4 sm:p-6 pb-0">
        
        <Suggestions onSelect={handleSendMessage} />

        <div className="flex-grow flex flex-col space-y-6 pb-4">
          {chatState.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {chatState.isLoading && (
             <div className="flex justify-start">
               <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-2">
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
               </div>
            </div>
          )}
          
          {chatState.error && (
            <div className="flex justify-center my-4">
              <span className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-lg text-sm">
                {chatState.error}
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <InputArea onSend={handleSendMessage} disabled={chatState.isLoading} />
    </div>
  );
};

export default App;
