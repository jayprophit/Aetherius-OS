import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { PlaceholderView } from '../PlaceholderView';

const productivityComponentMap: { [key: string]: React.FC<any> } = {
  mail: () => <PlaceholderView viewName="Mail" />,
  calendar: () => <PlaceholderView viewName="Calendar" />,
  notes: () => <PlaceholderView viewName="Notes" />,
  documents: () => <PlaceholderView viewName="Documents" />,
  taskHub: () => <PlaceholderView viewName="Task Hub" />,
  translate: () => <PlaceholderView viewName="Translate" />,
};

interface ProductivityAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const ProductivityApp: React.FC<ProductivityAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={productivityComponentMap} onSetView={onSetView} />;
};
