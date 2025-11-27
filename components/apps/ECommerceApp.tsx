



import React, { useState, useMemo } from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { CreatorMarketplace } from '../CreatorMarketplace'; // Reuse for App Marketplace
import { ProductPage } from '../ProductPage';
import { commerceData } from '../../data';
import { SearchIcon, ShoppingCartIcon, CubeTransparentIcon, ArrowDownTrayIcon, StarIcon, CloudIcon, TruckIcon, GlobeAltIcon, ArchiveBoxIcon } from '../Icons';

// --- Unified Search Component ---
const CommerceSearch: React.FC<{ onSetView: (view: string, context?: any) => void }> = ({ onSetView }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const allItems = [...commerceData.physical, ...commerceData.digitalGoods, ...commerceData.apps];

    const results = useMemo(() => {
        if (!searchTerm) return [];
        return allItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, allItems]);

    return (
        <div className="p-6 h-full bg-gray-100 dark:bg-gray-900 overflow-y-auto">
             <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Unified Commerce Search</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Search across Physical Goods, Digital Assets, and Apps simultaneously.</p>
            </header>
            
            <div className="relative mb-8">
                 <SearchIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                 <input 
                    type="text" 
                    placeholder="Search products, apps, CAD files..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map(item => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-start gap-4 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => onSetView(item.source === 'ecommerce' ? 'productPage' : 'marketplaceModule', { productId: item.id })}>
                        <div className={`p-3 rounded-lg ${item.source === 'ecommerce' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                             {item.source === 'ecommerce' ? <ShoppingCartIcon className="w-6 h-6 text-blue-600"/> : <CloudIcon className="w-6 h-6 text-purple-600"/>}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">{item.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.creator.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-bold text-blue-600">${item.price}</span>
                                <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 uppercase">{item.type}</span>
                            </div>
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

// --- E-Commerce Module (Physical + Digital Goods) ---
const ECommerceModule: React.FC<{ onSetView: (view: string, context?: any) => void }> = ({ onSetView }) => {
    const physical = commerceData.physical;
    const digital = commerceData.digitalGoods;

    return (
        <div className="p-6 h-full bg-gray-100 dark:bg-gray-900 overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <ShoppingCartIcon className="w-8 h-8 text-blue-600" />
                    E-Commerce Shop
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Browse physical hardware and professional digital assets (CAD, Software).</p>
            </header>

            {/* Physical Goods Section */}
            <section className="mb-10">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <TruckIcon className="w-5 h-5 text-green-500"/> Physical Goods (Shipping)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {physical.map(product => (
                        <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => onSetView('productPage', { productId: product.id })}>
                            <div className="h-40 bg-gray-200 dark:bg-gray-700 relative">
                                <img src={product.iconUrl} alt={product.name} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 backdrop-blur-sm w-full">
                                    In Stock: {product.stock}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-md text-gray-900 dark:text-white truncate group-hover:text-blue-500">{product.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{product.creator.name}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">${product.price}</span>
                                    <button className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-800">
                                        <ShoppingCartIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Digital Goods Section */}
             <section>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <ArrowDownTrayIcon className="w-5 h-5 text-purple-500"/> Digital Assets (Instant Download)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {digital.map(product => (
                        <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => onSetView('productPage', { productId: product.id })}>
                            <div className="h-40 bg-gray-100 dark:bg-gray-700/50 relative flex items-center justify-center">
                                {product.digitalType === 'cad' ? <CubeTransparentIcon className="w-16 h-16 text-gray-400"/> : <ArchiveBoxIcon className="w-16 h-16 text-gray-400"/>}
                                <div className="absolute top-2 right-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                    {product.digitalType}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-md text-gray-900 dark:text-white truncate group-hover:text-purple-500">{product.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{product.creator.name}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">${product.price}</span>
                                    <button className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 hover:bg-purple-200 dark:hover:bg-purple-800">
                                        <ArrowDownTrayIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

const eCommerceComponentMap: { [key: string]: React.FC<any> } = {
  commerceSearch: CommerceSearch,
  marketplaceModule: CreatorMarketplace, // Reuse existing Creator Marketplace for Apps
  ecommerceModule: ECommerceModule,
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

    // Build Unified Menu Structure
    const augmentedMenuItem = { ...context.menuItem };
    
    const children: MenuItemData[] = [
        { title: 'Unified Search', icon: SearchIcon, component: 'commerceSearch' },
        { type: 'divider' },
        { title: 'Shop (E-Commerce)', icon: ShoppingCartIcon, component: 'ecommerceModule' },
        { title: 'App Marketplace', icon: CloudIcon, component: 'marketplaceModule' },
    ];

    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={eCommerceComponentMap} onSetView={onSetView} />;
};
