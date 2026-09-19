import React, { useState } from 'react';
import { NewsArticle } from '../../types';
import { tradingNews } from '../../data';

const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => (
    <a href="#" className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
        <img src={article.imageUrl} alt={article.title} className="w-full h-40 object-cover" />
        <div className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{article.source} &bull; {article.timestamp}</p>
            <h3 className="font-bold text-md mt-1 text-gray-800 dark:text-gray-100">{article.title}</h3>
        </div>
    </a>
);

export const TradingNews: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const categories = ['All', 'Crypto', 'Forex', 'World Markets', 'Analysis'];

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6 max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Financial News</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">The latest headlines from top financial news sources.</p>
            </header>
            
             <div className="mb-6 max-w-5xl mx-auto border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-2 text-sm font-semibold border-b-2 ${activeCategory === cat ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tradingNews
                    .filter(article => activeCategory === 'All' || article.category === activeCategory)
                    .map(article => (
                        <NewsCard key={article.id} article={article} />
                ))}
            </div>
        </div>
    );
};
