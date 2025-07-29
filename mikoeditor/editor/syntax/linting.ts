import type { Language } from '../editor.js';
import type { SyntaxToken, Range, Position } from '../editor.js';

export interface LintMessage {
  severity: 'error' | 'warning' | 'info';
  message: string;
  range: Range;
  code?: string;
  source?: string;
}

export interface SyntaxHighlighter {
  tokenize(text: string, language: Language): SyntaxToken[];
}

export class BasicSyntaxHighlighter implements SyntaxHighlighter {
  tokenize(text: string, language: Language): SyntaxToken[] {
    const tokens: SyntaxToken[] = [];
    const lines = text.split('\n');
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) continue; // Skip if line is undefined
      
      let columnIndex = 0;
      
      while (columnIndex < line.length) {
        const char = line[columnIndex];
        
        // Skip whitespace
        if (char && /\s/.test(char)) {
          columnIndex++;
          continue;
        }
        
        // Comments
        if (language.commentTokens.line && line.substring(columnIndex).startsWith(language.commentTokens.line)) {
          tokens.push({
            type: 'comment',
            value: line.substring(columnIndex),
            range: {
              start: { line: lineIndex, column: columnIndex },
              end: { line: lineIndex, column: line.length }
            }
          });
          break;
        }
        
        // Block comments
        if (language.commentTokens.block && line.substring(columnIndex).startsWith(language.commentTokens.block.start)) {
          const blockStart = columnIndex;
          const blockEnd = text.indexOf(language.commentTokens.block.end, this.positionToOffset(text, { line: lineIndex, column: columnIndex }));
          
          if (blockEnd !== -1) {
            const endPos = this.offsetToPosition(text, blockEnd + language.commentTokens.block.end.length);
            tokens.push({
              type: 'comment',
              value: text.substring(this.positionToOffset(text, { line: lineIndex, column: blockStart }), blockEnd + language.commentTokens.block.end.length),
              range: {
                start: { line: lineIndex, column: blockStart },
                end: endPos
              }
            });
            columnIndex = endPos.line === lineIndex ? endPos.column : line.length;
            continue;
          }
        }
        
        // Strings
        if (char === '"' || char === "'" || char === '`') {
          const stringStart = columnIndex;
          columnIndex++;
          
          while (columnIndex < line.length && line[columnIndex] !== char) {
            if (line[columnIndex] === '\\') {
              columnIndex += 2; // Skip escaped character
            } else {
              columnIndex++;
            }
          }
          
          if (columnIndex < line.length) columnIndex++; // Include closing quote
          
          tokens.push({
            type: 'string',
            value: line.substring(stringStart, columnIndex),
            range: {
              start: { line: lineIndex, column: stringStart },
              end: { line: lineIndex, column: columnIndex }
            }
          });
          continue;
        }
        
        // Numbers
        if (char && /\d/.test(char)) {
          const numberStart = columnIndex;
          
          while (columnIndex < line.length && /[\d.]/.test(line[columnIndex] ?? '')) {
            columnIndex++;
          }
          
          tokens.push({
            type: 'number',
            value: line.substring(numberStart, columnIndex),
            range: {
              start: { line: lineIndex, column: numberStart },
              end: { line: lineIndex, column: columnIndex }
            }
          });
          continue;
        }
        
        // Operators
        let operatorFound = false;
        for (const operator of language.operators.sort((a, b) => b.length - a.length)) {
          if (line.substring(columnIndex).startsWith(operator)) {
            tokens.push({
              type: 'operator',
              value: operator,
              range: {
                start: { line: lineIndex, column: columnIndex },
                end: { line: lineIndex, column: columnIndex + operator.length }
              }
            });
            columnIndex += operator.length;
            operatorFound = true;
            break;
          }
        }
        
        if (operatorFound) continue;
        
        // Delimiters
        let delimiterFound = false;
        for (const delimiter of language.delimiters) {
          if (line.substring(columnIndex).startsWith(delimiter)) {
            tokens.push({
              type: 'delimiter',
              value: delimiter,
              range: {
                start: { line: lineIndex, column: columnIndex },
                end: { line: lineIndex, column: columnIndex + delimiter.length }
              }
            });
            columnIndex += delimiter.length;
            delimiterFound = true;
            break;
          }
        }
        
        if (delimiterFound) continue;
        
        // Identifiers and keywords
        if (char && /[a-zA-Z_]/.test(char)) {
          const identifierStart = columnIndex;
          
          while (columnIndex < line.length && /[a-zA-Z0-9_]/.test(line[columnIndex] ?? '')) {
            columnIndex++;
          }
          
          const value = line.substring(identifierStart, columnIndex);
          const isKeyword = language.keywords.includes(value);
          
          tokens.push({
            type: isKeyword ? 'keyword' : 'identifier',
            value,
            range: {
              start: { line: lineIndex, column: identifierStart },
              end: { line: lineIndex, column: columnIndex }
            }
          });
          continue;
        }
        
        // Default: single character
        columnIndex++;
      }
    }
    
    return tokens;
  }
  
  private positionToOffset(content: string, position: Position): number {
    const lines = content.split('\n');
    let offset = 0;
    
    for (let i = 0; i < position.line && i < lines.length; i++) {
      const currentLine = lines[i];
      if (currentLine !== undefined) {
        offset += currentLine.length + 1;
      }
    }
    
    const targetLine = lines[position.line];
    const lineLength = targetLine?.length ?? 0;
    return offset + Math.min(position.column, lineLength);
  }
  
  private offsetToPosition(content: string, offset: number): Position {
    const lines = content.substring(0, offset).split('\n');
    const lastLine = lines[lines.length - 1];
    return {
      line: lines.length - 1,
      column: lastLine?.length ?? 0
    };
  }
}

