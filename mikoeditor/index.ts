import { MikoEditor } from './editor/editor.js';
import type { EditorOptions, Position, Range, Document, Language, SyntaxToken } from './editor/editor.js';
import { ThemeManager, defaultDarkTheme, defaultLightTheme } from './editor/color.js';
import type { ColorTheme } from './editor/color.js';
import { BasicSyntaxHighlighter, Linter } from './editor/syntax/linting.js';
import type { LintMessage } from './editor/syntax/linting.js';
import { typescriptLanguage } from './lang/typescript.js';
import { javascriptLanguage } from './lang/javascript.js';
import { pythonLanguage } from './lang/python.js';
import { rustLanguage } from './lang/rust.js';
import { cppLanguage } from './lang/cpp.js';

// Export core classes and interfaces
export { MikoEditor, ThemeManager, BasicSyntaxHighlighter, Linter };
export type { EditorOptions, Position, Range, Document, Language, SyntaxToken, ColorTheme, LintMessage };

// Export all language definitions
export { 
  typescriptLanguage, 
  javascriptLanguage, 
  pythonLanguage, 
  rustLanguage, 
  cppLanguage 
};

// Export themes
export { defaultDarkTheme, defaultLightTheme };

// Factory functions for core components
export function createEditor(options: EditorOptions = {}): MikoEditor {
  return new MikoEditor(options);
}

export function createThemeManager(): ThemeManager {
  return new ThemeManager();
}

export function createSyntaxHighlighter(): BasicSyntaxHighlighter {
  return new BasicSyntaxHighlighter();
}

export function createLinter(): Linter {
  return new Linter();
}

// Default export for convenience
export default {
  // Core classes
  MikoEditor,
  ThemeManager,
  BasicSyntaxHighlighter,
  Linter,
  
  // Factory functions
  createEditor,
  createThemeManager,
  createSyntaxHighlighter,
  createLinter,
  
  // Languages
  typescriptLanguage,
  javascriptLanguage,
  pythonLanguage,
  rustLanguage,
  cppLanguage,
  
  // Themes
  defaultDarkTheme,
  defaultLightTheme
};

console.log("MikoEditor core framework initialized!");