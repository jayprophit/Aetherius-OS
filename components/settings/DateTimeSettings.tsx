
import React, { useState, useEffect } from 'react';
import { ClockIcon, GlobeAltIcon, CheckCircleIcon } from '../Icons';

const Card: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{title}</h2>
        {children}
    </div>
);

const ToggleRow: React.FC<{ title: string, description?: string, checked: boolean, onChange: () => void }> = ({ title, description, checked, onChange }) => (
    <div className="flex justify-between items-center py-3">
        <div>
            <p className="font-medium text-gray-800 dark:text-gray-100">{title}</p>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        <button 
            onClick={onChange} 
            role="switch" 
            aria-checked={checked} 
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

export const DateTimeSettings: React.FC<{ title: string }> = ({ title }) => {
    const [autoSet, setAutoSet] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1 flex items-center gap-3">
                <ClockIcon className="w-8 h-8 text-blue-500"/>
                {title}
            </h1>

            <Card title="Current Time">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                     <div className="text-3xl font-mono font-bold text-gray-800 dark:text-gray-100">{currentTime}</div>
                     <div className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
            </Card>
            
            <Card title="Synchronization">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <ToggleRow 
                        title="Set time automatically" 
                        description="Use the network time server provided by Aetherius." 
                        checked={autoSet}
                        onChange={() => setAutoSet(!autoSet)}
                    />
                    
                    {!autoSet && (
                        <div className="py-3">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manual Time</label>
                             <input type="time" className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm"/>
                        </div>
                    )}

                    <div className="py-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-100">Time Zone</p>
                                <p className="text-sm text-green-500 flex items-center gap-1">
                                    <GlobeAltIcon className="w-3 h-3"/> {timeZone} (Detected)
                                </p>
                            </div>
                             {autoSet && <CheckCircleIcon className="w-5 h-5 text-green-500"/>}
                        </div>
                    </div>
                </div>
            </Card>

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Synced with atomic clock server: time.aetherius.net
            </div>
        </div>
    );
};