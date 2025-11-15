import React, { useState, useMemo } from 'react';
import { TradingAsset, AssetClass, AssetMetric, AssetNews } from '../../types';
import { tradingAssets } from '../../data';
import { SearchIcon, ChevronDownIcon, TrendingUpIcon, ChartBarIcon } from '../Icons';

const AssetRow: React.FC<{ asset: TradingAsset; onRowClick: () => void; isExpanded: boolean }> = ({ asset, onRowClick, isExpanded }) => {
    const isPositive = asset.changePercent >= 0;
    return (
        <tr onClick={onRowClick} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <img src={asset.logoUrl} alt={asset.name} className="w-8 h-8" />
                    <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100">{asset.symbol}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{asset.name}</p>
                    </div>
                </div>
            </td>
            <td className="p-4 text-right font-mono">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td className={`p-4 text-right font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{asset.change.toFixed(2)}
            </td>
            <td className={`p-4 text-right font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
            </td>
            <td className="p-4 text-right font-mono hidden md:table-cell">
                {asset.marketCap ? `$${(asset.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
            </td>
            <td className="p-4 text-right font-mono hidden lg:table-cell">
                {asset.volume24h ? `$${(asset.volume24h / 1e6).toFixed(2)}M` : 'N/A'}
            </td>
            <td className="p-4 text-right">
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </td>
        </tr>
    );
};

const AssetDetailView: React.FC<{ asset: TradingAsset }> = ({ asset }) => {
    // Mock data for the detail view
    const metrics: AssetMetric[] = [
        { label: 'Market Cap', value: asset.marketCap ? `$${(asset.marketCap / 1e9).toFixed(2)}B` : 'N/A' },
        { label: 'Volume (24h)', value: asset.volume24h ? `$${(asset.volume24h / 1e6).toFixed(2)}M` : 'N/A' },
        { label: 'Circulating Supply', value: '19.7M BTC' },
        { label: 'All-Time High', value: '$73,750.07' },
    ];
    const news: AssetNews[] = [
        { id: 'n1', source: 'CoinDesk', title: 'Bitcoin ETF Inflows Surge as Market Sentiment Improves', time: '2h ago' },
        { id: 'n2', source: 'Bloomberg', title: 'Analysts Predict Volatility Ahead of Options Expiry', time: '5h ago' },
    ];

    return (
        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <h4 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Performance (7d)</h4>
                    <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-md flex items-center justify-center">
                       <ChartBarIcon className="w-12 h-12 text-gray-400 dark:text-gray-600"/>
                       <p className="ml-2 text-gray-400 dark:text-gray-600">Chart Placeholder</p>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Key Metrics</h4>
                    <div className="space-y-2">
                        {metrics.map(metric => (
                            <div key={metric.label} className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">{metric.label}</span>
                                <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{metric.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-3">
                    <h4 className="font-bold mb-2 text-gray-800 dark:text-gray-200">Related News</h4>
                     <div className="space-y-3">
                        {news.map(item => (
                            <a href="#" key={item.id} className="block p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800">
                                <p className="text-sm font-semibold">{item.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.source} &bull; {item.time}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Markets: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeClass, setActiveClass] = useState<AssetClass>('Crypto');
    const [expandedAssetSymbol, setExpandedAssetSymbol] = useState<string | null>(null);

    const assetClasses: AssetClass[] = ['Crypto', 'Stocks', 'Forex', 'Commodities'];

    const filteredAssets = useMemo(() => {
        return tradingAssets
            .filter(asset => asset.assetClass === activeClass)
            .filter(asset =>
                asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [searchTerm, activeClass]);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Markets</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Explore real-time data across all asset classes.</p>
            </header>

            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 rounded-md p-1">
                    {assetClasses.map(assetClass => (
                        <button
                            key={assetClass}
                            onClick={() => setActiveClass(assetClass)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeClass === assetClass ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            {assetClass}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full h-10 pl-10 pr-4 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="p-4 text-left">Asset</th>
                                <th className="p-4 text-right">Price</th>
                                <th className="p-4 text-right">Change</th>
                                <th className="p-4 text-right">24h %</th>
                                <th className="p-4 text-right hidden md:table-cell">Market Cap</th>
                                <th className="p-4 text-right hidden lg:table-cell">Volume (24h)</th>
                                <th className="p-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredAssets.map((asset) => (
                                <React.Fragment key={asset.symbol}>
                                    <AssetRow 
                                        asset={asset} 
                                        onRowClick={() => setExpandedAssetSymbol(prev => prev === asset.symbol ? null : asset.symbol)}
                                        isExpanded={expandedAssetSymbol === asset.symbol}
                                    />
                                    {expandedAssetSymbol === asset.symbol && (
                                        <tr>
                                            <td colSpan={7} className="p-0">
                                                <AssetDetailView asset={asset} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
