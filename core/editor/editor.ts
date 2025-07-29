// Core editor interfaces and types
export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface TextChange {
  range: Range;
  text: string;
  timestamp: number;
}

export interface EditorOptions {
  theme?: string;
  fontSize?: number;
  tabSize?: number;
  insertSpaces?: boolean;
  wordWrap?: boolean;
  lineNumbers?: boolean;
  minimap?: boolean;
  autoIndent?: boolean;
  bracketMatching?: boolean;
}

export interface Language {
  id: string;
  name: string;
  extensions: string[];
  keywords: string[];
  operators: string[];
  delimiters: string[];
  commentTokens: {
    line?: string;
    block?: { start: string; end: string };
  };
}

export interface SyntaxToken {
  type: 'keyword' | 'operator' | 'string' | 'number' | 'comment' | 'identifier' | 'delimiter';
  value: string;
  range: Range;
}

export interface Document {
  id: string;
  uri: string;
  language: Language;
  content: string;
  version: number;
  isDirty: boolean;
  lastModified: Date;
}

// Core Editor class
export class MikoEditor {
  private documents: Map<string, Document> = new Map();
  private activeDocumentId: string | null = null;
  private options: EditorOptions;
  private changeHistory: TextChange[] = [];
  private undoStack: TextChange[][] = [];
  private redoStack: TextChange[][] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(options: EditorOptions = {}) {
    this.options = {
      theme: 'dark',
      fontSize: 14,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: true,
      lineNumbers: true,
      minimap: false,
      autoIndent: true,
      bracketMatching: true,
      ...options
    };
  }

  // Document management
  createDocument(uri: string, content: string = '', language: Language): Document {
    const document: Document = {
      id: this.generateId(),
      uri,
      language,
      content,
      version: 1,
      isDirty: false,
      lastModified: new Date()
    };
    
    this.documents.set(document.id, document);
    this.emit('documentCreated', document);
    return document;
  }

  openDocument(documentId: string): boolean {
    if (this.documents.has(documentId)) {
      this.activeDocumentId = documentId;
      this.emit('documentOpened', this.documents.get(documentId));
      return true;
    }
    return false;
  }

  closeDocument(documentId: string): boolean {
    const document = this.documents.get(documentId);
    if (document) {
      this.documents.delete(documentId);
      if (this.activeDocumentId === documentId) {
        this.activeDocumentId = null;
      }
      this.emit('documentClosed', document);
      return true;
    }
    return false;
  }

  getActiveDocument(): Document | null {
    return this.activeDocumentId ? this.documents.get(this.activeDocumentId) || null : null;
  }

  getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  // Text editing operations
  insertText(position: Position, text: string): boolean {
    const document = this.getActiveDocument();
    if (!document) return false;

    const change: TextChange = {
      range: { start: position, end: position },
      text,
      timestamp: Date.now()
    };

    this.applyChange(document, change);
    return true;
  }

  deleteText(range: Range): boolean {
    const document = this.getActiveDocument();
    if (!document) return false;

    const change: TextChange = {
      range,
      text: '',
      timestamp: Date.now()
    };

    this.applyChange(document, change);
    return true;
  }

  replaceText(range: Range, text: string): boolean {
    const document = this.getActiveDocument();
    if (!document) return false;

    const change: TextChange = {
      range,
      text,
      timestamp: Date.now()
    };

    this.applyChange(document, change);
    return true;
  }

  private applyChange(document: Document, change: TextChange): void {
    const lines = document.content.split('\n');
    const startLine = change.range.start.line;
    const endLine = change.range.end.line;
    const startCol = change.range.start.column;
    const endCol = change.range.end.column;

    // Apply the change
    if (startLine === endLine) {
      const line = lines[startLine];
      if (line) {
        lines[startLine] = line.substring(0, startCol) + change.text + line.substring(endCol);
      }
    } else {
      const newLines = change.text.split('\n');
      const firstLine = (lines[startLine] || '').substring(0, startCol) + (newLines[0] || '');
      const lastLine = (newLines[newLines.length - 1] ?? '') + (lines[endLine]?.substring(endCol) ?? '');
      
      lines.splice(startLine, endLine - startLine + 1, firstLine, ...newLines.slice(1, -1), lastLine);
    }

    document.content = lines.join('\n');
    document.version++;
    document.isDirty = true;
    document.lastModified = new Date();

    this.changeHistory.push(change);
    this.emit('documentChanged', { document, change });
  }

  // Undo/Redo functionality
  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    
    const changes = this.undoStack.pop()!;
    this.redoStack.push([...changes]);
    
    // Apply reverse changes
    for (let i = changes.length - 1; i >= 0; i--) {
      const change = changes[i];
      if (change) {
        this.reverseChange(change);
      }
    }
    
    return true;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    
    const changes = this.redoStack.pop()!;
    this.undoStack.push([...changes]);
    
    // Apply changes
    for (const change of changes) {
      this.applyChange(this.getActiveDocument()!, change);
    }
    
    return true;
  }

  private reverseChange(_change: TextChange): void {
    // Implementation for reversing a change
    // This would need to track the original text that was replaced
  }

  // Search and replace
  find(query: string, options: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean } = {}): Range[] {
    const document = this.getActiveDocument();
    if (!document) return [];

    const results: Range[] = [];
    const content = options.caseSensitive ? document.content : document.content.toLowerCase();
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();
    
    if (options.regex) {
      try {
        const regex = new RegExp(searchQuery, options.caseSensitive ? 'g' : 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          const position = this.offsetToPosition(document.content, match.index);
          const endPosition = this.offsetToPosition(document.content, match.index + match[0].length);
          results.push({ start: position, end: endPosition });
        }
      } catch (e) {
        // Invalid regex
      }
    } else {
      let index = 0;
      while ((index = content.indexOf(searchQuery, index)) !== -1) {
        const position = this.offsetToPosition(document.content, index);
        const endPosition = this.offsetToPosition(document.content, index + searchQuery.length);
        results.push({ start: position, end: endPosition });
        index += searchQuery.length;
      }
    }

    return results;
  }

  replace(range: Range, replacement: string): boolean {
    return this.replaceText(range, replacement);
  }

  replaceAll(query: string, replacement: string, options: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean } = {}): number {
    const ranges = this.find(query, options);
    let replacedCount = 0;
    
    // Replace from end to start to maintain position accuracy
    for (let i = ranges.length - 1; i >= 0; i--) {
      if (this.replace(ranges[i]!, replacement)) {
        replacedCount++;
      }
    }
    
    return replacedCount;
  }

  // Utility methods
  private offsetToPosition(content: string, offset: number): Position {
    const lines = content.substring(0, offset).split('\n');
    return {
      line: lines.length - 1,
      column: lines[lines.length - 1]?.length ?? 0
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Configuration
  updateOptions(newOptions: Partial<EditorOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.emit('optionsChanged', this.options);
  }

  getOptions(): EditorOptions {
    return { ...this.options };
  }
}