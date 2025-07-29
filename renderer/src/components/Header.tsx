import React, { useState } from 'react';
import { Menu, Search, PanelLeft, PanelRight, PanelBottom, Layout, ChevronDown } from 'lucide-react';
import { menus } from '../data/menu';

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

    const layoutOptions = [
        { id: 'left', icon: PanelLeft, label: 'Toggle Left Panel', action: onToggleSidebar },
        { id: 'right', icon: PanelRight, label: 'Right Panel' },
        { id: 'bottom', icon: PanelBottom, label: 'Bottom Panel' },
        { id: 'default', icon: Layout, label: 'Default Layout' }
    ];

    const handleLayoutChange = (layoutId: string, action?: () => void) => {
        if (action) {
            action();
        } else {
            setCurrentLayout(layoutId);
            console.log('Layout changed to:', layoutId);
        }
    };

    const handleMenuToggle = () => {
        setIsMenuOpen(!isMenuOpen);
        setActiveSubmenu(null);
        setOpenSubmenu(null);
    };

    const handleMenuItemClick = (command: string) => {
        console.log('Menu command:', command);
        setIsMenuOpen(false);
        setActiveSubmenu(null);
        setOpenSubmenu(null);
        // Add your command handling logic here
    };

    const handleSubmenuHover = (menuId: string) => {
        setActiveSubmenu(menuId);
        setOpenSubmenu(null);
    };

    const handleSubmenuToggle = (submenuId: string) => {
        setOpenSubmenu(openSubmenu === submenuId ? null : submenuId);
    };

    const renderMenuItem = (item: any, isSubmenu = false) => {
        if (item.type === 'separator') {
            return <div key={Math.random()} className="h-px bg-[#3E3E42] my-1" />;
        }

        if (item.submenu) {
            const isOpen = openSubmenu === item.label;
            return (
                <div key={item.label} className="relative">
                    <button
                        onClick={() => handleSubmenuToggle(item.label)}
                        className="w-full text-left px-3 py-1.5 text-xs text-[#cccccc] hover:bg-[#3e3e42] flex items-center justify-between"
                    >
                        {item.label}
                        <ChevronDown size={12} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                        <div className="ml-4 border-l border-[#3E3E42] pl-2">
                            {item.submenu.map((subItem: any) => renderMenuItem(subItem, true))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <button
                key={item.label}
                onClick={() => handleMenuItemClick(item.command)}
                className={`w-full text-left px-3 py-1.5 text-xs text-[#cccccc] hover:bg-[#3e3e42] ${isSubmenu ? 'pl-6' : ''}`}
            >
                {item.label}
            </button>
        );
    };

    const renderMenuSection = (menu: any) => (
        <div key={menu.id} className="relative">
            <div
                className="px-3 py-2 text-xs font-semibold text-[#858585] border-b border-[#3E3E42] cursor-pointer hover:bg-[#3e3e42]"
                onMouseEnter={() => handleSubmenuHover(menu.id)}
            >
                {menu.label}
            </div>
            {activeSubmenu === menu.id && (
                <div className="absolute left-full top-0 ml-1 bg-[#252526ce] backdrop-blur-md border border-[#3E3E42] rounded shadow-lg min-w-48 z-50">
                    <div className="py-1">
                        {menu.items.map((item: any) => renderMenuItem(item))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div
            className="h-10 bg-[#16181D] border-b border-[#2E333B] flex items-center justify-between px-2"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            <div className="flex items-center space-x-2">
                {/* Menu Button */}
                <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <button
                        onClick={handleMenuToggle}
                        className="p-2 hover:bg-[#3e3e42] rounded transition-colors"
                    >
                        <Menu size={16} className="text-[#cccccc]" />
                    </button>
                    
                    {isMenuOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-[#25252654] backdrop-blur-md border border-[#3E3E42] rounded shadow-lg min-w-48 z-50">
                            <div className="">
                                {menus.map((menu) => renderMenuSection(menu))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {activeFile ? (
                        <>
                            <span className="text-sm text-[#cccccc] font-semibold tracking-wide">{activeFile.name}</span>
                            <span className="text-xs text-[#858585] font-medium">{activeFile.language.name}</span>
                        </>
                    ) : (
                        <div className='flex flex-col -space-y-1'>
                            <span className="text-xs text-[#cccccc] font-semibold">MikoIDE</span>
                            <span className="text-xs text-[#858585] font-medium">origin/master (arizkami/reactapp)</span>
                        </div>
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
                {/* Layout buttons */}
                <div className="flex items-center space-x-1 border-r border-[#3E3E42] pr-3 mr-2">
                    {layoutOptions.map((option) => {
                        const IconComponent = option.icon;
                        const isActive = currentLayout === option.id;
                        return (
                            <button
                                key={option.id}
                                onClick={() => handleLayoutChange(option.id, option.action)}
                                className={`p-2 rounded transition-colors ${
                                    isActive
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