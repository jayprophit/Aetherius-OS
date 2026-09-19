
import React from 'react';
import { 
    HomeIcon, ShoppingCartIcon, UsersIcon, DocumentTextIcon, 
    ChartBarIcon, CubeIcon, Cog6ToothIcon, PaintBrushIcon,
    PuzzlePieceIcon, ArrowRightOnRectangleIcon, PlusIcon
} from '../Icons';

const SidebarItem: React.FC<{ icon: React.FC<any>, label: string, active?: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg mb-1 ${active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
    >
        <Icon className="w-5 h-5" />
        {label}
    </button>
);

const StatCard: React.FC<{ label: string, value: string, trend: string, positive: boolean }> = ({ label, value, trend, positive }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${positive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                {trend}
            </span>
        </div>
    </div>
);

export const OmniDashboard: React.FC<{ onLaunchBuilder: () => void }> = ({ onLaunchBuilder }) => {
    return (
        <div className="flex h-full bg-gray-50 dark:bg-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <CubeIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">OmniPlatform</span>
                </div>
                
                <nav className="flex-1 px-4 overflow-y-auto">
                    <div className="mb-6">
                        <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Main</p>
                        <SidebarItem icon={HomeIcon} label="Dashboard" active onClick={() => {}} />
                        <SidebarItem icon={ChartBarIcon} label="Analytics" onClick={() => {}} />
                    </div>

                    <div className="mb-6">
                        <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Content</p>
                        <SidebarItem icon={DocumentTextIcon} label="Pages" onClick={() => {}} />
                        <SidebarItem icon={PaintBrushIcon} label="Themes" onClick={() => {}} />
                        <SidebarItem icon={PuzzlePieceIcon} label="Plugins" onClick={() => {}} />
                    </div>

                    <div className="mb-6">
                        <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Store</p>
                        <SidebarItem icon={ShoppingCartIcon} label="Orders" onClick={() => {}} />
                        <SidebarItem icon={CubeIcon} label="Products" onClick={() => {}} />
                        <SidebarItem icon={UsersIcon} label="Customers" onClick={() => {}} />
                    </div>
                </nav>
                
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <SidebarItem icon={Cog6ToothIcon} label="Settings" onClick={() => {}} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                            View Site
                        </button>
                        <button 
                            onClick={onLaunchBuilder}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            <PlusIcon className="w-4 h-4" /> Edit with VisualBuilder
                        </button>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard label="Total Revenue" value="$12,450" trend="+12.5%" positive={true} />
                        <StatCard label="Active Orders" value="45" trend="+5.2%" positive={true} />
                        <StatCard label="Site Visits" value="8,200" trend="-2.1%" positive={false} />
                        <StatCard label="Conversion Rate" value="3.4%" trend="+0.8%" positive={true} />
                    </div>

                    {/* Recent Activity Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Orders */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h2 className="font-bold text-gray-800 dark:text-white">Recent Orders</h2>
                                <button className="text-sm text-blue-600 hover:underline">View All</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3">Order ID</th>
                                            <th className="px-6 py-3">Customer</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">#ORD-00{i}</td>
                                                <td className="px-6 py-4 font-medium">Alex Johnson</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Completed</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold">$124.00</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* System Health */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="font-bold text-gray-800 dark:text-white mb-4">System Health</h2>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Server Load</span>
                                        <span className="font-bold text-blue-600">24%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Database Storage</span>
                                        <span className="font-bold text-purple-600">45%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Version</span>
                                        <span className="font-mono">Omni v2.4.0</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-2">
                                        <span className="text-gray-600 dark:text-gray-400">Updates</span>
                                        <span className="text-green-500 font-bold">Up to date</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
