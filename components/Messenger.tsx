import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChatSession, User, ChatMessage } from '../types';
import { messengerSessions, loggedInUser, messengerUsers } from '../data';
import { ICON_BUTTON_CLASSES } from '../constants';
import { SearchIcon, UserCircleIcon, PhoneIcon, VideoIcon, EllipsisHorizontalIcon, PaperClipIcon, EmojiIcon, ArrowUpCircleIcon, PlusCircleIcon } from './Icons';

const ConversationListItem: React.FC<{ session: ChatSession; isActive: boolean; onClick: () => void; }> = ({ session, isActive, onClick }) => {
    const otherUser = session.members?.find(m => m.id !== loggedInUser.id);
    const lastMessage = session.messages[session.messages.length - 1];

    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-3 flex items-center gap-3 rounded-lg transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
        >
            <div className="relative flex-shrink-0">
                <img src={otherUser?.avatarUrl || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=random`} alt={otherUser?.name} className="w-12 h-12 rounded-full object-cover" />
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800"></span>
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline">
                    <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{otherUser?.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{session.lastActivity}</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{lastMessage.text}</p>
            </div>
        </button>
    );
};

const MessageBubble: React.FC<{ message: ChatMessage; sender: User; isOwn: boolean; }> = ({ message, sender, isOwn }) => {
    return (
        <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {!isOwn && (
                <img src={sender.avatarUrl || `https://ui-avatars.com/api/?name=${sender.name}&background=random`} alt={sender.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            )}
            <div className={`max-w-md p-3 rounded-2xl ${isOwn ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-none'}`}>
                <p className="text-sm">{message.text}</p>
            </div>
        </div>
    );
};


export const Messenger: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>(messengerSessions);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(messengerSessions[0]?.id || null);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
    const otherUser = useMemo(() => activeSession?.members?.find(m => m.id !== loggedInUser.id), [activeSession]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeSession?.messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeSessionId) return;

        const message: ChatMessage = {
            role: 'user',
            text: newMessage,
        };

        setSessions(prevSessions => prevSessions.map(session => 
            session.id === activeSessionId
                ? { ...session, messages: [...session.messages, message], lastActivity: 'Just now' }
                : session
        ));
        setNewMessage('');
    };
    
    return (
        <div className="flex h-full animate-fade-in bg-gray-50 dark:bg-gray-900/50">
            {/* Sidebar */}
            <aside className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col p-4">
                <header className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Messenger</h1>
                    <div className="relative mt-2">
                        <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Search messages or users" className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-full h-9 pl-10 pr-4 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {sessions.map(session => (
                        <ConversationListItem
                            key={session.id}
                            session={session}
                            isActive={session.id === activeSessionId}
                            onClick={() => setActiveSessionId(session.id)}
                        />
                    ))}
                </div>
            </aside>
            
            {/* Main Chat Area */}
             <main className="flex-1 flex flex-col">
                {activeSession && otherUser ? (
                    <>
                        <header className="flex-shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <img src={otherUser.avatarUrl || `https://ui-avatars.com/api/?name=${otherUser.name}&background=random`} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <h2 className="font-bold text-gray-800 dark:text-gray-100">{otherUser.name}</h2>
                                    <p className="text-xs text-green-500">Online</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-2">
                                <button className={ICON_BUTTON_CLASSES}><PhoneIcon className="w-5 h-5" /></button>
                                <button className={ICON_BUTTON_CLASSES}><VideoIcon className="w-5 h-5" /></button>
                                <button className={ICON_BUTTON_CLASSES}><EllipsisHorizontalIcon className="w-5 h-5" /></button>
                             </div>
                        </header>
                        
                        <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-4">
                            {activeSession.messages.map((msg, index) => {
                                const isOwn = msg.role === 'user';
                                const sender = isOwn ? loggedInUser : messengerUsers[otherUser.id];
                                return (
                                    <MessageBubble key={index} message={msg} sender={sender} isOwn={isOwn} />
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
                            <form onSubmit={handleSendMessage} className="w-full max-w-4xl mx-auto">
                                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all p-2 gap-2">
                                    <button type="button" className={ICON_BUTTON_CLASSES}><PlusCircleIcon className="w-6 h-6"/></button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={`Message ${otherUser.name}...`}
                                        className="w-full bg-transparent px-2 focus:outline-none text-gray-800 dark:text-gray-200 text-sm resize-none"
                                    />
                                    <button type="button" className={ICON_BUTTON_CLASSES}><PaperClipIcon className="w-5 h-5"/></button>
                                    <button type="button" className={ICON_BUTTON_CLASSES}><EmojiIcon className="w-5 h-5"/></button>
                                    <button type="submit" disabled={!newMessage.trim()} className="p-1.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                                        <ArrowUpCircleIcon className="h-6 w-6"/>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                        <p>Select a conversation to start messaging.</p>
                    </div>
                )}
            </main>
        </div>
    );
};
