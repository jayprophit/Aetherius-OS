import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { CreationLab } from '../CreationLab';
import { PlaceholderView } from '../PlaceholderView';

const mediaComponentMap: { [key: string]: React.FC<any> } = {
  musicProduction: () => <CreationLab type="Music"/>,
  videoProduction: () => <CreationLab type="Video"/>,
  imageEditing: () => <CreationLab type="Image"/>,
  photoEditor: () => <PlaceholderView viewName="Photo Editor" />,
  videoEditor: () => <PlaceholderView viewName="Video Editor" />,
};

interface MediaAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const MediaApp: React.FC<MediaAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={mediaComponentMap} onSetView={onSetView} />;
};
