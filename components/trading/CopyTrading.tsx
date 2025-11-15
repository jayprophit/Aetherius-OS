import React from 'react';
import { User } from '../../types';
import { topCopyTraders } from '../../data';
import { ChartBarIcon } from '../Icons';

const TraderCard: React.FC<{ trader: User }> = ({ trader }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
            <img src={trader.avatarUrl!} alt={trader.name} className="w-16 h-16 rounded-full" />
            <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{trader.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{trader.username}</p>
            </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ROI (12m)</p>
                <p className="font-bold text-lg text-green-500">{trader.roi?.toFixed(1)}%</p>
            </div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Risk Score</p>
                <p className="font-bold text-lg">{trader.riskScore}</p>
            </div>
             <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Followers</p>
                <p className="font-bold text-lg">{trader.followers?.toLocaleString()}</p>
            </div>
        </div>
        <div className="mt-4 flex gap-2">
            <button className="flex-1 px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">View Profile</button>
            <button className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Copy</button>
        </div>
    </div>
);

export const CopyTrading: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Copy Trading</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Automatically copy the trades of top-performing investors.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {topCopyTraders.map(trader => (
                    <TraderCard key={trader.id} trader={trader} />
                ))}
            </div>
        </div>
    );
};
