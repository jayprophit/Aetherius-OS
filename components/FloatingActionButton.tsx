import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HiveMindIcon, ShoppingCartIcon, PlusIcon } from './Icons';

interface FloatingActionButtonProps {
  onLaunchAi: () => void;
  showCart: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onLaunchAi, showCart }) => {
  const fabRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  
  const dragInfo = useRef({
    isDragging: false,
    hasDragged: false,
    offset: { x: 0, y: 0 },
  });

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

  useEffect(() => {
    const fabWidth = 64; 
    const margin = 20;
    const taskbarHeight = 48;

    let initialPos = { x: window.innerWidth - fabWidth - margin, y: window.innerHeight - fabWidth - margin - taskbarHeight };

    try {
      const savedPosition = localStorage.getItem('aetherius_fabPosition');
      if (savedPosition) {
        const parsed = JSON.parse(savedPosition);
        initialPos = {
          x: clamp(parsed.x, margin, window.innerWidth - fabWidth - margin),
          y: clamp(parsed.y, margin, window.innerHeight - fabWidth - margin - taskbarHeight)
        };
      }
    } catch (error) {
      console.error("Failed to parse FAB position:", error);
    }
    setPosition(initialPos);

    const handleResize = () => {
      const currentFabWidth = fabRef.current?.offsetWidth || fabWidth;
      const currentFabHeight = fabRef.current?.offsetHeight || fabWidth;
      setPosition(currentPos => ({
          x: clamp(currentPos.x, margin, window.innerWidth - currentFabWidth - margin),
          y: clamp(currentPos.y, margin, window.innerHeight - currentFabHeight - margin - taskbarHeight)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ('button' in e && e.button !== 0) return;
    
    dragInfo.current.isDragging = true;
    dragInfo.current.hasDragged = false;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragInfo.current.offset = {
      x: clientX - position.x,
      y: clientY - position.y
    };
    if ('preventDefault' in e) e.preventDefault();
  };

  const onDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragInfo.current.isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    if (!dragInfo.current.hasDragged) {
      const startX = dragInfo.current.offset.x + position.x;
      const startY = dragInfo.current.offset.y + position.y;
      const dx = clientX - startX;
      const dy = clientY - startY;
      if (Math.sqrt(dx*dx + dy*dy) > 5) {
        dragInfo.current.hasDragged = true;
      }
    }

    const fabWidth = fabRef.current?.offsetWidth || 64;
    const fabHeight = fabRef.current?.offsetHeight || 64;
    const margin = 20;
    const taskbarHeight = 48;

    let newX = clientX - dragInfo.current.offset.x;
    let newY = clientY - dragInfo.current.offset.y;

    newX = clamp(newX, margin, window.innerWidth - fabWidth - margin);
    newY = clamp(newY, margin, window.innerHeight - fabHeight - margin - taskbarHeight);
    
    setPosition({ x: newX, y: newY });
  }, [position.x, position.y]);

  const onDragEnd = useCallback(() => {
    if (dragInfo.current.isDragging) {
      if (dragInfo.current.hasDragged) {
        try {
          localStorage.setItem('aetherius_fabPosition', JSON.stringify(position));
        } catch (e) { console.error("Failed to save FAB position", e); }
      }
      dragInfo.current.isDragging = false;
    }
  }, [position]);

  useEffect(() => {
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove);
    document.addEventListener('touchend', onDragEnd);
    
    return () => {
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('touchend', onDragEnd);
    };
  }, [onDragMove, onDragEnd]);
  
  const handleMainClick = (e: React.MouseEvent) => {
    if (dragInfo.current.hasDragged) {
      e.preventDefault();
      return;
    }
    
    if (showCart) {
      setIsExpanded(prev => !prev);
    } else {
      onLaunchAi();
    }
  };
  
   useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isExpanded]);

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert('Opening shopping cart...');
    setIsExpanded(false);
  };
  
  const handleAiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLaunchAi();
    setIsExpanded(false);
  };

  return (
    <div
      ref={fabRef}
      className="fixed z-50 cursor-grab active:cursor-grabbing"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none'
      }}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
    >
        <div className="relative flex flex-col items-center">
            <div className={`transition-all duration-300 ease-in-out flex flex-col items-center gap-3 mb-3 ${isExpanded && showCart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                 <button 
                    onClick={handleCartClick}
                    className="w-14 h-14 bg-[#f56a32] rounded-full text-white flex items-center justify-center shadow-lg hover:bg-opacity-90 transition-all transform hover:scale-110 cursor-pointer"
                    aria-label="Open Shopping Cart"
                 >
                    <ShoppingCartIcon className="w-7 h-7" />
                 </button>
                 <button 
                    onClick={handleAiClick}
                    className="w-14 h-14 bg-gray-800 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-gray-700 transition-all transform hover:scale-110 cursor-pointer"
                    aria-label="Open AI Assistant"
                 >
                    <HiveMindIcon className="w-7 h-7" />
                 </button>
            </div>
            
            <div
                onClick={handleMainClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMainClick(e as any)}
                className={`bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all duration-200 w-16 h-16 flex items-center justify-center cursor-pointer`}
                aria-label="Open Actions Menu"
            >
                {showCart ? (
                    <PlusIcon className={`w-8 h-8 transition-transform duration-300 ${isExpanded ? 'rotate-45' : 'rotate-0'}`} />
                ) : (
                    <span className="font-bold text-xl select-none">AI</span>
                )}
            </div>
        </div>
    </div>
  );
};
