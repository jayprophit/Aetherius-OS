import React from 'react';
import { StakingPool } from '../../types';
import { stakingPools } from '../../data';

const StakingPoolRow: React.FC<{ pool: StakingPool }> = ({ pool }) => (
    <tr className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <td className="p-4">
            <div className="flex items-center gap-3">
                <img src={pool.asset.logoUrl} alt={pool.asset.name} className="w-8 h-8" />
                <div>
                    <p className="font-bold text-gray-800 dark:text-gray-100">{pool.asset.symbol}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{pool.asset.name}</p>
                </div>
            </div>
        </td>
        <td className="p-4 text-right font-mono text-green-500 font-semibold text-lg">{pool.apy.toFixed(2)}%</td>
        <td className="p-4 text-right font-mono hidden sm:table-cell">${(pool.tvl / 1e6).toFixed(2)}M</td>
        <td className="p-4 text-right hidden sm:table-cell">{pool.lockupPeriod}</td>
        <td className="p-4 text-right">
            <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Stake</button>
        </td>
    </tr>
);


export const Staking: React.FC = () => {
    return (
         <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Staking Pools</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Earn rewards by staking your crypto assets.</p>
            </header>

            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="p-4 text-left">Asset</th>
                                    <th className="p-4 text-right">Estimated APY</th>
                                    <th className="p-4 text-right hidden sm:table-cell">Total Staked (USD)</th>
                                    <th className="p-4 text-right hidden sm:table-cell">Lockup Period</th>
                                    <th className="p-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {stakingPools.map(pool => (
                                    <StakingPoolRow key={pool.id} pool={pool} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
