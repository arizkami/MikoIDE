export interface SyntaxToken {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'identifier';
  value: string;
  startIndex: number;
  endIndex: number;
}

export class SyntaxHighlighter {
  private keywords = new Set([
    'const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum',
    'import', 'export', 'default', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally',
    'throw', 'new', 'this', 'super', 'extends', 'implements', 'public',
    'private', 'protected', 'static', 'readonly', 'abstract', 'async', 'await'
  ]);

  private operators = new Set([
    '+', '-', '*', '/', '%', '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=',
    '&&', '||', '!', '&', '|', '^', '~', '<<', '>>', '>>>', '?', ':', '=>'
  ]);

  tokenize(text: string): SyntaxToken[] {
    const tokens: SyntaxToken[] = [];
    let i = 0;

    while (i < text.length) {
      const char = text[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Comments
      if (char === '/' && text[i + 1] === '/') {
        const start = i;
        while (i < text.length && text[i] !== '\n') {
          i++;
        }
        tokens.push({
          type: 'comment',
          value: text.slice(start, i),
          startIndex: start,
          endIndex: i
        });
        continue;
      }

      // Block comments
      if (char === '/' && text[i + 1] === '*') {
        const start = i;
        i += 2;
        while (i < text.length - 1 && !(text[i] === '*' && text[i + 1] === '/')) {
          i++;
        }
        i += 2;
        tokens.push({
          type: 'comment',
          value: text.slice(start, i),
          startIndex: start,
          endIndex: i
        });
        continue;
      }

      // Strings
      if (char === '"' || char === "'" || char === '`') {
        const quote = char;
        const start = i;
        i++;
        while (i < text.length && text[i] !== quote) {
          if (text[i] === '\\') i++; // Skip escaped characters
          i++;
        }
        i++; // Include closing quote
        tokens.push({
          type: 'string',
          value: text.slice(start, i),
          startIndex: start,
          endIndex: i
        });
        continue;
      }

      // Numbers
      if (/\d/.test(char)) {
        const start = i;
        while (i < text.length && /[\d.]/.test(text[i])) {
          i++;
        }
        tokens.push({
          type: 'number',
          value: text.slice(start, i),
          startIndex: start,
          endIndex: i
        });
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_$]/.test(char)) {
        const start = i;
        while (i < text.length && /[a-zA-Z0-9_$]/.test(text[i])) {
          i++;
        }
        const value = text.slice(start, i);
        tokens.push({
          type: this.keywords.has(value) ? 'keyword' : 'identifier',
          value,
          startIndex: start,
          endIndex: i
        });
        continue;
      }

      // Operators
      const twoChar = text.slice(i, i + 2);
      const threeChar = text.slice(i, i + 3);
      if (this.operators.has(threeChar)) {
        tokens.push({
          type: 'operator',
          value: threeChar,
          startIndex: i,
          endIndex: i + 3
        });
        i += 3;
        continue;
      }
      if (this.operators.has(twoChar)) {
        tokens.push({
          type: 'operator',
          value: twoChar,
          startIndex: i,
          endIndex: i + 2
        });
        i += 2;
        continue;
      }
      if (this.operators.has(char)) {
        tokens.push({
          type: 'operator',
          value: char,
          startIndex: i,
          endIndex: i + 1
        });
        i++;
        continue;
      }

      // Skip unknown characters
      i++;
    }

    return tokens;
  }

  highlightLine(line: string): string {
    const tokens = this.tokenize(line);
    let result = '';
    let lastIndex = 0;

    tokens.forEach(token => {
      // Add text before token
      if (token.startIndex > lastIndex) {
        result += this.escapeHtml(line.slice(lastIndex, token.startIndex));
      }

      // Add highlighted token
      result += `<span class="syntax-${token.type}">${this.escapeHtml(token.value)}</span>`;
      lastIndex = token.endIndex;
    });

    // Add remaining text
    if (lastIndex < line.length) {
      result += this.escapeHtml(line.slice(lastIndex));
    }

    return result;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}