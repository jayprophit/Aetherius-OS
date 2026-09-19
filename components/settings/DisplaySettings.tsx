
import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon, SwatchIcon } from '../Icons';

const Card: React.FC<{ title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{title}</h2>
        {children}
    </div>
);

export const DisplaySettings: React.FC<{title: string, context?: any}> = ({ title, context }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [position, setPosition] = useState('bottom');
    const [alignment, setAlignment] = useState('start');
    
    // Access setters passed from App.tsx via context prop
    const setTaskbarConfig = context?.setTaskbarConfig || (() => console.warn("Taskbar config setter missing"));
    const setAccentColor = context?.setAccentColor || (() => console.warn("Accent color setter missing"));

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = theme === 'dark';
        
        root.classList.remove(isDark ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);

    }, [theme]);

    const updateTaskbar = (pos: string, align: string) => {
        setPosition(pos);
        setAlignment(align);
        setTaskbarConfig((prev: any) => ({ ...prev, position: pos, alignment: align }));
    };
    
    const updateAccent = (color: string) => {
        setAccentColor(color);
        localStorage.setItem('aetherius_accent', color);
    }

    const accents = [
        '#3b82f6', // Blue
        '#ef4444', // Red
        '#10b981', // Green
        '#f59e0b', // Yellow
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#6366f1', // Indigo
        '#14b8a6', // Teal
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>
            <Card title="Appearance">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose your preferred look.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => setTheme('light')} className={`p-4 rounded-lg border-2 text-center transition-colors ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
                        <div className="h-24 w-full bg-gray-50 rounded-md border border-gray-200 flex items-center justify-center mb-2">
                             <SunIcon className="w-8 h-8 text-gray-500" />
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">Light</span>
                    </button>
                    <button onClick={() => setTheme('dark')} className={`p-4 rounded-lg border-2 text-center transition-colors ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
                        <div className="h-24 w-full bg-gray-800 rounded-md border border-gray-700 flex items-center justify-center mb-2">
                             <MoonIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">Dark</span>
                    </button>
                </div>
            </Card>
            
            <Card title="System Accent Color">
                 <div className="flex flex-wrap gap-3">
                     {accents.map(color => (
                         <button 
                            key={color}
                            onClick={() => updateAccent(color)}
                            className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-md hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                         />
                     ))}
                 </div>
            </Card>

            <Card title="Taskbar Settings">
                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position</label>
                         <div className="flex gap-2">
                             {['bottom', 'top', 'left', 'right'].map(pos => (
                                 <button
                                    key={pos}
                                    onClick={() => updateTaskbar(pos, alignment)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md border capitalize ${position === pos ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                                 >
                                     {pos}
                                 </button>
                             ))}
                         </div>
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alignment</label>
                         <div className="flex gap-2">
                             {['start', 'center'].map(align => (
                                 <button
                                    key={align}
                                    onClick={() => updateTaskbar(position, align)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md border capitalize ${alignment === align ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
                                 >
                                     {align}
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>
            </Card>
            
            <Card title="Brightness">
                 <div className="flex items-center gap-4">
                    <SunIcon className="w-5 h-5 text-gray-500" />
                    <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    <SunIcon className="w-7 h-7 text-gray-500" />
                 </div>
            </Card>
        </div>
    );
};
