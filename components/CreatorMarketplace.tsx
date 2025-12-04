
import React, { useState, useMemo } from 'react';
import { creatorMarketplaceItems } from '../data';
import { MarketplaceItem, MarketplaceItemType } from '../types';
import { SearchIcon, StarIcon, ArrowDownTrayIcon, Squares2X2Icon, PuzzlePieceIcon, PaintBrushIcon, GameControllerIcon, ChevronDownIcon } from './Icons';

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
                        <span className="text-xs text-gray-400">({formatDownloads(item.downloads || 0)})</span>
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
    const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'rating'>('popular');

    const categories: { label: 'All' | MarketplaceItemType, icon: React.FC<any> }[] = [
        { label: 'All', icon: Squares2X2Icon },
        { label: 'App', icon: Squares2X2Icon },
        { label: 'Game', icon: GameControllerIcon },
        { label: 'Theme', icon: PaintBrushIcon },
        { label: 'Plugin', icon: PuzzlePieceIcon },
    ];

    const filteredItems = useMemo(() => {
        let items = creatorMarketplaceItems.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.type === activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });

        // Apply sorting
        switch (sortBy) {
            case 'price-low':
                items = items.sort((a, b) => {
                    const pA = a.price === 'Free' ? 0 : a.price;
                    const pB = b.price === 'Free' ? 0 : b.price;
                    return pA - pB;
                });
                break;
            case 'price-high':
                items = items.sort((a, b) => {
                    const pA = a.price === 'Free' ? 0 : a.price;
                    const pB = b.price === 'Free' ? 0 : b.price;
                    return pB - pA;
                });
                break;
            case 'rating':
                items = items.sort((a, b) => b.rating - a.rating);
                break;
            case 'popular':
            default:
                // Assuming default list is somewhat ordered by popularity or just leave as is
                // Could sort by downloads if available
                items = items.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
                break;
        }
        
        return items;
    }, [searchTerm, activeCategory, sortBy]);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Creator Marketplace & Store</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Discover apps, themes, and plugins built by the Aetherius community.</p>
            </header>
            
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-4 sticky top-0 z-10 shadow-sm">
                <div className="flex flex-col md:flex-row items-center gap-4">
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
                    
                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Sort by:</span>
                        <div className="relative">
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-gray-700 dark:text-gray-200"
                            >
                                <option value="popular">Popular</option>
                                <option value="rating">Top Rated</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                            <ChevronDownIcon className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"/>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap border-t border-gray-100 dark:border-gray-700 pt-4">
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
