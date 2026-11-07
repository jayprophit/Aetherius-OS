import React, { useEffect, useRef, useState } from "react";
import { ChevronRightIcon } from "./Icons";
import type { MenuItemData } from "./MenuBar";

/**
 * Right-click / long-press context menu with cascading submenus.
 *
 * Data-driven (same MenuItemData shape as the menu bar). Opens on
 * contextmenu (mouse right-click, trackpad two-finger), on long-press
 * (touch, 500 ms), and with Shift+F10 / Menu key (keyboard). Closes on
 * Escape, outside tap, or after any action.
 */

export interface ContextMenuState {
  x: number;
  y: number;
  items: MenuItemData[];
}

export const ContextMenu: React.FC<{
  state: ContextMenuState | null;
  onClose: () => void;
  onLaunch: (componentId: string) => void;
  onAction: (actionId: string) => void;
}> = ({ state, onClose, onLaunch, onAction }) => {
  const [subId, setSubId] = useState<string | null>(null);

  useEffect(() => {
    if (state) setSubId(null);
  }, [state]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onResize = () => onClose();
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [onClose]);

  if (!state) return null;

  const activate = (item: MenuItemData) => {
    if (item.disabled) return;
    if (item.submenu && item.submenu.length > 0) {
      setSubId(item.id);
      return;
    }
    onClose();
    if (item.onSelect) item.onSelect();
    else if (item.id.startsWith("launch:")) onLaunch(item.id.slice("launch:".length));
    else onAction(item.id);
  };

  // Clamp to the viewport so the menu never renders off-screen.
  const estimatedWidth = 260;
  const estimatedHeight = Math.min(state.items.length * 36, window.innerHeight * 0.9);
  const left = Math.min(state.x, Math.max(8, window.innerWidth - estimatedWidth));
  const top = Math.min(state.y, Math.max(8, window.innerHeight - estimatedHeight));

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(event) => { event.preventDefault(); onClose(); }} />
      <div
        role="menu"
        aria-label="Context menu"
        className="fixed z-50 min-w-52 max-w-72 rounded-md border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900 max-h-[80vh] overflow-y-auto"
        style={{ left, top }}
      >
        {state.items.map((item, index) =>
          item.separator ? (
            <div key={`ctx-sep-${index}`} className="my-1 border-t border-gray-200 dark:border-gray-700" role="separator" />
          ) : (
            <ContextRow
              key={item.id}
              item={item}
              subId={subId}
              setSubId={setSubId}
              activate={activate}
            />
          ),
        )}
      </div>
    </>
  );
};

const ContextRow: React.FC<{
  item: MenuItemData;
  subId: string | null;
  setSubId: (id: string | null) => void;
  activate: (item: MenuItemData) => void;
}> = ({ item, subId, setSubId, activate }) => {
  const hasSubmenu = !!item.submenu && item.submenu.length > 0;
  const submenuOpen = subId === item.id;
  return (
    <div className="relative" role="none">
      <button
        role="menuitem"
        disabled={item.disabled}
        aria-haspopup={hasSubmenu ? "menu" : undefined}
        aria-expanded={hasSubmenu ? submenuOpen : undefined}
        onClick={() => activate(item)}
        onMouseEnter={() => setSubId(hasSubmenu ? item.id : null)}
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

/** Hook: attach contextmenu + long-press detection to a target element. */
export function useContextMenu(
  getItems: (x: number, y: number, target: HTMLElement) => MenuItemData[],
  onOpen: (state: ContextMenuState) => void,
): { onContextMenu: (event: React.MouseEvent) => void; onTouchStart: (event: React.TouchEvent) => void; onTouchEnd: () => void } {
  const timerRef = useRef<number | null>(null);
  const touchPosRef = useRef<{ x: number; y: number } | null>(null);

  return {
    onContextMenu: (event: React.MouseEvent) => {
      event.preventDefault();
      const items = getItems(event.clientX, event.clientY, event.target as HTMLElement);
      if (items.length > 0) onOpen({ x: event.clientX, y: event.clientY, items });
    },
    onTouchStart: (event: React.TouchEvent) => {
      const touch = event.touches[0];
      touchPosRef.current = { x: touch.clientX, y: touch.clientY };
      timerRef.current = window.setTimeout(() => {
        const pos = touchPosRef.current;
        if (!pos) return;
        const items = getItems(pos.x, pos.y, event.target as HTMLElement);
        if (items.length > 0) {
          if (navigator.vibrate) navigator.vibrate(30);
          onOpen({ x: pos.x, y: pos.y, items });
        }
      }, 500);
    },
    onTouchEnd: () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      touchPosRef.current = null;
    },
  };
}
