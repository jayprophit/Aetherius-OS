
import React from 'react';
import { WindowState } from '../types';
import { Squares2X2Icon } from './Icons';

interface TaskbarProps {
  windows: WindowState[];
  onFocus: (id: string) => void;
  activeWindowId: string | null;
  activeWorkspace: number;
  onSwitchWorkspace: (workspace: number) => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ windows, onFocus, activeWindowId, activeWorkspace, onSwitchWorkspace }) => {
  return (
    <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 mb-2 z-50">
      <div className="flex items-center bg-white/50 dark:bg-black/30 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/10 shadow-lg px-4 py-2">
        
        {/* Window Apps */}
        <div className="flex items-end justify-center space-x-2">
            {windows.length === 0 && <div className="text-gray-500 dark:text-gray-400 text-xs font-medium px-2">Desktop {activeWorkspace + 1}</div>}
            {windows.map(win => {
            const Icon = win.icon;
            const isActive = win.id === activeWindowId && !win.isMinimized;
            const isRunning = !win.isMinimized;

            return (
                <div key={win.id} className="relative flex flex-col items-center group">
                <button
                    onClick={() => onFocus(win.id)}
                    className={`relative flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 transform hover:scale-110 ${isActive ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                    title={win.title}
                >
                    <Icon className="w-7 h-7 text-content-light dark:text-content-dark" />
                </button>
                {(isRunning || win.isMinimized) && (
                    <div className={`absolute -bottom-1 h-1 rounded-full transition-all duration-200 ${win.isMinimized ? 'w-1.5 bg-gray-500' : isRunning ? 'w-1.5 bg-primary' : 'w-0'}`}></div>
                )}
                </div>
            );
            })}
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-400/30 dark:bg-gray-600/30 mx-4"></div>

        {/* Workspace Switcher */}
        <div className="flex items-center space-x-1">
            {[0, 1, 2].map(ws => (
                <button
                    key={ws}
                    onClick={() => onSwitchWorkspace(ws)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 ${activeWorkspace === ws ? 'bg-black/20 dark:bg-white/20 text-black dark:text-white shadow-inner' : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    title={`Switch to Desktop ${ws + 1}`}
                >
                    {ws + 1}
                </button>
            ))}
        </div>

      </div>
    </footer>
  );
};
