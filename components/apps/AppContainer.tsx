
import React, { useState, useEffect } from 'react';
import { MenuItemData } from '../../types';
import { ChevronRightIcon } from '../Icons';

interface AppContainerProps {
    menuItem: MenuItemData;
    componentMap: { [key: string]: React.FC<any> };
    onSetView: (view: string, context?: any) => void;
}

export const AppContainer: React.FC<AppContainerProps> = ({ menuItem, componentMap, onSetView }) => {
    const subMenuItems = menuItem.children || [];
    
    // Determine default view: First child with a component, or the first child's first child (nested), or empty
    const getDefaultView = () => {
        const first = subMenuItems[0];
        if (!first) return '';
        if (first.component) return first.component;
        if (first.children && first.children.length > 0) return first.children[0].component || '';
        return '';
    };

    const [activeView, setActiveView] = useState<string>(getDefaultView());
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

    // Ensure active view is valid on mount/update
    useEffect(() => {
        if (!activeView && subMenuItems.length > 0) {
            setActiveView(getDefaultView());
        }
    }, [menuItem]);

    // Self-Contained Navigation Handler
    const handleInternalSetView = (view: string, context?: any) => {
        // If the requested view exists inside this app, switch locally
        if (componentMap[view]) {
            setActiveView(view);
        } else {
            // Otherwise, bubble up to the OS window manager (e.g. opening a different app)
            onSetView(view, context);
        }
    };

    const ActiveComponent = componentMap[activeView] || (() => (
        <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
                <h3 className="text-lg font-bold">Component Not Found</h3>
                <p className="text-sm">The view "{activeView}" is not registered in this application.</p>
            </div>
        </div>
    ));

    const handleMenuClick = (item: MenuItemData) => {
        if (item.component) {
            setActiveView(item.component);
        }
        if (item.children && item.title) {
            setOpenSubmenus(prev => ({ ...prev, [item.title!]: !prev[item.title!] }));
        }
    };

    const renderMenuItems = (items: MenuItemData[], level = 0) => {
        return items.map((item, idx) => {
            if (item.type === 'divider') return <div key={`div-${idx}`} className="my-2 border-t border-gray-200 dark:border-gray-700 mx-2"></div>;
            if (item.type === 'title') return <h4 key={`tit-${idx}`} className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{item.title}</h4>;
            if (!item.title) return null;
            
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
                        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
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
                    {menuItem.icon && <menuItem.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                    {menuItem.title}
                </h2>
                <nav className="space-y-1 overflow-y-auto flex-1">
                    {renderMenuItems(subMenuItems)}
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto relative">
                <ActiveComponent onSetView={handleInternalSetView} />
            </main>
        </div>
    );
};
