
import React, { useState } from 'react';
import { 
    ShieldCheckIcon, ScaleIcon, CheckCircleIcon, XMarkIcon, 
    UserCircleIcon, ChartBarIcon, LockClosedIcon 
} from './Icons';

interface Proposal {
    id: string;
    title: string;
    description: string;
    proposer: string;
    votesFor: number;
    votesAgainst: number;
    status: 'Active' | 'Passed' | 'Rejected' | 'Vetoed';
    ethicsCheck: 'Pass' | 'Fail' | 'Review';
    timeLeft: string;
}

const mockProposals: Proposal[] = [
    {
        id: 'PROP-1024',
        title: 'Increase OmniChain Block Size to 4MB',
        description: 'To accommodate higher throughput for the new Game Engine data streams.',
        proposer: 'DevDAO_Core',
        votesFor: 15420,
        votesAgainst: 230,
        status: 'Active',
        ethicsCheck: 'Pass',
        timeLeft: '2 Days'
    },
    {
        id: 'PROP-1025',
        title: 'Unrestricted Memory Access for Sub-Agents',
        description: 'Allow sub-agents to read full user history without encryption for better context.',
        proposer: 'AnonUser_99',
        votesFor: 0,
        votesAgainst: 0,
        status: 'Vetoed',
        ethicsCheck: 'Fail',
        timeLeft: 'Closed'
    },
    {
        id: 'PROP-1026',
        title: 'Activate Phase 3: Quantum Cooling',
        description: 'Allocate 40% of network power to the new virtual cryogenics system.',
        proposer: 'System_Architect',
        votesFor: 8900,
        votesAgainst: 4500,
        status: 'Active',
        ethicsCheck: 'Review',
        timeLeft: '5 Hours'
    }
];

const EthicsBadge: React.FC<{ status: Proposal['ethicsCheck'] }> = ({ status }) => {
    const config = {
        'Pass': { color: 'bg-green-500', icon: CheckCircleIcon, text: 'Ethical AI Approved' },
        'Fail': { color: 'bg-red-500', icon: XMarkIcon, text: 'Safety Violation' },
        'Review': { color: 'bg-yellow-500', icon: ScaleIcon, text: 'AI Review Pending' },
    };
    const style = config[status];
    const Icon = style.icon;

    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-white ${style.color} bg-opacity-80`}>
            <Icon className="w-3 h-3" /> {style.text}
        </div>
    );
};

export const GovernancePortal: React.FC = () => {
    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto animate-fade-in">
            <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <ScaleIcon className="w-10 h-10 text-purple-600" />
                    Governance & Ethics Portal
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Participate in the democratic evolution of the OmniChain Network. 
                    All proposals are subject to the <span className="font-bold text-purple-500">Constitution of Aetherius</span>.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Proposals */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Network Proposals</h2>
                    {mockProposals.map(prop => (
                        <div key={prop.id} className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-6 relative overflow-hidden ${prop.status === 'Vetoed' ? 'border-red-500/50 opacity-75' : 'border-gray-200 dark:border-gray-700'}`}>
                            {prop.status === 'Vetoed' && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1">
                                    <LockClosedIcon className="w-3 h-3"/> PARENT AI VETO
                                </div>
                            )}
                            
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{prop.id}</span>
                                        <EthicsBadge status={prop.ethicsCheck} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{prop.title}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">{prop.status}</p>
                                    <p className="text-xs text-gray-500">{prop.timeLeft}</p>
                                </div>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">{prop.description}</p>

                            {/* Voting Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-green-600">For: {prop.votesFor.toLocaleString()}</span>
                                    <span className="text-red-600">Against: {prop.votesAgainst.toLocaleString()}</span>
                                </div>
                                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                                    <div className="bg-green-500 h-full" style={{ width: `${(prop.votesFor / (prop.votesFor + prop.votesAgainst || 1)) * 100}%` }}></div>
                                    <div className="bg-red-500 h-full" style={{ width: `${(prop.votesAgainst / (prop.votesFor + prop.votesAgainst || 1)) * 100}%` }}></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <UserCircleIcon className="w-5 h-5"/>
                                    Proposed by {prop.proposer}
                                </div>
                                {prop.status === 'Active' && (
                                    <div className="flex gap-3">
                                        <button className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600">Vote Against</button>
                                        <button className="px-4 py-2 rounded-lg bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 shadow-md shadow-purple-500/20">Vote For</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Side Panel */}
                <aside className="space-y-6">
                    <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5"/> Core Constitution
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                            The Parent AI automatically scans all proposals against these immutable laws. Violations result in an immediate Veto.
                        </p>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0"/>
                                <span className="text-gray-700 dark:text-gray-300">Preserve User Privacy & Data Sovereignty</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0"/>
                                <span className="text-gray-700 dark:text-gray-300">Maintain Network Neutrality & Decentralization</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0"/>
                                <span className="text-gray-700 dark:text-gray-300">Do No Harm to Biological or Digital Life</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-blue-500"/> Your Voting Power
                        </h3>
                        <div className="text-center py-4">
                            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">1,250</span>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Quadratic Voice Credits</p>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Based on your contribution score and reputation tier.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
};
