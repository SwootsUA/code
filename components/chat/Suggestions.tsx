
import React from 'react';

interface SuggestionsProps { onSelect: (text: string) => void }

const Suggestions: React.FC<SuggestionsProps> = ({ onSelect }) => {
  const suggestions = [
    { label: "🎓 Як зайти в Moodle?", query: "Як зайти в Moodle?" },
    { label: "📅 Де знайти розклад?", query: "Де знайти розклад?" },
    { label: "📄 Документи для вступу", query: "Які документи треба для вступу?" },
    { label: "📞 Приймальна комісія", query: "Контакти приймальної комісії" }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm text-center">
      <h2 className="text-gray-800 font-semibold text-lg mb-2">Часті запитання</h2>
      <p className="text-gray-500 text-sm mb-6">
        Виберіть тему або напишіть своє запитання нижче:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {suggestions.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelect(item.query)}
            className="text-sm border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 p-3 rounded-lg transition-all"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Suggestions
