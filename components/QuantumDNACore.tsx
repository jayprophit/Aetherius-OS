
import React, { useState, useEffect, useRef } from 'react';
import { DnaIcon, ScaleIcon, ShieldCheckIcon, LockClosedIcon, ArrowPathIcon, CheckCircleIcon, SparklesIcon } from './Icons';

// --- Visualizer Components ---

const EntanglementVisualizer: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            <div className={`absolute inset-0 border-2 border-cyan-500/30 rounded-full ${isActive ? 'animate-ping' : ''}`}></div>
            <div className={`absolute w-32 h-32 border-2 border-purple-500/30 rounded-full ${isActive ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '3s' }}></div>
            
            {/* Particle 1 (Physical) */}
            <div className={`absolute w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-1000 ${isActive ? 'translate-x-10' : ''}`}></div>
            
            {/* Particle 2 (Digital) */}
            <div className={`absolute w-4 h-4 bg-purple-400 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)] transition-all duration-1000 ${isActive ? '-translate-x-10' : ''}`}></div>
            
            {isActive && (
                <div className="absolute h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 w-20 animate-pulse"></div>
            )}
            
            <div className="absolute text-[10px] font-mono text-white mt-24 bg-black/60 px-2 rounded">
                {isActive ? 'ENTANGLEMENT: LOCKED' : 'STATUS: IDLE'}
            </div>
        </div>
    );
};

const MaatScales: React.FC<{ verifying: boolean, verified: boolean }> = ({ verifying, verified }) => {
    const [tilt, setTilt] = useState(0);

    useEffect(() => {
        if (verifying) {
            const interval = setInterval(() => {
                setTilt(Math.sin(Date.now() / 200) * 15);
            }, 50);
            return () => clearInterval(interval);
        } else if (verified) {
            setTilt(0);
        } else {
            setTilt(-10); // Imbalanced default
        }
    }, [verifying, verified]);

    return (
        <div className="relative w-40 h-32 flex flex-col items-center">
             {/* Beam */}
             <div 
                className="w-32 h-1 bg-yellow-500 relative transition-transform duration-300"
                style={{ transform: `rotate(${tilt}deg)` }}
             >
                 {/* Left Pan (Heart/Intent) */}
                 <div className="absolute left-0 top-0 flex flex-col items-center">
                     <div className="h-8 w-0.5 bg-yellow-500/50"></div>
                     <div className="w-8 h-8 rounded-full border-b-2 border-yellow-500 bg-yellow-500/10 flex items-center justify-center">
                        <span className="text-xs">❤️</span>
                     </div>
                 </div>
                 {/* Right Pan (Feather/Truth) */}
                 <div className="absolute right-0 top-0 flex flex-col items-center">
                     <div className="h-8 w-0.5 bg-yellow-500/50"></div>
                     <div className="w-8 h-8 rounded-full border-b-2 border-yellow-500 bg-yellow-500/10 flex items-center justify-center">
                        <span className="text-xs">🪶</span>
                     </div>
                 </div>
             </div>
             {/* Base */}
             <div className="w-1 h-16 bg-yellow-600 mt-[-2px]"></div>
             <div className="w-16 h-2 bg-yellow-700 rounded-t-lg"></div>
        </div>
    );
};

interface GeneticBlock {
    id: number;
    hash: string;
    data: string; // Simplified DNA string
    timestamp: string;
    verified: boolean;
}

export const QuantumDNACore: React.FC = () => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [isEntangled, setIsEntangled] = useState(false);
    const [verificationStage, setVerificationStage] = useState<'idle' | 'scanning' | 'weighing' | 'complete'>('idle');
    const [blocks, setBlocks] = useState<GeneticBlock[]>([
        { id: 0, hash: '0xGenesis...DNA', data: 'ATCG...BASE', timestamp: '2024-01-01 00:00', verified: true }
    ]);

    const handleVerify = () => {
        if (isVerifying || isEntangled) return;
        setIsVerifying(true);
        setVerificationStage('scanning');

        // 1. Scan DNA / Entangle
        setTimeout(() => {
            setVerificationStage('weighing');
            
            // 2. Maat's Judgment
            setTimeout(() => {
                setVerificationStage('complete');
                setIsEntangled(true);
                setIsVerifying(false);
                
                // 3. Mint Block
                const newBlock: GeneticBlock = {
                    id: blocks.length,
                    hash: `0x${Math.random().toString(16).substr(2, 10)}...VERIFIED`,
                    data: 'GCTA...SYNC',
                    timestamp: new Date().toLocaleString(),
                    verified: true
                };
                setBlocks(prev => [newBlock, ...prev]);

            }, 3000);
        }, 3000);
    };

    return (
        <div className="h-full bg-gray-950 text-cyan-50 p-6 overflow-y-auto animate-fade-in font-sans">
            {/* Header */}
            <header className="mb-8 border-b border-cyan-900/30 pb-4">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-cyan-400">
                    <DnaIcon className="w-8 h-8" />
                    Quantum DNA Core
                </h1>
                <p className="text-cyan-200/60 mt-1 text-sm">
                    Bio-Digital Identity Fusion | Maat-Verified Immutable Ledger
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Panel: Verification & Entanglement */}
                <section className="bg-gray-900/50 border border-cyan-800/30 rounded-xl p-8 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                    
                    <h2 className="text-xl font-bold mb-6 text-cyan-100 z-10">Identity Entanglement</h2>
                    
                    <div className="mb-8 z-10">
                        <EntanglementVisualizer isActive={isEntangled || verificationStage === 'scanning'} />
                    </div>

                    <div className="mb-8 z-10 h-32 flex items-center justify-center">
                        {verificationStage === 'idle' && <p className="text-sm text-gray-400">System Standby. Initiate Helix Sync.</p>}
                        {verificationStage === 'scanning' && <p className="text-sm text-cyan-400 animate-pulse">Scanning Bio-Signature...</p>}
                        {verificationStage === 'weighing' && (
                            <div className="flex flex-col items-center">
                                <p className="text-sm text-yellow-400 mb-2">Weighing Intent against Truth...</p>
                                <MaatScales verifying={true} verified={false} />
                            </div>
                        )}
                        {verificationStage === 'complete' && (
                            <div className="flex flex-col items-center animate-fade-in-up">
                                <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
                                    <CheckCircleIcon className="w-5 h-5" /> Verified
                                </div>
                                <MaatScales verifying={false} verified={true} />
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleVerify}
                        disabled={isVerifying || isEntangled}
                        className={`w-full max-w-xs py-3 rounded-lg font-bold text-sm transition-all z-10 flex items-center justify-center gap-2 ${
                            isEntangled ? 'bg-green-900/20 text-green-400 border border-green-500/50 cursor-default' :
                            isVerifying ? 'bg-gray-800 text-gray-500 cursor-wait' :
                            'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                        }`}
                    >
                        {isEntangled ? (
                            <>Identity Synced <LockClosedIcon className="w-4 h-4"/></>
                        ) : isVerifying ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin"/>
                        ) : (
                            <>Verify & Entangle <SparklesIcon className="w-4 h-4"/></>
                        )}
                    </button>
                </section>

                {/* Right Panel: Genomic Blockchain */}
                <section className="bg-gray-900/50 border border-purple-900/30 rounded-xl p-6 flex flex-col">
                    <header className="flex justify-between items-center mb-4 border-b border-purple-900/20 pb-2">
                        <h2 className="text-lg font-bold text-purple-200 flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5 text-purple-500"/> Genomic Ledger
                        </h2>
                        <span className="text-xs font-mono text-purple-400/60">Chain ID: MAAT-01</span>
                    </header>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {blocks.map((block) => (
                            <div key={block.id} className="bg-black/40 border border-purple-500/20 p-3 rounded-lg flex items-start gap-3 hover:border-purple-500/50 transition-colors">
                                <div className="mt-1">
                                    <div className="w-8 h-8 bg-purple-900/20 rounded flex items-center justify-center text-purple-400 font-bold text-xs">
                                        #{block.id}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-mono text-gray-400 truncate" title={block.hash}>{block.hash}</span>
                                        <span className="text-[10px] text-gray-500">{block.timestamp.split(',')[1]}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 flex-1 bg-gray-800 rounded overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 w-full opacity-50"></div>
                                        </div>
                                        <ScaleIcon className="w-3 h-3 text-yellow-500" title="Maat Verified"/>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 font-mono">Data: {block.data}</p>
                                </div>
                            </div>
                        ))}
                        
                        {blocks.length === 1 && (
                            <div className="text-center py-10 text-gray-600 text-sm italic">
                                Waiting for new genetic data...
                            </div>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
};
