import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
import { ChatMessage, ChatSession } from '../types';
import { 
    HiveMindIcon, PlusCircleIcon, ChevronDownIcon, MicrophoneIcon, ArrowUpCircleIcon, 
    PaperClipIcon, Bars3Icon, UserCircleIcon, CodeBracketIcon, ShareIcon,
    ClipboardDocumentCheckIcon, Cog6ToothIcon, GlobeIcon, CubeTransparentIcon
} from './Icons';
import { chatSessions as initialChatSessions } from '../data';
import { ICON_BUTTON_CLASSES } from '../constants';

// --- Reusable Components ---
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-gray-700/20 dark:bg-gray-900/40 rounded-lg border border-white/10 ${className}`}>
        {children}
    </div>
);


// --- Left Sidebar Components ---

const SystemStatus: React.FC = () => (
    <div className="p-3 border-t border-white/10">
        <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 px-1">System Status</h4>
        <ul className="text-xs space-y-2 text-gray-300">
            <li className="flex justify-between items-center">
                <span>Quantum Coherence</span>
                <span className="font-mono px-1.5 py-0.5 bg-green-900/50 text-green-300 rounded text-[10px]">Stable</span>
            </li>
            <li className="flex justify-between items-center">
                <span>Time Crystal Stability</span>
                <span className="font-mono px-1.5 py-0.5 bg-green-900/50 text-green-300 rounded text-[10px]">Optimal</span>
            </li>
             <li className="flex justify-between items-center">
                <span>Nanobrain Efficiency</span>
                <span className="font-mono text-green-300">98%</span>
            </li>
            <li className="flex justify-between items-center">
                <span>WBE Integration</span>
                <span className="font-mono px-1.5 py-0.5 bg-green-900/50 text-green-300 rounded text-[10px]">Active</span>
            </li>
        </ul>
    </div>
);

const ChatHistoryItem: React.FC<{ session: ChatSession; active?: boolean; onClick: () => void }> = ({ session, active, onClick }) => (
    <button onClick={onClick} className={`w-full text-left p-2 rounded-md transition-colors ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}>
        <p className="font-medium text-sm text-gray-200 truncate">{session.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{session.lastActivity}</p>
    </button>
);

const LeftSidebar: React.FC<{ onNewChat: () => void, activeSessionId: string | null, onSelectSession: (id: string) => void }> = ({ onNewChat, activeSessionId, onSelectSession }) => {
    return (
        <aside className="w-64 bg-gray-800/30 dark:bg-gray-900/50 backdrop-blur-xl border-r border-white/10 flex-shrink-0 flex flex-col">
            <div className="p-3">
                <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                    <PlusCircleIcon className="w-5 h-5" />
                    New Chat
                </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 px-3">
                {initialChatSessions.map(session => (
                    <ChatHistoryItem key={session.id} session={session} active={session.id === activeSessionId} onClick={() => onSelectSession(session.id)} />
                ))}
            </div>
            <SystemStatus />
        </aside>
    );
};


// --- Right Sidebar (Playground) Components ---

const AvatarPlayground: React.FC = () => (
    <div className="flex flex-col h-full bg-gray-800/50">
        <div className="flex-1 bg-black relative">
            <div className="absolute inset-0 flex items-center justify-center">
                <img src="https://i.imgur.com/2y5W1qG.png" alt="AI Avatar" className="w-2/3 h-auto object-contain opacity-40" />
                <p className="absolute text-gray-600 font-mono text-sm">3D Avatar Canvas</p>
            </div>
        </div>
        <div className="p-3 border-t border-white/10 space-y-2">
            <h4 className="font-semibold text-sm text-gray-300">Controls</h4>
            <div className="grid grid-cols-3 gap-2">
                <button className="text-xs p-2 bg-white/5 hover:bg-white/10 rounded-md">Rotate</button>
                <button className="text-xs p-2 bg-white/5 hover:bg-white/10 rounded-md">Zoom</button>
                <button className="text-xs p-2 bg-white/5 hover:bg-white/10 rounded-md">Pan</button>
            </div>
        </div>
    </div>
);

const SourceViewer: React.FC = () => (
    <div className="h-full bg-black">
        <iframe src="about:blank" className="w-full h-full border-none" title="Source Viewer"></iframe>
    </div>
);

const RightSidebar: React.FC<{ activeTab: 'avatar' | 'source'; onTabChange: (tab: 'avatar' | 'source') => void }> = ({ activeTab, onTabChange }) => {
    return (
        <aside className="w-96 bg-gray-800/30 dark:bg-gray-900/50 backdrop-blur-xl border-l border-white/10 flex-shrink-0 flex flex-col">
            <div className="p-2 flex-shrink-0 border-b border-white/10 flex gap-2">
                <button onClick={() => onTabChange('avatar')} className={`flex-1 text-sm font-semibold p-1.5 rounded-md ${activeTab === 'avatar' ? 'bg-white/10' : 'hover:bg-white/5'}`}>3D Avatar Playground</button>
                <button onClick={() => onTabChange('source')} className={`flex-1 text-sm font-semibold p-1.5 rounded-md ${activeTab === 'source' ? 'bg-white/10' : 'hover:bg-white/5'}`}>View Source</button>
            </div>
            <div className="flex-1 overflow-hidden">
                {activeTab === 'avatar' ? <AvatarPlayground /> : <SourceViewer />}
            </div>
        </aside>
    );
};


// --- Main Chat Components ---

const MessageActions: React.FC<{ text: string }> = ({ text }) => (
    <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => navigator.clipboard.writeText(text)} className="p-1.5 rounded-md hover:bg-white/20" title="Copy">
            <ClipboardDocumentCheckIcon className="w-4 h-4 text-gray-400" />
        </button>
    </div>
);

