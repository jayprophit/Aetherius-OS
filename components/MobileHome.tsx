
import React, { useState, useEffect } from 'react';
import { desktopItems, mainMenuItems } from '../data';
import { LaunchableApp } from '../App';
import { 
    SearchIcon, SignalIcon, BatteryIcon, WifiIcon, 
    ChevronLeftIcon, HomeIcon, UserCircleIcon
} from './Icons';
import { AppItem } from '../types';

interface MobileHomeProps {
    onLaunchApp: (app: LaunchableApp) => void;
    activeApp: LaunchableApp | null;
    onCloseApp: () => void;
    wallpaperUrl?: string;
}

// --- Helper Components ---

const SquircleIcon: React.FC<{ icon: React.FC<any>; className?: string }> = ({ icon: Icon, className = "bg-white/20" }) => (
    <div className={`w-16 h-16 rounded-[18px] flex items-center justify-center shadow-lg backdrop-blur-md border border-white/10 ${className}`}>
        <Icon className="w-9 h-9 text-white drop-shadow-sm" />
    </div>
);

const MobileWidgetSmall: React.FC<{ title: string; content: React.ReactNode; color: string }> = ({ title, content, color }) => (
    <div className={`h-40 rounded-[24px] p-4 flex flex-col justify-between shadow-lg backdrop-blur-xl border border-white/10 ${color}`}>
        <div className="text-xs font-bold text-white/70 uppercase">{title}</div>
        <div className="text-white">{content}</div>
    </div>
);

const MobileWidgetLarge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="col-span-2 h-40 rounded-[24px] bg-black/20 p-4 shadow-lg backdrop-blur-xl border border-white/10 flex flex-col justify-center">
        {children}
    </div>
);

const PageIndicator: React.FC<{ total: number; current: number }> = ({ total, current }) => (
    <div className="flex justify-center gap-2 mt-4 mb-8">
        {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/30'}`} />
        ))}
    </div>
);

// --- Main Component ---

