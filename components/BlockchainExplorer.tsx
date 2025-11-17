import React, { useState, useEffect } from 'react';
import { CubeTransparentIcon, ClockIcon, CheckCircleIcon, TrophyIcon, HiveMindIcon } from './Icons';
import { achievements } from '../data';

interface Transaction {
    hash: string;
    type: 'CERTIFICATE_MINT' | 'AI_INTERACTION_VERIFIED' | 'GOVERNANCE_VOTE' | 'ASSET_TRANSFER';
    details: any;
}

interface Block {
    height: number;
    hash: string;
    timestamp: string;
    transactions: Transaction[];
}

const generateHash = () => `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

const createGenesisBlock = (): Block => {
    const achievement = achievements[0];
    return {
        height: 68432,
        hash: generateHash(),
        timestamp: new Date(new Date().getTime() - 2 * 60 * 60 * 1000).toISOString(),
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
};

const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
    const TxIcon = transactionTypes[tx.type].icon;
    const color = transactionTypes[tx.type].color;
    return (
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex items-start gap-3">
            <TxIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${color}`} />
            <div>
                <p className="font-semibold text-sm">{tx.type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate" title={tx.hash}>
                    Hash: {tx.hash.substring(0, 32)}...
                </p>
            </div>
        </div>
    );
};

export const BlockchainExplorer: React.FC = () => {
    const [blocks, setBlocks] = useState<Block[]>([createGenesisBlock()]);
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(blocks[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            const lastBlock = blocks[0];
            const newBlock: Block = {
                height: lastBlock.height + 1,
                hash: generateHash(),
                timestamp: new Date().toISOString(),
                transactions: [
                    { hash: generateHash(), type: 'AI_INTERACTION_VERIFIED', details: { agent: 'aether-0x7a8c', action: 'send_email' } },
                    ...(Math.random() > 0.7 ? [{ hash: generateHash(), type: 'GOVERNANCE_VOTE' as const, details: { proposal: '#102', choice: 'Yes' } }] : [])
                ],
            };
            setBlocks(prev => [newBlock, ...prev.slice(0, 99)]);
        }, 10000); // New block every 10 seconds
        return () => clearInterval(interval);
    }, [blocks]);

    return (
        <div className="animate-fade-in h-full flex flex-col bg-gray-100 dark:bg-gray-900">
            <header className="p-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                 <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <CubeTransparentIcon className="w-7 h-7"/> Aetherius Blockchain Explorer
                </h1>
            </header>
            <div className="flex-1 flex overflow-hidden">
                {/* Block List */}
                <aside className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <h2 className="p-3 font-semibold border-b border-gray-200 dark:border-gray-700">Latest Blocks</h2>
                    <div className="flex-1 overflow-y-auto">
                        {blocks.map(block => (
                             <button key={block.height} onClick={() => setSelectedBlock(block)} className={`w-full text-left p-3 border-b border-gray-200 dark:border-gray-700 ${selectedBlock?.height === block.height ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-blue-600 dark:text-blue-400">Block #{block.height}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{block.transactions.length} txns</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate mt-1" title={block.hash}>
                                    {block.hash}
                                </p>
                            </button>
                        ))}
                    </div>
                </aside>
                {/* Block Details */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {selectedBlock ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-3xl font-bold">Block #{selectedBlock.height}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>{new Date(selectedBlock.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 font-mono text-sm space-y-2">
                                <p><strong>Hash:</strong> {selectedBlock.hash}</p>
                                <p><strong>Parent Hash:</strong> {blocks.find(b => b.height === selectedBlock.height - 1)?.hash || '0x' + '0'.repeat(64)}</p>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-3">Transactions ({selectedBlock.transactions.length})</h4>
                                <div className="space-y-3">
                                    {selectedBlock.transactions.map(tx => <TransactionRow key={tx.hash} tx={tx}/>)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">Select a block to view details.</div>
                    )}
                </main>
            </div>
        </div>
    );
};
