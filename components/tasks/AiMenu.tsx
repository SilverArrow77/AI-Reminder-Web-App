'use client';
import React from 'react';
import { Sparkles, Download, X, Send } from 'lucide-react';

type AiMenuProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeListId: number;
  activeListName: string;
};

const AiMenu: React.FC<AiMenuProps> = ({ isOpen, setIsOpen, activeListId, activeListName }) => {
  return (
    <aside className={`fixed top-0 right-0 h-full w-80 bg-[#F3F3F4] border-l border-gray-200 flex flex-col justify-between p-5 rounded-l-3xl shadow-2xl transition-transform duration-300 ease-in-out z-50 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="flex flex-col flex-1 overflow-y-auto">
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <Sparkles size={18} className="text-[#F28C38]" />
            <span>AI Insights</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition text-gray-500">
            <X size={18} />
          </button>
        </div>

        
        <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition mb-6">
          <Download size={16} /> Download Report
        </button>

        
        <div className="flex-1 min-h-45 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-left mb-4 flex flex-col justify-center items-center">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Summary for List #{activeListId}</span>
          <p className="text-xs text-gray-400 text-center px-4">[Backend analysis for "{activeListName}" injects here]</p>
        </div>
      </div>

      {/* This is the prompt box*/}
      <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex items-center gap-2 mt-auto">
        <input type="text" placeholder={`Ask about ${activeListName}...`} className="w-full bg-transparent pl-2 text-sm focus:outline-none placeholder-gray-400 text-gray-700" />
        <button className="p-2 bg-[#F28C38] text-white hover:bg-[#e07b27] rounded-lg transition-all shadow-sm">
          <Send size={14} />
        </button>
      </div>
    </aside>
  );
};

export default AiMenu;