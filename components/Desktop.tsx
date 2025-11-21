
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { desktopItems } from '../data';
import { AppItem, FolderItem, DesktopItem } from '../types';
import { LaunchableApp } from '../App';
import { FolderIcon } from './Icons';
import { ContextMenu } from './ContextMenu';

interface DesktopProps {
  launchApp: (launchable: LaunchableApp) => void;
  wallpaperUrl?: string;
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

export const Desktop: React.FC<DesktopProps> = ({ launchApp, wallpaperUrl }) => {
    const [positions, setPositions] = useState<{ [key: string]: Position }>({});
    const [draggedIcon, setDraggedIcon] = useState<{ id: string; offset: Position } | null>(null);
    const dragStartPos = useRef<Position | null>(null);
    const desktopRef = useRef<HTMLDivElement>(null);
    const isClick = useRef(true);
    const [iconSize, setIconSize] = useState<IconSize>('medium');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean }>({ x: 0, y: 0, visible: false });

    const currentSize = sizeConfig[iconSize];

    const gridLayout = useCallback(() => {
        let newPositions: { [key: string]: Position } = {};
        const containerWidth = desktopRef.current?.clientWidth || window.innerWidth;
        const columns = Math.floor((containerWidth - 16) / currentSize.width);
        
        desktopItems.forEach((item, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            newPositions[item.id] = {
                x: col * currentSize.width,
                y: row * currentSize.height,
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
        } catch (e) {
            console.error("Failed to load icon positions", e);
            gridLayout();
        }
    }, []);

    useEffect(() => {
        // Re-grid on size change, but this might override user's manual placement.
        // For this implementation, we won't auto-regrid on size change to respect placement.
    }, [iconSize, gridLayout]);


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
            if (!isClick.current) { // It was a drag, save positions
                setPositions(currentPositions => {
                    try {
                        localStorage.setItem('desktopIconPositions', JSON.stringify(currentPositions));
                    } catch (err) {
                        console.error("Failed to save icon positions", err);
                    }
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
            } else { // it's a folder
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
  
    return (
        <div 
            ref={desktopRef}
            className="w-full h-full bg-cover bg-center absolute inset-0"
            style={{ backgroundImage: `url(${wallpaperUrl || defaultWallpaper})` }}
            onContextMenu={handleContextMenu}
            onClick={() => setContextMenu({ ...contextMenu, visible: false })}
            title="Desktop Workspace"
        >
            <div className="w-full h-full p-2 relative">
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
                    items={[
                        { label: 'View', action: () => {}, disabled: true }, // Placeholder
                        { type: 'submenu', label: 'Icon Size', items: [
                            { label: 'Small', action: () => changeIconSize('small') },
                            { label: 'Medium', action: () => changeIconSize('medium') },
                            { label: 'Large', action: () => changeIconSize('large') },
                        ]},
                        { type: 'divider' },
                        { label: 'Auto-arrange Icons', action: gridLayout },
                        { label: 'Personalize', action: () => launchApp({ component: 'settings', title: 'Settings', icon: FolderIcon, context: { initialView: 'display' }}) },
                    ]}
                />
            )}
        </div>
    );
};
