
import React, { useState } from 'react';
import { milestonesData } from '../data';
import { MilestoneItem } from '../types';
import { FlagIcon, BeakerIcon, ChartBarIcon, CheckCircleIcon, ClockIcon, NoSymbolIcon, ExclamationTriangleIcon, ChevronDownIcon } from './Icons';

const statusConfig = {
    'Completed': { icon: CheckCircleIcon, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    'In Progress': { icon: ClockIcon, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    'Pending': { icon: ExclamationTriangleIcon, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    'Not Started': { icon: NoSymbolIcon, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
};

const MilestoneRow: React.FC<{ item: MilestoneItem }> = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const StatusIcon = statusConfig[item.status].icon;
    const statusColor = statusConfig[item.status].color;
    const statusBg = statusConfig[item.status].bg;

    return (
        <div className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/20`}>
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex-1 flex items-start gap-3">
                     <div className={`mt-1 p-1 rounded-full ${statusBg}`}>
                        <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{item.id}</span>
                             <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 sm:hidden">
                            <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${item.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${item.progress}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-500">{item.progress}%</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                     <div className="hidden sm:flex items-center gap-3 w-32">
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${item.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                style={{ width: `${item.progress}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-8 text-right">{item.progress}%</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-24 text-center ${statusBg} ${statusColor}`}>
                        {item.status}
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </div>
            {expanded && item.description && (
                <div className="px-4 pb-4 sm:pl-12">
                    <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                        {item.description}
                    </p>
                </div>
            )}
        </div>
    );
};

const SectionCard: React.FC<{title: string, children: React.ReactNode, icon: React.FC<any>}> = ({ title, children, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {title}
            </h2>
        </div>
        <div>
            {children}
        </div>
    </div>
);

export const Milestones: React.FC = () => {
  const calculateSectionProgress = (items: MilestoneItem[]) => {
      if (!items.length) return 0;
      const total = items.reduce((acc, item) => acc + item.progress, 0);
      return Math.round(total / items.length);
  }

  return (
    <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Aetherius OS Milestones</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Strategic roadmap and technical breakdown for the Aetherius ecosystem.</p>
      </header>
      
      <div className="space-y-8 max-w-6xl mx-auto">
        
        <SectionCard title={`Core Project Milestones (${calculateSectionProgress(milestonesData.projectMilestones)}% Complete)`} icon={FlagIcon}>
             <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {milestonesData.projectMilestones.map((item) => (
                <MilestoneRow key={item.id} item={item} />
                ))}
            </div>
        </SectionCard>
        
        <SectionCard title={`Platform Feature Milestones (${calculateSectionProgress(milestonesData.platformFeatureMilestones)}% Complete)`} icon={ChartBarIcon}>
             <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {milestonesData.platformFeatureMilestones.map((item) => (
                <MilestoneRow key={item.id} item={item} />
                ))}
            </div>
        </SectionCard>

        <SectionCard title={`Advanced Technical Breakdown (${calculateSectionProgress(milestonesData.technicalBreakdown)}% Complete)`} icon={BeakerIcon}>
             <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {milestonesData.technicalBreakdown.map((item) => (
                <MilestoneRow key={item.id} item={item} />
                ))}
            </div>
        </SectionCard>

      </div>
    </div>
  );
};