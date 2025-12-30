
import React, { useState, useRef, useEffect } from 'react';

interface InputAreaProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  return (
    <div className="bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 sticky bottom-0 z-20">
      <div className="max-w-3xl mx-auto flex gap-3 items-end">
        <div className="relative flex-grow">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Запитайте про університет..."
            className="w-full bg-gray-100 text-gray-900 rounded-2xl pl-4 pr-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all max-h-32 disabled:opacity-50 border-0"
            style={{ minHeight: '48px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full p-3 shadow-lg transition-transform active:scale-95 flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
      <div className="text-center mt-2 text-xs text-gray-400">
        AI може робити помилки. Перевіряйте важливу інформацію.
      </div>
    </div>
  );
};

export default InputArea;
