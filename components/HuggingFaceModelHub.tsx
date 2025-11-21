
import React, { useState, useEffect } from 'react';
import { SearchIcon, ArrowDownTrayIcon, PlayIcon, StopIcon, CpuChipIcon, ServerIcon, TrashIcon, CheckCircleIcon, CloudIcon, BeakerIcon } from './Icons';

interface HFModel {
    id: string;
    name: string;
    publisher: string;
    task: 'Text Generation' | 'Image Generation' | 'Reasoning (LRM)' | 'Audio';
    size: string;
    params: string;
    downloads: string;
    description: string;
    tags: string[];
}

const mockModels: HFModel[] = [
    {
        id: 'meta-llama/Meta-Llama-3-8B-Instruct',
        name: 'Llama 3 8B Instruct',
        publisher: 'Meta',
        task: 'Text Generation',
        size: '4.7 GB (Q4_K_M)',
        params: '8B',
        downloads: '2.5M',
        description: 'The official Meta Llama 3 8B Instruct model. Optimized for dialogue use cases.',
        tags: ['NLP', 'Chat', 'SOTA']
    },
    {
        id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
        name: 'DeepSeek R1 Distill',
        publisher: 'DeepSeek',
        task: 'Reasoning (LRM)',
        size: '5.1 GB (Q4_K_M)',
        params: '8B',
        downloads: '850k',
        description: 'Distilled "Deep Think" engine capable of multi-step reasoning, iterative refinement, and 512MB context for complex project building.',
        tags: ['Reasoning', 'CoT', 'Project Builder']
    },
    {
        id: 'Qwen/Qwen1.5-72B-Chat',
        name: 'Qwen 1.5 72B Chat',
        publisher: 'Alibaba Cloud',
        task: 'Text Generation',
        size: '40 GB (Q4_K_M)',
        params: '72B',
        downloads: '500k',
        description: 'High-performance 72B model matching GPT-4 on many benchmarks. Requires significant VRAM.',
        tags: ['Open Source', 'Multi-Language', 'Heavy']
    },
    {
        id: 'tiiuae/falcon-180B-chat',
        name: 'Falcon 180B',
        publisher: 'TII',
        task: 'Text Generation',
        size: '100 GB (Q2_K)',
        params: '180B',
        downloads: '200k',
        description: 'One of the largest open models available. Exceptional knowledge retention and reasoning.',
        tags: ['Research', 'Massive', 'Foundation']
    },
    {
        id: '01-ai/Yi-34B-Chat',
        name: 'Yi 34B Chat',
        publisher: '01.ai',
        task: 'Text Generation',
        size: '19 GB (Q4_K_M)',
        params: '34B',
        downloads: '350k',
        description: 'Strong bilingual (English/Chinese) capabilities and long context window support.',
        tags: ['Bilingual', 'Long Context']
    },
    {
        id: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
        name: 'TinyLlama 1.1B',
        publisher: 'TinyLlama',
        task: 'Text Generation',
        size: '0.7 GB',
        params: '1.1B',
        downloads: '1.5M',
        description: 'Extremely efficient model for edge devices and rapid prototyping.',
        tags: ['Mobile', 'Edge', 'Fast']
    },
    {
        id: 'mistralai/Mistral-7B-Instruct-v0.3',
        name: 'Mistral 7B v0.3',
        publisher: 'Mistral AI',
        task: 'Text Generation',
        size: '4.1 GB (Q4_K_M)',
        params: '7B',
        downloads: '1.2M',
        description: 'The latest 7B model from Mistral AI with improved function calling and context window.',
        tags: ['Efficient', 'Function Calling']
    },
    {
        id: 'google/gemma-7b-it',
        name: 'Gemma 7B IT',
        publisher: 'Google',
        task: 'Text Generation',
        size: '4.5 GB',
        params: '7B',
        downloads: '900k',
        description: 'Built from the same research and technology used to create the Gemini models.',
        tags: ['Open Weights', 'Google']
    },
    {
        id: 'stabilityai/stable-diffusion-xl-base-1.0',
        name: 'Stable Diffusion XL',
        publisher: 'Stability AI',
        task: 'Image Generation',
        size: '6.9 GB',
        params: '3.5B',
        downloads: '4.1M',
        description: 'A state-of-the-art latent text-to-image diffusion model.',
        tags: ['Art', 'Vision']
    },
    {
        id: 'microsoft/Phi-3-mini-4k-instruct',
        name: 'Phi-3 Mini',
        publisher: 'Microsoft',
        task: 'Text Generation',
        size: '2.2 GB',
        params: '3.8B',
        downloads: '600k',
        description: 'Highly capable small language model, punching way above its weight class.',
        tags: ['Mobile', 'Efficient']
    }
];

export const HuggingFaceModelHub: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'explore' | 'local'>('explore');
    const [downloading, setDownloading] = useState<Record<string, number>>({}); // modelId -> progress %
    const [localModels, setLocalModels] = useState<string[]>(['microsoft/Phi-3-mini-4k-instruct']); // Pre-installed
    const [runningModels, setRunningModels] = useState<string[]>([]);
    const [vramUsage, setVramUsage] = useState(1.2); // Start with OS overhead

    // Simulate download progress
    useEffect(() => {
        const interval = setInterval(() => {
            setDownloading(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(id => {
                    if (next[id] < 100) {
                        next[id] += Math.random() * 15; // Random progress
                        if (next[id] >= 100) {
                            next[id] = 100;
                            setLocalModels(curr => [...curr, id]);
                            // Auto-remove from downloading state after a moment could be handled, but we keep 100% for UI feedback
                        }
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 800);
        return () => clearInterval(interval);
    }, []);

    const handleDownload = (id: string) => {
        if (localModels.includes(id) || downloading[id] !== undefined) return;
        setDownloading(prev => ({ ...prev, [id]: 0 }));
    };

    const handleToggleRun = (id: string, sizeStr: string) => {
        // Extract size roughly for VRAM sim
        const sizeGB = parseFloat(sizeStr.split(' ')[0]) || 2; 
        
        if (runningModels.includes(id)) {
            setRunningModels(prev => prev.filter(m => m !== id));
            setVramUsage(prev => Math.max(1.2, prev - sizeGB));
        } else {
            setRunningModels(prev => [...prev, id]);
            setVramUsage(prev => prev + sizeGB);
        }
    };

    const handleDelete = (id: string) => {
        if (runningModels.includes(id)) {
             // Stop first
             const sizeStr = mockModels.find(m => m.id === id)?.size || '2 GB';
             handleToggleRun(id, sizeStr);
        }
        setLocalModels(prev => prev.filter(m => m !== id));
        // Also remove from downloading if it was there
        setDownloading(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const filteredModels = mockModels.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getDownloadStatus = (id: string) => {
        if (localModels.includes(id)) return 'installed';
        const progress = downloading[id];
        if (progress !== undefined) return progress >= 100 ? 'installed' : 'downloading';
        return 'none';
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 animate-fade-in">
            {/* Header */}
            <header className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                             <span className="text-3xl">🤗</span> Hugging Face Hub
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Discover and run open-source LLMs & LRMs locally on your Aetherius Node.</p>
                    </div>
                    {/* VRAM Monitor */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <CpuChipIcon className="w-5 h-5 text-blue-500" />
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">vQPU Memory</span>
                                <span className="text-sm font-mono font-bold text-gray-800 dark:text-gray-100">{vramUsage.toFixed(1)} / 24.0 GB</span>
                            </div>
                        </div>
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${vramUsage > 20 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${(vramUsage / 24) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-2">
                    {/* Tabs */}
                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('explore')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'explore' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
                        >
                            Explore Models
                        </button>
                        <button 
                            onClick={() => setActiveTab('local')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'local' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
                        >
                            Local Node ({localModels.length})
                        </button>
                    </div>
                    
                    {/* Search */}
                    <div className="relative w-64">
                        <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Filter models..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'explore' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredModels.map(model => {
                            const status = getDownloadStatus(model.id);
                            return (
                                <div key={model.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                            {model.task}
                                        </div>
                                        <span className="text-xs font-mono text-gray-500">{model.size}</span>
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">{model.name}</h3>
                                    <p className="text-xs text-blue-500 mb-3 font-mono">{model.id}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-1">{model.description}</p>
                                    
                                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                                        {model.tags.map(tag => (
                                            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <ArrowDownTrayIcon className="w-4 h-4" />
                                            {model.downloads}
                                        </div>
                                        
                                        {status === 'installed' ? (
                                            <button disabled className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-green-600 dark:text-green-400 rounded-lg text-sm font-semibold flex items-center gap-2">
                                                <CheckCircleIcon className="w-4 h-4" /> Installed
                                            </button>
                                        ) : status === 'downloading' ? (
                                            <div className="flex-1 ml-4">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span>Downloading...</span>
                                                    <span>{Math.round(downloading[model.id])}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${downloading[model.id]}%` }}></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleDownload(model.id)}
                                                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity"
                                            >
                                                Download
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {localModels.length === 0 && (
                            <div className="text-center py-20">
                                <CloudIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">No Local Models Found</h3>
                                <p className="text-gray-500 mt-2">Go to the Explore tab to download models to your virtual node.</p>
                            </div>
                        )}
                        {localModels.map(id => {
                            const model = mockModels.find(m => m.id === id) || {
                                id, 
                                name: id.split('/')[1] || id, 
                                task: 'Text Generation', 
                                size: 'Unknown', 
                                description: 'Imported Model',
                                publisher: 'User',
                                params: '?',
                                downloads: '0',
                                tags: []
                            } as HFModel;
                            const isRunning = runningModels.includes(id);
                            
                            return (
                                <div key={id} className={`bg-white dark:bg-gray-800 rounded-lg border p-4 flex items-center gap-6 transition-all ${isRunning ? 'border-green-500 ring-1 ring-green-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'}`}>
                                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <ServerIcon className={`w-8 h-8 ${isRunning ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{model.name}</h3>
                                            {isRunning && <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 text-xs font-bold rounded-full uppercase">Live on Port 8080</span>}
                                        </div>
                                        <p className="text-sm text-gray-500 font-mono">{model.id}</p>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><CpuChipIcon className="w-3 h-3"/> {model.size} VRAM</span>
                                            <span>{model.task}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleToggleRun(id, model.size)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-colors ${isRunning ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                        >
                                            {isRunning ? <><StopIcon className="w-4 h-4" /> Stop</> : <><PlayIcon className="w-4 h-4" /> Load & Serve</>}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                            title="Delete Model"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
