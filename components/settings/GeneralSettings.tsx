
import React, { useState } from 'react';
import { ChevronRightIcon } from '../Icons';
import { SettingsItem } from '../../types';

const ToggleSwitch: React.FC<{toggled: boolean, onToggle: (e: React.MouseEvent) => void}> = ({ toggled, onToggle }) => {
    return (
        <button onClick={onToggle} role="switch" aria-checked={toggled} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${toggled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${toggled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
};

const SettingsRow: React.FC<{ item: SettingsItem }> = ({ item }) => {
    const { icon: Icon, title, subtitle, type } = item;
    const [isToggled, setIsToggled] = useState(false);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsToggled(!isToggled);
        // In a real app, this would trigger a state change
    };

    return (
        <button 
            className="w-full flex items-center text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors disabled:hover:bg-transparent"
            disabled={type === 'toggle'}
        >
            {Icon && <Icon className="w-6 h-6 mr-4 text-gray-500 dark:text-gray-400" />}
            <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-gray-100">{title}</p>
                 {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
            {type === 'toggle' ? (
                <ToggleSwitch toggled={isToggled} onToggle={handleToggle} />
            ) : (
                 <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            )}
        </button>
    );
};

export const GeneralSettings: React.FC<{ title: string; items?: SettingsItem[] }> = ({ title, items = [] }) => {
    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map(item => (
                        <SettingsRow key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
};
