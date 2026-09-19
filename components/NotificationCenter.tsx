
import React, { useState } from 'react';
import { 
    XMarkIcon, BellIcon, CheckCircleIcon, ExclamationTriangleIcon, 
    InformationCircleIcon, TrashIcon, ClockIcon, ArrowPathIcon
} from './Icons';
import { NotificationData } from '../types';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

// Mock initial notifications
const initialNotifications: NotificationData[] = [
    { id: 'n1', type: 'success', title: 'System Update', message: 'Aetherius OS Kernel v2.4 patch applied successfully.', duration: 0 },
    { id: 'n2', type: 'info', title: 'AI Assistant', message: 'Deep Think (R1) optimization complete. 15% efficiency gain.', duration: 0 },
    { id: 'n3', type: 'warning', title: 'Security Alert', message: 'Unusual network traffic detected in Sector 7. Firewall active.', duration: 0 },
    { id: 'n4', type: 'processing', title: 'Quantum Sync', message: 'Entangling local vector store with OmniChain...', duration: 0 },
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<NotificationData[]>(initialNotifications);

    const clearAll = () => setNotifications([]);
    const removeOne = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
            case 'error': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
            case 'processing': return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
            default: return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 bg-transparent z-[60]" onClick={onClose} />
            )}
            
            {/* Panel */}
            <div className={`fixed top-16 right-4 bottom-20 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[61] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}>
                
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-black/20 rounded-t-xl">
                    <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <BellIcon className="w-5 h-5 text-blue-600" />
                        Notifications
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full">
                            {notifications.length}
                        </span>
                    </h2>
                    <div className="flex gap-2">
                        {notifications.length > 0 && (
                            <button onClick={clearAll} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500" title="Clear All">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {notifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <BellIcon className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-sm">No new notifications</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div key={notif.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative group animate-fade-in-left">
                                <div className="flex gap-3">
                                    <div className="mt-1">{getIcon(notif.type)}</div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{notif.title}</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                                        <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                                            <ClockIcon className="w-3 h-3" />
                                            <span>Just now</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeOne(notif.id)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-opacity"
                                >
                                    <XMarkIcon className="w-3 h-3 text-gray-400" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-black/20 text-center rounded-b-xl">
                    <button className="text-xs font-semibold text-blue-600 hover:underline">
                        Manage Notification Settings
                    </button>
                </div>
            </div>
        </>
    );
};
