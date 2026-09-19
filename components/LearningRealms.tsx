
import React from 'react';
import { StarIcon, GlobeIcon, CodeBracketIcon, AcademicCapIcon, HeartIcon } from './Icons';

interface LearningRealmsProps {
    onSetView: (view: string, context?: any) => void;
}

const RealmCard: React.FC<{
    icon: React.FC<any>;
    title: string;
    description: string;
    ageGroup: string;
    view: string;
    onClick: (view: string) => void;
    colorClasses: string;
}> = ({ icon: Icon, title, description, ageGroup, view, onClick, colorClasses }) => (
    <button
        onClick={() => onClick(view)}
        className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${colorClasses}`}
        aria-label={`Enter ${title} realm for ${ageGroup}`}
    >
        <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center">
                <Icon className="w-8 h-8" />
            </div>
            <div>
                <h3 className="font-bold text-2xl">{title}</h3>
                <p className="font-semibold opacity-80">{ageGroup}</p>
            </div>
        </div>
        <p className="text-sm opacity-90">{description}</p>
    </button>
);


export const LearningRealms: React.FC<LearningRealmsProps> = ({ onSetView }) => {

    const realms = [
        { 
            icon: StarIcon, 
            title: 'Spark Island', 
            description: 'Learn through play, discovery, and repetition in a world of fun and games.',
            ageGroup: 'Ages 2-5', 
            view: 'sparkIsland',
            colorClasses: 'bg-yellow-400 dark:bg-yellow-500 text-yellow-900 border-yellow-500'
        },
        { 
            icon: GlobeIcon, 
            title: 'Explorer Academy', 
            description: 'Build foundational skills and foster curiosity with adventurous, gamified lessons.',
            ageGroup: 'Ages 6-11', 
            view: 'explorerAcademy',
            colorClasses: 'bg-green-400 dark:bg-green-500 text-green-900 border-green-500'
        },
        { 
            icon: CodeBracketIcon, 
            title: "Innovator's Forge", 
            description: 'Master subjects, develop critical thinking, and explore your passions with modern tools.',
            ageGroup: 'Ages 12-18', 
            view: 'innovatorsForge',
            colorClasses: 'bg-blue-400 dark:bg-blue-500 text-blue-900 border-blue-500'
        },
        { 
            icon: AcademicCapIcon, 
            title: "Scholar's Nexus", 
            description: 'Engage in advanced specialization, professional development, and academic rigor.',
            ageGroup: 'Ages 18+', 
            view: 'scholarsNexus',
            colorClasses: 'bg-indigo-400 dark:bg-indigo-500 text-indigo-900 border-indigo-500'
        },
        { 
            icon: HeartIcon, 
            title: 'Luminary Labs', 
            description: 'Pursue learning for passion, hobbies, and personal growth with community-driven courses.',
            ageGroup: 'Lifelong Learners', 
            view: 'luminaryLabs',
            colorClasses: 'bg-purple-400 dark:bg-purple-500 text-purple-900 border-purple-500'
        },
    ];

    return (
        <div className="animate-fade-in p-4 sm:p-8 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
             <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Welcome to EduSphere</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">Your personalized learning universe. Select a realm to begin your journey.</p>
            </header>
            <div className="max-w-4xl mx-auto grid grid-cols-1 gap-6">
                {realms.map(realm => (
                    <RealmCard 
                        key={realm.view}
                        {...realm}
                        onClick={() => onSetView(realm.view, { title: realm.title, icon: realm.icon })}
                    />
                ))}
            </div>
        </div>
    );
};
