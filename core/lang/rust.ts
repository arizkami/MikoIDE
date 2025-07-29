import type { Language } from '../editor/editor.js';

export const rustLanguage: Language = {
  id: 'rust',
  name: 'Rust',
  extensions: ['.rs'],
  keywords: [
    'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum',
    'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod',
    'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super',
    'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while', 'abstract', 'become',
    'box', 'do', 'final', 'macro', 'override', 'priv', 'typeof', 'unsized', 'virtual', 'yield'
  ],
  operators: [
    '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!',
    '+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>', '~',
    '=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=',
    '->', '=>', '::', '..', '...', '?'
  ],
  delimiters: ['(', ')', '[', ']', '{', '}', ';', ',', '.', ':', '?'],
  commentTokens: {
    line: '//',
    block: { start: '/*', end: '*/' }
  }
};