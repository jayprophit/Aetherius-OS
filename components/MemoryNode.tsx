
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MemoryVector } from '../types';
import { 
    CubeTransparentIcon, SearchIcon, PlusIcon, CodeBracketIcon, 
    CircleStackIcon, ChipIcon, BoltIcon, ClockIcon, ShareIcon, SparklesIcon
} from './Icons';

const initialMemories: MemoryVector[] = [
    { id: 'mem-001', content: "User prefers dark mode UI themes.", embedding: [0.2, 0.8], timestamp: "2024-05-10 09:30", type: "Conversation" },
    { id: 'mem-002', content: "Project Alpha deadline is June 1st.", embedding: [0.7, 0.3], timestamp: "2024-05-12 14:15", type: "Document" },
    { id: 'mem-003', content: "Python script for quantum annealing simulation.", embedding: [0.8, 0.2], timestamp: "2024-05-15 11:00", type: "Code" },
    { id: 'mem-004', content: "System error log: vQPU overload detected.", embedding: [0.1, 0.1], timestamp: "2024-05-16 03:45", type: "System" },
    { id: 'mem-005', content: "Meeting notes: Discussed neural link latency.", embedding: [0.6, 0.4], timestamp: "2024-05-18 16:20", type: "Document" },
];

// Python implementation code snippet (UPDATED)
const pythonImplementation = `
import faiss
import numpy as np
import hnswlib
import torch
import torch.nn as nn
from typing import List, Dict, Any
import time

# --- UPGRADE: Neuromorphic Spiking Extension ---
class SpikingContextCache(nn.Module):
    """
    Event-driven memory utilizing Leaky Integrate-and-Fire (LIF) neurons.
    Stores temporal patterns as synaptic weights.
    """
    def __init__(self, input_size, hidden_size):
        super().__init__()
        self.fc = nn.Linear(input_size, hidden_size)
        self.decay = 0.9 # Beta decay rate
        self.threshold = 1.0
        self.mem = None # Membrane potential

    def forward(self, x):
        # Initialize membrane potential if needed
        if self.mem is None:
            self.mem = torch.zeros(self.fc.out_features)
            
        # Synaptic integration (Input Current)
        cur = self.fc(x)
        
        # Leaky Integration
        self.mem = self.mem * self.decay + cur
        
        # Fire (Heaviside step function)
        spikes = (self.mem > self.threshold).float()
        
        # Reset potential after spike
        self.mem = self.mem * (1 - spikes)
        
        return spikes # Binary spike train output

class MemoryNode:
    """
    Long-term memory module using Vector Databases and Semantic Caching.
    Integrates with AI Agents for context retention.
    """
    def __init__(self, dim: int = 768):
        self.dim = dim
        
        # 1. Dense Vector Index (FAISS) for Long-Term Recall
        # Using HNSW (Hierarchical Navigable Small World) for fast approximate retrieval
        self.index = faiss.IndexHNSWFlat(dim, 32) 
        self.index.hnsw.efConstruction = 40
        
        # 2. Metadata Store (In-memory for simulation, Redis/Postgres in prod)
        self.metadata_store: Dict[int, Dict[str, Any]] = {}
        self.doc_count = 0
        
        # 3. Semantic Cache (HNSWlib) for optimizing frequent queries
        self.cache = hnswlib.Index(space='cosine', dim=dim)
        self.cache.init_index(max_elements=10000, ef_construction=200, M=16)
        self.cache.set_ef(50) # Search precision
        self.cache_map: Dict[int, Any] = {}
        
        # 4. Neuromorphic Layer (SNN)
        self.snn_cache = SpikingContextCache(dim, 1000)

    def embed(self, text: str) -> np.ndarray:
        """
        Simulated embedding function. 
        In production, use OpenAI ada-002 or a local Transformer model.
        """
        # Placeholder: Generate a consistent pseudo-random vector based on hash
        np.random.seed(abs(hash(text)) % (2**32))
        return np.random.rand(self.dim).astype('float32')

    def add_memory(self, text: str, meta: Dict[str, Any]):
        """Ingest new knowledge into the vector store."""
        vector = self.embed(text)
        
        # Add to FAISS
        self.index.add(np.array([vector]))
        self.metadata_store[self.doc_count] = {
            "text": text,
            "timestamp": time.time(),
            **meta
        }
        self.doc_count += 1
        print(f"[MemoryNode] Stored: {text[:30]}...")

    def retrieve(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context for an AI Agent.
        Checks Semantic Cache first, then queries Vector DB.
        """
        q_vector = self.embed(query)
        
        # 1. Check Semantic Cache (Threshold 0.95 similarity)
        labels, distances = self.cache.knn_query(q_vector, k=1)
        if distances[0][0] < 0.05: # Cosine distance
            print("[MemoryNode] Cache Hit!")
            return self.cache_map[labels[0][0]]

        # 2. Query Long-Term Memory (FAISS)
        D, I = self.index.search(np.array([q_vector]), k)
        
        results = []
        for idx, dist in zip(I[0], D[0]):
            if idx != -1:
                results.append({
                    "content": self.metadata_store[idx],
                    "score": float(dist)
                })
        
        # 3. Update Cache (Async)
        self._update_cache(q_vector, results)
        
        return results

    def _update_cache(self, vector, results):
        # Logic to add high-confidence results to HNSW cache
        pass
`;

