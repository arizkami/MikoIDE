import React from 'react';
import { X, Circle, Package } from 'lucide-react';

interface FileTab {
  id: string;
  name: string;
  language: { id: string; name: string };
  content: string;
  isDirty: boolean;
  type?: 'file' | 'extension';
  extensionData?: any;
}

interface TabBarProps {
  tabs: FileTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onTabSelect, onTabClose }) => {
  const getLanguageColor = (language: string) => {
    switch (language) {
      case 'typescript': return 'bg-[#3178c6]';
      case 'javascript': return 'bg-[#f7df1e]';
      case 'python': return 'bg-[#3776ab]';
      case 'rust': return 'bg-[#ce422b]';
      case 'cpp': return 'bg-[#00599c]';
      case 'extension': return 'bg-[#fd7e14]';
      default: return 'bg-[#858585]';
    }
  };

  const getTabIcon = (tab: FileTab) => {
    if (tab.type === 'extension') {
      return <Package size={8} className="text-[#fd7e14]" />;
    }
    return <div className={`w-2 h-2 rounded-full ${getLanguageColor(tab.language.id)}`} />;
  };
  
  return (
    <div className="bg-[#17171B] border-b border-[#3e3e42] flex overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`flex items-center justify-between space-x-2 px-1 py-1.25  border-r border-[#3e3e42] cursor-pointer min-w-0 transition-colors group ${
            tab.id === activeTabId 
              ? 'bg-[#1e1e1e] text-white border-t-1 border-t-[#a1a1a1]' 
              : 'text-[#cccccc] hover:bg-[#37373d]'
          }`}
          onClick={() => onTabSelect(tab.id)}
        >
          {getTabIcon(tab)}
          <span className="text-xs truncate max-w-32">{tab.name}</span>
          
          {tab.isDirty ? (
            <Circle size={8} className="text-[#f14c4c] fill-current ml-auto" />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-[#464647] rounded p-0.5 transition-all ml-auto"
            >
              <X size={12} className="text-[#cccccc]" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default TabBar;