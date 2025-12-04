
import React, { useState } from 'react';
import { 
    ChartBarIcon, UsersIcon, CurrencyDollarIcon, TruckIcon, 
    BriefcaseIcon, PresentationChartLineIcon, UserGroupIcon, 
    GlobeAltIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon
} from '../Icons';

// --- Mock Data ---

const kpiData = [
    { label: 'Total Revenue', value: '$4,250,000', change: '+12.5%', trend: 'up', icon: CurrencyDollarIcon, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Active Leads', value: '1,240', change: '+5.2%', trend: 'up', icon: UserGroupIcon, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Open Projects', value: '45', change: '-2.1%', trend: 'down', icon: BriefcaseIcon, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Supply Chain Health', value: '98%', change: '+0.4%', trend: 'up', icon: TruckIcon, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
];

const recentLeads = [
    { id: 1, name: 'Acme Corp', contact: 'Alice Smith', value: '$50,000', status: 'Negotiation', probability: '75%' },
    { id: 2, name: 'GlobalTech', contact: 'Bob Jones', value: '$120,000', status: 'Proposal', probability: '40%' },
    { id: 3, name: 'Stark Ind', contact: 'Tony S.', value: '$500,000', status: 'Closed Won', probability: '100%' },
    { id: 4, name: 'Wayne Ent', contact: 'Bruce W.', value: '$350,000', status: 'Discovery', probability: '20%' },
];

const inventoryAlerts = [
    { id: 1, item: 'Quantum Chipset QX-5', stock: 12, threshold: 50, status: 'Low Stock' },
    { id: 2, item: 'Neural Lace V3', stock: 0, threshold: 20, status: 'Out of Stock' },
];

const employeeStats = [
    { dept: 'Engineering', count: 142, active: 138 },
    { dept: 'Sales', count: 55, active: 50 },
    { dept: 'Marketing', count: 30, active: 29 },
    { dept: 'Support', count: 85, active: 80 },
];

// --- Sub-Components ---

const KPICard: React.FC<{ data: typeof kpiData[0] }> = ({ data }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{data.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.value}</h3>
            <span className={`text-xs font-bold flex items-center gap-1 mt-2 ${data.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {data.change} from last month
            </span>
        </div>
        <div className={`p-3 rounded-lg ${data.bg}`}>
            <data.icon className={`w-6 h-6 ${data.color}`} />
        </div>
    </div>
);

export const EnterpriseDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'CRM' | 'ERP' | 'HRM'>('Overview');

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto p-6 animate-fade-in font-sans">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <GlobeAltIcon className="w-8 h-8 text-indigo-600" />
                        Enterprise Command Center
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Unified Business Intelligence & Operations Platform</p>
                </div>
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    {['Overview', 'CRM', 'ERP', 'HRM'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {kpiData.map((kpi, i) => <KPICard key={i} data={kpi} />)}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Recent Leads (CRM) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <PresentationChartLineIcon className="w-5 h-5 text-blue-500"/> Sales Pipeline
                        </h3>
                        <button className="text-sm text-blue-600 hover:underline">View All Deals</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Company</th>
                                    <th className="px-6 py-3">Contact</th>
                                    <th className="px-6 py-3">Value</th>
                                    <th className="px-6 py-3">Stage</th>
                                    <th className="px-6 py-3">Prob.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {recentLeads.map(lead => (
                                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{lead.name}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{lead.contact}</td>
                                        <td className="px-6 py-4 font-mono">{lead.value}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                lead.status === 'Closed Won' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                                lead.status === 'Negotiation' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 
                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: lead.probability }}></div>
                                                </div>
                                                <span className="text-xs">{lead.probability}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Inventory & HR */}
                <div className="space-y-8">
                    
                    {/* Inventory Alerts (ERP) */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500"/> Supply Chain Alerts
                        </h3>
                        <div className="space-y-3">
                            {inventoryAlerts.map(alert => (
                                <div key={alert.id} className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{alert.item}</span>
                                        <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">{alert.status}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>Current: {alert.stock}</span>
                                        <span>Threshold: {alert.threshold}</span>
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <ArrowPathIcon className="w-4 h-4"/> Reorder Stock
                            </button>
                        </div>
                    </div>

                    {/* HR Overview */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                         <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <UsersIcon className="w-5 h-5 text-green-500"/> Workforce Pulse
                        </h3>
                        <div className="space-y-4">
                            {employeeStats.map(stat => (
                                <div key={stat.dept}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{stat.dept}</span>
                                        <span className="text-gray-500">{stat.active}/{stat.count} Active</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${(stat.active / stat.count) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
