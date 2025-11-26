
import React, { useMemo } from 'react';
import { buildChecklistData, milestonesData, knowledgeBaseData } from '../data';
import { LightBulbIcon, ClipboardDocumentCheckIcon, FlagIcon, ArrowRightIcon, BeakerIcon, CheckCircleIcon } from './Icons';

const RecommendationCard: React.FC<{ 
    title: string; 
    description: string; 
    type: 'build' | 'milestone' | 'research';
    meta?: string;
}> = ({ title, description, type, meta }) => {
    const typeStyles = {
        build: {
            border: 'border-blue-200 dark:border-blue-800',
            bg: 'bg-blue-50 dark:bg-blue-900/10',
            icon: ClipboardDocumentCheckIcon,
            iconColor: 'text-blue-600 dark:text-blue-400',
            badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
        },
        milestone: {
            border: 'border-green-200 dark:border-green-800',
            bg: 'bg-green-50 dark:bg-green-900/10',
            icon: FlagIcon,
            iconColor: 'text-green-600 dark:text-green-400',
            badge: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
        },
        research: {
            border: 'border-purple-200 dark:border-purple-800',
            bg: 'bg-purple-50 dark:bg-purple-900/10',
            icon: BeakerIcon,
            iconColor: 'text-purple-600 dark:text-purple-400',
            badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
        }
    };

    const style = typeStyles[type];
    const Icon = style.icon;

    return (
        <div className={`p-4 rounded-lg border ${style.border} ${style.bg} flex flex-col h-full transition-transform hover:scale-[1.02]`}>
            <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-md bg-white dark:bg-gray-800 shadow-sm`}>
                    <Icon className={`w-5 h-5 ${style.iconColor}`} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight">{title}</h4>
                    {meta && <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${style.badge}`}>{meta}</span>}
                </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 flex-grow">{description}</p>
            <button className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                Action Item <ArrowRightIcon className="w-3 h-3" />
            </button>
        </div>
    );
};

export const SystemRecommendations: React.FC = () => {
    // 1. Analyze Checklist for "Not Started" items (Priority: High)
    const buildRecommendations = useMemo(() => {
        const notStarted: any[] = [];
        buildChecklistData.forEach(cat => {
            cat.items.forEach(item => {
                if (item.status === 'Not Started') {
                    notStarted.push({ ...item, category: cat.name });
                }
                // Check children
                if (item.children) {
                    item.children.forEach(child => {
                        if (child.status === 'Not Started') {
                            notStarted.push({ ...child, category: cat.name });
                        }
                    });
                }
            });
        });
        // Return random 4 for variety
        return notStarted.sort(() => 0.5 - Math.random()).slice(0, 4);
    }, []);

    // 2. Analyze Milestones (Sequential - find first 'In Progress' or 'Pending')
    const milestoneRecommendations = useMemo(() => {
        return milestonesData.projectMilestones
            .filter(m => m.status === 'In Progress' || m.status === 'Pending')
            .slice(0, 4);
    }, []);

    // 3. Analyze Knowledge Base for R&D/Concept (Innovation)
    const researchRecommendations = useMemo(() => {
        return knowledgeBaseData
            .filter(k => k.status === 'Concept Phase' || k.status === 'R&D Phase' || k.status === 'Theoretical Phase')
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);
    }, []);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <LightBulbIcon className="w-8 h-8 text-yellow-500" />
                    Project Genesis Advisor
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    AI-curated recommendations based on your current system trajectory, checklist status, and R&D roadmap.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: Build Queue */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <ClipboardDocumentCheckIcon className="w-5 h-5"/> Immediate Build Queue
                        </h2>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">Actionable</span>
                    </div>
                    {buildRecommendations.map((item: any) => (
                        <RecommendationCard 
                            key={item.id}
                            title={item.name}
                            description={item.description}
                            type="build"
                            meta={item.category}
                        />
                    ))}
                </section>

                {/* Column 2: Strategic Milestones */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <FlagIcon className="w-5 h-5"/> Strategic Roadmap
                        </h2>
                         <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">Targets</span>
                    </div>
                    {milestoneRecommendations.map((ms) => (
                        <RecommendationCard 
                            key={ms.id}
                            title={ms.title}
                            description={ms.description || 'Milestone target.'}
                            type="milestone"
                            meta={ms.status}
                        />
                    ))}
                </section>

                {/* Column 3: R&D Focus */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <BeakerIcon className="w-5 h-5"/> Research & Development
                        </h2>
                         <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">Innovation</span>
                    </div>
                    {researchRecommendations.map((kb) => (
                        <RecommendationCard 
                            key={kb.id}
                            title={kb.name}
                            description={kb.details.substring(0, 120) + '...'}
                            type="research"
                            meta={kb.status}
                        />
                    ))}
                </section>

            </div>
        </div>
    );
};