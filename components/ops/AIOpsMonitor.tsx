
import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, BoltIcon, ServerIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '../Icons';

interface Incident {
    id: string;
    timestamp: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    description: string;
    status: 'Detected' | 'Analyzing' | 'Resolving' | 'Resolved';
    aiAction: string;
}

export const AIOpsMonitor: React.FC = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [autoHeal, setAutoHeal] = useState(true);
    const [systemHealth, setSystemHealth] = useState(100);

    // Simulation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            // 30% chance of incident
            if (Math.random() > 0.7) {
                createIncident();
            }
            // Process active incidents
            setIncidents(prev => prev.map(inc => processIncident(inc)));
        }, 2000);
        return () => clearInterval(interval);
    }, [autoHeal]);

    const createIncident = () => {
        const types = [
            { desc: 'Database Latency Spike > 500ms', sev: 'Medium' },
            { desc: 'Memory Leak in Microservice A', sev: 'High' },
            { desc: 'API Rate Limit Near Capacity', sev: 'Low' },
            { desc: 'Unauthorized Access Attempt', sev: 'Critical' }
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        const newIncident: Incident = {
            id: `INC-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            severity: type.sev as any,
            description: type.desc,
            status: 'Detected',
            aiAction: 'Pending Analysis...'
        };
        setIncidents(prev => [newIncident, ...prev].slice(0, 8));
        setSystemHealth(h => Math.max(0, h - 5));
    };

    const processIncident = (incident: Incident): Incident => {
        if (!autoHeal || incident.status === 'Resolved') return incident;

        if (incident.status === 'Detected') {
            return { ...incident, status: 'Analyzing', aiAction: 'Correlating logs...' };
        }
        if (incident.status === 'Analyzing') {
            const actions = {
                'Medium': 'Scaling Read Replicas',
                'High': 'Restarting Container Pod',
                'Low': 'Adjusting Throttling Rules',
                'Critical': 'Isolating Node IP'
            };
            return { ...incident, status: 'Resolving', aiAction: actions[incident.severity] || 'Optimizing...' };
        }
        if (incident.status === 'Resolving') {
            setSystemHealth(h => Math.min(100, h + 5));
            return { ...incident, status: 'Resolved', aiAction: 'Fixed. Report Generated.' };
        }
        return incident;
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white p-6 overflow-hidden">
            <header className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-400">
                        <BoltIcon className="w-8 h-8" /> Autonomous Operations Center
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 font-mono">AIOps Engine v2.1 | Self-Healing: {autoHeal ? 'ACTIVE' : 'PAUSED'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold">System Health</p>
                        <p className={`text-2xl font-bold font-mono ${systemHealth > 90 ? 'text-green-400' : systemHealth > 60 ? 'text-yellow-400' : 'text-red-500'}`}>
                            {systemHealth}%
                        </p>
                    </div>
                    <button 
                        onClick={() => setAutoHeal(!autoHeal)}
                        className={`px-4 py-2 rounded font-bold text-xs flex items-center gap-2 ${autoHeal ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
                    >
                        {autoHeal ? <CheckCircleIcon className="w-4 h-4"/> : <ExclamationTriangleIcon className="w-4 h-4"/>}
                        {autoHeal ? 'AUTONOMY ON' : 'MANUAL MODE'}
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-2 px-2 text-xs font-bold text-gray-500 uppercase">
                    <span className="w-24">Time</span>
                    <span className="w-20">Severity</span>
                    <span className="flex-1">Incident Description</span>
                    <span className="w-24">Status</span>
                    <span className="flex-1 text-right">AI Remediation Action</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {incidents.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                            <ShieldCheckIcon className="w-12 h-12 mb-2 opacity-20"/>
                            <p>No active incidents. Systems nominal.</p>
                        </div>
                    )}
                    {incidents.map(inc => (
                        <div key={inc.id} className="bg-gray-800 border border-gray-700 rounded p-3 flex items-center text-sm hover:bg-gray-750 transition-colors animate-fade-in-left">
                            <span className="w-24 font-mono text-gray-400 text-xs">{inc.timestamp}</span>
                            <span className="w-20">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    inc.severity === 'Critical' ? 'bg-red-900/50 text-red-400 border border-red-800' : 
                                    inc.severity === 'High' ? 'bg-orange-900/50 text-orange-400' : 
                                    'bg-blue-900/50 text-blue-400'
                                }`}>
                                    {inc.severity}
                                </span>
                            </span>
                            <span className="flex-1 font-medium text-gray-200">{inc.description}</span>
                            <span className="w-24 flex items-center gap-2">
                                {inc.status === 'Resolved' ? <CheckCircleIcon className="w-4 h-4 text-green-500"/> : 
                                 inc.status === 'Detected' ? <ExclamationTriangleIcon className="w-4 h-4 text-red-500 animate-pulse"/> :
                                 <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin"/>}
                                <span className={`text-xs ${inc.status === 'Resolved' ? 'text-green-400' : 'text-yellow-400'}`}>{inc.status}</span>
                            </span>
                            <span className="flex-1 text-right font-mono text-xs text-cyan-400">
                                {inc.aiAction}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
