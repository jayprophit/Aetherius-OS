
import React, { useState } from 'react';
import { LaunchableApp, TaskbarConfig } from '../types';
import { 
    SearchIcon, PowerIcon, Cog6ToothIcon, UserCircleIcon, 
    Squares2X2Icon, DocumentTextIcon, PhotoIcon, FolderIcon 
} from './Icons';
import { desktopItems, mainMenuItems } from '../data';
import { loggedInUser } from '../data';

interface StartMenuProps {
    onLaunchApp: (app: LaunchableApp) => void;
    onClose: () => void;
    config: TaskbarConfig;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onLaunchApp, onClose, config }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const allApps = [...desktopItems, ...mainMenuItems.flatMap(g => g.children || [])];
    const uniqueApps = Array.from(new Map(allApps.map(item => [item.title, item])).values());

    const filteredApps = uniqueApps.filter(app => 
        app.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pinnedApps = uniqueApps.slice(0, 12);

    // Positioning based on taskbar config
    const getMenuPosition = () => {
        const baseClasses = "fixed z-[60] bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl overflow-hidden flex flex-col transition-all duration-300 ease-out";
        
        switch (config.position) {
            case 'bottom':
                return `${baseClasses} bottom-16 left-4 w-[640px] h-[500px] origin-bottom-left`;
            case 'top':
                return `${baseClasses} top-16 left-4 w-[640px] h-[500px] origin-top-left`;
            case 'left':
                return `${baseClasses} left-20 bottom-4 w-[400px] h-[600px] origin-bottom-left`;
            case 'right':
                return `${baseClasses} right-20 bottom-4 w-[400px] h-[600px] origin-bottom-right`;
            default:
                return `${baseClasses} bottom-16 left-4 w-[640px] h-[500px] origin-bottom-left`;
        }
    };

    const getComponent = (item: any) => item.component || (item.type === 'folder' ? 'folderView' : 'placeholder');
    const getIcon = (item: any) => item.icon || FolderIcon;

    return (
        <>
            {/* Overlay to close on click outside */}
            <div className="fixed inset-0 z-[55]" onClick={onClose}></div>
            
            <div className={getMenuPosition()}>
                {/* Search Bar */}
                <div className="p-6 pb-2">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search for apps, settings, and files..." 
                            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Pinned / All Apps */}
                    <div className="flex-1 p-6 pt-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {searchTerm ? 'Search Results' : 'Pinned'}
                            </h3>
                            {!searchTerm && (
                                <button className="text-xs font-semibold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded">
                                    All Apps &gt;
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-6 gap-4">
                            {(searchTerm ? filteredApps : pinnedApps).map((app, idx) => (
                                <button 
                                    key={`${app.title}-${idx}`}
                                    onClick={() => {
                                        onLaunchApp({
                                            component: getComponent(app),
                                            title: app.title || 'Unknown',
                                            icon: getIcon(app),
                                            context: (app as any).type === 'folder' ? { folder: app } : { menuItem: app }
                                        });
                                        onClose();
                                    }}
                                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        {getIcon(app) && React.createElement(getIcon(app), { className: "w-6 h-6 text-gray-700 dark:text-gray-200" })}
                                    </div>
                                    <span className="text-[10px] text-center font-medium text-gray-700 dark:text-gray-300 truncate w-full">
                                        {app.title}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {!searchTerm && (
                            <>
                                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-8 mb-4">Recommended</h3>
                                <div className="space-y-1">
                                    {[
                                        { name: 'Project_Phoenix.pdf', icon: DocumentTextIcon, sub: '2h ago' },
                                        { name: 'Vacation_Photos', icon: PhotoIcon, sub: 'Yesterday' },
                                        { name: 'Source Code', icon: FolderIcon, sub: 'Last Week' }
                                    ].map((item, i) => (
                                        <button key={i} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
                                            <item.icon className="w-8 h-8 text-blue-500 opacity-80" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.sub}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-100/80 dark:bg-black/40 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <button 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-left"
                        onClick={() => {
                             onLaunchApp({ component: 'myProfile', title: 'My Profile', icon: UserCircleIcon });
                             onClose();
                        }}
                    >
                        <img 
                            src={loggedInUser.avatarUrl || ''} 
                            alt={loggedInUser.name} 
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600" 
                        />
                        <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{loggedInUser.name}</p>
                            <p className="text-[10px] text-green-500">Online</p>
                        </div>
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
                                onLaunchApp({ component: 'settings', title: 'Settings', icon: Cog6ToothIcon });
                                onClose();
                            }}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
                            title="Settings"
                        >
                            <Cog6ToothIcon className="w-5 h-5" />
                        </button>
                        <button 
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 rounded-lg transition-colors"
                            title="Power"
                        >
                            <PowerIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
