import type { MikoEditor, Document, Position, Range } from './index.js';

export interface Plugin {
  name: string;
  version: string;
  activate(editor: MikoEditor): void;
  deactivate(editor: MikoEditor): void;
}

export interface EditorEvent {
  type: string;
  data: any;
  timestamp: number;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private activePlugins: Set<string> = new Set();
  private eventListeners: Map<string, Function[]> = new Map();
  
  register(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }
  
  activate(pluginName: string, editor: MikoEditor): boolean {
    const plugin = this.plugins.get(pluginName);
    if (plugin && !this.activePlugins.has(pluginName)) {
      plugin.activate(editor);
      this.activePlugins.add(pluginName);
      return true;
    }
    return false;
  }
  
  deactivate(pluginName: string, editor: MikoEditor): boolean {
    const plugin = this.plugins.get(pluginName);
    if (plugin && this.activePlugins.has(pluginName)) {
      plugin.deactivate(editor);
      this.activePlugins.delete(pluginName);
      return true;
    }
    return false;
  }
  
  getActivePlugins(): string[] {
    return Array.from(this.activePlugins);
  }
  
  on(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }
  
  emit(event: EditorEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(callback => callback(event));
  }
}

// Built-in plugins
export class AutoSavePlugin implements Plugin {
  name = 'autosave';
  version = '1.0.0';
  private interval?: NodeJS.Timeout;
  
  activate(editor: MikoEditor): void {
    this.interval = setInterval(() => {
      // Auto-save logic here
      console.log('Auto-saving...');
    }, 30000); // Save every 30 seconds
  }
  
  deactivate(editor: MikoEditor): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

export class BracketMatchingPlugin implements Plugin {
  name = 'bracket-matching';
  version = '1.0.0';
  
  activate(editor: MikoEditor): void {
    // Add bracket matching logic
    console.log('Bracket matching activated');
  }
  
  deactivate(editor: MikoEditor): void {
    console.log('Bracket matching deactivated');
  }
}

export function createPluginManager(): PluginManager {
  return new PluginManager();
}