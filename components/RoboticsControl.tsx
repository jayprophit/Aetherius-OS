
import React, { useState, useEffect } from 'react';
import { 
    CpuChipIcon, BatteryIcon, WifiIcon, MapPinIcon, 
    VideoIcon, PlayIcon, StopIcon, ExclamationTriangleIcon,
    BoltIcon, ArrowPathIcon, GlobeAltIcon
} from './Icons';

interface RobotUnit {
    id: string;
    model: string;
    status: 'Online' | 'Offline' | 'Busy' | 'Maintenance';
    battery: number;
    location: string;
    task: string;
    feeds: string[];
}

const robotFleet: RobotUnit[] = [
    { id: 'R-01', model: 'Boston Dynamics Atlas 4.0', status: 'Online', battery: 84, location: 'Sector 7 (Physical)', task: 'Patrol', feeds: ['Main Cam', 'LIDAR'] },
    { id: 'R-02', model: 'Apptronik Apollo', status: 'Busy', battery: 45, location: 'Warehouse B', task: 'Logistics Handling', feeds: ['Main Cam'] },
    { id: 'R-03', model: 'Tesla Optimus Gen2', status: 'Maintenance', battery: 12, location: 'Charging Dock', task: 'Firmware Update', feeds: [] },
];

const TelemetryGauge: React.FC<{ label: string, value: number, color: string, unit?: string }> = ({ label, value, color, unit = '%' }) => (
    <div className="flex flex-col items-center">
        <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className={`${color} transition-all duration-1000`} strokeDasharray={`${value}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {value}{unit}
            </div>
        </div>
        <span className="text-[10px] uppercase text-gray-500 mt-1">{label}</span>
    </div>
);

export const RoboticsControl: React.FC = () => {
    const [selectedRobot, setSelectedRobot] = useState<RobotUnit>(robotFleet[0]);
    const [isTeleop, setIsTeleop] = useState(false);
    const [streamNoise, setStreamNoise] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setStreamNoise(Math.random()), 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col bg-gray-950 text-gray-100 animate-fade-in">
            <header className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
                        <CpuChipIcon className="w-8 h-8 text-orange-500" />
                        Robotics Command Center
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Fleet Status: {robotFleet.filter(r => r.status === 'Online').length}/{robotFleet.length} Online</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-900/50">
                        <StopIcon className="w-4 h-4"/> EMERGENCY STOP
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Fleet List */}
                <aside className="w-80 border-r border-gray-800 bg-gray-900/30 flex flex-col">
                    <div className="p-4 border-b border-gray-800">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Units</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {robotFleet.map(robot => (
                            <button
                                key={robot.id}
                                onClick={() => { setSelectedRobot(robot); setIsTeleop(false); }}
                                className={`w-full p-3 rounded-lg border text-left transition-all ${selectedRobot.id === robot.id ? 'bg-orange-500/10 border-orange-500/50' : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-sm text-gray-200">{robot.id}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${robot.status === 'Online' ? 'bg-green-500/20 text-green-400' : robot.status === 'Maintenance' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {robot.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 font-mono truncate">{robot.model}</p>
                                <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-500">
                                    <span className="flex items-center gap-1"><BatteryIcon className="w-3 h-3"/> {robot.battery}%</span>
                                    <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> {robot.location}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Viewport */}
                <main className="flex-1 flex flex-col relative bg-black">
                    {/* Video Feed Overlay */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-green-500 font-mono text-xs border border-green-500/30 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            LIVE FEED: {selectedRobot.id}_CAM_01
                        </div>
                        
                        {/* Simulated HUD */}
                        <div className="absolute inset-0 p-8 border-[1px] border-green-500/20 m-4 rounded-lg">
                            <div className="absolute top-1/2 left-1/2 w-12 h-12 border-2 border-green-500/50 transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center">
                                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                            </div>
                            {/* Horizon Line */}
                            <div className="absolute top-1/2 left-0 w-full h-px bg-green-500/20"></div>
                        </div>
                    </div>

                    {/* Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gray-900/90 border-t border-gray-800 backdrop-blur-md p-6 flex gap-8">
                        {/* Robot Status */}
                        <div className="w-64 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                                    <BoltIcon className="w-6 h-6 text-yellow-500"/>
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">{selectedRobot.id}</h2>
                                    <p className="text-xs text-gray-400">{selectedRobot.model}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <TelemetryGauge label="PWR" value={selectedRobot.battery} color="text-green-400" />
                                <TelemetryGauge label="SIG" value={94} color="text-blue-400" />
                                <TelemetryGauge label="TMP" value={42} color="text-orange-400" unit="°C" />
                            </div>
                        </div>

                        {/* Action Interface */}
                        <div className="flex-1 bg-black/40 rounded-lg border border-gray-700 p-4 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-sm text-gray-300 flex items-center gap-2">
                                    <GlobeAltIcon className="w-4 h-4"/> Remote Operator Terminal
                                </h3>
                                <button 
                                    onClick={() => setIsTeleop(!isTeleop)}
                                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${isTeleop ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                                >
                                    {isTeleop ? 'TELEOP ACTIVE' : 'ENABLE TELEOP'}
                                </button>
                            </div>
                            
                            <div className="flex-1 flex gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex gap-2">
                                        <button disabled={!isTeleop} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs font-bold disabled:opacity-50">MOVE TO TARGET</button>
                                        <button disabled={!isTeleop} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs font-bold disabled:opacity-50">GRASP OBJECT</button>
                                    </div>
                                    <div className="bg-black/50 p-2 rounded border border-gray-800 h-20 font-mono text-[10px] text-green-400 overflow-hidden">
                                        {isTeleop ? (
                                            <>
                                                > INITIALIZING NEURAL LINK... OK<br/>
                                                > HAPTIC FEEDBACK SYNCED<br/>
                                                > LATENCY: 12ms<br/>
                                                > WAITING FOR INPUT...
                                            </>
                                        ) : (
                                            <>
                                                > MODE: AUTONOMOUS<br/>
                                                > CURRENT TASK: {selectedRobot.task.toUpperCase()}<br/>
                                                > WAYPOINT: {selectedRobot.location.toUpperCase()}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="w-32 flex flex-col gap-2">
                                    <button className="flex-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                                        <ArrowPathIcon className="w-5 h-5 text-gray-400"/>
                                    </button>
                                    <div className="flex gap-2 h-1/2">
                                        <button className="flex-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600"></button>
                                        <button className="flex-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-600"></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
