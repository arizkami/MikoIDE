import type { Language } from '../editor/editor.js';

export const pythonLanguage: Language = {
  id: 'python',
  name: 'Python',
  extensions: ['.py', '.pyw', '.pyi'],
  keywords: [
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
    'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
    'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',
    'raise', 'return', 'try', 'while', 'with', 'yield'
  ],
  operators: [
    '==', '!=', '<', '>', '<=', '>=', 'is', 'is not', 'in', 'not in',
    '+', '-', '*', '/', '//', '%', '**', '&', '|', '^', '~', '<<', '>>',
    '=', '+=', '-=', '*=', '/=', '//=', '%=', '**=', '&=', '|=', '^=', '<<=', '>>='
  ],
  delimiters: ['(', ')', '[', ']', '{', '}', ',', ':', '.'],
  commentTokens: {
    line: '#',
    block: { start: '"""', end: '"""' }
  }
};