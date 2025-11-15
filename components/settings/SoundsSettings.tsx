import React, { useState } from 'react';
import { SpeakerWaveIcon, MusicNoteIcon, BellIcon } from '../Icons';

const VolumeSlider: React.FC<{ label: string, icon: React.FC<any> }> = ({ label, icon: Icon }) => (
    <div className="flex items-center gap-4 py-2">
        <Icon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
    </div>
);

const ToggleRow: React.FC<{ title: string, description?: string }> = ({ title, description }) => {
    const [toggled, setToggled] = useState(true);
    return (
        <div className="flex justify-between items-center py-3">
            <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">{title}</p>
                {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
            </div>
            <button 
                onClick={() => setToggled(!toggled)} 
                role="switch" 
                aria-checked={toggled} 
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${toggled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${toggled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
};

export const SoundsSettings: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">Volume</h2>
                <VolumeSlider label="Master Volume" icon={SpeakerWaveIcon} />
                <VolumeSlider label="Media Volume" icon={MusicNoteIcon} />
                <VolumeSlider label="Alerts Volume" icon={BellIcon} />
            </div>

             <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">Sounds</h2>
                 <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <div className="flex justify-between items-center py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-100">Notification Sound</p>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Default</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-100">System Sound</p>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Aetherial</span>
                    </div>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">Haptics</h2>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <ToggleRow title="System Haptics" description="Feel feedback for system controls and interactions." />
                    <ToggleRow title="Keyboard Haptics" description="Feel feedback when typing." />
                </div>
            </div>
        </div>
    );
};