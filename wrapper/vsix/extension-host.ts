export class ExtensionHost {
    private isRunning: boolean = false;

    start(): void {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        console.log('Extension host started');
        
        // Set up global VSCode API mock
        this.setupVSCodeAPI();
    }

    stop(): void {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        console.log('Extension host stopped');
    }

    private setupVSCodeAPI(): void {
        // Mock VSCode API for extensions
        (global as any).vscode = {
            version: '1.80.0',
            commands: {
                registerCommand: (command: string, callback: Function) => {
                    console.log(`Registered command: ${command}`);
                    return { dispose: () => {} };
                },
                executeCommand: (command: string, ...args: any[]) => {
                    console.log(`Executing command: ${command}`, args);
                    return Promise.resolve();
                }
            },
            window: {
                showInformationMessage: (message: string) => {
                    console.log(`Info: ${message}`);
                    return Promise.resolve();
                },
                showErrorMessage: (message: string) => {
                    console.error(`Error: ${message}`);
                    return Promise.resolve();
                },
                showWarningMessage: (message: string) => {
                    console.warn(`Warning: ${message}`);
                    return Promise.resolve();
                }
            },
            workspace: {
                getConfiguration: (section?: string) => {
                    return {
                        get: (key: string, defaultValue?: any) => defaultValue,
                        update: (key: string, value: any) => Promise.resolve()
                    };
                }
            }
        };
    }
}