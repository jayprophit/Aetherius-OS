
import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { ChatMessage, LaunchableApp } from '../types';
import { 
    HiveMindIcon, PlusCircleIcon, ChevronDownIcon, MicrophoneIcon, ArrowUpCircleIcon, 
    PaperClipIcon, Bars3Icon, CpuChipIcon, SparklesIcon, UsersIcon, DnaIcon, CircleStackIcon,
    ServerIcon, PlayIcon, StopIcon, UserCircleIcon, BoltIcon
} from './Icons';
import { loggedInUser } from '../data';
import { Kernel } from '../services/AetheriusKernel';

// --- Child Components ---

const CapabilityButton: React.FC<{ 
    icon: React.FC<any>; 
    label: string; 
    subLabel: string; 
    color: string; 
    onClick: () => void; 
}> = ({ icon: Icon, label, subLabel, color, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-xl border bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/80 transition-all duration-300 group w-full text-left border-gray-700 hover:${color.replace('text-', 'border-')}`}
    >
        <div className={`p-2 rounded-lg bg-gray-900 group-hover:scale-110 transition-transform ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <div className="font-bold text-gray-200 text-sm group-hover:text-white">{label}</div>
            <div className="text-[10px] text-gray-500 group-hover:text-gray-300 uppercase tracking-wider">{subLabel}</div>
        </div>
    </button>
);

const SystemVital: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="flex flex-col items-center">
        <div className={`text-xs font-bold ${color}`}>{value}</div>
        <div className="text-[9px] text-gray-500 uppercase">{label}</div>
    </div>
);

// --- Main Component ---

