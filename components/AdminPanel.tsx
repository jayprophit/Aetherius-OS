import React, { useState } from 'react';
import { Cog6ToothIcon, GlobeAltIcon, ShoppingCartIcon, BeakerIcon, HeartIcon } from './Icons';

interface ToggleRowProps {
  title: string;
  description: string;
  initialValue?: boolean;
}

const ToggleSwitch: React.FC<{ toggled: boolean; onToggle: () => void }> = ({ toggled, onToggle }) => (
    <button
        onClick={onToggle}
        role="switch"
        aria-checked={toggled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${toggled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${toggled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const ToggleRow: React.FC<ToggleRowProps> = ({ title, description, initialValue = true }) => {
    const [toggled, setToggled] = useState(initialValue);
    return (
        <div className="flex justify-between items-center py-4">
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <ToggleSwitch toggled={toggled} onToggle={() => setToggled(!toggled)} />
        </div>
    );
};

const Section: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-3">
            <Icon className="w-6 h-6" />
            {title}
        </h2>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {children}
        </div>
    </div>
);

export const AdminPanel: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Owner Admin Panel</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Enable or disable platform features and categories globally.</p>
            </header>
            <div className="max-w-4xl mx-auto space-y-6">
                <Section title="Core OS Features" icon={Cog6ToothIcon}>
                    <ToggleRow title="AI Hub" description="Main AI assistant and chat interface." />
                    <ToggleRow title="Browser" description="The built-in web browser application." />
                    <ToggleRow title="Social Hub" description="Enables all social features like feeds, members, and groups." />
                </Section>

                <Section title="Commerce Hubs" icon={ShoppingCartIcon}>
                    <ToggleRow title="E-Commerce Marketplace" description="The main business and product marketplace." />
                    <ToggleRow title="Creator Marketplace" description="Store for community-made apps, themes, and plugins." />
                    <ToggleRow title="Finance & Trading" description="Enables all financial apps, including trading, staking, and lending." />
                </Section>
                
                <Section title="Creation & Labs" icon={BeakerIcon}>
                    <ToggleRow title="Development Tools" description="Code editor, website builder, game design." />
                    <ToggleRow title="Media Production" description="Music, video, and image editing suites." />
                    <ToggleRow title="Avatar Forge" description="The from-scratch avatar creation module." />
                    <ToggleRow title="Simulation Hub" description="Interactive world simulation viewer." />
                </Section>

                <Section title="Personal Hubs" icon={HeartIcon}>
                     <ToggleRow title="E-Learning Platform" description="Access to course catalog and user learning paths." />
                     <ToggleRow title="Gaming Hub" description="Access to game library and gaming features." />
                     <ToggleRow title="Health & Wellness" description="The entire health hub, including scans and guides." />
                </Section>
            </div>
        </div>
    );
};
