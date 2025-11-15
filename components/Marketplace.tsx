import React from 'react';
import { SearchIcon, ChevronDownIcon } from './Icons';

const businesses = [
    { id: 1, name: 'QuantumLeap Robotics', category: 'Robotics', logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500', description: 'Pioneering the next generation of autonomous systems and humanoid robotics.' },
    { id: 2, name: 'SynthWave Audio', category: 'Music Tech', logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=purple&shade=500', description: 'Creating cutting-edge digital keyboards and drum machines for modern producers.' },
    { id: 3, name: 'Fabri-Verse 3D', category: 'Manufacturing', logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=green&shade=500', description: 'High-precision 3D printers, scanners, and CNC machines for creators and industries.' },
    { id: 4, name: 'CodeForge Solutions', category: 'Software', logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=pink&shade=500', description: 'Developing bespoke software solutions and applications for enterprise clients.' },
    { id: 5, name: 'Edison Labs', category: 'Electronics', logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=yellow&shade=500', description: 'Designing innovative gadgets and electronic components for a connected world.' },
    { id: 6, name: 'Newton Dynamics', category: 'Physics Lab', logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=blue&shade=500', description: 'Supplying high-quality physics laboratory apparatus for education and research.' },
];

const BusinessCard: React.FC<{ business: typeof businesses[0] }> = ({ business }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <img src={business.logoUrl} alt={`${business.name} logo`} className="w-10 h-10"/>
            </div>
            <div>
                 <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{business.name}</h3>
                 <span className="text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 px-2 py-0.5 rounded-full">{business.category}</span>
            </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 h-16">{business.description}</p>
        <button className="mt-4 w-full px-4 py-2 text-sm font-semibold text-white bg-gray-800 dark:bg-blue-600 rounded-md hover:bg-gray-700 dark:hover:bg-blue-500 transition-colors">View Profile</button>
    </div>
);

export const Marketplace: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Marketplace & Business Hub</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Discover leading companies in the tech industry.</p>
            </header>

            {/* Filters and Search */}
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:flex-1">
                    <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search businesses..." className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md h-10 pl-10 pr-4 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative">
                        <button className="flex items-center justify-between w-full sm:w-48 text-sm px-3 h-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                            <span>All Categories</span>
                            <ChevronDownIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </div>
            </div>

            {/* Business Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {businesses.map(business => <BusinessCard key={business.id} business={business} />)}
            </div>
        </div>
    );
};