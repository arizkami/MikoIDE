import React, { useState } from 'react';
import {
    Download,
    CheckCircle,
    Loader,
    RefreshCw,
    ExternalLink,
    Info
} from 'lucide-react';
import InstallationDialog from './InstallationDialog';

export interface Toolchain {
    id: string;
    name: string;
    version: string;
    description: string;
    category: 'compiler' | 'runtime' | 'build-tool' | 'debugger' | 'package-manager';
    platform: 'windows' | 'linux' | 'macos' | 'cross-platform';
    downloadUrl: string;
    installCommand?: string;
    size: number; // in MB
    isInstalled: boolean;
    isInstalling: boolean;
    installPath?: string;
    dependencies?: string[];
    homepage?: string;
    documentation?: string;
}

interface PackageManagerProps {
    onInstall?: (toolchain: Toolchain) => void;
    onUninstall?: (toolchain: Toolchain) => void;
}

const MOCK_TOOLCHAINS: Toolchain[] = [
    {
        id: 'gcc-mingw',
        name: 'GCC (MinGW-w64)',
        version: '13.2.0',
        description: 'GNU Compiler Collection for Windows',
        category: 'compiler',
        platform: 'windows',
        downloadUrl: 'https://github.com/niXman/mingw-builds-binaries/releases',
        size: 156,
        isInstalled: false,
        isInstalling: false,
        homepage: 'https://gcc.gnu.org/',
        documentation: 'https://gcc.gnu.org/onlinedocs/'
    },
    {
        id: 'msvc-build-tools',
        name: 'MSVC Build Tools',
        version: '2022',
        description: 'Microsoft Visual C++ Build Tools',
        category: 'compiler',
        platform: 'windows',
        downloadUrl: 'https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022',
        size: 2048,
        isInstalled: true,
        isInstalling: false,
        installPath: 'C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools'
    },
    {
        id: 'nodejs',
        name: 'Node.js',
        version: '20.10.0',
        description: 'JavaScript runtime built on Chrome\'s V8 engine',
        category: 'runtime',
        platform: 'cross-platform',
        downloadUrl: 'https://nodejs.org/en/download/',
        size: 32,
        isInstalled: true,
        isInstalling: false,
        installPath: 'C:\\Program Files\\nodejs'
    },
    {
        id: 'python',
        name: 'Python',
        version: '3.12.1',
        description: 'High-level programming language',
        category: 'runtime',
        platform: 'cross-platform',
        downloadUrl: 'https://www.python.org/downloads/',
        size: 28,
        isInstalled: false,
        isInstalling: false
    },
    {
        id: 'rust',
        name: 'Rust',
        version: '1.75.0',
        description: 'Systems programming language',
        category: 'compiler',
        platform: 'cross-platform',
        downloadUrl: 'https://rustup.rs/',
        installCommand: 'curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh',
        size: 45,
        isInstalled: false,
        isInstalling: false
    },
    {
        id: 'cmake',
        name: 'CMake',
        version: '3.28.1',
        description: 'Cross-platform build system generator',
        category: 'build-tool',
        platform: 'cross-platform',
        downloadUrl: 'https://cmake.org/download/',
        size: 42,
        isInstalled: true,
        isInstalling: false,
        installPath: 'C:\\Program Files\\CMake'
    },
    {
        id: 'ninja',
        name: 'Ninja',
        version: '1.11.1',
        description: 'Small build system with focus on speed',
        category: 'build-tool',
        platform: 'cross-platform',
        downloadUrl: 'https://github.com/ninja-build/ninja/releases',
        size: 0.5,
        isInstalled: false,
        isInstalling: false
    },
    {
        id: 'gdb',
        name: 'GDB',
        version: '13.2',
        description: 'GNU Debugger',
        category: 'debugger',
        platform: 'cross-platform',
        downloadUrl: 'https://www.gnu.org/software/gdb/',
        size: 15,
        isInstalled: false,
        isInstalling: false
    },
    {
        id: 'bun',
        name: 'Bun',
        version: '1.0.15',
        description: 'Fast all-in-one JavaScript runtime',
        category: 'package-manager',
        platform: 'cross-platform',
        downloadUrl: 'https://bun.sh/',
        installCommand: 'curl -fsSL https://bun.sh/install | bash',
        size: 85,
        isInstalled: true,
        isInstalling: false,
        installPath: 'C:\\Users\\%USERNAME%\\.bun'
    }
];

