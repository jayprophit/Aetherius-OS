import React from 'react';
import { FolderIcon, ImageIcon, DocumentTextIcon } from '../Icons';

const StorageBar: React.FC = () => {
    const usage = [
        { name: 'Apps', value: 40, color: 'bg-blue-500' },
        { name: 'Photos', value: 25, color: 'bg-green-500' },
        { name: 'Documents', value: 15, color: 'bg-yellow-500' },
    ];
    const totalUsed = usage.reduce((acc, item) => acc + item.value, 0);

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{totalUsed} GB of 100 GB Used</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Free: {100-totalUsed} GB</p>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                {usage.map(item => (
                    <div key={item.name} className={item.color} style={{ width: `${item.value}%` }} />
                ))}
            </div>
             <div className="flex justify-start items-center gap-4 mt-3 text-xs">
                {usage.map(item => (
                     <div key={item.name} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const CloudStorageSettings: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <StorageBar />
                <button className="mt-6 w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                    Upgrade Storage
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold p-4 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">Apps Using Storage</h2>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    <li className="flex justify-between items-center p-4">
                        <div className="flex items-center gap-3">
                            <FolderIcon className="w-6 h-6 text-gray-500" />
                            <span className="font-medium">App Data</span>
                        </div>
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">40 GB</span>
                    </li>
                    <li className="flex justify-between items-center p-4">
                        <div className="flex items-center gap-3">
                            <ImageIcon className="w-6 h-6 text-gray-500" />
                            <span className="font-medium">Photos & Videos</span>
                        </div>
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">25 GB</span>
                    </li>
                     <li className="flex justify-between items-center p-4">
                        <div className="flex items-center gap-3">
                            <DocumentTextIcon className="w-6 h-6 text-gray-500" />
                            <span className="font-medium">Documents</span>
                        </div>
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">15 GB</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};