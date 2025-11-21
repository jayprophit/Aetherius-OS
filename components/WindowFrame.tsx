
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
  
  // Unified dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  
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
    // Don't prevent default immediately to allow scrolling if needed, 
    // but for a window header usually we want to grab it.
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
  };
  
  // Global End Handler
  const handleInteractionEnd = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Global Move Handler
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!desktopRect) return;

    if (isDragging) {
      let newX = clientX - dragOffset.x;
      let newY = clientY - dragOffset.y;

      // Relaxed boundaries: allow window to go partially offscreen but keep header visible
      // Keep at least 50px visible horizontally
      const minVisibleWidth = 50;
      const minVisibleHeight = 30; // Keep header somewhat visible
      
      newX = Math.max(minVisibleWidth - size.width, Math.min(newX, desktopRect.width - minVisibleWidth));
      newY = Math.max(0, Math.min(newY, desktopRect.height - minVisibleHeight));

      onUpdate(id, { position: { x: newX, y: newY } });
    }

    if (isResizing) {
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;
        
        // Calculate deltas based on current mouse position vs window edges would be cleaner,
        // but simplified relative movement works if we track start points. 
        // Here we just use movementX from MouseEvent which isn't available in raw coordinates easily without prev state.
        // Switched to absolute calculation for robustness.
        
        // Note: Implementing robust resize for touch is complex, sticking to mouse for resize for now 
        // as it's a precise operation usually done with a pointer.
    }
  }, [isDragging, isResizing, dragOffset, resizeDirection, id, onUpdate, position, size, desktopRect]);

  // Mouse Move Wrapper
  const handleMouseMove = useCallback((e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
      
      if (isResizing) {
        const dx = e.movementX;
        const dy = e.movementY;
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;

        if (resizeDirection.includes('right')) {
            newWidth = Math.max(MIN_WIDTH, size.width + dx);
        }
        if (resizeDirection.includes('bottom')) {
            newHeight = Math.max(MIN_HEIGHT, size.height + dy);
        }
        if (resizeDirection.includes('left')) {
            const calculatedWidth = size.width - dx;
            if (calculatedWidth >= MIN_WIDTH) {
                newWidth = calculatedWidth;
                newX = position.x + dx;
            }
        }
        if (resizeDirection.includes('top')) {
            const calculatedHeight = size.height - dy;
            if (calculatedHeight >= MIN_HEIGHT) {
                newHeight = calculatedHeight;
                newY = position.y + dy;
            }
        }
        onUpdate(id, { size: {width: newWidth, height: newHeight }, position: {x: newX, y: newY}});
      }

  }, [handleMove, isResizing, resizeDirection, size, position, onUpdate]);

  // Touch Move Wrapper
  const handleTouchMove = useCallback((e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault(); // Prevent scrolling while dragging window
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
      className={`fixed bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-lg flex flex-col border border-black/10 dark:border-white/10 overflow-hidden transition-shadow duration-200 ease-in-out ${isActive ? 'shadow-2xl ring-1 ring-black/5 dark:ring-white/10' : 'shadow-lg'}`}
      style={{ ...styles, zIndex }}
      onMouseDown={handleFocus}
      onTouchStart={handleFocus}
    >
      {/* Resizers - Mouse Only for now */}
      {!isMaximized && (
        <>
            <div onMouseDown={(e) => onResizeMouseDown(e, 'top')} className="absolute -top-1 left-0 w-full h-3 cursor-ns-resize z-50" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'bottom')} className="absolute -bottom-1 left-0 w-full h-3 cursor-ns-resize z-50" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'left')} className="absolute top-0 -left-1 w-3 h-full cursor-ew-resize z-50" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'right')} className="absolute top-0 -right-1 w-3 h-full cursor-ew-resize z-50" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'top-left')} className="absolute -top-1 -left-1 w-4 h-4 cursor-nwse-resize z-50" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'top-right')} className="absolute -top-1 -right-1 w-4 h-4 cursor-nesw-resize z-50" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'bottom-left')} className="absolute -bottom-1 -left-1 w-4 h-4 cursor-nesw-resize z-50" />
            <div onMouseDown={(e) => onResizeMouseDown(e, 'bottom-right')} className="absolute -bottom-1 -right-1 w-4 h-4 cursor-nwse-resize z-50" />
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
      <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-900/50">
        {children}
      </div>
    </div>
  );
};
