
import React, { useState } from 'react';
import { AiTradingPlatform } from '../../types';
import { aiTradingPlatforms } from '../../data';
import { SearchIcon, CheckCircleIcon, XMarkIcon, ArrowRightIcon, ChevronDownIcon, SparklesIcon, ChartBarIcon, CurrencyDollarIcon } from '../Icons';

const PlatformCard: React.FC<{ platform: AiTradingPlatform }> = ({ platform }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${expanded ? 'shadow-xl ring-1 ring-blue-500 dark:ring-blue-400' : 'shadow-sm hover:shadow-md'}`}>
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <img src={platform.logoUrl} alt={platform.name} className="w-12 h-12 rounded-lg shadow-sm" />
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{platform.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    platform.category === 'Crypto' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                    platform.category === 'Stock' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                }`}>
                                    {platform.category}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{platform.pricing}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setExpanded(!expanded)} 
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>
                
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {platform.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                    {platform.bestFor.map((tag, i) => (
                        <span key={i} className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {expanded && (
                <div className="px-5 pb-5 pt-0 space-y-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-black/20">
                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-200 mb-2">Key Features</h4>
                            <ul className="space-y-1">
                                {platform.features.map((feat, i) => (
                                    <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                        <SparklesIcon className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-sm text-green-600 dark:text-green-400 mb-2 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Pros</h4>
                                <ul className="space-y-1">
                                    {platform.pros.map((pro, i) => (
                                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 ml-4 list-disc">{pro}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-red-600 dark:text-red-400 mb-2 flex items-center gap-1"><XMarkIcon className="w-3 h-3"/> Cons</h4>
                                <ul className="space-y-1">
                                    {platform.cons.map((con, i) => (
                                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 ml-4 list-disc">{con}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-md transition-colors">
                            Visit Platform <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const AiTradingTools: React.FC = () => {
    const [filter, setFilter] = useState<'All' | 'Crypto' | 'Stock' | 'Multi-Asset'>('All');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPlatforms = aiTradingPlatforms.filter(p => {
        const matchesFilter = filter === 'All' || p.category === filter;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <ChartBarIcon className="w-8 h-8 text-blue-600" />
                    AI Trading Platform Explorer
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-3xl">
                    Discover the best AI-powered trading tools for stocks, crypto, and forex. 
                    Compare features, pricing, and performance to find the perfect fit for your strategy.
                </p>
                
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-md text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Disclaimer:</strong> Automated trading carries risk. Past performance of AI bots does not guarantee future results. 
                    Always use demo accounts or paper trading to test strategies before committing real capital.
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-0 bg-gray-100 dark:bg-gray-900 z-10 py-2">
                <div className="relative flex-1">
                    <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Search platforms (e.g., 'Grid Bot', 'Backtesting')..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['All', 'Stock', 'Crypto', 'Multi-Asset'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                                filter === cat 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredPlatforms.map(platform => (
                    <PlatformCard key={platform.id} platform={platform} />
                ))}
            </div>

            {filteredPlatforms.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No platforms found matching your criteria.</p>
                    <button onClick={() => {setFilter('All'); setSearchTerm('');}} className="mt-4 text-blue-500 font-bold hover:underline">Clear Filters</button>
                </div>
            )}
        </div>
    );
};
