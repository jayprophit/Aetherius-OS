
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { CreatorMarketplace } from '../CreatorMarketplace'; 
import { 
    CloudIcon, SearchIcon, BuildingLibraryIcon, GameControllerIcon, PaintBrushIcon, PuzzlePieceIcon
} from '../Icons';

const appMarketComponentMap: { [key: string]: React.FC<any> } = {
  marketplaceHome: CreatorMarketplace,
};

interface AppMarketAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const AppMarketApp: React.FC<AppMarketAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        // Fallback if launched directly without menu context
        const defaultMenu: MenuItemData = {
             title: 'App Market',
             icon: BuildingLibraryIcon,
             children: [
                 { title: 'Home', icon: BuildingLibraryIcon, component: 'marketplaceHome' },
                 { title: 'Games', icon: GameControllerIcon, component: 'marketplaceHome' },
                 { title: 'Themes', icon: PaintBrushIcon, component: 'marketplaceHome' },
                 { title: 'Plugins', icon: PuzzlePieceIcon, component: 'marketplaceHome' },
             ]
        };
        return <AppContainer menuItem={defaultMenu} componentMap={appMarketComponentMap} onSetView={onSetView} />;
    }

    // Ensure children exist
    const augmentedMenuItem = { ...context.menuItem };
    if (!augmentedMenuItem.children || augmentedMenuItem.children.length === 0) {
        augmentedMenuItem.children = [
             { title: 'Home', icon: BuildingLibraryIcon, component: 'marketplaceHome' },
             { title: 'Apps', icon: CloudIcon, component: 'marketplaceHome' },
             { title: 'Games', icon: GameControllerIcon, component: 'marketplaceHome' },
        ];
    }

    return <AppContainer menuItem={augmentedMenuItem} componentMap={appMarketComponentMap} onSetView={onSetView} />;
};
