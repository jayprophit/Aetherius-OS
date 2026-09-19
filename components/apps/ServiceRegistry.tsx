
import React, { useState } from 'react';
import { 
    ServerIcon, GlobeAltIcon, ShieldCheckIcon, LockClosedIcon, 
    CheckCircleIcon, XMarkIcon, ArrowPathIcon, BoltIcon 
} from '../Icons';

interface ServiceNode {
    id: string;
    name: string;
    port: number;
    protocol: 'TCP' | 'UDP';
    status: 'Active' | 'Inactive' | 'Listen';
    type: 'Core' | 'User' | 'System';
    latency: number;
}

const initialServices: ServiceNode[] = [
    { id: 'svc-80', name: 'HTTP Server (Nginx)', port: 80, protocol: 'TCP', status: 'Active', type: 'System', latency: 12 },
    { id: 'svc-443', name: 'HTTPS / SSL Layer', port: 443, protocol: 'TCP', status: 'Active', type: 'System', latency: 15 },
    { id: 'svc-3000', name: 'React Hydration Port', port: 3000, protocol: 'TCP', status: 'Listen', type: 'User', latency: 5 },
    { id: 'svc-5432', name: 'PostgreSQL Cluster', port: 5432, protocol: 'TCP', status: 'Active', type: 'Core', latency: 45 },
    { id: 'svc-6379', name: 'Redis Cache', port: 6379, protocol: 'TCP', status: 'Active', type: 'Core', latency: 2 },
    { id: 'svc-22', name: 'SSH Daemon', port: 22, protocol: 'TCP', status: 'Listen', type: 'System', latency: 0 },
    { id: 'svc-8080', name: 'API Gateway', port: 8080, protocol: 'TCP', status: 'Active', type: 'Core', latency: 24 },
    { id: 'svc-9090', name: 'Prometheus Metrics', port: 9090, protocol: 'TCP', status: 'Active', type: 'System', latency: 8 },
];

export const ServiceRegistry: React.FC = () => {
    const [services, setServices] = useState<ServiceNode[]>(initialServices);
    
    const refresh = () => {
        setServices(prev => prev.map(s => ({
            ...s,
            latency: Math.max(0, s.latency + (Math.random() - 0.5) * 10)
        })));
    };

    return (
        <div className="h-full bg-gray-900 text-gray-100 p-6 overflow-hidden flex flex-col">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-cyan-400">
                        <GlobeAltIcon className="w-8 h-8" /> Network Admin
                    </h1>
                    <p className="text-sm text-gray-400 mt-1 font-mono">Port Allocation & Microservice Registry</p>
                </div>
                <button onClick={refresh} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors">
                    <ArrowPathIcon className="w-5 h-5 text-cyan-500" />
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Service List */}
                <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 flex flex-col overflow-hidden">
                    <div className="p-4 bg-gray-800/50 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400">Active Ports</h3>
                        <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-500/30">FIREWALL ACTIVE</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-900/50 text-gray-500 text-xs uppercase font-mono sticky top-0">
                                <tr>
                                    <th className="p-3">Service Name</th>
                                    <th className="p-3 w-24">Port</th>
                                    <th className="p-3 w-24">Proto</th>
                                    <th className="p-3 w-24">Type</th>
                                    <th className="p-3 w-32 text-right">Latency</th>
                                    <th className="p-3 w-24 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {services.map(svc => (
                                    <tr key={svc.id} className="hover:bg-gray-700/30 transition-colors font-mono text-xs">
                                        <td className="p-3 font-bold text-gray-200 flex items-center gap-2">
                                            <ServerIcon className="w-4 h-4 text-gray-500"/> {svc.name}
                                        </td>
                                        <td className="p-3 text-blue-400">{svc.port}</td>
                                        <td className="p-3 text-gray-400">{svc.protocol}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${svc.type === 'Core' ? 'bg-purple-900/50 text-purple-300' : svc.type === 'System' ? 'bg-gray-700 text-gray-300' : 'bg-blue-900/50 text-blue-300'}`}>
                                                {svc.type}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                    <div className={`h-full ${svc.latency < 20 ? 'bg-green-500' : svc.latency < 100 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, svc.latency)}%` }}></div>
                                                </div>
                                                <span>{svc.latency.toFixed(0)}ms</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            {svc.status === 'Active' ? (
                                                <span className="text-green-400 flex items-center justify-end gap-1"><CheckCircleIcon className="w-3 h-3"/> ON</span>
                                            ) : (
                                                <span className="text-yellow-400 flex items-center justify-end gap-1"><BoltIcon className="w-3 h-3"/> LSTN</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Security & Health Panel */}
                <div className="space-y-6">
                     <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5 text-green-500"/> Security Gateway
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded border border-gray-600">
                                <span className="text-xs text-gray-400">Inbound Traffic</span>
                                <span className="text-xs text-green-400 font-mono">ALLOWED (443, 80)</span>
                            </div>
                             <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded border border-gray-600">
                                <span className="text-xs text-gray-400">DDoS Shield</span>
                                <span className="text-xs text-blue-400 font-mono">ACTIVE (Cloudflare)</span>
                            </div>
                             <div className="flex justify-between items-center p-2 bg-gray-900/50 rounded border border-gray-600">
                                <span className="text-xs text-gray-400">SSH Access</span>
                                <span className="text-xs text-yellow-400 font-mono">RESTRICTED (IP)</span>
                            </div>
                        </div>
                     </div>

                     <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex-1">
                        <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
                            <LockClosedIcon className="w-5 h-5 text-red-400"/> Blocked Attempts
                        </h3>
                         <div className="space-y-2 overflow-hidden">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                                    <span className="text-red-500">{new Date().toLocaleTimeString()}</span>
                                    <span>Blocked IP 192.168.0.{100+i} (Port 22)</span>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};
