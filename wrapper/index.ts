import { ExtensionHost } from './vsix/extension-host';
import { ExtensionManager } from './vsix/extension-manager';
import { VSIXLoader } from './vsix/vsix-loader';

export interface IExtensionAPI {
    activate(context: any): void;
    deactivate(): void;
}

export interface IExtensionContext {
    subscriptions: any[];
    workspaceState: any;
    globalState: any;
    extensionPath: string;
    storagePath: string;
}

export class VSCodeExtensionWrapper {
    private extensionHost: ExtensionHost;
    private extensionManager: ExtensionManager;
    private vsixLoader: VSIXLoader;

    constructor() {
        this.extensionHost = new ExtensionHost();
        this.extensionManager = new ExtensionManager();
        this.vsixLoader = new VSIXLoader();
    }

    async loadExtension(vsixPath: string): Promise<boolean> {
        try {
            const extension = await this.vsixLoader.load(vsixPath);
            return await this.extensionManager.register(extension);
        } catch (error) {
            console.error('Failed to load extension:', error);
            return false;
        }
    }

    async activateExtension(extensionId: string): Promise<boolean> {
        return await this.extensionManager.activate(extensionId);
    }

    async deactivateExtension(extensionId: string): Promise<boolean> {
        return await this.extensionManager.deactivate(extensionId);
    }

    getLoadedExtensions(): string[] {
        return this.extensionManager.getLoadedExtensions();
    }
}

export default VSCodeExtensionWrapper;