import React, { useEffect, useRef, useState } from 'react';
import { ChevronRightIcon } from './Icons';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  type?: 'item';
}

export interface SubMenuItem {
    label: string;
    items: ContextMenuItem[];
    type: 'submenu';
}

export interface DividerItem {
    type: 'divider';
}

type MenuItemType = ContextMenuItem | SubMenuItem | DividerItem;

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItemType[];
  onClose: () => void;
}

const SubMenu: React.FC<{ items: ContextMenuItem[], parentRef: React.RefObject<HTMLDivElement> }> = ({ items, parentRef }) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (parentRef.current) {
            const rect = parentRef.current.getBoundingClientRect();
            setPosition({ top: rect.top, left: rect.right });
        }
    }, [parentRef]);
    
    return (
        <div 
            className="fixed z-[1001] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-40"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
        >
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={item.action}
                    disabled={item.disabled}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-500 hover:text-white disabled:opacity-50"
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
};


export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Use timeout to prevent immediate closing on the same right-click
    const timer = setTimeout(() => {
        document.addEventListener('contextmenu', handleClickOutside);
    }, 0);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[1000] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-48 animate-fade-in-up"
      style={{ top: y, left: x }}
      onContextMenu={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => {
        if (item.type === 'divider') {
            return <div key={index} className="h-px bg-gray-200 dark:bg-gray-700 my-1 mx-2" />;
        }
        if (item.type === 'submenu') {
             return (
                <div key={index} onMouseEnter={() => setActiveSubMenu(item.label)} onMouseLeave={() => setActiveSubMenu(null)} ref={subMenuRef}>
                    <button
                        className="w-full flex justify-between items-center text-left px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-500 hover:text-white"
                    >
                        <span>{item.label}</span>
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                    {activeSubMenu === item.label && <SubMenu items={item.items} parentRef={subMenuRef} />}
                </div>
            );
        }
        return (
            <button
            key={index}
            onClick={() => {
                item.action();
                onClose();
            }}
            disabled={item.disabled}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {item.label}
            </button>
        );
      })}
    </div>
  );
};