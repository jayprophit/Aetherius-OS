
import React, { useState, useMemo } from 'react';
import { ChevronRightIcon, SearchIcon, PlusIcon, FolderIcon } from './Icons';
import { MenuItemData, MenuGroup } from '../types';
import { LaunchableApp } from '../App';

// --- Recursive Menu Item ---

interface RecursiveMenuItemProps {
  item: MenuItemData;
  onLaunchApp: (app: LaunchableApp) => void;
  level: number;
  activeSearch: boolean; // If search is active, force expand
}

const RecursiveMenuItem: React.FC<RecursiveMenuItemProps> = ({ item, onLaunchApp, level, activeSearch }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (item.type === 'divider') {
    return <div className="my-2 border-t border-black/10 dark:border-white/10 mx-3" role="separator" />;
  }
  if (item.type === 'title') {
    return (
        <h3 className="px-3 pt-4 pb-1 text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider" aria-label={item.title}>
            {item.title}
        </h3>
    );
  }
  if (!item.title) return null;
  const Icon = item.icon || FolderIcon; // Fallback icon

  const hasChildren = item.children && item.children.length > 0;
  
  // If search is active, we want to show matching items. 
  const showChildren = activeSearch || isOpen;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      // Launch app or placeholder if component is missing
      onLaunchApp({ 
          component: item.component || 'placeholder', 
          title: item.title || 'Unknown App', 
          icon: Icon, 
          context: { menuItem: item } 
      });
    }
  };
  
  return (
    <div role="treeitem" aria-expanded={hasChildren ? showChildren : undefined}>
      <button 
        onClick={handleClick}
        className={`w-full flex items-center p-2 text-content-light/80 dark:text-content-dark/80 
                    hover:text-content-light dark:hover:text-content-dark 
                    hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all duration-200 group relative
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-95`}
        style={{ paddingLeft: `${0.5 + level * 0.8}rem`}}
        title={item.title}
        aria-label={hasChildren ? `Expand ${item.title}` : `Launch ${item.title}`}
      >
        {/* Selection Indicator Animation */}
        <div className="absolute left-0 h-full w-1 bg-blue-500 rounded-r-full opacity-0 transition-opacity duration-200 group-active:opacity-100" />
        
        <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
        <span className="font-medium text-left ml-3 text-sm truncate flex-1">{item.title}</span>
        
        {hasChildren && (
            <ChevronRightIcon 
                className={`w-3 h-3 ml-auto opacity-50 transition-transform duration-200 ${showChildren ? 'rotate-90' : ''}`} 
                aria-hidden="true"
            />
        )}
      </button>
      
      {hasChildren && showChildren && (
        <div className="mt-1 space-y-1 animate-slide-down origin-top">
          {item.children!.map((child, index) => (
            <RecursiveMenuItem 
                key={child.title || index} 
                item={child} 
                onLaunchApp={onLaunchApp} 
                level={level + 1} 
                activeSearch={activeSearch}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Collapsed Mode ---

const CollapsedMenuGroup: React.FC<{
    group: MenuGroup;
    onLaunchApp: (app: LaunchableApp) => void;
}> = ({ group, onLaunchApp }) => {
    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
    const Icon = group.icon;

    const handleLaunch = (item: MenuItemData) => {
        const icon = item.icon || FolderIcon;
        onLaunchApp({ 
            component: item.component || 'placeholder', 
            title: item.title || 'App', 
            icon: icon, 
            context: { menuItem: item } 
        });
        setIsFlyoutOpen(false);
    };

    return (
        <div 
            className="relative group/sidebar-item" 
            onMouseEnter={() => setIsFlyoutOpen(true)} 
            onMouseLeave={() => setIsFlyoutOpen(false)}
        >
            <button
                className="w-full flex items-center justify-center p-3 text-content-light dark:text-content-dark rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:scale-90"
                title={group.title}
                aria-haspopup="true"
                aria-expanded={isFlyoutOpen}
                aria-label={`Open ${group.title} menu group`}
            >
                <Icon className="w-6 h-6 flex-shrink-0 text-gray-500 group-hover/sidebar-item:text-blue-500 transition-colors" />
            </button>
            
            {/* Flyout Menu */}
            {isFlyoutOpen && (
                <div className="absolute left-full top-0 ml-2 w-56 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-lg shadow-xl border border-black/10 dark:border-white/10 p-2 z-50 animate-fade-in-left">
                    <h4 className="font-bold px-2 pb-2 text-xs uppercase text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-1">{group.title}</h4>
                    <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-hide">
                        {group.children.map((child, index) => {
                            if (!child.title) return null;
                            const ChildIcon = child.icon || FolderIcon;
                            return (
                                <button
                                    key={child.title || index}
                                    onClick={() => handleLaunch(child)}
                                    className="w-full flex items-center gap-3 p-2 text-sm rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 transition-colors active:scale-95"
                                >
                                    <ChildIcon className="w-4 h-4 flex-shrink-0 opacity-70" />
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

// --- Main Sidebar Component ---

interface LeftSidebarProps {
  isOpen: boolean;
  onLaunchApp: (app: LaunchableApp) => void;
  menuGroups: (MenuGroup | MenuItemData)[];
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ isOpen, onLaunchApp, menuGroups }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logic: Returns true if item or any descendant matches
  const filterItem = (item: MenuItemData | MenuGroup): boolean => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    
    // Check title match
    if (item.title && item.title.toLowerCase().includes(lowerQuery)) return true;
    
    // Check children match (recursive)
    if (item.children) {
        return item.children.some(child => filterItem(child));
    }
    
    return false;
  };

  const filteredGroups = useMemo(() => {
      return menuGroups
        .map(group => {
            // If search query is empty, return group as is
            if (!searchQuery) return group;
            
            // Clone grouping structure if it matches search
            const groupMatch = filterItem(group);
            if (!groupMatch) return null;

            // Filter children for display
            const filteredChildren = group.children?.filter(child => filterItem(child));
            
            // Return new object to avoid mutation
            return { ...group, children: filteredChildren };
        })
        .filter(Boolean) as (MenuGroup | MenuItemData)[];
  }, [menuGroups, searchQuery]);

  return (
    <aside 
        className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-r border-black/10 dark:border-white/10 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-16'}`}
        aria-label="Main Navigation Sidebar"
    >
      {/* Search Bar (Only visible when open) */}
      {isOpen && (
          <div className="p-3 pb-0 animate-fade-in">
              <div className="relative group">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search apps..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 border-transparent focus:border-blue-500 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    aria-label="Filter menu items"
                  />
              </div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 flex flex-col scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
        {isOpen ? (
            // Expanded Recursive View
            <nav className="space-y-4 mt-2" role="tree">
              {filteredGroups.map((item, idx) => {
                  if (item.type === 'group') {
                      const groupItem = item as MenuGroup;
                      return (
                          <div key={groupItem.id || idx} role="group" className="animate-fade-in">
                              <div className="px-3 pt-2 pb-1 flex items-center justify-between text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider select-none">
                                  <span>{groupItem.title}</span>
                              </div>
                              {groupItem.children?.map((child, cIdx) => (
                                  <RecursiveMenuItem 
                                    key={child.title || cIdx} 
                                    item={child} 
                                    onLaunchApp={onLaunchApp} 
                                    level={0} 
                                    activeSearch={!!searchQuery}
                                  />
                              ))}
                          </div>
                      );
                  }
                  if (item.type === 'divider') {
                      return <div key={`divider-${idx}`} className="my-2 border-t border-black/10 dark:border-white/10 mx-3" role="separator" />;
                  }
                  return (
                      <RecursiveMenuItem 
                        key={item.title || idx} 
                        item={item} 
                        onLaunchApp={onLaunchApp} 
                        level={0}
                        activeSearch={!!searchQuery}
                      />
                  );
              })}
              
              {filteredGroups.length === 0 && searchQuery && (
                  <div className="text-center text-gray-500 text-sm py-8 flex flex-col items-center animate-fade-in">
                      <SearchIcon className="w-8 h-8 mb-2 opacity-20" />
                      <p>No apps found.</p>
                  </div>
              )}
            </nav>
        ) : (
            // Collapsed Icon View
             <nav className="space-y-2 mt-2 flex flex-col items-center">
                {menuGroups.map((item, idx) => {
                  if (item.type === 'group') {
                      return <CollapsedMenuGroup key={(item as MenuGroup).id || idx} group={item as MenuGroup} onLaunchApp={onLaunchApp} />;
                  }
                  if (item.type === 'divider') {
                      return <div key={`divider-${idx}`} className="h-px w-8 mx-auto my-2 bg-black/10 dark:bg-white/10" />;
                  }
                  return null;
              })}
            </nav>
        )}
        
        <div className="flex-grow" />
        
        {/* Custom Action */}
        {isOpen && (
            <div className="p-2 mt-2 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
                <button 
                    onClick={() => alert('Opening Custom Workspace Builder...')} 
                    className="w-full flex items-center justify-center gap-2 p-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all border border-dashed border-blue-300 dark:border-blue-700 active:scale-95"
                    aria-label="Add Workspace"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Workspace</span>
                </button>
            </div>
        )}
      </div>
    </aside>
  );
};