const PackageManager: React.FC<PackageManagerProps> = ({ onInstall, onUninstall }) => {
    const [toolchains, setToolchains] = useState<Toolchain[]>(MOCK_TOOLCHAINS);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [installDialogOpen, setInstallDialogOpen] = useState(false);
    const [selectedToolchain, setSelectedToolchain] = useState<Toolchain | null>(null);

    const categories = [
        { id: 'all', label: 'All Tools' },
        { id: 'compiler', label: 'Compilers' },
        { id: 'runtime', label: 'Runtimes' },
        { id: 'build-tool', label: 'Build Tools' },
        { id: 'debugger', label: 'Debuggers' },
        { id: 'package-manager', label: 'Package Managers' }
    ];

    const filteredToolchains = toolchains.filter(toolchain => {
        const matchesCategory = selectedCategory === 'all' || toolchain.category === selectedCategory;
        const matchesSearch = toolchain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            toolchain.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    //@ts-expect-error
    const handleInstall = async (toolchain: Toolchain) => {
        setToolchains(prev => prev.map(t =>
            t.id === toolchain.id ? { ...t, isInstalling: true } : t
        ));

        // Simulate installation process with different paths based on installation type
        setTimeout(() => {
            const installPath = toolchain.installPath ||
                (process.env.INSTALL_TYPE === 'sandbox'
                    ? `{app}/sandbox/tools/${toolchain.name.toLowerCase().replace(/\s+/g, '-')}`
                    : (navigator.platform.toLowerCase().includes('win')
                        ? `C:\\Tools\\${toolchain.name.replace(/\s+/g, '')}`
                        : `/usr/local/bin/${toolchain.name.toLowerCase().replace(/\s+/g, '-')}`));

            setToolchains(prev => prev.map(t =>
                t.id === toolchain.id ? {
                    ...t,
                    isInstalling: false,
                    isInstalled: true,
                    installPath
                } : t
            ));
            onInstall?.(toolchain);
        }, 3000);
    };

    const handleUninstall = async (toolchain: Toolchain) => {
        setToolchains(prev => prev.map(t =>
            t.id === toolchain.id ? {
                ...t,
                isInstalled: false,
                installPath: undefined
            } : t
        ));
        onUninstall?.(toolchain);
    };
    const handleInstallClick = (toolchain: Toolchain) => {
        setSelectedToolchain(toolchain);
        setInstallDialogOpen(true);
    };

    const handleInstallConfirm = async (toolchain: Toolchain, installationType: 'sandbox' | 'local', customPath?: string) => {
        setToolchains(prev => prev.map(t =>
            t.id === toolchain.id ? { ...t, isInstalling: true } : t
        ));

        // Simulate installation process with different paths based on installation type
        setTimeout(() => {
            const installPath = customPath ||
                (installationType === 'sandbox'
                    ? `{app}/sandbox/tools/${toolchain.name.toLowerCase().replace(/\s+/g, '-')}`
                    : (navigator.platform.toLowerCase().includes('win')
                        ? `C:\\Tools\\${toolchain.name.replace(/\s+/g, '')}`
                        : `/usr/local/bin/${toolchain.name.toLowerCase().replace(/\s+/g, '-')}`));

            setToolchains(prev => prev.map(t =>
                t.id === toolchain.id ? {
                    ...t,
                    isInstalling: false,
                    isInstalled: true,
                    installPath
                } : t
            ));
            onInstall?.(toolchain);
        }, 3000);
    };


    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate refresh
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    const getStatusIcon = (toolchain: Toolchain) => {
        if (toolchain.isInstalling) {
            return <Loader size={14} className="text-[#0078d4] animate-spin" />;
        }
        if (toolchain.isInstalled) {
            return <CheckCircle size={14} className="text-[#73c991]" />;
        }
        return <Download size={14} className="text-[#858585]" />;
    };

    const getCategoryColor = (category: Toolchain['category']) => {
        switch (category) {
            case 'compiler': return 'text-[#f9c23c] bg-[#f9c23c]/10 rounded px-1.5 py-0.5 uppercase';
            case 'runtime': return 'text-[#73c991] bg-[#73c991]/10 rounded px-1.5 py-0.5 uppercase';
            case 'build-tool': return 'text-[#0078d4] bg-[#0078d4]/10 rounded px-1.5 py-0.5 uppercase';
            case 'debugger': return 'text-[#f14c4c] bg-[#f14c4c]/10 rounded px-1.5 py-0.5 uppercase';
            case 'package-manager': return 'text-[#b180d7] bg-[#b180d7]/10 rounded px-1.5 py-0.5 uppercase';
            default: return 'text-[#858585] bg-[#858585]/10 rounded px-1.5 py-0.5 uppercase';
        }
    };

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="p-2">
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[#cccccc] text-xs font-semibold">PACKAGE MANAGER</span>
                        <button
                            onClick={handleRefresh}
                            className={`p-1 hover:bg-[#2a2d2e] rounded text-[#cccccc] transition-colors ${isRefreshing ? 'cursor-not-allowed opacity-50' : ''
                                }`}
                            title="Refresh"
                            disabled={isRefreshing}
                        >
                            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative mb-2">
                        <input
                            type="text"
                            placeholder="Search toolchains..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-xs text-[#cccccc] placeholder-[#858585]"
                        />
                    </div>

                    {/* Categories */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-xs text-[#cccccc] mb-3"
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                    </select>

                    {/* Toolchain List */}
                    <div className="space-y-2">
                        {filteredToolchains.map((toolchain) => (
                            <div
                                key={toolchain.id}
                                className="p-2 bg-[#2a2d2e] rounded hover:bg-[#37373d] transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1 justify-between">
                                            <div className='flex items-center space-x-2'>
                                                {getStatusIcon(toolchain)}
                                                <span className="text-xs text-[#cccccc] font-semibold truncate">
                                                    {toolchain.name}
                                                </span>
                                            </div>
                                            <span className={`text-xs px-1 rounded ${getCategoryColor(toolchain.category)}`}>
                                                {toolchain.category}
                                            </span>
                                        </div>
                                        <div className="text-xs text-[#858585] mb-1">
                                            v{toolchain.version} • {toolchain.size < 1 ?
                                                `${(toolchain.size * 1024).toFixed(0)} KB` :
                                                `${toolchain.size.toFixed(1)} MB`
                                            }
                                        </div>
                                        <div className="text-xs text-[#858585] line-clamp-2">
                                            {toolchain.description}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex space-x-1">
                                        {toolchain.homepage && (
                                            <button
                                                onClick={() => window.open(toolchain.homepage, '_blank')}
                                                className="p-1 hover:bg-[#3c3c3c] rounded text-[#858585] hover:text-[#cccccc]"
                                                title="Homepage"
                                            >
                                                <ExternalLink size={10} />
                                            </button>
                                        )}
                                        {toolchain.documentation && (
                                            <button
                                                onClick={() => window.open(toolchain.documentation, '_blank')}
                                                className="p-1 hover:bg-[#3c3c3c] rounded text-[#858585] hover:text-[#cccccc]"
                                                title="Documentation"
                                            >
                                                <Info size={10} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex space-x-1">
                                        {toolchain.isInstalled ? (
                                            <button
                                                onClick={() => handleUninstall(toolchain)}
                                                className="px-2 py-1 bg-[#f14c4c] hover:bg-[#e13e3e] text-white text-xs rounded transition-colors"
                                                title="Uninstall"
                                            >
                                               <p>Uninstall</p>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleInstallClick(toolchain)}
                                                disabled={toolchain.isInstalling}
                                                className={`px-2 py-1 text-xs rounded transition-colors ${toolchain.isInstalling
                                                    ? 'bg-[#858585] cursor-not-allowed'
                                                    : 'bg-[#ffffff] hover:bg-[#106ebe] text-white'
                                                    }`}
                                                title={toolchain.isInstalling ? 'Installing...' : 'Install'}
                                            >
                                                {toolchain.isInstalling ? (
                                                    <Loader size={10} className="animate-spin" />
                                                ) : (
                                                    <div className='flex items-center space-x-2'>
                                                        <p className='text-xs text-black'>Install</p>
                                                    </div>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <InstallationDialog
                            toolchain={selectedToolchain}
                            isOpen={installDialogOpen}
                            onClose={() => {
                                setInstallDialogOpen(false);
                                setSelectedToolchain(null);
                            }}
                            onInstall={handleInstallConfirm}
                        />

                        {filteredToolchains.length === 0 && (
                            <div className="text-xs text-[#858585] text-center py-4">
                                No toolchains found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageManager;