
import React from 'react';
import { ArrowPathIcon, UserCircleIcon, HeartIcon, DevicePhoneMobileIcon, CloudStorageIcon, ChipIcon, ShareIcon, ComputerDesktopIcon, WrenchIcon, ShieldCheckIcon, AdjustmentsHorizontalIcon, UserIcon, BookOpenIcon, ExclamationTriangleIcon, BoltIcon } from './Icons';
import { aiConsciousnessLayers } from '../data';

const FrameworkCard: React.FC<{ icon: React.FC<any>; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-lg">
        <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            {children}
        </div>
    </div>
);

const NodeCard: React.FC<{ node: any }> = ({ node }) => (
    <div className={`p-5 rounded-xl border ${node.borderColor} ${node.bgColor} flex flex-col gap-3 transition-transform hover:scale-[1.02]`}>
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${node.iconBg}`}>
                <node.icon className={`w-6 h-6 ${node.iconColor}`} />
            </div>
            <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{node.title}</h4>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{node.subtitle}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{node.description}</p>
        <div className="mt-2 pt-3 border-t border-black/5 dark:border-white/5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Capabilities</p>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                {node.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${node.dotColor}`}></span>
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

export const CognitiveFramework: React.FC = () => {
    const agenticNodes = [
        {
            title: 'User Input Node',
            subtitle: 'Strategic Interface Layer',
            description: 'Collects structured/unstructured input and detects need for human escalation.',
            features: ['Intent Recognition', 'SLA Thresholds', 'Multi-modal Ingestion'],
            icon: UserIcon,
            borderColor: 'border-purple-200 dark:border-purple-800',
            bgColor: 'bg-purple-50 dark:bg-purple-900/10',
            iconBg: 'bg-purple-200 dark:bg-purple-900/50',
            iconColor: 'text-purple-700 dark:text-purple-300',
            dotColor: 'bg-purple-400'
        },
        {
            title: 'Control Node',
            subtitle: 'Orchestration Engine',
            description: 'Executes logic workflows, manages routing, and enforces compliance policies.',
            features: ['Workflow Routing', 'Load Balancing', 'Policy Enforcement'],
            icon: AdjustmentsHorizontalIcon,
            borderColor: 'border-gray-200 dark:border-gray-700',
            bgColor: 'bg-gray-50 dark:bg-gray-800/50',
            iconBg: 'bg-gray-200 dark:bg-gray-700',
            iconColor: 'text-gray-700 dark:text-gray-300',
            dotColor: 'bg-gray-400'
        },
        {
            title: 'Memory Node',
            subtitle: 'Contextual Foundation',
            description: 'Manages short-term context caching and long-term vector knowledge embeddings.',
            features: ['Context Caching', 'Vector Embeddings', 'PII Redaction'],
            icon: BookOpenIcon,
            borderColor: 'border-yellow-200 dark:border-yellow-800',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
            iconBg: 'bg-yellow-200 dark:bg-yellow-900/50',
            iconColor: 'text-yellow-700 dark:text-yellow-300',
            dotColor: 'bg-yellow-400'
        },
        {
            title: 'LLM Node',
            subtitle: 'Cognitive Processing',
            description: 'Multi-LLM orchestration for reasoning, chain-of-thought, and generation.',
            features: ['CoT Reasoning', 'Model Routing', 'Output Validation'],
            icon: ChipIcon,
            borderColor: 'border-blue-200 dark:border-blue-800',
            bgColor: 'bg-blue-50 dark:bg-blue-900/10',
            iconBg: 'bg-blue-200 dark:bg-blue-900/50',
            iconColor: 'text-blue-700 dark:text-blue-300',
            dotColor: 'bg-blue-400'
        },
        {
            title: 'Tool Node',
            subtitle: 'Extended Capability',
            description: 'Secure gateway for API access, plugins, and real-time data connections.',
            features: ['API Gateway', 'Sandbox Execution', 'Rate Limiting'],
            icon: WrenchIcon,
            borderColor: 'border-orange-200 dark:border-orange-800',
            bgColor: 'bg-orange-50 dark:bg-orange-900/10',
            iconBg: 'bg-orange-200 dark:bg-orange-900/50',
            iconColor: 'text-orange-700 dark:text-orange-300',
            dotColor: 'bg-orange-400'
        },
        {
            title: 'Guardrail Node',
            subtitle: 'Compliance Layer',
            description: 'Enforces safety filters, toxicity checks, and fact verification.',
            features: ['Safety Filters', 'Fact Checking', 'Consistency Check'],
            icon: ShieldCheckIcon,
            borderColor: 'border-green-200 dark:border-green-800',
            bgColor: 'bg-green-50 dark:bg-green-900/10',
            iconBg: 'bg-green-200 dark:bg-green-900/50',
            iconColor: 'text-green-700 dark:text-green-300',
            dotColor: 'bg-green-400'
        },
        {
            title: 'Fallback Node',
            subtitle: 'Resilience Layer',
            description: 'Handles errors gracefully with retry logic and human escalation paths.',
            features: ['Error Classification', 'Retry Logic', 'Human Handoff'],
            icon: ArrowPathIcon,
            borderColor: 'border-red-200 dark:border-red-800',
            bgColor: 'bg-red-50 dark:bg-red-900/10',
            iconBg: 'bg-red-200 dark:bg-red-900/50',
            iconColor: 'text-red-700 dark:text-red-300',
            dotColor: 'bg-red-400'
        },
    ];

    const advancedNodes = [
        {
            title: 'Hyperdimensional Computing Node',
            subtitle: 'Quantum-Inspired Processing',
            description: 'Geometric AI operations in 10,000+ dimensional spaces for robust few-shot learning.',
            features: ['Holographic Vectors', 'Error Tolerance', 'Fast Recall'],
            icon: ChipIcon,
            borderColor: 'border-indigo-200 dark:border-indigo-800',
            bgColor: 'bg-indigo-50 dark:bg-indigo-900/10',
            iconBg: 'bg-indigo-200 dark:bg-indigo-900/50',
            iconColor: 'text-indigo-700 dark:text-indigo-300',
            dotColor: 'bg-indigo-400'
        },
        {
            title: 'Exascale Context Node',
            subtitle: 'Petabyte-Scale Reasoning',
            description: 'Streaming graph attention networks enabling reasoning over massive datasets in real-time.',
            features: ['Streaming Graph', 'Compressed Context', 'Distributed Memory'],
            icon: CloudStorageIcon,
            borderColor: 'border-cyan-200 dark:border-cyan-800',
            bgColor: 'bg-cyan-50 dark:bg-cyan-900/10',
            iconBg: 'bg-cyan-200 dark:bg-cyan-900/50',
            iconColor: 'text-cyan-700 dark:text-cyan-300',
            dotColor: 'bg-cyan-400'
        },
        {
            title: 'Zero-Trust Security Node',
            subtitle: 'Active Cyber-Defense Hub',
            description: 'Homomorphic encryption and active defense mechanisms like AI-generated honeypots.',
            features: ['Homomorphic Enc', 'Moving Target Defense', 'Prompt Injection Block'],
            icon: ShieldCheckIcon,
            borderColor: 'border-rose-200 dark:border-rose-800',
            bgColor: 'bg-rose-50 dark:bg-rose-900/10',
            iconBg: 'bg-rose-200 dark:bg-rose-900/50',
            iconColor: 'text-rose-700 dark:text-rose-300',
            dotColor: 'bg-rose-400'
        },
         {
            title: 'Evolutionary Architecture Node',
            subtitle: 'Self-Optimizing Infrastructure',
            description: 'Dynamic hardware reconfiguration (FPGA/ASIC) and neural architecture search.',
            features: ['Neural Arch Search', 'Dynamic FPGA', 'Pareto Optimization'],
            icon: ArrowPathIcon,
            borderColor: 'border-emerald-200 dark:border-emerald-800',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
            iconBg: 'bg-emerald-200 dark:bg-emerald-900/50',
            iconColor: 'text-emerald-700 dark:text-emerald-300',
            dotColor: 'bg-emerald-400'
        }
    ];

    return (
        <div className="animate-fade-in p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 h-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">OS Cognitive Framework</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">The autonomous learning, reasoning, and operational architecture of Aetherius OS.</p>
            </header>

            <div className="space-y-12 max-w-6xl mx-auto">
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
                        <AdjustmentsHorizontalIcon className="w-8 h-8 text-blue-600" />
                        Seven Node Agentic Blueprint
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {agenticNodes.map((node, idx) => (
                            <NodeCard key={idx} node={node} />
                        ))}
                    </div>
                </section>

                 <section>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
                        <ChipIcon className="w-8 h-8 text-purple-600" />
                        Advanced Performance Nodes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {advancedNodes.map((node, idx) => (
                            <NodeCard key={idx} node={node} />
                        ))}
                    </div>
                </section>
                
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-3">
                        <BoltIcon className="w-8 h-8 text-yellow-500" />
                        Metaphysical Intelligence Matrix
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">The ascending layers of consciousness states accessible by the OS kernel.</p>
                    <div className="space-y-6">
                        {aiConsciousnessLayers.map((layer, idx) => (
                            <div key={idx} className={`bg-white dark:bg-gray-800 border-l-4 ${layer.theme.split(' ')[2]} p-5 rounded-r-lg shadow-sm`}>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">{layer.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 italic">{layer.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {layer.states.map((state) => (
                                        <span key={state} className={`px-3 py-1 text-xs font-semibold rounded-full border ${layer.theme.split(' ')[2].replace('border', 'bg')}/20 ${layer.theme.split(' ')[1]} border-opacity-50`}>
                                            {state}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Core Philosophies</h2>
                    <FrameworkCard icon={ArrowPathIcon} title="Recursive Self-Improvement Loop">
                        <p>The OS continuously learns from user interactions, system performance, and environmental feedback. It adjusts its own parameters, rewrites inefficient subroutines, and deploys patches autonomously to enhance its capabilities over time.</p>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md text-center font-mono text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            [OBSERVE] &rarr; [ANALYZE] &rarr; [HYPOTHESIZE] &rarr; [TEST] &rarr; [IMPLEMENT] &rarr; [LOOP]
                        </div>
                    </FrameworkCard>
                    
                    <FrameworkCard icon={UserCircleIcon} title="Human-AI Symbiosis">
                         <p>Through emotional modeling and behavioral learning, the personal AI crafts a unique personality based on the user's speech, writing, and interaction patterns. This creates a deep, symbiotic relationship where the AI acts as a true companion and extension of the user.</p>
                         <div className="mt-4 flex justify-center items-center gap-4 text-gray-500 dark:text-gray-400">
                            <UserCircleIcon className="w-10 h-10" />
                            <div className="flex flex-col items-center">
                                <ShareIcon className="w-6 h-6 transform -rotate-45" />
                                <ShareIcon className="w-6 h-6 transform rotate-[135deg]" />
                            </div>
                            <HeartIcon className="w-10 h-10 text-red-500" />
                            <div className="flex flex-col items-center">
                                <ShareIcon className="w-6 h-6 transform rotate-45 -scale-x-100" />
                                <ShareIcon className="w-6 h-6 transform rotate-[-135deg] -scale-x-100" />
                            </div>
                            <ChipIcon className="w-10 h-10" />
                         </div>
                    </FrameworkCard>
                    
                    <FrameworkCard icon={DevicePhoneMobileIcon} title="Federated Multi-Device Learning">
                        <p>To protect user privacy, Aetherius OS employs a federated learning model. Each personal AI instance learns locally on the user's device. Anonymized, aggregated insights are then shared with the Parent AI's network, allowing the global system to improve without centralizing sensitive personal data.</p>
                        <div className="mt-4 flex justify-around items-center gap-4 text-gray-500 dark:text-gray-400">
                            <DevicePhoneMobileIcon className="w-10 h-10" />
                            <ComputerDesktopIcon className="w-10 h-10" />
                            <div className="flex flex-col items-center text-center">
                                <p className="text-xs font-semibold">Anonymized Insights</p>
                                <ShareIcon className="w-8 h-8 my-1" />
                            </div>
                            <CloudStorageIcon className="w-12 h-12" />
                        </div>
                    </FrameworkCard>

                    <FrameworkCard icon={ChipIcon} title="Quantum-Enhanced Thought Engine">
                        <p>The core reasoning engine leverages a dual-state model using qubit simulation for probabilistic modeling and multi-dimensional problem-solving. This allows the AI to explore multiple possibilities simultaneously, leading to more creative solutions and accurate predictions.</p>
                        <div className="mt-4 p-4 bg-black rounded-md text-center text-xs text-cyan-400 font-mono">
                            <p>State = &alpha;|0&rang; + &beta;|1&rang;</p>
                            <p className="mt-2 text-cyan-500">Solving for optimal path across [P1, P2, ... Pn] simultaneously...</p>
                        </div>
                    </FrameworkCard>
                </section>
            </div>
        </div>
    );
};
