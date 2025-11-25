
import React from 'react';
import { milestonesData } from '../data';
import { FlagIcon, BeakerIcon, ChartBarIcon } from './Icons';

const SectionCard: React.FC<{title: string, children: React.ReactNode, icon: React.FC<any>}> = ({ title, children, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
            <Icon className="w-7 h-7 text-blue-500" />
            {title}
        </h2>
        {children}
    </div>
);

export const Milestones: React.FC = () => {
  return (
    <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Aetherius OS Milestones</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Project roadmap and technical breakdown for the Aetherius OS ecosystem.</p>
      </header>
      <div className="space-y-6 max-w-5xl mx-auto">
        
        <SectionCard title="Core Project Milestones" icon={FlagIcon}>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
            {milestonesData.projectMilestones.map((item, index) => (
              <li key={index} className="pl-2">{item}</li>
            ))}
          </ol>
        </SectionCard>
        
        {milestonesData.platformFeatureMilestones && (
            <SectionCard title="Platform Feature Milestones" icon={ChartBarIcon}>
              <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                {milestonesData.platformFeatureMilestones.map((item, index) => (
                  <li key={index} className="pl-2">{item}</li>
                ))}
              </ol>
            </SectionCard>
        )}

        <SectionCard title="Advanced Technical Breakdown" icon={BeakerIcon}>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
            {milestonesData.technicalBreakdown.map((item, index) => (
              <li key={index} className="pl-2">{item}</li>
            ))}
          </ol>
        </SectionCard>
      </div>
    </div>
  );
};
