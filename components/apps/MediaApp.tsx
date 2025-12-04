
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { CreationLab } from '../CreationLab';
import { VideoEditor } from '../VideoEditor';
import { PhotoEditor } from '../PhotoEditor';
import { MediaPlayer } from '../MediaPlayer';
import { PhotoIcon, PlayIcon } from '../Icons';

const mediaComponentMap: { [key: string]: React.FC<any> } = {
  musicProduction: () => <CreationLab type="Music"/>,
  videoProduction: () => <CreationLab type="Video"/>,
  imageEditing: () => <CreationLab type="Image"/>,
  photoEditor: PhotoEditor,
  videoEditor: VideoEditor,
  mediaPlayer: MediaPlayer,
};

interface MediaAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const MediaApp: React.FC<MediaAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }

    const augmentedMenuItem = { ...context.menuItem };
    let children = augmentedMenuItem.children ? [...augmentedMenuItem.children] : [];

    // Inject new tools if they don't exist
    if (!children.some(c => c.component === 'photoEditor')) {
        children.push({ title: 'Photo Editor', icon: PhotoIcon, component: 'photoEditor' });
    }
    if (!children.some(c => c.component === 'mediaPlayer')) {
        children.push({ title: 'Media Player', icon: PlayIcon, component: 'mediaPlayer' });
    }
    
    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={mediaComponentMap} onSetView={onSetView} />;
};
