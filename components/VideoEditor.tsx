
import React from 'react';
import { PlayIcon, ShareIcon, ArrowDownTrayIcon, ScissorsIcon, MusicNoteIcon, DocumentTextIcon } from './Icons';

const Toolbar: React.FC = () => (
    <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700" title="Export Video File">Export</button>
        </div>
        <span className="font-semibold">Untitled_Project.mp4</span>
        <div className="flex items-center gap-2">
             <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" title="Share Project Link"><ShareIcon className="w-4 h-4" /> Share</button>
             <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" title="Download Project Files"><ArrowDownTrayIcon className="w-4 h-4" /> Download</button>
        </div>
    </div>
);

const AssetPanel: React.FC = () => (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2">
            <button className="flex-1 p-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 rounded-md" title="Show Media Assets">Media</button>
            <button className="flex-1 p-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" title="Show Video Effects">Effects</button>
            <button className="flex-1 p-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" title="Show Text Overlays">Text</button>
        </div>
        <div className="flex-1 p-2 grid grid-cols-2 gap-2 overflow-y-auto">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md hover:ring-2 hover:ring-blue-500 cursor-pointer" title={`Drag Asset ${i+1} to Timeline`}></div>
            ))}
        </div>
    </div>
);

const Preview: React.FC = () => (
    <div className="flex-1 bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-gray-500" title="Video Preview Window">
            Preview Monitor
        </div>
        <div className="mt-4 flex items-center gap-4">
             <button className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600" title="Play/Pause Preview"><PlayIcon className="w-6 h-6"/></button>
        </div>
    </div>
);

const Timeline: React.FC = () => (
    <div className="h-48 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="h-8 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4">
            <button title="Split Clip at Playhead"><ScissorsIcon className="w-5 h-5"/></button>
        </div>
        <div className="flex-1 p-2 overflow-x-auto">
            {/* Timeline tracks placeholder */}
            <div className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-md flex items-center px-2 mb-2 gap-1" title="Video Track 1">
                <div className="w-24 h-10 bg-blue-300 rounded" title="Video Clip 1"></div>
                <div className="w-48 h-10 bg-blue-300 rounded" title="Video Clip 2"></div>
            </div>
             <div className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-md flex items-center px-2" title="Audio Track 1">
                 <div className="w-full h-4 bg-green-300 rounded" title="Audio Clip 1"></div>
             </div>
        </div>
    </div>
);

export const VideoEditor: React.FC = () => {
    return (
        <div className="h-full w-full flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
            <Toolbar />
            <div className="flex flex-1 overflow-hidden">
                <AssetPanel />
                <div className="flex-1 flex flex-col">
                    <Preview />
                    <Timeline />
                </div>
            </div>
        </div>
    );
};
