
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    SearchIcon, CalculatorIcon, CommandLineIcon, 
    ArrowRightIcon, AppWindowIcon, Cog6ToothIcon,
    DocumentTextIcon, UserCircleIcon, ArrowPathIcon,
    FolderIcon
} from './Icons';
import { mainMenuItems, desktopItems, settingsConfig } from '../data';
import { LaunchableApp } from '../App';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onLaunchApp: (app: LaunchableApp) => void;
}

interface SearchResult {
    id: string;
    title: string;
    type: 'App' | 'Setting' | 'Command' | 'File';
    icon: React.FC<any>;
    action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onLaunchApp }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const results: SearchResult[] = useMemo(() => {
        if (!query) return [];

        const normalizedQuery = query.toLowerCase();
        const items: SearchResult[] = [];

        // 1. Index Apps
        const allApps = [...desktopItems, ...mainMenuItems.flatMap(g => g.children || [])];
        allApps.forEach(app => {
            const item = app as any; 
            if (item.title?.toLowerCase().includes(normalizedQuery)) {
                items.push({
                    id: item.title + (item.component || 'folder'),
                    title: item.title,
                    type: 'App',
                    icon: item.icon || AppWindowIcon,
                    action: () => {
                        onLaunchApp({
                            component: item.component || 'placeholder',
                            title: item.title || 'App',
                            icon: item.icon,
                            context: item.type === 'folder' ? { folder: item } : { menuItem: item }
                        });
                    }
                });
            }
        });

        // 2. Index Settings Pages
        settingsConfig.forEach(cat => {
            cat.items.forEach(setting => {
                 if (setting.title.toLowerCase().includes(normalizedQuery)) {
                     items.push({
                         id: `setting-${setting.id}`,
                         title: setting.title,
                         type: 'Setting',
                         icon: setting.icon || Cog6ToothIcon,
                         action: () => onLaunchApp({ 
                             component: 'settings', 
                             title: 'Settings', 
                             icon: Cog6ToothIcon, 
                             context: { initialView: setting.component } // Assuming SettingsView handles this
                         })
                     });
                 }
            });
        });

        // 3. Mock Files (Basic Search)
        const mockFiles = [
            { name: 'Project_Genesis_Specs.pdf', type: 'Document' },
            { name: 'Q4_Financials.xlsx', type: 'Spreadsheet' },
            { name: 'Avatar_Render.png', type: 'Image' },
            { name: 'kernel.wasm', type: 'System' }
        ];
        
        mockFiles.forEach(file => {
            if (file.name.toLowerCase().includes(normalizedQuery)) {
                 items.push({
                    id: `file-${file.name}`,
                    title: file.name,
                    type: 'File',
                    icon: DocumentTextIcon, // Simplification
                    action: () => {
                        // Launch file manager (mocking file open)
                         onLaunchApp({ component: 'fileManager', title: 'My Computer', icon: FolderIcon });
                    }
                });
            }
        });

        // 4. Math Calculation
        if (/^[\d\s+\-*/().]+$/.test(query)) {
            try {
                // eslint-disable-next-line
                const result = eval(query); 
                items.unshift({
                    id: 'math-result',
                    title: `= ${result}`,
                    type: 'Command',
                    icon: CalculatorIcon,
                    action: () => navigator.clipboard.writeText(result.toString())
                });
            } catch (e) {}
        }

        // 5. System Commands
        if ('reload system restart'.includes(normalizedQuery)) {
            items.push({
                id: 'sys-reload',
                title: 'System Reload',
                type: 'Command',
                icon: ArrowPathIcon,
                action: () => window.location.reload()
            });
        }
        
        if ('settings preferences'.includes(normalizedQuery)) {
             items.push({
                id: 'sys-settings',
                title: 'Open Settings',
                type: 'Setting',
                icon: Cog6ToothIcon,
                action: () => onLaunchApp({ component: 'settings', title: 'Settings', icon: Cog6ToothIcon })
            });
        }

        return items.slice(0, 8); 
    }, [query, onLaunchApp]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            if (results[selectedIndex]) {
                results[selectedIndex].action();
                onClose();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={onClose}>
            <div 
                className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                    <input 
                        ref={inputRef}
                        type="text" 
                        className="flex-1 bg-transparent border-none outline-none px-4 text-lg text-gray-800 dark:text-white placeholder-gray-400"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex gap-1">
                        <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">ESC</span>
                    </div>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto p-2">
                    {results.length === 0 && query && (
                        <div className="p-4 text-center text-gray-500">No results found.</div>
                    )}
                    {results.length === 0 && !query && (
                        <div className="p-4 text-xs text-gray-500 dark:text-gray-400">
                            <p className="font-bold mb-2 uppercase tracking-wider">Suggested</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left">
                                    <UserCircleIcon className="w-4 h-4"/> My Profile
                                </button>
                                <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left">
                                    <CommandLineIcon className="w-4 h-4"/> Terminal
                                </button>
                            </div>
                        </div>
                    )}
                    {results.map((result, index) => {
                        const Icon = result.icon;
                        return (
                            <button
                                key={result.id}
                                onClick={() => { result.action(); onClose(); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                                    index === selectedIndex 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${index === selectedIndex ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                                <span className="flex-1 font-medium">{result.title}</span>
                                <span className={`text-xs opacity-70 px-2 py-0.5 rounded ${index === selectedIndex ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                    {result.type}
                                </span>
                                {index === selectedIndex && <ArrowRightIcon className="w-4 h-4 opacity-70" />}
                            </button>
                        );
                    })}
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-[10px] text-gray-500">
                    <div className="flex gap-3">
                        <span>Select <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">↵</kbd></span>
                        <span>Navigate <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">↑↓</kbd></span>
                    </div>
                    <span>AetherSearch v1.0</span>
                </div>
            </div>
        </div>
    );
};
