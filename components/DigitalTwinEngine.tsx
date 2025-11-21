
import React, { useState, useEffect } from 'react';
import { 
    CubeTransparentIcon, PlayIcon, StopIcon, ArrowPathIcon, 
    ChartBarIcon, GlobeAltIcon, TruckIcon, BuildingOfficeIcon, 
    CpuChipIcon, FireIcon, BeakerIcon 
} from './Icons';

interface SimulationModel {
    id: string;
    name: string;
    category: 'Engineering' | 'Urban' | 'Micro' | 'Global';
    icon: React.FC<any>;
    metrics: { label: string; value: string | number; unit: string; status: 'good' | 'warning' | 'critical' }[];
    description: string;
}

const models: SimulationModel[] = [
    {
        id: 'jet-engine',
        name: 'GE-9X Turbine Twin',
        category: 'Engineering',
        icon: ArrowPathIcon,
        description: 'High-fidelity thermal and aerodynamic simulation of a turbofan engine under takeoff load.',
        metrics: [
            { label: 'EGT', value: 940, unit: '°C', status: 'good' },
            { label: 'RPM (N1)', value: 98.5, unit: '%', status: 'good' },
            { label: 'Vibration', value: 0.4, unit: 'IPS', status: 'warning' },
            { label: 'Fuel Flow', value: 1200, unit: 'kg/h', status: 'good' },
        ]
    },
    {
        id: 'smart-city',
        name: 'Neo-Tokyo Sector 7',
        category: 'Urban',
        icon: BuildingOfficeIcon,
        description: 'Real-time urban flow simulation including traffic, power grid load, and waste management.',
        metrics: [
            { label: 'Grid Load', value: 88, unit: '%', status: 'warning' },
            { label: 'Traffic Flow', value: 92, unit: 'idx', status: 'good' },
            { label: 'Air Quality', value: 45, unit: 'AQI', status: 'good' },
            { label: 'Emergency Resp', value: 3.2, unit: 'min', status: 'good' },
        ]
    },
    {
        id: 'fusion-reactor',
        name: 'Tokamak Stabilizer',
        category: 'Global',
        icon: FireIcon,
        description: 'Magnetic confinement field simulation for plasma stability in a fusion reaction.',
        metrics: [
            { label: 'Plasma Temp', value: 150, unit: 'M°C', status: 'good' },
            { label: 'Mag Field', value: 12.4, unit: 'T', status: 'good' },
            { label: 'Neutron Flux', value: 4.5, unit: 'e14', status: 'critical' },
            { label: 'Q-Value', value: 1.1, unit: '', status: 'good' },
        ]
    },
    {
        id: 'protein-folder',
        name: 'AlphaFold Catalyst',
        category: 'Micro',
        icon: BeakerIcon,
        description: 'Molecular dynamics simulation for novel drug discovery and protein interaction.',
        metrics: [
            { label: 'Folding Score', value: 94, unit: 'pLDDT', status: 'good' },
            { label: 'Energy Min', value: -450, unit: 'kcal', status: 'good' },
            { label: 'Bonds', value: 1402, unit: '#', status: 'good' },
            { label: 'Sim Speed', value: 45, unit: 'ns/day', status: 'warning' },
        ]
    }
];

const MetricBox: React.FC<{ label: string; value: string | number; unit: string; status: string }> = ({ label, value, unit, status }) => {
    const color = status === 'good' ? 'text-green-400' : status === 'warning' ? 'text-yellow-400' : 'text-red-400';
    const bg = status === 'good' ? 'bg-green-900/20 border-green-900/50' : status === 'warning' ? 'bg-yellow-900/20 border-yellow-900/50' : 'bg-red-900/20 border-red-900/50';

    return (
        <div className={`p-3 rounded-lg border ${bg} flex flex-col items-center justify-center min-w-[100px]`}>
            <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</span>
            <span className={`text-xl font-bold font-mono ${color}`}>
                {value} <span className="text-xs text-gray-500">{unit}</span>
            </span>
        </div>
    );
};

