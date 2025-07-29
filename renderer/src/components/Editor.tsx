import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TextBuffer } from './TextBuffer';
import type { Position, Range } from './TextBuffer';
import { SyntaxHighlighter } from './SyntaxHighlighter';

interface EditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  fontSize?: number;
  lineHeight?: number;
  theme?: 'dark' | 'light';
}

const Editor: React.FC<EditorProps> = ({
  initialContent = '',
  onChange,
  fontSize = 14,
  lineHeight = 1.5,
  theme = 'dark'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const linesContainerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [textBuffer] = useState(() => new TextBuffer(initialContent));
  const [syntaxHighlighter] = useState(() => new SyntaxHighlighter());
  const [cursor, setCursor] = useState<Position>({ line: 0, column: 0 });
  const [selection, setSelection] = useState<Range | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const [isFocused, setIsFocused] = useState(false);
  
  const lineHeightPx = fontSize * lineHeight;
  const charWidth = fontSize * 0.6; // Approximate character width for monospace
  const visibleLines = Math.ceil(containerHeight / lineHeightPx) + 2; // Buffer lines
  const startLine = Math.floor(scrollTop / lineHeightPx);
  const endLine = Math.min(startLine + visibleLines, textBuffer.getLineCount());
  
  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Listen to text buffer changes
  useEffect(() => {
    const unsubscribe = textBuffer.onChange(() => {
      setCursor(textBuffer.getCursor());
      setSelection(textBuffer.getSelection());
      onChange?.(textBuffer.getContent());
      forceUpdate();
    });
    return unsubscribe;
  }, [textBuffer, onChange]);

  const [, forceUpdateState] = useState({});
  const forceUpdate = useCallback(() => {
    forceUpdateState({});
  }, []);

  // Handle textarea input
  const handleTextareaInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const value = textarea.value;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    
    // Update text buffer content
    textBuffer.setContent(value);
    
    // Update cursor position
    const cursorPos = textBuffer.offsetToPosition(selectionStart);
    textBuffer.setCursor(cursorPos);
    
    // Update selection if any
    if (selectionStart !== selectionEnd) {
      const startPos = textBuffer.offsetToPosition(selectionStart);
      const endPos = textBuffer.offsetToPosition(selectionEnd);
      textBuffer.setSelection({ start: startPos, end: endPos });
    } else {
      textBuffer.setSelection(null);
    }
  }, [textBuffer]);

  // Handle textarea selection change
  const handleTextareaSelectionChange = useCallback(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    
    const cursorPos = textBuffer.offsetToPosition(selectionStart);
    textBuffer.setCursor(cursorPos);
    
    if (selectionStart !== selectionEnd) {
      const startPos = textBuffer.offsetToPosition(selectionStart);
      const endPos = textBuffer.offsetToPosition(selectionEnd);
      textBuffer.setSelection({ start: startPos, end: endPos });
    } else {
      textBuffer.setSelection(null);
    }
  }, [textBuffer]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const scrollLeft = e.currentTarget.scrollLeft;
    setScrollTop(scrollTop);
    setScrollLeft(scrollLeft);
    
    // Sync textarea scroll
    if (textareaRef.current) {
      textareaRef.current.scrollTop = scrollTop;
      textareaRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  // Handle container click to focus textarea and position cursor
  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (textareaRef.current) {
      // Focus the textarea first
      textareaRef.current.focus();
      
      // Calculate click position relative to the code area
      const rect = linesContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top + scrollTop;
      
      const line = Math.floor(y / lineHeightPx);
      const column = Math.round(x / charWidth);
      
      // Clamp position to valid bounds
      const clampedLine = Math.max(0, Math.min(line, textBuffer.getLineCount() - 1));
      const lineText = textBuffer.getLine(clampedLine);
      const clampedColumn = Math.max(0, Math.min(column, lineText.length));
      
      const position = { line: clampedLine, column: clampedColumn };
      const offset = textBuffer.positionToOffset(position);
      
      // Set cursor position in textarea
      textareaRef.current.setSelectionRange(offset, offset);
      
      // Update text buffer cursor
      textBuffer.setCursor(position);
    }
  }, [textBuffer, lineHeightPx, charWidth, scrollTop]);

  // Update cursor position
  useEffect(() => {
    if (cursorRef.current && isFocused) {
      const cursorTop = cursor.line * lineHeightPx - scrollTop;
      const cursorLeft = cursor.column * charWidth - scrollLeft + 60; // 60px for line numbers
      
      cursorRef.current.style.top = `${cursorTop}px`;
      cursorRef.current.style.left = `${cursorLeft}px`;
      cursorRef.current.style.display = 'block';
    } else if (cursorRef.current) {
      cursorRef.current.style.display = 'none';
    }
  }, [cursor, lineHeightPx, charWidth, scrollTop, scrollLeft, isFocused]);

  // Sync textarea content
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const content = textBuffer.getContent();
      
      if (textarea.value !== content) {
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        textarea.value = content;
        textarea.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }, [textBuffer]);

  // Auto-focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Render visible lines
  const renderLines = () => {
    const lines = [];
    const totalHeight = textBuffer.getLineCount() * lineHeightPx;
    
    for (let i = startLine; i < endLine; i++) {
      const line = textBuffer.getLine(i);
      const highlightedLine = syntaxHighlighter.highlightLine(line);
      
      lines.push(
        <div
          key={i}
          className="line"
          style={{
            position: 'absolute',
            top: i * lineHeightPx,
            left: 0,
            right: 0,
            height: lineHeightPx,
            lineHeight: `${lineHeightPx}px`,
            fontSize: `${fontSize}px`,
            paddingLeft: '8px',
            whiteSpace: 'pre',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
          dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }}
        />
      );
    }
    
    return (
      <div style={{ position: 'relative', height: totalHeight }}>
        {lines}
      </div>
    );
  };

  // Render line numbers
  const renderLineNumbers = () => {
    const numbers = [];
    
    for (let i = startLine; i < endLine; i++) {
      numbers.push(
        <div
          key={i}
          className="line-number"
          style={{
            position: 'absolute',
            top: i * lineHeightPx,
            left: 0,
            width: '50px',
            height: lineHeightPx,
            lineHeight: `${lineHeightPx}px`,
            fontSize: `${fontSize}px`,
            textAlign: 'right',
            paddingRight: '8px',
            color: theme === 'dark' ? '#6b7280' : '#9ca3af',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          {i + 1}
        </div>
      );
    }
    
    const totalHeight = textBuffer.getLineCount() * lineHeightPx;
    return (
      <div style={{ position: 'relative', height: totalHeight }}>
        {numbers}
      </div>
    );
  };

  const themeStyles = {
    dark: {
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      borderColor: '#333'
    },
    light: {
      backgroundColor: '#ffffff',
      color: '#333333',
      borderColor: '#ccc'
    }
  };

  return (
    <>
      <style>{`
        .syntax-keyword { color: ${theme === 'dark' ? '#569cd6' : '#0000ff'}; }
        .syntax-string { color: ${theme === 'dark' ? '#ce9178' : '#008000'}; }
        .syntax-comment { color: ${theme === 'dark' ? '#6a9955' : '#008000'}; }
        .syntax-number { color: ${theme === 'dark' ? '#b5cea8' : '#098658'}; }
        .syntax-operator { color: ${theme === 'dark' ? '#d4d4d4' : '#333333'}; }
        .syntax-identifier { color: ${theme === 'dark' ? '#9cdcfe' : '#001080'}; }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
      
      <div
        ref={containerRef}
        className="editor-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          border: `1px solid ${themeStyles[theme].borderColor}`,
          borderRadius: '4px',
          overflow: 'hidden',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          ...themeStyles[theme]
        }}
        onClick={handleContainerClick}
      >
        {/* Hidden textarea for input */}
        <textarea
          ref={textareaRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            padding: '0 0 0 60px',
            margin: 0,
            zIndex: 10,
            color: 'transparent',
            backgroundColor: 'transparent',
            caretColor: 'transparent'
          }}
          value={textBuffer.getContent()}
          onInput={handleTextareaInput}
          onSelect={handleTextareaSelectionChange}
          onKeyUp={handleTextareaSelectionChange}
          onMouseUp={handleTextareaSelectionChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        
        {/* Scrollable content */}
        <div
          ref={scrollContainerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto',
            zIndex: 2
          }}
          onScroll={handleScroll}
        >
          {/* Line numbers */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '60px',
              backgroundColor: theme === 'dark' ? '#252526' : '#f8f8f8',
              borderRight: `1px solid ${themeStyles[theme].borderColor}`,
              overflow: 'hidden',
              pointerEvents: 'none'
            }}
          >
            {renderLineNumbers()}
          </div>
          
          {/* Code lines */}
          <div
            ref={linesContainerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: '60px',
              right: 0,
              overflow: 'hidden',
              minHeight: `${textBuffer.getLineCount() * lineHeightPx}px`
            }}
          >
            {renderLines()}
          </div>
          
          {/* Cursor */}
          <div
            ref={cursorRef}
            style={{
              position: 'absolute',
              width: '2px',
              height: `${lineHeightPx}px`,
              backgroundColor: theme === 'dark' ? '#ffffff' : '#000000',
              zIndex: 3,
              pointerEvents: 'none',
              animation: isFocused ? 'blink 1s infinite' : 'none',
              display: 'none'
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Editor;