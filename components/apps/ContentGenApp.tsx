import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { PlaceholderView } from '../PlaceholderView';
import { CreationLab } from '../CreationLab';

const contentGenComponentMap: { [key: string]: React.FC<any> } = {
  articleWriter: () => <PlaceholderView viewName="Article Writer" />,
  scriptGenerator: () => <PlaceholderView viewName="Script Generator" />,
  slideDeckDesigner: () => <PlaceholderView viewName="Slide Deck Designer" />,
  contentCreation: () => <CreationLab type="Content"/>,
};

interface ContentGenAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const ContentGenApp: React.FC<ContentGenAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={contentGenComponentMap} onSetView={onSetView} />;
};
