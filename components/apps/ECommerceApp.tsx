
import React, { useState, useMemo } from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { ProductPage } from '../ProductPage';
import { commerceData } from '../../data';
import { 
    SearchIcon, ShoppingCartIcon, CubeTransparentIcon, ArrowDownTrayIcon, StarIcon, 
    CloudIcon, TruckIcon, GlobeAltIcon, ArchiveBoxIcon, Bars3Icon, UserIcon, 
    MapPinIcon, BellIcon, ChevronDownIcon, HomeIcon, CreditCardIcon, TagIcon,
    HeartIcon, ArrowPathIcon, CheckCircleIcon, FireIcon, ArrowUpCircleIcon
} from '../Icons';

// --- AetherStore Components ---

const ShopHeader: React.FC<{ 
    cartCount: number; 
    onSearch: (term: string) => void; 
    onOpenCart: () => void;
}> = ({ cartCount, onSearch, onOpenCart }) => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="bg-[#1a202c] text-white p-2 flex items-center gap-4 sticky top-0 z-20 shadow-md">
            {/* Logo */}
            <div className="flex items-center gap-1 px-2 hover:bg-white/10 rounded cursor-pointer">
                <ShoppingCartIcon className="w-8 h-8 text-blue-400" />
                <div className="flex flex-col leading-tight">
                    <span className="font-bold text-lg tracking-tight">AetherPrime</span>
                    <span className="text-[10px] text-gray-300 -mt-1">Global Commerce</span>
                </div>
            </div>

            {/* Location */}
            <div className="hidden md:flex flex-col leading-tight text-xs px-2 hover:bg-white/10 rounded cursor-pointer">
                <span className="text-gray-300 ml-4">Deliver to User</span>
                <div className="flex items-center font-bold">
                    <MapPinIcon className="w-4 h-4" />
                    <span>San Francisco 94103</span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 flex h-10 rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
                <select className="bg-gray-100 text-gray-700 text-xs w-14 border-r border-gray-300 px-1 outline-none">
                    <option>All</option>
                    <option>Electronics</option>
                    <option>Home</option>
                    <option>Fashion</option>
                </select>
                <input 
                    type="text" 
                    className="flex-1 px-3 text-black outline-none"
                    placeholder="Search AetherPrime..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch(searchTerm)}
                />
                <button 
                    className="bg-blue-500 hover:bg-blue-600 px-4 flex items-center justify-center transition-colors"
                    onClick={() => onSearch(searchTerm)}
                >
                    <SearchIcon className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* Right Nav */}
            <div className="flex items-center gap-4 text-xs">
                <div className="hidden md:block cursor-pointer hover:bg-white/10 p-2 rounded">
                    <p>Hello, User</p>
                    <p className="font-bold text-sm">Account & Lists</p>
                </div>
                <div className="hidden md:block cursor-pointer hover:bg-white/10 p-2 rounded">
                    <p>Returns</p>
                    <p className="font-bold text-sm">& Orders</p>
                </div>
                <div 
                    className="flex items-end cursor-pointer hover:bg-white/10 p-2 rounded relative"
                    onClick={onOpenCart}
                >
                    <ShoppingCartIcon className="w-8 h-8" />
                    <span className="font-bold text-blue-400 text-base absolute top-0 right-2">{cartCount}</span>
                    <span className="font-bold text-sm mb-1 hidden md:inline">Cart</span>
                </div>
            </div>
        </div>
    );
};

const ShopSubHeader: React.FC = () => (
    <div className="bg-[#2d3748] text-white text-sm px-4 py-1.5 flex items-center gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex items-center gap-1 font-bold cursor-pointer hover:text-blue-400">
            <Bars3Icon className="w-5 h-5" /> All
        </div>
        {['Daily Deals', 'Customer Care', 'Registry', 'Gift Cards', 'Sell', 'Electronics', 'Home', 'Fashion', 'Books', 'Computers'].map(link => (
            <span key={link} className="cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded">{link}</span>
        ))}
    </div>
);

