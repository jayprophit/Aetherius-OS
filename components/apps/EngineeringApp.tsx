
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { CADLab } from '../CADLab';
import { PlaceholderView } from '../PlaceholderView';
import { InfrastructureControl } from '../InfrastructureControl';
import { VirtualRigBuilder } from '../VirtualRigBuilder';
import { ServerIcon } from '../Icons';

const engineeringComponentMap: { [key: string]: React.FC<any> } = {
  cadLab: CADLab,
  engineeringHub: InfrastructureControl,
  rigBuilder: VirtualRigBuilder,
  simulationHub: () => <PlaceholderView viewName="Simulation Hub" />,
};

interface EngineeringAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const EngineeringApp: React.FC<EngineeringAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }

    // Manually inject the new component if not present in data.ts yet
    const augmentedMenuItem = { ...context.menuItem };
    const children = augmentedMenuItem.children ? [...augmentedMenuItem.children] : [];
    
    // Map "Engineering Hub" to the new Infrastructure Control
    const hubIndex = children.findIndex(c => c.title === 'Engineering Hub');
    if (hubIndex !== -1) {
        children[hubIndex] = { ...children[hubIndex], title: 'Infrastructure Control', component: 'engineeringHub' };
    }
    
    // Inject Rig Builder
    if (!children.some(c => c.component === 'rigBuilder')) {
        children.push({ title: 'Virtual Rig Builder', icon: ServerIcon, component: 'rigBuilder' });
    }

    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={engineeringComponentMap} onSetView={onSetView} />;
};
