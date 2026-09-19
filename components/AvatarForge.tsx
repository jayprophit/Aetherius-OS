import React, { useState } from 'react';
import { UserCircleIcon, ChevronDownIcon, PaintBrushIcon } from './Icons';

const Slider: React.FC<{ label: string }> = ({ label }) => (
    <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
        <input type="range" min="0" max="100" defaultValue="50" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
    </div>
);

const Accordion: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3">
                <span className="font-semibold">{title}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-3 pt-0 space-y-4">{children}</div>}
        </div>
    );
};

export const AvatarForge: React.FC = () => {
    return (
        <div className="flex h-full bg-gray-100 dark:bg-gray-900">
            {/* Left Panel: Controls */}
            <aside className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <header className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold flex items-center gap-2"><UserCircleIcon className="w-6 h-6" /> Avatar Forge</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create your digital identity.</p>
                </header>
                <div className="flex-1 overflow-y-auto">
                    <Accordion title="Face">
                        <Slider label="Jaw Width" />
                        <Slider label="Nose Shape" />
                        <Slider label="Eye Size" />
                        <Slider label="Lip Fullness" />
                    </Accordion>
                    <Accordion title="Body">
                        <Slider label="Height" />
                        <Slider label="Width" />
                        <Slider label="Muscle Definition" />
                        <Slider label="Torso Length" />
                    </Accordion>
                    <Accordion title="Hair">
                        <p className="text-sm">Style presets will go here.</p>
                    </Accordion>
                    <Accordion title="Colors">
                        <div className="flex items-center gap-2">
                           <PaintBrushIcon className="w-5 h-5"/> <span className="font-semibold">Skin Tone</span>
                        </div>
                        <input type="color" defaultValue="#ffcc99" className="w-full h-8 mt-2" />
                         <div className="flex items-center gap-2 mt-4">
                           <PaintBrushIcon className="w-5 h-5"/> <span className="font-semibold">Hair Color</span>
                        </div>
                        <input type="color" defaultValue="#4a2a0a" className="w-full h-8 mt-2" />
                    </Accordion>
                </div>
                 <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700">Save Avatar</button>
                </footer>
            </aside>
            {/* Right Panel: Preview */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full h-full bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <div className="w-64 h-96 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
                        3D Avatar Preview
                    </div>
                </div>
            </main>
        </div>
    );
};