
import React, { useState, useEffect } from 'react';
import { 
    BeakerIcon, CubeTransparentIcon, ArrowsPointingOutIcon, 
    PlayIcon, StopIcon, SparklesIcon, PlusIcon, TrashIcon 
} from './Icons';

const AtomNode: React.FC<{ x: number, y: number, type: string }> = ({ x, y, type }) => {
    const color = type === 'Carbon' ? 'bg-gray-700' : type === 'Silicon' ? 'bg-blue-500' : 'bg-red-500';
    return (
        <div 
            className={`absolute w-6 h-6 rounded-full shadow-lg flex items-center justify-center text-[8px] font-bold text-white ${color} border-2 border-white/20 cursor-pointer hover:scale-125 transition-transform`}
            style={{ left: x, top: y }}
        >
            {type.substring(0, 2)}
        </div>
    );
};

const LatticeConnection: React.FC<{ x1: number, y1: number, x2: number, y2: number }> = ({ x1, y1, x2, y2 }) => {
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return (
        <div 
            className="absolute h-1 bg-gray-400/50 origin-center-left pointer-events-none"
            style={{ 
                width: length, 
                left: x1 + 12, // Offset for atom center
                top: y1 + 12, 
                transform: `rotate(${angle}deg)`, 
                transformOrigin: '0 50%'
            }}
        />
    );
};

export const NanoFabricator: React.FC = () => {
    const [atoms, setAtoms] = useState<{id: number, x: number, y: number, type: string}[]>([]);
    const [selectedElement, setSelectedElement] = useState('Carbon');
    const [isSimulating, setIsSimulating] = useState(false);

    // Generate initial grid
    useEffect(() => {
        const initialAtoms = [];
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                initialAtoms.push({
                    id: i * 10 + j,
                    x: 100 + i * 60,
                    y: 100 + j * 60,
                    type: 'Carbon'
                });
            }
        }
        setAtoms(initialAtoms);
    }, []);

    // Simulation effect
    useEffect(() => {
        if (!isSimulating) return;
        const interval = setInterval(() => {
            setAtoms(prev => prev.map(a => ({
                ...a,
                x: a.x + (Math.random() - 0.5) * 2,
                y: a.y + (Math.random() - 0.5) * 2
            })));
        }, 50);
        return () => clearInterval(interval);
    }, [isSimulating]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isSimulating) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - 12;
        const y = e.clientY - rect.top - 12;
        setAtoms(prev => [...prev, { id: Date.now(), x, y, type: selectedElement }]);
    };

    const handleClear = () => {
        setIsSimulating(false);
        setAtoms([]);
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white animate-fade-in">
            <header className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
                        <CubeTransparentIcon className="w-6 h-6" />
                        vNMT Nano-Fabricator
                    </h1>
                    <p className="text-xs text-gray-500 font-mono">Virtual Nanotech Assembly Env | Scale: 10^-9m</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsSimulating(!isSimulating)}
                        className={`px-4 py-2 rounded flex items-center gap-2 text-sm font-bold ${isSimulating ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
                    >
                        {isSimulating ? <StopIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/>}
                        {isSimulating ? 'Stop Simulation' : 'Simulate Physics'}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Toolbar */}
                <aside className="w-64 bg-gray-800 border-r border-gray-700 p-4 space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Element Palette</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {['Carbon', 'Silicon', 'Oxygen', 'Gold'].map(el => (
                                <button 
                                    key={el}
                                    onClick={() => setSelectedElement(el)}
                                    className={`p-2 rounded border text-sm font-semibold transition-all ${selectedElement === el ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
                                >
                                    {el}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Tools</h3>
                        <div className="space-y-2">
                            <button className="w-full p-2 rounded bg-gray-700 hover:bg-gray-600 text-left text-sm flex items-center gap-2">
                                <ArrowsPointingOutIcon className="w-4 h-4"/> Auto-Lattice
                            </button>
                            <button className="w-full p-2 rounded bg-gray-700 hover:bg-gray-600 text-left text-sm flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4 text-yellow-400"/> Energy Minimize
                            </button>
                            <button onClick={handleClear} className="w-full p-2 rounded bg-red-900/30 border border-red-800 hover:bg-red-900/50 text-left text-sm text-red-300 flex items-center gap-2">
                                <TrashIcon className="w-4 h-4"/> Clear Chamber
                            </button>
                        </div>
                    </div>

                    <div className="p-3 bg-black/30 rounded border border-gray-700 font-mono text-xs">
                        <p className="text-gray-500">ATOM COUNT: <span className="text-white">{atoms.length}</span></p>
                        <p className="text-gray-500">TEMP: <span className="text-blue-400">{isSimulating ? '4.2 K' : '293 K'}</span></p>
                        <p className="text-gray-500">STABILITY: <span className="text-green-400">100%</span></p>
                    </div>
                </aside>

                {/* Canvas */}
                <main className="flex-1 relative bg-black overflow-hidden cursor-crosshair" onClick={handleCanvasClick}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-20"></div>
                    
                    {/* Connections (Simplified nearest neighbor drawing) */}
                    {atoms.map((atom, i) => (
                        atoms.slice(i + 1).map(other => {
                            const dist = Math.hypot(atom.x - other.x, atom.y - other.y);
                            if (dist < 100) {
                                return <LatticeConnection key={`${atom.id}-${other.id}`} x1={atom.x} y1={atom.y} x2={other.x} y2={other.y} />;
                            }
                            return null;
                        })
                    ))}

                    {/* Atoms */}
                    {atoms.map(atom => (
                        <AtomNode key={atom.id} x={atom.x} y={atom.y} type={atom.type} />
                    ))}

                    {!isSimulating && (
                        <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded text-xs text-gray-400 border border-gray-700">
                            Click to place {selectedElement} atom
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
