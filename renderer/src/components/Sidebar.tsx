import React from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen, 
  Plus, 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Bug, 
  Play, 
  Square, 
  Search, 
  Settings,
  FileText,
  Download,
  Star,
  RefreshCw
} from 'lucide-react';
import { useExtensions } from './mktapi/useExtensions';
import { marketplaceAPI } from './mktapi';
import type { VSCodeExtension } from './mktapi';

interface FileTab {
  id: string;
  name: string;
  language: { id: string; name: string };
  content: string;
  isDirty: boolean;
}

interface GitChange {
  file: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
}

interface DebugBreakpoint {
  file: string;
  line: number;
  enabled: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  tabs: FileTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onOpenExtension?: (extension: VSCodeExtension) => void;
}

type SidebarSection = 'explorer' | 'git' | 'debug' | 'search' | 'extensions';

// Memoized Extension Item Component
const ExtensionItem = React.memo(({ extension }: { extension: any; index: number }) => {
  const installCount = React.useMemo(() => marketplaceAPI.getInstallCount(extension), [extension]);
  const rating = React.useMemo(() => marketplaceAPI.getRating(extension), [extension]);
  const iconUrl = React.useMemo(() => marketplaceAPI.getExtensionIconUrl(extension), [extension]);
  const formattedInstallCount = React.useMemo(() => marketplaceAPI.formatInstallCount(installCount), [installCount]);
  
  return (
    <div 
      className="p-2 bg-[#2a2d2e] rounded hover:bg-[#37373d] transition-colors cursor-pointer"
      //@ts-expect-error
      onClick={() => props.onOpenExtension?.(extension)}
    >
      <div className="flex items-start space-x-2">
        <img 
          src={iconUrl} 
          alt={extension.displayName}
          className="w-8 h-8 rounded flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://marketplace.visualstudio.com/favicon.ico';
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#cccccc] font-semibold truncate">
            {extension.displayName}
          </div>
          <div className="text-xs text-[#858585] truncate">
            {extension.publisher.displayName}
          </div>
          <div className="text-xs text-[#858585] mt-1 line-clamp-2">
            {extension.shortDescription}
          </div>
          <div className="flex items-center space-x-3 mt-2 text-xs text-[#858585]">
            <div className="flex items-center space-x-1">
              <Download size={10} />
              <span>{formattedInstallCount}</span>
            </div>
            {rating > 0 && (
              <div className="flex items-center space-x-1">
                <Star size={10} className="text-[#f9c23c]" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Loading Skeleton Component
const ExtensionSkeleton = React.memo(() => (
  <div className="p-2 bg-[#2a2d2e] rounded animate-pulse">
    <div className="flex items-start space-x-2">
      <div className="w-8 h-8 bg-[#3c3c3c] rounded flex-shrink-0"></div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 bg-[#3c3c3c] rounded w-3/4"></div>
        <div className="h-2 bg-[#3c3c3c] rounded w-1/2"></div>
        <div className="h-2 bg-[#3c3c3c] rounded w-full"></div>
        <div className="h-2 bg-[#3c3c3c] rounded w-2/3"></div>
        <div className="flex space-x-3 mt-2">
          <div className="h-2 bg-[#3c3c3c] rounded w-12"></div>
          <div className="h-2 bg-[#3c3c3c] rounded w-8"></div>
        </div>
      </div>
    </div>
  </div>
));

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  tabs, 
  activeTabId, 
  onTabSelect, 
  onNewFile, 
  onNewFolder,
  onOpenExtension
}) => {
  const [activeSection, setActiveSection] = React.useState<SidebarSection>('explorer');
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set(['root']));
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  
  // Extension management - FIXED: Enable initial load
  const { 
    extensions, 
    loading: extensionsLoading, 
    error: extensionsError,
    searchExtensions,
    loadPopular,
    loadFeatured,
    loadByCategory,
    refresh
  } = useExtensions(true); // FIXED: Changed from false to true
  const [gitChanges] = React.useState<GitChange[]>([
    { file: 'src/main.tsx', status: 'modified' },
    { file: 'src/components/Header.tsx', status: 'modified' },
    { file: 'src/utils/new-feature.ts', status: 'added' },
    { file: 'README.md', status: 'untracked' }
  ]);
  const [debugBreakpoints] = React.useState<DebugBreakpoint[]>([
    { file: 'src/main.tsx', line: 15, enabled: true },
    { file: 'src/components/Editor.tsx', line: 42, enabled: false }
  ]);
  const [isDebugging, setIsDebugging] = React.useState(false);
  
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

  const getGitStatusIcon = (status: GitChange['status']) => {
    const iconClass = "w-3 h-3";
    switch (status) {
      case 'modified': return <div className={`${iconClass} bg-[#f9c23c] rounded-full`} />;
      case 'added': return <div className={`${iconClass} bg-[#73c991] rounded-full`} />;
      case 'deleted': return <div className={`${iconClass} bg-[#f14c4c] rounded-full`} />;
      case 'untracked': return <div className={`${iconClass} bg-[#858585] rounded-full`} />;
    }
  };

  const sidebarSections = [
    { id: 'explorer' as SidebarSection, icon: Folder, label: 'Explorer' },
    { id: 'git' as SidebarSection, icon: GitBranch, label: 'Source Control' },
    { id: 'debug' as SidebarSection, icon: Bug, label: 'Debug' },
    { id: 'search' as SidebarSection, icon: Search, label: 'Search' },
    { id: 'extensions' as SidebarSection, icon: Settings, label: 'Extensions' }
  ];

  const renderExplorerSection = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#cccccc] text-xs font-semibold">FILES</span>
          <div className="flex space-x-1">
            <button
              onClick={onNewFile}
              className="p-1 hover:bg-[#2a2d2e] rounded text-[#cccccc]" 
              title="New File"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={onNewFolder}
              className="p-1 hover:bg-[#2a2d2e] rounded text-[#cccccc]"
              title="New Folder"
            >
              <Folder size={12} />
            </button>
          </div>
        </div>
        
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
  );

  const renderGitSection = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#cccccc] text-xs font-semibold">SOURCE CONTROL</span>
            <GitCommit size={12} className="text-[#cccccc]" />
          </div>
          
          <div className="mb-3">
            <div className="flex items-center space-x-2 text-xs text-[#cccccc] mb-2">
              <GitBranch size={12} />
              <span>main</span>
              <GitPullRequest size={12} className="ml-auto" />
            </div>
            
            <input
              type="text"
              placeholder="Message (Ctrl+Enter to commit)"
              className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-xs text-[#cccccc] placeholder-[#858585]"
            />
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-[#cccccc] font-semibold mb-1">CHANGES ({gitChanges.length})</div>
            {gitChanges.map((change, index) => (
              <div key={index} className="flex items-center space-x-2 p-1 hover:bg-[#2a2d2e] rounded">
                {getGitStatusIcon(change.status)}
                <FileText size={12} className="text-[#cccccc]" />
                <span className="text-xs text-[#cccccc] truncate">{change.file}</span>
                <span className="text-xs text-[#858585] ml-auto">{change.status.charAt(0).toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDebugSection = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#cccccc] text-xs font-semibold">DEBUG</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setIsDebugging(!isDebugging)}
                className={`p-1 rounded text-xs ${
                  isDebugging 
                    ? 'bg-[#f14c4c] text-white' 
                    : 'bg-[#0e639c] text-white hover:bg-[#1177bb]'
                }`}
              >
                {isDebugging ? <Square size={12} /> : <Play size={12} />}
              </button>
            </div>
          </div>
          
          {isDebugging && (
            <div className="mb-3 p-2 bg-[#f14c4c20] border border-[#f14c4c] rounded">
              <div className="text-xs text-[#f14c4c] font-semibold">DEBUGGING ACTIVE</div>
              <div className="text-xs text-[#cccccc]">Paused at line 15 in main.tsx</div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="text-xs text-[#cccccc] font-semibold">BREAKPOINTS</div>
            {debugBreakpoints.map((bp, index) => (
              <div key={index} className="flex items-center space-x-2 p-1 hover:bg-[#2a2d2e] rounded">
                <div className={`w-3 h-3 rounded-full ${
                  bp.enabled ? 'bg-[#f14c4c]' : 'bg-[#858585]'
                }`} />
                <File size={12} className="text-[#cccccc]" />
                <span className="text-xs text-[#cccccc] truncate">{bp.file}:{bp.line}</span>
              </div>
            ))}
            
            <div className="text-xs text-[#cccccc] font-semibold mt-3">CALL STACK</div>
            <div className="text-xs text-[#858585]">No active debug session</div>
            
            <div className="text-xs text-[#cccccc] font-semibold mt-3">VARIABLES</div>
            <div className="text-xs text-[#858585]">No variables to display</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearchSection = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        <div className="mb-4">
          <div className="text-xs text-[#cccccc] font-semibold mb-2">SEARCH</div>
          <input
            type="text"
            placeholder="Search files..."
            className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-xs text-[#cccccc] placeholder-[#858585] mb-2"
          />
          <input
            type="text"
            placeholder="Replace..."
            className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-xs text-[#cccccc] placeholder-[#858585]"
          />
          <div className="text-xs text-[#858585] mt-2">No results</div>
        </div>
      </div>
    </div>
  );

  const handleExtensionSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchExtensions(query);
    } else {
      await loadPopular();
    }
  };

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      await loadPopular();
    } else if (category === 'featured') {
      await loadFeatured();
    } else {
      await loadByCategory(category);
    }
  };

  const renderExtensionsSection = () => {
    const categories = [
      { id: 'all', label: 'Popular' },
      { id: 'featured', label: 'Featured' },
      { id: 'Programming Languages', label: 'Languages' },
      { id: 'Themes', label: 'Themes' },
      { id: 'Debuggers', label: 'Debuggers' },
      { id: 'Formatters', label: 'Formatters' },
      { id: 'Linters', label: 'Linters' },
      { id: 'Snippets', label: 'Snippets' }
    ];

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#cccccc] text-xs font-semibold">EXTENSIONS</span>
              <button
                onClick={refresh}
                className={`p-1 hover:bg-[#2a2d2e] rounded text-[#cccccc] transition-colors ${
                  extensionsLoading ? 'cursor-not-allowed opacity-50' : ''
                }`}
                title="Refresh"
                disabled={extensionsLoading}
              >
                <RefreshCw size={12} className={extensionsLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            
            {/* FIXED: Search with controlled input */}
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search extensions..."
                value={searchQuery} // FIXED: Use controlled value instead of defaultValue
                onChange={(e) => handleExtensionSearch(e.target.value)}
                className={`w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-xs text-[#cccccc] placeholder-[#858585] transition-all ${
                  extensionsLoading ? 'opacity-75' : ''
                }`}
                disabled={extensionsLoading}
              />
              {extensionsLoading && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-3 h-3 border border-[#858585] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {/* Categories */}
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={`w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-xs text-[#cccccc] mb-3 transition-all ${
                extensionsLoading ? 'cursor-not-allowed opacity-50' : ''
              }`}
              disabled={extensionsLoading}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            
            {/* Loading State with Skeletons */}
            {extensionsLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <ExtensionSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            )}
            
            {/* Error State */}
            {extensionsError && (
              <div className="text-xs text-[#f14c4c] text-center py-2 mb-2 bg-[#f14c4c20] border border-[#f14c4c] rounded">
                {extensionsError}
                <button 
                  onClick={refresh}
                  className="ml-2 underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}
            
            {/* Update the ExtensionItem component to accept and use onOpenExtension */}
            {!extensionsLoading && (
              <div className="space-y-2">
                {extensions.map((extension, index) => (
                  <ExtensionItem 
                    key={`${extension.extensionId}-${index}`} 
                    extension={extension} 
                    index={index}
                    //@ts-expect-error
                    onOpenExtension={(ext) => onOpenExtension?.(ext)}
                  />
                ))}
                
                {extensions.length === 0 && !extensionsError && (
                  <div className="text-xs text-[#858585] text-center py-4">
                    No extensions found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'explorer': return renderExplorerSection();
      case 'git': return renderGitSection();
      case 'debug': return renderDebugSection();
      case 'search': return renderSearchSection();
      case 'extensions': return renderExtensionsSection();
      default: return renderExplorerSection();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="w-64 bg-[#25252644] border-r border-[#3e3e42] flex flex-col">
      {/* Sidebar Navigation */}
      <div className="flex border-b border-[#3e3e42] ">
        {sidebarSections.map(section => {
          const IconComponent = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 p-3 flex items-center justify-center border-r  border-[#3e3e42] last:border-r-0 transition-colors ${
                activeSection === section.id
                  ? 'bg-[#37373d] text-[#0078d4]'
                  : 'text-[#cccccc] hover:bg-[#2a2d2e]'
              }`}
              title={section.label}
            >
              <IconComponent size={16} />
            </button>
          );
        })}
      </div>
      
      {/* Section Header */}
      {/* <div className="p-3 border-b border-[#3e3e42]" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <h2 className="text-[#cccccc] font-bold text-xs uppercase">
          {sidebarSections.find(s => s.id === activeSection)?.label}
        </h2>
      </div> */}
      
      {/* Section Content */}
      {renderSectionContent()}
    </div>
  );
};

export default Sidebar;