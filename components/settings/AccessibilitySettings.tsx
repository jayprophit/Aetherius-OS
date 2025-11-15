import React from 'react';
import { EyeIcon, SpeakerWaveIcon, HandRaisedIcon, DocumentTextIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import { EarIcon } from '../Icons';

const FeatureCard: React.FC<{ icon: React.FC<any>, title: string, description: string }> = ({ icon: Icon, title, description }) => (
    <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 flex items-start gap-4">
        <Icon className="w-8 h-8 text-gray-600 dark:text-gray-300 flex-shrink-0 mt-1" />
        <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
    </button>
);


export const AccessibilitySettings: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Customize Aetherius OS to work the way you do.</p>
            </div>

            <section>
                <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Vision</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard icon={EyeIcon} title="Display" description="Adjust text size, contrast, and color filters." />
                    <FeatureCard icon={SpeakerWaveIcon} title="Spoken Content" description="Hear screen content, selections, and typing feedback." />
                </div>
            </section>
            
            <section>
                <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Physical and Motor</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard icon={HandRaisedIcon} title="Touch" description="Change how the screen responds to taps and gestures." />
                    <FeatureCard icon={CursorArrowRaysIcon} title="Pointer Control" description="Customize mouse and trackpad behavior." />
                </div>
            </section>

             <section>
                <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Hearing</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard icon={EarIcon} title="Audio" description="Adjust audio balance and enable mono audio." />
                    <FeatureCard icon={DocumentTextIcon} title="Subtitles & Captioning" description="Customize the appearance of subtitles." />
                </div>
            </section>
        </div>
    );
};
