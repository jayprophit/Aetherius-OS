
import React, { useState, useRef } from 'react';
import { ChevronRightIcon, PlusCircleIcon } from './Icons';
import { MenuItemData, MenuGroup, LaunchableApp } from '../types';

const RecursiveMenuItem: React.FC<{
  item: MenuItemData;
  onLaunchApp: (app: LaunchableApp) => void;
  level: number;
}> = ({ item, onLaunchApp, level }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (item.type === 'divider') {
    return <div className="my-2 border-t border-black/10 dark:border-white/10 mx-3" />;
  }
  if (item.type === 'title') {
    return <h3 className="px-3 pt-4 pb-1 text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">{item.title}</h3>;
  }
  if (!item.title || !item.icon) return null;

  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else if (item.component) {
      onLaunchApp({ component: item.component, title: item.title!, icon: item.icon!, context: { menuItem: item } });
    }
  };
  
  return (
    <div>
      <button 
        onClick={handleClick}
        className={`w-full flex items-center p-2 text-content-light/80 dark:text-content-dark/80 hover:text-content-light dark:hover:text-content-dark hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors`}
        style={{ paddingLeft: `${0.5 + level * 1}rem`}}
        title={item.title}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className={`font-medium text-left ml-3`}>{item.title}</span>
        {hasChildren && <ChevronRightIcon className={`w-4 h-4 transition-transform flex-shrink-0 ml-auto ${isOpen ? 'rotate-90' : ''}`} />}
      </button>
      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {item.children.map((child, index) => (
            <RecursiveMenuItem key={child.title || index} item={child} onLaunchApp={onLaunchApp} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const CollapsedMenuGroup: React.FC<{
    group: MenuGroup;
    onLaunchApp: (app: LaunchableApp) => void;
}> = ({ group, onLaunchApp }) => {
    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
    const timerRef = useRef<number | null>(null);
    const Icon = group.icon;
    
    const handleMouseEnter = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsFlyoutOpen(true);
    };

    const handleMouseLeave = () => {
        timerRef.current = window.setTimeout(() => {
            setIsFlyoutOpen(false);
        }, 200);
    };

    const handleLaunch = (item: MenuItemData) => {
        if (item.component && item.title && item.icon) {
            onLaunchApp({ component: item.component, title: item.title, icon: item.icon, context: { menuItem: item } });
        }
    };

    return (
        <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
                className="w-full flex items-center justify-center p-3 text-content-light dark:text-content-dark rounded-md hover:bg-black/5 dark:hover:bg-white/5"
                title={group.title}
            >
                <Icon className="w-6 h-6 flex-shrink-0 text-primary" />
            </button>
            {isFlyoutOpen && (
                <div className="absolute left-full top-0 ml-2 w-56 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-md shadow-lg border border-black/10 dark:border-white/10 p-2 z-50">
                    <h4 className="font-bold px-2 pb-2 text-sm">{group.title}</h4>
                    <div className="space-y-1">
                        {group.children.map((child, index) => {
                            if (!child.title || !child.icon || !child.component) return null;
                            const ChildIcon = child.icon;
                            return (
                                <button
                                    key={child.title || index}
                                    onClick={() => handleLaunch(child)}
                                    className="w-full flex items-center gap-3 p-2 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                                >
                                    <ChildIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>{child.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

interface LeftSidebarProps {
  isOpen: boolean;
  onLaunchApp: (app: LaunchableApp) => void;
  menuGroups: (MenuGroup | MenuItemData)[];
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ isOpen, onLaunchApp, menuGroups }) => {
  return (
    <aside className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-r border-black/10 dark:border-white/10 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 flex flex-col">
        {isOpen ? (
            // Expanded View
            <nav className="space-y-1">
              {menuGroups.map((item) => {
                  if (item.type === 'group') {
                      return (
                          <div key={item.id} className="mt-2">
                              <h3 className="px-3 pt-4 pb-1 text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">{item.title}</h3>
                              {item.children.map((child, index) => (
                                  <RecursiveMenuItem key={child.title || index} item={child} onLaunchApp={onLaunchApp} level={0} />
                              ))}
                          </div>
                      );
                  }
                  if (item.type === 'divider') {
                      return <div key={`divider-${Math.random()}`} className="my-2 border-t border-black/10 dark:border-white/10 mx-3" />;
                  }
                  return null;
              })}
            </nav>
        ) : (
            // Collapsed View
             <nav className="space-y-1">
                {menuGroups.map((item) => {
                  if (item.type === 'group') {
                      return <CollapsedMenuGroup key={item.id} group={item} onLaunchApp={onLaunchApp} />;
                  }
                   if (item.type === 'divider') {
                      return <div key={`divider-${Math.random()}`} className="h-px w-8 mx-auto my-2 bg-black/10 dark:bg-white/10" />;
                  }
                  return null;
              })}
            </nav>
        )}
        <div className="flex-grow" />
        <div className="p-2">
            <button onClick={() => alert('Add custom item flow.')} className={`w-full flex items-center p-3 text-content-light/80 dark:text-content-dark/80 hover:text-content-light dark:hover:text-content-dark hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors ${isOpen ? '' : 'justify-center'}`} title="Add Custom Item">
                <PlusCircleIcon className="w-6 h-6 flex-shrink-0" />
                {isOpen && <span className="font-medium text-left ml-4">Add Custom</span>}
            </button>
        </div>
      </div>
    </aside>
  );
};
