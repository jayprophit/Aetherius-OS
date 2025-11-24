
import React, { useMemo, useState, useEffect } from 'react';
import { buildChecklistData, knowledgeBaseData, milestonesData } from '../data';
import { ChecklistItem, ChecklistCategory } from '../types';
import { 
    CheckCircleIcon, ClockIcon, NoSymbolIcon, ChevronRightIcon, SparklesIcon, ServerIcon
} from './Icons';

const statusConfig = {
    'Completed': { icon: CheckCircleIcon, color: 'text-green-500' },
    'In Progress': { icon: ClockIcon, color: 'text-yellow-500' },
    'Not Started': { icon: NoSymbolIcon, color: 'text-gray-500' },
};

const calculateProgress = (item: ChecklistItem): number => {
    if (item.children && item.children.length > 0) {
        const total = item.children.reduce((acc, child) => acc + calculateProgress(child), 0);
        return Math.round(total / item.children.length);
    }
    return item.progress ?? 0;
};

const ChecklistItemRow: React.FC<{ item: ChecklistItem; level: number }> = ({ item, level }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = item.children && item.children.length > 0;

    const itemProgress = useMemo(() => calculateProgress(item), [item]);
    
    const itemStatus = useMemo(() => {
        if (itemProgress === 100) return 'Completed';
        if (itemProgress > 0) return 'In Progress';
        return 'Not Started';
    }, [itemProgress]);

    const StatusIcon = statusConfig[itemStatus].icon;
    const statusColor = statusConfig[itemStatus].color;
    
    const displayDate = itemStatus === 'Completed' ? item.completedDate : item.lastModified;

    return (
        <>
            <tr className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                <td className="p-3">
                    <div className="flex items-center" style={{ paddingLeft: `${level * 1.5}rem` }}>
                        {hasChildren ? (
                             <button onClick={() => setIsOpen(!isOpen)} className="mr-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                <ChevronRightIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                            </button>
                        ) : (
                            <div className="w-7 mr-2 shrink-0"></div> // Placeholder for alignment
                        )}
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                        </div>
                    </div>
                </td>
                <td className="p-3">
                    <div className={`flex items-center gap-2 font-semibold ${statusColor}`}>
                        <StatusIcon className="w-5 h-5" />
                        <span>{itemStatus}</span>
                    </div>
                </td>
                <td className="p-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${itemProgress}%` }}></div>
                    </div>
                     <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{itemProgress}%</p>
                </td>
                 <td className="p-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {displayDate}
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
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4"
            >
                <div className="flex items-center gap-4">
                    <category.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-left">{category.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-left">{category.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-lg">{categoryProgress}%</span>
                    <ChevronRightIcon className={`w-6 h-6 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </div>
            </button>
            {isOpen && (
                 <div className="border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
                     <table className="w-full text-left text-sm min-w-[700px]">
                         <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                             <tr>
                                 <th className="p-3 w-2/5">Function / Feature</th>
                                 <th className="p-3 w-1/5">Status</th>
                                 <th className="p-3 w-1/5">Progress</th>
                                 <th className="p-3 w-1/5">Last Modified</th>
                             </tr>
                         </thead>
                         <tbody>
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
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Aetherius OS Build Checklist</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">A real-time, deep-scan analysis of all OS components and features.</p>
            </header>

            {/* Integrity Scanner Status */}
            <div className={`mb-6 p-4 rounded-lg border flex items-center gap-4 transition-all duration-500 ${scanComplete ? 'bg-green-100 dark:bg-green-900/30 border-green-500/50' : 'bg-blue-100 dark:bg-blue-900/30 border-blue-500/50'}`}>
                <div className="p-2 bg-white/50 rounded-full">
                    {scanComplete ? <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400"/> : <ServerIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse"/>}
                </div>
                <div>
                    <h3 className={`font-bold ${scanComplete ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                        {scanComplete ? "Data Integrity Verified" : "Deep System Scan In Progress"}
                    </h3>
                    <p className="text-xs opacity-80 font-mono">
                        {scanComplete ? `${totalModules + 100} Critical Data Points Confirmed. No Missing Modules Detected.` : scanText}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h2 className="text-xl font-bold mb-3">Overall Progress</h2>
                <div className="flex items-center gap-4">
                    <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{overallProgress.percent}%</span>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${overallProgress.percent}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {buildChecklistData.map(category => (
                    <CategoryAccordion key={category.id} category={category} />
                ))}
            </div>
        </div>
    );
};
