
import React, { useState, useEffect } from 'react';

interface BubbleData {
    id: string;
    symbol: string;
    change: number; // Percentage change
    marketCap: number; // Size of bubble
    price: number;
}

const initialData: BubbleData[] = [
    { id: '1', symbol: 'BTC', change: 2.5, marketCap: 100, price: 65000 },
    { id: '2', symbol: 'ETH', change: -1.2, marketCap: 60, price: 3500 },
    { id: '3', symbol: 'SOL', change: 5.8, marketCap: 30, price: 145 },
    { id: '4', symbol: 'XRP', change: 0.5, marketCap: 20, price: 0.6 },
    { id: '5', symbol: 'ADA', change: -3.4, marketCap: 15, price: 0.45 },
    { id: '6', symbol: 'DOGE', change: 8.2, marketCap: 18, price: 0.12 },
    { id: '7', symbol: 'DOT', change: -0.8, marketCap: 12, price: 7.5 },
    { id: '8', symbol: 'AVAX', change: 1.5, marketCap: 14, price: 45 },
    { id: '9', symbol: 'LINK', change: 4.2, marketCap: 10, price: 18 },
    { id: '10', symbol: 'MATIC', change: -2.1, marketCap: 9, price: 0.9 },
];

export const MarketBubbles: React.FC = () => {
    const [bubbles, setBubbles] = useState<BubbleData[]>(initialData);

    // Simple simulation of live price updates
    useEffect(() => {
        const interval = setInterval(() => {
            setBubbles(prev => prev.map(b => ({
                ...b,
                change: b.change + (Math.random() - 0.5) * 0.5, // Random fluctuation
                marketCap: b.marketCap * (1 + (Math.random() - 0.5) * 0.01)
            })));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full bg-gray-900 relative overflow-hidden rounded-lg border border-gray-800 select-none">
            <div className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-gray-300 font-bold">
                Market Heatmap (Size = Vol, Color = 24h%)
            </div>
            <div className="w-full h-full flex flex-wrap content-center justify-center items-center p-4 gap-2">
                {bubbles.map(bubble => {
                    // Simple size calculation for demo
                    const size = Math.max(60, Math.min(160, bubble.marketCap * 2)); 
                    const isGreen = bubble.change >= 0;
                    const colorClass = isGreen 
                        ? `bg-green-500/20 border-green-500/50 text-green-100` 
                        : `bg-red-500/20 border-red-500/50 text-red-100`;
                    
                    return (
                        <div 
                            key={bubble.id}
                            className={`rounded-full border-2 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out cursor-pointer hover:scale-110 hover:z-20 hover:brightness-110 shadow-lg backdrop-blur-sm ${colorClass}`}
                            style={{ 
                                width: size, 
                                height: size,
                            }}
                        >
                            <span className="font-bold text-sm md:text-lg drop-shadow-md">{bubble.symbol}</span>
                            <span className="text-xs font-bold md:text-sm drop-shadow-md">
                                {bubble.change > 0 ? '+' : ''}{bubble.change.toFixed(2)}%
                            </span>
                            <span className="text-[10px] opacity-80 mt-1">${bubble.price.toLocaleString()}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
