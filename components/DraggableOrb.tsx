import React, { useState, useRef, useEffect } from 'react';

interface DraggableOrbProps {
  onClick: () => void;
  isSidebarOpen: boolean;
}

export const DraggableOrb: React.FC<DraggableOrbProps> = ({ onClick, isSidebarOpen }) => {
  const orbRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [wasDragged, setWasDragged] = useState(false);

  useEffect(() => {
    // Set initial position to bottom right, avoiding the taskbar
    const initialX = window.innerWidth - 80;
    const initialY = window.innerHeight - 80;
    setPosition({ x: initialX, y: initialY });
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!orbRef.current) return;
    setIsDragging(true);
    setWasDragged(false); // Reset drag state on new mousedown
    const rect = orbRef.current.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setWasDragged(true);
    let newX = e.clientX - offset.x;
    let newY = e.clientY - offset.y;
    
    const orbWidth = orbRef.current?.offsetWidth || 0;
    const orbHeight = orbRef.current?.offsetHeight || 0;

    // Constrain to viewport
    newX = Math.max(0, Math.min(newX, window.innerWidth - orbWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - orbHeight));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleClick = () => {
    // Only fire the click event if the orb was not dragged
    if (!wasDragged) {
      onClick();
    }
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset]);

  if (isSidebarOpen) {
    return null;
  }

  return (
    <div
      ref={orbRef}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      className={`fixed bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 transition-colors w-16 h-16 flex items-center justify-center z-50 cursor-grab active:cursor-grabbing`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none' // prevent scrolling on touch devices
      }}
      aria-label="Open AI Assistant"
    >
      <span className="font-bold select-none">AI</span>
    </div>
  );
};