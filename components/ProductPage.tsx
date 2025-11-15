import React from 'react';
import { CameraIcon, StarIcon, HeartIcon, ShareIcon } from './Icons';
import { ICON_BUTTON_CLASSES } from '../constants';

const ProductInfoCard: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
        {children}
    </div>
)

export const ProductPage: React.FC = () => {
  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Image and Related */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-center h-96">
          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
            <CameraIcon className="w-16 h-16 text-gray-300 dark:text-gray-400" />
          </div>
        </div>
        
        <ProductInfoCard title="Related Items">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-100 dark:bg-gray-700/50 h-32 rounded-md"></div>
                ))}
            </div>
        </ProductInfoCard>

         <ProductInfoCard title="Reviews">
            <div className="space-y-4">
                <div className="flex space-x-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                    <div>
                        <p className="font-semibold">User One</p>
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => <StarIcon key={i} solid className="w-4 h-4 text-yellow-400" />)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">This is a great product, highly recommended!</p>
                    </div>
                </div>
            </div>
        </ProductInfoCard>
      </div>

      {/* Right Column - Product Details */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Product Item Name</h1>
            <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mt-1">$99.99</p>
            
            <div className="flex items-center my-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => <StarIcon key={i} solid className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />)}
              </div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">4.0 (121 Ratings)</span>
            </div>

            <div className="flex items-center space-x-2">
                <button className={ICON_BUTTON_CLASSES} title="Add to wishlist"><HeartIcon className="w-6 h-6" /></button>
                <button className={ICON_BUTTON_CLASSES} title="Share product"><ShareIcon className="w-6 h-6" /></button>
            </div>
            
            <div className="mt-4 space-y-2">
                <button className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 transition-colors">Add to Cart</button>
                <button className="w-full bg-gray-800 text-white font-semibold py-2 rounded-md hover:bg-gray-900 transition-colors">Buy Now</button>
            </div>
        </div>

        <ProductInfoCard title="About Product">
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li><span className="font-semibold text-gray-800 dark:text-gray-200">Description:</span> A brief description goes here.</li>
                <li><span className="font-semibold text-gray-800 dark:text-gray-200">Designer:</span> John Doe</li>
                <li><span className="font-semibold text-gray-800 dark:text-gray-200">Manufacturer:</span> ACME Inc.</li>
                <li><span className="font-semibold text-gray-800 dark:text-gray-200">Model:</span> X-1000</li>
                <li><span className="font-semibold text-gray-800 dark:text-gray-200">Properties:</span> Durable, Lightweight</li>
            </ul>
        </ProductInfoCard>
        
         <ProductInfoCard title="Social Links">
            <div className="flex flex-wrap gap-2">
                {['Facebook', 'Instagram', 'Discord', 'Pinterest', 'Skype'].map(site => (
                    <a key={site} href="#" className="text-sm text-indigo-600 hover:underline">{site}</a>
                ))}
            </div>
        </ProductInfoCard>
        
        <ProductInfoCard title="Learning Materials">
            <a href="#" className="text-sm text-indigo-600 hover:underline">Google Drive Link</a>
        </ProductInfoCard>
      </div>
    </div>
  );
};