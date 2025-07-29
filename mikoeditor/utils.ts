import type { Position, Range, Document, SyntaxToken } from './index.js';

// Text manipulation utilities
export class TextUtils {
  static getLineCount(text: string): number {
    return text.split('\n').length;
  }
  
  static getLineAt(text: string, lineNumber: number): string {
    const lines = text.split('\n');
    return lines[lineNumber] || '';
  }
  
  static getPositionFromOffset(text: string, offset: number): Position {
    const lines = text.slice(0, offset).split('\n');
    return {
      line: lines.length - 1,
      column: lines[lines.length - 1]?.length ?? 0
    };
  }
  
  static getOffsetFromPosition(text: string, position: Position): number {
    const lines = text.split('\n');
    let offset = 0;
    
    for (let i = 0; i < position.line && i < lines.length; i++) {
      offset += (lines[i]?.length ?? 0) + 1; // +1 for newline
    }
    
    return offset + Math.min(position.column, lines[position.line]?.length || 0);
  }
  
  static getTextInRange(text: string, range: Range): string {
    const startOffset = this.getOffsetFromPosition(text, range.start);
    const endOffset = this.getOffsetFromPosition(text, range.end);
    return text.slice(startOffset, endOffset);
  }
  
  static replaceTextInRange(text: string, range: Range, replacement: string): string {
    const startOffset = this.getOffsetFromPosition(text, range.start);
    const endOffset = this.getOffsetFromPosition(text, range.end);
    return text.slice(0, startOffset) + replacement + text.slice(endOffset);
  }
}

// Syntax highlighting utilities
export class SyntaxUtils {
  static tokenizeToHTML(text: string, tokens: SyntaxToken[]): string {
    let html = '';
    let lastIndex = 0;
    
    tokens.forEach(token => {
      // Convert range to offsets
      const startOffset = TextUtils.getOffsetFromPosition(text, token.range.start);
      const endOffset = TextUtils.getOffsetFromPosition(text, token.range.end);
      
      // Add text before token
      if (startOffset > lastIndex) {
        html += this.escapeHtml(text.slice(lastIndex, startOffset));
      }
      
      // Add highlighted token
      const tokenText = text.slice(startOffset, endOffset);
      html += `<span class="syntax-${token.type}">${this.escapeHtml(tokenText)}</span>`;
      
      lastIndex = endOffset;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      html += this.escapeHtml(text.slice(lastIndex));
    }
    
    return html;
  }
  
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  static generateCSS(theme: any): string {
    return `
      .syntax-keyword { color: ${theme.syntax?.keyword || '#569cd6'}; }
      .syntax-string { color: ${theme.syntax?.string || '#ce9178'}; }
      .syntax-number { color: ${theme.syntax?.number || '#b5cea8'}; }
      .syntax-comment { color: ${theme.syntax?.comment || '#6a9955'}; }
      .syntax-operator { color: ${theme.syntax?.operator || '#d4d4d4'}; }
      .syntax-identifier { color: ${theme.syntax?.identifier || '#9cdcfe'}; }
      .syntax-delimiter { color: ${theme.syntax?.delimiter || '#d4d4d4'}; }
    `;
  }
}

// Document utilities
export class DocumentUtils {
  static createEmptyDocument(id: string, language: any): Document {
    return {
      id,
      uri: '',
      content: '',
      language,
      version: 0,
      isDirty: false,
      lastModified: new Date()
    };
  }
  
  static cloneDocument(doc: Document): Document {
    return {
      ...doc,
      version: doc.version + 1,
      lastModified: new Date()
    };
  }
  
  static getDocumentStats(doc: Document) {
    const lines = doc.content.split('\n');
    return {
      lines: lines.length,
      characters: doc.content.length,
      words: doc.content.split(/\s+/).filter(word => word.length > 0).length,
      size: new Blob([doc.content]).size
    };
  }
}

// Export all utilities
export default {
  TextUtils,
  SyntaxUtils,
  DocumentUtils
};