
import React, { useState, useMemo, useEffect } from 'react';
import { WindowState, TaskbarConfig, MenuItemData, SystemLocale } from '../types';
import { 
    Squares2X2Icon, WifiIcon, BatteryIcon, SpeakerWaveIcon, 
    ChevronDownIcon, BellIcon, CalendarIcon, GyeNyameIcon,
    SearchIcon
} from './Icons';
import { LaunchableApp } from '../App';
import { StartMenu } from './StartMenu';
import { desktopItems, mainMenuItems } from '../data';

interface TaskbarProps {
  windows: WindowState[];
  pinnedAppIds: string[];
  onFocus: (id: string) => void;
  activeWindowId: string | null;
  activeWorkspace: number;
  onSwitchWorkspace: (workspace: number) => void;
  config: TaskbarConfig;
  onLaunchApp: (app: LaunchableApp) => void;
  onTogglePin: (appId: string) => void;
  systemLocale?: SystemLocale;
}

export const Taskbar: React.FC<TaskbarProps> = ({ 
    windows, pinnedAppIds, onFocus, activeWindowId, activeWorkspace, onSwitchWorkspace, config, onLaunchApp, onTogglePin, systemLocale
}) => {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [volume, setVolume] = useState(80);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
      const timer = setInterval(() => {
          if (systemLocale) {
             setCurrentTime(new Date().toLocaleTimeString(systemLocale.locale, { 
                 timeZone: systemLocale.timezone, 
                 hour: '2-digit', 
                 minute: '2-digit' 
             }));
             setCurrentDate(new Date().toLocaleDateString(systemLocale.locale, { 
                 timeZone: systemLocale.timezone 
             }));
          } else {
              setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              setCurrentDate(new Date().toLocaleDateString());
          }
      }, 1000);
      return () => clearInterval(timer);
  }, [systemLocale]);

  // Dynamic Styles based on position
  const isVertical = config.position === 'left' || config.position === 'right';
  
  const containerClasses = `
    w-full h-full flex bg-gray-200/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-300/50 dark:border-gray-700/50 shadow-lg transition-all duration-300
    ${config.position === 'bottom' ? 'flex-row border-t' : ''}
    ${config.position === 'top' ? 'flex-row border-b' : ''}
    ${config.position === 'left' ? 'flex-col border-r' : ''}
    ${config.position === 'right' ? 'flex-col border-l' : ''}
  `;

  const appListClasses = `
    flex items-center gap-1 p-1 flex-1
    ${isVertical ? 'flex-col w-full overflow-y-auto overflow-x-hidden py-2' : 'flex-row h-full px-2 justify-start'}
    ${config.alignment === 'center' && !isVertical ? 'justify-center' : ''}
  `;

  const trayClasses = `
    flex items-center gap-3 px-3
    ${isVertical ? 'flex-col py-4 border-t border-gray-300/30 dark:border-gray-700/30' : 'flex-row h-full border-l border-gray-300/30 dark:border-gray-700/30'}
  `;

  // --- Combined App Logic ---
  const allAppDefinitions = useMemo(() => {
      const apps = new Map<string, any>();
      // Desktop items
      desktopItems.forEach(item => {
          if (item.type === 'app') apps.set(item.component, item);
      });
      // Menu items
      mainMenuItems.forEach(group => {
          if(group.children) {
              group.children.forEach(child => {
                  if (child.component) apps.set(child.component, child);
              });
          }
      });
      return apps;
  }, []);

  const taskbarItems = useMemo(() => {
      const items: { id: string, component: string, icon: React.FC<any>, title: string, isPinned: boolean, isOpen: boolean, windowId?: string }[] = [];
      
      // Add Pinned Apps
      pinnedAppIds.forEach(appId => {
          const appDef = allAppDefinitions.get(appId);
          // Find if it's open
          const openWindow = windows.find(w => w.component === appId);
          
          if (appDef) {
              items.push({
                  id: appId,
                  component: appId,
                  icon: appDef.icon,
                  title: appDef.title || 'App',
                  isPinned: true,
                  isOpen: !!openWindow,
                  windowId: openWindow?.id
              });
          }
      });

      // Add Running Apps that aren't pinned
      windows.forEach(win => {
          if (!pinnedAppIds.includes(win.component)) {
              const existingItemIndex = items.findIndex(i => i.component === win.component);
              if (existingItemIndex === -1) {
                  items.push({
                      id: win.component,
                      component: win.component,
                      icon: win.icon,
                      title: win.title,
                      isPinned: false,
                      isOpen: true,
                      windowId: win.id
                  });
              }
          }
      });

      return items;
  }, [pinnedAppIds, windows, allAppDefinitions]);

  const handleItemClick = (item: typeof taskbarItems[0]) => {
      if (item.isOpen && item.windowId) {
          // If open, toggle focus/minimize
          onFocus(item.windowId);
      } else {
          // Launch
          onLaunchApp({
              component: item.component,
              title: item.title,
              icon: item.icon
          });
      }
  };
  
  const handleContextMenu = (e: React.MouseEvent, item: typeof taskbarItems[0]) => {
      e.preventDefault();
      onTogglePin(item.component);
  };

  return (
    <>
        {startMenuOpen && (
            <StartMenu 
                onLaunchApp={onLaunchApp} 
                onClose={() => setStartMenuOpen(false)} 
                config={config}
            />
        )}

        <footer className={containerClasses}>
            
            {/* Start Button */}
            <div className={`flex items-center justify-center p-1 ${isVertical ? 'w-full h-16 border-b border-gray-300/30 dark:border-gray-700/30' : 'h-full px-2'}`}>
                <button 
                    onClick={() => setStartMenuOpen(!startMenuOpen)}
                    className={`p-2 rounded-md transition-all duration-200 group relative ${startMenuOpen ? 'bg-white/20 dark:bg-white/10' : 'hover:bg-white/20 dark:hover:bg-white/10'}`}
                    title="Start"
                >
                    <GyeNyameIcon className="w-7 h-7 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                </button>
            </div>
            
            {/* Search Bar (Horizontal Only) */}
            {!isVertical && (
                <div className="h-full flex items-center px-2">
                     <div className="relative group">
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-full pl-8 pr-3 py-1 text-sm w-32 focus:w-64 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setStartMenuOpen(true)} // Auto-open start menu on focus
                        />
                     </div>
                </div>
            )}

            {/* App List */}
            <div className={appListClasses}>
                {taskbarItems.map(item => {
                    const Icon = item.icon;
                    // Check if this item corresponds to the active window
                    const isActive = windows.find(w => w.id === activeWindowId)?.component === item.component;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            onContextMenu={(e) => handleContextMenu(e, item)}
                            className={`relative flex items-center justify-center p-2 rounded-md transition-all duration-200 group ${isActive ? 'bg-white/40 dark:bg-white/10 shadow-sm' : 'hover:bg-white/20 dark:hover:bg-white/5'}`}
                            title={`${item.title} ${item.isPinned ? '(Pinned)' : ''}`}
                        >
                            <Icon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                            
                            {/* Running Indicator */}
                            <div className={`absolute rounded-full transition-all duration-300 ${isVertical ? 'left-0.5 top-1/2 -translate-y-1/2 w-1 h-4' : 'bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1'} ${item.isOpen ? (isActive ? 'bg-blue-500' : 'bg-gray-400') : 'opacity-0'}`}></div>
                        </button>
                    );
                })}
            </div>

            {/* System Tray */}
            <div className={trayClasses}>
                {!isVertical && (
                    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 cursor-pointer group relative" title="System Status">
                        <ChevronDownIcon className="w-3 h-3 text-gray-500 group-hover:rotate-180 transition-transform" />
                    </div>
                )}

                <div className={`flex items-center gap-3 ${isVertical ? 'flex-col gap-4' : 'flex-row'}`}>
                    <button className="text-gray-600 dark:text-gray-300 hover:text-blue-500 relative" title={`Volume: ${volume}%`}>
                        <SpeakerWaveIcon className="w-4 h-4" />
                    </button>
                    
                    <div className="text-gray-600 dark:text-gray-300" title="Network: Connected">
                        <WifiIcon className="w-4 h-4" />
                    </div>
                    
                    <div className="text-gray-600 dark:text-gray-300 relative" title="Battery: 85%">
                        <BatteryIcon className="w-5 h-5" />
                        <div className="absolute top-1.5 left-0.5 h-2 bg-green-500 rounded-[1px]" style={{width: '70%'}}></div>
                    </div>
                </div>

                {/* Clock */}
                <div className={`flex flex-col items-center justify-center text-xs text-gray-700 dark:text-gray-200 cursor-default px-2 py-1 rounded hover:bg-white/10 ${isVertical ? 'mt-2 text-[10px]' : 'ml-2'}`}>
                    <span className="font-bold">{currentTime}</span>
                    {!isVertical && <span>{currentDate}</span>}
                </div>

                <button className="text-gray-600 dark:text-gray-300 hover:text-blue-500 ml-1" title="Notifications">
                    <BellIcon className="w-4 h-4" />
                </button>
            </div>
        </footer>
    </>
  );
};
