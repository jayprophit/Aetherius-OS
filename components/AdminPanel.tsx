
import React, { useState } from 'react';
import { Cog6ToothIcon, GlobeAltIcon, ShoppingCartIcon, BeakerIcon, HeartIcon, ShieldCheckIcon, UsersIcon } from './Icons';
import { allUsers } from '../data';

interface ToggleRowProps {
  title: string;
  description: string;
  initialValue?: boolean;
}

const ToggleSwitch: React.FC<{ toggled: boolean; onToggle: () => void }> = ({ toggled, onToggle }) => (
    <button
        onClick={onToggle}
        role="switch"
        aria-checked={toggled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${toggled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${toggled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const ToggleRow: React.FC<ToggleRowProps> = ({ title, description, initialValue = true }) => {
    const [toggled, setToggled] = useState(initialValue);
    return (
        <div className="flex justify-between items-center py-4">
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <ToggleSwitch toggled={toggled} onToggle={() => setToggled(!toggled)} />
        </div>
    );
};

const Section: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-3">
            <Icon className="w-6 h-6" />
            {title}
        </h2>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {children}
        </div>
    </div>
);

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState(allUsers);

    const handleRoleChange = (userId: string, newRole: string) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Current Role</th>
                        <th className="px-4 py-3">Assign Role</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map(user => (
                        <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <img src={user.avatarUrl || ''} className="w-6 h-6 rounded-full"/>
                                {user.name}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.role}</td>
                            <td className="px-4 py-3">
                                <select 
                                    value={user.role} 
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                >
                                    <option value="Buyer">Buyer</option>
                                    <option value="Seller">Seller</option>
                                    <option value="Developer">Developer</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Student">Student</option>
                                    <option value="Teacher">Teacher</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export const AdminPanel: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Owner Admin Panel</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Enable or disable platform features and categories globally.</p>
            </header>
            <div className="max-w-4xl mx-auto space-y-6">
                 <Section title="User Management" icon={UsersIcon}>
                    <UserManagement />
                </Section>

                <Section title="Core OS Features" icon={Cog6ToothIcon}>
                    <ToggleRow title="AI Hub" description="Main AI assistant and chat interface." />
                    <ToggleRow title="Browser" description="The built-in web browser application." />
                    <ToggleRow title="Social Hub" description="Enables all social features like feeds, members, and groups." />
                </Section>
                
                <Section title="Security & Authentication" icon={ShieldCheckIcon}>
                    <ToggleRow title="End-to-End Encryption" description="Enable quantum-resistant E2EE for all private messages." />
                    <ToggleRow title="BCI Authentication" description="Allow users to authenticate using Brain-Computer Interface patterns." initialValue={false}/>
                    <ToggleRow title="Require KYC for Trading" description="Mandate Know Your Customer verification for all financial services." />
                </Section>

                <Section title="Commerce Hubs" icon={ShoppingCartIcon}>
                    <ToggleRow title="E-Commerce Marketplace" description="The main business and product marketplace." />
                    <ToggleRow title="Creator Marketplace" description="Store for community-made apps, themes, and plugins." />
                    <ToggleRow title="Finance & Trading" description="Enables all financial apps, including trading, staking, and lending." />
                </Section>
                
                <Section title="Creation & Labs" icon={BeakerIcon}>
                    <ToggleRow title="Development Tools" description="Code editor, website builder, game design." />
                    <ToggleRow title="Media Production" description="Music, video, and image editing suites." />
                    <ToggleRow title="Avatar Forge" description="The from-scratch avatar creation module." />
                    <ToggleRow title="Simulation Hub" description="Interactive world simulation viewer." />
                </Section>

                <Section title="Personal Hubs" icon={HeartIcon}>
                     <ToggleRow title="E-Learning Platform" description="Access to course catalog and user learning paths." />
                     <ToggleRow title="Gaming Hub" description="Access to game library and gaming features." />
                     <ToggleRow title="Health & Wellness" description="The entire health hub, including scans and guides." />
                </Section>
            </div>
        </div>
    );
};
