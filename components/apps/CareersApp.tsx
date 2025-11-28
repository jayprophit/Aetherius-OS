
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { JobsPlatform } from '../JobSearch'; // Renamed file export but keeping import consistent
import { CvBuilder } from '../CvBuilder';
import { BriefcaseIcon, UserCircleIcon, GlobeAltIcon } from '../Icons';

// We can map sub-components here if we want direct access from the sidebar menu
const careersComponentMap: { [key: string]: React.FC<any> } = {
  jobsPlatform: JobsPlatform,
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

    // Augment the menu structure to include the new sections
    const augmentedMenuItem = { ...context.menuItem };
    
    const children: MenuItemData[] = [
        { title: 'Jobs Platform', icon: GlobeAltIcon, component: 'jobsPlatform' },
        { title: 'CV Builder', icon: UserCircleIcon, component: 'cvBuilder' },
    ];

    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={careersComponentMap} onSetView={onSetView} />;
};
