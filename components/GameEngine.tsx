
import React, { useState } from 'react';
import { 
    PlayIcon, PauseIcon, StopIcon, FolderIcon, CodeBracketIcon, CubeIcon, CameraIcon, 
    LightBulbIcon, ChevronRightIcon, ArrowsUpDownLeftRightIcon, ArrowPathRoundedSquareIcon, 
    ArrowsPointingOutIcon, HiveMindIcon, Cog6ToothIcon, CubeTransparentIcon
} from './Icons';

const Toolbar: React.FC = () => (
    <header className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-2 flex-shrink-0">
        <div className="flex items-center gap-1">
            {['File', 'Edit', 'Assets', 'GameObject', 'Component', 'AI', 'Window', 'Help'].map(menu => (
                <button key={menu} className="px-3 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700" title={`Show ${menu} menu`}>{menu}</button>
            ))}
        </div>
        <div className="flex items-center gap-2">
            <button title="Start Game Simulation" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><PlayIcon className="w-5 h-5"/></button>
            <button title="Pause Game Simulation" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><PauseIcon className="w-5 h-5"/></button>
            <button title="Stop Game Simulation" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><StopIcon className="w-5 h-5"/></button>
        </div>
        <div className="w-48"></div> {/* Spacer */}
    </header>
);

const SceneHierarchy: React.FC<{ onSelect: (item: string) => void, selected: string }> = ({ onSelect, selected }) => {
    const sceneItems = [
        { name: 'Main Camera', icon: CameraIcon },
        { name: 'Directional Light', icon: LightBulbIcon },
        { name: 'Player Character', icon: CubeIcon },
        { name: 'Ground Plane', icon: CubeTransparentIcon },
        { name: 'AI NPC Manager', icon: HiveMindIcon },
    ];
    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-2 flex flex-col">
            <h3 className="font-bold text-sm px-2 py-1">Scene</h3>
            <div className="flex-1 overflow-y-auto space-y-1 mt-2">
                {sceneItems.map(item => (
                    <button 
                        key={item.name} 
                        onClick={() => onSelect(item.name)}
                        className={`w-full flex items-center gap-2 p-1.5 text-sm rounded ${selected === item.name ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                        title={`Select ${item.name} in hierarchy`}
                    >
                        <item.icon className="w-4 h-4 text-gray-500" />
                        <span>{item.name}</span>
                    </button>
                ))}
            </div>
        </aside>
    );
};

const Inspector: React.FC<{ selectedItem: string | null }> = ({ selectedItem }) => (
    <aside className="w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-3 overflow-y-auto">
        <h3 className="font-bold text-sm mb-3">Inspector</h3>
        {selectedItem ? (
            <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-md">
                    <p className="text-xs font-semibold p-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">{selectedItem}</p>
                    <div className="p-2 space-y-2 text-xs">
                        <p><strong>Tag:</strong> Player</p>
                        <p><strong>Layer:</strong> Default</p>
                    </div>
                </div>
                 <div className="border border-gray-200 dark:border-gray-700 rounded-md">
                    <p className="text-xs font-semibold p-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">Transform</p>
                    <div className="p-2 space-y-2 text-xs font-mono">
                        <p>Position: X:0 Y:0.5 Z:0</p>
                        <p>Rotation: X:0 Y:0 Z:0</p>
                        <p>Scale:    X:1 Y:1 Z:1</p>
                    </div>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-md">
                    <p className="text-xs font-semibold p-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">Mesh Renderer</p>
                </div>
                 <button className="w-full text-sm py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-semibold" title="Add Component to Object">Add Component</button>
            </div>
        ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">Select an object to inspect its properties.</p>
        )}
    </aside>
);

const AssetBrowser: React.FC = () => {
    const assets = [
        { name: 'Materials', icon: FolderIcon },
        { name: 'Models', icon: FolderIcon },
        { name: 'Prefabs', icon: FolderIcon },
        { name: 'Scripts', icon: FolderIcon },
        { name: 'PlayerController.js', icon: CodeBracketIcon },
    ];
    return (
        <div className="p-2 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {assets.map(asset => (
                <div key={asset.name} className="flex flex-col items-center p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer" title={`Open ${asset.name} folder/file`}>
                    <asset.icon className="w-10 h-10 text-gray-500" />
                    <p className="text-xs text-center truncate w-full">{asset.name}</p>
                </div>
            ))}
        </div>
    );
};

const AITools: React.FC = () => (
    <div className="p-4 space-y-4">
        <h4 className="font-semibold">AI-Powered Tools</h4>
        <div className="space-y-2">
            <button className="w-full text-left p-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700/50" title="Generate procedural terrain and objects">Procedural Content Generation</button>
            <button className="w-full text-left p-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700/50" title="Configure NPC behavior logic">NPC Behavior Trees</button>
            <button className="w-full text-left p-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700/50" title="Analyze player data for adaptive difficulty">Adaptive Gameplay Analysis</button>
        </div>
    </div>
);


export const GameEngine: React.FC = () => {
    const [selectedObject, setSelectedObject] = useState<string | null>('Player Character');
    const [activeBottomTab, setActiveBottomTab] = useState('Assets');

    return (
        <div className="h-full w-full flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
            <Toolbar />
            <div className="flex flex-1 overflow-hidden">
                <SceneHierarchy onSelect={setSelectedObject} selected={selectedObject!} />
                <main className="flex-1 flex flex-col">
                    <div className="h-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-2 gap-1">
                        <button className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded" title="Move Tool - Shortcut W"><ArrowsUpDownLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-300"/></button>
                        <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Rotate Tool - Shortcut E"><ArrowPathRoundedSquareIcon className="w-5 h-5"/></button>
                        <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title="Scale Tool - Shortcut R"><ArrowsPointingOutIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="flex-1 bg-black flex items-center justify-center text-gray-600">
                        3D Viewport
                    </div>
                    <footer className="h-48 flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col">
                         <div className="flex border-b border-gray-200 dark:border-gray-700">
                            {['Assets', 'Console', 'Animation', 'AI Tools'].map(tab => (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveBottomTab(tab)}
                                    className={`px-3 py-1.5 text-sm font-semibold ${activeBottomTab === tab ? 'bg-gray-100 dark:bg-gray-700/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/20'}`}
                                    title={`Open ${tab} panel`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-auto">
                            {activeBottomTab === 'Assets' && <AssetBrowser />}
                            {activeBottomTab === 'Console' && <div className="p-2 text-xs font-mono text-gray-500 dark:text-gray-400">Console output...</div>}
                            {activeBottomTab === 'Animation' && <div className="p-2 text-xs text-gray-500 dark:text-gray-400">Animation Timeline...</div>}
                            {activeBottomTab === 'AI Tools' && <AITools />}
                        </div>
                    </footer>
                </main>
                <Inspector selectedItem={selectedObject} />
            </div>
            <footer className="h-6 bg-gray-200 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 flex items-center px-3 text-xs font-mono justify-end gap-4">
                <span>vQPU: Active</span>
                <span>Time Crystal: Stable</span>
                <span>AI NPC Manager: Idle</span>
            </footer>
        </div>
    );
};
