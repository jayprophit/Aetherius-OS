
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { Members } from '../Members';
import { Groups } from '../Groups';
import { PlaceholderView } from '../PlaceholderView';
import { SocialFeed } from '../SocialFeed';
import { GovernancePortal } from '../GovernancePortal'; // Import
import { ScaleIcon } from '../Icons'; // Import Icon

const FeedView: React.FC<{ onSetView: (view: string, context?:any) => void }> = ({ onSetView }) => (
    <div className="p-4"><SocialFeed onSetView={onSetView} /></div>
);

const socialComponentMap: { [key: string]: React.FC<any> } = {
  feedBiome: FeedView,
  members: Members,
  groups: Groups,
  forums: () => <PlaceholderView viewName="Forums" />,
  events: () => <PlaceholderView viewName="Events" />,
  governance: GovernancePortal, // Add map
};

interface SocialAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const SocialApp: React.FC<SocialAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }

    // Inject Governance
    const augmentedMenuItem = { ...context.menuItem };
    let children = augmentedMenuItem.children ? [...augmentedMenuItem.children] : [];

    if (!children.some(c => c.component === 'governance')) {
        children.push({ title: 'Governance & Voting', icon: ScaleIcon, component: 'governance' });
    }
    
    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={socialComponentMap} onSetView={onSetView} />;
};