const VectorVisualizer: React.FC<{ 
    memories: MemoryVector[], 
    queryVector?: number[] 
}> = ({ memories, queryVector }) => {
    return (
        <div className="relative w-full h-80 bg-black rounded-xl border border-gray-800 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-grid-slate-800/[0.1] bg-[center_40px_center]"></div>
            <div className="absolute top-1/2 left-0 w-full h-px bg-blue-900/50"></div>
            <div className="absolute left-1/2 top-0 h-full w-px bg-blue-900/50"></div>

            {/* Memories Points */}
            {memories.map(mem => (
                <div 
                    key={mem.id}
                    className="absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-500"
                    style={{ 
                        left: `${mem.embedding[0] * 100}%`, 
                        top: `${mem.embedding[1] * 100}%`,
                        backgroundColor: mem.type === 'Code' ? '#f59e0b' : mem.type === 'System' ? '#ef4444' : '#3b82f6'
                    }}
                >
                    {/* Tooltip */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-48 bg-gray-900 text-xs text-gray-300 p-2 rounded border border-gray-700 opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                        <p className="font-bold text-white mb-1">{mem.type}</p>
                        <p>{mem.content}</p>
                    </div>
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current"></div>
                </div>
            ))}

            {/* Query Point */}
            {queryVector && (
                 <div 
                    className="absolute w-4 h-4 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 border-4 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)] z-20 animate-pulse"
                    style={{ 
                        left: `${queryVector[0] * 100}%`, 
                        top: `${queryVector[1] * 100}%`,
                    }}
                >
                     <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-purple-900/80 text-purple-200 text-xs px-2 py-1 rounded">
                        Active Query
                    </div>
                </div>
            )}
        </div>
    );
};

const SpikingNetworkVisualizer: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    // Grid of 64 neurons (8x8)
    const gridSize = 8;
    const totalNeurons = gridSize * gridSize;
    
    // State for membrane potentials
    const [potentials, setPotentials] = useState<number[]>(new Array(totalNeurons).fill(0));
    const [spikes, setSpikes] = useState<boolean[]>(new Array(totalNeurons).fill(false));

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setPotentials(prevPotentials => {
                const newPotentials = [...prevPotentials];
                const newSpikes = new Array(totalNeurons).fill(false);

                for (let i = 0; i < totalNeurons; i++) {
                    // Decay
                    newPotentials[i] *= 0.9;
                    
                    // Random input noise (simulating synaptic currents)
                    if (Math.random() > 0.7) {
                        newPotentials[i] += Math.random() * 0.3;
                    }

                    // Fire?
                    if (newPotentials[i] >= 1.0) {
                        newSpikes[i] = true;
                        newPotentials[i] = 0.0; // Reset
                    }
                }
                setSpikes(newSpikes);
                return newPotentials;
            });
        }, 100); // 10Hz update for visual smoothness

        return () => clearInterval(interval);
    }, [isActive, totalNeurons]);

    return (
        <div className="relative w-full h-80 bg-black rounded-xl border border-gray-800 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            
            <div className="grid grid-cols-8 gap-3 p-6 z-10">
                {potentials.map((pot, idx) => {
                    const isSpiking = spikes[idx];
                    return (
                        <div 
                            key={idx}
                            className={`w-6 h-6 rounded-full transition-all duration-100 border border-gray-700 flex items-center justify-center ${isSpiking ? 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)] scale-125 z-20' : 'bg-gray-900'}`}
                            style={{
                                opacity: 0.3 + (pot * 0.7) // Brightness based on potential
                            }}
                        >
                            {isSpiking && <div className="w-full h-full rounded-full animate-ping bg-yellow-200 opacity-75 absolute"></div>}
                        </div>
                    );
                })}
            </div>
            
            <div className="absolute bottom-4 right-4 text-xs font-mono text-yellow-500 bg-black/50 px-2 py-1 rounded border border-yellow-500/30">
                SNN: LIF Neuron Model Active
            </div>
        </div>
    );
};

