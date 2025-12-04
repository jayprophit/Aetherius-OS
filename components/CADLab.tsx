
import React, { useState } from 'react';
import { 
    RulerIcon, CubeTransparentIcon, ArrowsPointingOutIcon, 
    ArrowPathRoundedSquareIcon, MapPinIcon, EyeIcon,
    CalculatorIcon, CommandLineIcon, CubeIcon
} from './Icons';

export const CADLab: React.FC = () => {
    const [activeTool, setActiveTool] = useState('Select');
    const [viewMode, setViewMode] = useState<'2D' | '3D'>('3D');

    const tools = [
        { name: 'Select', icon: CubeIcon },
        { name: 'Line', icon: RulerIcon },
        { name: 'Extrude', icon: ArrowsPointingOutIcon },
        { name: 'Rotate', icon: ArrowPathRoundedSquareIcon },
        { name: 'Measure', icon: CalculatorIcon },
    ];

    return (
        <div className="flex h-full bg-gray-900 text-gray-100 font-sans">
            {/* Toolbar */}
            <aside className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 gap-4">
                {tools.map(tool => (
                    <button 
                        key={tool.name}
                        onClick={() => setActiveTool(tool.name)}
                        className={`p-3 rounded-xl transition-all ${activeTool === tool.name ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                        title={tool.name}
                    >
                        <tool.icon className="w-6 h-6" />
                    </button>
                ))}
            </aside>

            {/* Viewport */}
            <main className="flex-1 flex flex-col relative">
                {/* Viewport Header */}
                <div className="h-12 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between px-4 absolute top-0 left-0 right-0 z-10">
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('2D')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === '2D' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Top (2D)</button>
                        <button onClick={() => setViewMode('3D')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === '3D' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Perspective (3D)</button>
                        <button className="px-3 py-1 text-xs font-bold rounded text-gray-400 hover:text-white">Wireframe</button>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                        <span>X: 120.5</span>
                        <span>Y: 45.0</span>
                        <span>Z: 0.0</span>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-[#111] relative overflow-hidden cursor-crosshair">
                    {/* Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:200px_200px]"></div>
                    
                    {/* Origin */}
                    <div className="absolute top-1/2 left-1/2 w-full h-px bg-red-500/30 pointer-events-none"></div>
                    <div className="absolute top-0 left-1/2 h-full w-px bg-green-500/30 pointer-events-none"></div>

                    {/* 3D Object Representation */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-blue-500/50 bg-blue-500/10 rounded flex items-center justify-center group">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <div className="absolute -top-6 text-blue-500 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">Component_Alpha_v2</div>
                        {/* Simulated Wireframe */}
                        <div className="absolute inset-0 border border-blue-500/20 rotate-45 scale-75"></div>
                        <div className="absolute inset-0 border border-blue-500/20 -rotate-45 scale-75"></div>
                    </div>
                </div>

                {/* Command Line */}
                <div className="h-32 bg-gray-900 border-t border-gray-700 flex flex-col font-mono text-xs">
                    <div className="flex-1 p-2 overflow-y-auto text-gray-400">
                        <p>> Initialize workspace...</p>
                        <p>> Grid snap enabled (10mm)</p>
                        <p>> Select object ID: 8492</p>
                    </div>
                    <div className="h-8 border-t border-gray-700 flex items-center px-2 gap-2 bg-black">
                        <span className="text-blue-500">Command:</span>
                        <input type="text" className="bg-transparent border-none outline-none text-white flex-1" autoFocus />
                    </div>
                </div>
            </main>

            {/* Properties Panel */}
            <aside className="w-72 bg-gray-800 border-l border-gray-700 p-4 flex flex-col">
                <h3 className="text-sm font-bold text-gray-300 uppercase mb-4 border-b border-gray-700 pb-2">Properties</h3>
                
                <div className="space-y-4">
                    <div className="bg-gray-700/50 p-3 rounded">
                        <p className="text-xs text-gray-400 mb-1">Object Name</p>
                        <input type="text" value="Component_Alpha_v2" className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                         <div className="bg-gray-700/50 p-2 rounded">
                             <p className="text-[10px] text-gray-400 uppercase">Material</p>
                             <p className="text-sm font-bold text-blue-400">Aluminium</p>
                         </div>
                         <div className="bg-gray-700/50 p-2 rounded">
                             <p className="text-[10px] text-gray-400 uppercase">Mass</p>
                             <p className="text-sm font-bold text-gray-200">1.2 kg</p>
                         </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400">Transform</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <input type="number" value="0" className="bg-gray-900 border border-gray-600 rounded px-1 py-1 text-xs text-right" />
                            <input type="number" value="0" className="bg-gray-900 border border-gray-600 rounded px-1 py-1 text-xs text-right" />
                            <input type="number" value="0" className="bg-gray-900 border border-gray-600 rounded px-1 py-1 text-xs text-right" />
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-700">
                        <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded">Export STL</button>
                    </div>
                </div>
            </aside>
        </div>
    );
};
