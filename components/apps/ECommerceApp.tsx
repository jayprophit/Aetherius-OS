
import React, { useState, useMemo } from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData, MarketplaceItem } from '../../types';
import { CreatorMarketplace } from '../CreatorMarketplace';
import { Marketplace } from '../Marketplace';
import { ProductPage } from '../ProductPage';
import { creatorMarketplaceItems } from '../../data';
import { SearchIcon, ShoppingCartIcon, CubeTransparentIcon } from '../Icons';

// Mock data for physical items to allow search unification
const mockPhysicalItems: MarketplaceItem[] = [
    { id: 'phy-1', name: 'QuantumLeap Robot Arm', creator: { id: 'b1', name: 'QuantumLeap', avatarUrl: '' }, type: 'Digital Asset', price: 1200, rating: 4.8, downloads: 50, iconUrl: '', description: 'Physical robotic arm.' },
    { id: 'phy-2', name: 'SynthWave Keyboard', creator: { id: 'b2', name: 'SynthWave', avatarUrl: '' }, type: 'Digital Asset', price: 250, rating: 4.5, downloads: 200, iconUrl: '', description: 'High-end synthesizer.' },
];

const CommerceSearch: React.FC<{ onSetView: (view: string, context?: any) => void }> = ({ onSetView }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const allItems = [...creatorMarketplaceItems, ...mockPhysicalItems];

    const results = useMemo(() => {
        if (!searchTerm) return [];
        return allItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, allItems]);

    return (
        <div className="p-6 h-full bg-gray-100 dark:bg-gray-900 overflow-y-auto">
             <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Unified Commerce Search</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Search across all marketplaces (Digital & Physical).</p>
            </header>
            
            <div className="relative mb-8">
                 <SearchIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                 <input 
                    type="text" 
                    placeholder="Search products, apps, themes..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map(item => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-start gap-4 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => onSetView(item.id.startsWith('phy') ? 'productPage' : 'creatorMarketplace')}>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                             {item.id.startsWith('phy') ? <ShoppingCartIcon className="w-6 h-6 text-blue-600"/> : <CubeTransparentIcon className="w-6 h-6 text-purple-600"/>}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">{item.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.creator.name}</p>
                            <p className="text-sm font-bold text-blue-600 mt-1">${item.price}</p>
                        </div>
                    </div>
                ))}
                {searchTerm && results.length === 0 && (
                    <p className="text-gray-500 col-span-full text-center">No results found.</p>
                )}
            </div>
        </div>
    );
};

const eCommerceComponentMap: { [key: string]: React.FC<any> } = {
  commerceSearch: CommerceSearch,
  creatorMarketplace: CreatorMarketplace,
  marketplace: Marketplace,
  productPage: ProductPage,
};

interface ECommerceAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const ECommerceApp: React.FC<ECommerceAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }

    // Inject Search Item
    const augmentedMenuItem = { ...context.menuItem };
    let children = augmentedMenuItem.children ? [...augmentedMenuItem.children] : [];
    
    if (!children.some(c => c.component === 'commerceSearch')) {
        children.unshift({ title: 'Unified Search', icon: SearchIcon, component: 'commerceSearch' });
    }
    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={eCommerceComponentMap} onSetView={onSetView} />;
};
