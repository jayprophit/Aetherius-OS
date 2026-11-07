
import React, { useState, useRef, useEffect } from 'react';
import { Bars3Icon, BellIcon, MessageIcon, ShoppingCartIcon, EllipsisHorizontalIcon, GyeNyameIcon, SunIcon, MoonIcon, ComputerDesktopIcon, DevicePhoneMobileIcon, MapPinIcon } from './Icons';
import { MenuItemData, ViewMode, SystemLocale } from '../types';
import { ICON_BUTTON_CLASSES } from '../constants';
import { LaunchableApp } from '../App';
import { mainMenuItems } from '../data';

const AetheriusMenu: React.FC<{
  items: MenuItemData[];
  onLaunchApp: (app: LaunchableApp) => void;
}> = ({ items, onLaunchApp }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleItemClick = (item: MenuItemData) => {
    if (item.component && item.icon && item.title) {
        onLaunchApp({ component: item.component, title: item.title, icon: item.icon, context: { menuItem: item } });
    } else if (item.action) {
        alert(`Action: ${item.action}`); 
    }
    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10" title="Main System Menu">
        <GyeNyameIcon className="w-7 h-7 text-content-light dark:text-content-dark" />
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {items.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={`divider-${index}`} className="my-1 h-px bg-gray-200 dark:bg-gray-700" />;
            }
            const Icon = item.icon;
            return (
              <button 
                key={item.title} 
                onClick={() => handleItemClick(item)}
                className="w-full text-left flex items-center gap-3 px-3 py-1.5 text-sm text-content-light dark:text-content-dark hover:bg-primary/20"
                title={`Launch ${item.title}`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ZoomControls: React.FC<{ zoom: number; onZoom: (zoom: number) => void }> = ({ zoom, onZoom }) => {
  const zoomIn = () => onZoom(zoom + 0.25);
  const zoomOut = () => onZoom(zoom - 0.25);
  
  return (
    <div className="flex items-center gap-1 bg-black/5 dark:bg-black/20 p-1 rounded-full">
      <button onClick={zoomOut} className={`${ICON_BUTTON_CLASSES} w-7 h-7 font-bold`} title="Zoom Out Interface" disabled={zoom <= 0.25}>-</button>
      <span className="text-sm font-semibold w-14 text-center select-none" title="Current Zoom Level">{(zoom * 100).toFixed(0)}%</span>
      <button onClick={zoomIn} className={`${ICON_BUTTON_CLASSES} w-7 h-7 font-bold`} title="Zoom In Interface" disabled={zoom >= 5}>+</button>
    </div>
  );
};

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
      // Sync state with initial load
      if (document.documentElement.classList.contains('dark')) {
          setIsDark(true);
      }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={ICON_BUTTON_CLASSES}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
    </button>
  );
};

export const TopBar: React.FC<{
  toggleLeftSidebar: () => void;
  onLaunchApp: (app: LaunchableApp) => void;
  contextualActions: MenuItemData[];
  aetheriusMenu: MenuItemData[];
  zoom: number;
  onZoom: (zoom: number) => void;
  onOpenCart?: () => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  onToggleNotifications: () => void;
  systemLocale?: SystemLocale;
}> = ({ 
    toggleLeftSidebar, onLaunchApp, contextualActions, aetheriusMenu, 
    zoom, onZoom, onOpenCart, viewMode, onToggleViewMode, onToggleNotifications, systemLocale
}) => {
  const [currentTime, setCurrentTime] = useState('');
  
  useEffect(() => {
      const timer = setInterval(() => {
          if (systemLocale) {
              setCurrentTime(new Date().toLocaleTimeString(systemLocale.locale, { 
                  timeZone: systemLocale.timezone,
                  hour: '2-digit',
                  minute: '2-digit'
              }));
          }
      }, 1000);
      return () => clearInterval(timer);
  }, [systemLocale]);

  const actions = contextualActions.filter(a => a.type !== 'divider' && a.component);
  
  const handleLaunch = (app?: LaunchableApp | null) => {
    if (!app) return;
    onLaunchApp(app);
  }

  const findApp = (component: string): LaunchableApp | undefined => {
    for (const group of mainMenuItems) {
        if (group.children) {
             for (const child of group.children) {
                 if (child.component === component && child.title && child.icon) {
                     return { component: child.component, title: child.title, icon: child.icon, context: { menuItem: child } };
                 }
             }
        }
    }
    return undefined;
  }

  return (
    <>
      <header className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-b border-black/10 dark:border-white/10 h-16 flex-shrink-0 flex items-center justify-between px-4 z-20 relative transition-colors duration-300">
        {/* Left section */}
        <div className="flex items-center space-x-3">
          <button onClick={toggleLeftSidebar} className={ICON_BUTTON_CLASSES} title="Toggle Side Navigation Menu">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <AetheriusMenu items={aetheriusMenu} onLaunchApp={onLaunchApp} />
          <h1 className="font-semibold text-lg text-content-light dark:text-content-dark hidden sm:block select-none" title="Aetherius Operating System">Aetherius OS</h1>
        </div>

        {/* Center section - Contextual Navigation */}
        <div className="flex-1 flex justify-center items-center px-4 space-x-1 sm:space-x-2 hidden md:flex">
           {actions.map(action => {
             if (!action.component || !action.title || !action.icon) return null;
             const Icon = action.icon;
             return (
               <button key={action.title} onClick={() => handleLaunch({ component: action.component!, title: action.title!, icon: action.icon!, context: { menuItem: action } })} className={ICON_BUTTON_CLASSES} title={`Quick Launch ${action.title}`}>
                <Icon className="w-6 h-6" />
             </button>
             );
           })}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          
          {/* Locale Info */}
          {systemLocale && (
            <div className="hidden lg:flex flex-col items-end text-[10px] text-gray-500 dark:text-gray-400 mr-2 font-mono leading-tight">
                <span className="font-bold text-gray-800 dark:text-gray-200">{currentTime}</span>
                <div className="flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3" />
                    <span>{systemLocale.location?.city || systemLocale.timezone}</span>
                </div>
            </div>
          )}

          {/* View Mode Toggle */}
          <button 
            onClick={onToggleViewMode}
            className={`${ICON_BUTTON_CLASSES} bg-gray-200 dark:bg-gray-700`}
            title={viewMode === 'desktop' ? "Switch to Mobile/Simple View" : "Switch to Advanced Desktop View"}
          >
            {viewMode === 'desktop' ? <DevicePhoneMobileIcon className="w-5 h-5" /> : <ComputerDesktopIcon className="w-5 h-5" />}
          </button>

          <ZoomControls zoom={zoom} onZoom={onZoom} />
          <ThemeToggle />

          {findApp('messenger') && (
            <button onClick={() => handleLaunch(findApp('messenger'))} className={`${ICON_BUTTON_CLASSES} relative`} title="Open Messenger">
              <MessageIcon className="w-6 h-6" />
            </button>
          )}

          <button onClick={onToggleNotifications} className={`${ICON_BUTTON_CLASSES} relative`} title="Show Notifications">
            <BellIcon className="w-6 h-6" />
          </button>

          {onOpenCart && (
            <button onClick={onOpenCart} className={ICON_BUTTON_CLASSES} title="Open Shopping Cart">
              <ShoppingCartIcon className="w-6 h-6" />
            </button>
          )}

          {findApp('aiHub') && (
            <button onClick={() => handleLaunch(findApp('aiHub'))} className={ICON_BUTTON_CLASSES} title="Launch AI Hub">
              <EllipsisHorizontalIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>
    </>
  );
};