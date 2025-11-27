
import React, { useState } from 'react';
import { WindowState, TaskbarConfig } from '../types';
import { 
    Squares2X2Icon, WifiIcon, BatteryIcon, SpeakerWaveIcon, 
    ChevronDownIcon, BellIcon, CalendarIcon, GyeNyameIcon 
} from './Icons';
import { LaunchableApp } from '../App';
import { StartMenu } from './StartMenu';

interface TaskbarProps {
  windows: WindowState[];
  onFocus: (id: string) => void;
  activeWindowId: string | null;
  activeWorkspace: number;
  onSwitchWorkspace: (workspace: number) => void;
  config: TaskbarConfig;
  onLaunchApp: (app: LaunchableApp) => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ 
    windows, onFocus, activeWindowId, activeWorkspace, onSwitchWorkspace, config, onLaunchApp 
}) => {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [volume, setVolume] = useState(80);

  // Dynamic Styles based on position
  const isVertical = config.position === 'left' || config.position === 'right';
  
  const containerClasses = `
    fixed z-[50] flex bg-gray-200/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-300/50 dark:border-gray-700/50 shadow-lg transition-all duration-300
    ${config.position === 'bottom' ? 'bottom-0 left-0 right-0 h-12 flex-row border-t' : ''}
    ${config.position === 'top' ? 'top-0 left-0 right-0 h-12 flex-row border-b' : ''}
    ${config.position === 'left' ? 'left-0 top-0 bottom-0 w-16 flex-col border-r' : ''}
    ${config.position === 'right' ? 'right-0 top-0 bottom-0 w-16 flex-col border-l' : ''}
  `;

  const appListClasses = `
    flex items-center gap-1 p-1 flex-1
    ${isVertical ? 'flex-col w-full overflow-y-auto overflow-x-hidden py-2' : 'flex-row h-full px-2 justify-start'}
    ${config.alignment === 'center' && !isVertical ? 'justify-center' : ''}
  `;

  const trayClasses = `
    flex items-center gap-3 px-3
    ${isVertical ? 'flex-col py-4 border-t border-gray-300/30 dark:border-gray-700/30' : 'flex-row h-full border-l border-gray-300/30 dark:border-gray-700/30'}
  `;

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString();

  return (
    <>
        {startMenuOpen && (
            <StartMenu 
                onLaunchApp={onLaunchApp} 
                onClose={() => setStartMenuOpen(false)} 
                config={config}
            />
        )}

        <footer className={containerClasses}>
            
            {/* Start Button */}
            <div className={`flex items-center justify-center p-1 ${isVertical ? 'w-full h-16 border-b border-gray-300/30 dark:border-gray-700/30' : 'h-full px-2'}`}>
                <button 
                    onClick={() => setStartMenuOpen(!startMenuOpen)}
                    className={`p-2 rounded-md transition-all duration-200 group relative ${startMenuOpen ? 'bg-white/20 dark:bg-white/10' : 'hover:bg-white/20 dark:hover:bg-white/10'}`}
                    title="Start"
                >
                    <GyeNyameIcon className="w-7 h-7 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                </button>
            </div>

            {/* App List */}
            <div className={appListClasses}>
                {windows.map(win => {
                    const Icon = win.icon;
                    const isActive = win.id === activeWindowId && !win.isMinimized;
                    const isRunning = !win.isMinimized;

                    return (
                        <button
                            key={win.id}
                            onClick={() => onFocus(win.id)}
                            className={`relative flex items-center justify-center p-2 rounded-md transition-all duration-200 group ${isActive ? 'bg-white/40 dark:bg-white/10 shadow-sm' : 'hover:bg-white/20 dark:hover:bg-white/5'}`}
                            title={win.title}
                        >
                            <Icon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                            
                            {/* Running Indicator */}
                            <div className={`absolute rounded-full transition-all duration-300 ${isVertical ? 'left-0.5 top-1/2 -translate-y-1/2 w-1 h-4' : 'bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1'} ${isActive ? 'bg-blue-500' : isRunning ? 'bg-gray-400' : 'opacity-0'}`}></div>
                        </button>
                    );
                })}
            </div>

            {/* System Tray */}
            <div className={trayClasses}>
                {!isVertical && (
                    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 cursor-pointer group relative" title="System Status">
                        <ChevronDownIcon className="w-3 h-3 text-gray-500 group-hover:rotate-180 transition-transform" />
                    </div>
                )}

                <div className={`flex items-center gap-3 ${isVertical ? 'flex-col gap-4' : 'flex-row'}`}>
                    <button className="text-gray-600 dark:text-gray-300 hover:text-blue-500 relative" title={`Volume: ${volume}%`}>
                        <SpeakerWaveIcon className="w-4 h-4" />
                    </button>
                    
                    <div className="text-gray-600 dark:text-gray-300" title="Network: Connected">
                        <WifiIcon className="w-4 h-4" />
                    </div>
                    
                    <div className="text-gray-600 dark:text-gray-300 relative" title="Battery: 85%">
                        <BatteryIcon className="w-5 h-5" />
                        <div className="absolute top-1.5 left-0.5 h-2 bg-green-500 rounded-[1px]" style={{width: '70%'}}></div>
                    </div>
                </div>

                {/* Clock */}
                <div className={`flex flex-col items-center justify-center text-xs text-gray-700 dark:text-gray-200 cursor-default px-2 py-1 rounded hover:bg-white/10 ${isVertical ? 'mt-2 text-[10px]' : 'ml-2'}`}>
                    <span className="font-bold">{currentTime}</span>
                    {!isVertical && <span>{currentDate}</span>}
                </div>

                <button className="text-gray-600 dark:text-gray-300 hover:text-blue-500 ml-1" title="Notifications">
                    <BellIcon className="w-4 h-4" />
                </button>
            </div>
        </footer>
    </>
  );
};
