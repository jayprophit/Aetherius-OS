
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { ECommercePlatforms } from '../ECommercePlatforms';
import { ContractExplorer } from '../ContractExplorer';
import { EnterpriseDashboard } from '../business/EnterpriseDashboard';
import { UniversalAppRenderer } from '../UniversalAppRenderer';
import { BuildingOfficeIcon } from '../Icons';

const enterpriseComponentMap: { [key: string]: React.FC<any> } = {
  enterpriseDashboard: EnterpriseDashboard,
  crm: () => <UniversalAppRenderer type="dashboard" title="CRM" />, // Kept as fallback/sub-view
  erp: () => <UniversalAppRenderer type="dashboard" title="ERP" />,
  eCommercePlatforms: ECommercePlatforms,
  contractExplorer: ContractExplorer,
};

interface EnterpriseAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const EnterpriseApp: React.FC<EnterpriseAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }

    const augmentedMenuItem = { ...context.menuItem };
    
    // Ensure Dashboard is the first item
    if (augmentedMenuItem.children) {
        if (!augmentedMenuItem.children.some(c => c.component === 'enterpriseDashboard')) {
             augmentedMenuItem.children.unshift({ title: 'Command Center', icon: BuildingOfficeIcon, component: 'enterpriseDashboard' });
        }
    } else {
        augmentedMenuItem.children = [
             { title: 'Command Center', icon: BuildingOfficeIcon, component: 'enterpriseDashboard' },
        ];
    }

    return <AppContainer menuItem={augmentedMenuItem} componentMap={enterpriseComponentMap} onSetView={onSetView} />;
};
