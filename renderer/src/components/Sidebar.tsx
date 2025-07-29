import React from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

interface FileTab {
  id: string;
  name: string;
  language: { id: string; name: string };
  content: string;
  isDirty: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  tabs: FileTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, tabs, activeTabId, onTabSelect }) => {
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set(['root']));
  
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };
  
  const getFileIcon = (language: string) => {
    const iconClass = "w-4 h-4";
    switch (language) {
      case 'typescript': return <File className={`${iconClass} text-[#3178c6]`} />;
      case 'javascript': return <File className={`${iconClass} text-[#f7df1e]`} />;
      case 'python': return <File className={`${iconClass} text-[#3776ab]`} />;
      case 'rust': return <File className={`${iconClass} text-[#ce422b]`} />;
      case 'cpp': return <File className={`${iconClass} text-[#00599c]`} />;
      default: return <File className={`${iconClass} text-[#858585]`} />;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="w-64 bg-[#25252644] border-r border-[#3e3e42] flex flex-col">
      <div className="p-3 border-b border-[#3e3e42]" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <h2 className="text-[#cccccc] font-bold text-xs uppercase">Explorer</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="mb-2">
            <button
              onClick={() => toggleFolder('root')}
              className="flex items-center space-x-1 text-[#cccccc] hover:bg-[#2a2d2e] w-full p-1 rounded text-sm"
            >
              {expandedFolders.has('root') ? 
                <ChevronDown size={14} /> : 
                <ChevronRight size={14} />
              }
              {expandedFolders.has('root') ? 
                <FolderOpen size={14} className="text-[#dcb67a]" /> : 
                <Folder size={14} className="text-[#dcb67a]" />
              }
              <span className="text-xs">MIKOIDE</span>
            </button>
            
            {expandedFolders.has('root') && (
              <div className="ml-4 mt-1 space-y-1">
                {tabs.map(tab => (
                  <div
                    key={tab.id}
                    className={`flex items-center space-x-2 p-1.5 rounded cursor-pointer transition-colors ${
                      tab.id === activeTabId 
                        ? 'bg-[#37373d] text-white' 
                        : 'text-[#cccccc] hover:bg-[#2a2d2e]'
                    }`}
                    onClick={() => onTabSelect(tab.id)}
                  >
                    {getFileIcon(tab.language.id)}
                    <span className="text-xs truncate">{tab.name}</span>
                    {tab.isDirty && (
                      <div className="w-2 h-2 bg-[#f14c4c] rounded-full ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;