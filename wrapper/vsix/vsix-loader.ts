import * as fs from 'fs';
import * as path from 'path';
import * as yauzl from 'yauzl';

export interface IExtensionManifest {
    name: string;
    displayName: string;
    version: string;
    publisher: string;
    engines: {
        vscode: string;
    };
    main?: string;
    contributes?: any;
    activationEvents?: string[];
}

export interface ILoadedExtension {
    id: string;
    manifest: IExtensionManifest;
    extensionPath: string;
    main?: any;
}

export class VSIXLoader {
    async load(vsixPath: string): Promise<ILoadedExtension> {
        if (!fs.existsSync(vsixPath)) {
            throw new Error(`VSIX file not found: ${vsixPath}`);
        }

        const extractPath = path.join(path.dirname(vsixPath), 'extracted', path.basename(vsixPath, '.vsix'));
        
        // Extract VSIX file
        await this.extractVSIX(vsixPath, extractPath);
        
        // Read package.json
        const manifestPath = path.join(extractPath, 'extension', 'package.json');
        const manifest: IExtensionManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        const extensionId = `${manifest.publisher}.${manifest.name}`;
        const extensionPath = path.join(extractPath, 'extension');
        
        let main;
        if (manifest.main) {
            const mainPath = path.join(extensionPath, manifest.main);
            if (fs.existsSync(mainPath)) {
                main = require(mainPath);
            }
        }
        
        return {
            id: extensionId,
            manifest,
            extensionPath,
            main
        };
    }

    private async extractVSIX(vsixPath: string, extractPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            yauzl.open(vsixPath, { lazyEntries: true }, (err, zipfile) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!zipfile) {
                    reject(new Error('Failed to open VSIX file'));
                    return;
                }

                zipfile.readEntry();
                zipfile.on('entry', (entry) => {
                    const entryPath = path.join(extractPath, entry.fileName);
                    
                    if (/\/$/.test(entry.fileName)) {
                        // Directory
                        fs.mkdirSync(entryPath, { recursive: true });
                        zipfile.readEntry();
                    } else {
                        // File
                        fs.mkdirSync(path.dirname(entryPath), { recursive: true });
                        zipfile.openReadStream(entry, (err, readStream) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            
                            if (!readStream) {
                                reject(new Error('Failed to create read stream'));
                                return;
                            }
                            
                            const writeStream = fs.createWriteStream(entryPath);
                            readStream.pipe(writeStream);
                            writeStream.on('close', () => {
                                zipfile.readEntry();
                            });
                        });
                    }
                });
                
                zipfile.on('end', () => {
                    resolve();
                });
            });
        });
    }
}