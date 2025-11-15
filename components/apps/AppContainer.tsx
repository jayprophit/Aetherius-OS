import React, { useState } from 'react';
import { MenuItemData } from '../../types';
import { ChevronRightIcon } from '../Icons';

interface AppContainerProps {
    menuItem: MenuItemData;
    componentMap: { [key: string]: React.FC<any> };
    onSetView: (view: string, context?: any) => void;
}

export const AppContainer: React.FC<AppContainerProps> = ({ menuItem, componentMap, onSetView }) => {
    const subMenuItems = menuItem.children || [];
    const defaultView = subMenuItems.find(item => item.component)?.component || '';
    const [activeView, setActiveView] = useState<string>(defaultView);
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

    const ActiveComponent = componentMap[activeView] || (() => <div>Component {activeView} not found.</div>);

    const handleMenuClick = (item: MenuItemData) => {
        if (item.component) {
            setActiveView(item.component);
        }
        if (item.children && item.title) {
            setOpenSubmenus(prev => ({ ...prev, [item.title!]: !prev[item.title!] }));
        }
    };

    const renderMenuItems = (items: MenuItemData[], level = 0) => {
        return items.map(item => {
            if (item.type === 'divider' || item.type === 'title' || !item.title || !item.icon) return null;
            const Icon = item.icon;
            const isActive = activeView === item.component;
            const hasChildren = item.children && item.children.length > 0;
            const isSubmenuOpen = openSubmenus[item.title!] || false;

            return (
                <div key={item.title}>
                    <button
                        onClick={() => handleMenuClick(item)}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-sm font-medium transition-colors ${
                            isActive
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                        style={{ paddingLeft: `${0.5 + level * 1}rem`}}
                    >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-left">{item.title}</span>
                        {hasChildren && <ChevronRightIcon className={`w-4 h-4 transition-transform ${isSubmenuOpen ? 'rotate-90' : ''}`} />}
                    </button>
                    {hasChildren && isSubmenuOpen && (
                        <div className="mt-1 space-y-1">
                            {renderMenuItems(item.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="flex h-full bg-gray-50 dark:bg-gray-900">
            <aside className="w-60 bg-white dark:bg-gray-800 p-3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <h2 className="text-lg font-bold px-2 pb-2 mb-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    {menuItem.icon && <menuItem.icon className="w-6 h-6" />}
                    {menuItem.title}
                </h2>
                <nav className="space-y-1 overflow-y-auto">
                    {renderMenuItems(subMenuItems)}
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto">
                <ActiveComponent onSetView={onSetView} />
            </main>
        </div>
    );
};
