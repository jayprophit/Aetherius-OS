
import React, { useState, useRef, useEffect } from 'react';
import { 
    FolderIcon, DocumentTextIcon, Cog6ToothIcon, SearchIcon, 
    PlayIcon, CodeBracketIcon, CommandLineIcon, ArrowPathIcon,
    TrashIcon
} from './Icons';

const FileTreeItem: React.FC<{ name: string, indent: number, isFolder?: boolean, active?: boolean, onClick?: () => void }> = ({ name, indent, isFolder, active, onClick }) => (
    <div 
        onClick={onClick}
        className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-gray-800 ${active ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
        style={{ paddingLeft: `${indent * 12 + 8}px` }}
    >
        {isFolder ? <FolderIcon className="w-4 h-4 text-blue-400" /> : <CodeBracketIcon className="w-4 h-4 text-yellow-500" />}
        <span className="text-xs font-mono truncate">{name}</span>
    </div>
);

export const CodeIDE: React.FC = () => {
    const [activeFile, setActiveFile] = useState('App.tsx');
    const [code, setCode] = useState(`import React from 'react';
import { AetherCore } from '@aetherius/core';

// Main Application Entry Point
export const App = () => {
    const system = AetherCore.init();
    console.log("System Initialized");
    
    return (
        <div className="quantum-container">
            <h1>Hello World</h1>
            <AetherCore.Visualizer />
        </div>
    );
};`);
    const [terminalOutput, setTerminalOutput] = useState<string[]>([
        'Aetherius IDE v1.2.0',
        'Connected to Local Kernel...',
        'Ready.'
    ]);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalOutput]);

    const handleRun = () => {
        setTerminalOutput(prev => [...prev, `> ts-node ${activeFile}...`]);
        
        // Simple simulation of execution
        setTimeout(() => {
            const newLogs = [];
            // Basic parsing for console.log
            const logMatches = code.matchAll(/console\.log\((?:["'])(.*?)(?:["'])\)/g);
            for (const match of logMatches) {
                newLogs.push(match[1]);
            }

            if (newLogs.length === 0 && code.trim().length > 0) {
                 newLogs.push("Compiled successfully.");
                 newLogs.push("No output detected.");
            } else if (newLogs.length > 0) {
                 newLogs.push("Process exited with code 0");
            }

            setTerminalOutput(prev => [...prev, ...newLogs]);
        }, 500);
    };

    const clearTerminal = () => {
        setTerminalOutput(['> Terminal cleared']);
    }

    return (
        <div className="flex h-full bg-[#1e1e1e] text-gray-300 font-sans overflow-hidden">
            {/* Activity Bar */}
            <aside className="w-12 bg-[#333333] flex flex-col items-center py-3 gap-4 shrink-0">
                <DocumentTextIcon className="w-6 h-6 text-white cursor-pointer" />
                <SearchIcon className="w-6 h-6 text-gray-500 hover:text-white cursor-pointer" />
                <CommandLineIcon className="w-6 h-6 text-gray-500 hover:text-white cursor-pointer" />
                <div className="mt-auto">
                    <Cog6ToothIcon className="w-6 h-6 text-gray-500 hover:text-white cursor-pointer" />
                </div>
            </aside>

            {/* Sidebar */}
            <aside className="w-60 bg-[#252526] flex flex-col border-r border-[#1e1e1e]">
                <div className="h-9 px-4 flex items-center text-xs font-bold uppercase tracking-wider text-gray-400">Explorer</div>
                <div className="flex-1 overflow-y-auto">
                    <div className="px-2 py-1 text-xs font-bold text-blue-400">AETHERIUS-PROJECT</div>
                    <FileTreeItem name="src" indent={0} isFolder />
                    <FileTreeItem name="components" indent={1} isFolder />
                    <FileTreeItem name="App.tsx" indent={2} active={activeFile === 'App.tsx'} onClick={() => setActiveFile('App.tsx')} />
                    <FileTreeItem name="index.css" indent={2} onClick={() => setActiveFile('index.css')} />
                    <FileTreeItem name="utils" indent={1} isFolder />
                    <FileTreeItem name="package.json" indent={0} onClick={() => setActiveFile('package.json')} />
                    <FileTreeItem name="tsconfig.json" indent={0} onClick={() => setActiveFile('tsconfig.json')} />
                </div>
            </aside>

            {/* Main Editor */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Tab Bar & Actions */}
                <div className="flex items-center justify-between bg-[#252526] pr-2">
                    <div className="flex">
                        <div className="px-4 py-2 bg-[#1e1e1e] text-white text-xs border-t-2 border-blue-500 flex items-center gap-2 pr-8">
                            <CodeBracketIcon className="w-3 h-3 text-yellow-500" /> {activeFile}
                            <span className="hover:bg-gray-700 rounded-full p-0.5 cursor-pointer ml-2">×</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleRun}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                    >
                        <PlayIcon className="w-3 h-3" /> Run
                    </button>
                </div>
                
                {/* Code Area */}
                <div className="flex-1 relative">
                    <textarea 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 outline-none resize-none"
                        spellCheck="false"
                    />
                </div>

                {/* Terminal */}
                <div className="h-48 bg-[#1e1e1e] border-t border-[#333333] flex flex-col">
                    <div className="flex justify-between px-4 py-1 border-b border-[#333333]">
                        <div className="flex gap-4 text-xs text-gray-400">
                            <span className="text-white border-b border-white cursor-pointer">TERMINAL</span>
                            <span className="cursor-pointer hover:text-white">OUTPUT</span>
                            <span className="cursor-pointer hover:text-white">DEBUG CONSOLE</span>
                        </div>
                        <button onClick={clearTerminal} title="Clear Terminal">
                            <TrashIcon className="w-3 h-3 text-gray-500 hover:text-white"/>
                        </button>
                    </div>
                    <div className="flex-1 p-2 font-mono text-xs overflow-y-auto text-gray-300">
                        {terminalOutput.map((line, i) => (
                            <div key={i} className="mb-1">{line}</div>
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                </div>
            </main>
        </div>
    );
};
