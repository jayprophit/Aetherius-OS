import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { JobSearch } from '../JobSearch';
import { CvBuilder } from '../CvBuilder';

const careersComponentMap: { [key: string]: React.FC<any> } = {
  jobSearch: JobSearch,
  cvBuilder: CvBuilder,
};

interface CareersAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const CareersApp: React.FC<CareersAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={careersComponentMap} onSetView={onSetView} />;
};
