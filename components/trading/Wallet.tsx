import React from 'react';
import { ArrowUpCircleIcon, ArrowDownTrayIcon, ShoppingCartIcon } from '../Icons';

const holdings = [
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.5, value: 32517.08, logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/btc.svg' },
    { symbol: 'ETH', name: 'Ethereum', amount: 15.2, value: 53365.68, logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg' },
    { symbol: 'USDC', name: 'USD Coin', amount: 10000, value: 10000.00, logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/usdc.svg' },
];

const transactions = [
    { type: 'Received', asset: 'BTC', amount: 0.1, from: '0x1A...2B', time: '2h ago', status: 'Completed' },
    { type: 'Sent', asset: 'ETH', amount: 2.5, to: '0x3C...4D', time: '5h ago', status: 'Completed' },
    { type: 'Bought', asset: 'USDC', amount: 1000, to: 'USD', time: '1d ago', status: 'Completed' },
];

export const Wallet: React.FC = () => {
    const totalBalance = holdings.reduce((acc, h) => acc + h.value, 0);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel: Balance and Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Balance</p>
                            <p className="text-4xl font-bold mt-2">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex justify-around">
                            <button className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                <ArrowUpCircleIcon className="w-8 h-8" />
                                <span className="text-sm">Send</span>
                            </button>
                             <button className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                <ArrowDownTrayIcon className="w-8 h-8" />
                                <span className="text-sm">Receive</span>
                            </button>
                             <button className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                                <ShoppingCartIcon className="w-8 h-8" />
                                <span className="text-sm">Buy/Sell</span>
                            </button>
                        </div>
                         <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                             <h3 className="font-bold p-4 border-b border-gray-200 dark:border-gray-700">Recent Activity</h3>
                             <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {transactions.map((tx, i) => (
                                    <li key={i} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{tx.type} {tx.asset}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{tx.time}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-mono font-semibold ${tx.type === 'Received' ? 'text-green-500' : 'text-red-500'}`}>
                                                {tx.type === 'Received' ? '+' : '-'} {tx.amount}
                                            </p>
                                            <p className="text-xs text-gray-400">{tx.status}</p>
                                        </div>
                                    </li>
                                ))}
                             </ul>
                        </div>
                    </div>

                    {/* Right Panel: Assets */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold p-4 border-b border-gray-200 dark:border-gray-700">My Assets</h2>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {holdings.map(asset => (
                                <li key={asset.symbol} className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <img src={asset.logoUrl} alt={asset.name} className="w-10 h-10" />
                                        <div>
                                            <p className="font-bold">{asset.symbol}</p>
                                            <p className="text-xs text-gray-500">{asset.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-semibold">{asset.amount}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
