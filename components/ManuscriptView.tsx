
import React from 'react';
import { marked } from 'marked';
import { manuscriptMarkdown } from '../docs/manuscript';
import { PencilIcon } from './Icons';

export const ManuscriptView: React.FC = () => {
    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800 animate-fade-in">
            <header 
                className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
            >
                <h1 className="text-xl font-bold flex items-center gap-3">
                    <PencilIcon className="w-6 h-6" />
                    Ætheria Manuscript
                </h1>
            </header>
            <div className="flex-1 overflow-y-auto p-8">
                <div 
                    className="prose dark:prose-invert max-w-none 
                               prose-headings:my-4 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                               prose-p:my-2 prose-ul:my-2 prose-li:my-1
                               prose-table:border prose-th:p-2 prose-td:p-2
                               prose-code:bg-gray-100 prose-code:dark:bg-gray-700 prose-code:p-1 prose-code:rounded"
                    dangerouslySetInnerHTML={{ __html: marked(manuscriptMarkdown) as string }}
                />
            </div>
        </div>
    );
};