export const MemoryNode: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Dashboard' | 'Code'>('Dashboard');
    const [memories, setMemories] = useState<MemoryVector[]>(initialMemories);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MemoryVector[]>([]);
    const [queryVec, setQueryVec] = useState<number[] | undefined>(undefined);
    const [cacheHit, setCacheHit] = useState(false);
    const [architecture, setArchitecture] = useState<'Vector (Standard)' | 'Neuromorphic (SNN)'>('Vector (Standard)');

    // Stats
    const [indexSize, setIndexSize] = useState(1402);
    const [cacheHits, setCacheHits] = useState(842);

    // Simulate Embedding (2D for visualization)
    const mockEmbed = (text: string): number[] => {
        // Deterministic pseudo-random for consistent demo
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = (hash << 5) - hash + text.charCodeAt(i);
            hash |= 0;
        }
        const x = Math.abs((hash % 1000) / 1000);
        const y = Math.abs(((hash >> 10) % 1000) / 1000);
        return [x, y];
    };

    const handleIngest = () => {
        if (!inputText.trim()) return;
        
        const vector = mockEmbed(inputText);
        const newMem: MemoryVector = {
            id: `mem-${Date.now()}`,
            content: inputText,
            embedding: vector,
            timestamp: new Date().toLocaleString(),
            type: inputText.includes('def ') || inputText.includes('import ') ? 'Code' : 'Conversation'
        };
        
        setMemories(prev => [...prev, newMem]);
        setIndexSize(prev => prev + 1);
        setInputText('');
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setQueryVec(undefined);
            return;
        }

        const qVec = mockEmbed(searchQuery);
        setQueryVec(qVec);

        // Simulate retrieval (Euclidean distance in 2D for demo)
        const results = memories.map(mem => {
            const dist = Math.sqrt(
                Math.pow(mem.embedding[0] - qVec[0], 2) + 
                Math.pow(mem.embedding[1] - qVec[1], 2)
            );
            return { ...mem, score: 1 - dist }; // Similarity score
        })
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3);

        // Simulate Cache Hit
        const isHit = Math.random() > 0.7;
        setCacheHit(isHit);
        if (isHit) setCacheHits(prev => prev + 1);

        setSearchResults(results);
    };

    return (
        <div className="h-full bg-gray-900 text-gray-100 p-4 sm:p-6 overflow-y-auto animate-fade-in flex flex-col">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-purple-400">
                        <CircleStackIcon className="w-8 h-8" />
                        Universal Memory Architecture
                    </h1>
                    <p className="text-gray-400 mt-1 font-mono text-sm">
                        Unified Vector Protocol | Genesis ↔ Grandchild Compatible
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-purple-900/20 text-purple-300 px-3 py-1.5 rounded-full border border-purple-500/30 text-xs font-bold">
                        <ShareIcon className="w-4 h-4"/> Sync Protocol: OMNI-MEM-V1
                    </div>
                    <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                        <button 
                            onClick={() => setActiveTab('Dashboard')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'Dashboard' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Dashboard
                        </button>
                        <button 
                            onClick={() => setActiveTab('Code')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'Code' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Backend Code (Python)
                        </button>
                    </div>
                </div>
            </header>

            {activeTab === 'Dashboard' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                    {/* Left: Controls & Search */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Architecture Switcher */}
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Memory Engine</h3>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setArchitecture('Vector (Standard)')}
                                    className={`flex-1 py-2 text-xs font-bold rounded border transition-all ${architecture === 'Vector (Standard)' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'}`}
                                >
                                    Vector (HNSW)
                                </button>
                                <button 
                                    onClick={() => setArchitecture('Neuromorphic (SNN)')}
                                    className={`flex-1 py-2 text-xs font-bold rounded border transition-all ${architecture === 'Neuromorphic (SNN)' ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'}`}
                                >
                                    Neuromorphic
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                                <p className="text-xs text-gray-500 uppercase">{architecture === 'Neuromorphic (SNN)' ? 'Active Synapses' : 'Vector Index Size'}</p>
                                <p className="text-2xl font-bold text-white">{indexSize.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                                <p className="text-xs text-gray-500 uppercase">{architecture === 'Neuromorphic (SNN)' ? 'Spike Rate (Hz)' : 'Cache Hits'}</p>
                                <p className={`text-2xl font-bold ${architecture === 'Neuromorphic (SNN)' ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {architecture === 'Neuromorphic (SNN)' ? '240' : cacheHits.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Ingestion */}
                        <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
                            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                <PlusIcon className="w-4 h-4 text-blue-400"/> Ingest Memory
                            </h3>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Add new context/fact..."
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleIngest()}
                                />
                                <button onClick={handleIngest} className="bg-blue-600 hover:bg-blue-500 px-3 rounded-md text-white">
                                    <PlusIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>

                        {/* Retrieval */}
                        <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 flex-1">
                            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                <SearchIcon className="w-4 h-4 text-purple-400"/> Semantic Retrieval
                            </h3>
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Query knowledge base..."
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-500 px-3 rounded-md text-white">
                                    <SearchIcon className="w-4 h-4"/>
                                </button>
                            </div>

                            {/* Results */}
                            <div className="space-y-3">
                                {cacheHit && (
                                    <div className="bg-green-900/30 border border-green-500/30 text-green-300 px-3 py-2 rounded text-xs flex items-center gap-2">
                                        <BoltIcon className="w-3 h-3"/> Result served from Semantic Cache (1ms)
                                    </div>
                                )}
                                {searchResults.map((res, idx) => (
                                    <div key={idx} className="bg-gray-900 p-3 rounded-lg border border-gray-700 text-xs">
                                        <div className="flex justify-between mb-1 text-gray-400">
                                            <span>{res.type}</span>
                                            <span className="text-purple-400 font-mono">{((res.score || 0) * 100).toFixed(1)}% Match</span>
                                        </div>
                                        <p className="text-gray-200">{res.content}</p>
                                    </div>
                                ))}
                                {searchResults.length === 0 && queryVec && (
                                    <p className="text-center text-gray-500 text-sm py-4">No high-confidence matches found.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Visualizer */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="bg-gray-800 p-1 rounded-xl border border-gray-700 shadow-2xl">
                            <div className="bg-black rounded-lg p-4 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-300">
                                    {architecture === 'Neuromorphic (SNN)' ? 'Spiking Neural Network Activity (LIF)' : 'HNSW Vector Space Projection (2D)'}
                                </h3>
                                <div className="flex gap-3 text-[10px] text-gray-500">
                                    {architecture === 'Vector (Standard)' ? (
                                        <>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Conversation</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Code</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> System</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div> Active Spike</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-700"></div> Resting Potential</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="p-4">
                                {architecture === 'Neuromorphic (SNN)' ? (
                                    <SpikingNetworkVisualizer isActive={true} />
                                ) : (
                                    <VectorVisualizer memories={memories} queryVector={queryVec} />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                    <ChipIcon className="w-4 h-4"/> FAISS Index Config
                                </h4>
                                <ul className="text-xs space-y-1 text-gray-300 font-mono">
                                    <li>Type: IndexHNSWFlat</li>
                                    <li>Dimensions: 768</li>
                                    <li>Metric: L2 Distance</li>
                                    <li>M (Links): 32</li>
                                    <li>efConstruction: 40</li>
                                </ul>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                    {architecture === 'Neuromorphic (SNN)' ? (
                                        <><BoltIcon className="w-4 h-4 text-yellow-500"/> Energy Metrics</>
                                    ) : (
                                        <><ClockIcon className="w-4 h-4"/> Semantic Cache Config</>
                                    )}
                                </h4>
                                {architecture === 'Neuromorphic (SNN)' ? (
                                    <ul className="text-xs space-y-1 text-yellow-300 font-mono">
                                        <li>Efficiency: ~2 pJ/spike</li>
                                        <li>Resolution: 1ms</li>
                                        <li>Sparsity: 95%</li>
                                        <li>Recall Speed: Instant</li>
                                    </ul>
                                ) : (
                                    <ul className="text-xs space-y-1 text-gray-300 font-mono">
                                        <li>Type: HNSW (Cosine)</li>
                                        <li>Threshold: 0.95</li>
                                        <li>TTL: 24 Hours</li>
                                        <li>Capacity: 10,000 Vectors</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-black rounded-xl border border-gray-700 overflow-hidden flex flex-col">
                    <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                        <CodeBracketIcon className="w-4 h-4 text-blue-400"/>
                        <span className="text-xs font-mono text-gray-300">backend/services/memory_node/core.py</span>
                    </div>
                    <pre className="flex-1 overflow-y-auto p-4 text-xs font-mono text-gray-300 leading-relaxed">
                        <code className="language-python">
                            {pythonImplementation}
                        </code>
                    </pre>
                </div>
            )}
        </div>
    );
};
