import React from 'react';
import { WindowState } from '../types';

interface TaskbarProps {
  windows: WindowState[];
  onFocus: (id: string) => void;
  activeWindowId: string | null;
}

export const Taskbar: React.FC<TaskbarProps> = ({ windows, onFocus, activeWindowId }) => {
  if (windows.length === 0) {
    return null;
  }
  
  return (
    <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 mb-2 z-50">
      <div className="flex items-end justify-center space-x-2 p-2 bg-white/50 dark:bg-black/30 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/10 shadow-lg">
        {windows.map(win => {
          const Icon = win.icon;
          const isActive = win.id === activeWindowId && !win.isMinimized;
          const isRunning = !win.isMinimized;

          return (
            <div key={win.id} className="relative flex flex-col items-center">
              <button
                onClick={() => onFocus(win.id)}
                className={`relative flex items-center justify-center p-3 rounded-xl transition-all duration-200 transform hover:scale-110 ${isActive ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                title={win.title}
              >
                <Icon className="w-8 h-8 text-content-light dark:text-content-dark" />
              </button>
              {(isRunning || win.isMinimized) && (
                <div className={`absolute -bottom-1 h-1 rounded-full transition-all duration-200 ${win.isMinimized ? 'w-2 bg-gray-500' : isRunning ? 'w-2 bg-primary' : 'w-0'}`}></div>
              )}
            </div>
          );
        })}
      </div>
    </footer>
  );
};