
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { UniversalAppRenderer } from '../UniversalAppRenderer';

const gamingComponentMap: { [key: string]: React.FC<any> } = {
  gamingHub: () => <UniversalAppRenderer type="grid" title="Gaming Hub" />,
  myLibrary: () => <UniversalAppRenderer type="grid" title="My Library" />,
};

interface GamingAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const GamingApp: React.FC<GamingAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={gamingComponentMap} onSetView={onSetView} />;
};
