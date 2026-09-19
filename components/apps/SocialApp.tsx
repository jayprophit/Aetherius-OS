
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { Members } from '../Members';
import { Groups } from '../Groups';
import { SocialFeed } from '../SocialFeed';
import { GovernancePortal } from '../GovernancePortal'; 
import { Messenger } from '../Messenger';
import { CommunityView } from '../social/CommunityView';
import { WatchView } from '../social/WatchView';
import { UniversalAppRenderer } from '../UniversalAppRenderer';
import { ScaleIcon, ChatBubbleLeftRightIcon, UserGroupIcon, PlayCircleIcon, HomeIcon, UserCircleIcon, ChatBubbleOvalLeftEllipsisIcon } from '../Icons';

// Helper Icons for Menu
const FeedIcon = (props: any) => <HomeIcon {...props} />;
const CommunitiesIcon = (props: any) => <UserGroupIcon {...props} />;
const WatchIcon = (props: any) => <PlayCircleIcon {...props} />;
const MessageIcon = (props: any) => <ChatBubbleOvalLeftEllipsisIcon {...props} />;

const FeedView: React.FC<{ onSetView: (view: string, context?:any) => void }> = ({ onSetView }) => (
    <div className="p-4"><SocialFeed onSetView={onSetView} /></div>
);

const socialComponentMap: { [key: string]: React.FC<any> } = {
  feedBiome: FeedView,
  members: Members,
  groups: Groups,
  messaging: Messenger,
  communities: CommunityView,
  watch: WatchView,
  governance: GovernancePortal,
  forums: () => <UniversalAppRenderer type="dashboard" title="Forums" />,
  events: () => <UniversalAppRenderer type="calendar" title="Events" />, // Use calendar layout
};

interface SocialAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const SocialApp: React.FC<SocialAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }

    // Reconstruct the menu to match the comprehensive social platform request
    const augmentedMenuItem = { ...context.menuItem };
    
    const children: MenuItemData[] = [
        { title: 'Home Feed', icon: FeedIcon, component: 'feedBiome' },
        { title: 'Communities', icon: CommunitiesIcon, component: 'communities' }, // Discord Style
        { title: 'Watch & Live', icon: WatchIcon, component: 'watch' }, // TikTok/Twitch Style
        { title: 'Messenger', icon: MessageIcon, component: 'messaging' }, // WhatsApp Style
        { type: 'divider' },
        { title: 'Groups', icon: UserGroupIcon, component: 'groups' }, // FB Groups
        { title: 'Members', icon: UserCircleIcon, component: 'members' },
        { title: 'Governance', icon: ScaleIcon, component: 'governance' },
    ];
    
    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={socialComponentMap} onSetView={onSetView} />;
};
