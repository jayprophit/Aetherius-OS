
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { desktopItems } from '../data';
import { DesktopItem, SystemLocale } from '../types';
import { LaunchableApp } from '../App';
import { FolderIcon } from './Icons';
import { ContextMenu, useContextMenu, type ContextMenuState } from './ContextMenu';
import { WeatherWidget, SystemWidget, CalendarWidget } from './DesktopWidgets';
import { WidgetFrame } from './WidgetFrame';
import {
  PREFS_EVENT,
  desktopPrefs,
  widgetPrefs,
  type DesktopPrefs,
  type WidgetPrefs,
} from './desktopPreferences';

interface DesktopProps {
  launchApp: (launchable: LaunchableApp) => void;
  wallpaperUrl?: string;
  systemLocale?: SystemLocale;
}

interface Position {
    x: number;
    y: number;
}

type IconSize = 'small' | 'medium' | 'large';

const sizeConfig = {
    small: { width: 80, height: 80, iconSize: 32, textSize: 'text-[10px]' },
    medium: { width: 96, height: 100, iconSize: 48, textSize: 'text-xs' },
    large: { width: 112, height: 112, iconSize: 64, textSize: 'text-sm' },
};

function groupKey(item: any, groupBy: DesktopPrefs['groupBy']): string {
  if (groupBy === 'type') return item.type === 'app' ? 'Apps' : 'Folders';
  if (groupBy === 'firstLetter') return (item.title || '?').charAt(0).toUpperCase();
  return 'All';
}

