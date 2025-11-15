import React from 'react';

export const PlaceholderView: React.FC<{ viewName: string, onSetView?: (view: string, context?: any) => void }> = ({ viewName }) => (
    <div className="flex items-center justify-center h-full p-4 sm:p-6 bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-6">
            <h1 className="text-2xl font-bold capitalize">{viewName.replace(/([A-Z])/g, ' $1').trim()}</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">This application is under construction.</p>
        </div>
    </div>
);
