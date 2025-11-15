import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WindowState } from '../types';

interface WindowFrameProps {
  windowState: WindowState;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  onMinimize: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WindowState>) => void;
  isActive: boolean;
  children: React.ReactNode;
  desktopRect: DOMRect | null;
}

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;

export const WindowFrame: React.FC<WindowFrameProps> = ({ windowState, onClose, onFocus, onMinimize, onUpdate, isActive, children, desktopRect }) => {
  const { id, title, icon: Icon, position, size, zIndex, isMaximized } = windowState;
  
  const frameRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  
  const handleFocus = useCallback(() => {
    onFocus(id);
  }, [id, onFocus]);
  
  const onDragMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag on buttons
    e.preventDefault();
    handleFocus();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const onResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleFocus();
    setIsResizing(true);
    setResizeDirection(direction);
  };
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!desktopRect) return;

    if (isDragging) {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      newX = Math.max(0, Math.min(newX, desktopRect.width - size.width));
      newY = Math.max(0, Math.min(newY, desktopRect.height - size.height));

      onUpdate(id, { position: { x: newX, y: newY } });
    }

    if (isResizing) {
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;
        
        const dx = e.movementX;
        const dy = e.movementY;

        if (resizeDirection.includes('right')) {
            newWidth = Math.max(MIN_WIDTH, Math.min(size.width + dx, desktopRect.width - position.x));
        }
        if (resizeDirection.includes('bottom')) {
            newHeight = Math.max(MIN_HEIGHT, Math.min(size.height + dy, desktopRect.height - position.y));
        }
        if (resizeDirection.includes('left')) {
            const calculatedWidth = size.width - dx;
            if (calculatedWidth >= MIN_WIDTH) {
                newWidth = calculatedWidth;
                newX = Math.max(0, position.x + dx);
            }
        }
        if (resizeDirection.includes('top')) {
            const calculatedHeight = size.height - dy;
            if (calculatedHeight >= MIN_HEIGHT) {
                newHeight = calculatedHeight;
                newY = Math.max(0, position.y + dy);
            }
        }
        onUpdate(id, { size: {width: newWidth, height: newHeight }, position: {x: newX, y: newY}});
    }
  }, [isDragging, isResizing, dragOffset, resizeDirection, id, onUpdate, position, size, desktopRect]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const toggleMaximize = () => {
    onUpdate(id, { isMaximized: !isMaximized });
  }

  const styles: React.CSSProperties = isMaximized ? {
      inset: 0,
      transform: 'none',
      width: '100%',
      height: '100%',
      borderRadius: 0,
  } : {
      width: `${size.width}px`,
      height: `${size.height}px`,
      transform: `translate(${position.x}px, ${position.y}px)`,
  };

  return (
    <div
      ref={frameRef}
      className={`fixed bg-white/80 dark:bg-subtle-dark/80 backdrop-blur-xl rounded-lg flex flex-col border border-black/10 dark:border-white/10 overflow-hidden transition-shadow duration-200 ease-in-out ${isActive ? 'shadow-2xl' : 'shadow-lg'}`}
      style={{ ...styles, zIndex }}
      onMouseDown={handleFocus}
    >
      {/* Resizers */}
      {!isMaximized && (
        <>
            <div onMouseDown={(e) => onResizeMouseDown(e, 'top')} className="absolute -top-1 left-0 w-full h-2 cursor-ns-resize" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'bottom')} className="absolute -bottom-1 left-0 w-full h-2 cursor-ns-resize" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'left')} className="absolute top-0 -left-1 w-2 h-full cursor-ew-resize" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'right')} className="absolute top-0 -right-1 w-2 h-full cursor-ew-resize" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'top-left')} className="absolute -top-1 -left-1 w-3 h-3 cursor-nwse-resize" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'top-right')} className="absolute -top-1 -right-1 w-3 h-3 cursor-nesw-resize" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'bottom-left')} className="absolute -bottom-1 -left-1 w-3 h-3 cursor-nesw-resize" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'bottom-right')} className="absolute -bottom-1 -right-1 w-3 h-3 cursor-nwse-resize" />
        </>
      )}

      <header
        onMouseDown={onDragMouseDown}
        onDoubleClick={toggleMaximize}
        className={`h-10 flex items-center px-2 border-b border-black/5 dark:border-white/5 flex-shrink-0 group ${!isMaximized && 'cursor-move'}`}
      >
        <div className="flex items-center space-x-1.5">
            <button onClick={() => onClose(id)} title="Close" className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-red-900 group/btn">
                <svg className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M2,2 L10,10 M10,2 L2,10"/></svg>
            </button>
            <button onClick={() => onMinimize(id)} title="Minimize" className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-yellow-900 group/btn">
                <svg className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100" viewBox="0 0 10 2" fill="currentColor"><path d="M0,0 H10 V2 H0 Z"/></svg>
            </button>
            <button onClick={toggleMaximize} title={isMaximized ? "Restore Down" : "Maximize"} className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-green-900 group/btn">
                {isMaximized ? 
                    <svg className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3,0 H10 V7 H7 M0,3 H7 V10 H0 Z"/></svg> :
                    <svg className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M0,0 H10 V10 H0 Z"/></svg>
                }
            </button>
        </div>
        <div className="flex-1 text-center select-none flex items-center justify-center gap-2">
            <Icon className="w-5 h-5 text-content-light/80 dark:text-content-dark/80" />
            <h2 className="font-semibold text-sm text-content-light dark:text-content-dark">{title}</h2>
        </div>
        <div className="w-20"></div> {/* Spacer to balance header */}
      </header>
      <div className="flex-1 overflow-auto bg-background-light dark:bg-background-dark/50">
        {children}
      </div>
    </div>
  );
};