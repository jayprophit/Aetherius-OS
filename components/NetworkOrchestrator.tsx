import React, { useState, useEffect } from 'react';
import { Server, RpcLog, ServerStatus } from '../types';
import { CircleStackIcon, ClockIcon } from './Icons';

const initialServers: Server[] = [
    { id: 'livekit-sfu-1', name: 'LiveKit SFU Server', status: 'Online', cpu: 15, memory: 40 },
    { id: 'signaling-1', name: 'WebRTC Signaling', status: 'Online', cpu: 5, memory: 15 },
    { id: 'ai-agent-1', name: 'AI Agent Worker', status: 'Online', cpu: 30, memory: 60 },
    { id: 'db-primary', name: 'PostgreSQL DB', status: 'Online', cpu: 10, memory: 50 },
    { id: 'redis-cache', name: 'Redis Cache', status: 'Online', cpu: 8, memory: 25 },
];

const mockRpcMethods = ['unblock_user', 'send_email', 'generate_code', 'create_support_ticket', 'analyze_stock'];

const ServerStatusCard: React.FC<{ server: Server }> = ({ server }) => {
    const statusConfig: { [key in ServerStatus]: { color: string, text: string } } = {
        Online: { color: 'bg-green-500', text: 'text-green-800 dark:text-green-300' },
        Degraded: { color: 'bg-yellow-500', text: 'text-yellow-800 dark:text-yellow-300' },
        Offline: { color: 'bg-red-500', text: 'text-red-800 dark:text-red-300' },
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
                <h4 className="font-bold">{server.name}</h4>
                <div className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full ${statusConfig[server.status].text} ${statusConfig[server.status].color}/10`}>
                    <div className={`w-2 h-2 rounded-full ${statusConfig[server.status].color}`}></div>
                    {server.status}
                </div>
            </div>
            <div className="mt-4 space-y-2">
                <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">CPU Load</span>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${server.cpu}%` }}></div>
                    </div>
                </div>
                <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Memory Usage</span>
                     <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${server.memory}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricDisplay: React.FC<{ label: string, value: string, unit: string }> = ({ label, value, unit }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}<span className="text-lg ml-1">{unit}</span></p>
    </div>
);


export const NetworkOrchestrator: React.FC = () => {
    const [servers, setServers] = useState<Server[]>(initialServers);
    const [rpcLog, setRpcLog] = useState<RpcLog[]>([]);
    const [rpcCount, setRpcCount] = useState(120);

    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate server metrics fluctuation
            setServers(prev => prev.map(s => ({
                ...s,
                cpu: Math.min(100, Math.max(5, s.cpu + (Math.random() - 0.5) * 5)),
                memory: Math.min(100, Math.max(10, s.memory + (Math.random() - 0.5) * 3)),
            })));

            // Simulate new RPC calls
            const newLog: RpcLog = {
                id: `rpc-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                method: mockRpcMethods[Math.floor(Math.random() * mockRpcMethods.length)],
                source: `user-${Math.floor(Math.random() * 100)}`,
                status: Math.random() > 0.1 ? 'Success' : 'Failed'
            };
            setRpcLog(prev => [newLog, ...prev.slice(0, 19)]);
            setRpcCount(c => c + Math.floor(Math.random() * 5));

        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
             <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <CircleStackIcon className="w-8 h-8"/> Network Orchestrator
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time monitoring of Aetherius OS backend services and RPC traffic.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Servers & Logs */}
                <div className="lg:col-span-2 space-y-6">
                    <section>
                        <h2 className="text-xl font-bold mb-4">Core Service Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {servers.map(server => <ServerStatusCard key={server.id} server={server} />)}
                        </div>
                    </section>
                    <section>
                        <h2 className="text-xl font-bold mb-4">Live RPC Call Log</h2>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-96 overflow-y-scroll font-mono text-xs">
                           {rpcLog.map(log => (
                               <div key={log.id} className="flex items-center gap-3 py-1">
                                   <span className="text-gray-400">{log.timestamp}</span>
                                   <span className={`font-semibold ${log.status === 'Success' ? 'text-green-500' : 'text-red-500'}`}>{log.status.toUpperCase()}</span>
                                   <span>{log.method}</span>
                                   <span className="text-gray-500">from {log.source}</span>
                               </div>
                           ))}
                        </div>
                    </section>
                </div>
                {/* Right Column: Metrics */}
                <aside className="lg:col-span-1 space-y-6">
                     <section>
                        <h2 className="text-xl font-bold mb-4">Real-time Metrics</h2>
                        <div className="space-y-4">
                            <MetricDisplay label="Active Connections" value="1,284" unit="" />
                            <MetricDisplay label="RPC Calls / Min" value={rpcCount.toString()} unit="rpm" />
                            <MetricDisplay label="Avg. Latency" value="42" unit="ms" />
                        </div>
                     </section>
                </aside>
            </div>
        </div>
    );
};
