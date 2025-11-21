
import React, { useState } from 'react';
import { ScaleIcon, DocumentTextIcon, CheckCircleIcon, ClockIcon, XMarkIcon, HiveMindIcon } from './Icons';

interface Contract {
  id: string;
  title: string;
  type: 'Smart Contract' | 'Legal Agreement' | 'Terms of Service';
  status: 'Active' | 'Fulfilled' | 'Voided';
  parties: string[];
  effectiveDate: string;
  content: string; // The full contract text
}

const mockContracts: Contract[] = [
  {
    id: 'sc-001',
    title: 'Nova IDE License Agreement',
    type: 'Smart Contract',
    status: 'Active',
    parties: ['Aetherius OS', 'User'],
    effectiveDate: '2025-07-26',
    content: `SMART CONTRACT - EULA for Nova IDE

1. GRANT OF LICENSE: Aetherius OS ("Licensor") grants you ("Licensee") a non-exclusive, non-transferable license to use the Nova IDE software.
2. PAYMENT: Licensee agrees to a one-time payment of 29.99 Æ, transferred from Licensee's wallet to Licensor's wallet upon execution of this contract.
3. TERM: This license is perpetual.
4. RESTRICTIONS: Licensee shall not reverse engineer, decompile, or disassemble the software.
5. GOVERNING LAW: This contract is governed by the Aetherius OS Blockchain Governance Protocol.`,
  },
  {
    id: 'la-002',
    title: 'Partnership - QuantumLeap & SynthWave',
    type: 'Legal Agreement',
    status: 'Fulfilled',
    parties: ['QuantumLeap Robotics', 'SynthWave Audio'],
    effectiveDate: '2025-01-15',
    content: `LEGAL AGREEMENT

This agreement outlines a strategic partnership between QuantumLeap Robotics and SynthWave Audio for the co-development of an AI-driven music composition module for robotic platforms.

1. SCOPE: Joint research, development, and marketing of the "Choral" module.
2. REVENUE SHARE: Net profits from the "Choral" module will be split 60/40 between QuantumLeap Robotics and SynthWave Audio, respectively.
3. TERM: The agreement is valid for a period of five (5) years from the effective date.`,
  },
  {
    id: 'tos-001',
    title: 'Aetherius OS Terms of Service',
    type: 'Terms of Service',
    status: 'Active',
    parties: ['Aetherius OS', 'All Users'],
    effectiveDate: '2025-01-01',
    content: `TERMS OF SERVICE

Welcome to Aetherius OS. By using our services, you agree to these terms.

1. USER CONDUCT: You agree not to use the service for any illegal or unauthorized purpose.
2. INTELLECTUAL PROPERTY: All content created by you on the platform remains your property. By posting, you grant Aetherius OS a license to display and distribute it.
3. TERMINATION: We may terminate or suspend your account for violations of these terms.`,
  },
   {
    id: 'sc-002',
    title: 'NFT Sale - "Quantum Drift" Car Skin',
    type: 'Smart Contract',
    status: 'Voided',
    parties: ['User4', 'User2'],
    effectiveDate: '2025-06-10',
    content: `SMART CONTRACT - NFT ASSET TRANSFER

1. ASSET: This contract governs the transfer of the NFT "Quantum Drift Racer Skin #734".
2. TRANSFER: Upon execution, ownership of the asset will be transferred from wallet 0xUser4... to 0xUser2...
3. PAYMENT: A payment of 150 Æ will be transferred from 0xUser2... to 0xUser4...
4. STATUS: This transaction was voided due to insufficient funds.`,
  },
];

const mockAnalysis = `
### AI-Powered Analysis

**Key Clauses Identified:**
*   **Grant of License:** A non-exclusive, non-transferable right to use the software is granted. This means you can use it, but you cannot sell, share, or give your license to someone else.
*   **Payment:** A fixed, one-time payment is required. The transaction is atomic and executed on the blockchain with the contract.
*   **Restrictions:** You are legally prohibited from reverse engineering the software. This is a standard clause to protect intellectual property.

**Potential Risks:**
*   **Low Risk:** The terms are standard for a software End-User License Agreement (EULA). As it's a smart contract, the terms of payment and license grant are automatically enforced, reducing counterparty risk.

**Obligations:**
*   **Your Obligation:** To pay the 29.99 Æ fee.
*   **Aetherius OS's Obligation:** To provide you with access to the Nova IDE software upon successful payment.
`;

const getStatusConfig = (status: Contract['status']) => {
    switch (status) {
        case 'Active': return { icon: ClockIcon, color: 'text-blue-500' };
        case 'Fulfilled': return { icon: CheckCircleIcon, color: 'text-green-500' };
        case 'Voided': return { icon: XMarkIcon, color: 'text-red-500' };
        default: return { icon: DocumentTextIcon, color: 'text-gray-500' };
    }
}

export const ContractExplorer: React.FC = () => {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(mockContracts[0]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSelectContract = (contract: Contract) => {
      setSelectedContract(contract);
      setAnalysis(null);
      setIsAnalyzing(false);
  }

  const handleAnalyze = () => {
    if (!selectedContract) return;
    setIsAnalyzing(true);
    // Simulate Gemini API call
    setTimeout(() => {
        setAnalysis(mockAnalysis);
        setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="flex h-full animate-fade-in bg-gray-50 dark:bg-gray-900/50">
      {/* Sidebar */}
      <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col">
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <ScaleIcon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
            <h1 className="text-xl font-bold">Contract Explorer</h1>
        </header>
        <div className="flex-1 overflow-y-auto">
            {mockContracts.map(contract => {
                const StatusIcon = getStatusConfig(contract.status).icon;
                return (
                    <button 
                        key={contract.id}
                        onClick={() => handleSelectContract(contract)}
                        className={`w-full text-left p-3 border-b border-gray-200 dark:border-gray-700 ${selectedContract?.id === contract.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                    >
                        <p className="font-semibold text-sm truncate">{contract.title}</p>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{contract.type}</p>
                            <div className="flex items-center gap-1 text-xs">
                                <StatusIcon className={`w-4 h-4 ${getStatusConfig(contract.status).color}`} />
                                <span>{contract.status}</span>
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
      </aside>
      
      {/* Main Content */}
       <main className="flex-1 p-6 overflow-y-auto">
        {selectedContract ? (
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h2 className="text-3xl font-bold">{selectedContract.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Contract ID: {selectedContract.id}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 font-semibold">Status</p>
                        <p>{selectedContract.status}</p>
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 font-semibold">Effective Date</p>
                        <p>{selectedContract.effectiveDate}</p>
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 font-semibold">Parties Involved</p>
                        <p>{selectedContract.parties.join(', ')}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold mb-2">Contract Text</h3>
                    <pre className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md text-xs font-mono whitespace-pre-wrap">
                        <code>{selectedContract.content}</code>
                    </pre>
                </div>
                
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold mb-2 flex items-center gap-2"><HiveMindIcon className="w-5 h-5"/>AI Analysis</h3>
                    {!analysis && !isAnalyzing && (
                         <button onClick={handleAnalyze} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700">
                            Analyze with AI
                        </button>
                    )}
                    {isAnalyzing && (
                        <div className="text-center p-4">
                            <p className="animate-pulse">Analyzing document...</p>
                        </div>
                    )}
                    {analysis && (
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: analysis }} />
                    )}
                </div>
            </div>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a contract to view its details.</p>
            </div>
        )}
       </main>
    </div>
  );
};
