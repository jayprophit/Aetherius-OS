
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { desktopItems, osMenuStructures } from '../data';
import { AppItem, FolderItem, DesktopItem, SystemLocale } from '../types';
import { LaunchableApp } from '../App';
import { FolderIcon } from './Icons';
import { ContextMenu } from './ContextMenu';
import { WeatherWidget, SystemWidget, CalendarWidget } from './DesktopWidgets';

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

export const Desktop: React.FC<DesktopProps> = ({ launchApp, wallpaperUrl, systemLocale }) => {
    const [positions, setPositions] = useState<{ [key: string]: Position }>({});
    const [draggedIcon, setDraggedIcon] = useState<{ id: string; offset: Position } | null>(null);
    const dragStartPos = useRef<Position | null>(null);
    const desktopRef = useRef<HTMLDivElement>(null);
    const isClick = useRef(true);
    const [iconSize, setIconSize] = useState<IconSize>('medium');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean }>({ x: 0, y: 0, visible: false });
    const [showWidgets, setShowWidgets] = useState(true);

    const currentSize = sizeConfig[iconSize];

    const gridLayout = useCallback(() => {
        let newPositions: { [key: string]: Position } = {};
        const containerWidth = desktopRef.current?.clientWidth || window.innerWidth;
        const columns = Math.floor((containerWidth - 16) / currentSize.width);
        
        desktopItems.forEach((item, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            newPositions[item.id] = {
                x: 20 + (col * currentSize.width), // Added margin left
                y: 20 + (row * currentSize.height), // Added margin top
            };
        });
        setPositions(newPositions);
        try {
            localStorage.setItem('desktopIconPositions', JSON.stringify(newPositions));
        } catch (e) {}
    }, [currentSize.width, currentSize.height]);

    useEffect(() => {
        let initialPositions: { [key: string]: Position } = {};
        try {
            const saved = localStorage.getItem('desktopIconPositions');
            if (saved) {
                initialPositions = JSON.parse(saved);
                setPositions(initialPositions);
            } else {
                gridLayout();
            }
            const savedSize = localStorage.getItem('desktopIconSize');
            if (savedSize) {
                setIconSize(savedSize as IconSize);
            }
            const widgetsEnabled = localStorage.getItem('desktopWidgets');
            if (widgetsEnabled !== null) setShowWidgets(widgetsEnabled === 'true');

        } catch (e) {
            console.error("Failed to load desktop state", e);
            gridLayout();
        }
    }, []);

    const handleMouseDown = (e: React.MouseEvent, item: DesktopItem) => {
        if (e.button !== 0) return;
        isClick.current = true;
        const currentPos = positions[item.id];
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
            newX = Math.max(0, Math.min(newX, rect.width - currentSize.width));
            newY = Math.max(0, Math.min(newY, rect.height - currentSize.height));
        }

        setPositions(prev => ({
            ...prev,
            [draggedIcon.id]: { x: newX, y: newY },
        }));
    }, [draggedIcon, currentSize.width, currentSize.height]);

    const handleMouseUp = useCallback(() => {
        if (draggedIcon) {
            if (!isClick.current) { 
                setPositions(currentPositions => {
                    try {
                        localStorage.setItem('desktopIconPositions', JSON.stringify(currentPositions));
                    } catch (err) {}
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
    
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, visible: true });
    };

    const changeIconSize = (size: IconSize) => {
        setIconSize(size);
        localStorage.setItem('desktopIconSize', size);
    };
    
    const toggleWidgets = () => {
        const newState = !showWidgets;
        setShowWidgets(newState);
        localStorage.setItem('desktopWidgets', String(newState));
    }

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


    const defaultWallpaper = 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=2070&auto-format=fit-crop';
  
    const mapAction = (item: any): any => {
        if (item.type === 'divider') return item;
        
        let action = () => {};
        
        if (item.label === 'Refresh') {
             action = () => window.location.reload();
        } else if (item.label === 'Display Settings') {
             action = () => launchApp({ component: 'settings', title: 'Settings', icon: FolderIcon, context: { initialView: 'display' }});
        } else if (item.label === 'Personalize') {
             action = () => launchApp({ component: 'settings', title: 'Settings', icon: FolderIcon, context: { initialView: 'wallpaper' }});
        } else if (item.label === 'Open Terminal') {
             action = () => launchApp({ component: 'terminal', title: 'Terminal', icon: FolderIcon });
        } else if (item.label.includes('Large Icons')) {
            action = () => changeIconSize('large');
        } else if (item.label.includes('Medium Icons')) {
            action = () => changeIconSize('medium');
        } else if (item.label.includes('Small Icons')) {
            action = () => changeIconSize('small');
        } else if (item.label === 'Toggle Widgets') {
            action = toggleWidgets;
        }

        if (item.submenu || item.items) {
            return {
                ...item,
                type: 'submenu',
                items: (item.submenu || item.items).map(mapAction)
            };
        }

        return { ...item, action };
    };

    // Inject Toggle Widgets option if missing
    const menuItems = [...osMenuStructures.desktopContext];
    if (!menuItems.find((i: any) => i.label === 'Toggle Widgets')) {
        menuItems.splice(1, 0, { label: 'Toggle Widgets', action: 'toggleWidgets' });
    }

    const contextMenuItems = menuItems.map(mapAction);

    return (
        <div 
            ref={desktopRef}
            className="w-full h-full bg-cover bg-center absolute inset-0 transition-all duration-700 ease-in-out"
            style={{ backgroundImage: `url(${wallpaperUrl || defaultWallpaper})` }}
            onContextMenu={handleContextMenu}
            onClick={() => setContextMenu({ ...contextMenu, visible: false })}
            title="Desktop Workspace"
        >
            {/* Widgets Layer */}
            {showWidgets && (
                <div className="absolute top-8 right-8 w-80 flex flex-col gap-6 pointer-events-none z-0">
                    <div className="h-40 pointer-events-auto transform hover:scale-105 transition-transform">
                        <WeatherWidget city={systemLocale?.location?.city} />
                    </div>
                    <div className="h-40 pointer-events-auto transform hover:scale-105 transition-transform">
                        <CalendarWidget />
                    </div>
                    <div className="h-32 pointer-events-auto transform hover:scale-105 transition-transform">
                        <SystemWidget />
                    </div>
                </div>
            )}

            <div className="w-full h-full p-2 relative z-10">
                {desktopItems.map(item => {
                    const position = positions[item.id];
                    if (!position) return null;
                    const Icon = item.type === 'app' ? item.icon : FolderIcon;
                    const tooltipText = item.type === 'app' 
                        ? `Launch ${item.title} Application` 
                        : `Open ${item.title} Folder`;

                    return (
                        <button 
                            key={item.id}
                            onMouseDown={(e) => handleMouseDown(e, item)}
                            onClick={() => handleClick(item)}
                            onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e); }}
                            className="flex flex-col items-center justify-start text-center space-y-1 p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                            style={{
                                position: 'absolute',
                                transform: `translate(${position.x}px, ${position.y}px)`,
                                width: `${currentSize.width}px`,
                                height: `${currentSize.height}px`,
                                touchAction: 'none',
                                cursor: 'pointer'
                            }}
                            aria-label={tooltipText}
                            title={tooltipText}
                        >
                            <div className="bg-black/30 dark:bg-black/40 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-md pointer-events-none" style={{ width: currentSize.iconSize + 16, height: currentSize.iconSize + 16 }}>
                                <Icon className="text-white" style={{ width: currentSize.iconSize, height: currentSize.iconSize }} />
                            </div>
                            <span className={`text-white font-medium drop-shadow-md select-none pointer-events-none w-full truncate ${currentSize.textSize}`}>{item.title}</span>
                        </button>
                    );
                })}
            </div>
             {contextMenu.visible && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu({ ...contextMenu, visible: false })}
                    items={contextMenuItems}
                />
            )}
        </div>
    );
};