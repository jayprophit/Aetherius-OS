
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    CpuChipIcon, BatteryIcon, MapPinIcon, 
    VideoIcon, StopIcon, ExclamationTriangleIcon,
    GlobeAltIcon, WrenchIcon
} from './Icons';

interface RobotUnit {
    id: string;
    model: string;
    type: 'Humanoid' | 'Quadruped' | 'Drone' | 'Cleaning' | 'Industrial' | 'Mobile Platform';
    status: 'Online' | 'Offline' | 'Busy' | 'Maintenance';
    battery: number;
    location: string;
    task: string;
    feeds: string[];
    position: { x: number; y: number }; // 0-100 coordinates
}

const initialFleet: RobotUnit[] = [
    { id: 'R-01', model: 'Boston Dynamics Atlas 4.0', type: 'Humanoid', status: 'Online', battery: 84, location: 'Sector 7', task: 'Patrol', feeds: ['Main Cam', 'LIDAR'], position: { x: 50, y: 50 } },
    { id: 'R-02', model: 'Apptronik Apollo', type: 'Humanoid', status: 'Busy', battery: 45, location: 'Warehouse B', task: 'Logistics', feeds: ['Main Cam'], position: { x: 20, y: 80 } },
    { id: 'R-03', model: 'Tesla Optimus Gen2', type: 'Humanoid', status: 'Maintenance', battery: 12, location: 'Dock 4', task: 'Firmware Update', feeds: [], position: { x: 90, y: 10 } },
    { id: 'S-01', model: 'Boston Dynamics Spot', type: 'Quadruped', status: 'Online', battery: 92, location: 'Perimeter', task: 'Inspection', feeds: ['360 Cam', 'Thermal'], position: { x: 10, y: 10 } },
    { id: 'C-01', model: 'iRobot Roomba Pro', type: 'Cleaning', status: 'Busy', battery: 60, location: 'Lobby', task: 'Sanitization', feeds: ['Floor Cam'], position: { x: 40, y: 40 } },
    // New additions
    { id: 'C-02', model: 'iRobot Roomba', type: 'Cleaning', status: 'Busy', battery: 75, location: 'Meeting Room 3', task: 'Vacuuming', feeds: ['Nav Cam'], position: { x: 35, y: 35 } },
    { id: 'S-02', model: 'Boston Dynamics Spot', type: 'Mobile Platform', status: 'Online', battery: 88, location: 'Lab 4', task: 'Idle', feeds: ['Front Cam'], position: { x: 80, y: 80 } },
];

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors: Record<string, string> = {
        'Online': 'bg-green-500/20 text-green-400 border-green-500/50',
        'Offline': 'bg-gray-700/50 text-gray-400 border-gray-600',
        'Busy': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        'Maintenance': 'bg-red-500/20 text-red-400 border-red-500/50',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[status]} flex items-center gap-1`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'Online' ? 'bg-green-400 animate-pulse' : 'bg-current'}`}></div>
            {status.toUpperCase()}
        </span>
    );
};

const CircularGauge: React.FC<{ value: number; max: number; label: string; color: string }> = ({ value, max, label, color }) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / max) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-12 h-12">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-800" />
                    <circle 
                        cx="24" cy="24" r={radius} 
                        stroke="currentColor" strokeWidth="3" fill="transparent" 
                        strokeDasharray={circumference} 
                        strokeDashoffset={offset} 
                        className={`${color} transition-all duration-500 ease-out`} 
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{value}%</span>
            </div>
            <span className="text-[9px] text-gray-500 mt-1">{label}</span>
        </div>
    );
};

