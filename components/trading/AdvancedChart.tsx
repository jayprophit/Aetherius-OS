import React, { useState } from 'react';
import { ChevronDownIcon, PencilIcon, ShareIcon } from '../Icons';

// Mock drawing tools icons
const TrendLineIcon: React.FC<any> = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20L20 4"></path></svg>;
const FibRetracementIcon: React.FC<any> = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 3h18M3 16h18M3 8h18M8 3v18"></path></svg>;
const BrushIcon: React.FC<any> = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2z"></path></svg>;
const TextIcon: React.FC<any> = (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"></path></svg>;


const DrawingTools: React.FC = () => {
    const tools = [
        { icon: TrendLineIcon, name: 'Trend Line' },
        { icon: FibRetracementIcon, name: 'Fib Retracement' },
        { icon: BrushIcon, name: 'Brush' },
        { icon: TextIcon, name: 'Text' },
    ];
    return (
        <aside className="w-14 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-2 space-y-1">
            {tools.map(tool => (
                <button key={tool.name} title={tool.name} className="p-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    <tool.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
            ))}
        </aside>
    );
};

const TopToolbar: React.FC = () => {
    const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D', '1W', '1M'];
    return (
        <header className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 justify-between">
            <div className="flex items-center gap-4">
                <span className="font-bold text-lg">BTC/USD</span>
                <div className="flex items-center gap-2">
                    {timeframes.map(tf => (
                        <button key={tf} className={`px-2 py-1 text-sm rounded ${tf === '1D' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{tf}</button>
                    ))}
                </div>
            </div>
             <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Indicators</button>
                <button className="px-3 py-1.5 text-sm flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ShareIcon className="w-4 h-4" /> Share</button>
             </div>
        </header>
    );
};

const OrderPanel: React.FC = () => {
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    return (
        <aside className="w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 flex flex-col">
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button onClick={() => setTradeType('buy')} className={`flex-1 py-2 font-semibold text-sm border-b-2 ${tradeType === 'buy' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Buy</button>
                <button onClick={() => setTradeType('sell')} className={`flex-1 py-2 font-semibold text-sm border-b-2 ${tradeType === 'sell' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>Sell</button>
            </div>
            <div className="space-y-4 flex-1">
                <select className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm">
                    <option>Market</option>
                    <option>Limit</option>
                    <option>Stop-Limit</option>
                </select>
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Amount (BTC)</label>
                    <input type="number" defaultValue="0.5" className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 mt-1 text-md font-mono"/>
                </div>
                 <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Price (USD)</label>
                    <input type="text" readOnly value="Market" className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 mt-1 text-md font-mono text-gray-500"/>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total: ~$32,517.08</div>
            </div>
             <button className={`w-full py-3 font-semibold text-white rounded-md transition-colors mt-4 ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {tradeType === 'buy' ? 'Buy BTC' : 'Sell BTC'}
            </button>
        </aside>
    );
};

export const AdvancedChart: React.FC = () => {
    return (
        <div className="h-full flex bg-gray-50 dark:bg-gray-900">
            <DrawingTools />
            <main className="flex-1 flex flex-col">
                <TopToolbar />
                <div className="flex-1 p-2">
                    <div className="h-full bg-white dark:bg-gray-800 rounded-md flex items-center justify-center text-gray-400">
                        Candlestick Chart Placeholder
                    </div>
                </div>
            </main>
            <OrderPanel />
        </div>
    );
};
