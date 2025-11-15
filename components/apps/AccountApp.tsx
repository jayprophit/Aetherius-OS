import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import MyProfile from '../MyProfile';
import { PlaceholderView } from '../PlaceholderView';

const accountComponentMap: { [key: string]: React.FC<any> } = {
  myProfile: MyProfile,
  linkedDevices: () => <PlaceholderView viewName="Linked Devices" />,
};

interface AccountAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const AccountApp: React.FC<AccountAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={accountComponentMap} onSetView={onSetView} />;
};
