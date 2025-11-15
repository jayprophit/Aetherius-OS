import React from 'react';
import { BeakerIcon, SpeakerWaveIcon, GlobeAltIcon, AcademicCapIcon, HeartIcon } from '../Icons';

interface HealthHubProps {
    onSetView: (view: string) => void;
}

const FeatureCard: React.FC<{
    icon: React.FC<any>;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon: Icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="w-full text-left p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 flex flex-col items-start"
    >
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-4">
            <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex-grow">{description}</p>
        <span className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Learn More &rarr;</span>
    </button>
);

export const HealthHub: React.FC<HealthHubProps> = ({ onSetView }) => {
    
    const features = [
        {
            icon: BeakerIcon,
            title: 'Body Composition',
            description: 'Compare methods like DEXA, MRI, and BIA to understand body fat, lean mass, and bone density.',
            view: 'bodyComposition',
        },
        {
            icon: SpeakerWaveIcon,
            title: 'Frequency Healing',
            description: 'Explore concepts of genetic analysis and the historical use of healing frequencies.',
            view: 'frequencyHealing',
        },
        {
            icon: GlobeAltIcon,
            title: 'The Healing Web',
            description: 'A comparison of natural and pharmaceutical approaches to common health concerns.',
            view: 'healingWeb',
        },
        {
            icon: AcademicCapIcon,
            title: 'Nutrition Guide',
            description: 'Discover recipes for clean eating and learn about foods to limit for better health.',
            view: 'nutritionGuide',
        },
    ];

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <HeartIcon className="w-10 h-10" />
                    Health & Wellness Hub
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Your central place for health analysis, healing information, and nutritional guidance.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature) => (
                    <FeatureCard
                        key={feature.view}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                        onClick={() => onSetView(feature.view)}
                    />
                ))}
            </div>
        </div>
    );
};