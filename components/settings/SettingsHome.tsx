import React from 'react';
import { settingsConfig } from '../../data';
import { SearchIcon } from '../Icons';
import { loggedInUser } from '../../data';

const CategoryCard: React.FC<{ category: any; onClick: () => void; }> = ({ category, onClick }) => {
    const { icon: Icon, title, description } = category;
    return (
        <button 
            onClick={onClick}
            className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 flex items-start gap-4"
        >
            <Icon className="w-8 h-8 text-gray-600 dark:text-gray-300 flex-shrink-0 mt-1" />
            <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            </div>
        </button>
    );
};

export const SettingsHome: React.FC<{ onSelectCategory: (id: string) => void }> = ({ onSelectCategory }) => {
    return (
        <div className="h-full w-full p-4 md:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-800/50">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Settings</h1>
                <div className="relative max-w-sm">
                    <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Find a setting" className="bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md h-10 pl-10 pr-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </header>
            
            <div className="p-4 flex items-center gap-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
                <img src={loggedInUser.avatarUrl || ''} alt="User" className="w-16 h-16 rounded-full"/>
                <div>
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{loggedInUser.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{loggedInUser.email}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settingsConfig.map(category => (
                    <CategoryCard key={category.id} category={category} onClick={() => onSelectCategory(category.id)} />
                ))}
            </div>
        </div>
    );
};
