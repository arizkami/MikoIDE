// Color and theme management
export interface ColorTheme {
  name: string;
  type: 'light' | 'dark';
  colors: {
    background: string;
    foreground: string;
    selection: string;
    lineNumber: string;
    currentLine: string;
    cursor: string;
    keyword: string;
    string: string;
    number: string;
    comment: string;
    operator: string;
    identifier: string;
    delimiter: string;
    error: string;
    warning: string;
    info: string;
  };
}

export const defaultDarkTheme: ColorTheme = {
  name: 'Miko Dark',
  type: 'dark',
  colors: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    selection: '#264f78',
    lineNumber: '#858585',
    currentLine: '#2a2d2e',
    cursor: '#ffffff',
    keyword: '#569cd6',
    string: '#ce9178',
    number: '#b5cea8',
    comment: '#6a9955',
    operator: '#d4d4d4',
    identifier: '#9cdcfe',
    delimiter: '#808080',
    error: '#f44747',
    warning: '#ffcc02',
    info: '#75beff'
  }
};

export const defaultLightTheme: ColorTheme = {
  name: 'Miko Light',
  type: 'light',
  colors: {
    background: '#ffffff',
    foreground: '#000000',
    selection: '#add6ff',
    lineNumber: '#237893',
    currentLine: '#f5f5f5',
    cursor: '#000000',
    keyword: '#0000ff',
    string: '#a31515',
    number: '#098658',
    comment: '#008000',
    operator: '#000000',
    identifier: '#001080',
    delimiter: '#000000',
    error: '#cd3131',
    warning: '#bf8803',
    info: '#1a85ff'
  }
};

export class ThemeManager {
  private themes: Map<string, ColorTheme> = new Map();
  private currentTheme: ColorTheme;

  constructor() {
    this.themes.set(defaultDarkTheme.name, defaultDarkTheme);
    this.themes.set(defaultLightTheme.name, defaultLightTheme);
    this.currentTheme = defaultDarkTheme;
  }

  addTheme(theme: ColorTheme): void {
    this.themes.set(theme.name, theme);
  }

  removeTheme(name: string): boolean {
    if (name === defaultDarkTheme.name || name === defaultLightTheme.name) {
      return false; // Cannot remove default themes
    }
    return this.themes.delete(name);
  }

  setTheme(name: string): boolean {
    const theme = this.themes.get(name);
    if (theme) {
      this.currentTheme = theme;
      return true;
    }
    return false;
  }

  getCurrentTheme(): ColorTheme {
    return this.currentTheme;
  }

  getAllThemes(): ColorTheme[] {
    return Array.from(this.themes.values());
  }

  getThemeNames(): string[] {
    return Array.from(this.themes.keys());
  }

  generateCSS(): string {
    const theme = this.currentTheme;
    return `
      .miko-editor {
        background-color: ${theme.colors.background};
        color: ${theme.colors.foreground};
      }
      .miko-editor .line-numbers {
        color: ${theme.colors.lineNumber};
      }
      .miko-editor .current-line {
        background-color: ${theme.colors.currentLine};
      }
      .miko-editor .selection {
        background-color: ${theme.colors.selection};
      }
      .miko-editor .cursor {
        border-color: ${theme.colors.cursor};
      }
      .miko-editor .token-keyword {
        color: ${theme.colors.keyword};
      }
      .miko-editor .token-string {
        color: ${theme.colors.string};
      }
      .miko-editor .token-number {
        color: ${theme.colors.number};
      }
      .miko-editor .token-comment {
        color: ${theme.colors.comment};
      }
      .miko-editor .token-operator {
        color: ${theme.colors.operator};
      }
      .miko-editor .token-identifier {
        color: ${theme.colors.identifier};
      }
      .miko-editor .token-delimiter {
        color: ${theme.colors.delimiter};
      }
      .miko-editor .error {
        color: ${theme.colors.error};
      }
      .miko-editor .warning {
        color: ${theme.colors.warning};
      }
      .miko-editor .info {
        color: ${theme.colors.info};
      }
    `;
  }
}