export const MobileHome: React.FC<MobileHomeProps> = ({ onLaunchApp, activeApp, onCloseApp, wallpaperUrl }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Gather all launchable apps
    const allApps = [
        ...(desktopItems.filter(i => i.type === 'app') as AppItem[]), 
        ...mainMenuItems.flatMap(group => group.children || [])
    ].filter((app, index, self) => 
        index === self.findIndex((t) => (
            t.title === app.title && (t as any).component === (app as any).component
        ))
    );

    // Filter Logic
    const filteredApps = allApps.filter(app => 
        app.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Pagination Logic (20 apps per page)
    const APPS_PER_PAGE = 20;
    const totalPages = Math.ceil(filteredApps.length / APPS_PER_PAGE);
    const currentApps = filteredApps.slice(page * APPS_PER_PAGE, (page + 1) * APPS_PER_PAGE);

    // Fixed Dock Apps (Pinned)
    const dockApps = allApps.slice(0, 4); 

    const handleLaunch = (item: any) => {
        onLaunchApp({
            component: item.component || 'placeholder',
            title: item.title || 'App',
            icon: item.icon,
            context: (item as any).context || { menuItem: item }
        });
    };

    return (
        <div className="h-full w-full bg-black relative overflow-hidden font-sans select-none touch-pan-y">
            {/* Dynamic Wallpaper */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                style={{ 
                    backgroundImage: `url(${wallpaperUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000'})`,
                    filter: activeApp ? 'brightness(0.4) blur(20px) scale(1.1)' : 'brightness(0.8)'
                }}
            />

            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-10 flex justify-between items-end px-6 pb-2 text-white text-xs font-bold z-50 tracking-wide">
                <span className="text-sm">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="flex items-center gap-2">
                    <SignalIcon className="w-4 h-4" />
                    <WifiIcon className="w-4 h-4" />
                    <BatteryIcon className="w-5 h-4" />
                </div>
            </div>

            {/* Active App Overlay (Full Screen Card) */}
            {activeApp && (
                <div className="absolute inset-0 z-40 bg-white dark:bg-gray-900 flex flex-col animate-scale-up overflow-hidden">
                    {/* App Header */}
                    <div className="h-12 flex items-center justify-between px-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <button onClick={onCloseApp} className="flex items-center text-blue-500 font-semibold text-sm">
                            <ChevronLeftIcon className="w-5 h-5 mr-1" /> Back
                        </button>
                        <span className="font-bold text-gray-800 dark:text-white">{activeApp.title}</span>
                        <div className="w-12"></div>
                    </div>
                    
                    {/* App Content */}
                    <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-950">
                        {/* App content rendered by App.tsx */}
                    </div>
                    
                    {/* Home Gesture Bar */}
                    <div className="h-6 flex justify-center items-center bg-white dark:bg-gray-900 flex-shrink-0 cursor-pointer pb-1" onClick={onCloseApp}>
                        <div className="w-32 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    </div>
                </div>
            )}

            {/* Home Screen Layout */}
            {!activeApp && (
                <div className="absolute inset-0 pt-16 pb-28 px-6 overflow-y-auto z-10 scrollbar-hide flex flex-col">
                    
                    {/* Widgets Section (Only on first page) */}
                    {page === 0 && !searchTerm && (
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                             <MobileWidgetSmall 
                                title="Calendar" 
                                color="bg-white/10"
                                content={<div className="text-3xl font-thin">{currentTime.getDate()} <span className="text-sm font-normal uppercase">{currentTime.toLocaleDateString([], { weekday: 'short' })}</span></div>} 
                             />
                             <MobileWidgetSmall 
                                title="Weather" 
                                color="bg-gradient-to-br from-blue-500/30 to-cyan-500/30"
                                content={<div><div className="text-3xl">72°</div><div className="text-xs opacity-80">Sunny</div></div>} 
                             />
                             <MobileWidgetLarge>
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"><BatteryIcon className="w-6 h-6 text-white"/></div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Batteries</div>
                                        <div className="text-xs text-green-400">98% Charged</div>
                                    </div>
                                 </div>
                             </MobileWidgetLarge>
                         </div>
                    )}

                    {/* App Grid */}
                    <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-8 place-items-center">
                        {currentApps.map((app, idx) => {
                             const Icon = (app as any).icon || HomeIcon;
                             // Assign random gradients for visual variety
                             const gradients = [
                                 'bg-gradient-to-br from-blue-400 to-blue-600',
                                 'bg-gradient-to-br from-purple-400 to-indigo-600',
                                 'bg-gradient-to-br from-green-400 to-emerald-600',
                                 'bg-gradient-to-br from-orange-400 to-red-500',
                                 'bg-gradient-to-br from-gray-600 to-gray-800',
                                 'bg-white/20 backdrop-blur-md'
                             ];
                             const bgClass = gradients[idx % gradients.length];

                             return (
                                <button 
                                    key={idx} 
                                    onClick={() => handleLaunch(app)}
                                    className="flex flex-col items-center gap-2 group active:scale-90 transition-transform duration-200 w-20"
                                >
                                    <SquircleIcon icon={Icon} className={bgClass} />
                                    <span className="text-[11px] font-medium text-white drop-shadow-md text-center line-clamp-1 w-full tracking-tight">
                                        {app.title}
                                    </span>
                                </button>
                             );
                        })}
                    </div>

                    {totalPages > 1 && !searchTerm && (
                        <PageIndicator total={totalPages} current={page} />
                    )}
                </div>
            )}

            {/* Dock (Glassmorphism) */}
            {!activeApp && (
                <div className="absolute bottom-4 left-4 right-4 mx-auto max-w-3xl h-24 bg-white/20 backdrop-blur-3xl rounded-[32px] border border-white/20 flex items-center justify-center gap-4 px-6 z-20 shadow-2xl">
                    {dockApps.map((app, idx) => {
                         const Icon = (app as any).icon || HomeIcon;
                         return (
                            <button 
                                key={`dock-${idx}`} 
                                onClick={() => handleLaunch(app)}
                                className="flex flex-col items-center hover:-translate-y-2 transition-transform duration-200 active:scale-90"
                            >
                                <SquircleIcon icon={Icon} className="bg-gradient-to-tr from-gray-800 to-black" />
                            </button>
                         );
                    })}
                    <div className="w-px h-10 bg-white/20 mx-2"></div>
                    <button className="flex flex-col items-center hover:-translate-y-2 transition-transform duration-200 active:scale-90">
                        <div className="w-16 h-16 bg-gray-500/40 backdrop-blur-md rounded-[18px] flex items-center justify-center border border-white/10">
                            <SearchIcon className="w-8 h-8 text-white" />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};
