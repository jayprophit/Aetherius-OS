
import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '../Icons';

const Card: React.FC<{ title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{title}</h2>
        {children}
    </div>
);

export const DisplaySettings: React.FC<{title: string}> = ({ title }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = theme === 'dark';
        
        root.classList.remove(isDark ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);

    }, [theme]);

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>
            <Card title="Appearance">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose your preferred look. The system will automatically switch between light and dark themes based on your OS preference if set to 'Auto'.</p>
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
            <Card title="Brightness">
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Adjust the brightness of the built-in display.</p>
                 <div className="flex items-center gap-4">
                    <SunIcon className="w-5 h-5 text-gray-500" />
                    <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    <SunIcon className="w-7 h-7 text-gray-500" />
                 </div>
            </Card>
        </div>
    );
};
