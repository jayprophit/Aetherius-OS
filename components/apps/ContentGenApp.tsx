
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { DocumentEditor } from '../DocumentEditor';
import { CreationLab } from '../CreationLab';
import { DocumentTextIcon } from '../Icons';

const contentGenComponentMap: { [key: string]: React.FC<any> } = {
  articleWriter: DocumentEditor,
  scriptGenerator: DocumentEditor,
  slideDeckDesigner: DocumentEditor,
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
    
    // Ensure icons and components are set
    const augmentedMenuItem = { ...context.menuItem };
    if (augmentedMenuItem.children) {
        augmentedMenuItem.children = augmentedMenuItem.children.map(child => {
             if (['articleWriter', 'scriptGenerator', 'slideDeckDesigner'].includes(child.component || '')) {
                 return { ...child, icon: DocumentTextIcon };
             }
             return child;
        });
    }

    return <AppContainer menuItem={augmentedMenuItem} componentMap={contentGenComponentMap} onSetView={onSetView} />;
};
