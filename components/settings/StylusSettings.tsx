import React, { useState } from 'react';
import { FingerPrintIcon, StylusIcon } from '../Icons';

const Card: React.FC<{ title: string, children: React.ReactNode, icon?: React.FC<any>}> = ({ title, children, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-3">
            {Icon && <Icon className="w-6 h-6 text-gray-500 dark:text-gray-400" />}
            {title}
        </h2>
        {children}
    </div>
);

const ToggleRow: React.FC<{ title: string, description?: string, initialValue?: boolean }> = ({ title, description, initialValue = true }) => {
    const [toggled, setToggled] = useState(initialValue);
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

export const StylusSettings: React.FC<{ title: string }> = ({ title }) => {
    const [hand, setHand] = useState('right');

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>
            
            <Card title="Handwriting" icon={StylusIcon}>
                <div className="space-y-3">
                    <p className="font-medium">Choose which hand you write with:</p>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input type="radio" name="hand-select" value="left" checked={hand === 'left'} onChange={() => setHand('left')} className="form-radio text-blue-600" />
                            <span>Left Hand</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" name="hand-select" value="right" checked={hand === 'right'} onChange={() => setHand('right')} className="form-radio text-blue-600" />
                            <span>Right Hand</span>
                        </label>
                    </div>
                </div>
            </Card>

            <Card title="Pen Shortcuts" icon={StylusIcon}>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Customize what happens when you use your pen's barrel button.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Single-Click</label>
                        <select className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm">
                            <option>Open AI Hub</option>
                            <option>Take Screenshot</option>
                            <option>Open Notes</option>
                            <option>None</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Double-Click</label>
                        <select className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm">
                            <option>Take Screenshot</option>
                            <option>Open AI Hub</option>
                            <option>Open Notes</option>
                            <option>None</option>
                        </select>
                    </div>
                </div>
            </Card>
            
            <Card title="Touch" icon={FingerPrintIcon}>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <ToggleRow title="Tap to Click" description="Tap the screen with one finger to click." initialValue={true} />
                    <ToggleRow title="Three-finger Gestures" description="Swipe up for Mission Control, left/right to switch apps." initialValue={true} />
                    <ToggleRow title="Palm Rejection" description="Ignore touch input from your palm when using a stylus." initialValue={true} />
                </div>
            </Card>
        </div>
    );
};