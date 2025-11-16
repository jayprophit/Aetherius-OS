import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { PlaceholderView } from '../PlaceholderView';

const enterpriseComponentMap: { [key: string]: React.FC<any> } = {
  crm: () => <PlaceholderView viewName="Customer Relationship Management (CRM)" />,
  erp: () => <PlaceholderView viewName="Enterprise Resource Planning (ERP)" />,
  scm: () => <PlaceholderView viewName="Supply Chain Management (SCM)" />,
  hcm: () => <PlaceholderView viewName="Human Capital Management (HCM)" />,
  ppm: () => <PlaceholderView viewName="Project & Portfolio Management (PPM)" />,
  fsm: () => <PlaceholderView viewName="Field Service Management (FSM)" />,
  bpm: () => <PlaceholderView viewName="Business Process Management (BPM)" />,
};

interface EnterpriseAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const EnterpriseApp: React.FC<EnterpriseAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={enterpriseComponentMap} onSetView={onSetView} />;
};
