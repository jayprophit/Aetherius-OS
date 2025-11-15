import React, { useEffect, useRef } from 'react';

interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('contextmenu', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[1000] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-40 animate-fade-in-up"
      style={{ top: y, left: x }}
    >
      {items.map((item, index) => (
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
      ))}
    </div>
  );
};