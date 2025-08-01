import type { Language } from '../editor/editor.js';

export const cppLanguage: Language = {
  id: 'cpp',
  name: 'C++',
  extensions: ['.cpp', '.cxx', '.cc', '.c++', '.hpp', '.hxx', '.hh', '.h++', '.h'],
  keywords: [
    'alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit',
    'atomic_noexcept', 'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch',
    'char', 'char8_t', 'char16_t', 'char32_t', 'class', 'compl', 'concept', 'const',
    'consteval', 'constexpr', 'constinit', 'const_cast', 'continue', 'co_await',
    'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'double',
    'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false',
    'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable',
    'namespace', 'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or',
    'or_eq', 'private', 'protected', 'public', 'register', 'reinterpret_cast',
    'requires', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert',
    'static_cast', 'struct', 'switch', 'template', 'this', 'thread_local',
    'throw', 'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned',
    'using', 'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq'
  ],
  operators: [
    '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!',
    '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=',
    '+', '-', '*', '/', '%', '&', '|', '^', '~', '<<', '>>', '=',
    '->', '::', '.', '.*', '->*', '?:', '...'
  ],
  delimiters: ['(', ')', '[', ']', '{', '}', ';', ',', '.', ':', '?'],
  commentTokens: {
    line: '//',
    block: { start: '/*', end: '*/' }
  }
};