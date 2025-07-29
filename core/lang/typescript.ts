import type { Language } from '../editor/editor.js';

export const typescriptLanguage: Language = {
  id: 'typescript',
  name: 'TypeScript',
  extensions: ['.ts', '.tsx'],
  keywords: [
    'abstract', 'any', 'as', 'asserts', 'async', 'await', 'boolean', 'break', 'case', 'catch',
    'class', 'const', 'constructor', 'continue', 'debugger', 'declare', 'default', 'delete',
    'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function',
    'get', 'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'is', 'keyof',
    'let', 'module', 'namespace', 'never', 'new', 'null', 'number', 'object', 'of', 'package',
    'private', 'protected', 'public', 'readonly', 'return', 'set', 'static', 'string',
    'super', 'switch', 'symbol', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined',
    'unique', 'unknown', 'var', 'void', 'while', 'with', 'yield'
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