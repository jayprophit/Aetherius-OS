import React, { useState } from 'react';
import { ChevronDownIcon, ArrowPathIcon, Cog6ToothIcon } from '../Icons';
import { tradingAssets } from '../../data';

const AssetSelect: React.FC<{ symbol: string; onSelect: (symbol: string) => void }> = ({ symbol, onSelect }) => {
    const asset = tradingAssets.find(a => a.symbol === symbol);
    return (
        <button className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
            <img src={asset?.logoUrl} alt={asset?.name} className="w-6 h-6" />
            <span className="font-bold">{asset?.symbol}</span>
            <ChevronDownIcon className="w-4 h-4" />
        </button>
    );
};

export const Swap: React.FC = () => {
    const [fromAsset, setFromAsset] = useState('BTC');
    const [toAsset, setToAsset] = useState('ETH');
    const [fromAmount, setFromAmount] = useState('1');
    const [toAmount, setToAmount] = useState('18.57');

    const handleSwitch = () => {
        setFromAsset(toAsset);
        setToAsset(fromAsset);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full flex items-center justify-center">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                    <div className="p-4 flex justify-between items-center">
                        <h2 className="font-bold text-xl">Swap</h2>
                        <button><Cog6ToothIcon className="w-6 h-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" /></button>
                    </div>
                    <div className="p-4 space-y-2 relative">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                             <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">From</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Balance: 2.5</span>
                             </div>
                             <div className="flex justify-between items-end mt-1">
                                <input 
                                    type="number" 
                                    value={fromAmount}
                                    onChange={e => setFromAmount(e.target.value)}
                                    className="text-3xl font-mono bg-transparent w-full focus:outline-none" 
                                    placeholder="0.0"
                                />
                                <AssetSelect symbol={fromAsset} onSelect={setFromAsset} />
                             </div>
                        </div>

                        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
                            <button onClick={handleSwitch} className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 hover:rotate-180 transition-transform">
                                <ArrowPathIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                             <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">To</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Balance: 15.2</span>
                             </div>
                             <div className="flex justify-between items-end mt-1">
                                <input 
                                    type="number" 
                                    value={toAmount}
                                    readOnly
                                    className="text-3xl font-mono bg-transparent w-full focus:outline-none text-gray-500"
                                    placeholder="0.0"
                                />
                                <AssetSelect symbol={toAsset} onSelect={setToAsset} />
                             </div>
                        </div>
                    </div>
                    <div className="p-4">
                        <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            Swap
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
