
import React, { useState } from 'react';
import { WifiIcon, SignalIcon, BatteryIcon, VideoIcon, LockClosedIcon, LightBulbIcon, MapPinIcon, PlusIcon } from '../Icons';

interface IoTDevice {
    id: string;
    name: string;
    type: 'Sensor' | 'Camera' | 'Light' | 'Lock' | 'Gateway';
    status: 'Online' | 'Offline' | 'Warning';
    battery: number;
    signal: number;
    location: { x: number, y: number }; // 0-100 grid
    data: string;
}

const initialDevices: IoTDevice[] = [
    { id: 'dev-1', name: 'Main Entrance Cam', type: 'Camera', status: 'Online', battery: 100, signal: 95, location: { x: 50, y: 90 }, data: 'Recording (1080p)' },
    { id: 'dev-2', name: 'Hallway Temp', type: 'Sensor', status: 'Online', battery: 85, signal: 80, location: { x: 40, y: 50 }, data: '22.5°C | 45% RH' },
    { id: 'dev-3', name: 'Server Room Lock', type: 'Lock', status: 'Online', battery: 92, signal: 100, location: { x: 80, y: 20 }, data: 'LOCKED' },
    { id: 'dev-4', name: 'Lab Smart Light', type: 'Light', status: 'Offline', battery: 0, signal: 0, location: { x: 20, y: 30 }, data: 'No Response' },
    { id: 'dev-5', name: 'Edge Gateway Alpha', type: 'Gateway', status: 'Online', battery: 100, signal: 98, location: { x: 50, y: 50 }, data: 'Traffic: 450Mbps' },
];

export const IoTMap: React.FC = () => {
    const [devices, setDevices] = useState(initialDevices);
    const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);

    const getIcon = (type: string) => {
        switch(type) {
            case 'Camera': return VideoIcon;
            case 'Lock': return LockClosedIcon;
            case 'Light': return LightBulbIcon;
            case 'Gateway': return WifiIcon;
            default: return SignalIcon;
        }
    };

    return (
        <div className="h-full flex bg-gray-900 text-white font-sans">
            {/* Map View */}
            <div className="flex-1 relative bg-gray-950 overflow-hidden cursor-crosshair">
                {/* Floor Plan Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(50,50,50,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(50,50,50,0.5)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                
                {/* Room Shapes (Decoration) */}
                <div className="absolute top-10 left-10 right-10 bottom-10 border-2 border-gray-700 rounded-xl"></div>
                <div className="absolute top-10 left-1/2 bottom-10 w-0.5 bg-gray-700"></div>
                <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gray-700"></div>

                {/* Devices */}
                {devices.map(dev => {
                    const Icon = getIcon(dev.type);
                    const isSelected = selectedDevice?.id === dev.id;
                    return (
                        <div 
                            key={dev.id}
                            onClick={() => setSelectedDevice(dev)}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group transition-all duration-300 ${isSelected ? 'z-20 scale-110' : 'z-10'}`}
                            style={{ left: `${dev.location.x}%`, top: `${dev.location.y}%` }}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                                dev.status === 'Offline' ? 'bg-gray-700 text-gray-400' :
                                dev.status === 'Warning' ? 'bg-yellow-600 text-white animate-pulse' :
                                'bg-blue-600 text-white hover:bg-blue-500'
                            } ${isSelected ? 'ring-4 ring-blue-500/30' : ''}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${isSelected ? 'bg-white text-black' : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'}`}>
                                {dev.name}
                            </div>
                            
                            {/* Connection Line to Gateway (Visual) */}
                            {dev.type !== 'Gateway' && (
                                <svg className="absolute top-1/2 left-1/2 w-[500px] h-[500px] pointer-events-none opacity-20 -z-10 overflow-visible">
                                    <line x1="0" y1="0" x2={50 - dev.location.x + "%"} y2={50 - dev.location.y + "%"} stroke="cyan" strokeWidth="1" strokeDasharray="4" />
                                </svg>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Sidebar */}
            <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <WifiIcon className="w-5 h-5 text-green-400"/> IoT Mesh
                    </h2>
                    <button className="p-1.5 bg-blue-600 rounded-md hover:bg-blue-500"><PlusIcon className="w-4 h-4"/></button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedDevice ? (
                        <div className="animate-fade-in">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">{selectedDevice.name}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedDevice.status === 'Online' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>{selectedDevice.status}</span>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-gray-700/50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Live Telemetry</p>
                                    <p className="font-mono text-lg text-cyan-300">{selectedDevice.data}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-700/30 p-2 rounded flex items-center gap-2">
                                        <BatteryIcon className={`w-4 h-4 ${selectedDevice.battery < 20 ? 'text-red-400' : 'text-green-400'}`}/>
                                        <span className="text-sm font-bold">{selectedDevice.battery}%</span>
                                    </div>
                                    <div className="bg-gray-700/30 p-2 rounded flex items-center gap-2">
                                        <SignalIcon className="w-4 h-4 text-blue-400"/>
                                        <span className="text-sm font-bold">{selectedDevice.signal}%</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-700">
                                    <h4 className="text-sm font-bold mb-2">Device Controls</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-bold">Reboot</button>
                                        <button className="py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-bold">Ping</button>
                                        <button className="py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs font-bold">Update FW</button>
                                        <button className="py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-xs font-bold">Disconnect</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-10">
                            <MapPinIcon className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                            <p>Select a device on the map to view details and controls.</p>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-gray-700 bg-gray-900 text-xs font-mono text-gray-500">
                    <div className="flex justify-between"><span>Mesh Integrity:</span> <span className="text-green-500">98%</span></div>
                    <div className="flex justify-between"><span>Active Nodes:</span> <span>{devices.length}</span></div>
                    <div className="flex justify-between"><span>Gateway Load:</span> <span className="text-yellow-500">45%</span></div>
                </div>
            </aside>
        </div>
    );
};
