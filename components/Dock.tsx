import React, { useState, useMemo } from 'react';
import { 
    HomeIcon, GlobeIcon, CameraIcon, VideoIcon, ChevronRightIcon, UserIcon, MessageIcon,
    UsersIcon, AcademicCapIcon, ShoppingCartIcon, CalendarIcon, DocumentTextIcon,
    Cog6ToothIcon, BriefcaseIcon, BuildingStorefrontIcon, ChartBarIcon, HiveMindIcon,
    ChatBubbleOvalLeftEllipsisIcon, UserCircleIcon, BellIcon, CubeTransparentIcon,
    FolderIcon, PlusCircleIcon, SearchIcon, PencilIcon, PuzzlePieceIcon, EmojiIcon,
    StarIcon, ImageIcon, GitHubIcon, GameControllerIcon, ComputerDesktopIcon, WalletIcon,
    CircleStackIcon, LockClosedIcon, ClockIcon, MicrophoneIcon, HeartIcon,
    ArrowUpCircleIcon, FingerPrintIcon, QuestionMarkCircleIcon, XMarkIcon, BeakerIcon,
    CodeBracketIcon
} from './Icons';
import { MenuItemData } from '../types';
import { mainMenuItems, bottomMenuItems } from '../data';
import { LaunchableApp } from '../../App';


const MenuItem: React.FC<{
  item: MenuItemData;
  isOpen: boolean;
  onLaunchApp: (app: LaunchableApp) => void;
  level?: number;
}> = ({ item, isOpen, onLaunchApp, level = 0 }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  
  if (item.type === 'divider') {
    // Render divider only when sidebar is open
    return isOpen ? <div className={`my-2 border-t border-black/10 dark:border-white/10 mx-3`}></div> : null;
  }
  
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    // If the item itself is an app container, launch it.
    if (item.component && item.title && item.icon) {
      onLaunchApp({ component: item.component, title: item.title, icon: item.icon, context: { menuItem: item } });
    } else if (hasChildren && !isOpen) {
      // If sidebar is closed and item has children but isn't an app itself,
      // it should ideally open the main container view for that section.
      // The current logic launches the first child, which can be confusing.
      // A better approach would be to have a default component for each parent,
      // which is already handled by `component: 'socialApp'`, etc.
      // This part of the logic might be redundant if parents are well-defined.
    }
  
    if (hasChildren && isOpen) {
      setIsSubMenuOpen(!isSubMenuOpen);
    }
  };
  
  const Icon = item.icon;

  return (
    <div className="text-sm">
      <button 
        onClick={handleClick}
        className={`w-full flex items-center p-3 text-content-light/80 dark:text-content-dark/80 hover:text-content-light dark:hover:text-content-dark hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors ${isOpen ? '' : 'justify-center'}`}
        style={isOpen ? { paddingLeft: `${0.75 + level * 0.75}rem`} : {}}
        title={item.title || ''}
      >
        {Icon && <Icon className="w-6 h-6 flex-shrink-0" />}
        {isOpen && <span className={`font-medium text-left ${Icon ? 'ml-4' : ''}`}>{item.title}</span>}
        
        {isOpen && hasChildren && (
          <ChevronRightIcon className={`w-4 h-4 transition-transform flex-shrink-0 ml-auto ${isSubMenuOpen ? 'rotate-90' : ''}`} />
        )}
      </button>
      {isOpen && isSubMenuOpen && hasChildren && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child, index) => (
            <MenuItem key={child.title || index} item={child} isOpen={isOpen} onLaunchApp={onLaunchApp} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

interface LeftSidebarProps {
  isOpen: boolean;
  onLaunchApp: (app: LaunchableApp) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ isOpen, onLaunchApp }) => {

  const renderMenuItems = (items: MenuItemData[]) => {
      return items.map((item, index) => {
          if (item.type === 'divider') {
              // In collapsed view, render a visual divider
              return !isOpen ? <div key={`divider-${index}`} className="h-px w-8 mx-auto my-2 bg-black/10 dark:bg-white/10" /> : null;
          }
          if (item.type === 'title') {
              // In expanded view, render a title
              return isOpen ? <h3 key={item.title} className="px-3 pt-4 pb-1 text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">{item.title}</h3> : null;
          }
          return <MenuItem key={item.title || index} item={item} isOpen={isOpen} onLaunchApp={onLaunchApp} />
      });
  }

  return (
    <aside className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-r border-black/10 dark:border-white/10 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col">
        <nav className="space-y-1">
          {renderMenuItems(mainMenuItems)}
        </nav>
        <div className="flex-grow" />
        <nav className="space-y-1 pt-2">
          {renderMenuItems(bottomMenuItems)}
        </nav>
      </div>
    </aside>
  );
};