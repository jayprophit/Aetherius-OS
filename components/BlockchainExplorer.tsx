
import React, { useState, useEffect, useCallback } from 'react';
import { CubeTransparentIcon, ClockIcon, CheckCircleIcon, TrophyIcon, HiveMindIcon, ServerIcon, UserCircleIcon, BoltIcon, ArrowPathIcon, ShieldCheckIcon, ScaleIcon } from './Icons';
import { achievements, mockValidators } from '../data';
import { ConsensusMechanism, Validator, Transaction, Block } from '../types';

// --- Constants & Utils ---

const generateHash = () => `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

const createGenesisBlock = (): Block => {
    const achievement = achievements[0];
    return {
        height: 68432,
        hash: generateHash(),
        timestamp: new Date(new Date().getTime() - 2 * 60 * 60 * 1000).toISOString(),
        consensusType: 'Proof-of-Work',
        validator: 'Genesis Node',
        transactions: [
            { hash: achievement.transactionId, type: 'CERTIFICATE_MINT', details: { course: achievement.courseTitle, user: 'John' } }
        ]
    };
};

const transactionTypes = {
    'CERTIFICATE_MINT': { icon: TrophyIcon, color: 'text-yellow-500' },
    'AI_INTERACTION_VERIFIED': { icon: HiveMindIcon, color: 'text-blue-500' },
    'GOVERNANCE_VOTE': { icon: CheckCircleIcon, color: 'text-purple-500' },
    'ASSET_TRANSFER': { icon: CheckCircleIcon, color: 'text-green-500' },
    'REPUTATION_SLASH': { icon: ScaleIcon, color: 'text-red-500' },
    'VALIDATOR_ELECTION': { icon: UserCircleIcon, color: 'text-indigo-500' },
};

const consensusDescriptions: Record<ConsensusMechanism, string> = {
    'Proof-of-Work': 'High security, energy-intensive. Validators solve cryptographic puzzles.',
    'Proof-of-Stake': 'Energy-efficient. Validators chosen based on staked tokens.',
    'Delegated Proof-of-Stake': 'Democratic. Token holders vote for delegate validators.',
    'Proof-of-Authority': 'Centralized efficiency. Approved identities validate blocks.',
    'Proof-of-History': 'Max throughput. Verifiable delay function creates historical record.',
    'Proof-of-Reputation': 'Meritocratic. Validators chosen by community trust score.',
};

// --- Components ---

const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
    const typeInfo = transactionTypes[tx.type] || { icon: CubeTransparentIcon, color: 'text-gray-500' };
    const TxIcon = typeInfo.icon;
    return (
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex items-start gap-3 animate-fade-in-up">
            <TxIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${typeInfo.color}`} />
            <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                    <p className="font-semibold text-sm">{tx.type.replace(/_/g, ' ')}</p>
                    <span className="text-[10px] text-gray-400">Confirmed</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate" title={tx.hash}>
                    {tx.hash}
                </p>
            </div>
        </div>
    );
};

