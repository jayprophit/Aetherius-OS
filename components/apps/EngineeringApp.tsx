
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { CADLab } from '../CADLab';
import { PlaceholderView } from '../PlaceholderView';
import { InfrastructureControl } from '../InfrastructureControl';
import { VirtualRigBuilder } from '../VirtualRigBuilder';
import { RoboticsControl } from '../RoboticsControl';
import { NanoFabricator } from '../NanoFabricator';
import { ServerIcon, CpuChipIcon, CubeTransparentIcon, CubeIcon } from '../Icons';

const engineeringComponentMap: { [key: string]: React.FC<any> } = {
  cadLab: CADLab,
  engineeringHub: InfrastructureControl,
  rigBuilder: VirtualRigBuilder,
  roboticsControl: RoboticsControl,
  nanoFab: NanoFabricator,
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

    // Manually inject new components
    const augmentedMenuItem = { ...context.menuItem };
    let children = augmentedMenuItem.children ? [...augmentedMenuItem.children] : [];
    
    const hubIndex = children.findIndex(c => c.title === 'Engineering Hub');
    if (hubIndex !== -1) {
        children[hubIndex] = { ...children[hubIndex], title: 'Infrastructure Control', component: 'engineeringHub' };
    }
    
    if (!children.some(c => c.component === 'rigBuilder')) {
        children.push({ title: 'Virtual Rig Builder', icon: ServerIcon, component: 'rigBuilder' });
    }
    // Inject Robotics
    if (!children.some(c => c.component === 'roboticsControl')) {
        children.push({ title: 'Robotics Control', icon: CpuChipIcon, component: 'roboticsControl' });
    }
    // Inject Nano Fab
    if (!children.some(c => c.component === 'nanoFab')) {
        children.push({ title: 'Nano-Fabricator', icon: CubeIcon, component: 'nanoFab' });
    }

    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={engineeringComponentMap} onSetView={onSetView} />;
};
