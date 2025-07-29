import { useState, useEffect, useRef } from 'react';
import { MikoEditor, createEditor, typescriptLanguage, javascriptLanguage, pythonLanguage, rustLanguage, cppLanguage } from '../../mikoeditor';
import type { EditorOptions, Language } from '../../mikoeditor';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import StatusBar from './components/StatusBar';

interface FileTab {
  id: string;
  name: string;
  language: Language;
  content: string;
  isDirty: boolean;
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
      isDirty: false
    }
  ]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('typescript');
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);
  const mikoEditorRef = useRef<MikoEditor | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  const languages = {
    typescript: typescriptLanguage,
    javascript: javascriptLanguage,
    python: pythonLanguage,
    rust: rustLanguage,
    cpp: cppLanguage
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Enhanced syntax highlighting function
  const applySyntaxHighlighting = (content: string, language: Language) => {
    let highlighted = content;

    // Escape HTML first but preserve angle brackets for JSX
    highlighted = highlighted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments (do this first to avoid highlighting inside comments)
    if (language.commentTokens?.line) {
      const lineComment = language.commentTokens.line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      highlighted = highlighted.replace(
        new RegExp(`(${lineComment}.*?)$`, 'gm'),
        '<span class="syntax-comment">$1</span>'
      );
    }

    // Block comments
    if (language.commentTokens?.block && Array.isArray(language.commentTokens.block)) {
      const [start, end] = language.commentTokens.block;
      const startEscaped = start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const endEscaped = end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      highlighted = highlighted.replace(
        new RegExp(`(${startEscaped}[\s\S]*?${endEscaped})`, 'g'),
        '<span class="syntax-comment">$1</span>'
      );
    }

    // Strings
    highlighted = highlighted.replace(
      /(["'])(?:(?!\1)[^\\\r\n]|\\.)*\1/g,
      '<span class="syntax-string">$&</span>'
    );

    // Template literals (for JS/TS)
    if (language.name === 'TypeScript' || language.name === 'JavaScript') {
      highlighted = highlighted.replace(
        /`(?:[^`\\]|\\.)*`/g,
        '<span class="syntax-template">$&</span>'
      );
    }

    // Numbers
    highlighted = highlighted.replace(
      /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)[fFdDlL]?\b/g,
      '<span class="syntax-number">$&</span>'
    );

    // Keywords
    if (language.keywords && Array.isArray(language.keywords)) {
      language.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        highlighted = highlighted.replace(regex, `<span class="syntax-keyword">${keyword}</span>`);
      });
    }

    // Built-in types and constants
    const builtinTypes = ['boolean', 'number', 'string', 'object', 'undefined', 'null', 'true', 'false', 'void', 'any', 'unknown', 'never'];
    builtinTypes.forEach(type => {
      const regex = new RegExp(`\\b${type}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="syntax-builtin">${type}</span>`);
    });

    // Functions
    highlighted = highlighted.replace(
      /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
      '<span class="syntax-function">$1</span>'
    );

    // JSX tags (for React) - style the angle brackets as white
    if (language.name === 'TypeScript' || language.name === 'JavaScript') {
      highlighted = highlighted.replace(
        /(&lt;)\/?([a-zA-Z][a-zA-Z0-9]*)(&gt;)?/g,
        '<span class="syntax-bracket">$1</span><span class="syntax-jsx-tag">$2</span><span class="syntax-bracket">$3</span>'
      );
    }

    // Style remaining angle brackets as white
    highlighted = highlighted.replace(
      /(&lt;|&gt;)/g,
      '<span class="syntax-bracket">$1</span>'
    );

    return highlighted;
  };

  const updateLineNumbers = (content: string) => {
    if (lineNumbersRef.current && content !== undefined) {
      const lines = content.split('\n');
      lineNumbersRef.current.innerHTML = '';

      lines.forEach((_, index) => {
        const span = document.createElement('span');
        span.textContent = (index + 1).toString();
        span.style.display = 'block';
        span.style.lineHeight = '1.5';
        span.style.padding = '0 8px';
        span.style.textAlign = 'right';
        span.style.minHeight = '21px';
        span.style.color = '#6b7280';
        lineNumbersRef.current!.appendChild(span);
      });
    }
  };

  const updateSyntaxHighlighting = (content: string) => {
    if (highlightRef.current && activeTab) {
      const highlighted = applySyntaxHighlighting(content, activeTab.language);
      highlightRef.current.innerHTML = highlighted + '\n';
    }
  };

  useEffect(() => {
    if (editorRef.current && !mikoEditorRef.current) {
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

  useEffect(() => {
    if (editorRef.current && activeTab) {
      try {
        // Clear previous editor content safely
        if (editorContainerRef.current && editorRef.current.contains(editorContainerRef.current)) {
          editorRef.current.removeChild(editorContainerRef.current);
        }

        // Create editor container
        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container flex h-full relative';
        editorContainerRef.current = editorContainer;

        // Create line numbers
        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'line-numbers border-r border-gray-700 select-none bg-[#0d1117]';
        lineNumbers.style.fontFamily = '"JetBrains Mono", "Fira Code", monospace';
        lineNumbers.style.fontSize = '14px';
        lineNumbers.style.minWidth = '60px';
        lineNumbers.style.overflow = 'hidden';
        lineNumbers.style.paddingTop = '8px';
        lineNumbers.style.paddingBottom = '8px';
        lineNumbers.style.zIndex = '2';
        lineNumbersRef.current = lineNumbers;

        // Create syntax highlight overlay
        const highlightDiv = document.createElement('div');
        highlightDiv.className = 'syntax-highlight absolute top-0 left-0 pointer-events-none';
        highlightDiv.style.fontFamily = '"JetBrains Mono", "Fira Code", monospace';
        highlightDiv.style.fontSize = '14px';
        highlightDiv.style.lineHeight = '1.5';
        highlightDiv.style.padding = '8px';
        highlightDiv.style.margin = '0';
        highlightDiv.style.border = 'none';
        highlightDiv.style.color = '#ffffff'; // Set base text color to white
        highlightDiv.style.whiteSpace = 'pre-wrap';
        highlightDiv.style.wordWrap = 'break-word';
        highlightDiv.style.overflow = 'hidden';
        highlightDiv.style.zIndex = '1';
        highlightRef.current = highlightDiv;

        // Create textarea
        const textarea = document.createElement('textarea');
        textarea.value = activeTab.content || '';
        textarea.className = 'editor-content absolute top-0 left-0 w-full h-full text-transparent bg-transparent border-none outline-none resize-none caret-white';
        textarea.spellcheck = false;
        textarea.style.fontFamily = '"JetBrains Mono", "Fira Code", monospace';
        textarea.style.fontSize = '14px';
        textarea.style.lineHeight = '1.5';
        textarea.style.padding = '8px';
        textarea.style.margin = '0';
        textarea.style.tabSize = '2';
        textarea.style.zIndex = '3';
        textarea.style.caretColor = '#ffffff';

        // Create editor content container
        const editorContent = document.createElement('div');
        editorContent.className = 'editor-content-container flex-1 relative overflow-auto';
        editorContent.style.backgroundColor = '#0d1117';

        // Handle input and scroll synchronization
        const handleInput = (e: Event) => {
          const target = e.target as HTMLTextAreaElement;
          if (target && target.value !== undefined) {
            updateLineNumbers(target.value);
            updateSyntaxHighlighting(target.value);
            setTabs(prevTabs =>
              prevTabs.map(tab =>
                tab.id === activeTabId
                  ? { ...tab, content: target.value, isDirty: true }
                  : tab
              )
            );
          }
        };

        const handleScroll = () => {
          if (lineNumbersRef.current && textareaRef.current && highlightRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
            highlightRef.current.scrollTop = textareaRef.current.scrollTop;
            highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
          }
        };

        textarea.addEventListener('input', handleInput);
        textarea.addEventListener('scroll', handleScroll);

        // Initial setup
        updateLineNumbers(activeTab.content || '');
        updateSyntaxHighlighting(activeTab.content || '');

        // Assemble editor
        editorContent.appendChild(highlightDiv);
        editorContent.appendChild(textarea);
        editorContainer.appendChild(lineNumbers);
        editorContainer.appendChild(editorContent);
        editorRef.current.appendChild(editorContainer);

        textareaRef.current = textarea;
      } catch (error) {
        console.error('Failed to create editor:', error);
      }
    }

    return () => {
      // Cleanup will be handled by next effect run
    };
  }, [activeTabId, activeTab]);

  useEffect(() => {
    if (textareaRef.current && activeTab && textareaRef.current.value !== activeTab.content) {
      textareaRef.current.value = activeTab.content || '';
      updateLineNumbers(activeTab.content || '');
      updateSyntaxHighlighting(activeTab.content || '');
    }
  }, [activeTab?.content]);

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

  const getStats = () => {
    const content = activeTab?.content || '';
    return {
      characters: content.length,
      lines: content.split('\n').length,
      words: content.split(/\s+/).filter(word => word && word.length > 0).length
    };
  };

  const stats = getStats();

  return (
    <>
      <style>{`

      `}</style>
      <div className="h-screen bg-[#101115] text-[#cccccc] flex overflow-hidden">
        {/* Side - left panel */}
        <Sidebar
          isOpen={sidebarOpen}
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabId}
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

            {/* Editor container - this is where the text editor should appear */}
            <div className="flex-1 relative overflow-hidden">
              <div
                ref={editorRef}
                className="absolute inset-0 bg-[#0d1117]"
              />
            </div>
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
