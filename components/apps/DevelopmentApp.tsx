
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { CodeIDE } from '../CodeIDE';
import { GameEngine } from '../GameEngine';
import { AiSuiteApp } from './AiSuiteApp';
import { VirtualAccelerator } from '../VirtualAccelerator';
import { SystemRecommendations } from '../SystemRecommendations';
import { 
    CpuChipIcon, LightBulbIcon, CodeBracketIcon, GlobeAltIcon, 
    ChartBarIcon, RocketLaunchIcon, PlusIcon, ArrowRightIcon 
} from '../Icons';
import { OmniVisualBuilder } from './OmniVisualBuilder';

// --- Development Dashboard ---
const DevDashboard: React.FC<{ onSetView: (view: string) => void }> = ({ onSetView }) => {
    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto animate-fade-in">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Development Hub</h1>
                <p className="text-gray-600 dark:text-gray-400">Central command for all engineering and creative projects.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <button 
                    onClick={() => onSetView('codeEditor')}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                >
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <CodeBracketIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">Code IDE</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Full-featured integrated development environment.</p>
                </button>

                <button 
                    onClick={() => onSetView('websiteBuilder')}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all text-left group"
                >
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <GlobeAltIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">Visual Builder</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Drag-and-drop website and UI designer.</p>
                </button>

                <button 
                    onClick={() => onSetView('gameEngine')}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:shadow-lg transition-all text-left group"
                >
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <RocketLaunchIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">Game Engine</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">3D simulation and game development suite.</p>
                </button>
            </div>

            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Recent Projects</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {[
                        { name: 'E-Commerce Platform v2', type: 'Web App', date: '2 hours ago', status: 'Active' },
                        { name: 'Quantum Simulation Core', type: 'Python', date: 'Yesterday', status: 'Building' },
                        { name: 'Portfolio Site 2025', type: 'Visual Builder', date: '3 days ago', status: 'Published' },
                    ].map((project, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                    <ChartBarIcon className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{project.name}</p>
                                    <p className="text-xs text-gray-500">{project.type} • {project.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                                    project.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    project.status === 'Building' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                    {project.status}
                                </span>
                                <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-center">
                    <button className="text-sm font-bold text-blue-600 hover:underline flex items-center justify-center gap-1">
                        <PlusIcon className="w-4 h-4" /> Create New Project
                    </button>
                </div>
            </div>
        </div>
    );
};

// Component Map
const developmentComponentMap: { [key: string]: React.FC<any> } = {
  dashboard: DevDashboard,
  codeEditor: CodeIDE,
  // Properly pass navigation capability to OmniVisualBuilder
  websiteBuilder: ({ onSetView }: { onSetView: (view: string) => void }) => (
      <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900">
          <OmniVisualBuilder onExit={() => onSetView('dashboard')} />
      </div>
  ),
  gameEngine: GameEngine,
  aiSuite: AiSuiteApp,
  virtualAccelerator: VirtualAccelerator,
  projectAdvisor: SystemRecommendations,
};

interface DevelopmentAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const DevelopmentApp: React.FC<DevelopmentAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }

    const augmentedMenuItem = { ...context.menuItem };
    let children = augmentedMenuItem.children ? [...augmentedMenuItem.children] : [];

    // Ensure Dashboard is present and first
    if (!children.some(c => c.component === 'dashboard')) {
        children.unshift({ title: 'Dashboard', icon: ChartBarIcon, component: 'dashboard' });
    }

    // Ensure other components
    if (!children.some(c => c.component === 'codeEditor')) {
         children.push({ title: 'Code IDE', icon: CodeBracketIcon, component: 'codeEditor' });
    }
    if (!children.some(c => c.component === 'websiteBuilder')) {
         children.push({ title: 'Visual Builder', icon: GlobeAltIcon, component: 'websiteBuilder' });
    }
    if (!children.some(c => c.component === 'virtualAccelerator')) {
        children.push({ title: 'Virtual Accelerator', icon: CpuChipIcon, component: 'virtualAccelerator' });
    }
    if (!children.some(c => c.component === 'projectAdvisor')) {
        children.push({ title: 'Project Advisor', icon: LightBulbIcon, component: 'projectAdvisor' });
    }
    
    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={developmentComponentMap} onSetView={onSetView} />;
};
