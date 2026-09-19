import React from 'react';
import { Cog6ToothIcon } from '../Icons';

export const PlaceholderSettings: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
            <Cog6ToothIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 animate-spin" style={{ animationDuration: '5s' }} />
            <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">{title} Settings</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
                Configuration for this section is currently under development.
            </p>
        </div>
    );
};
