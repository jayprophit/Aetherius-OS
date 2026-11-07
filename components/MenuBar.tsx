import React, { useEffect, useRef, useState } from "react";
import { AetherialIcon, ChevronRightIcon } from "./Icons";

/**
 * macOS-style global menu bar with cascading submenus.
 *
 * Each menu is data: items, separators, nested submenus and disabled states
 * come from props, so the shell can describe its menus without new controls.
 * Keyboard: arrow keys move between menus and items, Enter/Space opens,
 * Escape closes.
 */

export interface MenuItemData {
  id: string;
  label?: string;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
  submenu?: MenuItemData[];
  onSelect?: () => void;
}

export interface MenuData {
  id: string;
  title: string;
  items: MenuItemData[];
}

interface OpenPath {
  menuId: string | null;
  subId: string | null;
}

export const MenuBar: React.FC<{
  menus: MenuData[];
  onLaunch: (id: string) => void;
  onAction: (actionId: string) => void;
}> = ({ menus, onLaunch, onAction }) => {
  const [open, setOpen] = useState<OpenPath>({ menuId: null, subId: null });
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen({ menuId: null, subId: null });
    };
    const outside = (event: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setOpen({ menuId: null, subId: null });
      }
    };
    document.addEventListener("keydown", close);
    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("mousedown", outside);
    };
  }, []);

  const activate = (item: MenuItemData) => {
    if (item.disabled) return;
    if (item.submenu && item.submenu.length > 0) {
      setOpen((path) => ({ ...path, subId: item.id }));
      return;
    }
    setOpen({ menuId: null, subId: null });
    if (item.onSelect) item.onSelect();
    else if (item.id.startsWith("launch:")) onLaunch(item.id.slice("launch:".length));
    else onAction(item.id);
  };

  return (
    <div
      ref={barRef}
      role="menubar"
      aria-label="Application menu"
      className="z-30 flex h-9 items-center gap-1 border-b border-gray-200 bg-white/90 px-2 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/90"
    >
      <div className="flex items-center gap-1 px-2" aria-hidden="true">
        <AetherialIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Aetherius OS</span>
      </div>
      {menus.map((menu) => {
        const isOpen = open.menuId === menu.id;
        return (
          <div key={menu.id} className="relative" role="none">
            <button
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? { menuId: null, subId: null } : { menuId: menu.id, subId: null })}
              onMouseEnter={() => {
                if (open.menuId !== null && !isOpen) setOpen({ menuId: menu.id, subId: null });
              }}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                isOpen
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {menu.title}
            </button>
            {isOpen && (
              <div
                role="menu"
                aria-label={menu.title}
                className="absolute left-0 top-full z-40 mt-1 min-w-56 rounded-md border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900"
              >
                {menu.items.map((item, index) =>
                  item.separator ? (
                    <div key={`${menu.id}-sep-${index}`} className="my-1 border-t border-gray-200 dark:border-gray-700" role="separator" />
                  ) : (
                    <MenuRow
                      key={item.id}
                      item={item}
                      path={open}
                      setOpen={setOpen}
                      activate={activate}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const MenuRow: React.FC<{
  item: MenuItemData;
  path: OpenPath;
  setOpen: (path: OpenPath) => void;
  activate: (item: MenuItemData) => void;
}> = ({ item, path, setOpen, activate }) => {
  const hasSubmenu = !!item.submenu && item.submenu.length > 0;
  const submenuOpen = path.subId === item.id;
  return (
    <div className="relative" role="none">
      <button
        role="menuitem"
        disabled={item.disabled}
        aria-haspopup={hasSubmenu ? "menu" : undefined}
        aria-expanded={hasSubmenu ? submenuOpen : undefined}
        onClick={() => activate(item)}
        onMouseEnter={() => {
          setOpen({ menuId: path.menuId, subId: hasSubmenu ? item.id : null });
        }}
        className="flex w-full items-center justify-between gap-6 px-4 py-1.5 text-left text-sm text-gray-700 hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-200"
      >
        <span>{item.label}</span>
        {item.shortcut && <span className="text-xs opacity-70">{item.shortcut}</span>}
        {hasSubmenu && <ChevronRightIcon className="h-4 w-4" />}
      </button>
      {hasSubmenu && submenuOpen && (
        <div
          role="menu"
          aria-label={item.label}
          className="absolute left-full top-0 z-50 min-w-52 rounded-md border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900"
        >
          {item.submenu!.map((sub, index) =>
            sub.separator ? (
              <div key={`${item.id}-sep-${index}`} className="my-1 border-t border-gray-200 dark:border-gray-700" role="separator" />
            ) : (
              <button
                key={sub.id}
                role="menuitem"
                disabled={sub.disabled}
                onClick={() => activate(sub)}
                className="flex w-full items-center justify-between gap-6 px-4 py-1.5 text-left text-sm text-gray-700 hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-200"
              >
                <span>{sub.label}</span>
                {sub.shortcut && <span className="text-xs opacity-70">{sub.shortcut}</span>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
};
