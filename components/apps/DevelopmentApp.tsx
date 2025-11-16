import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { PlaceholderView } from '../PlaceholderView';
import { GameEngine } from '../GameEngine';
import { AiSuiteApp } from './AiSuiteApp';

// This is the map for components *inside* the Development App window.
const developmentComponentMap: { [key: string]: React.FC<any> } = {
  codeEditor: () => <PlaceholderView viewName="Code Editor" />,
  websiteBuilder: () => <PlaceholderView viewName="Website Builder" />,
  gameEngine: GameEngine,
  aiSuite: AiSuiteApp,
};

interface DevelopmentAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const DevelopmentApp: React.FC<DevelopmentAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={developmentComponentMap} onSetView={onSetView} />;
};
