import React from 'react';
import { GitBranch, CheckCircle } from 'lucide-react';

interface StatusBarProps {
  activeFile?: {
    name: string;
    language: { name: string };
    content: string;
  };
  stats: {
    lines: number;
    characters: number;
    words: number;
  };
}

const StatusBar: React.FC<StatusBarProps> = ({ activeFile, stats }) => {
  return (
    <div className="h-6 bg-[#111115] text-white flex items-center justify-between px-4 text-xs">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <GitBranch size={12} />
          <span>main</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <CheckCircle size={12} />
          <span>No issues</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {activeFile && (
          <>
            <span>{activeFile.language.name}</span>
            <span>Ln {stats.lines}, Col 1</span>
            <span>{stats.characters} chars</span>
            <span>{stats.words} words</span>
          </>
        )}
        <span>UTF-8</span>
        <span>LF</span>
        <span>JetBrains Mono</span>
      </div>
    </div>
  );
};

export default StatusBar;