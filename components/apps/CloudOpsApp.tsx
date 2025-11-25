
import React, { useState, useEffect } from 'react';
import { 
    CloudIcon, ServerIcon, ShieldCheckIcon, CircleStackIcon, BoltIcon, 
    CheckCircleIcon, GlobeAltIcon, LockClosedIcon, KeyIcon, 
    ArrowPathIcon, ChartBarIcon, ExclamationTriangleIcon, PlayIcon
} from '../Icons';

// --- Types ---
interface Metric {
    label: string;
    value: string;
    status: 'good' | 'warning' | 'neutral';
}

interface SecurityCheck {
    id: string;
    label: string;
    description: string;
    active: boolean;
}

// --- Components ---

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles = status === 'LIVE' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-gray-700 text-gray-400 border-gray-600';
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles} animate-pulse`}>
            {status}
        </span>
    );
};

const MetricCard: React.FC<Metric> = ({ label, value, status }) => (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col items-center justify-center">
        <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</span>
        <span className={`text-2xl font-bold font-mono ${status === 'good' ? 'text-green-400' : status === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>
            {value}
        </span>
    </div>
);

const ToggleCard: React.FC<{ title: string; desc: string; active: boolean; onToggle: () => void }> = ({ title, desc, active, onToggle }) => (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex justify-between items-center">
        <div>
            <h4 className="font-bold text-gray-200">{title}</h4>
            <p className="text-xs text-gray-500">{desc}</p>
        </div>
        <button 
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

const InputField: React.FC<{ label: string; placeholder: string; type?: string; value?: string }> = ({ label, placeholder, type = "text", value }) => (
    <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-400">{label}</label>
        <div className="relative">
            <input 
                type={type} 
                defaultValue={value}
                placeholder={placeholder}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
            />
            {type === "password" && <KeyIcon className="w-4 h-4 text-gray-500 absolute right-3 top-3" />}
        </div>
    </div>
);

export const CloudOpsApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'Infrastructure' | 'Security' | 'Database' | 'Integrations'>('Overview');
    const [isDeployed, setIsDeployed] = useState(false);
    const [deployProgress, setDeployProgress] = useState(0);
    const [isSeeding, setIsSeeding] = useState(false);
    
    // Config States
    const [autoScale, setAutoScale] = useState(true);
    const [loadBalance, setLoadBalance] = useState(true);
    const [cdnCache, setCdnCache] = useState(true);
    const [webpOpt, setWebpOpt] = useState(true);

    const handleDeploy = () => {
        setDeployProgress(10);
        const interval = setInterval(() => {
            setDeployProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsDeployed(true);
                    return 100;
                }
                return prev + (Math.random() * 15);
            });
        }, 300);
    };

    const handleSeed = () => {
        setIsSeeding(true);
        setTimeout(() => setIsSeeding(false), 2000);
    };

    const renderOverview = () => {
        if (!isDeployed && deployProgress === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-6">
                    <div className="w-24 h-24 bg-blue-900/30 rounded-full flex items-center justify-center animate-pulse">
                        <CloudIcon className="w-12 h-12 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">Ready to Deploy</h2>
                        <p className="text-gray-400 mt-2 max-w-md mx-auto">
                            Initialize your global production environment. This will provision auto-scaling servers, SSL certificates, and database clusters across 3 regions.
                        </p>
                    </div>
                    <button 
                        onClick={handleDeploy}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-3"
                    >
                        <BoltIcon className="w-6 h-6" /> Publish to Production
                    </button>
                </div>
            );
        }

        if (deployProgress > 0 && deployProgress < 100) {
            return (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="w-full max-w-md space-y-2">
                        <div className="flex justify-between text-xs font-mono text-blue-400">
                            <span>PROVISIONING INFRASTRUCTURE...</span>
                            <span>{Math.round(deployProgress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${deployProgress}%` }}></div>
                        </div>
                        <div className="h-40 bg-black rounded-lg border border-gray-800 p-4 font-mono text-xs text-gray-400 overflow-y-auto">
                            <p>> Initializing Terraform state...</p>
                            {deployProgress > 20 && <p>> Provisioning Kubernetes Cluster (Region: us-east-1)...</p>}
                            {deployProgress > 40 && <p>> Configuring Load Balancer & SSL (LetsEncrypt)...</p>}
                            {deployProgress > 60 && <p>> Deploying Database Replicas...</p>}
                            {deployProgress > 80 && <p>> Warming up CDN Edge Nodes...</p>}
                            {deployProgress > 95 && <p>> Finalizing Health Checks...</p>}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Success Banner */}
                <div className="bg-gradient-to-r from-green-900/40 to-blue-900/40 border border-green-500/30 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <GlobeAltIcon className="w-32 h-32 text-green-400" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircleIcon className="w-8 h-8 text-green-400" />
                            <h2 className="text-2xl font-bold text-white">Deployment Successful</h2>
                        </div>
                        <p className="text-green-200 mb-4 max-w-2xl">
                            Your Aetherius OS platform is LIVE and accessible worldwide. Enterprise-grade security and auto-scaling are active.
                        </p>
                        <div className="flex items-center gap-4 bg-black/30 p-3 rounded-lg border border-green-500/20 w-fit">
                            <span className="text-xs text-green-400 font-bold">LIVE URL:</span>
                            <a href="#" className="text-sm font-mono text-white hover:underline">https://aetherius-os-deploy.google.space</a>
                            <ArrowPathIcon className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" title="Refresh Status"/>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard label="Uptime" value="99.99%" status="good" />
                    <MetricCard label="Response Time" value="42ms" status="good" />
                    <MetricCard label="Active Users" value="1.2M" status="neutral" />
                    <MetricCard label="Error Rate" value="0.001%" status="good" />
                </div>

                {/* Technical Specs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <ServerIcon className="w-5 h-5 text-purple-500"/> Infrastructure Status
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-gray-400">Region</span>
                                <span className="text-white">Global (Multi-Region)</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-gray-400">SSL Certificate</span>
                                <span className="text-green-400">Valid (Auto-Renew)</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-gray-400">CDN Caching</span>
                                <span className="text-green-400">Enabled (WebP Optimized)</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-700">
                                <span className="text-gray-400">Database</span>
                                <span className="text-white">Postgres + Redis (Sharded)</span>
                            </div>
                             <div className="flex justify-between py-2">
                                <span className="text-gray-400">Build Version</span>
                                <span className="text-white font-mono">v1.0.0 (d849bbaf)</span>
                            </div>
                        </div>
                    </div>

                     <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5 text-blue-500"/> Compliance & Security
                        </h3>
                         <div className="grid grid-cols-2 gap-2">
                            {['GDPR Compliant', 'SOC 2 Ready', 'HIPAA Ready', 'PCI DSS Ready'].map((tag, i) => (
                                <div key={i} className="bg-gray-900/50 border border-gray-600 rounded px-3 py-2 flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs text-gray-300">{tag}</span>
                                </div>
                            ))}
                            {['256-bit Encryption', 'DDoS Protection', 'SQL Injection Block', 'XSS Protection'].map((tag, i) => (
                                <div key={i} className="bg-gray-900/50 border border-gray-600 rounded px-3 py-2 flex items-center gap-2">
                                    <LockClosedIcon className="w-4 h-4 text-green-400" />
                                    <span className="text-xs text-gray-300">{tag}</span>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full bg-gray-900 text-gray-100 animate-fade-in font-sans overflow-hidden">
            {/* Sidebar Nav */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-700">
                    <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                        <CloudIcon className="w-6 h-6 text-blue-500" />
                        Cloud Ops
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Management Console v2.4</p>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {['Overview', 'Infrastructure', 'Security', 'Database', 'Integrations'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                        >
                            {tab === 'Overview' && <ChartBarIcon className="w-5 h-5"/>}
                            {tab === 'Infrastructure' && <ServerIcon className="w-5 h-5"/>}
                            {tab === 'Security' && <ShieldCheckIcon className="w-5 h-5"/>}
                            {tab === 'Database' && <CircleStackIcon className="w-5 h-5"/>}
                            {tab === 'Integrations' && <BoltIcon className="w-5 h-5"/>}
                            {tab}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className={`w-2 h-2 rounded-full ${isDeployed ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                        Status: {isDeployed ? 'SYSTEM OPERATIONAL' : 'OFFLINE'}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <h1 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-4 text-white">{activeTab}</h1>
                
                {activeTab === 'Overview' && renderOverview()}

                {activeTab === 'Infrastructure' && (
                    <div className="space-y-6 max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ToggleCard 
                                title="Auto-Scaling" 
                                desc="Automatically adjust server instances based on traffic load."
                                active={autoScale}
                                onToggle={() => setAutoScale(!autoScale)}
                            />
                            <ToggleCard 
                                title="Load Balancing" 
                                desc="Distribute traffic evenly across global regions."
                                active={loadBalance}
                                onToggle={() => setLoadBalance(!loadBalance)}
                            />
                             <ToggleCard 
                                title="CDN Caching" 
                                desc="Cache static assets at edge locations for <50ms latency."
                                active={cdnCache}
                                onToggle={() => setCdnCache(!cdnCache)}
                            />
                             <ToggleCard 
                                title="Image Optimization" 
                                desc="Auto-convert uploads to WebP format for speed."
                                active={webpOpt}
                                onToggle={() => setWebpOpt(!webpOpt)}
                            />
                        </div>
                        
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <GlobeAltIcon className="w-5 h-5 text-blue-400"/> Network Configuration
                            </h3>
                            <div className="space-y-4">
                                <InputField label="Custom RPC URL (Web3)" placeholder="https://mainnet.infura.io/v3/..." value="https://rpc.aetherius.net/v1/main" />
                                <InputField label="WebSocket Endpoint" placeholder="wss://..." value="wss://ws.aetherius.net/socket" />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Rate Limit (Req/Min)" placeholder="1000" value="5000" />
                                    <InputField label="Timeout (ms)" placeholder="5000" value="500" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Security' && (
                    <div className="space-y-6 max-w-4xl">
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                             <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <LockClosedIcon className="w-5 h-5 text-green-400"/> Authentication Protocols
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-900 p-3 rounded border border-gray-600 flex items-center justify-between">
                                    <span className="text-sm text-gray-300">OAuth 2.0</span>
                                    <StatusBadge status="ACTIVE"/>
                                </div>
                                <div className="bg-gray-900 p-3 rounded border border-gray-600 flex items-center justify-between">
                                    <span className="text-sm text-gray-300">JWT Session Management</span>
                                    <StatusBadge status="ACTIVE"/>
                                </div>
                                <div className="bg-gray-900 p-3 rounded border border-gray-600 flex items-center justify-between">
                                    <span className="text-sm text-gray-300">MFA Enforcement</span>
                                    <StatusBadge status="OPTIONAL"/>
                                </div>
                                <div className="bg-gray-900 p-3 rounded border border-gray-600 flex items-center justify-between">
                                    <span className="text-sm text-gray-300">Input Sanitization</span>
                                    <StatusBadge status="STRICT"/>
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-purple-400"/> Firewall Rules
                            </h3>
                             <div className="space-y-2">
                                {['Block SQL Injection Patterns', 'Block XSS Vectors', 'Enforce CORS (Strict Origin)', 'Geo-Block High Risk Regions'].map(rule => (
                                    <div key={rule} className="flex items-center gap-3 text-sm text-gray-300">
                                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                            <CheckCircleIcon className="w-3 h-3 text-white"/>
                                        </div>
                                        {rule}
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Database' && (
                     <div className="space-y-6 max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <MetricCard label="Query Latency" value="12ms" status="good" />
                            <MetricCard label="Active Connections" value="4,502" status="neutral" />
                            <MetricCard label="Cache Hit Rate" value="94%" status="good" />
                        </div>
                        
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h3 className="font-bold text-white mb-2">Database Management</h3>
                            <p className="text-sm text-gray-400 mb-6">Manage your distributed data clusters.</p>
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={handleSeed} 
                                    disabled={isSeeding}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSeeding ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <CircleStackIcon className="w-5 h-5"/>}
                                    {isSeeding ? 'Seeding Data...' : 'Seed Database'}
                                </button>
                                <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg flex items-center gap-2">
                                    <BoltIcon className="w-5 h-5"/> Optimize Index
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                * Seeding will populate tables with sample users, transactions, and content for testing.
                            </p>
                        </div>
                     </div>
                )}

                {activeTab === 'Integrations' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h3 className="font-bold text-white mb-4">API Credentials (Secrets)</h3>
                            <div className="space-y-4">
                                <InputField label="Stripe Secret Key" placeholder="sk_live_..." type="password" />
                                <InputField label="Twilio Account SID (SMS/VoIP)" placeholder="AC..." type="text" />
                                <InputField label="Twilio Auth Token" placeholder="..." type="password" />
                                <InputField label="SendGrid API Key (Email)" placeholder="SG...." type="password" />
                                <InputField label="OpenAI / Gemini API Key" placeholder="sk-..." type="password" value={process.env.API_KEY || ''} />
                            </div>
                             <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
                                <button className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-500">Save Securely</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