interface AIAssistantProps {
    launchApp: (app: LaunchableApp) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ launchApp }) => {
    const identity = loggedInUser.systemIdentity;
    const buildType = identity?.buildType || 'Grandchild';
    
    const aiDisplayName = buildType === 'Genesis' 
        ? (identity?.aiCoreName || 'Genesis Core') 
        : (identity?.aiNickname || identity?.aiCoreName || 'Aether');
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Avatar Animation State
    const [avatarState, setAvatarState] = useState<'Idle' | 'Listening' | 'Processing' | 'Speaking'>('Idle');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Initialize with dynamic greeting
    useEffect(() => {
        const greeting = Kernel.getDynamicGreeting(loggedInUser);
        setMessages([{ role: 'model', text: greeting }]);
    }, []);

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setAvatarState('Processing');

        try {
            // Use the Local Kernel Service
            const responseStream = await Kernel.processInput(currentInput, {
                user: loggedInUser
            });

            let currentText = '';
            setMessages(prev => [...prev, { role: 'model', text: '...' }]);
            setAvatarState('Speaking');

            for await (const chunk of responseStream) {
                currentText = chunk;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = currentText;
                    return newMessages;
                });
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = `Kernel Panic: ${e.message}`;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text = errorMessage;
                return newMessages;
            });
        } finally {
            setIsLoading(false);
            setAvatarState('Idle');
        }
    };

    // Launch Helpers
    const openWorkforce = () => launchApp({ component: 'aiWorkforce', title: 'Workforce Orchestrator', icon: UsersIcon });
    const openMemory = () => launchApp({ component: 'memoryNode', title: 'Memory Node', icon: CircleStackIcon });
    const openCloning = () => launchApp({ component: 'avatarForge', title: 'Avatar Forge', icon: UserCircleIcon });
    const openArchitecture = () => launchApp({ component: 'systemArchitecture', title: 'System Architecture', icon: ServerIcon });

    const headerTitle = buildType === 'Genesis' ? 'GENESIS CORE' : `${aiDisplayName.toUpperCase()} (PERSONAL AI)`;
    const subTitle = buildType === 'Genesis' ? 'Parent Intelligence System' : 'Grandchild Node :: Master AI';

    return (
        <div className="h-full w-full bg-black text-white flex flex-col overflow-hidden relative font-sans">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full filter blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>

            {/* Top Bar: Identification & Vitals */}
            <header className="flex justify-between items-center p-4 border-b border-white/10 bg-black/40 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/50">
                        <HiveMindIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-wide text-blue-100">MASTER AI <span className="text-blue-500">::</span> {headerTitle}</h1>
                        <p className="text-[10px] text-blue-400/60 font-mono uppercase tracking-widest">{subTitle}</p>
                    </div>
                </div>
                <div className="flex gap-6">
                    <SystemVital label="Quantum State" value="COHERENT" color="text-green-400" />
                    <SystemVital label="Sub-Agents" value="STANDBY" color="text-yellow-400" />
                    <SystemVital label="Memory Core" value="SYNCED" color="text-purple-400" />
                </div>
            </header>

            {/* Main Stage */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-0">
                
                {/* Left Panel: Capabilities */}
                <aside className="w-full lg:w-72 p-4 flex flex-col gap-3 bg-gradient-to-r from-black/80 to-transparent z-10 overflow-y-auto">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Unified Capabilities</div>
                    <CapabilityButton 
                        icon={UsersIcon} 
                        label="Deploy Workforce" 
                        subLabel="Manage Worker Agents" 
                        color="text-green-400" 
                        onClick={openWorkforce} 
                    />
                    <CapabilityButton 
                        icon={DnaIcon} 
                        label="Clone Identity" 
                        subLabel="Digital Replica Forge" 
                        color="text-purple-400" 
                        onClick={openCloning} 
                    />
                    <CapabilityButton 
                        icon={CircleStackIcon} 
                        label="Personal Memory" 
                        subLabel="Access Local Vector Store" 
                        color="text-yellow-400" 
                        onClick={openMemory} 
                    />
                     <CapabilityButton 
                        icon={ServerIcon} 
                        label="System Oversight" 
                        subLabel="Manage Node Architecture" 
                        color="text-blue-400" 
                        onClick={openArchitecture} 
                    />
                </aside>

                {/* Center: 3D Avatar Visualizer */}
                <section className="flex-1 relative flex items-center justify-center">
                    {/* Avatar Container */}
                    <div className="relative w-full h-full max-w-2xl flex items-center justify-center">
                        {/* Rings */}
                        <div className={`absolute inset-0 border border-blue-500/20 rounded-full scale-75 ${avatarState === 'Processing' ? 'animate-ping' : ''}`}></div>
                        <div className="absolute inset-0 border border-cyan-500/10 rounded-full scale-90 animate-spin-slow" style={{ animationDuration: '20s' }}></div>
                        
                        {/* The Avatar Image/Model */}
                        <div className="relative z-10 w-64 h-64 md:w-96 md:h-96 transition-all duration-500">
                            <img 
                                src="https://i.imgur.com/2y5W1qG.png" 
                                alt="AI Avatar" 
                                className={`w-full h-full object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300 ${avatarState === 'Speaking' ? 'scale-105 brightness-125' : 'opacity-90'}`} 
                            />
                            {/* Holographic scanlines */}
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,100,255,0.1)_50%)] bg-[length:10px_10px] pointer-events-none opacity-30"></div>
                        </div>

                        {/* Status Indicator */}
                        <div className="absolute bottom-10 flex items-center gap-2 bg-black/60 px-4 py-1 rounded-full border border-blue-500/30 backdrop-blur-md">
                             <div className={`w-2 h-2 rounded-full ${avatarState === 'Idle' ? 'bg-gray-500' : avatarState === 'Processing' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-ping'}`}></div>
                             <span className="text-xs font-mono text-blue-200">{avatarState.toUpperCase()} MODE</span>
                        </div>
                    </div>
                </section>

                {/* Right/Bottom: Neural Interface (Chat) */}
                <section className="w-full lg:w-[400px] bg-gray-900/80 border-l border-white/10 flex flex-col backdrop-blur-xl">
                    <div className="p-3 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase">Neural Command Interface</span>
                        <Bars3Icon className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white" />
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-blue-600'}`}>
                                    {msg.role === 'user' ? <div className="w-4 h-4 bg-gray-400 rounded-full"/> : <SparklesIcon className="w-5 h-5 text-white"/>}
                                </div>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-gray-800 text-white rounded-tr-none' : 'bg-blue-900/30 border border-blue-500/30 text-blue-100 rounded-tl-none'}`}>
                                    <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(msg.text) as string }} />
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                     <SparklesIcon className="w-5 h-5 text-white"/>
                                </div>
                                <div className="p-3 rounded-2xl rounded-tl-none bg-blue-900/30 border border-blue-500/30 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-black/40 border-t border-white/10">
                        <form onSubmit={handleSubmit} className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Command ${aiDisplayName}...`}
                                className="w-full bg-gray-800/50 border border-gray-600 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
                                disabled={isLoading}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button type="button" className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"><MicrophoneIcon className="w-4 h-4"/></button>
                                <button type="submit" disabled={!input.trim() || isLoading} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    <ArrowUpCircleIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
};
