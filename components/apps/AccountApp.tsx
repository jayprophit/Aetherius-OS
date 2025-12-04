
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import MyProfile from '../MyProfile';
import { UniversalAppRenderer } from '../UniversalAppRenderer';

const accountComponentMap: { [key: string]: React.FC<any> } = {
  myProfile: MyProfile,
  linkedDevices: () => <UniversalAppRenderer type="devices" title="Linked Devices" />,
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
