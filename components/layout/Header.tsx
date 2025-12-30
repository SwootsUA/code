
import React from 'react'

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-center relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
            AI
          </div>
          <h1 className="text-gray-900 font-semibold text-lg">AI Асистент</h1>
        </div>
      </div>
    </header>
  );
};

export default Header
