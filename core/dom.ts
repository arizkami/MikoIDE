import { MikoEditor } from './editor/editor.js';
import { ThemeManager } from './editor/color.js';
import { BasicSyntaxHighlighter } from './editor/syntax/linting.js';
import type { EditorOptions, Document, SyntaxToken, ColorTheme, Position } from './index.js';

export interface DOMEditorOptions extends Omit<EditorOptions, 'theme'> {
  container: HTMLElement;
  theme?: 'dark' | 'light' | ColorTheme;
  showLineNumbers?: boolean;
  showMinimap?: boolean;
  fontSize?: number;
  height?: string;
  width?: string;
}

export class DOMEditor {
  private editor: MikoEditor;
  private themeManager: ThemeManager;
  private highlighter: BasicSyntaxHighlighter;
  private container: HTMLElement;
  private textarea!: HTMLTextAreaElement;
  private lineNumbersEl?: HTMLElement;
  private minimapEl?: HTMLElement;
  private syntaxLayer?: HTMLElement;
  
  constructor(options: DOMEditorOptions) {
    this.editor = new MikoEditor({
      ...options,
      theme: typeof options.theme === 'string' ? options.theme : undefined
    });
    this.themeManager = new ThemeManager();
    this.highlighter = new BasicSyntaxHighlighter();
    this.container = options.container;
    
    this.setupDOM(options);
    this.setupEventListeners();
  }
  
  private setupDOM(options: DOMEditorOptions) {
    // Create main editor structure
    this.container.className = 'miko-editor';
    this.container.style.cssText = `
      position: relative;
      font-family: 'Consolas', 'Courier New', monospace;
      border: 1px solid #333;
      border-radius: 4px;
      overflow: hidden;
      height: ${options.height || '400px'};
      width: ${options.width || '100%'};
    `;
    
    // Create textarea
    this.textarea = document.createElement('textarea');
    this.textarea.style.cssText = `
      position: absolute;
      top: 0;
      left: ${options.showLineNumbers ? '60px' : '10px'};
      right: ${options.showMinimap ? '120px' : '10px'};
      bottom: 0;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      font-family: inherit;
      font-size: ${options.fontSize || 14}px;
      line-height: 1.5;
      color: #d4d4d4;
      z-index: 2;
    `;
    
    this.container.appendChild(this.textarea);
    
    // Create line numbers if enabled
    if (options.showLineNumbers) {
      this.createLineNumbers();
    }
    
    // Create minimap if enabled
    if (options.showMinimap) {
      this.createMinimap();
    }
    
    // Create syntax highlighting layer
    this.createSyntaxLayer();
    
    // Apply theme
    this.applyTheme(options.theme || 'dark');
  }
  
  private createLineNumbers() {
    this.lineNumbersEl = document.createElement('div');
    this.lineNumbersEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 50px;
      bottom: 0;
      background: #1e1e1e;
      border-right: 1px solid #333;
      padding: 10px 5px;
      font-size: 12px;
      color: #858585;
      text-align: right;
      user-select: none;
      z-index: 1;
    `;
    this.container.appendChild(this.lineNumbersEl);
  }
  
  private createMinimap() {
    this.minimapEl = document.createElement('div');
    this.minimapEl.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 110px;
      bottom: 0;
      background: #1e1e1e;
      border-left: 1px solid #333;
      z-index: 1;
    `;
    this.container.appendChild(this.minimapEl);
  }
  
  private createSyntaxLayer() {
    this.syntaxLayer = document.createElement('div');
    this.syntaxLayer.style.cssText = `
      position: absolute;
      top: 0;
      left: ${this.lineNumbersEl ? '60px' : '10px'};
      right: ${this.minimapEl ? '120px' : '10px'};
      bottom: 0;
      pointer-events: none;
      font-family: inherit;
      font-size: ${this.textarea.style.fontSize};
      line-height: 1.5;
      white-space: pre;
      z-index: 1;
    `;
    this.container.appendChild(this.syntaxLayer);
  }
  