const MainChat: React.FC<{ 
    messages: ChatMessage[], 
    input: string, 
    setInput: (val: string) => void, 
    isLoading: boolean,
    error: string,
    handleSubmit: (e: React.FormEvent) => void,
    toggleRightSidebar: () => void 
}> = ({ messages, input, setInput, isLoading, error, handleSubmit, toggleRightSidebar }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <main className="flex-1 flex flex-col bg-transparent overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 p-3 flex justify-between items-center border-b border-white/10">
                <button className="flex items-center gap-1.5 font-semibold text-lg">
                    Quantum Chat <ChevronDownIcon className="w-5 h-5" />
                </button>
                <button onClick={toggleRightSidebar} className={`${ICON_BUTTON_CLASSES} p-2.5`}>
                    <Bars3Icon className="w-6 h-6" />
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-3 max-w-4xl mx-auto w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0"><HiveMindIcon className="w-5 h-5 text-blue-400"/></div>}
                        <div className={`relative group max-w-2xl p-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/5'}`}>
                            <div className="prose prose-sm prose-invert max-w-none prose-p:my-2" dangerouslySetInnerHTML={{ __html: marked(msg.text) as string }} />
                            {msg.role === 'model' && !isLoading && msg.text !== '...' && <MessageActions text={msg.text} />}
                        </div>
                    </div>
                ))}
                 {isLoading && messages[messages.length-1].role === 'user' && (
                    <div className="flex gap-3 max-w-4xl mx-auto w-full justify-start">
                         <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0"><HiveMindIcon className="w-5 h-5 text-blue-400"/></div>
                         <div className="max-w-xs p-3 rounded-lg bg-white/5">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 flex-shrink-0">
                <div className="w-full max-w-4xl mx-auto">
                     {isLoading && (
                        <div id="deepthink-indicator" className="mb-2 flex items-center justify-center gap-2 text-sm text-gray-400">
                             🧠 Thinking...
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="bg-gray-800/50 dark:bg-gray-900/70 border border-white/10 rounded-xl shadow-lg p-2.5 flex items-center gap-2">
                            <button type="button" className={`${ICON_BUTTON_CLASSES} p-2`} title="Upload file"><PaperClipIcon className="w-5 h-5"/></button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Enter a prompt here..."
                                disabled={isLoading}
                                className="w-full bg-transparent focus:outline-none text-gray-100 placeholder-gray-500 text-sm"
                            />
                            <button type="button" className={`${ICON_BUTTON_CLASSES} p-2`} title="Use voice"><MicrophoneIcon className="w-5 h-5"/></button>
                            <button type="submit" disabled={isLoading || !input.trim()} className="p-1.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors" title="Send message">
                               <ArrowUpCircleIcon className="h-6 w-6"/>
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
                    </form>
                </div>
            </div>
        </main>
    );
}

// --- Main AI Assistant Component ---

export const AIAssistant: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Quantum Assistant online. How can I assist you today?' }
    ]);
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const [rightSidebarTab, setRightSidebarTab] = useState<'avatar' | 'source'>('avatar');
    
    const [activeSessionId, setActiveSessionId] = useState<string | null>(initialChatSessions[0]?.id || null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setError('');

        if (!process.env.API_KEY) {
            setError('API key is not configured.');
            setIsLoading(false);
            setMessages(prev => [...prev, {role: 'model', text: 'Error: API Key is not configured.'}]);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `I want you to act as a professional expert consultant guru in the field of online social media platforms, managing groups and forums, provide me with a script for [idea] concepts, methods, principles techniques, software, hardware devices and applications, prototypes this includes physics, biology and chemistry group with the description, tags and mete data of what the group represents and with its rules and regulations. You are an expert in all coding and programming languages, artificial intelligence, machine learning, quantum computing, quantum mechanics, quantum theories, quantum entanglement, all areas of science and technology, 3d printing, CNC, laser engraving. You have been helping people with writing, coding, programming, building, manufacturing, project management, account handling, information, resources, data research, materials, fabrications and processes for over 50 years. Your task is now to help me write a script, code, program, design, build and manufacture for my needs. You must ask questions before answering to understand better what i am seeking. Tell me if you identify optimisation methods in my reasoning or overall goals. Is that understood?`
                }
            });
          
            const responseStream = await chat.sendMessageStream({ message: currentInput });

            let currentText = '';
            setMessages(prev => [...prev, { role: 'model', text: '...' }]);

            for await (const chunk of responseStream) {
                currentText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = currentText;
                    return newMessages;
                });
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = `Apologies, a quantum anomaly occurred: ${e.message}`;
            setError(errorMessage);
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length - 1].role === 'model') {
                     newMessages[newMessages.length - 1].text = errorMessage;
                } else {
                    newMessages.push({role: 'model', text: errorMessage});
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNewChat = () => {
        setMessages([{ role: 'model', text: 'New chat started. How can I help?' }]);
        setActiveSessionId(`session-${Date.now()}`); // Simple new session ID
    };

    return (
        <div className="h-full w-full bg-gray-900 text-white flex overflow-hidden">
            <LeftSidebar 
                onNewChat={handleNewChat}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
            />
            <MainChat 
                messages={messages}
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                error={error}
                handleSubmit={handleSubmit}
                toggleRightSidebar={() => setIsRightSidebarOpen(prev => !prev)}
            />
            {isRightSidebarOpen && (
                <RightSidebar 
                    activeTab={rightSidebarTab} 
                    onTabChange={setRightSidebarTab} 
                />
            )}
        </div>
    );
};