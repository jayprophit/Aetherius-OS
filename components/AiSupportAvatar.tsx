import React, { useState, useEffect, useRef } from 'react';
import { AgentChatMessage, NotificationData, AITask } from '../types';
import { soundPlayer, SoundType } from '../utils/soundPlayer';
import { PhoneIcon, VideoIcon, MicrophoneIcon, SpeakerWaveIcon, ArrowUpCircleIcon, XMarkIcon } from './Icons';

// --- Child Components for UI ---

const NotificationBubble: React.FC<{ notification: NotificationData; onClose: () => void; }> = ({ notification, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, notification.duration || 5000);
        return () => clearTimeout(timer);
    }, [notification, onClose]);

    const iconMap = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️', processing: '⚙️' };

    return (
        <div className={`w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-xl p-4 border border-black/10 dark:border-white/10 transition-all duration-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="flex items-start">
                <span className="text-xl mr-3">{iconMap[notification.type]}</span>
                <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{notification.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{notification.message}</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                    <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
            </div>
        </div>
    );
};

const ToolStatus: React.FC<{ tasks: AITask[] }> = ({ tasks }) => {
    if (tasks.length === 0) return null;
    return (
        <div className="absolute bottom-20 left-4 bg-black/50 text-white p-3 rounded-lg text-xs w-60 backdrop-blur-sm">
            <h4 className="font-bold mb-1">AI Tasks</h4>
            {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    <span className="flex-1 truncate">{task.name}</span>
                    <span className="opacity-70">{task.status}...</span>
                </div>
            ))}
        </div>
    );
};


// --- Main Component ---

export const AiSupportAvatar: React.FC = () => {
    const [messages, setMessages] = useState<AgentChatMessage[]>([
        { id: '1', role: 'agent', content: "Hello! I'm your AI Support Avatar. I can see your screen. How can I assist you today?", timestamp: new Date().toLocaleTimeString() }
    ]);
    const [input, setInput] = useState('');
    const [tasks, setTasks] = useState<AITask[]>([]);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addNotification = (notification: Omit<NotificationData, 'id'>) => {
        const id = `notif-${Date.now()}`;
        setNotifications(prev => [...prev, { id, ...notification }]);
    };
    
    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const runTool = (name: string, sound: SoundType, duration: number, successMessage: string) => {
        const taskId = `task-${Date.now()}`;
        setTasks(prev => [...prev, { id: taskId, name, status: 'processing' }]);
        soundPlayer.play(sound);

        const systemMessage: AgentChatMessage = { id: `msg-${Date.now()}`, role: 'tool', content: `Executing RPC call: ${name}...`, timestamp: new Date().toLocaleTimeString()};
        setMessages(prev => [...prev, systemMessage]);

        setTimeout(() => {
            setTasks(prev => prev.filter(t => t.id !== taskId));
            addNotification({ type: 'success', title: 'Task Complete', message: successMessage, duration: 4000 });
            soundPlayer.play('success');
            const resultMessage: AgentChatMessage = { id: `msg-${Date.now()+1}`, role: 'system', content: `Tool '${name}' finished successfully.`, timestamp: new Date().toLocaleTimeString()};
            setMessages(prev => [...prev, resultMessage]);
        }, duration);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: AgentChatMessage = { id: `msg-${Date.now()}`, role: 'user', content: input, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Mock AI parsing and tool execution
        soundPlayer.play('thinking');
        setTimeout(() => {
            if (input.toLowerCase().includes('email')) {
                runTool('send_email', 'typing', 3000, "Email to 'client@example.com' has been sent.");
            } else if (input.toLowerCase().includes('unblock')) {
                runTool('unblock_user', 'processing', 2000, "User 'user123' has been unblocked.");
            } else if (input.toLowerCase().includes('ticket')) {
                runTool('create_support_ticket', 'typing', 2500, "Support ticket #TKT-8A4F created successfully.");
            } else if (input.toLowerCase().includes('code')) {
                runTool('generate_code', 'typing', 4000, "Python code for a web server has been generated.");
            } else if (input.toLowerCase().includes('trade')) {
                runTool('execute_trade', 'analysis', 3500, "Simulated trade for 10 AAPL shares executed.");
            } else {
                 const agentResponse: AgentChatMessage = { id: `msg-${Date.now()+1}`, role: 'agent', content: "I'm not sure how to help with that. My available tools are: send_email, unblock_user, create_support_ticket, generate_code, and execute_trade.", timestamp: new Date().toLocaleTimeString() };
                 setMessages(prev => [...prev, agentResponse]);
            }
        }, 1000);
    };

    return (
        <div className="h-full w-full bg-black text-white flex flex-col">
             {/* Notification Area */}
            <div className="absolute top-4 right-4 z-50 space-y-2">
                {notifications.map(n => <NotificationBubble key={n.id} notification={n} onClose={() => removeNotification(n.id)} />)}
            </div>
            
            <div className="flex-1 grid grid-cols-4 gap-2 p-2 overflow-hidden">
                {/* Main Avatar View */}
                <div className="col-span-3 bg-gray-900 rounded-lg relative overflow-hidden">
                    <img src="https://i.imgur.com/2y5W1qG.png" alt="AI Avatar" className="w-full h-full object-contain opacity-70 animate-pulse" style={{ animationDuration: '5s' }}/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <h2 className="absolute top-4 left-4 text-lg font-bold">Beyond Presence AI: Support Agent</h2>
                     <ToolStatus tasks={tasks} />
                </div>

                {/* Side Panel: User Cam & Chat */}
                <div className="col-span-1 flex flex-col gap-2">
                    <div className="h-1/3 bg-gray-900 rounded-lg flex items-center justify-center text-gray-500">
                        User Screen Share
                    </div>
                    <div className="h-1/3 bg-gray-900 rounded-lg flex items-center justify-center text-gray-500">
                        User Camera
                    </div>
                    <div className="flex-1 bg-gray-900 rounded-lg flex flex-col p-2 overflow-hidden">
                        <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-xs">
                           {messages.map(msg => (
                               <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                   <div className={`p-2 rounded-lg max-w-[90%] ${msg.role === 'user' ? 'bg-blue-600' : msg.role === 'agent' ? 'bg-gray-700' : 'bg-transparent text-gray-400 italic'}`}>
                                       {msg.role === 'tool' && <span className="font-semibold">[RPC Call] </span>}
                                       {msg.role === 'system' && <span className="font-semibold">[System] </span>}
                                       {msg.content}
                                   </div>
                               </div>
                           ))}
                           <div ref={chatEndRef}></div>
                        </div>
                        <form onSubmit={handleSendMessage} className="mt-2 flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message AI..."
                                className="w-full bg-gray-700 text-white rounded-full h-8 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button type="submit" className="p-1 text-white bg-blue-600 rounded-full hover:bg-blue-500 disabled:bg-gray-600" disabled={!input.trim()}>
                               <ArrowUpCircleIcon className="h-6 w-6"/>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="h-16 bg-gray-900/50 backdrop-blur-sm flex-shrink-0 flex justify-center items-center gap-4">
                <button className="p-3 bg-gray-700 rounded-full hover:bg-gray-600"><MicrophoneIcon className="w-6 h-6"/></button>
                <button className="p-3 bg-gray-700 rounded-full hover:bg-gray-600"><VideoIcon className="w-6 h-6"/></button>
                <button className="p-3 bg-gray-700 rounded-full hover:bg-gray-600"><SpeakerWaveIcon className="w-6 h-6"/></button>
                <button className="p-3 bg-red-600 rounded-full hover:bg-red-500"><PhoneIcon className="w-6 h-6"/></button>
            </div>
        </div>
    );
};