  private setupEventListeners() {
    this.textarea.addEventListener('input', (e) => {
      const content = this.textarea.value;
      this.updateContent(content);
    });
    
    this.textarea.addEventListener('scroll', () => {
      if (this.syntaxLayer) {
        this.syntaxLayer.scrollTop = this.textarea.scrollTop;
        this.syntaxLayer.scrollLeft = this.textarea.scrollLeft;
      }
      if (this.lineNumbersEl) {
        this.lineNumbersEl.scrollTop = this.textarea.scrollTop;
      }
    });
  }
  
  private updateContent(content: string) {
    // Update line numbers
    if (this.lineNumbersEl) {
      const lines = content.split('\n');
      this.lineNumbersEl.innerHTML = lines
        .map((_, i) => `<div>${i + 1}</div>`)
        .join('');
    }
    
    // Update syntax highlighting
    if (this.syntaxLayer) {
      const tokens = this.highlighter.tokenize(content, {
        id: 'typescript',
        name: 'TypeScript',
        extensions: ['.ts', '.tsx'],
        keywords: ['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum'],
        operators: ['=', '+', '-', '*', '/', '==', '===', '!=', '!=='],
        delimiters: ['(', ')', '[', ']', '{', '}'],
        commentTokens: {
          line: '//',
          block: { start: '/*', end: '*/' }
        }
      });
      this.renderSyntaxHighlighting(content, tokens);
    }
  }
  
  private renderSyntaxHighlighting(content: string, tokens: SyntaxToken[]) {
    if (!this.syntaxLayer) return;
    
    let html = '';
    let lastIndex = 0;
    
    tokens.forEach(token => {
      // Convert range to start/end positions
      const startOffset = this.positionToOffset(content, token.range.start);
      const endOffset = this.positionToOffset(content, token.range.end);
      
      // Add text before token
      if (startOffset > lastIndex) {
        html += this.escapeHtml(content.slice(lastIndex, startOffset));
      }
      
      // Add highlighted token
      const tokenText = content.slice(startOffset, endOffset);
      html += `<span class="token-${token.type}">${this.escapeHtml(tokenText)}</span>`;
      
      lastIndex = endOffset;
    });
    
    // Add remaining text
    if (lastIndex < content.length) {
      html += this.escapeHtml(content.slice(lastIndex));
    }
    
    this.syntaxLayer.innerHTML = html;
  }
  
  private positionToOffset(content: string, position: Position): number {
    const lines = content.split('\n');
    let offset = 0;
    
    for (let i = 0; i < position.line && i < lines.length; i++) {
      offset += (lines[i]?.length ?? 0) + 1; // +1 for newline
    }
    
    return offset + Math.min(position.column, lines[position.line]?.length || 0);
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  private applyTheme(theme: 'dark' | 'light' | ColorTheme) {
    let themeObj: ColorTheme;
    
    if (typeof theme === 'string') {
      // Set the theme by name and get the current theme
      if (theme === 'dark') {
        this.themeManager.setTheme('Miko Dark');
      } else {
        this.themeManager.setTheme('Miko Light');
      }
      themeObj = this.themeManager.getCurrentTheme();
    } else {
      themeObj = theme;
    }
    
    if (themeObj) {
      this.container.style.backgroundColor = themeObj.colors.background;
      this.container.style.color = themeObj.colors.foreground;
      this.textarea.style.color = themeObj.colors.foreground;
    }
  }
  
  // Public API
  public setContent(content: string) {
    this.textarea.value = content;
    this.updateContent(content);
  }
  
  public getContent(): string {
    return this.textarea.value;
  }
  
  public focus() {
    this.textarea.focus();
  }
  
  public getEditor(): MikoEditor {
    return this.editor;
  }
}

// Factory function
export function createDOMEditor(options: DOMEditorOptions): DOMEditor {
  return new DOMEditor(options);
}