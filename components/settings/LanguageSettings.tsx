
import React, { useState } from 'react';
import { GlobeAltIcon, LanguageIcon, CheckCircleIcon } from '../Icons';

const Card: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{title}</h2>
        {children}
    </div>
);

export const LanguageSettings: React.FC<{ title: string }> = ({ title }) => {
    const [language, setLanguage] = useState(navigator.language);
    
    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1 flex items-center gap-3">
                <LanguageIcon className="w-8 h-8 text-purple-500"/>
                {title}
            </h1>

            <Card title="Preferred Language">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {language.split('-')[0].toUpperCase()}
                         </div>
                         <div>
                             <p className="font-bold text-gray-800 dark:text-gray-100">System Default</p>
                             <p className="text-sm text-gray-500">{navigator.languages.join(', ')}</p>
                         </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-bold">Auto-Detected</span>
                    </div>
                </div>
                
                <button className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    Add a Language...
                </button>
            </Card>
            
            <Card title="Region & Format">
                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300">Region</span>
                        <span className="text-gray-500">{Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[0]}</span>
                    </div>
                     <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-700 dark:text-gray-300">Date Format</span>
                        <span className="text-gray-500">{new Date().toLocaleDateString()}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">Number Format</span>
                        <span className="text-gray-500">1,234.56</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};