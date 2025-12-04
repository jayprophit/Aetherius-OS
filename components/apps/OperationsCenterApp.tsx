
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { CloudOpsApp } from './CloudOpsApp';
import { AIOpsMonitor } from '../ops/AIOpsMonitor';
import { IoTMap } from '../iot/IoTMap';
import { CloudIcon, BoltIcon, WifiIcon } from '../Icons';

const opsComponentMap: { [key: string]: React.FC<any> } = {
  cloudOps: CloudOpsApp,
  aiOps: AIOpsMonitor,
  iotManager: IoTMap,
};

interface OperationsCenterAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const OperationsCenterApp: React.FC<OperationsCenterAppProps> = ({ context, onSetView }) => {
    const menu = context.menuItem || { title: 'Operations Center', icon: CloudIcon, children: [] };
    
    if (!menu.children || menu.children.length === 0) {
        menu.children = [
            { title: 'Cloud Infrastructure', icon: CloudIcon, component: 'cloudOps' },
            { title: 'Autonomous Ops (AI)', icon: BoltIcon, component: 'aiOps' },
            { title: 'IoT Mesh Network', icon: WifiIcon, component: 'iotManager' }
        ];
    }

    return <AppContainer menuItem={menu} componentMap={opsComponentMap} onSetView={onSetView} />;
};
