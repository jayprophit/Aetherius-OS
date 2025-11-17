import React, { useState, useRef, useEffect } from 'react';
import { Bars3Icon, SearchIcon, BellIcon, UserCircleIcon, MessageIcon, ShoppingCartIcon, EllipsisHorizontalIcon, ChevronDownIcon, GyeNyameIcon } from './Icons';
import { MenuItemData } from '../types';
import { ICON_BUTTON_CLASSES } from '../constants';
import { LaunchableApp } from '../../App';
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
        onLaunchApp({ component: item.component, title: item.title, icon: item.icon });
    } else if (item.action) {
        alert(`Action: ${item.action}`); // Placeholder for actions
    }
    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10" title="Aetherius Menu">
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
      <button onClick={zoomOut} className={`${ICON_BUTTON_CLASSES} w-7 h-7 font-bold`} title="Zoom Out" disabled={zoom <= 0.25}>-</button>
      <span className="text-sm font-semibold w-14 text-center select-none">{(zoom * 100).toFixed(0)}%</span>
      <button onClick={zoomIn} className={`${ICON_BUTTON_CLASSES} w-7 h-7 font-bold`} title="Zoom In" disabled={zoom >= 5}>+</button>
    </div>
  );
};

export const TopBar: React.FC<{
  toggleLeftSidebar: () => void;
  onLaunchApp: (app: LaunchableApp) => void;
  contextualActions: MenuItemData[];
  aetheriusMenu: MenuItemData[];
  zoom: number;
  onZoom: (zoom: number) => void;
}> = ({ toggleLeftSidebar, onLaunchApp, contextualActions, aetheriusMenu, zoom, onZoom }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const actions = contextualActions.filter(a => a.type !== 'divider' && a.component);
  
  const handleLaunch = (app: LaunchableApp) => {
    onLaunchApp(app);
    setIsProfileOpen(false); // Close menu on action
  }

  const findApp = (component: string): LaunchableApp | undefined => {
    for (const item of mainMenuItems) {
        if (item.component === component && item.title && item.icon) {
            return { component: item.component, title: item.title, icon: item.icon };
        }
        if (item.children) {
             for (const child of item.children) {
                 if (child.component === component && child.title && child.icon) {
                     return { component: child.component, title: child.title, icon: child.icon };
                 }
             }
        }
    }
    const settingsApp = { component: 'settings', title: 'Settings', icon: mainMenuItems.find(i=>i.title === 'Settings')?.icon!};
    if(component === 'settings') return settingsApp;
    return undefined;
  }

  return (
    <>
      <header className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-b border-black/10 dark:border-white/10 h-16 flex-shrink-0 flex items-center justify-between px-4 z-20 relative">
        {/* Left section */}
        <div className="flex items-center space-x-3">
          <button onClick={toggleLeftSidebar} className={ICON_BUTTON_CLASSES} title="Toggle Menu">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <AetheriusMenu items={aetheriusMenu} onLaunchApp={onLaunchApp} />
          <h1 className="font-semibold text-lg text-content-light dark:text-content-dark hidden sm:block">Aetherius OS</h1>
        </div>

        {/* Center section - Contextual Navigation */}
        <div className="flex-1 flex justify-center items-center px-4 space-x-1 sm:space-x-2 hidden md:flex">
           {actions.map(action => {
             if (!action.component || !action.title || !action.icon) return null;
             const Icon = action.icon;
             return (
               <button key={action.title} onClick={() => handleLaunch({ component: action.component!, title: action.title!, icon: action.icon! })} className={ICON_BUTTON_CLASSES} title={action.title}>
                <Icon className="w-6 h-6" />
             </button>
             );
           })}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          <ZoomControls zoom={zoom} onZoom={onZoom} />
          <div className="relative hidden sm:block">
              <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search..." className="bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-full h-9 pl-10 pr-4 w-48 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-content-light dark:text-content-dark" />
          </div>
           <button onClick={() => handleLaunch(findApp('messenger')!)} className={`${ICON_BUTTON_CLASSES} relative`} title="Messages">
              <MessageIcon className="w-6 h-6" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
          </button>
          <div className="relative">
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`${ICON_BUTTON_CLASSES} relative`} title="Notifications">
              <BellIcon className="w-6 h-6" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50">
                <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
              </div>
            )}
          </div>
           <button className={ICON_BUTTON_CLASSES} title="Cart">
              <ShoppingCartIcon className="w-6 h-6" />
          </button>
          <div className="relative">
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10" title="Profile">
               <UserCircleIcon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
               <span className="text-sm font-semibold hidden lg:block text-content-light dark:text-content-dark">John</span>
               <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden lg:block" />
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <button onClick={() => handleLaunch(findApp('myProfile')!)} className="w-full text-left block px-4 py-2 text-sm text-content-light dark:text-content-dark hover:bg-primary/20">Your Profile</button>
                <button onClick={() => handleLaunch(findApp('settings')!)} className="w-full text-left block px-4 py-2 text-sm text-content-light dark:text-content-dark hover:bg-primary/20">Settings</button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <a href="#" className="block px-4 py-2 text-sm text-content-light dark:text-content-dark hover:bg-primary/20">Sign out</a>
              </div>
            )}
          </div>
          <button onClick={() => handleLaunch(findApp('aiHub')!)} className={ICON_BUTTON_CLASSES} title="AI Hub">
            <EllipsisHorizontalIcon className="w-6 h-6" />
          </button>
        </div>
      </header>
    </>
  );
};