const ValidatorCard: React.FC<{ validator: Validator; isActive: boolean }> = ({ validator, isActive }) => (
    <div className={`p-3 rounded-lg border flex items-center justify-between transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70'}`}>
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${validator.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
                <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{validator.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{validator.id}</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Rep: {validator.reputation}</p>
            <p className="text-[10px] text-gray-400">{validator.stake.toLocaleString()} staked</p>
        </div>
    </div>
);

export const BlockchainExplorer: React.FC = () => {
    const [blocks, setBlocks] = useState<Block[]>([createGenesisBlock()]);
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(blocks[0]);
    const [consensusMode, setConsensusMode] = useState<ConsensusMechanism>('Proof-of-Stake');
    const [autoSwitch, setAutoSwitch] = useState(true);
    const [networkLoad, setNetworkLoad] = useState(45); // 0-100
    const [validators, setValidators] = useState<Validator[]>(mockValidators);

    // --- Consensus Logic ---

    // Determine optimal consensus based on load (Simulated Auto-Switching)
    useEffect(() => {
        if (!autoSwitch) return;

        if (networkLoad > 80 && consensusMode !== 'Proof-of-History') {
            setConsensusMode('Proof-of-History'); // Switch to high throughput
        } else if (networkLoad > 60 && networkLoad <= 80 && consensusMode !== 'Delegated Proof-of-Stake') {
            setConsensusMode('Delegated Proof-of-Stake');
        } else if (networkLoad < 30 && consensusMode !== 'Proof-of-Work') {
            setConsensusMode('Proof-of-Work'); // Switch to high security
        } else if (networkLoad >= 30 && networkLoad <= 60 && consensusMode !== 'Proof-of-Stake') {
            setConsensusMode('Proof-of-Stake'); // Balanced
        }
    }, [networkLoad, autoSwitch, consensusMode]);

    // Helper to pick a validator based on the current consensus mechanism
    const selectValidator = useCallback(() => {
        const activeValidators = validators.filter(v => v.status === 'Active');
        
        switch (consensusMode) {
            case 'Proof-of-Reputation':
                return activeValidators.sort((a, b) => b.reputation - a.reputation)[0]; // Highest rep
            case 'Proof-of-Stake':
                // Weighted random based on stake
                const totalStake = activeValidators.reduce((acc, v) => acc + v.stake, 0);
                let random = Math.random() * totalStake;
                for (const v of activeValidators) {
                    random -= v.stake;
                    if (random <= 0) return v;
                }
                return activeValidators[0];
            case 'Delegated Proof-of-Stake':
                return activeValidators.sort((a, b) => (b.votes || 0) - (a.votes || 0))[0]; // Highest votes
            case 'Proof-of-Authority':
                return activeValidators.find(v => v.isAuthority) || activeValidators[0];
            default:
                return activeValidators[Math.floor(Math.random() * activeValidators.length)];
        }
    }, [consensusMode, validators]);

    // Block Generation Loop
    useEffect(() => {
        // Speed varies by consensus mechanism
        const speedMap: Record<ConsensusMechanism, number> = {
            'Proof-of-Work': 8000,
            'Proof-of-Stake': 4000,
            'Delegated Proof-of-Stake': 2000,
            'Proof-of-Authority': 1000,
            'Proof-of-History': 400, // Extremely fast
            'Proof-of-Reputation': 3000,
        };

        const interval = setInterval(() => {
            const lastBlock = blocks[0];
            const validator = selectValidator();
            
            const newBlock: Block = {
                height: lastBlock.height + 1,
                hash: generateHash(),
                timestamp: new Date().toISOString(),
                consensusType: consensusMode,
                validator: validator.name,
                transactions: [
                    { hash: generateHash(), type: 'AI_INTERACTION_VERIFIED', details: { agent: 'aether-0x7a8c', action: 'computation' } },
                    ...(Math.random() > 0.7 ? [{ hash: generateHash(), type: 'ASSET_TRANSFER' as const, details: { amount: 100, asset: 'AE' } }] : [])
                ],
            };
            setBlocks(prev => [newBlock, ...prev.slice(0, 99)]);
            
            // Fluctuate Network Load
            setNetworkLoad(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 10)));

        }, speedMap[consensusMode]);

        return () => clearInterval(interval);
    }, [blocks, consensusMode, selectValidator]);

    return (
        <div className="animate-fade-in h-full flex flex-col bg-gray-100 dark:bg-gray-900">
            <header className="p-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <CubeTransparentIcon className="w-7 h-7 text-blue-600"/> OmniChain Explorer
                    </h1>
                    
                    {/* Network Stats Pill */}
                    <div className="flex items-center gap-4 text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">TPS:</span>
                            <span className="font-bold text-green-500">{(networkLoad * (consensusMode === 'Proof-of-History' ? 50 : 5)).toFixed(0)}</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">Load:</span>
                            <div className="w-16 h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${networkLoad > 80 ? 'bg-red-500' : networkLoad > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                    style={{ width: `${networkLoad}%` }} 
                                />
                            </div>
                        </div>
                    </div>
                 </div>
            </header>

            {/* Modular Consensus Layer Control */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-800 p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ServerIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <div>
                            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">Active Consensus Layer</h3>
                            <p className="text-xs text-blue-600 dark:text-blue-400">{consensusMode}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Auto-Switch (Based on Load)</label>
                            <button 
                                onClick={() => setAutoSwitch(!autoSwitch)} 
                                className={`w-10 h-5 rounded-full transition-colors relative ${autoSwitch ? 'bg-green-500' : 'bg-gray-400'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${autoSwitch ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                        
                        <select 
                            value={consensusMode}
                            onChange={(e) => { setAutoSwitch(false); setConsensusMode(e.target.value as ConsensusMechanism); }}
                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Proof-of-Work">Proof-of-Work (PoW)</option>
                            <option value="Proof-of-Stake">Proof-of-Stake (PoS)</option>
                            <option value="Delegated Proof-of-Stake">Delegated PoS (DPoS)</option>
                            <option value="Proof-of-Authority">Proof-of-Authority (PoA)</option>
                            <option value="Proof-of-History">Proof-of-History (PoH)</option>
                            <option value="Proof-of-Reputation">Proof-of-Reputation (PoR)</option>
                        </select>
                    </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic border-t border-blue-200 dark:border-blue-800/30 pt-2">
                    {consensusDescriptions[consensusMode]}
                </p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Block List */}
                <aside className="w-72 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800">
                    <h2 className="p-3 font-semibold border-b border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-700/20">Real-time Blocks</h2>
                    <div className="flex-1 overflow-y-auto">
                        {blocks.map(block => (
                             <button key={block.height} onClick={() => setSelectedBlock(block)} className={`w-full text-left p-3 border-b border-gray-200 dark:border-gray-700 transition-colors ${selectedBlock?.height === block.height ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-l-4 border-l-transparent'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">#{block.height}</span>
                                    <span className="text-[10px] text-gray-400">{new Date(block.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex justify-between items-end mt-1">
                                     <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 truncate max-w-[100px]">{block.consensusType}</span>
                                     <span className="text-[10px] text-gray-500">{block.transactions.length} txs</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Block Details */}
                    <div className="flex-1 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
                        {selectedBlock ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                        <CubeTransparentIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Block #{selectedBlock.height}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            <ClockIcon className="w-4 h-4" />
                                            <span>{new Date(selectedBlock.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                     <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Validator</p>
                                        <p className="text-sm font-mono text-blue-600 dark:text-blue-400 truncate">{selectedBlock.validator}</p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Consensus</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">{selectedBlock.consensusType}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 font-mono text-xs space-y-2 break-all">
                                    <div><span className="text-gray-500 font-bold">Hash:</span> <span className="text-gray-700 dark:text-gray-300">{selectedBlock.hash}</span></div>
                                    <div><span className="text-gray-500 font-bold">Parent:</span> <span className="text-gray-700 dark:text-gray-300">{blocks.find(b => b.height === selectedBlock.height - 1)?.hash || '0xGenesis'}</span></div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">Transactions</h4>
                                    <div className="space-y-2">
                                        {selectedBlock.transactions.map(tx => <TransactionRow key={tx.hash} tx={tx}/>)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">Select a block to view details.</div>
                        )}
                    </div>

                    {/* Validator Network Side Panel */}
                    <div className="w-72 bg-gray-50 dark:bg-gray-900/30 flex flex-col overflow-hidden">
                         <h3 className="p-4 font-bold text-sm uppercase text-gray-500 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <BoltIcon className="w-4 h-4"/> Active Validators
                         </h3>
                         <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {validators.map(v => (
                                <ValidatorCard key={v.id} validator={v} isActive={selectedBlock?.validator === v.name} />
                            ))}
                         </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
