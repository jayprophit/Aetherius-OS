

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type, Tool, FunctionDeclaration, createPartFromFunctionResponse } from '@google/genai';
import { ChatMessage, ChatSession } from '../types';
import { chatWithLocalModel, type LocalChatMessage } from '../src/ai/localClient';
import { getPreferredProvider, getRuntimeGeminiKey } from '../src/ai/runtimeCredentials';
import { 
    PlusIcon, UserCircleIcon, EllipsisHorizontalIcon, HiveMindIcon,
    MicrophoneIcon, ArrowUpCircleIcon, ClipboardDocumentCheckIcon, ShareIcon,
    TrashIcon, SparklesIcon
} from './Icons';
import { marked } from 'marked';
import { chatSessions as initialChatSessions } from '../data';
import { ICON_BUTTON_CLASSES } from '../constants';

const ChatHistoryItem: React.FC<{ session: ChatSession; active?: boolean; onClick: () => void; onDelete: (e: React.MouseEvent) => void }> = ({ session, active, onClick, onDelete }) => (
    <div 
        onClick={onClick} 
        className={`group w-full text-left p-3 rounded-lg transition-colors cursor-pointer relative ${active ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
    >
        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate pr-6">{session.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{session.lastActivity}</p>
        <button 
            onClick={onDelete}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete Chat"
        >
            <TrashIcon className="w-4 h-4" />
        </button>
    </div>
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
        // Placeholder for share functionality
        alert('Sharing functionality coming soon.');
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

// --- Tool Definitions ---
const tools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "get_current_weather",
                description: "Get the current weather in a given location",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        location: { type: Type.STRING, description: "The city and state, e.g. San Francisco, CA" },
                    },
                    required: ["location"],
                },
            },
            {
                name: "calculateSum",
                description: "Calculates the sum of two numbers. Use this whenever a user asks for a math calculation involving addition.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        a: { type: Type.NUMBER, description: "First number" },
                        b: { type: Type.NUMBER, description: "Second number" },
                    },
                    required: ["a", "b"],
                },
            },
            {
                name: "get_stocks_data",
                description: "Get the stock data for a given symbol",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        symbol: { type: Type.STRING, description: "Stock symbol, e.g. AAPL" },
                    },
                    required: ["symbol"],
                },
            },
        ],
    },
];

// --- Tool Implementations ---
//
// Only calculateSum is real. Weather and market data have no configured
// provider, so they return an explicit NOT_CONFIGURED result. A demo that
// invents a temperature or a share price is worse than one that says it has
// no feed: the owner's rule is that unmeasured data is never presented as
// measured.
const executeTool = async (name: string, args: any) => {
    switch (name) {
        case "get_current_weather":
            return {
                error: "NOT_CONFIGURED",
                detail: "No live weather provider is configured. Aetherius does not invent weather data.",
            };
        case "calculateSum":
            return { result: args.a + args.b };
        case "get_stocks_data":
            return {
                error: "NOT_CONFIGURED",
                detail: "No live market-data provider is configured. Aetherius does not invent prices.",
            };
        default:
            return { error: "TOOL_NOT_FOUND" };
    }
};

export const AiChatView: React.FC = () => {
    // Initialize from LocalStorage or fallback to data.ts
    const [chatSessionsData, setChatSessionsData] = useState<ChatSession[]>(() => {
        try {
            const saved = localStorage.getItem('aetherius_chat_sessions');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error("Failed to load chats from storage:", error);
        }
        return initialChatSessions.filter(s => s.type === 'individual');
    });

    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Ensure there is at least one active session if data is empty
    useEffect(() => {
        if (chatSessionsData.length === 0) {
             createNewChat();
        } else if (!activeSessionId && chatSessionsData.length > 0) {
            setActiveSessionId(chatSessionsData[0].id);
        }
    }, [chatSessionsData.length]);

    // Persist to LocalStorage whenever sessions change
    useEffect(() => {
        localStorage.setItem('aetherius_chat_sessions', JSON.stringify(chatSessionsData));
    }, [chatSessionsData]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatSessionsData, activeSessionId, isLoading]);

    const activeSession = useMemo(() => {
        return chatSessionsData.find(s => s.id === activeSessionId);
    }, [activeSessionId, chatSessionsData]);
    
    const createNewChat = () => {
        const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            title: 'New Conversation',
            type: 'individual',
            messages: [
                { role: 'model', text: 'Hello! I am Aetherius AI. I have access to real-time tools for weather, stocks, and calculations. How can I help you?' }
            ],
            lastActivity: 'Just now'
        };
        setChatSessionsData(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
    };

    const handleDeleteChat = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this conversation?")) {
            const newSessions = chatSessionsData.filter(s => s.id !== sessionId);
            setChatSessionsData(newSessions);
            if (activeSessionId === sessionId) {
                setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !activeSessionId) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        
        // Optimistic update
        setChatSessionsData(prevSessions =>
            prevSessions.map(session =>
                session.id === activeSessionId
                    ? { ...session, messages: [...session.messages, userMessage], lastActivity: 'Now' }
                    : session
            )
        );

        // Aetherius defaults to token-free local inference. The remote path is
        // optional and only runs when the user has supplied a session-scoped
        // key at runtime. No key is compiled into this bundle.
        const apiKey = getRuntimeGeminiKey();
        const preferGemini = getPreferredProvider() === 'gemini';
        const systemInstruction =
            'You are Aetherius, a helpful and intelligent AI operating system assistant. ' +
            'Format your responses using Markdown. Be concise yet comprehensive. ' +
            'Only calculateSum is a real tool. Weather and market data have no configured ' +
            'provider: never invent a temperature, price or other unmeasured value. Say so plainly.';

        const localMessages: LocalChatMessage[] = [
            { role: 'system', content: systemInstruction },
            ...(activeSession?.messages ?? []).map((message) => ({
                role: message.role === 'model' ? ('assistant' as const) : ('user' as const),
                content: message.text,
            })),
            { role: 'user', content: currentInput },
        ];

        let responseText = "";
        let localFailure: string | null = null;

        // Local first, unless the host explicitly asked for Gemini and a key
        // is actually available.
        if (!(preferGemini && apiKey)) {
            const local = await chatWithLocalModel(localMessages, { timeoutMs: 120_000 });
            if ("error" in local) {
                localFailure = `${local.error} (${local.code})`;
            } else {
                responseText = local.text;
            }
        }

        if (!responseText && apiKey) {
            try {
                const ai = new GoogleGenAI({ apiKey });
                const chat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction,
                        tools: tools,
                    },
                });

                let result = await chat.sendMessage({ message: currentInput });

                if (result.candidates?.[0]?.content?.parts) {
                    const parts = result.candidates[0].content.parts;
                    const functionCalls = parts.filter((part) => part.functionCall);

                    if (functionCalls.length > 0) {
                        const functionResponses = await Promise.all(
                            functionCalls.map(async (call) => {
                                const fc = call.functionCall!;
                                const toolResult = await executeTool(fc.name, fc.args);
                                return createPartFromFunctionResponse(
                                    fc.id ?? fc.name,
                                    fc.name,
                                    { result: toolResult },
                                );
                            }),
                        );
                        result = await chat.sendMessage({ message: functionResponses });
                    }
                }

                responseText = result.text || "";
            } catch (e: any) {
                console.error("AI Interaction Error:", e);
                responseText =
                    `**Remote provider unavailable.** ${e?.message || "Unknown error"}. ` +
                    "The local runtime remains the default; no billing or quota decision is made for you.";
            }
        }

        if (!responseText) {
            responseText =
                "**No local model is available.**\n\n" +
                (localFailure ?? "The local Ollama runtime did not respond.") +
                "\n\nAetherius defaults to token-free local inference: no prompt is sent off this machine. " +
                "Start Ollama and install a model (for example `ollama pull qwen2.5:3b`), or supply a " +
                "session-only key for an optional remote provider. No API key is bundled into this build.";
        }

        const modelMessage: ChatMessage = { role: 'model', text: responseText };

        setChatSessionsData(prevSessions =>
            prevSessions.map(session =>
                session.id === activeSessionId
                    ? { ...session, messages: [...session.messages, modelMessage] }
                    : session
            )
        );

        // Update title if it's a new conversation
        if (activeSession?.messages.length === 1) {
            setChatSessionsData(prevSessions => prevSessions.map(s => {
                if (s.id === activeSessionId) {
                    const newTitle = currentInput.split(' ').slice(0, 5).join(' ') + (currentInput.split(' ').length > 5 ? '...' : '');
                    return { ...s, title: newTitle };
                }
                return s;
            }));
        }

        setIsLoading(false);
    };

    return (
        <div className="flex h-full animate-fade-in bg-gray-50 dark:bg-gray-900/50">
            {/* Sidebar */}
            <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col p-3 hidden md:flex">
                <button onClick={createNewChat} className="flex items-center justify-center w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-500 mb-4 text-sm transition-colors shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Chat
                </button>
                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                    <h3 className="px-2 text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider mb-2">Recent Chats</h3>
                    {chatSessionsData.map(session => (
                        <ChatHistoryItem 
                            key={session.id} 
                            session={session} 
                            active={session.id === activeSessionId} 
                            onClick={() => setActiveSessionId(session.id)} 
                            onDelete={(e) => handleDeleteChat(e, session.id)}
                        />
                    ))}
                </div>
            </aside>
            
            {/* Main Chat Area */}
             <main className="flex-1 flex flex-col relative">
                <header className="flex-shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                        <div className="md:hidden">
                             <button onClick={createNewChat} className="p-2 bg-blue-600 text-white rounded-full"><PlusIcon className="w-4 h-4"/></button>
                        </div>
                        <h2 className="font-semibold text-gray-800 dark:text-gray-100 ml-2 truncate">{activeSession?.title || "New Chat"}</h2>
                    </div>
                    <button className={ICON_BUTTON_CLASSES} title="Chat Settings">
                        <EllipsisHorizontalIcon className="w-5 h-5"/>
                    </button>
                </header>
                
                <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-6 scroll-smooth">
                    {activeSession?.messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 max-w-4xl mx-auto w-full group`}>
                           {msg.role === 'model' && <ModelAvatar />}
                            <div className={`max-w-3xl p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-gray-800 text-white ml-auto rounded-tr-sm' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-tl-sm'}`}>
                                <div 
                                    className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-p:my-1 prose-headings:my-2 prose-code:bg-black/10 dark:prose-code:bg-white/10 prose-code:rounded prose-code:px-1 prose-code:before:content-none prose-code:after:content-none"
                                    dangerouslySetInnerHTML={{ __html: marked(msg.text) as string }} 
                                />
                                {msg.role === 'model' && msg.text && !isLoading && <MessageActions text={msg.text} />}
                            </div>
                            {msg.role === 'user' && <UserAvatar />}
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-start gap-3 max-w-4xl mx-auto w-full justify-start animate-fade-in">
                            <ModelAvatar />
                            <div className="max-w-xs p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-2" />
                </div>

                <div className="p-4 flex-shrink-0 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur">
                    <div className="w-full max-w-4xl mx-auto">
                        <form onSubmit={handleSubmit}>
                            <div className="relative flex items-end bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { handleSubmit(e as any); e.preventDefault(); } }}
                                    placeholder={activeSession ? `Message ${activeSession.title}...` : "Type a message..."}
                                    disabled={isLoading}
                                    rows={1}
                                    className="w-full bg-transparent py-3 pl-4 pr-12 focus:outline-none text-gray-800 dark:text-gray-200 text-sm resize-none max-h-32 min-h-[48px]"
                                    style={{ height: 'auto', overflow: 'hidden' }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                                    }}
                                />
                                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                                    <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors" title="Use voice input">
                                        <MicrophoneIcon className="w-5 h-5" />
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isLoading || !input.trim()} 
                                        className={`p-2 rounded-full transition-all duration-200 ${input.trim() && !isLoading ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                        title="Send message"
                                    >
                                       <ArrowUpCircleIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                            </div>
                            <p className="text-center text-[10px] text-gray-400 mt-2">
                                AI can make mistakes. Review generated code and financial data.
                            </p>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};