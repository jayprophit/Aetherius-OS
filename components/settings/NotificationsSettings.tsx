import React, { useState } from 'react';
import { BellIcon, MessageIcon, CalendarIcon, DocumentTextIcon } from '../Icons';

const Card: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{title}</h2>
        {children}
    </div>
);

const AppNotificationRow: React.FC<{ name: string, icon: React.FC<any> }> = ({ name, icon: Icon }) => (
    <div className="flex justify-between items-center py-3">
        <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-gray-500" />
            <span className="font-medium text-gray-800 dark:text-gray-100">{name}</span>
        </div>
        <select className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md h-8 px-2 text-sm focus:ring-0 focus:border-gray-400">
            <option>On</option>
            <option>Off</option>
            <option>Badges Only</option>
        </select>
    </div>
);

export const NotificationsSettings: React.FC<{ title: string }> = ({ title }) => {
    const [delivery, setDelivery] = useState('stack');
    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>
            
            <Card title="Display As">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <button onClick={() => setDelivery('count')} className={`p-4 rounded-lg border-2 transition-colors ${delivery === 'count' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
                        <div className="text-3xl font-bold">5</div>
                        <span className="font-semibold text-sm">Count</span>
                    </button>
                     <button onClick={() => setDelivery('stack')} className={`p-4 rounded-lg border-2 transition-colors ${delivery === 'stack' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
                        <div className="text-3xl font-bold">Stack</div>
                        <span className="font-semibold text-sm">Stack</span>
                    </button>
                    <button onClick={() => setDelivery('list')} className={`p-4 rounded-lg border-2 transition-colors ${delivery === 'list' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}>
                        <div className="text-3xl font-bold">List</div>
                        <span className="font-semibold text-sm">List</span>
                    </button>
                </div>
            </Card>

            <Card title="Scheduled Summary">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">Scheduled Delivery</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bundle non-urgent notifications and receive them as a summary.</p>
                    </div>
                    <button className="text-sm font-semibold text-blue-500">Set Up</button>
                </div>
            </Card>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-6">
                <h2 className="text-lg font-bold py-4 text-gray-800 dark:text-gray-100">Notification Styles</h2>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <AppNotificationRow name="Messenger" icon={MessageIcon} />
                    <AppNotificationRow name="Calendar" icon={CalendarIcon} />
                    <AppNotificationRow name="Mail" icon={DocumentTextIcon} />
                </div>
            </div>
        </div>
    );
};