export const RoboticsControl: React.FC = () => {
    const [fleet, setFleet] = useState<RobotUnit[]>(initialFleet);
    const [selectedId, setSelectedId] = useState<string>(initialFleet[0].id);
    const [isTeleop, setIsTeleop] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    const selectedRobot = fleet.find(r => r.id === selectedId) || fleet[0];

    // Simulation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setFleet(prev => prev.map(bot => {
                // Simulate battery drain for active bots
                if (bot.status === 'Online' || bot.status === 'Busy') {
                    const drain = Math.random() * 0.1;
                    return { ...bot, battery: Math.max(0, bot.battery - drain) };
                }
                return bot;
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // WASD Control
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isTeleop || selectedRobot.status === 'Offline' || connectionError) return;

            // Simulate potential connection loss on movement
            if (Math.random() > 0.995) {
                setConnectionError("SIGNAL LOST: PACKET DROPPED");
                setIsTeleop(false);
                return;
            }

            setFleet(prev => prev.map(bot => {
                if (bot.id === selectedId) {
                    let { x, y } = bot.position;
                    const speed = 2;
                    
                    switch(e.key.toLowerCase()) {
                        case 'w': y = Math.max(0, y - speed); break;
                        case 's': y = Math.min(100, y + speed); break;
                        case 'a': x = Math.max(0, x - speed); break;
                        case 'd': x = Math.min(100, x + speed); break;
                        default: return bot;
                    }
                    return { ...bot, position: { x, y } };
                }
                return bot;
            }));
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTeleop, selectedId, connectionError, selectedRobot.status]);

    const handleReconnect = () => {
        setConnectionError("Reconnecting...");
        setTimeout(() => {
            setConnectionError(null);
        }, 2000);
    };

    return (
        <div className="h-full flex flex-col bg-gray-950 text-gray-100 animate-fade-in font-sans">
            {/* Header */}
            <header className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                        <CpuChipIcon className="w-6 h-6 text-orange-500" />
                        Robotics Command
                    </h1>
                    <p className="text-xs text-gray-500">Fleet Management & Teleoperation</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-gray-800 px-3 py-1 rounded-lg border border-gray-700 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-mono text-green-400">UPLINK: STABLE</span>
                    </div>
                    <button className="bg-red-900/30 border border-red-500/50 text-red-400 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-900/50 transition-colors">
                        <StopIcon className="w-4 h-4"/> E-STOP
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Fleet */}
                <aside className="w-72 bg-gray-900/50 border-r border-gray-800 flex flex-col">
                    <div className="p-3 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase">Unit Roster</div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {fleet.map(robot => (
                            <button
                                key={robot.id}
                                onClick={() => { setSelectedId(robot.id); setIsTeleop(false); setConnectionError(null); }}
                                className={`w-full p-3 rounded-lg border text-left transition-all hover:shadow-md ${selectedId === robot.id ? 'bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500/30' : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-mono font-bold text-sm text-white">{robot.id}</span>
                                    <StatusBadge status={robot.status} />
                                </div>
                                <div className="text-xs text-gray-400 truncate">{robot.model}</div>
                                <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-500">
                                    <span className="flex items-center gap-1"><BatteryIcon className={`w-3 h-3 ${robot.battery < 20 ? 'text-red-500' : 'text-green-500'}`}/> {robot.battery.toFixed(0)}%</span>
                                    <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> {robot.location}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Viewport */}
                <main className="flex-1 flex flex-col relative bg-black">
                    {/* 3D/Map Viewport */}
                    <div className="flex-1 relative overflow-hidden" ref={viewportRef}>
                        {/* Grid Floor */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px] transform perspective-1000 rotateX(60deg) scale(2) origin-bottom opacity-30 pointer-events-none"></div>
                        
                        {connectionError ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
                                <div className="bg-red-900/20 border border-red-500 p-6 rounded-xl text-center max-w-md">
                                    <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce"/>
                                    <h2 className="text-xl font-bold text-red-400 mb-2">CONNECTION LOST</h2>
                                    <p className="text-sm text-red-200 mb-6">{connectionError}</p>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs text-gray-500">Troubleshooting:</p>
                                        <ul className="text-xs text-left text-gray-400 list-disc pl-5 mb-4">
                                            <li>Check local mesh network node integrity.</li>
                                            <li>Verify quantum encryption keys.</li>
                                            <li>Robot may be in a Faraday cage zone.</li>
                                            <li>Restart local node uplink daemon.</li>
                                        </ul>
                                        <button onClick={handleReconnect} className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-sm transition-colors">Attempt Reconnect</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Robot Marker */}
                                <div 
                                    className="absolute w-8 h-8 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)] border-2 border-white transition-all duration-300 ease-out flex items-center justify-center z-10"
                                    style={{ left: `${selectedRobot.position.x}%`, top: `${selectedRobot.position.y}%`, transform: 'translate(-50%, -50%)' }}
                                >
                                    <div className="w-full h-full rounded-full bg-blue-400 animate-ping absolute opacity-50"></div>
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                    {/* Vision Cone */}
                                    <div className="absolute top-1/2 left-1/2 w-0 h-0 border-l-[50px] border-r-[50px] border-t-[100px] border-l-transparent border-r-transparent border-t-blue-500/10 transform -translate-x-1/2 -translate-y-full -rotate-45 origin-bottom pointer-events-none"></div>
                                </div>

                                {/* HUD Overlay */}
                                <div className="absolute top-4 left-4 pointer-events-none">
                                    <div className="bg-black/60 backdrop-blur border border-green-500/30 p-2 rounded text-green-400 font-mono text-xs">
                                        <div className="flex items-center gap-2 mb-1"><VideoIcon className="w-3 h-3"/> VIDEO FEED: {selectedRobot.feeds[0] || 'N/A'}</div>
                                        <div>LAT: {selectedRobot.position.y.toFixed(4)} LONG: {selectedRobot.position.x.toFixed(4)}</div>
                                        <div className="text-orange-400 mt-1">{isTeleop ? '>> MANUAL CONTROL ACTIVE <<' : '>> AUTONOMOUS MODE <<'}</div>
                                        {isTeleop && <div className="text-white mt-1 animate-pulse">USE [W, A, S, D] TO MOVE</div>}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Bottom Control Deck */}
                    <div className="h-48 bg-gray-900 border-t border-gray-800 p-4 flex gap-6">
                        {/* Telemetry */}
                        <div className="w-48 bg-black/40 rounded-lg border border-gray-700 p-3 flex flex-col justify-center gap-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase text-center mb-1">Telemetry</h3>
                            <div className="flex justify-around">
                                <CircularGauge value={Math.round(selectedRobot.battery)} max={100} label="PWR" color="text-green-400" />
                                <CircularGauge value={Math.round(Math.random() * 100)} max={100} label="SIG" color="text-blue-400" />
                            </div>
                            <div className="text-center border-t border-gray-700 pt-2 mt-1">
                                <p className="text-[9px] text-gray-500 uppercase">Current Task</p>
                                <p className="text-xs font-bold text-blue-300 truncate">{selectedRobot.task}</p>
                            </div>
                        </div>

                        {/* Action Center */}
                        <div className="flex-1 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-white">{selectedRobot.model}</h2>
                                    <p className="text-xs text-gray-400">ID: {selectedRobot.id} | TYPE: {selectedRobot.type}</p>
                                </div>
                                <button 
                                    onClick={() => !connectionError && setIsTeleop(!isTeleop)}
                                    disabled={selectedRobot.status === 'Offline' || !!connectionError}
                                    className={`px-6 py-2 rounded font-bold text-sm transition-all flex items-center gap-2 ${isTeleop ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                >
                                    <GlobeAltIcon className="w-4 h-4"/>
                                    {isTeleop ? 'DISENGAGE SIMULATION' : 'ENABLE SIMULATION'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2 h-full">
                                <button disabled={!!connectionError} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs font-bold disabled:opacity-50">RETURN TO DOCK</button>
                                <button disabled={!!connectionError} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs font-bold disabled:opacity-50">RUN DIAGNOSTICS</button>
                                <button disabled={!!connectionError} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs font-bold disabled:opacity-50">CYCLE CAMERAS</button>
                                <button disabled={!!connectionError} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs font-bold disabled:opacity-50">TOGGLE LIGHTS</button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
