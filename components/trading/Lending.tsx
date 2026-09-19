import React from 'react';
import { LoanableAsset } from '../../types';
import { loanableAssets } from '../../data';

const AssetRow: React.FC<{ asset: LoanableAsset }> = ({ asset }) => (
     <tr className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <td className="p-4">
            <div className="flex items-center gap-3">
                <img src={asset.logoUrl} alt={asset.symbol} className="w-8 h-8" />
                <p className="font-bold text-gray-800 dark:text-gray-100">{asset.symbol}</p>
            </div>
        </td>
        <td className="p-4 text-right font-mono text-green-500 font-semibold">{asset.supplyApy.toFixed(2)}%</td>
        <td className="p-4 text-right font-mono text-red-500 font-semibold">{asset.borrowApy.toFixed(2)}%</td>
        <td className="p-4 text-right font-mono hidden sm:table-cell">${(asset.totalSupplied / 1e6).toFixed(2)}M</td>
        <td className="p-4 text-right">
            <div className="flex gap-2 justify-end">
                <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Supply</button>
                <button className="px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Borrow</button>
            </div>
        </td>
    </tr>
);

export const Lending: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6 max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Lending & Borrowing</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Supply assets to earn interest or borrow against your collateral.</p>
            </header>

             <div className="max-w-5xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="p-4 text-left">Asset</th>
                                    <th className="p-4 text-right">Supply APY</th>
                                    <th className="p-4 text-right">Borrow APY</th>
                                    <th className="p-4 text-right hidden sm:table-cell">Total Supplied</th>
                                    <th className="p-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loanableAssets.map(asset => (
                                    <AssetRow key={asset.symbol} asset={asset} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
