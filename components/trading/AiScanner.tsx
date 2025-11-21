
import React, { useState, useEffect } from 'react';
import { BoltIcon, TrendingUpIcon, ExclamationTriangleIcon, SparklesIcon, ArrowRightIcon } from '../Icons';

interface Signal {
    id: string;
    symbol: string;
    type: 'Bullish' | 'Bearish' | 'Neutral';
    pattern: string;
    confidence: number;
    time: string;
    description: string;
}

const patterns = [
    { name: 'Bull Flag Breakout', type: 'Bullish' },
    { name: 'RSI Divergence', type: 'Bullish' },
    { name: 'Death Cross', type: 'Bearish' },
    { name: 'High Volatility Alert', type: 'Neutral' },
    { name: 'Cup and Handle', type: 'Bullish' },
    { name: 'Head and Shoulders', type: 'Bearish' },
    { name: 'Unusual Volume Spike', type: 'Bullish' },
];

const symbols = ['BTC', 'ETH', 'SOL', 'AAPL', 'TSLA', 'NVDA', 'EUR/USD', 'XAU/USD'];

export const AiScanner: React.FC = () => {
    const [signals, setSignals] = useState<Signal[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
            const confidence = 65 + Math.random() * 34;
            
            const newSignal: Signal = {
                id: Math.random().toString(36).substr(2, 9),
                symbol: randomSymbol,
                type: randomPattern.type as any,
                pattern: randomPattern.name,
                confidence: confidence,
                time: new Date().toLocaleTimeString(),
                description: `AI detected strong correlation with ${randomPattern.name} formation on 5m timeframe.`
            };

            setSignals(prev => [newSignal, ...prev].slice(0, 50)); // Keep last 50
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <header className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-purple-500"/> AI Pattern Scanner
                </h3>
                <span className="text-xs text-green-500 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Live
                </span>
            </header>
            <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-900/30 sticky top-0 backdrop-blur-sm z-10 text-gray-500">
                        <tr>
                            <th className="p-2 text-left">Time</th>
                            <th className="p-2 text-left">Symbol</th>
                            <th className="p-2 text-left">Pattern</th>
                            <th className="p-2 text-right">AI Conf.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {signals.map(signal => (
                            <tr key={signal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer">
                                <td className="p-2 font-mono text-gray-400">{signal.time}</td>
                                <td className="p-2 font-bold">{signal.symbol}</td>
                                <td className="p-2">
                                    <span className={`inline-flex items-center gap-1 ${
                                        signal.type === 'Bullish' ? 'text-green-500' : 
                                        signal.type === 'Bearish' ? 'text-red-500' : 'text-yellow-500'
                                    }`}>
                                        {signal.type === 'Bullish' ? <TrendingUpIcon className="w-3 h-3"/> : 
                                         signal.type === 'Bearish' ? <TrendingUpIcon className="w-3 h-3 transform rotate-180"/> : 
                                         <ExclamationTriangleIcon className="w-3 h-3"/>}
                                        {signal.pattern}
                                    </span>
                                </td>
                                <td className="p-2 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${signal.confidence > 80 ? 'bg-purple-500' : 'bg-blue-500'}`} 
                                                style={{ width: `${signal.confidence}%` }}
                                            ></div>
                                        </div>
                                        <span className="font-mono">{signal.confidence.toFixed(0)}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {signals.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                                    Scanning markets for algorithmic patterns...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
