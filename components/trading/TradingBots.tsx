import React from 'react';
import { tradingBots } from '../../data';
import { TradingBot } from '../../types';
import { ChipIcon, PlusIcon } from '../Icons';

const BotCard: React.FC<{ bot: TradingBot }> = ({ bot }) => {
    const isRunning = bot.status === 'Running';
    const pnlIsPositive = bot.pnl >= 0;

    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{bot.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{bot.strategy}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${isRunning ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                    <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    {bot.status}
                </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pair</p>
                    <p className="font-semibold font-mono">{bot.pair}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Runtime</p>
                    <p className="font-semibold font-mono">{bot.runtime}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">P&L (USD)</p>
                    <p className={`font-semibold font-mono ${pnlIsPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {pnlIsPositive ? '+' : ''}{bot.pnl.toFixed(2)}
                    </p>
                </div>
            </div>
             <div className="mt-4 flex gap-2">
                <button className="flex-1 px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Details</button>
                <button className="flex-1 px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                    {isRunning ? 'Stop' : 'Start'}
                </button>
            </div>
        </div>
    );
};

export const TradingBots: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Trading Bots</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Automate your trading strategies 24/7.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    <PlusIcon className="w-5 h-5" />
                    Create Bot
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {tradingBots.map(bot => (
                    <BotCard key={bot.id} bot={bot} />
                ))}
            </div>
        </div>
    );
};
