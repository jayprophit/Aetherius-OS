
import React, { useState } from 'react';

export const Notepad: React.FC = () => {
    const [text, setText] = useState('');

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
                <button className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">File</button>
                <button className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">Edit</button>
                <button className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">Format</button>
                <button className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">View</button>
                <button className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">Help</button>
            </div>
            <textarea 
                className="flex-1 w-full h-full p-4 resize-none outline-none bg-transparent text-gray-800 dark:text-gray-200 font-mono text-sm"
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
            />
            <div className="h-6 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center px-4 text-[10px] text-gray-500">
                Ln {text.split('\n').length}, Col {text.length} | UTF-8
            </div>
        </div>
    );
};
