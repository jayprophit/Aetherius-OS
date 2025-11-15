import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, ChatSession } from '../types';
import { 
    PlusIcon, UserCircleIcon, EllipsisHorizontalIcon, HiveMindIcon,
    MicrophoneIcon, ArrowUpCircleIcon, ClipboardDocumentCheckIcon, ShareIcon
} from './Icons';
import { marked } from 'marked';
import { chatSessions as initialChatSessions } from '../data';
import { ICON_BUTTON_CLASSES } from '../constants';

const ChatHistoryItem: React.FC<{ session: ChatSession; active?: boolean; onClick: () => void }> = ({ session, active, onClick }) => (
    <button onClick={onClick} className={`w-full text-left p-3 rounded-lg transition-colors ${active ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{session.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{session.lastActivity}</p>
    </button>
);


const ModelAvatar: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-gray-800 dark:bg-gray-900 flex items-center justify-center flex-shrink-0">
        <HiveMindIcon className="w-5 h-5 text-white"/>
    </div>
);

const UserAvatar: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
        <UserCircleIcon className="w-7 h-7 text-gray-500 dark:text-gray-400"/>
    </div>
);

const MessageActions: React.FC<{ text: string }> = ({ text }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
    };
    const handleShare = () => {
        alert('Sharing is not implemented yet.');
    };
    return (
        <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-600/50 flex items-center gap-1 opacity-70">
            <button onClick={handleCopy} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600" title="Copy">
                <ClipboardDocumentCheckIcon className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={handleShare} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600" title="Share">
                <ShareIcon className="w-4 h-4 text-gray-500" />
            </button>
        </div>
    );
};

export const AiChatView: React.FC = () => {
    const [chatSessionsData, setChatSessionsData] = useState<ChatSession[]>(initialChatSessions.filter(s => s.type === 'individual'));
    const [activeSessionId, setActiveSessionId] = useState<string | null>(chatSessionsData[0]?.id || null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatSessionsData, activeSessionId]);

    const activeSession = useMemo(() => {
        return chatSessionsData.find(s => s.id === activeSessionId);
    }, [activeSessionId, chatSessionsData]);
    
    const createNewChat = () => {
        const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            title: 'New Conversation',
            type: 'individual',
            messages: [
                { role: 'model', text: 'Hello! How can I assist you today?' }
            ],
            lastActivity: 'Just now'
        };
        setChatSessionsData(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !activeSessionId) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        
        setChatSessionsData(prevSessions =>
            prevSessions.map(session =>
                session.id === activeSessionId
                    ? { ...session, messages: [...session.messages, userMessage] }
                    : session
            )
        );

        const currentInput = input;
        setInput('');
        setIsLoading(true);

        if (!process.env.API_KEY) {
            const errorMsg: ChatMessage = { role: 'model', text: 'Error: API Key is not configured.' };
             setChatSessionsData(prevSessions =>
                prevSessions.map(session =>
                    session.id === activeSessionId
                        ? { ...session, messages: [...session.messages, errorMsg] }
                        : session
                )
            );
            setIsLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: 'You are a helpful AI assistant. Format responses in Markdown.' }
            });
          
            const responseStream = await chat.sendMessageStream({ message: currentInput });
            
            let currentText = '';
            setChatSessionsData(prevSessions => {
                const modelMessage: ChatMessage = { role: 'model', text: '' };
                return prevSessions.map(session =>
                    session.id === activeSessionId
                        ? { ...session, messages: [...session.messages, modelMessage] }
                        : session
                );
            });

            for await (const chunk of responseStream) {
                currentText += chunk.text;
                setChatSessionsData(prevSessions => {
                    return prevSessions.map(session => {
                        if (session.id === activeSessionId) {
                            const newMessages = [...session.messages];
                            newMessages[newMessages.length - 1].text = currentText;
                            return { ...session, messages: newMessages };
                        }
                        return session;
                    });
                });
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage: ChatMessage = { role: 'model', text: `Apologies, an anomaly occurred: ${e.message}` };
            setChatSessionsData(prevSessions =>
                prevSessions.map(session =>
                    session.id === activeSessionId
                        ? { ...session, messages: [...session.messages, errorMessage] }
                        : session
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-full animate-fade-in bg-gray-50 dark:bg-gray-900/50">
            {/* Sidebar */}
            <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col p-3">
                <button onClick={createNewChat} className="flex items-center justify-center w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-500 mb-4 text-sm transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Chat
                </button>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    <h3 className="px-2 text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider mb-1">History</h3>
                    {chatSessionsData.map(session => (
                        <ChatHistoryItem key={session.id} session={session} active={session.id === activeSessionId} onClick={() => setActiveSessionId(session.id)} />
                    ))}
                </div>
            </aside>
            
            {/* Main Chat Area */}
             <main className="flex-1 flex flex-col">
                <header className="flex-shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-100">{activeSession?.title || "AI Chat"}</h2>
                    <button className={ICON_BUTTON_CLASSES} title="More options">
                        <EllipsisHorizontalIcon className="w-5 h-5"/>
                    </button>
                </header>
                
                <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-6">
                    {activeSession?.messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 max-w-4xl mx-auto w-full`}>
                           {msg.role === 'model' && <ModelAvatar />}
                            <div className={`max-w-2xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-gray-800 text-white ml-auto' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'}`}>
                                <div 
                                    className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3" 
                                    dangerouslySetInnerHTML={{ __html: marked(msg.text) as string }} 
                                />
                                {msg.role === 'model' && msg.text && !isLoading && <MessageActions text={msg.text} />}
                            </div>
                            {msg.role === 'user' && <UserAvatar />}
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-start gap-3 max-w-4xl mx-auto w-full justify-start">
                            <ModelAvatar />
                            <div className="max-w-xs p-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
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

                <div className="p-4 flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="w-full max-w-4xl mx-auto">
                        <form onSubmit={handleSubmit}>
                            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all p-2 gap-2">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { handleSubmit(e as any); e.preventDefault(); } }}
                                    placeholder={`Message ${activeSession?.title}...`}
                                    disabled={isLoading}
                                    rows={1}
                                    className="w-full bg-transparent px-2 focus:outline-none text-gray-800 dark:text-gray-200 text-sm resize-none"
                                />
                                <button type="button" className={ICON_BUTTON_CLASSES} title="Use voice input">
                                    <MicrophoneIcon className="w-5 h-5" />
                                </button>
                                <button type="submit" disabled={isLoading || !input.trim()} className="p-1.5 text-white bg-gray-800 dark:bg-gray-200 dark:text-gray-800 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity" title="Send message">
                                   <ArrowUpCircleIcon className="h-6 w-6"/>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};