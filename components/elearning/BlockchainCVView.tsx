


import React from 'react';
import { ShieldCheckIcon, CheckCircleIcon, BriefcaseIcon, AcademicCapIcon, LinkIcon, ShareIcon, QrCodeIcon } from '../Icons';
import { loggedInUser } from '../../data';

const CredentialCard: React.FC<{ credential: any }> = ({ credential }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
            <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                    <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{credential.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{credential.issuer} • {credential.issueDate}</p>
                </div>
            </div>
            <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded border border-green-200 dark:border-green-800">
                <CheckCircleIcon className="w-3 h-3 text-green-500" />
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Verified</span>
            </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
            {credential.skills.map((skill: string) => (
                <span key={skill} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-300">
                    {skill}
                </span>
            ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">Hash:</span>
                <span className="text-xs font-mono bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-blue-500 truncate w-32">{credential.hash}</span>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                View On-Chain <LinkIcon className="w-3 h-3"/>
            </button>
        </div>
    </div>
);

export const BlockchainCVView: React.FC = () => {
    const cv = loggedInUser.blockchainCV;

    if (!cv) return <div>No Blockchain CV Found.</div>;

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto animate-fade-in">
            <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {loggedInUser.name}
                            <div title="Verified Identity">
                                <ShieldCheckIcon className="w-8 h-8 text-green-400" />
                            </div>
                        </h1>
                        <p className="text-blue-200 mt-2 max-w-xl">{loggedInUser.bio}</p>
                        <div className="flex gap-4 mt-4 text-sm font-mono text-blue-300">
                            <span>ID: {cv.id}</span>
                            <span>•</span>
                            <span>Updated: {cv.lastUpdated}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm flex items-center gap-2 text-sm font-bold">
                            <ShareIcon className="w-4 h-4" /> Share CV
                        </button>
                        <button className="px-4 py-2 bg-white text-blue-900 rounded-lg font-bold flex items-center gap-2 text-sm hover:bg-gray-100">
                            <QrCodeIcon className="w-4 h-4" /> QR Code
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <AcademicCapIcon className="w-6 h-6 text-blue-600" /> Verified Credentials
                        </h2>
                        <div className="space-y-4">
                            {cv.credentials.map(cred => (
                                <CredentialCard key={cred.id} credential={cred} />
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <BriefcaseIcon className="w-6 h-6 text-purple-600" /> Verified Skills Matrix
                        </h2>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex flex-wrap gap-2">
                                {cv.verifiedSkills.map(skill => (
                                    <div key={skill} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                        {skill}
                                        <CheckCircleIcon className="w-3 h-3 text-green-500" />
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 text-xs text-gray-500">
                                * Skills are automatically aggregated from completed courses and verified assessments on the OmniChain.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Right Column */}
                <aside className="space-y-6">
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Job Matches</h3>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-blue-400 transition-colors">
                                <h4 className="font-bold text-sm">Senior React Developer</h4>
                                <p className="text-xs text-gray-500 mb-2">TechCorp • Remote</p>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '95%' }}></div>
                                </div>
                                <p className="text-[10px] text-green-600 mt-1 font-bold">95% Skill Match</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-blue-400 transition-colors">
                                <h4 className="font-bold text-sm">Quantum Systems Architect</h4>
                                <p className="text-xs text-gray-500 mb-2">Q-Labs • San Francisco</p>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                                </div>
                                <p className="text-[10px] text-yellow-600 mt-1 font-bold">75% Skill Match</p>
                            </div>
                        </div>
                        <button className="w-full mt-4 py-2 text-sm font-bold text-blue-600 border border-blue-200 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            View All Jobs
                        </button>
                     </div>
                </aside>
            </div>
        </div>
    );
};