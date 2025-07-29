import React, { useState } from 'react';
import { Menu, Search, PanelLeft, PanelRight, PanelBottom, Layout } from 'lucide-react';

interface HeaderProps {
    onToggleSidebar: () => void;
    onNewFile: () => void;
    selectedLanguage: string;
    onLanguageChange: (language: string) => void;
    activeFile?: {
        id: string;
        name: string;
        language: { id: string; name: string };
        content: string;
        isDirty: boolean;
    };
}

const Header: React.FC<HeaderProps> = ({
    onToggleSidebar,
    activeFile
}) => {
    const [currentLayout, setCurrentLayout] = useState('default');

    const layoutOptions = [
        { id: 'left', icon: PanelLeft, label: 'Left Panel' },
        { id: 'right', icon: PanelRight, label: 'Right Panel' },
        { id: 'bottom', icon: PanelBottom, label: 'Bottom Panel' },
        { id: 'default', icon: Layout, label: 'Default Layout' }
    ];

    const handleLayoutChange = (layoutId: string) => {
        setCurrentLayout(layoutId);
        // Add your layout change logic here
        console.log('Layout changed to:', layoutId);
    };

    return (
        <div
            className="h-10 bg-[#16181D] border-b border-[#2E333B] flex items-center justify-between px-2"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            <div className="flex items-center space-x-2">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 hover:bg-[#3e3e42] rounded transition-colors"
                    style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                    <Menu size={16} className="text-[#cccccc]" />
                </button>

                <div className="flex items-center space-x-2">
                    {activeFile ? (
                        <>
                            <span className="text-sm text-[#cccccc] font-semibold tracking-wide">{activeFile.name}</span>
                            <span className="text-xs text-[#858585] font-medium">{activeFile.language.name}</span>
                        </>
                    ) : (
                        <>
                            <div className='flex flex-col -space-y-1'>
                                <span className="text-xs text-[#cccccc] font-semibold ">MikoIDE</span>
                                <span className="text-xs text-[#858585] font-medium">origin/master (arizkami/reactapp)</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div
                className="flex items-center space-x-2 bg-[#ffffff13] rounded-full px-3 py-1"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                <Search size={14} className="text-[#858585]" />
                <input
                    type="text"
                    placeholder="Search files..."
                    className="bg-transparent text-sm text-[#cccccc] placeholder-[#858585] outline-none w-48 placeholder:text-xs"
                />
            </div>

            <div
                className="flex items-center space-x-1"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                {/* Layout buttons - all visible */}
                <div className="flex items-center space-x-1 border-r border-[#3E3E42] pr-3 mr-2">
                    {layoutOptions.map((option) => {
                        const IconComponent = option.icon;
                        const isActive = currentLayout === option.id;
                        return (
                            <button
                                key={option.id}
                                onClick={() => handleLayoutChange(option.id)}
                                className={`p-2 rounded transition-colors ${isActive
                                        ? 'bg-[#0E639C] text-white'
                                        : 'hover:bg-[#3e3e42] text-[#cccccc]'
                                    }`}
                                title={option.label}
                            >
                                <IconComponent size={14} />
                            </button>
                        );
                    })}
                </div>

                <div>
                    <button className="p-1 bg-[#3e3e42] rounded-full transition-colors">
                        <img src="https://avatars.githubusercontent.com/u/99713905?v=4" alt="arizkami" className="w-6 h-6 rounded-full" />
                    </button>
                </div>
                <div className='pr-33' />
            </div>
        </div>
    );
};

export default Header;