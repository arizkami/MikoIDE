import type { Language } from '../editor/editor.js';

export const javascriptLanguage: Language = {
  id: 'javascript',
  name: 'JavaScript',
  extensions: ['.js', '.jsx', '.mjs'],
  keywords: [
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for',
    'from', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'of',
    'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined',
    'var', 'void', 'while', 'with', 'yield'
  ],
  operators: [
    '===', '!==', '==', '!=', '<=', '>=', '<', '>', '&&', '||', '!', '??', '?.', 
    '++', '--', '+=', '-=', '*=', '/=', '%=', '**=', '&=', '|=', '^=', '<<=', '>>=', '>>>=',
    '+', '-', '*', '/', '%', '**', '&', '|', '^', '~', '<<', '>>', '>>>', '=', '=>'
  ],
  delimiters: ['(', ')', '[', ']', '{', '}', ';', ',', '.', ':', '?'],
  commentTokens: {
    line: '//',
    block: { start: '/*', end: '*/' }
  }
};