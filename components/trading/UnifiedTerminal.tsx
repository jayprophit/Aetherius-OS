
import React, { useState } from 'react';
import { AdvancedChart } from './AdvancedChart';
import { AiScanner } from './AiScanner';
import { MarketBubbles } from './MarketBubbles';
import { Swap } from './Swap';
import { TradingBots } from './TradingBots';
import { 
    ChartBarIcon, GlobeAltIcon, CpuChipIcon, WalletIcon, 
    ArrowPathIcon, Bars3Icon, SparklesIcon
} from '../Icons';

export const UnifiedTerminal: React.FC = () => {
    const [activeRightTab, setActiveRightTab] = useState<'Swap' | 'Scanner' | 'Bots'>('Swap');
    const [activeView, setActiveView] = useState<'Terminal' | 'Visualizer'>('Terminal');

    return (
        <div className="h-full flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
            {/* Top Navigation / Ticker */}
            <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 font-bold text-lg text-blue-400">
                        <ChartBarIcon className="w-6 h-6"/> Genesis Trade Deck
                    </div>
                    <div className="h-6 w-px bg-gray-600 mx-2"></div>
                    <div className="flex gap-1 text-xs overflow-hidden max-w-md whitespace-nowrap mask-linear-fade">
                        <span className="text-green-400">BTC $65,432 (+2.4%)</span>
                        <span className="text-gray-500 mx-2">|</span>
                        <span className="text-red-400">ETH $3,420 (-1.1%)</span>
                        <span className="text-gray-500 mx-2">|</span>
                        <span className="text-green-400">SOL $145 (+5.8%)</span>
                        <span className="text-gray-500 mx-2">|</span>
                        <span className="text-blue-400">AI CONFIDENCE: 88% BULLISH</span>
                    </div>
                </div>
                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                    <button 
                        onClick={() => setActiveView('Terminal')}
                        className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-2 ${activeView === 'Terminal' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <ChartBarIcon className="w-3 h-3"/> Terminal
                    </button>
                    <button 
                        onClick={() => setActiveView('Visualizer')}
                        className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-2 ${activeView === 'Visualizer' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <GlobeAltIcon className="w-3 h-3"/> Visualizer
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Center Panel (Charts/Visuals) */}
                <div className="flex-1 flex flex-col border-r border-gray-800 min-w-0">
                    {activeView === 'Terminal' ? (
                        <div className="flex-1 relative">
                            <AdvancedChart />
                            {/* Floating Scanner Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 h-48 border-t border-gray-800 bg-gray-900 z-10">
                                <AiScanner />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 p-4 bg-gray-950">
                            <MarketBubbles />
                        </div>
                    )}
                </div>

                {/* Right Panel (Execution & Tools) */}
                <aside className="w-80 bg-gray-800 flex flex-col flex-shrink-0 border-l border-gray-700">
                    <div className="flex border-b border-gray-700">
                        <button 
                            onClick={() => setActiveRightTab('Swap')}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeRightTab === 'Swap' ? 'border-blue-500 text-white bg-gray-700' : 'border-transparent text-gray-400 hover:bg-gray-700/50'}`}
                        >
                            Swap
                        </button>
                        <button 
                            onClick={() => setActiveRightTab('Scanner')}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeRightTab === 'Scanner' ? 'border-purple-500 text-white bg-gray-700' : 'border-transparent text-gray-400 hover:bg-gray-700/50'}`}
                        >
                            Signals
                        </button>
                        <button 
                            onClick={() => setActiveRightTab('Bots')}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeRightTab === 'Bots' ? 'border-green-500 text-white bg-gray-700' : 'border-transparent text-gray-400 hover:bg-gray-700/50'}`}
                        >
                            Bots
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-900 p-2">
                        {activeRightTab === 'Swap' && <Swap />}
                        {activeRightTab === 'Scanner' && <div className="h-full"><AiScanner /></div>}
                        {activeRightTab === 'Bots' && (
                            <div className="space-y-4 p-2">
                                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                    <h4 className="font-bold text-white mb-2">Active Grid Bot</h4>
                                    <div className="flex justify-between text-sm text-gray-400">
                                        <span>BTC/USDT</span>
                                        <span className="text-green-400">+12.4%</span>
                                    </div>
                                    <div className="mt-2 w-full bg-gray-700 h-1.5 rounded-full">
                                        <div className="bg-green-500 h-1.5 rounded-full" style={{width: '60%'}}></div>
                                    </div>
                                </div>
                                <p className="text-xs text-center text-gray-500">Visit Bot Farm for more controls.</p>
                            </div>
                        )}
                    </div>

                    {/* Mini Wallet Summary */}
                    <div className="h-auto bg-gray-800 border-t border-gray-700 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                                <WalletIcon className="w-3 h-3"/> Balance
                            </span>
                            <span className="text-green-400 text-sm font-mono">Online</span>
                        </div>
                        <div className="text-2xl font-bold text-white">$104,230.50</div>
                        <div className="text-xs text-gray-400 mt-1">Available: 1.2 BTC / 15 ETH</div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
