
import React, { useState } from 'react';

export const Calculator: React.FC = () => {
    const [display, setDisplay] = useState('0');
    const [prevValue, setPrevValue] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const inputDigit = (digit: string) => {
        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };

    const performOperation = (nextOperator: string) => {
        const inputValue = parseFloat(display);

        if (prevValue === null) {
            setPrevValue(inputValue);
        } else if (operator) {
            const currentValue = prevValue || 0;
            const newValue = calculate(currentValue, inputValue, operator);
            setPrevValue(newValue);
            setDisplay(String(newValue));
        }

        setWaitingForOperand(true);
        setOperator(nextOperator);
    };

    const calculate = (a: number, b: number, op: string) => {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
            default: return b;
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setPrevValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    return (
        <div className="h-full bg-gray-100 dark:bg-gray-900 flex flex-col p-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 text-right shadow-inner border border-gray-200 dark:border-gray-700 h-20 flex items-center justify-end">
                <span className="text-4xl font-mono text-gray-800 dark:text-white truncate">{display}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 flex-1">
                {['C', '±', '%', '/'].map(btn => (
                    <button key={btn} onClick={() => btn === 'C' ? handleClear() : performOperation(btn)} className="bg-gray-300 dark:bg-gray-700 rounded font-bold text-lg hover:brightness-110 active:brightness-90">{btn}</button>
                ))}
                {['7', '8', '9', '*'].map(btn => (
                    <button key={btn} onClick={() => '0123456789'.includes(btn) ? inputDigit(btn) : performOperation(btn)} className={`${'0123456789'.includes(btn) ? 'bg-white dark:bg-gray-800' : 'bg-gray-300 dark:bg-gray-700'} rounded font-bold text-lg hover:brightness-110 active:brightness-90`}>{btn}</button>
                ))}
                {['4', '5', '6', '-'].map(btn => (
                    <button key={btn} onClick={() => '0123456789'.includes(btn) ? inputDigit(btn) : performOperation(btn)} className={`${'0123456789'.includes(btn) ? 'bg-white dark:bg-gray-800' : 'bg-gray-300 dark:bg-gray-700'} rounded font-bold text-lg hover:brightness-110 active:brightness-90`}>{btn}</button>
                ))}
                {['1', '2', '3', '+'].map(btn => (
                    <button key={btn} onClick={() => '0123456789'.includes(btn) ? inputDigit(btn) : performOperation(btn)} className={`${'0123456789'.includes(btn) ? 'bg-white dark:bg-gray-800' : 'bg-gray-300 dark:bg-gray-700'} rounded font-bold text-lg hover:brightness-110 active:brightness-90`}>{btn}</button>
                ))}
                <button onClick={() => inputDigit('0')} className="col-span-2 bg-white dark:bg-gray-800 rounded font-bold text-lg hover:brightness-110 active:brightness-90">0</button>
                <button onClick={() => inputDigit('.')} className="bg-white dark:bg-gray-800 rounded font-bold text-lg hover:brightness-110 active:brightness-90">.</button>
                <button onClick={() => performOperation('=')} className="bg-orange-500 text-white rounded font-bold text-lg hover:brightness-110 active:brightness-90">=</button>
            </div>
        </div>
    );
};
