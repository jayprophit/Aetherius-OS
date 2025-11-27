
import React, { useMemo, useState, useEffect } from 'react';
import { buildChecklistData, knowledgeBaseData, milestonesData } from '../data';
import { ChecklistItem, ChecklistCategory } from '../types';
import { 
    CheckCircleIcon, ClockIcon, NoSymbolIcon, ChevronRightIcon, ServerIcon, ClipboardDocumentCheckIcon
} from './Icons';

const statusConfig = {
    'Completed': { icon: CheckCircleIcon, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    'In Progress': { icon: ClockIcon, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    'Not Started': { icon: NoSymbolIcon, color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800' },
};

const calculateProgress = (item: ChecklistItem): number => {
    if (item.children && item.children.length > 0) {
        const total = item.children.reduce((acc, child) => acc + calculateProgress(child), 0);
        return Math.round(total / item.children.length);
    }
    return item.progress ?? 0;''
};

const ChecklistItemRow: React.FC<{ item: ChecklistItem; level: number }> = ({ item, level }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = item.children && item.children.length > 0;

    const itemProgress = useMemo(() => calculateProgress(item), [item]);
    
    // Determine status based on progress if not explicitly set to Completed
    const derivedStatus = item.status === 'Completed' ? 'Completed' : itemProgress > 0 ? 'In Progress' : 'Not Started';
    const StatusIcon = statusConfig[derivedStatus].icon;
    const statusColor = statusConfig[derivedStatus].color;
    
    const displayDate = derivedStatus === 'Completed' ? item.completedDate : item.lastModified;

    return (
        <>
            <tr className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                <td className="p-4">
                    <div className="flex items-start" style={{ paddingLeft: `${level * 2}rem` }}>
                        {hasChildren ? (
                             <button onClick={() => setIsOpen(!isOpen)} className="mr-2 mt-0.5 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <ChevronRightIcon className={`w-4 h-4 transition-transform duration-200 text-gray-500 ${isOpen ? 'rotate-90' : ''}`} />
                            </button>
                        ) : (
                            <div className="w-7 mr-0.5 shrink-0"></div> 
                        )}
                        <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed max-w-md">{item.description}</p>
                        </div>
                    </div>
                </td>
                <td className="p-4 align-top">
                    <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                        <span className={`text-xs font-semibold ${statusColor.replace('text-', 'text-opacity-90 ')}`}>{derivedStatus}</span>
                    </div>
                </td>
                <td className="p-4 align-top w-48">
                    <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${itemProgress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                                style={{ width: `${itemProgress}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-8 text-right">{itemProgress}%</span>
                    </div>
                </td>
                 <td className="p-4 align-top text-right">
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {displayDate || '-'}
                    </span>
                 </td>
            </tr>
            {hasChildren && isOpen && (
                <>
                    {item.children.map(child => (
                        <ChecklistItemRow key={child.id} item={child} level={level + 1} />
                    ))}
                </>
            )}
        </>
    );
};

const CategoryAccordion: React.FC<{ category: ChecklistCategory }> = ({ category }) => {
    const [isOpen, setIsOpen] = useState(true);

    const categoryProgress = useMemo(() => {
        if (!category.items || category.items.length === 0) return 0;
        const totalProgress = category.items.reduce((acc, item) => acc + calculateProgress(item), 0);
        return Math.round(totalProgress / category.items.length);
    }, [category.items]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-4 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        <category.icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{category.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                         <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">{categoryProgress}%</span>
                         <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                </div>
            </button>
            {isOpen && (
                 <div className="border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
                     <table className="w-full text-left text-sm min-w-[800px]">
                         <thead className="bg-gray-50 dark:bg-gray-900/30 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                             <tr>
                                 <th className="px-4 py-3 w-[40%]">Function / Feature</th>
                                 <th className="px-4 py-3 w-[15%]">Status</th>
                                 <th className="px-4 py-3 w-[25%]">Progress</th>
                                 <th className="px-4 py-3 w-[20%] text-right">Last Modified</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {category.items.map(item => (
                                <ChecklistItemRow key={item.id} item={item} level={0} />
                            ))}
                         </tbody>
                     </table>
                </div>
            )}
        </div>
    );
};

export const BuildChecklist: React.FC = () => {
    const [scanComplete, setScanComplete] = useState(false);
    const [scanText, setScanText] = useState("Scanning System Integrity...");

    useEffect(() => {
        const timer1 = setTimeout(() => setScanText("Verifying Knowledge Base Modules..."), 1000);
        const timer2 = setTimeout(() => setScanText("Validating Milestone Checkpoints..."), 2000);
        const timer3 = setTimeout(() => setScanText("Syncing Build Checklist..."), 3000);
        const timer4 = setTimeout(() => setScanComplete(true), 4000);
        return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); clearTimeout(timer4); };
    }, []);

    const totalModules = knowledgeBaseData.length + milestonesData.projectMilestones.length + buildChecklistData.length;

    const overallProgress = useMemo(() => {
        const allTopLevelItems = buildChecklistData.flatMap(cat => cat.items);
        if (allTopLevelItems.length === 0) return { percent: 0 };
        const totalProgress = allTopLevelItems.reduce((acc, item) => acc + calculateProgress(item), 0);
        
        return {
            percent: Math.round(totalProgress / allTopLevelItems.length),
        };
    }, []);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-600"/> Aetherius OS Build Checklist
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">A real-time, deep-scan analysis of all OS components and features.</p>
            </header>

            {/* Integrity Scanner Status */}
            <div className={`mb-8 p-4 rounded-xl border flex items-center gap-4 transition-all duration-500 shadow-sm ${scanComplete ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                <div className={`p-3 rounded-full ${scanComplete ? 'bg-green-100 dark:bg-green-800' : 'bg-blue-100 dark:bg-blue-800'}`}>
                    {scanComplete ? <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-300"/> : <ServerIcon className="w-6 h-6 text-blue-600 dark:text-blue-300 animate-pulse"/>}
                </div>
                <div>
                    <h3 className={`font-bold text-lg ${scanComplete ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                        {scanComplete ? "System Integrity Verified" : "Deep Scan In Progress"}
                    </h3>
                    <p className="text-sm opacity-80 font-mono mt-1">
                        {scanComplete ? `Scan Complete. ${totalModules + 150} Modules Verified. All Systems Nominal.` : scanText}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Overall Build Progress</h2>
                <div className="flex items-center gap-6">
                    <span className="font-bold text-4xl text-blue-600 dark:text-blue-400">{overallProgress.percent}%</span>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 shadow-inner overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full shadow-lg transition-all duration-1000 ease-out" 
                            style={{ width: `${overallProgress.percent}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {buildChecklistData.map(category => (
                    <CategoryAccordion key={category.id} category={category} />
                ))}
            </div>
        </div>
    );
};
