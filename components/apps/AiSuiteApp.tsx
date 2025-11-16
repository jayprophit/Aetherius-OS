import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { PlaceholderView } from '../PlaceholderView';
import { CodeBracketIcon, PencilIcon, ArrowPathIcon, HiveMindIcon } from '../Icons';

const aiSuiteComponentMap: { [key: string]: React.FC<any> } = {
  lovableClone: () => <PlaceholderView viewName="Lovable (App Builder) Clone" />,
  replitClone: () => <PlaceholderView viewName="Replit (IDE) Clone" />,
  midjourneyClone: () => <PlaceholderView viewName="Midjourney (Image Gen) Clone" />,
  runwayClone: () => <PlaceholderView viewName="Runway (Video Gen) Clone" />,
  elevenlabsClone: () => <PlaceholderView viewName="11 Labs (Voice Gen) Clone" />,
  zapierClone: () => <PlaceholderView viewName="Zapier (Workflow) Clone" />,
  makeClone: () => <PlaceholderView viewName="Make.com Clone" />,
  lindyClone: () => <PlaceholderView viewName="Lindy (AI Agent) Clone" />,
};

interface AiSuiteAppProps {
    onSetView: (view: string, context?: any) => void;
}

export const AiSuiteApp: React.FC<AiSuiteAppProps> = ({ onSetView }) => {
    // This is the menu structure *inside* the AI Suite App
    const aiSuiteContainerMenuItem: MenuItemData = {
        title: 'AI Suite',
        icon: HiveMindIcon,
        children: [
            { title: 'Software Builders', icon: CodeBracketIcon, component: 'lovableClone', children: [
                { title: 'App Builder', icon: CodeBracketIcon, component: 'lovableClone' },
                { title: 'Cloud IDE', icon: CodeBracketIcon, component: 'replitClone' },
            ]},
            { title: 'Content Creation', icon: PencilIcon, component: 'midjourneyClone', children: [
                { title: 'Image Generation', icon: PencilIcon, component: 'midjourneyClone' },
                { title: 'Video Generation', icon: PencilIcon, component: 'runwayClone' },
                { title: 'Voice Generation', icon: PencilIcon, component: 'elevenlabsClone' },
            ]},
            { title: 'Automation', icon: ArrowPathIcon, component: 'zapierClone', children: [
                { title: 'Zapier Clone', icon: ArrowPathIcon, component: 'zapierClone' },
                { title: 'Make.com Clone', icon: ArrowPathIcon, component: 'makeClone' },
            ]},
            { title: 'AI Agents', icon: HiveMindIcon, component: 'lindyClone', children: [
                { title: 'Lindy Clone', icon: HiveMindIcon, component: 'lindyClone' },
            ]},
        ]
    };
    
    return <AppContainer 
        menuItem={aiSuiteContainerMenuItem} 
        componentMap={aiSuiteComponentMap} 
        onSetView={onSetView}
    />;
};
