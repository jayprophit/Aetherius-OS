
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { PlaceholderView } from '../PlaceholderView';
import { CodeBracketIcon, PencilIcon, ArrowPathIcon, HiveMindIcon, CloudIcon, CpuChipIcon, DnaIcon, CircleStackIcon } from '../Icons';
import { HuggingFaceModelHub } from '../HuggingFaceModelHub';
import { QuantumNeuralNetwork } from '../QuantumNeuralNetwork';
import { QuantumDNACore } from '../QuantumDNACore';
import { MemoryNode } from '../MemoryNode';

const aiSuiteComponentMap: { [key: string]: React.FC<any> } = {
  lovableClone: () => <PlaceholderView viewName="Lovable (App Builder) Clone" />,
  replitClone: () => <PlaceholderView viewName="Replit (IDE) Clone" />,
  midjourneyClone: () => <PlaceholderView viewName="Midjourney (Image Gen) Clone" />,
  runwayClone: () => <PlaceholderView viewName="Runway (Video Gen) Clone" />,
  elevenlabsClone: () => <PlaceholderView viewName="11 Labs (Voice Gen) Clone" />,
  zapierClone: () => <PlaceholderView viewName="Zapier (Workflow) Clone" />,
  makeClone: () => <PlaceholderView viewName="Make.com Clone" />,
  lindyClone: () => <PlaceholderView viewName="Lindy (AI Agent) Clone" />,
  huggingFaceHub: HuggingFaceModelHub,
  quantumNN: QuantumNeuralNetwork,
  quantumDNACore: QuantumDNACore,
  memoryNode: MemoryNode,
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
            { title: 'Quantum Intelligence', icon: CpuChipIcon, component: 'quantumNN', children: [
                { title: 'Quantum Neural Network', icon: CpuChipIcon, component: 'quantumNN' },
            ]},
            { title: 'Memory & Context', icon: CircleStackIcon, component: 'memoryNode', children: [
                { title: 'Memory Core', icon: CircleStackIcon, component: 'memoryNode' },
            ]},
            { title: 'Identity & Biology', icon: DnaIcon, component: 'quantumDNACore', children: [
                { title: 'Quantum DNA Core', icon: DnaIcon, component: 'quantumDNACore' },
            ]},
            { title: 'Software Builders', icon: CodeBracketIcon, component: 'lovableClone', children: [
                { title: 'App Builder', icon: CodeBracketIcon, component: 'lovableClone' },
                { title: 'Cloud IDE', icon: CodeBracketIcon, component: 'replitClone' },
            ]},
            { title: 'Local Models', icon: CloudIcon, component: 'huggingFaceHub', children: [
                { title: 'Hugging Face Hub', icon: CloudIcon, component: 'huggingFaceHub' },
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