export class Linter {
  private rules: Map<string, (text: string, language: Language) => LintMessage[]> = new Map();
  
  constructor() {
    this.setupDefaultRules();
  }
  
  private setupDefaultRules(): void {
    // Basic syntax rules
    this.addRule('unclosed-string', (text: string, _language: Language) => {
      const messages: LintMessage[] = [];
      const lines = text.split('\n');
      
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        if (line === undefined) continue; // Skip if line is undefined
        
        let inString = false;
        let stringChar = '';
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === undefined) continue; // Skip if char is undefined
          
          if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = true;
            stringChar = char;
          } else if (inString && char === stringChar) {
            const prevChar = i > 0 ? line[i - 1] : '';
            if (prevChar !== '\\') {
              inString = false;
              stringChar = '';
            }
          }
        }
        
        if (inString) {
          messages.push({
            severity: 'error',
            message: 'Unclosed string literal',
            range: {
              start: { line: lineIndex, column: 0 },
              end: { line: lineIndex, column: line.length }
            },
            code: 'unclosed-string'
          });
        }
      }
      
      return messages;
    });
    
    this.addRule('trailing-whitespace', (text: string) => {
      const messages: LintMessage[] = [];
      const lines = text.split('\n');
      
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        if (line === undefined) continue; // Skip if line is undefined
        
        const trimmed = line.trimEnd();
        
        if (line.length > trimmed.length) {
          messages.push({
            severity: 'warning',
            message: 'Trailing whitespace',
            range: {
              start: { line: lineIndex, column: trimmed.length },
              end: { line: lineIndex, column: line.length }
            },
            code: 'trailing-whitespace'
          });
        }
      }
      
      return messages;
    });
  }
  
  addRule(name: string, rule: (text: string, language: Language) => LintMessage[]): void {
    this.rules.set(name, rule);
  }
  
  removeRule(name: string): boolean {
    return this.rules.delete(name);
  }
  
  lint(text: string, language: Language): LintMessage[] {
    const messages: LintMessage[] = [];
    
    for (const [name, rule] of this.rules) {
      try {
        messages.push(...rule(text, language));
      } catch (error) {
        console.warn(`Linting rule '${name}' failed:`, error);
      }
    }
    
    return messages.sort((a, b) => {
      if (a.range.start.line !== b.range.start.line) {
        return a.range.start.line - b.range.start.line;
      }
      return a.range.start.column - b.range.start.column;
    });
  }
}