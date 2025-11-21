
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { PlaceholderView } from '../PlaceholderView';
import { GameEngine } from '../GameEngine';
import { AiSuiteApp } from './AiSuiteApp';
import { VirtualAccelerator } from '../VirtualAccelerator';
import { SystemRecommendations } from '../SystemRecommendations';
import { CpuChipIcon, LightBulbIcon } from '../Icons';

// This is the map for components *inside* the Development App window.
const developmentComponentMap: { [key: string]: React.FC<any> } = {
  codeEditor: () => <PlaceholderView viewName="Code Editor" />,
  websiteBuilder: () => <PlaceholderView viewName="Website Builder" />,
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

    // We need to augment the menu items if they don't have the new accelerator or advisor
    const augmentedMenuItem = { ...context.menuItem };
    
    let children = augmentedMenuItem.children ? [...augmentedMenuItem.children] : [];

    // Check and inject Virtual Accelerator
    if (!children.some(child => child.component === 'virtualAccelerator')) {
        children.push({ title: 'Virtual Accelerator', icon: CpuChipIcon, component: 'virtualAccelerator' });
    }

    // Check and inject Project Advisor
    if (!children.some(child => child.component === 'projectAdvisor')) {
        children.push({ title: 'Project Advisor', icon: LightBulbIcon, component: 'projectAdvisor' });
    }
    
    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={developmentComponentMap} onSetView={onSetView} />;
};
