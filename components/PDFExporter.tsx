import React from 'react';
import { marked } from 'marked';
import { masterSpecMarkdown } from '../docs/masterSpec';
import { ArrowDownTrayIcon } from './Icons';

export const PDFExporter: React.FC = () => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800">
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-area, #print-area * {
                        visibility: visible;
                    }
                    #print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    #print-button {
                        display: none;
                    }
                }
                `}
            </style>
            <header 
                id="print-button"
                className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
            >
                <h1 className="text-xl font-bold">Master Spec Document</h1>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
                >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Export as PDF
                </button>
            </header>
            <div id="print-area" className="flex-1 overflow-y-auto p-8">
                <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: marked(masterSpecMarkdown) as string }}
                />
            </div>
        </div>
    );
};