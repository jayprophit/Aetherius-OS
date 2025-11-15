import React from 'react';
import { knowledgeBaseData } from '../data';
import { marked } from 'marked';

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
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Knowledge Base</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">A living catalog of all concepts, technologies, and modules within Aetherius OS.</p>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-4 font-semibold uppercase text-gray-600 dark:text-gray-300">ID</th>
                                <th className="py-3 px-4 font-semibold uppercase text-gray-600 dark:text-gray-300">Name</th>
                                <th className="py-3 px-4 font-semibold uppercase text-gray-600 dark:text-gray-300 w-1/2">Details & Description</th>
                                <th className="py-3 px-4 font-semibold uppercase text-gray-600 dark:text-gray-300">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {knowledgeBaseData.map(item => (
                                <tr key={item.id}>
                                    <td className="py-3 px-4 font-mono text-gray-500 dark:text-gray-400 align-top">{item.id}</td>
                                    <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200 align-top">{item.name}</td>
                                    <td className="py-3 px-4 max-w-2xl">
                                        <div 
                                            className="prose prose-sm dark:prose-invert max-w-none 
                                                       prose-table:border prose-th:p-2 prose-td:p-2 prose-headings:my-2 prose-p:my-1 prose-ul:my-1 prose-li:my-0
                                                       prose-h3:font-bold prose-h4:font-semibold"
                                            dangerouslySetInnerHTML={{ __html: marked(item.details) as string }} 
                                        />
                                    </td>
                                    <td className="py-3 px-4 align-top">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>This list is dynamically updated by the Aetherius OS AI as new concepts are introduced.</p>
            </div>
        </div>
    );
};