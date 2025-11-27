
import React, { useState } from 'react';
import { OmniDashboard } from './OmniDashboard';
import { OmniVisualBuilder } from './OmniVisualBuilder';
import { MenuItemData } from '../../types';

interface OmniPlatformAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const OmniPlatformApp: React.FC<OmniPlatformAppProps> = ({ context, onSetView }) => {
    const [mode, setMode] = useState<'dashboard' | 'builder'>('dashboard');

    return (
        <div className="h-full w-full bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
            {mode === 'dashboard' && (
                <OmniDashboard onLaunchBuilder={() => setMode('builder')} />
            )}
            
            {mode === 'builder' && (
                <div className="absolute inset-0 z-50">
                    <OmniVisualBuilder onExit={() => setMode('dashboard')} />
                </div>
            )}
        </div>
    );
};
