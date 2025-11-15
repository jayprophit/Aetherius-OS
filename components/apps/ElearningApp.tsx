import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { Elearning } from '../Elearning';
import { MyLearning } from '../MyLearning';
import { PlaceholderView } from '../PlaceholderView';

const elearningComponentMap: { [key: string]: React.FC<any> } = {
  courses: Elearning,
  myLearning: MyLearning,
  instructors: () => <PlaceholderView viewName="Instructors" />,
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
