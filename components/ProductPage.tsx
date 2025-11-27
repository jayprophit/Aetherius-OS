
import React, { useState } from 'react';
import { CameraIcon, StarIcon, HeartIcon, ShareIcon, ShoppingCartIcon, ArrowDownTrayIcon, CubeTransparentIcon, TruckIcon, CpuChipIcon, UserCircleIcon, CheckCircleIcon, HandThumbUpIcon, SearchIcon, MapPinIcon } from './Icons';
import { commerceData } from '../data';

const ProductInfoCard: React.FC<{title: string, children: React.ReactNode, icon?: React.FC<any>}> = ({title, children, icon: Icon}) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-gray-500"/>} {title}
        </h3>
        {children}
    </div>
)

const ReviewList: React.FC = () => (
    <div className="space-y-6">
        {[1, 2, 3].map(i => (
            <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                    <UserCircleIcon className="w-8 h-8 text-gray-400"/>
                    <span className="font-bold text-sm">Verified Buyer {i}</span>
                </div>
                <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, x) => <StarIcon key={x} solid={x < 4} className="w-4 h-4"/>)}
                    </div>
                    <span className="text-xs text-gray-500 ml-2 font-bold">Verified Purchase</span>
                </div>
                <h4 className="font-bold text-sm mb-1">Great product, fast shipping!</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    I was skeptical at first, but this item exceeded my expectations. The build quality is solid and it integrates perfectly with my existing Aetherius OS setup.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                        <HandThumbUpIcon className="w-4 h-4"/> Helpful (12)
                    </button>
                    <span>Report</span>
                </div>
            </div>
        ))}
    </div>
);

const QuestionsList: React.FC = () => (
    <div className="space-y-4">
        <div className="flex gap-2">
            <input type="text" placeholder="Have a question? Search for answers" className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700" />
            <button className="p-2 bg-gray-200 dark:bg-gray-600 rounded-md"><SearchIcon className="w-5 h-5 text-gray-600 dark:text-gray-300"/></button>
        </div>
        {[1, 2].map(i => (
            <div key={i} className="space-y-2">
                <div className="flex gap-2">
                    <span className="font-bold text-sm">Q:</span>
                    <a href="#" className="text-sm text-blue-600 hover:underline font-semibold">Does this work with the Quantum Core v1?</a>
                </div>
                <div className="flex gap-2">
                    <span className="font-bold text-sm">A:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Yes, it is fully backward compatible. You just need to update your firmware to version 24H2.</span>
                </div>
                <div className="ml-6 text-xs text-gray-500">By Manufacturer on Jan 15, 2025</div>
            </div>
        ))}
    </div>
);

