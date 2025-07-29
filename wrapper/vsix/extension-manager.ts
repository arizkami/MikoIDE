import { ILoadedExtension } from './vsix-loader';
import { IExtensionContext } from '../index';

export class ExtensionManager {
    private extensions: Map<string, ILoadedExtension> = new Map();
    private activeExtensions: Set<string> = new Set();

    async register(extension: ILoadedExtension): Promise<boolean> {
        try {
            this.extensions.set(extension.id, extension);
            console.log(`Registered extension: ${extension.id}`);
            return true;
        } catch (error) {
            console.error(`Failed to register extension ${extension.id}:`, error);
            return false;
        }
    }

    async activate(extensionId: string): Promise<boolean> {
        const extension = this.extensions.get(extensionId);
        if (!extension) {
            console.error(`Extension not found: ${extensionId}`);
            return false;
        }

        if (this.activeExtensions.has(extensionId)) {
            console.log(`Extension already active: ${extensionId}`);
            return true;
        }

        try {
            if (extension.main && extension.main.activate) {
                const context: IExtensionContext = {
                    subscriptions: [],
                    workspaceState: {},
                    globalState: {},
                    extensionPath: extension.extensionPath,
                    storagePath: extension.extensionPath
                };
                
                await extension.main.activate(context);
                this.activeExtensions.add(extensionId);
                console.log(`Activated extension: ${extensionId}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Failed to activate extension ${extensionId}:`, error);
            return false;
        }
    }

    async deactivate(extensionId: string): Promise<boolean> {
        const extension = this.extensions.get(extensionId);
        if (!extension) {
            return false;
        }

        if (!this.activeExtensions.has(extensionId)) {
            return true;
        }

        try {
            if (extension.main && extension.main.deactivate) {
                await extension.main.deactivate();
            }
            this.activeExtensions.delete(extensionId);
            console.log(`Deactivated extension: ${extensionId}`);
            return true;
        } catch (error) {
            console.error(`Failed to deactivate extension ${extensionId}:`, error);
            return false;
        }
    }

    getLoadedExtensions(): string[] {
        return Array.from(this.extensions.keys());
    }

    getActiveExtensions(): string[] {
        return Array.from(this.activeExtensions);
    }

    getExtension(extensionId: string): ILoadedExtension | undefined {
        return this.extensions.get(extensionId);
    }
}