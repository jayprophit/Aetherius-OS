import React, { useState } from 'react';
import { TrendingUpIcon, ChevronDownIcon } from './Icons';

const mockStocks = [
    { symbol: 'AOS', price: 1250.75, change: 25.50, changePercent: 2.08, color: 'green' },
    { symbol: 'META', price: 330.15, change: -5.42, changePercent: -1.61, color: 'red' },
    { symbol: 'GOOGL', price: 2850.40, change: 12.80, changePercent: 0.45, color: 'green' },
    { symbol: 'AMZN', price: 3400.90, change: -20.10, changePercent: -0.59, color: 'red' },
    { symbol: 'TSLA', price: 780.25, change: 30.75, changePercent: 4.10, color: 'green' },
    { symbol: 'NFLX', price: 510.60, change: 2.30, changePercent: 0.45, color: 'green' },
];

const TradingChart: React.FC = () => (
    <div className="h-full bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold">AOS/USD</h3>
                <p className="text-2xl font-mono font-bold text-green-500">1250.75</p>
                <p className="text-sm font-semibold text-green-500">+25.50 (2.08%) Today</p>
            </div>
            <div className="flex gap-1 text-xs">
                {['1H', '1D', '1W', '1M', '1Y'].map(t => (
                    <button key={t} className={`px-2 py-1 rounded ${t === '1D' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{t}</button>
                ))}
            </div>
        </div>
        <svg width="100%" height="70%" viewBox="0 0 400 150" className="mt-4">
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <path d="M 0 120 L 50 100 L 100 110 L 150 80 L 200 90 L 250 60 L 300 75 L 350 50 L 400 60 V 150 H 0 Z" fill="url(#chartGradient)" />
            <path d="M 0 120 L 50 100 L 100 110 L 150 80 L 200 90 L 250 60 L 300 75 L 350 50 L 400 60" fill="none" stroke="#10b981" strokeWidth="2" />
        </svg>
    </div>
);

const TradePanel: React.FC = () => {
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button onClick={() => setTradeType('buy')} className={`flex-1 py-2 font-semibold text-sm border-b-2 ${tradeType === 'buy' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Buy</button>
                <button onClick={() => setTradeType('sell')} className={`flex-1 py-2 font-semibold text-sm border-b-2 ${tradeType === 'sell' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Sell</button>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Amount</label>
                    <input type="number" defaultValue="10.5" className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 mt-1 text-lg font-mono"/>
                </div>
                 <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Price (USD)</label>
                    <input type="number" defaultValue="1250.75" className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 mt-1 text-lg font-mono"/>
                </div>
                <button className={`w-full py-3 font-semibold text-white rounded-md transition-colors ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    {tradeType === 'buy' ? 'Buy AOS' : 'Sell AOS'}
                </button>
            </div>
        </div>
    )
}

export const Trading: React.FC = () => {
    return (
        <div className="animate-fade-in flex flex-col lg:flex-row h-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 gap-4">
            {/* Main content - Chart and Trade Panel */}
            <main className="flex-1 flex flex-col gap-4">
                <div className="flex-1">
                    <TradingChart />
                </div>
                <div className="lg:hidden"> {/* Show trade panel at bottom on small screens */}
                    <TradePanel />
                </div>
            </main>

            {/* Right Sidebar - Watchlist & Trade Panel */}
            <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
                 <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex-1 flex flex-col">
                    <h3 className="font-bold mb-4">Watchlist</h3>
                    <ul className="space-y-3 flex-1 overflow-y-auto">
                        {mockStocks.map(stock => (
                            <li key={stock.symbol} className="flex justify-between items-center cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                <div>
                                    <p className="font-bold text-sm">{stock.symbol}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Aetherius OS Inc.</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-semibold text-sm">{stock.price.toFixed(2)}</p>
                                    <p className={`text-xs font-semibold ${stock.color === 'green' ? 'text-green-500' : 'text-red-500'}`}>
                                        {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div className="hidden lg:block"> {/* Hide trade panel here on small screens */}
                    <TradePanel />
                </div>
            </aside>
        </div>
    );
};