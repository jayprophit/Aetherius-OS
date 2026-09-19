
import React, { useState, useMemo } from 'react';
import { 
    InformationCircleIcon, FlagIcon, BookOpenIcon, ClipboardDocumentCheckIcon, 
    ShieldCheckIcon, ChipIcon, CheckCircleIcon, ServerIcon, CubeTransparentIcon,
    BoltIcon, GlobeAltIcon, ChartBarIcon
} from '../Icons';
import { 
    knowledgeBaseData, milestonesData, buildChecklistData, 
    realityResources, gapAnalysisData 
} from '../../data';
import { rigService } from '../../services/RigService';

// --- Sub-components ---

const InfoSection: React.FC<{ title: string; children: React.ReactNode; icon: React.FC<any> }> = ({ title, children, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-blue-600' }) => (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors: Record<string, string> = {
        'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        'Not Started': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        'Online': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'Simulated': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        'Ready': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        'Beta': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

const GapAnalysisView: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* MVO Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ServerIcon className="w-32 h-32 text-purple-500"/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{gapAnalysisData.mvo.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">{gapAnalysisData.mvo.description}</p>
                    
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-bold text-purple-400">{gapAnalysisData.mvo.readiness}%</span>
                        <span className="text-sm text-gray-500 mb-1">Readiness</span>
                    </div>
                    <ProgressBar value={gapAnalysisData.mvo.readiness} color="bg-purple-500"/>
                    
                    <div className="mt-6 space-y-3">
                        <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Critical Path</h4>
                        {gapAnalysisData.mvo.criticalPath.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2 last:border-0">
                                <span className="text-gray-300">{item.name}</span>
                                <StatusBadge status={item.status} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* MVP Card */}
                 <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <GlobeAltIcon className="w-32 h-32 text-blue-500"/>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{gapAnalysisData.mvp.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">{gapAnalysisData.mvp.description}</p>
                    
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-bold text-blue-400">{gapAnalysisData.mvp.readiness}%</span>
                        <span className="text-sm text-gray-500 mb-1">Readiness</span>
                    </div>
                    <ProgressBar value={gapAnalysisData.mvp.readiness} color="bg-blue-500"/>
                    
                     <div className="mt-6 space-y-3">
                        <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Critical Path</h4>
                        {gapAnalysisData.mvp.criticalPath.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2 last:border-0">
                                <span className="text-gray-300">{item.name}</span>
                                <StatusBadge status={item.status} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-full">
                    <ChartBarIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h4 className="font-bold text-white">Strategic Alignment</h4>
                    <p className="text-sm text-gray-300 mt-1">
                        The current build successfully bridges the gap between simulated backend operations (MVO) and functional frontend user experience (MVP). 
                        Next phase: Deepening hardware integration via WebGPU.
                    </p>
                </div>
            </div>
        </div>
    )
}

export const SystemInfoApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'Specs' | 'Lifecycle' | 'Knowledge' | 'Checklist'>('Overview');
    
    // Calculate overall progress
    const checklistProgress = useMemo(() => {
        const totalItems = buildChecklistData.flatMap(c => c.items).length;
        let completed = 0;
        buildChecklistData.forEach(c => c.items.forEach(i => {
            if(i.status === 'Completed') completed++;
        }));
        return Math.round((completed / totalItems) * 100);
    }, []);

    const rig = rigService.getRig();
    const stats = rigService.calculateStats(rig);

    return (
        <div className="flex h-full bg-gray-100 dark:bg-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <InformationCircleIcon className="w-6 h-6 text-blue-600" />
                        System Info
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">v24H2.105 (Grandchild)</p>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {[
                        { id: 'Overview', icon: BoltIcon },
                        { id: 'Specs', icon: ChipIcon },
                        { id: 'Lifecycle', icon: ChartBarIcon }, // New Tab
                        { id: 'Knowledge', icon: BookOpenIcon },
                        { id: 'Checklist', icon: ClipboardDocumentCheckIcon }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                                activeTab === tab.id 
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.id === 'Lifecycle' ? 'Gap Analysis' : tab.id}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{activeTab === 'Lifecycle' ? 'Product Gap Analysis (MVO/MVP)' : activeTab}</h2>
                </header>

                {activeTab === 'Overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">System Health</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center">
                                        <CheckCircleIcon className="w-8 h-8 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">Nominal</p>
                                        <p className="text-sm text-gray-500">All services operational</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Build Progress</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Completion</span>
                                            <span className="text-sm font-bold text-blue-600">{checklistProgress}%</span>
                                        </div>
                                        <ProgressBar value={checklistProgress} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <InfoSection title="Device Specifications" icon={ChipIcon}>
                            <div className="grid grid-cols-2 gap-y-4 text-sm">
                                <div className="text-gray-500 dark:text-gray-400">Processor</div>
                                <div className="font-mono text-gray-900 dark:text-white">Virtual Quantum/CPU Hybrid</div>
                                <div className="text-gray-500 dark:text-gray-400">Memory</div>
                                <div className="font-mono text-gray-900 dark:text-white">256 GB (Virtual)</div>
                                <div className="text-gray-500 dark:text-gray-400">System ID</div>
                                <div className="font-mono text-gray-900 dark:text-white">AETH-8842-X</div>
                            </div>
                        </InfoSection>
                    </div>
                )}
                
                {activeTab === 'Lifecycle' && <GapAnalysisView />}

                {activeTab === 'Specs' && (
                    <div className="space-y-6">
                        <InfoSection title="Virtual Hardware Rig" icon={ServerIcon}>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                 <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                     <p className="text-xs text-gray-500 uppercase">Binary Cores</p>
                                     <p className="text-lg font-bold text-blue-500">{rig.Binary_CPU.length}</p>
                                 </div>
                                 <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                     <p className="text-xs text-gray-500 uppercase">Quantum Qubits</p>
                                     <p className="text-lg font-bold text-purple-500">{rig.Quantum_QPU.reduce((acc, q) => acc + parseInt(q.specs['Qubits'] as string || '0'), 0)}</p>
                                 </div>
                                 <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                     <p className="text-xs text-gray-500 uppercase">Total Power Draw</p>
                                     <p className="text-lg font-bold text-yellow-500">{stats.power}W</p>
                                 </div>
                             </div>
                        </InfoSection>

                        <InfoSection title="Hardware Capability Bridge" icon={GlobeAltIcon}>
                             <div className="space-y-3">
                                 {Object.entries(realityResources).map(([key, val]) => (
                                     <div key={key} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                                         <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{key}</span>
                                         <div className="text-right">
                                             <span className="text-xs text-red-500 font-bold bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded">{val.gap}</span>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </InfoSection>
                    </div>
                )}

                {activeTab === 'Knowledge' && (
                    <div className="space-y-4">
                        {knowledgeBaseData.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900 dark:text-white">{item.name}</h3>
                                    <StatusBadge status={item.status} />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{item.details}</p>
                                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                                    <span>ID: {item.id}</span>
                                    <span>Progress: {item.progress}%</span>
                                </div>
                                <ProgressBar value={item.progress} />
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'Checklist' && (
                    <div className="space-y-6">
                        {buildChecklistData.map(category => (
                            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                    <category.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{category.name}</h3>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {category.items.map(item => (
                                        <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-gray-200">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.description}</p>
                                            </div>
                                            <StatusBadge status={item.status} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
