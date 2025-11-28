
import React, { useState, useMemo } from 'react';
import { GlobeAltIcon, SearchIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, BeakerIcon, SparklesIcon } from '../Icons';
import { healthAndWellnessData } from '../../healthData';
import { DetailedHealingItem } from '../../types';

const HealingModal: React.FC<{ item: DetailedHealingItem & { name: string, type: 'nature' | 'pharmaceutical' }; onClose: () => void }> = ({ item, onClose }) => {
    const isNature = item.type === 'nature';
    const themeColor = isNature ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400';
    const themeBg = isNature ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20';
    const themeBorder = isNature ? 'border-green-200 dark:border-green-800' : 'border-blue-200 dark:border-blue-800';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 relative flex flex-col">
                
                {/* Header */}
                <div className={`sticky top-0 z-10 p-6 border-b ${themeBorder} ${themeBg} flex justify-between items-start rounded-t-2xl`}>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className={`text-3xl font-bold ${themeColor}`}>{item.name}</h2>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${isNature ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                                {isNature ? 'Nature' : 'Pharma'}
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{item.category}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    
                    {/* Description */}
                    <div className={`p-6 rounded-xl border ${themeBorder} bg-opacity-50 ${isNature ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-blue-50/50 dark:bg-blue-900/10'}`}>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                            <SparklesIcon className={`w-5 h-5 ${themeColor}`} /> Overview
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{item.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pros */}
                        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800/50 shadow-sm">
                            <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                                <CheckCircleIcon className="w-6 h-6" /> Advantages
                            </h3>
                            <ul className="space-y-3">
                                {item.pros.map((pro, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                        <span className="text-green-500 mt-1 font-bold">•</span>
                                        <span>{pro}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Cons */}
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 border border-red-200 dark:border-red-800/50 shadow-sm">
                            <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-6 h-6" /> Considerations
                            </h3>
                            <ul className="space-y-3">
                                {item.cons.map((con, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                        <span className="text-red-500 mt-1 font-bold">•</span>
                                        <span>{con}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Uses */}
                         <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-6 border border-purple-200 dark:border-purple-800/50">
                            <h3 className="text-lg font-bold text-purple-700 dark:text-purple-400 mb-3">Common Uses</h3>
                            <div className="flex flex-wrap gap-2">
                                {item.uses.map((use, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-white dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700 rounded-full text-sm text-purple-800 dark:text-purple-200 font-medium">
                                        {use}
                                    </span>
                                ))}
                            </div>
                         </div>

                         {/* Conditions */}
                         <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-6 border border-orange-200 dark:border-orange-800/50">
                            <h3 className="text-lg font-bold text-orange-700 dark:text-orange-400 mb-3">Related Conditions</h3>
                            <div className="flex flex-wrap gap-2">
                                {item.relatedConditions.map((cond, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-white dark:bg-orange-900/40 border border-orange-200 dark:border-orange-700 rounded-full text-sm text-orange-800 dark:text-orange-200 font-medium">
                                        {cond}
                                    </span>
                                ))}
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const HealingWeb: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<(DetailedHealingItem & { name: string, type: 'nature' | 'pharmaceutical' }) | null>(null);

    const allNature = useMemo(() => {
        return Object.entries(healthAndWellnessData.healingWebFull.nature).map(([name, data]) => ({
            name, ...data, type: 'nature' as const
        }));
    }, []);

    const allPharma = useMemo(() => {
        return Object.entries(healthAndWellnessData.healingWebFull.pharmaceutical).map(([name, data]) => ({
            name, ...data, type: 'pharmaceutical' as const
        }));
    }, []);

    const filterItems = <T extends DetailedHealingItem & { name: string }>(items: T[]) => {
        if (!searchTerm) return items;
        const lowerSearch = searchTerm.toLowerCase();
        return items.filter(item => 
            item.name.toLowerCase().includes(lowerSearch) ||
            item.category.toLowerCase().includes(lowerSearch) ||
            item.description.toLowerCase().includes(lowerSearch)
        );
    };

    const filteredNature = filterItems(allNature);
    const filteredPharma = filterItems(allPharma);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto relative">
            {selectedItem && <HealingModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

            <header className="mb-8 text-center max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 flex items-center justify-center gap-3 mb-2">
                    <GlobeAltIcon className="w-10 h-10 text-blue-500" />
                    THE HEALING WEB
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    A comprehensive interactive guide comparing Holistic & Allopathic Healthcare.
                </p>

                <div className="relative mt-8 max-w-2xl mx-auto">
                    <SearchIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Search for treatments, herbs, drugs, or conditions..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-lg shadow-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                    />
                </div>
                {searchTerm && (
                    <p className="mt-2 text-sm text-gray-500">
                        Found {filteredNature.length + filteredPharma.length} results
                    </p>
                )}
            </header>

            {/* Central Visual Concept (Desktop Only) */}
            <div className="hidden lg:flex justify-center mb-12 pointer-events-none">
                <div className="relative w-64 h-64">
                     <div className="absolute inset-0 rounded-full border-[20px] border-gray-200 dark:border-gray-700 opacity-30"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-48 h-48 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex flex-col items-center justify-center shadow-2xl text-white z-10">
                             <BeakerIcon className="w-12 h-12 mb-2 opacity-80"/>
                             <span className="font-bold text-xl tracking-wider">BALANCE</span>
                         </div>
                     </div>
                     {/* Connecting Lines (Simulated) */}
                     <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-blue-500 -z-10 opacity-50"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1600px] mx-auto">
                {/* Holistic Side */}
                <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border-t-8 border-green-500">
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800/50 text-center">
                        <h2 className="text-2xl font-bold text-green-800 dark:text-green-400 uppercase tracking-widest">
                            Holistic Medicine
                        </h2>
                        <p className="text-xs font-semibold text-green-600 dark:text-green-500 mt-1">Nature • Lifestyle • Prevention</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredNature.map((item, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setSelectedItem(item)}
                                className="text-left px-4 py-3 rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-300 transition-all duration-200 group"
                            >
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400">{item.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.category}</p>
                            </button>
                        ))}
                        {filteredNature.length === 0 && <p className="col-span-2 text-center text-gray-400 py-8">No natural remedies found.</p>}
                    </div>
                </section>

                {/* Pharmaceutical Side */}
                <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border-t-8 border-blue-500">
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50 text-center">
                        <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest">
                            Pharmaceutical
                        </h2>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-500 mt-1">Science • Intervention • Management</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredPharma.map((item, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setSelectedItem(item)}
                                className="text-left px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 transition-all duration-200 group"
                            >
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">{item.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.category}</p>
                            </button>
                        ))}
                         {filteredPharma.length === 0 && <p className="col-span-2 text-center text-gray-400 py-8">No pharmaceutical treatments found.</p>}
                    </div>
                </section>
            </div>

            <div className="mt-12 text-center text-xs text-gray-500 max-w-2xl mx-auto bg-gray-200 dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-bold mb-1">⚠️ Medical Disclaimer</p>
                This application provides educational information only based on the Healing Web dataset. 
                It is not medical advice. Always consult qualified healthcare professionals for diagnosis and treatment.
            </div>
        </div>
    );
};