export const DigitalTwinEngine: React.FC = () => {
    const [selectedModelId, setSelectedModelId] = useState(models[0].id);
    const [isRunning, setIsRunning] = useState(false);
    const [simulationTime, setSimulationTime] = useState(0);
    const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRunning) {
            interval = setInterval(() => {
                setSimulationTime(prev => prev + 1);
            }, 100); // Fast time
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    return (
        <div className="h-full bg-gray-900 text-gray-100 flex overflow-hidden animate-fade-in">
            {/* Left Sidebar: Models */}
            <aside className="w-80 bg-gray-800/50 border-r border-gray-700 flex flex-col">
                <header className="p-4 border-b border-gray-700">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <CubeTransparentIcon className="w-6 h-6 text-blue-500" />
                        Twin Repository
                    </h2>
                </header>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {models.map(model => (
                        <button
                            key={model.id}
                            onClick={() => { setSelectedModelId(model.id); setIsRunning(false); setSimulationTime(0); }}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${selectedModelId === model.id ? 'bg-blue-900/30 border-blue-500 shadow-md' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gray-900 rounded-md">
                                    <model.icon className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-200">{model.name}</p>
                                    <p className="text-xs text-gray-500">{model.category}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Viewport */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="h-16 border-b border-gray-700 flex items-center justify-between px-6 bg-gray-800/30">
                    <div>
                        <h1 className="text-xl font-bold text-white">{selectedModel.name}</h1>
                        <p className="text-xs text-gray-400 font-mono">ID: {selectedModel.id.toUpperCase()} | LATENCY: 2ms</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Simulation Time</p>
                            <p className="font-mono font-bold text-blue-400">{(simulationTime * 0.1).toFixed(1)}s</p>
                        </div>
                        <button 
                            onClick={() => setIsRunning(!isRunning)}
                            className={`p-3 rounded-full font-bold transition-all ${isRunning ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                        >
                            {isRunning ? <StopIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                        </button>
                    </div>
                </div>

                {/* 3D Visualization Area (Simulated) */}
                <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center perspective-1000">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-grid-slate-800/[0.2] bg-[center_1px_center]" style={{ transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)' }}></div>
                    
                    {/* Central Object Placeholder */}
                    <div className={`relative w-64 h-64 border-4 border-blue-500/30 rounded-full flex items-center justify-center ${isRunning ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '10s' }}>
                         <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full transform rotate-45 scale-90"></div>
                         <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full transform -rotate-45 scale-110"></div>
                         
                         {/* Model Icon */}
                         <selectedModel.icon className={`w-32 h-32 text-white/80 drop-shadow-[0_0_25px_rgba(59,130,246,0.6)] ${isRunning ? 'animate-pulse' : ''}`} />
                    </div>

                    {/* Overlay HUD */}
                    <div className="absolute top-4 left-4 p-4 bg-black/60 backdrop-blur-md rounded-lg border border-gray-700/50 max-w-sm">
                        <h3 className="text-sm font-bold text-gray-300 mb-2">Parameters</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">{selectedModel.description}</p>
                    </div>

                    {/* Active Data Points (Simulated) */}
                    {isRunning && (
                        <>
                            <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                            <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-green-500 rounded-full animate-ping delay-300"></div>
                            <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-blue-500 rounded-full animate-ping delay-700"></div>
                        </>
                    )}
                </div>

                {/* Bottom Telemetry Panel */}
                <div className="h-40 bg-gray-800/50 border-t border-gray-700 p-4 overflow-x-auto">
                    <div className="flex gap-4 h-full items-center">
                        <div className="flex-shrink-0 border-r border-gray-700 pr-4 mr-2">
                            <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                                <ChartBarIcon className="w-4 h-4" /> Live Telemetry
                            </h4>
                            <div className="text-xs text-gray-500">Update: 60Hz</div>
                            <div className="text-xs text-gray-500">Sync: Active</div>
                        </div>
                        
                        {selectedModel.metrics.map((metric, idx) => (
                            <MetricBox 
                                key={idx} 
                                label={metric.label} 
                                value={isRunning && typeof metric.value === 'number' ? (metric.value + (Math.random() * metric.value * 0.1 * (Math.random() > 0.5 ? 1 : -1))).toFixed(1) : metric.value} 
                                unit={metric.unit} 
                                status={metric.status} 
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};
