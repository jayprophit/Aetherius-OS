
import React from 'react';
import { GlobeAltIcon, UsersIcon, ShoppingCartIcon } from './Icons';

interface Platform {
  name: string;
  logo: React.FC<any>;
  features: string;
  regions: string;
  metrics: string;
}

interface Category {
  name: string;
  platforms: Platform[];
}

const eCommerceData: Category[] = [
  {
    name: 'Global General Marketplaces',
    platforms: [
      { name: 'Amazon', logo: ShoppingCartIcon, features: 'Largest GMV, FBA fulfillment, Prime membership', regions: 'Worldwide', metrics: '390M monthly users' },
      { name: 'eBay', logo: ShoppingCartIcon, features: 'Auction and fixed-price, global shipping program', regions: 'Worldwide', metrics: '134M active buyers' },
      { name: 'Alibaba', logo: ShoppingCartIcon, features: 'B2B focus, trade assurance, supplier ratings', regions: 'Worldwide (China-centric)', metrics: '900M+ active users' },
      { name: 'AliExpress', logo: ShoppingCartIcon, features: 'B2C, low prices, dropshipping-friendly', regions: 'Worldwide', metrics: '525M monthly visitors' },
      { name: 'Rakuten', logo: ShoppingCartIcon, features: 'Cashback rewards, diverse categories', regions: 'Japan, Global', metrics: '563M monthly visitors' },
    ],
  },
  {
    name: 'Niche-Specific Marketplaces',
    platforms: [
      { name: 'Etsy', logo: ShoppingCartIcon, features: 'Handmade, vintage, craft supplies', regions: 'Global', metrics: '547M monthly visits' },
      { name: 'Wayfair', logo: ShoppingCartIcon, features: 'Home goods & furniture', regions: 'North America, Europe', metrics: 'Wholesale model' },
      { name: 'StockX', logo: ShoppingCartIcon, features: 'Sneakers, streetwear, collectibles, with authentication', regions: 'Global', metrics: 'Limited-edition items' },
    ],
  },
  {
    name: 'Regional Marketplaces',
    platforms: [
      { name: 'Mercado Libre', logo: GlobeAltIcon, features: 'Largest in region, operates in 18 countries', regions: 'Latin America', metrics: 'Dominant regional player' },
      { name: 'Flipkart', logo: GlobeAltIcon, features: 'Acquired by Walmart; strong in electronics/fashion', regions: 'India', metrics: 'Leading Indian platform' },
      { name: 'Shopee', logo: GlobeAltIcon, features: 'Mobile-first, expanding from SEA to Latin America', regions: 'Southeast Asia', metrics: '559M monthly visitors' },
    ],
  },
  {
    name: 'P2P & Secondhand Marketplaces',
    platforms: [
      { name: 'Facebook Marketplace', logo: UsersIcon, features: 'Local buying/selling, free listings, integrated with social network', regions: 'Global', metrics: '31.8M visits (2023)' },
      { name: 'Poshmark', logo: UsersIcon, features: 'Fashion resale, social commerce', regions: 'US, Canada', metrics: 'Strong fashion community' },
      { name: 'Vinted', logo: UsersIcon, features: 'Secondhand fashion, eco-conscious focus', regions: 'Europe, US', metrics: 'Popular in Europe' },
    ],
  },
];

const PlatformCard: React.FC<{ platform: Platform }> = ({ platform }) => {
    const LogoIcon = platform.logo;
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <LogoIcon className="w-7 h-7 text-gray-600 dark:text-gray-300"/>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{platform.name}</h3>
                    <p className="text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 px-2 py-0.5 rounded-full inline-block mt-1">{platform.regions}</p>
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow">{platform.features}</p>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-3">{platform.metrics}</p>
        </div>
    );
};

export const ECommercePlatforms: React.FC = () => {
  return (
    <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">E-Commerce Platforms</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">A curated list of major e-commerce platforms, from global marketplaces to niche-specific sites.</p>
      </header>

      <div className="space-y-8">
        {eCommerceData.map(category => (
          <section key={category.name}>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 pb-2 border-b-2 border-primary">{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {category.platforms.map(platform => <PlatformCard key={platform.name} platform={platform} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
