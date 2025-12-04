
import React, { useState, useEffect } from 'react';
import { 
    MusicNoteIcon, VideoIcon, PhotoIcon, PlayIcon, PauseIcon, 
    StopIcon, AdjustmentsHorizontalIcon, SpeakerWaveIcon, 
    ScissorsIcon, ArrowPathIcon, PlusIcon, LayersIcon, 
    PaintBrushIcon, CursorArrowRaysIcon, Square2StackIcon,
    EyeIcon
} from './Icons';

// --- MUSIC PRODUCTION (DAW) ---
const MusicStudio: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playhead, setPlayhead] = useState(0);
    const [tracks, setTracks] = useState([
        { id: 1, name: 'Drums', color: 'bg-red-500', clips: [{ start: 0, width: 20 }, { start: 25, width: 20 }, { start: 50, width: 20 }] },
        { id: 2, name: 'Bass', color: 'bg-blue-500', clips: [{ start: 0, width: 40 }, { start: 45, width: 40 }] },
        { id: 3, name: 'Synth Lead', color: 'bg-purple-500', clips: [{ start: 10, width: 30 }, { start: 60, width: 30 }] },
        { id: 4, name: 'Pad', color: 'bg-green-500', clips: [{ start: 0, width: 80 }] },
        { id: 5, name: 'Vocals', color: 'bg-yellow-500', clips: [{ start: 15, width: 25 }, { start: 45, width: 30 }] },
    ]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying) {
            interval = setInterval(() => {
                setPlayhead(p => (p >= 100 ? 0 : p + 0.5));
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-300">
            {/* Transport Bar */}
            <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-900 rounded-lg p-1">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:text-white">
                            {isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                        </button>
                        <button onClick={() => { setIsPlaying(false); setPlayhead(0); }} className="p-2 hover:text-white">
                            <StopIcon className="w-5 h-5"/>
                        </button>
                        <button className="p-2 hover:text-white text-red-500">
                            <div className="w-4 h-4 rounded-full bg-current"></div>
                        </button>
                    </div>
                    <div className="font-mono text-xl text-green-400 bg-black px-3 py-1 rounded">
                        00:0{Math.floor(playhead / 10)}:{(playhead % 10).toFixed(2)}
                    </div>
                    <div className="flex gap-4 text-xs font-bold text-gray-500">
                        <div className="flex flex-col items-center"><span>BPM</span><span className="text-white">128</span></div>
                        <div className="flex flex-col items-center"><span>KEY</span><span className="text-white">Fmin</span></div>
                        <div className="flex flex-col items-center"><span>TIME</span><span className="text-white">4/4</span></div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">MASTER</span>
                    <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full bg-green-500 origin-left transition-transform duration-75 ${isPlaying ? 'scale-x-75 animate-pulse' : 'scale-x-0'}`}></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Track Headers */}
                <div className="w-48 bg-gray-800 border-r border-gray-700 flex flex-col">
                    {tracks.map(track => (
                        <div key={track.id} className="h-20 border-b border-gray-700 p-2 flex flex-col justify-center bg-gray-800 hover:bg-gray-750">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-sm text-white">{track.name}</span>
                                <div className={`w-3 h-3 rounded-full ${track.color}`}></div>
                            </div>
                            <div className="flex gap-1">
                                <button className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-600">M</button>
                                <button className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-600">S</button>
                                <button className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-600">R</button>
                                <input type="range" className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer ml-auto mt-1.5" />
                            </div>
                        </div>
                    ))}
                    <button className="m-2 py-2 border border-dashed border-gray-600 rounded text-xs hover:border-gray-400 hover:text-white">+ Add Track</button>
                </div>

                {/* Timeline */}
                <div className="flex-1 bg-gray-900 relative overflow-x-auto overflow-y-hidden">
                    {/* Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,#374151_1px,transparent_1px)] bg-[size:10%_100%] opacity-20"></div>
                    
                    {/* Tracks */}
                    <div className="relative min-w-full">
                        {tracks.map((track, i) => (
                            <div key={track.id} className="h-20 border-b border-gray-800 relative">
                                {track.clips.map((clip, c) => (
                                    <div 
                                        key={c}
                                        className={`absolute top-1 bottom-1 rounded opacity-80 border border-white/20 ${track.color}`}
                                        style={{ left: `${clip.start}%`, width: `${clip.width}%` }}
                                    >
                                        <div className="w-full h-full bg-black/10 flex items-center px-2">
                                            <span className="text-[10px] font-bold text-white/80 truncate">{track.name}_take_{c+1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        {/* Playhead */}
                        <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-75 ease-linear"
                            style={{ left: `${playhead}%` }}
                        >
                            <div className="w-3 h-3 bg-red-500 -ml-1.5 transform rotate-45 -mt-1.5"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mixer / Editor Panel */}
            <div className="h-48 bg-gray-800 border-t border-gray-700 p-4 flex gap-4 overflow-x-auto">
                {tracks.map(track => (
                    <div key={track.id} className="w-16 bg-gray-900 border border-gray-700 rounded flex flex-col items-center p-2 pb-1">
                        <span className="text-[10px] truncate w-full text-center mb-2">{track.name}</span>
                        <div className="flex-1 w-2 bg-gray-800 rounded-full relative overflow-hidden">
                             <div className={`absolute bottom-0 w-full ${track.color} opacity-80 transition-all duration-100`} style={{ height: isPlaying ? `${Math.random() * 80 + 10}%` : '0%' }}></div>
                        </div>
                        <div className="mt-2 w-full h-8 bg-gray-800 rounded flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-2 border-gray-600 border-t-gray-400 transform rotate-45"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- VIDEO PRODUCTION (NLE) ---
const VideoStudio: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-300">
            {/* Top Section */}
            <div className="flex-1 flex min-h-0">
                {/* Assets */}
                <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
                    <div className="p-3 border-b border-gray-700 font-bold text-sm">Project Media</div>
                    <div className="p-2 grid grid-cols-2 gap-2 overflow-y-auto">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="aspect-video bg-gray-700 rounded border border-gray-600 hover:border-blue-500 cursor-grab relative group">
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                    <PlusIcon className="w-6 h-6 text-white"/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview */}
                <div className="flex-1 bg-black flex flex-col p-4">
                    <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="text-gray-600 font-mono text-xs">NO SIGNAL</div>
                        {/* Overlay controls */}
                        <div className="absolute bottom-4 flex gap-4">
                            <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"><PlayIcon className="w-5 h-5 text-white"/></button>
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-mono text-gray-500">
                        <span>00:00:00:00</span>
                        <span>1920x1080 @ 60fps</span>
                    </div>
                </div>

                {/* Properties */}
                <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
                    <h3 className="font-bold text-sm mb-4 text-white">Effect Controls</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs block mb-1">Position X</label>
                            <input type="range" className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                        </div>
                        <div>
                            <label className="text-xs block mb-1">Position Y</label>
                            <input type="range" className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                        </div>
                        <div>
                            <label className="text-xs block mb-1">Scale</label>
                            <input type="range" className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                        </div>
                         <div>
                            <label className="text-xs block mb-1">Opacity</label>
                            <input type="range" className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="h-64 bg-gray-800 border-t border-gray-700 flex flex-col">
                <div className="h-8 border-b border-gray-700 flex items-center px-2 gap-2">
                    <button className="p-1 hover:bg-gray-700 rounded"><ScissorsIcon className="w-4 h-4"/></button>
                    <button className="p-1 hover:bg-gray-700 rounded"><CursorArrowRaysIcon className="w-4 h-4"/></button>
                </div>
                <div className="flex-1 relative overflow-x-auto">
                    <div className="absolute top-0 bottom-0 w-px bg-red-500 left-[20%] z-20"></div>
                    {[1,2,3].map(track => (
                        <div key={track} className="h-12 border-b border-gray-700/50 relative bg-gray-900/50">
                            <div className="absolute top-1 bottom-1 left-10 w-40 bg-blue-600/50 border border-blue-400/50 rounded cursor-pointer"></div>
                            <div className="absolute top-1 bottom-1 left-60 w-60 bg-purple-600/50 border border-purple-400/50 rounded cursor-pointer"></div>
                        </div>
                    ))}
                    <div className="h-8 border-b border-gray-700/50 relative bg-gray-900/30 mt-2">
                        <div className="absolute top-1 bottom-1 left-10 w-96 bg-green-600/50 border border-green-400/50 rounded cursor-pointer">
                            <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                <div className="w-full h-4 border-t border-b border-green-300/20"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- GRAPHIC DESIGN (IMAGE) ---
const ImageStudio: React.FC = () => {
    return (
        <div className="flex h-full bg-gray-200 dark:bg-gray-900">
            {/* Toolbar */}
            <div className="w-12 bg-gray-800 flex flex-col items-center py-4 gap-3 shrink-0">
                {[CursorArrowRaysIcon, PaintBrushIcon, ScissorsIcon, AdjustmentsHorizontalIcon, PhotoIcon, Square2StackIcon].map((Icon, i) => (
                    <button key={i} className={`p-2 rounded-lg transition-colors ${i===1 ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                        <Icon className="w-5 h-5"/>
                    </button>
                ))}
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-gray-300 dark:bg-gray-950 flex items-center justify-center relative overflow-hidden p-8">
                <div className="bg-white w-[800px] h-[600px] shadow-2xl relative">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-red-500 rounded-full mix-blend-multiply opacity-80"></div>
                    <div className="absolute top-20 left-32 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply opacity-80"></div>
                    <div className="absolute top-40 left-20 w-32 h-32 bg-green-500 rounded-full mix-blend-multiply opacity-80"></div>
                    
                    <div className="absolute bottom-10 right-10 font-bold text-4xl text-gray-800 font-serif tracking-tighter">
                        Aetherius Design
                    </div>
                </div>
            </div>

            {/* Panels */}
            <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="h-1/2 border-b border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-3 font-bold text-sm border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white flex justify-between">
                        <span>Layers</span>
                        <button><PlusIcon className="w-4 h-4"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {['Text Layer', 'Shape 3', 'Shape 2', 'Shape 1', 'Background'].map((layer, i) => (
                            <div key={i} className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer ${i === 1 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                <EyeIcon className="w-4 h-4 opacity-50"/>
                                {i === 4 ? <PhotoIcon className="w-4 h-4"/> : <LayersIcon className="w-4 h-4"/>}
                                <span>{layer}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-1/2 flex flex-col p-4 space-y-4 overflow-y-auto">
                    <h3 className="font-bold text-sm text-gray-800 dark:text-white">Properties</h3>
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500">Fill Color</label>
                        <div className="flex gap-2">
                            <div className="w-8 h-8 rounded border border-gray-300 bg-blue-500 cursor-pointer"></div>
                            <input type="text" value="#3B82F6" className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs" readOnly/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500">Stroke</label>
                        <div className="flex items-center gap-2">
                            <input type="range" className="flex-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                            <span className="text-xs w-6">4px</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500">Blur</label>
                        <div className="flex items-center gap-2">
                            <input type="range" className="flex-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
                            <span className="text-xs w-6">0%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export const CreationLab: React.FC<{ type: 'Music' | 'Video' | 'Image' | 'Content' }> = ({ type }) => {
    switch (type) {
        case 'Music': return <MusicStudio />;
        case 'Video': return <VideoStudio />;
        case 'Image': return <ImageStudio />;
        default: return <div className="p-8">Unknown Module Type</div>;
    }
};
