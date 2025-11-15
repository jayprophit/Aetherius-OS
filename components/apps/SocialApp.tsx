import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { Members } from '../Members';
import { Groups } from '../Groups';
import { PlaceholderView } from '../PlaceholderView';
import { SocialFeed } from '../SocialFeed';


const FeedView: React.FC<{ onSetView: (view: string, context?:any) => void }> = ({ onSetView }) => (
    <div className="p-4"><SocialFeed onSetView={onSetView} /></div>
);


const socialComponentMap: { [key: string]: React.FC<any> } = {
  feedBiome: FeedView,
  members: Members,
  groups: Groups,
  forums: () => <PlaceholderView viewName="Forums" />,
  events: () => <PlaceholderView viewName="Events" />,
};

interface SocialAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const SocialApp: React.FC<SocialAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={socialComponentMap} onSetView={onSetView} />;
};