export const ProductPage: React.FC<{ context?: { productId?: string } }> = ({ context }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'qa'>('details');
  const allItems = [...commerceData.physical, ...commerceData.digitalGoods, ...commerceData.apps];
  const defaultProduct = allItems[0];
  
  // Find product from combined list
  const product = context?.productId 
    ? allItems.find(p => p.id === context.productId) || defaultProduct
    : defaultProduct;

  const isPhysical = product.deliveryMethod === 'shipping';
  const isDigital = product.deliveryMethod === 'digital-download';
  const isApp = product.deliveryMethod === 'app-install';
  const isCAD = product.digitalType === 'cad';

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
      {/* Left Column - Image and Media */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-center h-96 overflow-hidden relative group">
          {isCAD ? (
              <div className="flex flex-col items-center justify-center text-gray-400">
                  <CubeTransparentIcon className="w-24 h-24 mb-4 opacity-50 animate-spin-slow" style={{animationDuration: '20s'}}/>
                  <p>Interactive 3D Viewer (Preview)</p>
                  <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded text-xs font-mono text-white">Format: {product.fileFormat}</div>
              </div>
          ) : product.iconUrl ? (
              <img src={product.iconUrl} alt={product.name} className="h-full object-contain group-hover:scale-105 transition-transform duration-500" />
          ) : (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                <CameraIcon className="w-16 h-16 text-gray-300 dark:text-gray-400" />
              </div>
          )}
        </div>
        
        {/* Tabbed Content */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setActiveTab('details')} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    Details
                </button>
                <button 
                    onClick={() => setActiveTab('reviews')} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    Reviews (121)
                </button>
                <button 
                    onClick={() => setActiveTab('qa')} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'qa' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    Q&A (4)
                </button>
            </div>
            
            <div className="p-6">
                {activeTab === 'details' && (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{product.description}</p>
                        {product.systemRequirements && (
                            <div className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                <CpuChipIcon className="w-5 h-5 text-gray-500"/>
                                <code className="text-xs text-gray-600 dark:text-gray-300 font-mono">{product.systemRequirements}</code>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                            <div><span className="font-bold">SKU:</span> GEN-{product.id.toUpperCase()}</div>
                            <div><span className="font-bold">Category:</span> {product.type}</div>
                            <div><span className="font-bold">Seller:</span> {product.creator.name}</div>
                        </div>
                    </div>
                )}
                {activeTab === 'reviews' && <ReviewList />}
                {activeTab === 'qa' && <QuestionsList />}
            </div>
        </div>
        
        {/* Frequently Bought Together */}
        <ProductInfoCard title="Frequently Bought Together">
             <div className="flex items-center gap-4 overflow-x-auto py-2">
                 <div className="w-24 h-24 bg-gray-100 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center">
                     <img src={product.iconUrl} className="w-16 h-16 object-contain" />
                 </div>
                 <span className="text-gray-400 text-xl">+</span>
                 <div className="w-24 h-24 bg-gray-100 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-500 font-bold">Accessory</div>
                 </div>
                 <div className="flex-1 ml-4">
                     <div className="text-sm font-bold text-gray-800 dark:text-white">Total price: ${((typeof product.price === 'number' ? product.price : 0) + 25).toFixed(2)}</div>
                     <button className="mt-2 px-4 py-1 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold rounded shadow-sm">Add both to Cart</button>
                 </div>
             </div>
        </ProductInfoCard>

      </div>

      {/* Right Column - Product Details & Buy */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-md sticky top-4">
            <div className="flex justify-between items-start">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
                <button className="text-gray-400 hover:text-red-500 transition-colors"><HeartIcon className="w-6 h-6"/></button>
            </div>
            <p className="text-sm text-blue-600 cursor-pointer hover:underline mt-1">Visit the {product.creator.name} Store</p>
            
            <div className="flex items-center my-3">
              <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => <StarIcon key={i} solid className="w-4 h-4" />)}
              </div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 cursor-pointer">121 ratings</span>
            </div>

            <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 my-4">
                <div className="flex items-start gap-1">
                    <span className="text-xs mt-1">$</span>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {product.price === 'Free' ? '0.00' : Math.floor(product.price)}
                    </p>
                    <span className="text-xs mt-1">{product.price !== 'Free' && ((product.price % 1) * 100).toFixed(0)}</span>
                </div>
                
                {isPhysical && (
                    <div className="mt-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                            <span className="text-gray-400 line-through">$1,499.00</span>
                            <span className="text-xs">List Price</span>
                        </div>
                        <div className="mt-2 flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <TruckIcon className="w-5 h-5 text-gray-400 mt-0.5"/>
                            <div>
                                <span className="block text-blue-600">FREE delivery</span>
                                <span className="font-bold">Thursday, Oct 24</span>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-green-600 text-sm font-semibold">
                            <MapPinIcon className="w-4 h-4"/>
                            Deliver to San Francisco 94103
                        </div>
                        <div className="mt-4 text-lg text-green-600 font-bold">In Stock</div>
                    </div>
                )}
                {isDigital && (
                     <div className="mt-2 flex items-center gap-2 text-sm text-green-500 font-semibold">
                        <ArrowDownTrayIcon className="w-4 h-4"/>
                        <span>Available Immediately</span>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span>Quantity:</span>
                    <select className="border border-gray-300 rounded p-1 bg-gray-100 dark:bg-gray-700">
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <button className="w-full bg-yellow-400 text-black font-bold py-3 rounded-full hover:bg-yellow-500 transition-colors shadow-sm">
                    Add to Cart
                </button>
                <button className="w-full bg-orange-500 text-white font-bold py-3 rounded-full hover:bg-orange-600 transition-colors shadow-sm">
                    Buy Now
                </button>
                
                <div className="text-xs text-gray-500 mt-4 space-y-1">
                    <div className="flex justify-between"><span>Ships from</span> <span>Aetherius</span></div>
                    <div className="flex justify-between"><span>Sold by</span> <span className="text-blue-600">{product.creator.name}</span></div>
                    <div className="flex justify-between"><span>Returns</span> <span className="text-blue-600">30-day return policy</span></div>
                </div>
            </div>
            
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button className="w-full border border-gray-300 dark:border-gray-600 py-1 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Add to List</button>
            </div>
        </div>

        {/* Protection Plan */}
        {isPhysical && (
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                 <h4 className="font-bold text-sm mb-2">Add Protection Plan</h4>
                 <div className="space-y-2">
                     <label className="flex items-start gap-2 cursor-pointer">
                         <input type="checkbox" className="mt-1" />
                         <span className="text-sm text-gray-600 dark:text-gray-300">3-Year Protection for <span className="text-red-600">$129.99</span></span>
                     </label>
                     <label className="flex items-start gap-2 cursor-pointer">
                         <input type="checkbox" className="mt-1" />
                         <span className="text-sm text-gray-600 dark:text-gray-300">2-Year Protection for <span className="text-red-600">$89.99</span></span>
                     </label>
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};
