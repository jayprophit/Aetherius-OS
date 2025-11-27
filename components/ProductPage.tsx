


import React from 'react';
import { CameraIcon, StarIcon, HeartIcon, ShareIcon, ShoppingCartIcon, ArrowDownTrayIcon, CubeTransparentIcon, TruckIcon, CpuChipIcon } from './Icons';
import { commerceData } from '../data';

const ProductInfoCard: React.FC<{title: string, children: React.ReactNode, icon?: React.FC<any>}> = ({title, children, icon: Icon}) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-gray-500"/>} {title}
        </h3>
        {children}
    </div>
)

export const ProductPage: React.FC<{ context?: { productId?: string } }> = ({ context }) => {
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-center h-96 overflow-hidden relative">
          {isCAD ? (
              <div className="flex flex-col items-center justify-center text-gray-400">
                  <CubeTransparentIcon className="w-24 h-24 mb-4 opacity-50 animate-spin-slow" style={{animationDuration: '20s'}}/>
                  <p>Interactive 3D Viewer (Preview)</p>
                  <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded text-xs font-mono text-white">Format: {product.fileFormat}</div>
              </div>
          ) : product.iconUrl ? (
              <img src={product.iconUrl} alt={product.name} className="h-full object-contain" />
          ) : (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                <CameraIcon className="w-16 h-16 text-gray-300 dark:text-gray-400" />
              </div>
          )}
        </div>
        
        <ProductInfoCard title="Description">
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{product.description}</p>
        </ProductInfoCard>
        
        {product.systemRequirements && (
             <ProductInfoCard title="System Requirements" icon={CpuChipIcon}>
                <div className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                    <code className="text-xs text-gray-600 dark:text-gray-300 font-mono">{product.systemRequirements}</code>
                </div>
            </ProductInfoCard>
        )}

         <ProductInfoCard title="Reviews">
            <div className="space-y-4">
                <div className="flex space-x-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                    <div>
                        <p className="font-semibold">Verified Buyer</p>
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => <StarIcon key={i} solid className="w-4 h-4 text-yellow-400" />)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">This is a great product, highly recommended!</p>
                    </div>
                </div>
            </div>
        </ProductInfoCard>
      </div>

      {/* Right Column - Product Details & Buy */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="flex gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${isPhysical ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {product.type}
                </span>
                {isDigital && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-green-100 text-green-700">Instant Download</span>}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{product.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sold by <span className="font-semibold text-blue-500">{product.creator.name}</span></p>
            
            <div className="flex items-center my-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => <StarIcon key={i} solid className={`w-5 h-5 ${i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />)}
              </div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{product.rating} (121 Ratings)</span>
            </div>

            <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 my-4">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {product.price === 'Free' ? 'Free' : `$${product.price}`}
                </p>
                {isPhysical && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <TruckIcon className="w-4 h-4"/>
                        <span>Arrives by Thu, Oct 24</span>
                    </div>
                )}
                {isDigital && (
                     <div className="mt-2 flex items-center gap-2 text-xs text-green-500 font-semibold">
                        <ArrowDownTrayIcon className="w-4 h-4"/>
                        <span>Available Immediately</span>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg">
                    {isPhysical ? <ShoppingCartIcon className="w-5 h-5"/> : <ArrowDownTrayIcon className="w-5 h-5"/>}
                    {isPhysical ? 'Add to Cart' : isApp ? 'Install Now' : 'Download Now'}
                </button>
                <div className="flex gap-2">
                    <button className="flex-1 border border-gray-300 dark:border-gray-600 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-sm flex items-center justify-center gap-1">
                        <HeartIcon className="w-4 h-4"/> Wishlist
                    </button>
                    <button className="flex-1 border border-gray-300 dark:border-gray-600 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-sm flex items-center justify-center gap-1">
                        <ShareIcon className="w-4 h-4"/> Share
                    </button>
                </div>
            </div>
        </div>

        <ProductInfoCard title="Details">
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex justify-between">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Category:</span> 
                    <span>{product.type}</span>
                </li>
                <li className="flex justify-between">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Seller:</span> 
                    <span>{product.creator.name}</span>
                </li>
                {isPhysical ? (
                    <>
                        <li className="flex justify-between">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">Stock:</span> 
                            <span>{product.stock || 'In Stock'}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">Shipping:</span> 
                            <span>Global Priority</span>
                        </li>
                    </>
                ) : (
                     <>
                        <li className="flex justify-between">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">Format:</span> 
                            <span>{product.fileFormat || 'Digital Pkg'}</span>
                        </li>
                        {product.version && (
                            <li className="flex justify-between">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">Version:</span> 
                                <span>{product.version}</span>
                            </li>
                        )}
                    </>
                )}
            </ul>
        </ProductInfoCard>
      </div>
    </div>
  );
};
