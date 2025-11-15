import React, { useState } from 'react';
import { HiveMindIcon, SearchIcon, LockClosedIcon } from '../Icons';
import { SimpleAIChat } from '../SimpleAIChat';

const Card: React.FC<{ title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{title}</h2>
        {children}
    </div>
);

const ToggleRow: React.FC<{ title: string, description: string }> = ({ title, description }) => {
    const [toggled, setToggled] = useState(true);
    return (
        <div className="flex justify-between items-center py-2">
            <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <button 
                onClick={() => setToggled(!toggled)} 
                role="switch" 
                aria-checked={toggled} 
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${toggled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${toggled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
};


export const AiSettings: React.FC<{ title: string }> = ({ title }) => {
    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Configure AI Assistant</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chat with your AI to configure its personality, responses, and behavior.</p>
                </div>
                <div className="h-[60vh] border-t border-gray-200 dark:border-gray-700">
                    <SimpleAIChat />
                </div>
            </div>

            <Card title="Aetherius AI Features">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <ToggleRow title="Proactive Suggestions" description="Allow Aetherius to offer suggestions in apps." />
                    <ToggleRow title="Learning from Usage" description="Improve Aetherius by allowing it to learn from your app usage." />
                    <ToggleRow title="Contextual Awareness" description="Enable AI to understand content on screen for better assistance." />
                </div>
            </Card>

            <Card title="Search Settings">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                     <ToggleRow title="Show Search on Home" description="Display the search bar on the home screen." />
                     <ToggleRow title="Content From Apps" description="Include results from your apps in search." />
                </div>
            </Card>
            
            <Card title="Privacy">
                 <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aetherius OS is designed to protect your information. Your personal AI data is processed on-device whenever possible. 
                    <a href="#" className="text-blue-500 hover:underline ml-1">Learn more about AI & Privacy...</a>
                </p>
            </Card>
        </div>
    );
};