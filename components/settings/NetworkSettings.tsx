import React, { useState } from 'react';
import { WifiIcon, LockClosedIcon } from '../Icons';

const ToggleSwitch: React.FC<{toggled: boolean, onToggle: () => void}> = ({ toggled, onToggle }) => {
    return (
        <button onClick={onToggle} role="switch" aria-checked={toggled} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${toggled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${toggled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
};

const networks = [
    { name: "Jay's Galaxy S10 5G", connected: true, secured: true, signal: 3 },
    { name: "NETGEAR-2.4G", connected: false, secured: true, signal: 2 },
    { name: "xfinitywifi", connected: false, secured: false, signal: 3 },
    { name: "Starbucks WiFi", connected: false, secured: false, signal: 1 },
    { name: "Neighbors-Be-Quiet", connected: false, secured: true, signal: 1 },
];

const WifiSignalIcon: React.FC<{ strength: number }> = ({ strength }) => {
    return (
        <div className="w-5 h-5 flex items-end gap-0.5">
            <div className={`w-1 rounded-sm ${strength >= 1 ? 'bg-gray-600 dark:bg-gray-300' : 'bg-gray-300 dark:bg-gray-600'}`} style={{height: '25%'}} />
            <div className={`w-1 rounded-sm ${strength >= 2 ? 'bg-gray-600 dark:bg-gray-300' : 'bg-gray-300 dark:bg-gray-600'}`} style={{height: '50%'}} />
            <div className={`w-1 rounded-sm ${strength >= 3 ? 'bg-gray-600 dark:bg-gray-300' : 'bg-gray-300 dark:bg-gray-600'}`} style={{height: '75%'}} />
            <div className={`w-1 rounded-sm ${strength >= 4 ? 'bg-gray-600 dark:bg-gray-300' : 'bg-gray-300 dark:bg-gray-600'}`} style={{height: '100%'}} />
        </div>
    )
};

export const NetworkSettings: React.FC<{title: string}> = ({ title }) => {
    const [wifiOn, setWifiOn] = useState(true);

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <WifiIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        <span className="font-semibold text-gray-800 dark:text-gray-100">Wi-Fi</span>
                    </div>
                    <ToggleSwitch toggled={wifiOn} onToggle={() => setWifiOn(!wifiOn)} />
                </div>
                {wifiOn && (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {networks.map(net => (
                            <button key={net.name} className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-100">{net.name}</p>
                                    {net.connected && <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Connected</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    {net.secured && <LockClosedIcon className="w-5 h-5 text-gray-400" />}
                                    <WifiSignalIcon strength={net.signal} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                 {!wifiOn && (
                    <div className="p-8 text-center text-gray-500">
                        <p>Wi-Fi is currently turned off.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};