export const Desktop: React.FC<DesktopProps> = ({ launchApp, wallpaperUrl, systemLocale }) => {
    const [positions, setPositions] = useState<{ [key: string]: Position }>({});
    const [draggedIcon, setDraggedIcon] = useState<{ id: string; offset: Position } | null>(null);
    const dragStartPos = useRef<Position | null>(null);
    const desktopRef = useRef<HTMLDivElement>(null);
    const isClick = useRef(true);
    const [prefs, setPrefs] = useState<DesktopPrefs>(() => desktopPrefs.read());
    const [widgets, setWidgets] = useState<WidgetPrefs>(() => widgetPrefs.read());
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const iconSize = prefs.iconSize;
    const currentSize = sizeConfig[iconSize];

    const persistPositions = (next: { [key: string]: Position }) => {
        try {
            localStorage.setItem('desktopIconPositions', JSON.stringify(next));
        } catch (e) { /* private mode: positions still work in memory */ }
    };

    const sortedItems = useCallback(() => {
        const items = [...desktopItems];
        if (prefs.sortBy === 'name') items.sort((a: any, b: any) => String(a.title).localeCompare(String(b.title)));
        if (prefs.sortBy === 'type') items.sort((a: any, b: any) => String(a.type).localeCompare(String(b.type)));
        if (prefs.groupBy !== 'none') {
            const rank = (it: any) => groupKey(it, prefs.groupBy);
            items.sort((a: any, b: any) => rank(a).localeCompare(rank(b)));
        }
        return items;
    }, [prefs.sortBy, prefs.groupBy]);

    const gridLayout = useCallback(() => {
        const items = sortedItems();
        let newPositions: { [key: string]: Position } = {};
        const containerWidth = desktopRef.current?.clientWidth || window.innerWidth;
        const columns = Math.max(1, Math.floor((containerWidth - 16) / currentSize.width));
        items.forEach((item: any, index: number) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            newPositions[item.id] = {
                x: 20 + (col * currentSize.width),
                y: 20 + (row * currentSize.height),
            };
        });
        setPositions(newPositions);
        persistPositions(newPositions);
    }, [currentSize.width, currentSize.height, sortedItems]);

    useEffect(() => {
        const onPrefs = () => {
            setPrefs(desktopPrefs.read());
            setWidgets(widgetPrefs.read());
        };
        window.addEventListener(PREFS_EVENT, onPrefs);
        return () => window.removeEventListener(PREFS_EVENT, onPrefs);
    }, []);

    useEffect(() => {
        let initialPositions: { [key: string]: Position } = {};
        try {
            const saved = localStorage.getItem('desktopIconPositions');
            const fresh = prefs.autoArrange;
            if (saved && !fresh) {
                initialPositions = JSON.parse(saved);
                // Ensure every current item has a position
                const missing = sortedItems().filter((i: any) => !initialPositions[i.id]);
                if (missing.length === 0) {
                    setPositions(initialPositions);
                } else {
                    gridLayout();
                }
            } else {
                gridLayout();
            }
        } catch (e) {
            gridLayout();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMouseDown = (e: React.MouseEvent, item: DesktopItem) => {
        if (e.button !== 0) return;
        if (prefs.locked) return;
        isClick.current = true;
        const currentPos = positions[item.id] || { x: 0, y: 0 };
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        setDraggedIcon({
            id: item.id,
            offset: {
                x: e.clientX - currentPos.x,
                y: e.clientY - currentPos.y,
            },
        });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!draggedIcon) return;
        if (isClick.current) {
            const dx = e.clientX - (dragStartPos.current?.x || 0);
            const dy = e.clientY - (dragStartPos.current?.y || 0);
            if (Math.sqrt(dx * dx + dy * dy) > 5) {
                isClick.current = false;
            }
        }
        let newX = e.clientX - draggedIcon.offset.x;
        let newY = e.clientY - draggedIcon.offset.y;

        if (desktopRef.current) {
            const rect = desktopRef.current.getBoundingClientRect();
            const relX = newX - rect.left;
            const relY = newY - rect.top;
            newX = Math.max(0, Math.min(relX, rect.width - currentSize.width));
            newY = Math.max(0, Math.min(relY, rect.height - currentSize.height));
        }
        if (prefs.snapToGrid) {
            newX = Math.round(newX / currentSize.width) * currentSize.width;
            newY = Math.round(newY / currentSize.height) * currentSize.height;
        }
        setPositions(prev => ({
            ...prev,
            [draggedIcon.id]: { x: newX, y: newY },
        }));
    }, [draggedIcon, currentSize.width, currentSize.height, prefs.snapToGrid]);

    const handleMouseUp = useCallback(() => {
        if (draggedIcon) {
            if (!isClick.current) {
                setPositions(currentPositions => {
                    persistPositions(currentPositions);
                    return currentPositions;
                });
            }
        }
        setDraggedIcon(null);
        dragStartPos.current = null;
    }, [draggedIcon]);

    const handleClick = (item: DesktopItem) => {
        if (isClick.current) {
            if (item.type === 'app') {
                launchApp(item);
            } else {
                 launchApp({
                    component: 'folderView',
                    title: item.title,
                    icon: FolderIcon,
                    context: { folder: item }
                });
            }
        }
    };

    const changeIconSize = (size: IconSize) => {
        const next = { ...prefs, iconSize: size };
        setPrefs(next);
        desktopPrefs.write(next);
    };

    const updateWidget = (id: keyof WidgetPrefs, patch: Partial<WidgetPrefs[typeof id]>) => {
        const next = { ...widgets, [id]: { ...widgets[id], ...patch } };
        setWidgets(next);
        widgetPrefs.write(next);
    };

    const resetWidgets = () => {
        updateWidget('weather', { x: 24, y: 24, size: 'S', visible: true });
        updateWidget('calendar', { x: 24, y: 180, size: 'S', visible: true });
        updateWidget('system', { x: 24, y: 336, size: 'S', visible: true });
    };

    useEffect(() => {
        if (draggedIcon) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggedIcon, handleMouseMove, handleMouseUp]);

    const desktopContext = useContextMenu(
        () => [
            { id: 'refresh', label: 'Refresh' },
            { id: 'arrange', label: 'Auto-arrange (grid)' },
            { id: 'sep-1', separator: true },
            {
                id: 'iconsize',
                label: 'Icon size',
                submenu: [
                    { id: 'size:large', label: 'Large icons' },
                    { id: 'size:medium', label: 'Medium icons' },
                    { id: 'size:small', label: 'Small icons' },
                ],
            },
            { id: 'toggle-lock', label: prefs.locked ? 'Unlock layout' : 'Lock layout' },
            { id: 'toggle-widgets', label: 'Show / hide widgets' },
            { id: 'sep-2', separator: true },
            { id: 'launch:settings', label: 'Desktop settings…' },
        ],
        setContextMenu,
    );

    const handleContextAction = (actionId: string) => {
        if (actionId === 'refresh') window.location.reload();
        else if (actionId === 'arrange') gridLayout();
        else if (actionId === 'size:large') changeIconSize('large');
        else if (actionId === 'size:medium') changeIconSize('medium');
        else if (actionId === 'size:small') changeIconSize('small');
        else if (actionId === 'toggle-lock') {
            const next = { ...prefs, locked: !prefs.locked };
            setPrefs(next);
            desktopPrefs.write(next);
        } else if (actionId === 'toggle-widgets') {
            const anyHidden = !widgets.weather.visible || !widgets.calendar.visible || !widgets.system.visible;
            const nextWidgets: WidgetPrefs = {
                weather: { ...widgets.weather, visible: anyHidden },
                calendar: { ...widgets.calendar, visible: anyHidden },
                system: { ...widgets.system, visible: anyHidden },
            };
            setWidgets(nextWidgets);
            widgetPrefs.write(nextWidgets);
        }
    };

    const defaultWallpaper = 'linear-gradient(135deg, #0b1020 0%, #1b2a4a 50%, #4a2a5a 100%)';
    const wallpaper = wallpaperUrl
        ? `url(${wallpaperUrl})`
        : prefs.wallpaper
          ? prefs.wallpaper
          : defaultWallpaper;

    const items = sortedItems();

    return (
        <div
            ref={desktopRef}
            className="w-full h-full bg-cover bg-center absolute inset-0 transition-all duration-700 ease-in-out"
            style={{ backgroundImage: wallpaper }}
            onContextMenu={desktopContext.onContextMenu}
            onTouchStart={desktopContext.onTouchStart}
            onTouchEnd={desktopContext.onTouchEnd}
            onTouchMove={desktopContext.onTouchEnd}
            title="Desktop Workspace"
        >
            {widgets.weather.visible && (
                <WidgetFrame placement={widgets.weather} locked={prefs.locked} label="Weather" onMove={(p) => updateWidget('weather', p)}>
                    <WeatherWidget city={systemLocale?.location?.city} />
                </WidgetFrame>
            )}
            {widgets.calendar.visible && (
                <WidgetFrame placement={widgets.calendar} locked={prefs.locked} label="Calendar" onMove={(p) => updateWidget('calendar', p)}>
                    <CalendarWidget />
                </WidgetFrame>
            )}
            {widgets.system.visible && (
                <WidgetFrame placement={widgets.system} locked={prefs.locked} label="System" onMove={(p) => updateWidget('system', p)}>
                    <SystemWidget />
                </WidgetFrame>
            )}

            <div className="w-full h-full p-2 relative z-10">
                {items.map((item: any) => {
                    const position = positions[item.id];
                    if (!position) return null;
                    const Icon = item.type === 'app' ? item.icon : FolderIcon;
                    const tooltipText = item.type === 'app'
                        ? `Launch ${item.title} Application`
                        : `Open ${item.title} Folder`;
                    const groupLabel = prefs.groupBy !== 'none' ? groupKey(item, prefs.groupBy) : null;

                    return (
                        <button
                            key={item.id}
                            onMouseDown={(e) => handleMouseDown(e, item)}
                            onClick={() => handleClick(item)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleClick(item);
                                }
                            }}
                            onContextMenu={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const target = e.currentTarget as HTMLElement;
                                setContextMenu({
                                    x: e.clientX, y: e.clientY, items: [
                                        { id: `launch:${item.component || item.id}`, label: item.type === 'app' ? `Open ${item.title}` : `Open folder` },
                                        { id: 'sep-icon', separator: true },
                                        { id: 'arrange', label: 'Auto-arrange (grid)' },
                                        { id: 'launch:settings', label: 'Settings…' },
                                    ],
                                });
                                void target;
                            }}
                            className="flex flex-col items-center justify-start text-center space-y-1 p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                            style={{
                                position: 'absolute',
                                transform: `translate(${position.x}px, ${position.y}px)`,
                                width: `${currentSize.width}px`,
                                height: `${currentSize.height}px`,
                                touchAction: 'none',
                                cursor: prefs.locked ? 'default' : 'pointer'
                            }}
                            aria-label={tooltipText}
                            title={groupLabel ? `${tooltipText} · group ${groupLabel}` : tooltipText}
                        >
                            <div className="bg-black/30 dark:bg-black/40 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-md pointer-events-none" style={{ width: currentSize.iconSize + 16, height: currentSize.iconSize + 16 }}>
                                <Icon className="text-white" style={{ width: currentSize.iconSize, height: currentSize.iconSize }} />
                            </div>
                            {prefs.showIconLabels && (
                                <span className={`text-white font-medium drop-shadow-md select-none pointer-events-none w-full truncate ${currentSize.textSize}`}>{item.title}</span>
                            )}
                        </button>
                    );
                })}
            </div>
            <ContextMenu
                state={contextMenu}
                onClose={() => setContextMenu(null)}
                onLaunch={(componentId) => {
                    const app = desktopItems.find((i: any) => (i.component || i.id) === componentId);
                    if (app) launchApp(app);
                }}
                onAction={handleContextAction}
            />
        </div>
    );
};
