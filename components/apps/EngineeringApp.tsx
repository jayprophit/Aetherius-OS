import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { CADLab } from '../CADLab';
import { PlaceholderView } from '../PlaceholderView';

const engineeringComponentMap: { [key: string]: React.FC<any> } = {
  cadLab: CADLab,
  engineeringHub: () => <PlaceholderView viewName="Engineering Hub" />,
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
    return <AppContainer menuItem={context.menuItem} componentMap={engineeringComponentMap} onSetView={onSetView} />;
};
