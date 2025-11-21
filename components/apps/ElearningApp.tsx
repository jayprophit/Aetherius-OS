
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { LearningRealms } from '../LearningRealms';
import { MyLearning, LearningAssistant, Achievements } from '../MyLearning';
import { ElearningPlatforms } from '../ElearningPlatforms';

const elearningComponentMap: { [key: string]: React.FC<any> } = {
  learningRealms: LearningRealms,
  myLearning: MyLearning,
  learningAssistant: LearningAssistant,
  achievements: Achievements,
  elearningPlatforms: ElearningPlatforms,
};

interface ElearningAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const ElearningApp: React.FC<ElearningAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={elearningComponentMap} onSetView={onSetView} />;
};
