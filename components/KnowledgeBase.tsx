
import React, { useMemo } from 'react';
import { knowledgeBaseData } from '../data';
import { marked } from 'marked';
import { BookOpenIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from './Icons';

const statusColors: { [key: string]: string } = {
    'Concept Phase': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    'R&D Phase': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    'Theoretical Phase': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'Integrated': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Deployed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'In Development': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'Optimizing': 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
    'Design Phase': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    'Awaiting Build': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    'Architecting': 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
    'Foundational': 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
};

export const KnowledgeBase: React.FC = () => {
    const totalProgress = useMemo(() => {
        if (!knowledgeBaseData.length) return 0;
        const total = knowledgeBaseData.reduce((acc, item) => acc + item.progress, 0);
        return Math.round(total / knowledgeBaseData.length);
    }, []);

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <BookOpenIcon className="w-8 h-8 text-blue-600" /> Knowledge Base
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">A living catalog of all concepts, technologies, and modules within Aetherius OS.</p>
            </header>

            {/* Overall Progress Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Total System Knowledge Integration</h2>
                <div className="flex items-center gap-6">
                    <span className="font-bold text-4xl text-blue-600 dark:text-blue-400 min-w-[3rem] text-right">{totalProgress}%</span>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 shadow-inner overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full shadow-lg transition-all duration-1000 ease-out" 
                            style={{ width: `${totalProgress}%` }}
                        ></div>
                    </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Concept Phase</span>
                    <span>Active Deployment</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="py-3 px-4 font-semibold uppercase w-24">ID</th>
                                <th className="py-3 px-4 font-semibold uppercase w-1/4">Name</th>
                                <th className="py-3 px-4 font-semibold uppercase">Details & Description</th>
                                <th className="py-3 px-4 font-semibold uppercase w-48">Completion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {knowledgeBaseData.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="py-4 px-4 font-mono text-gray-500 dark:text-gray-400 align-top text-xs">{item.id}</td>
                                    <td className="py-4 px-4 font-bold text-gray-800 dark:text-gray-200 align-top">{item.name}</td>
                                    <td className="py-4 px-4 max-w-2xl text-gray-600 dark:text-gray-300 align-top">
                                        <div 
                                            className="prose prose-sm dark:prose-invert max-w-none mb-2"
                                            dangerouslySetInnerHTML={{ __html: marked(item.details) as string }} 
                                        />
                                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border border-opacity-20 ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 align-top">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.progress}%</span>
                                            {item.progress === 100 ? (
                                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                            ) : item.progress > 0 ? (
                                                <ClockIcon className="w-4 h-4 text-blue-500" />
                                            ) : (
                                                <ExclamationTriangleIcon className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    item.progress === 100 ? 'bg-green-500' : 
                                                    item.progress >= 50 ? 'bg-blue-500' : 
                                                    item.progress > 0 ? 'bg-yellow-500' : 'bg-gray-400'
                                                }`} 
                                                style={{ width: `${item.progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                                            <span>{item.status === 'Integrated' ? 'Done' : 'Pending'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 pb-6">
                <p>This database is dynamically linked to the OS Architect Persona and updates as new modules are conceptualized.</p>
            </div>
        </div>
    );
};
