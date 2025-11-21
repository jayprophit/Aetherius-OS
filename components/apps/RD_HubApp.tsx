
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { PlaceholderView } from '../PlaceholderView';
import { DigitalTwinEngine } from '../DigitalTwinEngine';
import { CubeTransparentIcon } from '../Icons';

const rdComponentMap: { [key: string]: React.FC<any> } = {
  vrStudio: () => <PlaceholderView viewName="VR/AR Studio" />,
  bciLab: () => <PlaceholderView viewName="Brain-Computer Interface Lab" />,
  digitalTwinSim: DigitalTwinEngine,
};

interface RD_HubAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const RD_HubApp: React.FC<RD_HubAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }

    // Inject Digital Twin if not present (or update title)
    const augmentedMenuItem = { ...context.menuItem };
    let children = augmentedMenuItem.children ? [...augmentedMenuItem.children] : [];
    
    if (!children.some(c => c.component === 'digitalTwinSim')) {
         children.push({ title: 'Digital Twin Engine', icon: CubeTransparentIcon, component: 'digitalTwinSim' });
    }

    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={rdComponentMap} onSetView={onSetView} />;
};