const ProductCard: React.FC<{ item: any, onOpen: (id: string) => void }> = ({ item, onOpen }) => (
    <div 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 flex flex-col h-full cursor-pointer hover:shadow-lg transition-shadow rounded-md"
        onClick={() => onOpen(item.id)}
    >
        <div className="h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-900 mb-4 relative overflow-hidden group rounded-md">
            <img src={item.iconUrl} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-300" />
            {item.type === 'Digital Asset' && (
                <span className="absolute top-2 right-2 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-1 rounded">DIGITAL</span>
            )}
        </div>
        
        <div className="flex-1 flex flex-col">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 text-sm mb-1">
                {item.name}
            </h3>
            
            <div className="flex items-center mb-1">
                <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} solid={i < Math.floor(item.rating)} className="w-4 h-4" />
                    ))}
                </div>
                <span className="text-xs text-blue-600 ml-1 hover:underline cursor-pointer">{Math.floor(Math.random() * 500) + 50}</span>
            </div>

            <div className="mt-auto">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-xs align-top">$</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.floor(item.price)}</span>
                    <span className="text-xs align-top">{((item.price % 1) * 100).toFixed(0)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Get it by <span className="font-bold text-gray-700 dark:text-gray-300">Tomorrow</span>
                </p>
                {item.deliveryMethod === 'shipping' && (
                    <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                        <CheckCircleIcon className="w-3 h-3 text-orange-400" />
                        <span>FREE Delivery on AetherPrime</span>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const DealsCarousel: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 p-4 mb-6 border-t border-gray-200 dark:border-gray-700 rounded-md shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FireIcon className="w-5 h-5 text-red-500" /> Today's Lightning Deals
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {[1,2,3,4,5].map(i => (
                <div key={i} className="min-w-[160px] cursor-pointer">
                    <div className="bg-gray-100 dark:bg-gray-900 h-32 flex items-center justify-center mb-2 rounded">
                        <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&w=200`} className="h-full object-contain" />
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">20% off</span>
                        <span className="text-red-600 font-bold text-xs">Limited time</span>
                    </div>
                    <p className="text-sm truncate mt-1">Generic Deal Item {i}</p>
                </div>
            ))}
        </div>
    </div>
);

// --- Seller Portal Component ---

const SellerDashboard: React.FC = () => (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Seller Central</h1>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Add New Product</button>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-500 text-xs uppercase font-bold">Total Sales (Today)</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">$1,240.50</p>
                <span className="text-green-500 text-xs font-bold flex items-center mt-2"><ArrowUpCircleIcon className="w-3 h-3 mr-1"/> +12% vs yesterday</span>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-500 text-xs uppercase font-bold">Orders to Ship</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">14</p>
                <span className="text-orange-500 text-xs font-bold mt-2 block">Action Required</span>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow border border-gray-200 dark:border-gray-700">
                <h3 className="text-gray-500 text-xs uppercase font-bold">Buyer Messages</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">3</p>
                <span className="text-blue-500 text-xs font-bold mt-2 block">Response time &lt; 2h</span>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold">Recent Inventory</div>
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                    <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Stock</th>
                        <th className="p-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {[1,2,3,4].map(i => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="p-3 font-medium">Quantum Widget v{i}.0</td>
                            <td className="p-3 font-mono text-xs">QW-00{i}-A</td>
                            <td className="p-3 text-right">$49.99</td>
                            <td className="p-3 text-right">142</td>
                            <td className="p-3"><span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-bold">Active</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// --- Main Commerce Component ---

const ECommerceModule: React.FC<{ onSetView: (view: string, context?: any) => void }> = ({ onSetView }) => {
    const [view, setView] = useState<'shop' | 'seller'>('shop');
    const [cartCount, setCartCount] = useState(3);
    const [searchQuery, setSearchQuery] = useState('');

    const allProducts = [...commerceData.physical]; // Only physical for this app
    const filteredProducts = useMemo(() => {
        if (!searchQuery) return allProducts;
        return allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [allProducts, searchQuery]);

    if (view === 'seller') return <SellerDashboard />;

    return (
        <div className="h-full bg-gray-100 dark:bg-gray-900 overflow-y-auto flex flex-col relative">
            <ShopHeader 
                cartCount={cartCount} 
                onSearch={setSearchQuery} 
                onOpenCart={() => alert("Opening Cart Drawer...")} 
            />
            <ShopSubHeader />

            {/* Main Content */}
            <div className="max-w-[1500px] mx-auto p-4 w-full flex-1">
                
                {/* Hero Banner */}
                {!searchQuery && (
                    <div className="relative h-64 md:h-80 bg-gradient-to-r from-gray-900 to-gray-800 mb-6 -mx-4 md:mx-0 md:rounded-lg overflow-hidden shadow-md">
                        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 z-10">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">Future Tech Festival</h2>
                            <p className="text-white text-lg mb-6 drop-shadow-md">Up to 40% off Quantum Processors & Neural Interfaces.</p>
                            <button className="bg-white text-black px-6 py-2 rounded-md font-bold w-fit hover:bg-gray-100 transition-colors">Shop the Sale</button>
                        </div>
                        <img 
                            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80" 
                            className="absolute right-0 top-0 h-full w-2/3 object-cover opacity-50 mask-linear-fade" 
                            alt="Banner" 
                        />
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar Filters */}
                    <aside className="hidden md:block w-60 flex-shrink-0 space-y-6">
                         <div>
                            <h3 className="font-bold mb-2 text-sm">Department</h3>
                            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                                <li className="hover:text-blue-500 font-bold text-black dark:text-white">Electronics</li>
                                <li className="hover:text-blue-500">Computers</li>
                                <li className="hover:text-blue-500">Smart Home</li>
                                <li className="hover:text-blue-500">Arts & Crafts</li>
                                <li className="hover:text-blue-500">Software</li>
                            </ul>
                         </div>
                         
                         <div>
                            <h3 className="font-bold mb-2 text-sm">Avg. Customer Review</h3>
                            <div className="space-y-1 cursor-pointer">
                                {[4,3,2,1].map(stars => (
                                    <div key={stars} className="flex items-center gap-1 hover:text-blue-500">
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => <StarIcon key={i} solid={i < stars} className="w-4 h-4"/>)}
                                        </div>
                                        <span className="text-xs text-gray-500">& Up</span>
                                    </div>
                                ))}
                            </div>
                         </div>

                         <div>
                             <h3 className="font-bold mb-2 text-sm">Price</h3>
                             <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                                 <li className="hover:text-blue-500">Under $25</li>
                                 <li className="hover:text-blue-500">$25 to $50</li>
                                 <li className="hover:text-blue-500">$50 to $100</li>
                                 <li className="hover:text-blue-500">$100 to $200</li>
                                 <li className="hover:text-blue-500">$200 & Above</li>
                             </ul>
                         </div>
                    </aside>

                    {/* Main Grid */}
                    <div className="flex-1">
                        {!searchQuery && <DealsCarousel />}
                        
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                            {searchQuery ? `Results for "${searchQuery}"` : "Recommended For You"}
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(item => (
                                <ProductCard 
                                    key={item.id} 
                                    item={item} 
                                    onOpen={(id) => onSetView('productPage', { productId: id })} 
                                />
                            ))}
                            {/* Dummy Fillers to make it look full */}
                            {[1,2,3,4].map(i => (
                                <ProductCard 
                                    key={`dummy-${i}`} 
                                    item={{
                                        id: `dummy-${i}`,
                                        name: `Generic Marketplace Item ${i}`,
                                        price: 19.99 + (i * 5),
                                        rating: 4.5,
                                        iconUrl: `https://images.unsplash.com/photo-${1580000000000 + i}?auto=format&fit=crop&w=300`,
                                        deliveryMethod: 'shipping',
                                        type: 'Physical Product'
                                    }} 
                                    onOpen={() => {}}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <footer className="bg-[#232f3e] text-white text-center p-8 mt-8 space-y-4 text-sm">
                <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="bg-[#37475a] w-full py-3 mb-4 hover:bg-[#485769]">Back to top</button>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-left text-gray-300">
                    <div className="space-y-2">
                        <h4 className="font-bold text-white">Get to Know Us</h4>
                        <p className="hover:underline cursor-pointer">Careers</p>
                        <p className="hover:underline cursor-pointer">Blog</p>
                        <p className="hover:underline cursor-pointer">About AetherPrime</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-white">Make Money with Us</h4>
                        <p className="hover:underline cursor-pointer" onClick={() => setView('seller')}>Sell products on AetherPrime</p>
                        <p className="hover:underline cursor-pointer">Sell apps on Aetherius</p>
                        <p className="hover:underline cursor-pointer">Become an Affiliate</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-white">Payment Products</h4>
                        <p className="hover:underline cursor-pointer">Business Card</p>
                        <p className="hover:underline cursor-pointer">Shop with Points</p>
                        <p className="hover:underline cursor-pointer">Reload Your Balance</p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-bold text-white">Let Us Help You</h4>
                        <p className="hover:underline cursor-pointer">AetherPrime & COVID-19</p>
                        <p className="hover:underline cursor-pointer">Your Account</p>
                        <p className="hover:underline cursor-pointer">Your Orders</p>
                    </div>
                </div>
                <div className="border-t border-gray-600 pt-4 mt-4">
                    <p>&copy; 2024-2025, Aetherius Corporation or its affiliates</p>
                </div>
            </footer>
        </div>
    );
};

// --- Component Map ---

const eCommerceComponentMap: { [key: string]: React.FC<any> } = {
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
        { title: 'AetherPrime Home', icon: ShoppingCartIcon, component: 'ecommerceModule' },
        { title: 'Seller Central', icon: ShoppingCartIcon, component: 'ecommerceModule' },
    ];

    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={eCommerceComponentMap} onSetView={onSetView} />;
};
