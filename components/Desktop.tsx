import React, { useState, useRef, useEffect, useCallback } from 'react';
import { desktopItems } from '../data';
import { AppItem, FolderItem, DesktopItem } from '../types';
import { LaunchableApp } from '../../App';
import { FolderIcon } from './Icons';

interface DesktopProps {
  launchApp: (app: LaunchableApp) => void;
  wallpaperUrl?: string;
}

interface Position {
    x: number;
    y: number;
}

const ICON_WIDTH = 96;
const ICON_HEIGHT = 100;

export const Desktop: React.FC<DesktopProps> = ({ launchApp, wallpaperUrl }) => {
    const [positions, setPositions] = useState<{ [key: string]: Position }>({});
    const [draggedIcon, setDraggedIcon] = useState<{ id: string; offset: Position } | null>(null);
    const dragStartPos = useRef<Position | null>(null);
    const desktopRef = useRef<HTMLDivElement>(null);
    const isClick = useRef(true);

    useEffect(() => {
        let initialPositions: { [key: string]: Position } = {};
        try {
            const saved = localStorage.getItem('desktopIconPositions');
            if (saved) {
                initialPositions = JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to load icon positions", e);
            initialPositions = {}; // Reset if parsing fails
        }

        const containerWidth = desktopRef.current?.clientWidth || window.innerWidth;
        const columns = Math.floor((containerWidth - 16) / ICON_WIDTH);
        
        let occupiedSlots: { [key: string]: boolean } = {};
        Object.values(initialPositions).forEach(pos => {
            const col = Math.floor(pos.x / ICON_WIDTH);
            const row = Math.floor(pos.y / ICON_HEIGHT);
            occupiedSlots[`${row}-${col}`] = true;
        });

        let currentGridPos = { col: 0, row: 0 };
        
        desktopItems.forEach(item => {
            if (!initialPositions[item.id]) {
                while (occupiedSlots[`${currentGridPos.row}-${currentGridPos.col}`]) {
                    currentGridPos.col++;
                    if (currentGridPos.col >= columns) {
                        currentGridPos.col = 0;
                        currentGridPos.row++;
                    }
                }
                initialPositions[item.id] = {
                    x: currentGridPos.col * ICON_WIDTH,
                    y: currentGridPos.row * ICON_HEIGHT,
                };
                occupiedSlots[`${currentGridPos.row}-${currentGridPos.col}`] = true;
            }
        });
        
        setPositions(initialPositions);
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
            newX = Math.max(0, Math.min(newX, rect.width - ICON_WIDTH));
            newY = Math.max(0, Math.min(newY, rect.height - ICON_HEIGHT));
        }

        setPositions(prev => ({
            ...prev,
            [draggedIcon.id]: { x: newX, y: newY },
        }));
    }, [draggedIcon]);

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


    const defaultWallpaper = 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=2070&auto=format=fit-crop';
  
    return (
        <div 
            ref={desktopRef}
            className="w-full h-full bg-cover bg-center absolute inset-0"
            style={{ backgroundImage: `url(${wallpaperUrl || defaultWallpaper})` }}
        >
            <div className="w-full h-full p-2 relative">
                {desktopItems.map(item => {
                    const position = positions[item.id];
                    if (!position) return null;
                    const Icon = item.type === 'app' ? item.icon : FolderIcon;
                    return (
                        <button 
                            key={item.id}
                            onMouseDown={(e) => handleMouseDown(e, item)}
                            onClick={() => handleClick(item)}
                            className="flex flex-col items-center justify-center text-center space-y-1 p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                            style={{
                                position: 'absolute',
                                transform: `translate(${position.x}px, ${position.y}px)`,
                                width: `${ICON_WIDTH}px`,
                                touchAction: 'none',
                                cursor: 'pointer'
                            }}
                            aria-label={`Open ${item.title}`}
                        >
                            <div className="w-16 h-16 bg-black/30 dark:bg-black/40 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-md pointer-events-none">
                                <Icon className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-white text-xs font-medium drop-shadow-md select-none pointer-events-none w-20 truncate">{item.title}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};