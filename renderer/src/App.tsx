import { useState, useEffect, useRef } from 'react';
import { MikoEditor, createEditor, typescriptLanguage, javascriptLanguage, pythonLanguage, rustLanguage, cppLanguage } from '../../core';
import type { EditorOptions, Language } from '../../core';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import StatusBar from './components/StatusBar';
import ExtensionPage from './components/ExtensionPage';
import Editor from './components/Editor';
import type { VSCodeExtension } from './components/mktapi';
import type { Toolchain } from './components/packagemanager/PackageManager';

const handleInstallToolchain = (toolchain: Toolchain) => {
  console.log('Installing toolchain:', toolchain.name);
  // Here you would integrate with your C++ backend to actually install the toolchain
  // Example: window.electronAPI?.installToolchain(toolchain);
};

const handleUninstallToolchain = (toolchain: Toolchain) => {
  console.log('Uninstalling toolchain:', toolchain.name);
  // Here you would integrate with your C++ backend to uninstall the toolchain
  // Example: window.electronAPI?.uninstallToolchain(toolchain);
};

interface FileTab {
  id: string;
  name: string;
  language: Language;
  content: string;
  isDirty: boolean;
  type?: 'file' | 'extension';
  extensionData?: VSCodeExtension;
}

function App() {
  const [activeTabId, setActiveTabId] = useState<string>('welcome');
  const [tabs, setTabs] = useState<FileTab[]>([
    {
      id: 'welcome',
      name: 'index.tsx',
      language: typescriptLanguage,
      content: `function MyButton() {
  return (
    <button>
      I'm a button
    </button>
  );
}

export default function MyApp() {
  return (
    <div>
      <h1>Welcome to my app</h1>
      <MyButton />
    </div>
  );
}`,
      isDirty: false,
      type: 'file'
    }
  ]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('typescript');
  const mikoEditorRef = useRef<MikoEditor | null>(null);

  const languages = {
    typescript: typescriptLanguage,
    javascript: javascriptLanguage,
    python: pythonLanguage,
    rust: rustLanguage,
    cpp: cppLanguage
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Initialize MikoEditor instance
  useEffect(() => {
    if (!mikoEditorRef.current) {
      try {
        const options: EditorOptions = {
          theme: 'dark',
          fontSize: 14,
          lineNumbers: true,
          minimap: false,
          wordWrap: false,
          autoIndent: true,
          bracketMatching: true
        };

        mikoEditorRef.current = createEditor(options);
      } catch (error) {
        console.error('Failed to create MikoEditor:', error);
      }
    }
  }, []);

  const createNewFile = () => {
    const language = languages[selectedLanguage as keyof typeof languages];
    const newId = `file-${Date.now()}`;
    const extension = (language.extensions && language.extensions[0]) || '.txt';
    const newTab: FileTab = {
      id: newId,
      name: `untitled${extension}`,
      language,
      content: `// New ${language.name} file\n`,
      isDirty: false
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return;

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0]?.id || '');
    }
  };

  const handleContentChange = (content: string) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === activeTabId
          ? { ...tab, content, isDirty: true }
          : tab
      )
    );
  };

  const getStats = () => {
    const content = activeTab?.content || '';
    return {
      characters: content.length,
      lines: content.split('\n').length,
      words: content.split(/\s+/).filter(word => word && word.length > 0).length
    };
  };

  const stats = getStats();

  const openExtensionTab = (extension: VSCodeExtension) => {
    const extensionTabId = `ext-${extension.extensionId}`;

    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.id === extensionTabId);
    if (existingTab) {
      setActiveTabId(extensionTabId);
      return;
    }

    // Create new extension tab
    const newTab: FileTab = {
      id: extensionTabId,
      name: extension.displayName,
      language: {
        id: 'extension',
        name: 'Extension',
        extensions: ['.vsix'],
        keywords: [],
        operators: [],
        delimiters: [],
        commentTokens: {
          line: '//',
          block: { start: '/*', end: '*/' }
        }
      },
      content: '',
      isDirty: false,
      type: 'extension',
      extensionData: extension
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(extensionTabId);
  };

  const renderTabContent = () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);

    if (!activeTab) return null;

    if (activeTab.type === 'extension' && activeTab.extensionData) {
      return <ExtensionPage extension={activeTab.extensionData} />;
    }

    // Render the new Editor component for file tabs
    return (
      <div className="flex-1 relative overflow-hidden">
        <Editor
          key={activeTab.id} // Force re-render when switching tabs
          initialContent={activeTab.content}
          onChange={handleContentChange}
          fontSize={14}
          lineHeight={1.5}
          theme="dark"
        />
      </div>
    );
  };

  return (
    <>
      <style>{`
        .syntax-comment { color: #6a9955; }
        .syntax-string { color: #ce9178; }
        .syntax-template { color: #ce9178; }
        .syntax-number { color: #b5cea8; }
        .syntax-keyword { color: #569cd6; }
        .syntax-builtin { color: #4ec9b0; }
        .syntax-function { color: #dcdcaa; }
        .syntax-jsx-tag { color: #569cd6; }
        .syntax-bracket { color: #ffffff; }
      `}</style>
      <div className="h-screen bg-[#101115] text-[#cccccc] flex overflow-hidden">
        {/* Side - left panel */}
        <Sidebar
          isOpen={sidebarOpen}
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabId}
          onNewFile={createNewFile}
          onNewFolder={() => {}} // TODO: Implement folder creation functionality
          onOpenExtension={openExtensionTab}
          onInstallToolchain={handleInstallToolchain}
          onUninstallToolchain={handleUninstallToolchain}
        />

        {/* Main content area - vertical layout */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header - spans full width at top */}
          <Header
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onNewFile={createNewFile}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />

          {/* Area - main editor section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onTabSelect={setActiveTabId}
              onTabClose={closeTab}
            />

            {/* Content container */}
            {renderTabContent()}
          </div>

          {/* Status bar at bottom */}
          <StatusBar
            activeFile={activeTab}
            stats={stats}
          />
        </div>
      </div>
    </>
  );
}

export default App;