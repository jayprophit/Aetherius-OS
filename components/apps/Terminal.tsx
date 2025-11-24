
import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '../Icons';

interface TerminalLine {
    type: 'input' | 'output' | 'system';
    content: string;
    user?: string;
    path?: string;
}

export const Terminal: React.FC = () => {
    const [lines, setLines] = useState<TerminalLine[]>([
        { type: 'system', content: 'Aetherius OS Kernel v1.0.4-stable' },
        { type: 'system', content: 'Type "help" for a list of available commands.' },
    ]);
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const endRef = useRef<HTMLDivElement>(null);

    const user = 'admin';
    const hostname = 'aetherius';
    const path = '~';

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    const handleCommand = (cmd: string) => {
        const trimmed = cmd.trim();
        const args = trimmed.split(' ');
        const command = args[0].toLowerCase();

        let response: string | string[] = '';

        switch (command) {
            case 'help':
                response = [
                    'Available commands:',
                    '  help      - Show this help message',
                    '  clear     - Clear terminal output',
                    '  ls        - List directory contents',
                    '  whoami    - Display current user',
                    '  date      - Display current date/time',
                    '  echo      - Display a line of text',
                    '  neofetch  - Display system information',
                    '  reboot    - Simulate system reboot'
                ].join('\n');
                break;
            case 'clear':
                setLines([]);
                return;
            case 'ls':
                response = 'Documents  Downloads  Music  Pictures  Videos  System  root';
                break;
            case 'whoami':
                response = user;
                break;
            case 'date':
                response = new Date().toString();
                break;
            case 'echo':
                response = args.slice(1).join(' ');
                break;
            case 'reboot':
                response = 'System reboot initiated... (Simulation)';
                break;
            case 'neofetch':
                response = [
                    '       .---.',
                    '      /     \\      user@aetherius',
                    '      |  A  |      --------------',
                    '      \\     /      OS: Aetherius OS x86_64',
                    '       \'---\'       Kernel: 5.15.0-76-generic',
                    '                       Uptime: 42 mins',
                    '                       Packages: 1402 (dpkg)',
                    '                       Shell: zsh 5.8.1',
                    '                       CPU: Virtual Quantum Core (16) @ 4.5GHz',
                    '                       Memory: 4096MiB / 16384MiB',
                ].join('\n');
                break;
            case '':
                break;
            default:
                response = `Command not found: ${command}`;
        }

        if (response) {
            setLines(prev => [...prev, { type: 'output', content: response as string }]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setLines(prev => [...prev, { type: 'input', content: input, user, path }]);
            handleCommand(input);
            setInput('');
        }
    };

    return (
        <div 
            className="h-full bg-[#1e1e1e] text-gray-200 font-mono text-sm p-2 overflow-hidden flex flex-col"
            onClick={() => inputRef.current?.focus()}
        >
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {lines.map((line, idx) => (
                    <div key={idx} className="break-words whitespace-pre-wrap">
                        {line.type === 'input' && (
                            <span className="mr-2">
                                <span className="text-green-400">{line.user}@{hostname}</span>
                                <span className="text-white">:</span>
                                <span className="text-blue-400">{line.path}</span>
                                <span className="text-white">$</span>
                            </span>
                        )}
                        <span className={line.type === 'system' ? 'text-gray-500' : 'text-gray-200'}>
                            {line.content}
                        </span>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <div className="flex items-center p-2">
                <span className="text-green-400 mr-0.5">{user}@{hostname}</span>
                <span className="text-white mr-0.5">:</span>
                <span className="text-blue-400 mr-2">{path}$</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent outline-none border-none text-gray-200"
                    autoFocus
                />
            </div>
        </div>
    );
};
