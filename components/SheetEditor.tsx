
import React, { useState, useEffect, useCallback } from 'react';
import { 
    TableCellsIcon, PlusIcon, ArrowDownTrayIcon, 
    CalculatorIcon, TrashIcon, FunnelIcon 
} from './Icons';

const COLS = 10;
const ROWS = 20;
const COL_HEADERS = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i));

interface CellData {
    value: string;
    computed: string;
    formula: string;
    style?: React.CSSProperties;
}

export const SheetEditor: React.FC = () => {
    const [data, setData] = useState<Record<string, CellData>>({});
    const [selectedCell, setSelectedCell] = useState<string | null>('A1');
    const [editValue, setEditValue] = useState('');

    const getCellId = (col: number, row: number) => `${COL_HEADERS[col]}${row + 1}`;

    const evaluateFormula = (formula: string): string => {
        if (!formula.startsWith('=')) return formula;
        
        const expression = formula.substring(1).toUpperCase();
        
        // Simple SUM handling: =SUM(A1:A3)
        if (expression.startsWith('SUM(')) {
            const range = expression.match(/\((.*?)\)/)?.[1];
            if (range && range.includes(':')) {
                const [start, end] = range.split(':');
                // Simplified range parsing (vertical only for demo)
                const startCol = start.charAt(0);
                const startRow = parseInt(start.substring(1));
                const endRow = parseInt(end.substring(1));
                let sum = 0;
                for(let r = startRow; r <= endRow; r++) {
                    const val = parseFloat(data[`${startCol}${r}`]?.computed || '0');
                    if (!isNaN(val)) sum += val;
                }
                return String(sum);
            }
        }

        // Basic Math: =A1+B2
        try {
            // Replace cell refs with values
            const parsed = expression.replace(/[A-Z][0-9]+/g, (match) => {
                const val = parseFloat(data[match]?.computed || '0');
                return isNaN(val) ? '0' : String(val);
            });
            // eslint-disable-next-line no-new-func
            return String(new Function('return ' + parsed)());
        } catch (e) {
            return '#ERROR';
        }
    };

    const handleCellChange = (id: string, value: string) => {
        const newData = { ...data };
        const computed = evaluateFormula(value);
        
        newData[id] = {
            value: value,
            formula: value.startsWith('=') ? value : '',
            computed: computed
        };
        
        // Re-evaluate entire sheet (naive dependency update)
        Object.keys(newData).forEach(key => {
            if (newData[key].formula) {
                newData[key].computed = evaluateFormula(newData[key].formula);
            }
        });

        setData(newData);
        setEditValue(value);
    };

    const handleSelect = (id: string) => {
        setSelectedCell(id);
        setEditValue(data[id]?.value || '');
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            {/* Toolbar */}
            <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-2 bg-gray-50 dark:bg-gray-800">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded text-green-600 dark:text-green-400">
                    <TableCellsIcon className="w-5 h-5" />
                </div>
                <span className="font-bold mr-4">Untitled Spreadsheet</span>
                
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
                
                <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Functions">
                    <CalculatorIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Filter">
                    <FunnelIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Export CSV">
                    <ArrowDownTrayIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
            </div>

            {/* Formula Bar */}
            <div className="h-10 border-b border-gray-200 dark:border-gray-700 flex items-center px-2 bg-white dark:bg-gray-900">
                <div className="w-10 text-center text-xs font-bold text-gray-500 border-r border-gray-200 dark:border-gray-700 mr-2">
                    {selectedCell}
                </div>
                <span className="text-gray-400 mr-2">ƒx</span>
                <input 
                    type="text" 
                    className="flex-1 bg-transparent outline-none text-sm font-mono"
                    value={editValue}
                    onChange={(e) => {
                        setEditValue(e.target.value);
                        if (selectedCell) handleCellChange(selectedCell, e.target.value);
                    }}
                />
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto relative">
                <table className="w-full border-collapse table-fixed">
                    <thead>
                        <tr>
                            <th className="w-10 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 sticky top-0 z-10"></th>
                            {COL_HEADERS.map(col => (
                                <th key={col} className="w-24 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-1 py-1 text-xs font-semibold text-center sticky top-0 z-10">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: ROWS }).map((_, r) => (
                            <tr key={r}>
                                <td className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-center text-xs font-semibold text-gray-500 sticky left-0 z-0">
                                    {r + 1}
                                </td>
                                {Array.from({ length: COLS }).map((_, c) => {
                                    const id = getCellId(c, r);
                                    const cell = data[id];
                                    const isSelected = selectedCell === id;
                                    
                                    return (
                                        <td 
                                            key={id}
                                            onClick={() => handleSelect(id)}
                                            className={`border border-gray-200 dark:border-gray-700 p-0 relative ${isSelected ? 'border-blue-500 ring-2 ring-blue-500 z-10' : ''}`}
                                        >
                                            <input 
                                                className="w-full h-full px-2 py-1 bg-transparent outline-none text-sm text-right cursor-default focus:cursor-text"
                                                value={cell?.computed || ''}
                                                onChange={(e) => handleCellChange(id, e.target.value)}
                                                onFocus={() => handleSelect(id)}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Footer */}
            <div className="h-8 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center px-4 text-xs gap-4">
                <button className="font-bold text-blue-600 bg-white dark:bg-gray-700 px-3 py-0.5 rounded shadow-sm">Sheet 1</button>
                <button className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><PlusIcon className="w-3 h-3"/></button>
            </div>
        </div>
    );
};
