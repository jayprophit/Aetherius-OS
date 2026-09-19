import React from 'react';
import { GameControllerIcon } from '../Icons';

const GameCard: React.FC<{ title: string, description: string }> = ({ title, description }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-xl mb-2 text-gray-800 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>
        <button className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Play Now</button>
    </div>
);

export const CryptoGames: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6 max-w-4xl mx-auto">
                 <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <GameControllerIcon className="w-8 h-8" /> Gaming & Betting
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Provably fair games of chance. Please play responsibly.</p>
            </header>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                <GameCard 
                    title="Dice"
                    description="Roll the dice and bet on the outcome. Set your payout and win chance for customized risk."
                />
                 <GameCard 
                    title="Crash"
                    description="Watch the multiplier increase from 1.00x upwards! Cash out any time to get your bet multiplied by that amount. But be careful, the game can crash at any time."
                />
            </div>
        </div>
    );
};
