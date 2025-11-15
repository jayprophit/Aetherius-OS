import React, { useState, useMemo } from 'react';
import { creatorMarketplaceItems } from '../data';
import { MarketplaceItem, MarketplaceItemType } from '../types';
import { SearchIcon, StarIcon, ArrowDownTrayIcon, Squares2X2Icon, PuzzlePieceIcon, PaintBrushIcon, GameControllerIcon } from './Icons';

const CategoryFilterButton: React.FC<{
    label: string;
    icon: React.FC<any>;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            isActive
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
    >
        <Icon className="w-5 h-5" />
        {label}
    </button>
);

const MarketplaceItemCard: React.FC<{ item: MarketplaceItem }> = ({ item }) => {
    const formatDownloads = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num;
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 flex flex-col gap-4 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <img src={item.iconUrl} alt={`${item.name} logo`} className="w-12 h-12" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">by {item.creator.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <StarIcon solid className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-bold">{item.rating}</span>
                        <span className="text-xs text-gray-400">({formatDownloads(item.downloads)})</span>
                    </div>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">{item.description}</p>
            <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-bold">
                    {item.price === 'Free' ? 'Free' : `$${item.price}`}
                </span>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-800 dark:bg-blue-600 rounded-md hover:bg-gray-700 dark:hover:bg-blue-500 transition-colors">
                    <ArrowDownTrayIcon className="w-4 h-4"/>
                    {item.price === 'Free' ? 'Install' : 'Buy'}
                </button>
            </div>
        </div>
    );
};


export const CreatorMarketplace: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<MarketplaceItemType | 'All'>('All');

    const categories: { label: 'All' | MarketplaceItemType, icon: React.FC<any> }[] = [
        { label: 'All', icon: Squares2X2Icon },
        { label: 'App', icon: Squares2X2Icon },
        { label: 'Game', icon: GameControllerIcon },
        { label: 'Theme', icon: PaintBrushIcon },
        { label: 'Plugin', icon: PuzzlePieceIcon },
    ];

    const filteredItems = useMemo(() => {
        return creatorMarketplaceItems.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.type === activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchTerm, activeCategory]);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Creator Marketplace & Store</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Discover apps, themes, and plugins built by the Aetherius community.</p>
            </header>
            
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center gap-4 sticky top-0 z-10">
                <div className="relative w-full md:flex-1">
                    <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text"
                        placeholder="Search for apps, themes, plugins..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md h-10 pl-10 pr-4 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {categories.map(cat => (
                        <CategoryFilterButton
                            key={cat.label}
                            label={cat.label}
                            icon={cat.icon}
                            isActive={activeCategory === cat.label}
                            onClick={() => setActiveCategory(cat.label)}
                        />
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <MarketplaceItemCard key={item.id} item={item} />
                ))}
            </div>
            {filteredItems.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No items found</p>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or category filters.</p>
                </div>
            )}
        </div>
    );
};