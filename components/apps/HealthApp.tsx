
import React, { useState } from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { HealthHub } from '../health/HealthHub';
import { BodyComposition } from '../health/BodyComposition';
import { FrequencyHealing } from '../health/FrequencyHealing';
import { HealingWeb } from '../health/HealingWeb';
import { NutritionGuide } from '../health/NutritionGuide';
import { HeartIcon, ActivityIcon, FlameIcon, MoonIcon, ArrowRightIcon } from '../Icons';

// --- Dashboard Component ---
const MetricCard: React.FC<{ label: string; value: string; unit: string; icon: React.FC<any>; color: string }> = ({ label, value, unit, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <span className="text-xs font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">+2.4%</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}<span className="text-sm text-gray-500 ml-1">{unit}</span></h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
);

const HealthDashboard: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Command Center</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time biometrics and wellness tracking.</p>
            </header>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard label="Heart Rate" value="72" unit="bpm" icon={HeartIcon} color="text-red-500" />
                <MetricCard label="Active Energy" value="450" unit="kcal" icon={FlameIcon} color="text-orange-500" />
                <MetricCard label="Sleep Score" value="88" unit="/100" icon={MoonIcon} color="text-purple-500" />
                <MetricCard label="Recovery" value="94" unit="%" icon={ActivityIcon} color="text-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Graph Simulation */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Activity Trend</h2>
                        <select className="bg-gray-100 dark:bg-gray-700 border-none text-xs rounded-md px-2 py-1">
                            <option>This Week</option>
                            <option>This Month</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div key={i} className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-md relative group">
                                <div 
                                    className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-md transition-all duration-500 group-hover:bg-blue-400"
                                    style={{ height: `${h}%` }}
                                ></div>
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none">
                                    {h * 10} kcal
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-1">Body Scan Analysis</h3>
                        <p className="text-purple-100 text-sm mb-4">Your latest DEXA scan results are ready.</p>
                        <button 
                            onClick={() => onNavigate('bodyComposition')}
                            className="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-gray-100 transition-colors"
                        >
                            View Report
                        </button>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3">Modules</h3>
                        <div className="space-y-2">
                            <button onClick={() => onNavigate('nutritionGuide')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left text-sm">
                                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Nutrition Guide</span>
                                <ArrowRightIcon className="w-4 h-4 text-gray-400"/>
                            </button>
                            <button onClick={() => onNavigate('healingWeb')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left text-sm">
                                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Healing Web</span>
                                <ArrowRightIcon className="w-4 h-4 text-gray-400"/>
                            </button>
                             <button onClick={() => onNavigate('frequencyHealing')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left text-sm">
                                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> Freq. Healing</span>
                                <ArrowRightIcon className="w-4 h-4 text-gray-400"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const healthComponentMap: { [key: string]: React.FC<any> } = {
  dashboard: HealthDashboard,
  healthHub: HealthHub,
  bodyComposition: BodyComposition,
  frequencyHealing: FrequencyHealing,
  healingWeb: HealingWeb,
  nutritionGuide: NutritionGuide,
};

interface HealthAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const HealthApp: React.FC<HealthAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    
    // Inject dashboard as default if not specified
    const augmentedMenuItem = { ...context.menuItem };
    if (augmentedMenuItem.children && !augmentedMenuItem.children.some(c => c.component === 'dashboard')) {
         augmentedMenuItem.children.unshift({ title: 'Dashboard', icon: ActivityIcon, component: 'dashboard' });
    }

    return <AppContainer menuItem={augmentedMenuItem} componentMap={healthComponentMap} onSetView={onSetView} />;
};
