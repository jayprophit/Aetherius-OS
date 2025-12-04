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

const MIN_WIDTH = 350;
const MIN_HEIGHT = 250;

export const WindowFrame: React.FC<WindowFrameProps> = ({ windowState, onClose, onFocus, onMinimize, onUpdate, isActive, children, desktopRect }) => {
  const { id, title, icon: Icon, position, size, zIndex, isMaximized } = windowState;
  
  const frameRef = useRef<HTMLDivElement>(null);
  
  // Unified dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });
  
  const handleFocus = useCallback(() => {
    onFocus(id);
  }, [id, onFocus]);
  
  // Mouse Down Handler
  const onDragMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    handleFocus();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Touch Start Handler (for iPad/Mobile)
  const onDragTouchStart = (e: React.TouchEvent) => {
    if (isMaximized) return;
    if ((e.target as HTMLElement).closest('button')) return;
    handleFocus();
    setIsDragging(true);
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const onResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleFocus();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: size.width,
        h: size.height,
        px: position.x,
        py: position.y
    };
  };
  
  // Global End Handler
  const handleInteractionEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  }, []);

  // Global Move Handler
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!desktopRect) return;

    if (isDragging) {
      let newX = clientX - dragOffset.x;
      let newY = clientY - dragOffset.y;

      // Relaxed boundaries: allow window to go partially offscreen but keep header visible
      const minVisibleWidth = 50;
      const minVisibleHeight = 30; 
      
      newX = Math.max(minVisibleWidth - size.width, Math.min(newX, desktopRect.width - minVisibleWidth));
      newY = Math.max(0, Math.min(newY, desktopRect.height - minVisibleHeight));

      onUpdate(id, { position: { x: newX, y: newY } });
    }

    if (isResizing) {
        const dx = clientX - resizeStart.current.x;
        const dy = clientY - resizeStart.current.y;
        
        let newWidth = resizeStart.current.w;
        let newHeight = resizeStart.current.h;
        let newX = resizeStart.current.px;
        let newY = resizeStart.current.py;

        if (resizeDirection.includes('right')) {
            newWidth = Math.max(MIN_WIDTH, resizeStart.current.w + dx);
        }
        if (resizeDirection.includes('bottom')) {
            newHeight = Math.max(MIN_HEIGHT, resizeStart.current.h + dy);
        }
        if (resizeDirection.includes('left')) {
            const possibleWidth = resizeStart.current.w - dx;
            if (possibleWidth >= MIN_WIDTH) {
                newWidth = possibleWidth;
                newX = resizeStart.current.px + dx;
            }
        }
        if (resizeDirection.includes('top')) {
             const possibleHeight = resizeStart.current.h - dy;
             if (possibleHeight >= MIN_HEIGHT) {
                 newHeight = possibleHeight;
                 newY = resizeStart.current.py + dy;
             }
        }
        onUpdate(id, { size: {width: newWidth, height: newHeight }, position: {x: newX, y: newY}});
    }
  }, [isDragging, isResizing, dragOffset, resizeDirection, id, onUpdate, size, desktopRect]);

  // Mouse Move Wrapper
  const handleMouseMove = useCallback((e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  // Touch Move Wrapper
  const handleTouchMove = useCallback((e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
  }, [handleMove, isDragging]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleInteractionEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleInteractionEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [isDragging, isResizing, handleMouseMove, handleTouchMove, handleInteractionEnd]);

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
      className={`fixed bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-lg flex flex-col border border-black/10 dark:border-white/10 overflow-hidden transition-shadow duration-200 ease-in-out ${isActive ? 'shadow-2xl ring-1 ring-black/5 dark:ring-white/10' : 'shadow-lg'}`}
      style={{ ...styles, zIndex }}
      onMouseDown={handleFocus}
      onTouchStart={handleFocus}
    >
      {/* Resizing Overlay: Provides visual feedback when resizing */}
      {isResizing && (
         <div className="absolute inset-0 z-50 border-2 border-blue-500 bg-blue-500/10 pointer-events-none" />
      )}

      {/* Resizers - Mouse Only */}
      {!isMaximized && (
        <>
            <div onMouseDown={(e) => onResizeMouseDown(e, 'top')} className="absolute -top-1 left-0 w-full h-4 cursor-ns-resize z-50 hover:bg-blue-500/20 transition-colors" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'bottom')} className="absolute -bottom-1 left-0 w-full h-4 cursor-ns-resize z-50 hover:bg-blue-500/20 transition-colors" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'left')} className="absolute top-0 -left-1 w-4 h-full cursor-ew-resize z-50 hover:bg-blue-500/20 transition-colors" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'right')} className="absolute top-0 -right-1 w-4 h-full cursor-ew-resize z-50 hover:bg-blue-500/20 transition-colors" />
            
            <div onMouseDown={(e) => onResizeMouseDown(e, 'top-left')} className="absolute -top-1 -left-1 w-5 h-5 cursor-nwse-resize z-50 hover:bg-blue-500/50 rounded-full" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'top-right')} className="absolute -top-1 -right-1 w-5 h-5 cursor-nesw-resize z-50 hover:bg-blue-500/50 rounded-full" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'bottom-left')} className="absolute -bottom-1 -left-1 w-5 h-5 cursor-nesw-resize z-50 hover:bg-blue-500/50 rounded-full" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'bottom-right')} className="absolute -bottom-1 -right-1 w-5 h-5 cursor-nwse-resize z-50 hover:bg-blue-500/50 rounded-full" />
        </>
      )}

      <header
        onMouseDown={onDragMouseDown}
        onTouchStart={onDragTouchStart}
        onDoubleClick={toggleMaximize}
        className={`h-10 flex items-center px-3 border-b border-black/5 dark:border-white/5 flex-shrink-0 group select-none ${!isMaximized && 'cursor-move'}`}
      >
        <div className="flex items-center space-x-2 mr-4">
            <button onClick={() => onClose(id)} title="Close" className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] border border-[#E0443E] flex items-center justify-center text-red-900 group/btn">
                <svg className="w-2 h-2 opacity-0 group-hover/btn:opacity-100" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M2,2 L10,10 M10,2 L2,10"/></svg>
            </button>
            <button onClick={() => onMinimize(id)} title="Minimize" className="w-3.5 h-3.5 rounded-full bg-[#FEBC2E] border border-[#D89E24] flex items-center justify-center text-yellow-900 group/btn">
                <svg className="w-2 h-2 opacity-0 group-hover/btn:opacity-100" viewBox="0 0 10 2" fill="currentColor"><path d="M0,0 H10 V2 H0 Z"/></svg>
            </button>
            <button onClick={toggleMaximize} title={isMaximized ? "Restore Down" : "Maximize"} className="w-3.5 h-3.5 rounded-full bg-[#28C840] border border-[#1AAB29] flex items-center justify-center text-green-900 group/btn">
                {isMaximized ? 
                    <svg className="w-2 h-2 opacity-0 group-hover/btn:opacity-100" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3,0 H10 V7 H7 M0,3 H7 V10 H0 Z"/></svg> :
                    <svg className="w-2 h-2 opacity-0 group-hover/btn:opacity-100" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M0,0 H10 V10 H0 Z"/></svg>
                }
            </button>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 opacity-80">
            <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <h2 className="font-medium text-xs text-gray-700 dark:text-gray-200 tracking-wide">{title}</h2>
        </div>
        <div className="w-14"></div> {/* Spacer */}
      </header>
      <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-900/50 relative">
        {/* Interaction blocker during resize to prevent iframe stealing mouse events */}
        {isResizing && <div className="absolute inset-0 z-40 bg-transparent" />}
        {children}
      </div>
    </div>
  );
};