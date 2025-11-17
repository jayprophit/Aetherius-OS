import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { PlaceholderView } from '../PlaceholderView';

const rdComponentMap: { [key: string]: React.FC<any> } = {
  vrStudio: () => <PlaceholderView viewName="VR/AR Studio" />,
  bciLab: () => <PlaceholderView viewName="Brain-Computer Interface Lab" />,
  digitalTwinSim: () => <PlaceholderView viewName="Digital Twin Simulator" />,
};

interface RD_HubAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const RD_HubApp: React.FC<RD_HubAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={rdComponentMap} onSetView={onSetView} />;
};
