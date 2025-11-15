import React from 'react';
import { RulerIcon } from './Icons';

export const CADLab: React.FC = () => (
    <div className="flex items-center justify-center h-full p-4 sm:p-6 bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-6">
            <RulerIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">CAD Lab</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">This application is under construction.</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tools and programs for CAD will be available here.</p>
        </div>
    </div>
);
